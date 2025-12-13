import { supabaseAdmin } from './supabaseClient';
import type { Conversation, CreateConversationInput } from '../types';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get all conversations for a ticket
 */
export async function getConversationsByTicketId(
  ticketId: string
): Promise<Conversation[]> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch conversation: ${error.message}`);
  }

  return data;
}

/**
 * Create a new conversation message
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      ticket_id: input.ticket_id,
      message: input.message,
      sender_type: input.sender_type,
      sender_id: input.sender_id || null,
      ai_confidence: input.ai_confidence || null,
      is_ai_generated: input.is_ai_generated || false,
      requires_review: input.requires_review || false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data;
}

/**
 * Mark conversation as reviewed
 */
export async function markConversationAsReviewed(
  id: string,
  reviewedBy: string
): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .update({
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      requires_review: false,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark conversation as reviewed: ${error.message}`);
  }

  return data;
}

/**
 * Get conversation history as formatted text for AI prompts
 * Enhanced with better formatting and context awareness
 */
export async function getConversationHistoryForPrompt(
  ticketId: string
): Promise<string[]> {
  const conversations = await getConversationsByTicketId(ticketId);
  
  // Filter out the initial ticket message (it's already in the prompt)
  // Only include actual conversation exchanges
  const conversationExchanges = conversations.filter(conv => 
    conv.sender_type !== 'customer' || conv.message !== conversations[0]?.message
  );
  
  return conversationExchanges.map((conv, index) => {
    const sender = conv.sender_type === 'customer' 
      ? 'Customer' 
      : conv.sender_type === 'ai' 
      ? 'AI Assistant' 
      : 'Support Agent';
    
    // Add confidence indicator for AI responses
    let message = `${sender}: ${conv.message}`;
    
    if (conv.sender_type === 'ai' && conv.ai_confidence !== null) {
      const confidenceLabel = conv.ai_confidence >= 0.7 ? 'High' :
                             conv.ai_confidence >= 0.5 ? 'Medium' : 'Low';
      message += ` [Confidence: ${confidenceLabel}]`;
    }
    
    // Add review status if applicable
    if (conv.requires_review && conv.reviewed_by) {
      message += ` [Reviewed]`;
    }
    
    return message;
  });
}

