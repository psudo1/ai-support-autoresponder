import { NextRequest, NextResponse } from 'next/server';
import { getTicketById } from '@/lib/ticketService';
import { performAdvancedAnalysis } from '@/lib/advancedAIService';
import { getConversationHistoryForPrompt } from '@/lib/conversationService';
import { updateTicketAIAnalysis } from '@/lib/ticketService';

/**
 * POST /api/tickets/[id]/analyze
 * Perform advanced AI analysis on a ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if ticket exists
    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get conversation history
    const conversationHistory = await getConversationHistoryForPrompt(id);

    // Perform analysis
    const analysis = await performAdvancedAnalysis(
      {
        subject: ticket.subject,
        initial_message: ticket.initial_message,
        priority: ticket.priority,
      },
      conversationHistory
    );

    // Update ticket with analysis
    const updatedTicket = await updateTicketAIAnalysis(id, analysis);

    return NextResponse.json({
      analysis,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error performing AI analysis:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to perform AI analysis',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets/[id]/analyze
 * Get existing AI analysis for a ticket
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

    // Reconstruct analysis from ticket data
    const analysis = {
      sentiment: {
        sentiment: ticket.sentiment || 'neutral',
        confidence: ticket.ai_analysis_metadata?.sentiment_confidence || 0.5,
        score: ticket.sentiment_score || 0,
        emotions: ticket.ai_analysis_metadata?.sentiment_emotions || [],
      },
      urgency: {
        level: ticket.urgency_level || 'medium',
        confidence: ticket.ai_analysis_metadata?.urgency_confidence || 0.5,
        factors: ticket.ai_analysis_metadata?.urgency_factors || [],
        score: ticket.urgency_score || 0.5,
      },
      intent: {
        intent: ticket.intent_type || 'other',
        confidence: ticket.intent_confidence || 0.5,
        sub_intents: ticket.ai_analysis_metadata?.intent_sub_intents || [],
        entities: ticket.ai_analysis_metadata?.intent_entities || [],
      },
      conversation_context: ticket.conversation_turn_count ? {
        turn_count: ticket.conversation_turn_count,
        requires_follow_up: ticket.ai_analysis_metadata?.conversation_requires_follow_up || false,
        conversation_stage: ticket.conversation_stage || 'initial',
        key_topics: ticket.ai_analysis_metadata?.conversation_key_topics || [],
        unresolved_questions: ticket.ai_analysis_metadata?.conversation_unresolved_questions || [],
      } : undefined,
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get AI analysis',
      },
      { status: 500 }
    );
  }
}

