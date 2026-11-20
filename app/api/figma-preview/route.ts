import { NextResponse } from 'next/server';
import { getFigmaNodePreview } from '@/lib/figma';
import type { FigmaPreviewRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FigmaPreviewRequest;

    if (!body.figmaUrl?.trim()) {
      return NextResponse.json({ error: 'A Figma URL is required.' }, { status: 400 });
    }

    const result = await getFigmaNodePreview(body.figmaUrl);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error while fetching Figma preview.'
      },
      { status: 500 }
    );
  }
}
