'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AlertCircle, Figma, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { CodePanel } from '@/components/CodePanel';
import { SectionCard } from '@/components/SectionCard';
import { fileToDataUrl } from '@/lib/utils';
import type {
  FigmaPreviewResponse,
  FrameworkTarget,
  GenerationResponse
} from '@/lib/types';

const starterPrompts = [
  'Build a clean SaaS dashboard layout with accurate spacing and card hierarchy.',
  'Generate highly reusable React sections with accessible buttons and semantic markup.',
  'Keep the design visually close, but improve mobile responsiveness and spacing consistency.'
];

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<string>('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaPreview, setFigmaPreview] = useState<FigmaPreviewResponse | null>(null);
  const [target, setTarget] = useState<FrameworkTarget>('react-tailwind');
  const [notes, setNotes] = useState(starterPrompts[0]);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState('');

  const activeImage = useMemo(() => figmaPreview?.imageUrl || uploadedImageData, [figmaPreview, uploadedImageData]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    // Reset the input so choosing the same file again still fires onChange.
    event.target.value = '';
    setSelectedFile(file);
    setResult(null);
    setError('');
    setFigmaPreview(null);

    if (!file) {
      setUploadedImageData('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSelectedFile(null);
      setUploadedImageData('');
      setError('Please choose an image file (PNG or JPG).');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setUploadedImageData(dataUrl);
    } catch {
      setSelectedFile(null);
      setUploadedImageData('');
      setError('Could not read the selected file.');
    }
  }

  async function handleLoadFigma() {
    if (!figmaUrl.trim()) {
      setError('Paste a Figma URL first.');
      return;
    }

    setLoadingPreview(true);
    setError('');
    setResult(null);
    setUploadedImageData('');
    setSelectedFile(null);

    try {
      const response = await fetch('/api/figma-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load Figma preview.');
      }
      setFigmaPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Figma preview.');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleGenerate() {
    if (!activeImage) {
      setError('Upload a screenshot or load a Figma design first.');
      return;
    }

    setLoadingGenerate(true);
    setError('');

    try {
      const payload = {
        imageDataUrl: figmaPreview ? undefined : uploadedImageData,
        figmaImageUrl: figmaPreview?.imageUrl,
        figmaMetadata: figmaPreview || undefined,
        notes,
        target
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate code.');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate code.');
    } finally {
      setLoadingGenerate(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge>Next.js</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Figma API</Badge>
                <Badge>Vision AI</Badge>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                AI Design-to-Code Generator
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Upload a UI screenshot or fetch a Figma node preview, then generate production-style React or HTML/CSS code with responsive suggestions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loadingGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingGenerate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate code
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <SectionCard title="1. Upload a screenshot" description="Use any PNG or JPG UI screenshot as the visual input.">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-brand-400 hover:bg-brand-50/50">
                <ImageIcon className="mb-3 h-8 w-8 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Choose screenshot</span>
                <span className="mt-1 text-xs text-slate-500">PNG or JPG recommended</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              {selectedFile ? (
                <p className="mt-3 text-sm text-slate-600">Loaded file: {selectedFile.name}</p>
              ) : null}
            </SectionCard>

            <SectionCard title="2. Or load from Figma" description="Paste a Figma file URL that includes a node-id query parameter.">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Figma className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={figmaUrl}
                    onChange={(event) => setFigmaUrl(event.target.value)}
                    placeholder="https://www.figma.com/design/...?...&node-id=1%3A2"
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none ring-0 transition focus:border-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLoadFigma}
                  disabled={loadingPreview}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Figma className="h-4 w-4" />}
                  Load preview
                </button>
              </div>
              {figmaPreview ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">File:</span> {figmaPreview.fileName || 'Unknown file'}</p>
                  <p><span className="font-medium text-slate-900">Node:</span> {figmaPreview.nodeName || figmaPreview.nodeId}</p>
                  {figmaPreview.lastModified ? <p><span className="font-medium text-slate-900">Last modified:</span> {new Date(figmaPreview.lastModified).toLocaleString()}</p> : null}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="3. Configure output" description="Choose a target and give the AI any implementation guidance.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Output target
                  <select
                    value={target}
                    onChange={(event) => setTarget(event.target.value as FrameworkTarget)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-brand-500"
                  >
                    <option value="react-tailwind">React + Tailwind</option>
                    <option value="html-css">HTML + CSS</option>
                  </select>
                </label>
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-700">Prompt ideas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setNotes(prompt)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs transition hover:border-brand-400 hover:bg-brand-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
                AI instructions
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-brand-500"
                  placeholder="Describe coding preferences, component structure, or responsive expectations."
                />
              </label>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-6">
            <SectionCard title="Preview" description="The active image will be sent to the AI model.">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                {activeImage ? (
                  <div className="relative aspect-[16/10] w-full">
                    <Image src={activeImage} alt="Design preview" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center text-sm text-slate-500">
                    No image loaded yet.
                  </div>
                )}
              </div>
            </SectionCard>

            {result ? (
              <SectionCard title="Generation summary" description={result.summary || 'Generated output ready to review.'}>
                <div className="flex flex-wrap gap-2">
                  <Badge>{result.componentName}</Badge>
                  <Badge>{target === 'react-tailwind' ? 'React output' : 'HTML/CSS output'}</Badge>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Responsive suggestions</h3>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {result.responsiveSuggestions.map((item, index) => (
                        <li key={`${index}-${item}`}className="rounded-2xl bg-slate-50 px-3 py-2">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Assumptions</h3>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {result.assumptions.map((item, index) => (
                        <li key={`${index}-${item}`}className="rounded-2xl bg-slate-50 px-3 py-2">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>
        </div>

        {result ? (
          <div className="grid gap-6">
            <CodePanel title={`${result.componentName}.tsx`} code={result.jsx} language="tsx / jsx" />
            <CodePanel title={target === 'react-tailwind' ? 'optional.css' : 'styles.css'} code={result.css} language="css" />
          </div>
        ) : null}
      </div>
    </main>
  );
}
