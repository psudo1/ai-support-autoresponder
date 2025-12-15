import { supabaseAdmin } from './supabaseClient';
import type { 
  Ticket, 
  CreateTicketInput, 
  UpdateTicketInput,
  TicketStatus,
  TicketPriority 
} from '../types';
import type { AdvancedAIAnalysis } from '../types/advancedAI';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get all tickets with optional filters
 */
export async function getAllTickets(
  filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigned_to?: string;
    customer_email?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Ticket[]> {
  let query = supabaseAdmin
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  if (filters?.customer_email) {
    query = query.eq('customer_email', filters.customer_email);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get tickets: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get ticket: ${error.message}`);
  }

  return data;
}

/**
 * Get a ticket by ticket number
 */
export async function getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('ticket_number', ticketNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get ticket: ${error.message}`);
  }

  return data;
}

/**
 * Create a new ticket
 */
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert({
      subject: input.subject,
      initial_message: input.initial_message,
      customer_email: input.customer_email,
      customer_name: input.customer_name || null,
      priority: input.priority || 'medium',
      category: input.category || null,
      source: input.source || 'api',
      conversation_turn_count: 1,
      conversation_stage: 'initial',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return data;
}

/**
 * Update a ticket
 */
export async function updateTicket(
  id: string,
  input: UpdateTicketInput
): Promise<Ticket> {
  const updateData: any = {};

  if (input.subject !== undefined) updateData.subject = input.subject;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;
  if (input.resolved_at !== undefined) updateData.resolved_at = input.resolved_at;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ticket: ${error.message}`);
  }

  return data;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  id: string,
  status: TicketStatus
): Promise<Ticket> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'resolved' && !updateData.resolved_at) {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ticket status: ${error.message}`);
  }

  return data;
}

/**
 * Update ticket AI analysis data
 */
export async function updateTicketAIAnalysis(
  id: string,
  analysis: AdvancedAIAnalysis
): Promise<Ticket> {
  const updateData: any = {
    sentiment: analysis.sentiment.sentiment,
    sentiment_score: analysis.sentiment.score,
    urgency_level: analysis.urgency.level,
    urgency_score: analysis.urgency.score,
    intent_type: analysis.intent.intent,
    intent_confidence: analysis.intent.confidence,
    updated_at: new Date().toISOString(),
  };

  if (analysis.conversation_context) {
    updateData.conversation_turn_count = analysis.conversation_context.turn_count;
    updateData.conversation_stage = analysis.conversation_context.conversation_stage;
  }

  // Store additional metadata
  updateData.ai_analysis_metadata = {
    sentiment_confidence: analysis.sentiment.confidence,
    sentiment_emotions: analysis.sentiment.emotions || [],
    urgency_confidence: analysis.urgency.confidence,
    urgency_factors: analysis.urgency.factors || [],
    intent_sub_intents: analysis.intent.sub_intents || [],
    intent_entities: analysis.intent.entities || [],
    conversation_key_topics: analysis.conversation_context?.key_topics || [],
    conversation_unresolved_questions: analysis.conversation_context?.unresolved_questions || [],
    conversation_requires_follow_up: analysis.conversation_context?.requires_follow_up || false,
  };

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ticket AI analysis: ${error.message}`);
  }

  return data;
}

/**
 * Increment conversation turn count
 */
export async function incrementConversationTurn(ticketId: string): Promise<void> {
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const currentTurnCount = ticket.conversation_turn_count || 1;
  let conversationStage = ticket.conversation_stage || 'initial';

  // Update stage based on turn count
  if (currentTurnCount === 1) {
    conversationStage = 'initial';
  } else if (currentTurnCount <= 3) {
    conversationStage = 'clarification';
  } else if (currentTurnCount <= 5) {
    conversationStage = 'resolution';
  } else {
    conversationStage = 'follow_up';
  }

  const { error } = await supabaseAdmin
    .from('tickets')
    .update({
      conversation_turn_count: currentTurnCount + 1,
      conversation_stage: conversationStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);

  if (error) {
    throw new Error(`Failed to increment conversation turn: ${error.message}`);
  }
}

/**
 * Delete a ticket
 */
export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete ticket: ${error.message}`);
  }
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<{
  total: number;
  by_status: Record<TicketStatus, number>;
  by_priority: Record<TicketPriority, number>;
}> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('status, priority');

  if (error) {
    throw new Error(`Failed to get ticket stats: ${error.message}`);
  }

  const stats = {
    total: data.length,
    by_status: {
      new: 0,
      ai_responded: 0,
      human_review: 0,
      resolved: 0,
      escalated: 0,
      closed: 0,
    } as Record<TicketStatus, number>,
    by_priority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    } as Record<TicketPriority, number>,
  };

  data.forEach((ticket) => {
    if (ticket.status) {
      stats.by_status[ticket.status as TicketStatus] =
        (stats.by_status[ticket.status as TicketStatus] || 0) + 1;
    }
    if (ticket.priority) {
      stats.by_priority[ticket.priority as TicketPriority] =
        (stats.by_priority[ticket.priority as TicketPriority] || 0) + 1;
    }
  });

  return stats;
}
