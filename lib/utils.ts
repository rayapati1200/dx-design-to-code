export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function extractCodeBlock(source: string, label: string) {
  // Tolerate \r\n line endings, extra whitespace, or the block being on one line.
  const regex = new RegExp(`<<<${label}>>>\\s*([\\s\\S]*?)\\s*<<<END_${label}>>>`);
  const match = source.match(regex);
  return match?.[1]?.trim() ?? '';
}

/** Removes a surrounding ```lang ... ``` markdown fence if the model added one. */
export function stripCodeFences(code: string) {
  const match = code.match(/^```[\w-]*\s*\n([\s\S]*?)\n?```$/);
  return (match ? match[1] : code).trim();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function parseJsonSafe<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function extractFigmaFileAndNode(figmaUrl: string) {
  try {
    const url = new URL(figmaUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    const fileIndex = parts.findIndex((part) => part === 'file' || part === 'design');
    const fileKey = fileIndex >= 0 ? parts[fileIndex + 1] : '';
    const rawNodeId = url.searchParams.get('node-id') || url.searchParams.get('nodeId') || '';

    if (!fileKey || !rawNodeId) {
      throw new Error('Could not find file key or node-id in the Figma URL.');
    }

    // Figma share links use "1-2" while the REST API expects "1:2".
    const nodeId = decodeURIComponent(rawNodeId).replace(/-/g, ':');

    return { fileKey, nodeId };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('The provided Figma URL is invalid.');
    }
    throw error instanceof Error ? error : new Error('The provided Figma URL is invalid.');
  }
}
