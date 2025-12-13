import { NextRequest, NextResponse } from 'next/server';
import { getResponseTimeMetrics } from '@/lib/analyticsService';

/**
 * GET /api/analytics/response-time
 * Get response time metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    const metrics = await getResponseTimeMetrics(startDate, endDate);

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching response time metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

