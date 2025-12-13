import { NextRequest, NextResponse } from 'next/server';
import { fixTicketsWithAIResponses } from '@/lib/ticketService';

/**
 * POST /api/tickets/fix-status
 * Fix tickets that have AI responses but wrong status
 */
export async function POST(request: NextRequest) {
  try {
    const fixedCount = await fixTicketsWithAIResponses();

    return NextResponse.json(
      { 
        message: `Fixed ${fixedCount} ticket(s)`,
        fixed_count: fixedCount
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fixing ticket statuses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix ticket statuses' },
      { status: 500 }
    );
  }
}

