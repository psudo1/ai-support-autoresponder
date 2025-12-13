import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseById } from '@/lib/aiService';

/**
 * GET /api/ai-responses/[id]
 * Get a single AI response by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await getAIResponseById(id);

    if (!response) {
      return NextResponse.json(
        { error: 'AI response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch AI response' },
      { status: 500 }
    );
  }
}

