import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicket, deleteTicket } from '@/lib/ticketService';
import type { UpdateTicketInput } from '@/types';

/**
 * GET /api/tickets/[id]
 * Get a single ticket by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await getTicketById(id);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tickets/[id]
 * Update a ticket
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateTicketInput = await request.json();

    // Check if ticket exists
    const existingTicket = await getTicketById(id);
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const ticket = await updateTicket(id, body);

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tickets/[id]
 * Delete a ticket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if ticket exists
    const existingTicket = await getTicketById(id);
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    await deleteTicket(id);

    return NextResponse.json(
      { message: 'Ticket deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}

