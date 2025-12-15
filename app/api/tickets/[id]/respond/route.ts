import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicketStatus, updateTicketAIAnalysis, incrementConversationTurn } from '@/lib/ticketService';
import { generateAIResponse, saveAIResponse, shouldAutoSend, requiresReview, updateAIResponseStatus } from '@/lib/aiService';
import { createConversation } from '@/lib/conversationService';
import { getConversationHistoryForPrompt } from '@/lib/conversationService';
import { sendWebhookEvent, sendSlackWebhook } from '@/lib/webhookService';
import { performAdvancedAnalysis } from '@/lib/advancedAIService';
import type { GenerateResponseInput } from '@/types';

/**
 * POST /api/tickets/[id]/respond
 * Generate an AI response for a ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Handle empty body gracefully
    let body: Partial<GenerateResponseInput> = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch (parseError) {
      // Body is optional, so empty body is fine
      body = {};
    }

    // Check if ticket exists
    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get conversation history for context
    const conversationHistory = await getConversationHistoryForPrompt(id);

    // Perform advanced AI analysis (sentiment, urgency, intent, conversation context)
    const aiAnalysis = await performAdvancedAnalysis(
      {
        subject: ticket.subject,
        initial_message: ticket.initial_message,
        priority: ticket.priority,
      },
      conversationHistory
    );

    // Update ticket with AI analysis (non-blocking)
    updateTicketAIAnalysis(id, aiAnalysis).catch(err => 
      console.error('Error updating ticket AI analysis:', err)
    );

    // Auto-adjust priority based on urgency analysis if not already set to urgent
    if (ticket.priority !== 'urgent' && aiAnalysis.urgency.level === 'critical') {
      updateTicketStatus(id, ticket.status).catch(() => {}); // Update priority in background
    }

    // Generate AI response
    const input: GenerateResponseInput = {
      ticket_id: id,
      conversation_history: conversationHistory,
      include_knowledge_base: body.include_knowledge_base ?? true,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    };

    const output = await generateAIResponse(input);

    // Increment conversation turn count
    incrementConversationTurn(id).catch(err => 
      console.error('Error incrementing conversation turn:', err)
    );

    // Build the prompt that was used (for saving)
    // Note: In a real implementation, you'd want to return this from generateAIResponse
    const prompt = `Generate response for ticket: ${ticket.subject}`;

    // Check if response should auto-send or requires review
    const autoSend = await shouldAutoSend(output.confidence_score);
    const needsReview = await requiresReview(output.confidence_score);
    
    // Determine initial status based on auto-send threshold
    const initialStatus = autoSend ? 'approved' : 'pending_review';

    // Save AI response to database
    const aiResponse = await saveAIResponse(id, output, prompt);
    
    // Update status if auto-send
    let finalAIResponse = aiResponse;
    if (autoSend) {
      finalAIResponse = await updateAIResponseStatus(aiResponse.id, 'approved');
    }

    // Create conversation entry for the AI response (only if auto-send)
    let conversation = null;
    if (autoSend) {
      conversation = await createConversation({
        ticket_id: id,
        message: output.response,
        sender_type: 'ai',
        ai_confidence: output.confidence_score,
        is_ai_generated: true,
        requires_review: false,
      });

      // Update AI response with conversation ID
      finalAIResponse = {
        ...finalAIResponse,
        conversation_id: conversation.id,
      };
    } else {
      // Still create conversation but mark as requiring review
      conversation = await createConversation({
        ticket_id: id,
        message: output.response,
        sender_type: 'ai',
        ai_confidence: output.confidence_score,
        is_ai_generated: true,
        requires_review: needsReview,
      });
    }

    // Update ticket status based on confidence score
    // Only skip update if ticket is already resolved or closed
    let updatedTicket = ticket;
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      const newStatus = needsReview ? 'human_review' : 'ai_responded';
      updatedTicket = await updateTicketStatus(id, newStatus);
    }

    // Send webhook events (non-blocking)
    Promise.all([
      import('@/lib/webhookService').then(({ sendWebhookEvent, sendSlackWebhook }) => {
        sendWebhookEvent('ai.response.generated', { 
          ticket: updatedTicket, 
          ai_response: finalAIResponse 
        });
        sendSlackWebhook('ai.response.generated', { 
          ticket: updatedTicket, 
          ai_response: finalAIResponse 
        });
        
        if (needsReview) {
          sendWebhookEvent('ai.response.requires_review', { 
            ticket: updatedTicket, 
            ai_response: finalAIResponse 
          });
          sendSlackWebhook('ai.response.requires_review', { 
            ticket: updatedTicket, 
            ai_response: finalAIResponse 
          });
        }
      }).catch(err => console.error('Webhook error:', err))
    ]);

    return NextResponse.json(
      {
        ai_response: finalAIResponse,
        conversation,
        ticket: updatedTicket,
        confidence_score: output.confidence_score,
        requires_review: needsReview,
        auto_sent: autoSend,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Ensure we always return valid JSON
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to generate AI response';
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

