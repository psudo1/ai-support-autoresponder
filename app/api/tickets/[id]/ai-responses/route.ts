import { NextRequest, NextResponse } from 'next/server';
import { getAIResponsesForTicket } from '@/lib/aiService';

/**
 * GET /api/tickets/[id]/ai-responses
 * Get all AI responses for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responses = await getAIResponsesForTicket(id);

    return NextResponse.json({ responses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI responses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch AI responses' },
      { status: 500 }
    );
  }
}

