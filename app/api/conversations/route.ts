import { NextRequest, NextResponse } from 'next/server';
import { getConversationsByTicketId, createConversation } from '@/lib/conversationService';
import type { CreateConversationInput } from '@/types';

/**
 * GET /api/conversations
 * Get conversations for a ticket
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get('ticket_id');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ticket_id query parameter is required' },
        { status: 400 }
      );
    }

    const conversations = await getConversationsByTicketId(ticketId);

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Create a new conversation message
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationInput = await request.json();

    // Validate required fields
    if (!body.ticket_id || !body.message || !body.sender_type) {
      return NextResponse.json(
        { error: 'Missing required fields: ticket_id, message, sender_type' },
        { status: 400 }
      );
    }

    // Validate sender_type
    const validSenderTypes = ['customer', 'ai', 'human'];
    if (!validSenderTypes.includes(body.sender_type)) {
      return NextResponse.json(
        { error: 'Invalid sender_type. Must be one of: customer, ai, human' },
        { status: 400 }
      );
    }

    const conversation = await createConversation(body);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

