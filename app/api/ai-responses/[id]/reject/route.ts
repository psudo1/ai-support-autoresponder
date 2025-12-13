import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseById, updateAIResponseStatus } from '@/lib/aiService';

/**
 * POST /api/ai-responses/[id]/reject
 * Reject an AI response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Get AI response
    const aiResponse = await getAIResponseById(id);
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI response not found' },
        { status: 404 }
      );
    }

    // Update status to rejected
    const updatedResponse = await updateAIResponseStatus(id, 'rejected');

    return NextResponse.json(
      {
        ai_response: updatedResponse,
        reason: reason || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error rejecting AI response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject response' },
      { status: 500 }
    );
  }
}

