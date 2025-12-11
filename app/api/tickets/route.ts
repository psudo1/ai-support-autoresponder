import { NextRequest, NextResponse } from 'next/server';
import { getAllTickets, createTicket } from '@/lib/ticketService';
import type { CreateTicketInput } from '@/types';

/**
 * GET /api/tickets
 * Get all tickets with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      customer_email: searchParams.get('customer_email') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const tickets = await getAllTickets(filters);

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTicketInput = await request.json();

    // Validate required fields
    if (!body.subject || !body.initial_message || !body.customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, initial_message, customer_email' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const ticket = await createTicket(body);

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

