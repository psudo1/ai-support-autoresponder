import { openai, calculateCost, getDefaultModel } from './openaiClient';
import { getRelevantKnowledgeForTicket } from './knowledgeBaseService';
import { getTicketById } from './ticketService';
import { supabaseAdmin } from './supabaseClient';
import type { 
  GenerateResponseInput, 
  GenerateResponseOutput,
  AIResponse,
  AISettings 
} from '../types';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get AI settings from database
 */
async function getAISettings(): Promise<AISettings> {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('value')
    .in('key', ['ai_model', 'ai_temperature', 'max_tokens', 'auto_send_threshold', 'require_review_below', 'brand_voice'])
    .single();

  // Default settings if not found
  const defaults: AISettings = {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000,
    auto_send_threshold: 0.8,
    require_review_below: 0.6,
    brand_voice: 'professional and helpful',
  };

  if (error || !data) {
    return defaults;
  }

  // Parse settings from JSONB
  const settings: Partial<AISettings> = {};
  
  // This is a simplified version - in production, you'd want to fetch each setting individually
  // or have a better settings structure
  return defaults;
}

/**
 * Build the prompt for AI response generation
 */
function buildPrompt(
  ticket: { subject: string; initial_message: string },
  knowledgeBase: Array<{ title: string; content: string }>,
  conversationHistory: string[],
  brandVoice: string
): string {
  let prompt = `You are a helpful customer support agent. Your task is to respond to customer support tickets in a ${brandVoice} manner.

Customer Ticket:
Subject: ${ticket.subject}
Message: ${ticket.initial_message}
`;

  if (conversationHistory.length > 0) {
    prompt += `\nConversation History:\n${conversationHistory.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}\n`;
  }

  if (knowledgeBase.length > 0) {
    prompt += `\nRelevant Knowledge Base Information:\n`;
    knowledgeBase.forEach((kb, i) => {
      prompt += `\n[${i + 1}] ${kb.title}\n${kb.content.substring(0, 500)}...\n`;
    });
  }

  prompt += `\nInstructions:
1. Provide a clear, helpful, and accurate response to the customer's inquiry
2. Use the knowledge base information when relevant
3. Be concise but thorough
4. If you don't have enough information, acknowledge this and suggest next steps
5. Maintain a ${brandVoice} tone throughout
6. Do not make up information that isn't in the knowledge base

Generate your response:`;

  return prompt;
}

/**
 * Calculate confidence score based on response characteristics
 * This is a simplified version - can be enhanced with more sophisticated analysis
 */
function calculateConfidenceScore(
  response: string,
  knowledgeBaseUsed: number,
  responseLength: number
): number {
  let score = 0.5; // Base score

  // Increase score if knowledge base was used
  if (knowledgeBaseUsed > 0) {
    score += 0.2;
  }

  // Increase score if response is of reasonable length
  if (responseLength > 50 && responseLength < 1000) {
    score += 0.1;
  }

  // Decrease score if response is too short (might be incomplete)
  if (responseLength < 30) {
    score -= 0.2;
  }

  // Decrease score if response contains uncertainty phrases
  const uncertaintyPhrases = [
    "i'm not sure",
    "i don't know",
    "i'm unable to",
    "i cannot",
    "unfortunately, i",
  ];
  const lowerResponse = response.toLowerCase();
  if (uncertaintyPhrases.some(phrase => lowerResponse.includes(phrase))) {
    score -= 0.1;
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate an AI response for a ticket
 */
export async function generateAIResponse(
  input: GenerateResponseInput
): Promise<GenerateResponseOutput> {
  // Get ticket
  const ticket = await getTicketById(input.ticket_id);
  if (!ticket) {
    throw new Error(`Ticket with id ${input.ticket_id} not found`);
  }

  // Get AI settings
  const settings = await getAISettings();

  // Get relevant knowledge base entries
  let knowledgeBase: Array<{ id: string; title: string; content: string }> = [];
  if (input.include_knowledge_base !== false) {
    const kbEntries = await getRelevantKnowledgeForTicket(
      ticket.initial_message,
      5
    );
    knowledgeBase = kbEntries.map(kb => ({
      id: kb.id,
      title: kb.title,
      content: kb.content,
    }));
  }

  // Get conversation history if provided
  const conversationHistory = input.conversation_history || [];

  // Build prompt
  const prompt = buildPrompt(
    {
      subject: ticket.subject,
      initial_message: ticket.initial_message,
    },
    knowledgeBase,
    conversationHistory,
    settings.brand_voice
  );

  // Generate response using OpenAI
  const model = input.model || settings.model;
  const temperature = input.temperature ?? settings.temperature;
  const maxTokens = input.max_tokens ?? settings.max_tokens;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful customer support agent. Provide clear, accurate, and helpful responses to customer inquiries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const response = completion.choices[0]?.message?.content || '';
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;

    // Calculate cost
    const cost = calculateCost(model, promptTokens, completionTokens);

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(
      response,
      knowledgeBase.length,
      response.length
    );

    return {
      response,
      confidence_score: confidenceScore,
      knowledge_sources: knowledgeBase.map(kb => kb.id),
      tokens_used: totalTokens,
      cost,
      model_used: model,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Save AI response to database
 */
export async function saveAIResponse(
  ticketId: string,
  output: GenerateResponseOutput,
  prompt: string,
  conversationId?: string | null
): Promise<AIResponse> {
  const { data, error } = await supabaseAdmin
    .from('ai_responses')
    .insert({
      ticket_id: ticketId,
      conversation_id: conversationId || null,
      prompt_used: prompt,
      model_used: output.model_used,
      tokens_used: output.tokens_used,
      cost: output.cost,
      confidence_score: output.confidence_score,
      knowledge_sources: output.knowledge_sources,
      response_text: output.response,
      status: 'pending_review',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save AI response: ${error.message}`);
  }

  return data;
}

/**
 * Update AI response status
 */
export async function updateAIResponseStatus(
  id: string,
  status: AIResponse['status']
): Promise<AIResponse> {
  const { data, error } = await supabaseAdmin
    .from('ai_responses')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update AI response status: ${error.message}`);
  }

  return data;
}

/**
 * Get AI response by ID
 */
export async function getAIResponseById(id: string): Promise<AIResponse | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_responses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch AI response: ${error.message}`);
  }

  return data;
}

/**
 * Get all AI responses for a ticket
 */
export async function getAIResponsesForTicket(
  ticketId: string
): Promise<AIResponse[]> {
  const { data, error } = await supabaseAdmin
    .from('ai_responses')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch AI responses: ${error.message}`);
  }

  return data || [];
}

