import { extractCodeBlock, parseJsonSafe, stripCodeFences } from './utils';
import { buildSystemPrompt } from './prompts';
import type { GenerationRequest, GenerationResponse } from './types';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.4';

function normalizeImageData(imageDataUrl: string) {
  const [prefix, base64] = imageDataUrl.split(',');
  const mimeTypeMatch = prefix.match(/data:(.*?);base64/);
  return {
    imageBase64: base64,
    mimeType: mimeTypeMatch?.[1] || 'image/png'
  };
}

export async function generateCodeFromDesign(
  payload: GenerationRequest,
  figmaMetadata?: Record<string, unknown>
): Promise<GenerationResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY. Add it to your .env.local file.');
  }

  if (payload.target !== 'react-tailwind' && payload.target !== 'html-css') {
    throw new Error('Invalid output target. Use "react-tailwind" or "html-css".');
  }

  if (!payload.imageDataUrl && !payload.figmaImageUrl) {
    throw new Error('Provide an uploaded image or a Figma node preview.');
  }

  const inputImage = payload.imageDataUrl
    ? (() => {
        const normalized = normalizeImageData(payload.imageDataUrl);
        return {
          type: 'input_image',
          image_url: `data:${normalized.mimeType};base64,${normalized.imageBase64}`
        };
      })()
    : {
        type: 'input_image',
        image_url: payload.figmaImageUrl as string
      };

  const extraContext = {
    notes: payload.notes || '',
    figmaMetadata: figmaMetadata || null,
    target: payload.target
  };

  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: buildSystemPrompt(payload.target) }]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Generate frontend code from this design. Extra context: ${JSON.stringify(extraContext)}`
            },
            inputImage
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${response.status} ${errorText}`);
  }

  // The raw Responses API does not include `output_text` (that is an SDK convenience),
  // so collect the text parts from the `output` array ourselves.
  const json = (await response.json()) as {
    output_text?: string;
    status?: string;
    incomplete_details?: { reason?: string } | null;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string; refusal?: string }>;
    }>;
  };

  const parts = (json.output ?? [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? []);
  const refusal = parts.find((part) => part.type === 'refusal')?.refusal;
  const outputText =
    json.output_text ||
    parts
      .filter((part) => part.type === 'output_text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n');

  if (!outputText) {
    if (refusal) {
      throw new Error(`The model refused the request: ${refusal}`);
    }
    const reason = json.incomplete_details?.reason;
    throw new Error(
      `The model returned no text output${reason ? ` (incomplete: ${reason})` : ''}.`
    );
  }
  const summary = extractCodeBlock(outputText, 'SUMMARY');
  const componentName = extractCodeBlock(outputText, 'COMPONENT_NAME') || 'GeneratedScreen';
  const jsx = stripCodeFences(extractCodeBlock(outputText, 'JSX'));
  const css = stripCodeFences(extractCodeBlock(outputText, 'CSS'));

  if (!jsx && !css) {
    throw new Error('The model response did not follow the expected format. Please try again.');
  }
  const suggestionsBlock = extractCodeBlock(outputText, 'RESPONSIVE_SUGGESTIONS');
  const assumptionsBlock = extractCodeBlock(outputText, 'ASSUMPTIONS');

  return {
    summary,
    componentName,
    jsx,
    css,
    responsiveSuggestions: suggestionsBlock
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter(Boolean),
    assumptions: assumptionsBlock
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter(Boolean),
    figmaMetadata
  };
}

export function maybeParseJson<T>(value: string): T | null {
  return parseJsonSafe<T>(value);
}
