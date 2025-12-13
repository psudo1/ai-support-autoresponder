import { NextRequest, NextResponse } from 'next/server';
import { getPendingReviewResponses } from '@/lib/aiService';

/**
 * GET /api/ai-responses
 * Get AI responses pending review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minConfidence = searchParams.get('min_confidence') 
      ? parseFloat(searchParams.get('min_confidence')!) 
      : undefined;
    const maxConfidence = searchParams.get('max_confidence')
      ? parseFloat(searchParams.get('max_confidence')!)
      : undefined;
    const ticketPriority = searchParams.get('priority') || undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined;

    const responses = await getPendingReviewResponses({
      minConfidence,
      maxConfidence,
      ticketPriority,
      limit,
    });

    return NextResponse.json({ responses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending review responses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

