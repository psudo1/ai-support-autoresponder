import { NextRequest, NextResponse } from 'next/server';
import { getTicketStatusAnalytics } from '@/lib/analyticsService';

/**
 * GET /api/analytics/ticket-status
 * Get ticket status analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    const analytics = await getTicketStatusAnalytics(startDate, endDate);

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket status analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

