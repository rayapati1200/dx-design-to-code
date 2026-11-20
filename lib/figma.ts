import { extractFigmaFileAndNode } from './utils';
import type { FigmaPreviewResponse } from './types';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_BASE_URL = 'https://api.figma.com/v1';

async function figmaRequest<T>(path: string): Promise<T> {
  if (!FIGMA_TOKEN) {
    throw new Error('Missing FIGMA_ACCESS_TOKEN. Add it to your .env.local file.');
  }

  const response = await fetch(`${FIGMA_BASE_URL}${path}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Figma request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

interface FigmaImagesResponse {
  images: Record<string, string>;
}

interface FigmaFileResponse {
  name?: string;
  thumbnailUrl?: string;
  lastModified?: string;
  nodes?: Record<string, { document?: { name?: string } }>;
}

export async function getFigmaNodePreview(figmaUrl: string): Promise<FigmaPreviewResponse> {
  const { fileKey, nodeId } = extractFigmaFileAndNode(figmaUrl);

  const [images, file] = await Promise.all([
    figmaRequest<FigmaImagesResponse>(
      `/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`
    ),
    figmaRequest<FigmaFileResponse>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`)
  ]);

  const imageUrl = images.images[nodeId];
  if (!imageUrl) {
    throw new Error('Could not generate a preview image for this Figma node.');
  }

  return {
    imageUrl,
    fileKey,
    nodeId,
    fileName: file.name,
    nodeName: file.nodes?.[nodeId]?.document?.name,
    lastModified: file.lastModified,
    thumbnailUrl: file.thumbnailUrl
  };
}
