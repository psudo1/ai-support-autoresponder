import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicketStatus } from '@/lib/ticketService';
import { generateAIResponse, saveAIResponse } from '@/lib/aiService';
import { createConversation } from '@/lib/conversationService';
import { getConversationHistoryForPrompt } from '@/lib/conversationService';
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

    // Build the prompt that was used (for saving)
    // Note: In a real implementation, you'd want to return this from generateAIResponse
    const prompt = `Generate response for ticket: ${ticket.subject}`;

    // Save AI response to database
    const aiResponse = await saveAIResponse(id, output, prompt);

    // Create conversation entry for the AI response
    const conversation = await createConversation({
      ticket_id: id,
      message: output.response,
      sender_type: 'ai',
      ai_confidence: output.confidence_score,
      is_ai_generated: true,
      requires_review: output.confidence_score < 0.6, // Require review if confidence is low
    });

    // Update AI response with conversation ID
    const updatedAIResponse = {
      ...aiResponse,
      conversation_id: conversation.id,
    };

    // Update ticket status based on confidence score
    // Only skip update if ticket is already resolved or closed
    let updatedTicket = ticket;
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      const newStatus = output.confidence_score < 0.6 ? 'human_review' : 'ai_responded';
      updatedTicket = await updateTicketStatus(id, newStatus);
    }

    return NextResponse.json(
      {
        ai_response: updatedAIResponse,
        conversation,
        ticket: updatedTicket,
        confidence_score: output.confidence_score,
        requires_review: conversation.requires_review,
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

