import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseById, updateAIResponseStatus } from '@/lib/aiService';
import { getTicketById, updateTicketStatus } from '@/lib/ticketService';
import { createConversation, markConversationAsReviewed } from '@/lib/conversationService';
import { sendWebhookEvent, sendSlackWebhook } from '@/lib/webhookService';
import { sendTicketResponseEmail } from '@/lib/emailService';
import { getIntegrationSettings } from '@/lib/settingsService';

/**
 * POST /api/ai-responses/[id]/approve
 * Approve an AI response and optionally send it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { send = true, reviewedBy } = body;

    // Get AI response
    const aiResponse = await getAIResponseById(id);
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI response not found' },
        { status: 404 }
      );
    }

    // Update status to approved
    const updatedResponse = await updateAIResponseStatus(id, 'approved');

    // If sending, create conversation entry
    let conversation = null;
    if (send) {
      // Check if conversation already exists
      if (aiResponse.conversation_id) {
        conversation = await markConversationAsReviewed(
          aiResponse.conversation_id,
          reviewedBy || 'system'
        );
      } else {
        // Create new conversation entry
        conversation = await createConversation({
          ticket_id: aiResponse.ticket_id,
          message: aiResponse.response_text,
          sender_type: 'ai',
          ai_confidence: aiResponse.confidence_score,
          is_ai_generated: true,
          requires_review: false,
        });

        // Update AI response with conversation ID
        await updateAIResponseStatus(id, 'approved');
      }

      // Update ticket status
      const ticket = await getTicketById(aiResponse.ticket_id);
      if (ticket && ticket.status !== 'resolved' && ticket.status !== 'closed') {
        await updateTicketStatus(
          aiResponse.ticket_id,
          ticket.status === 'human_review' ? 'ai_responded' : ticket.status
        );
      }

      // Mark as sent
      await updateAIResponseStatus(id, 'sent');
      
      // Get final response for webhook
      const finalResponse = await getAIResponseById(id);
      
      // Send email response if email integration is enabled
      if (ticket && ticket.customer_email) {
        try {
          const settings = await getIntegrationSettings();
          if (settings.email_enabled) {
            await sendTicketResponseEmail(
              ticket.id,
              ticket.ticket_number,
              ticket.customer_email,
              ticket.customer_name,
              aiResponse.response_text,
              true // isReply
            );
          }
        } catch (error) {
          console.error('Error sending email response:', error);
          // Don't fail if email fails
        }
      }
      
      // Send webhook events (non-blocking)
      Promise.all([
        sendWebhookEvent('ai.response.approved', { 
          ticket, 
          ai_response: finalResponse 
        }),
        sendSlackWebhook('ai.response.approved', { 
          ticket, 
          ai_response: finalResponse 
        })
      ]).catch(err => console.error('Webhook error:', err));
    }

    return NextResponse.json(
      {
        ai_response: updatedResponse,
        conversation,
        sent: send,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error approving AI response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve response' },
      { status: 500 }
    );
  }
}

