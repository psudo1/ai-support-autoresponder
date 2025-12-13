import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseById, updateAIResponseStatus } from '@/lib/aiService';
import { getTicketById, updateTicketStatus } from '@/lib/ticketService';
import { createConversation, markConversationAsReviewed } from '@/lib/conversationService';

/**
 * POST /api/ai-responses/[id]/send
 * Send an approved/edited AI response to the customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reviewedBy } = body;

    // Get AI response
    const aiResponse = await getAIResponseById(id);
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI response not found' },
        { status: 404 }
      );
    }

    // Check if response is approved or edited
    if (aiResponse.status !== 'approved' && aiResponse.status !== 'edited') {
      return NextResponse.json(
        { error: 'Response must be approved or edited before sending' },
        { status: 400 }
      );
    }

    // Create or update conversation entry
    let conversation = null;
    if (aiResponse.conversation_id) {
      conversation = await markConversationAsReviewed(
        aiResponse.conversation_id,
        reviewedBy || 'system'
      );
    } else {
      conversation = await createConversation({
        ticket_id: aiResponse.ticket_id,
        message: aiResponse.response_text,
        sender_type: 'ai',
        ai_confidence: aiResponse.confidence_score,
        is_ai_generated: true,
        requires_review: false,
      });
    }

    // Update status to sent
    const updatedResponse = await updateAIResponseStatus(id, 'sent');

    // Update ticket status
    const ticket = await getTicketById(aiResponse.ticket_id);
    if (ticket && ticket.status !== 'resolved' && ticket.status !== 'closed') {
      await updateTicketStatus(
        aiResponse.ticket_id,
        ticket.status === 'human_review' ? 'ai_responded' : ticket.status
      );
    }

    return NextResponse.json(
      {
        ai_response: updatedResponse,
        conversation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending AI response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send response' },
      { status: 500 }
    );
  }
}

