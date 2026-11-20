export type FrameworkTarget = 'react-tailwind' | 'html-css';

export interface GenerationRequest {
  imageDataUrl?: string;
  figmaImageUrl?: string;
  notes?: string;
  target: FrameworkTarget;
}

export interface GenerationResponse {
  summary: string;
  componentName: string;
  jsx: string;
  css: string;
  responsiveSuggestions: string[];
  assumptions: string[];
  figmaMetadata?: Record<string, unknown>;
}

export interface FigmaPreviewRequest {
  figmaUrl: string;
}

export interface FigmaPreviewResponse {
  imageUrl: string;
  fileKey: string;
  nodeId: string;
  fileName?: string;
  nodeName?: string;
  lastModified?: string;
  thumbnailUrl?: string;
}
