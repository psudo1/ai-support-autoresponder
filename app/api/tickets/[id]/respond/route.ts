import { NextRequest, NextResponse } from 'next/server';
import { getTicketById } from '@/lib/ticketService';
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
    const body: Partial<GenerateResponseInput> = await request.json();

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

    return NextResponse.json(
      {
        ai_response: updatedAIResponse,
        conversation,
        confidence_score: output.confidence_score,
        requires_review: conversation.requires_review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}

