import { NextResponse } from 'next/server';
import { generateCodeFromDesign } from '@/lib/openai';
import type { GenerationRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerationRequest & {
      figmaMetadata?: Record<string, unknown>;
    };

    const result = await generateCodeFromDesign(body, body.figmaMetadata);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error while generating code.'
      },
      { status: 500 }
    );
  }
}
