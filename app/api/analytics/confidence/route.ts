import { NextRequest, NextResponse } from 'next/server';
import { getConfidenceDistribution } from '@/lib/analyticsService';

/**
 * GET /api/analytics/confidence
 * Get AI confidence distribution
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    const distribution = await getConfidenceDistribution(startDate, endDate);

    return NextResponse.json({ distribution }, { status: 200 });
  } catch (error) {
    console.error('Error fetching confidence distribution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch distribution' },
      { status: 500 }
    );
  }
}

