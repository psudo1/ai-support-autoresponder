import { openai, calculateCost, getDefaultModel } from './openaiClient';
import { getRelevantKnowledgeForTicket } from './knowledgeBaseService';
import { getTicketById } from './ticketService';
import { getAISettings } from './settingsService';
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
 * Build the prompt for AI response generation
 * Enhanced with better structure, examples, and clearer instructions
 */
function buildPrompt(
  ticket: { subject: string; initial_message: string; priority?: string; category?: string | null },
  knowledgeBase: Array<{ id: string; title: string; content: string }>,
  conversationHistory: string[],
  brandVoice: string
): string {
  // System message with role and guidelines
  let prompt = `You are an expert customer support agent with access to a comprehensive knowledge base. Your role is to provide accurate, helpful, and empathetic responses to customer inquiries.

## Your Guidelines:
- Respond in a ${brandVoice} tone
- Be clear, concise, and actionable
- Use knowledge base information when available and relevant
- Acknowledge limitations honestly when information is unavailable
- Show empathy and understanding
- Provide step-by-step instructions when applicable
- End with a clear next step or offer for additional help

## Customer Inquiry:
**Subject:** ${ticket.subject}
${ticket.priority ? `**Priority:** ${ticket.priority}` : ''}
${ticket.category ? `**Category:** ${ticket.category}` : ''}

**Message:**
${ticket.initial_message}
`;

  // Enhanced conversation history formatting
  if (conversationHistory.length > 0) {
    prompt += `\n## Conversation History:\n`;
    prompt += `The following is the conversation history for this ticket. Use this context to understand the full conversation flow and avoid repeating information.\n\n`;
    
    conversationHistory.forEach((msg, i) => {
      prompt += `[${i + 1}] ${msg}\n`;
    });
    
    prompt += `\n**Important:** Consider the full conversation context when responding. Reference previous messages when relevant, but avoid unnecessary repetition.\n`;
  }

  // Enhanced knowledge base presentation with relevance indicators
  if (knowledgeBase.length > 0) {
    prompt += `\n## Knowledge Base Information:\n`;
    prompt += `The following knowledge base articles may be relevant to this inquiry. Use them to provide accurate, detailed information. Cite specific articles when referencing them.\n\n`;
    
    knowledgeBase.forEach((kb, i) => {
      // Include more context (up to 800 chars) and indicate relevance
      const contentPreview = kb.content.length > 800 
        ? kb.content.substring(0, 800) + '...' 
        : kb.content;
      
      prompt += `### Article ${i + 1}: ${kb.title}\n`;
      prompt += `${contentPreview}\n\n`;
    });
    
    prompt += `**Note:** Prioritize information from the knowledge base. If the knowledge base doesn't contain relevant information, acknowledge this and provide general guidance.\n`;
  } else {
    prompt += `\n## Knowledge Base Information:\n`;
    prompt += `No specific knowledge base articles were found for this inquiry. Provide general guidance based on best practices.\n`;
  }

  // Enhanced response instructions with examples
  prompt += `\n## Response Requirements:\n`;
  prompt += `1. **Accuracy**: Only use information from the knowledge base or general best practices. Never invent specific details.\n`;
  prompt += `2. **Completeness**: Address all aspects of the customer's inquiry. If multiple questions are asked, answer each one.\n`;
  prompt += `3. **Actionability**: Provide clear, actionable steps when applicable. Use numbered lists for multi-step processes.\n`;
  prompt += `4. **Tone**: Maintain a ${brandVoice} tone throughout. Be professional yet warm and approachable.\n`;
  prompt += `5. **Structure**: Organize your response logically. Use paragraphs and formatting for readability.\n`;
  prompt += `6. **Next Steps**: Conclude with a clear next step, whether that's waiting for a response, taking action, or offering additional help.\n`;
  
  if (conversationHistory.length > 0) {
    prompt += `7. **Context Awareness**: Reference previous conversation when relevant, but don't repeat information unnecessarily.\n`;
  }

  prompt += `\n## Example Response Structure:\n`;
  prompt += `- Opening: Acknowledge the inquiry and show understanding\n`;
  prompt += `- Main Content: Provide detailed information, instructions, or solutions\n`;
  prompt += `- Closing: Summarize key points and offer next steps or additional assistance\n`;

  prompt += `\n---\n\nGenerate your response now. Be thorough, accurate, and helpful:\n`;

  return prompt;
}

/**
 * Calculate confidence score based on response characteristics
 * Enhanced with more sophisticated analysis including relevance, completeness, and knowledge base match quality
 */
function calculateConfidenceScore(
  response: string,
  knowledgeBaseUsed: number,
  responseLength: number,
  knowledgeBaseRelevance: number = 0.5, // How well KB matches the query (0-1)
  conversationContextUsed: boolean = false
): number {
  let score = 0.4; // Base score (slightly lower to allow for more nuanced scoring)

  // Knowledge base usage (weighted by relevance)
  if (knowledgeBaseUsed > 0) {
    // Higher score if KB was used AND it's relevant
    const kbScore = 0.25 * (1 + knowledgeBaseRelevance);
    score += Math.min(kbScore, 0.3); // Cap at 0.3
  } else {
    // Penalize if no KB was used (might indicate lack of specific information)
    score -= 0.1;
  }

  // Response completeness (length analysis)
  if (responseLength < 30) {
    // Too short - likely incomplete
    score -= 0.25;
  } else if (responseLength >= 30 && responseLength < 100) {
    // Short but acceptable
    score += 0.05;
  } else if (responseLength >= 100 && responseLength < 500) {
    // Good length - comprehensive but concise
    score += 0.15;
  } else if (responseLength >= 500 && responseLength < 1000) {
    // Very detailed
    score += 0.1;
  } else if (responseLength >= 1000) {
    // Possibly too verbose
    score += 0.05;
  }

  // Uncertainty indicators
  const uncertaintyPhrases = [
    "i'm not sure",
    "i don't know",
    "i'm unable to",
    "i cannot help",
    "unfortunately, i",
    "i don't have",
    "i'm not certain",
    "i'm not familiar",
  ];
  
  const lowerResponse = response.toLowerCase();
  const uncertaintyCount = uncertaintyPhrases.filter(phrase => 
    lowerResponse.includes(phrase)
  ).length;
  
  if (uncertaintyCount > 0) {
    score -= 0.1 * Math.min(uncertaintyCount, 3); // Cap penalty at 0.3
  }

  // Confidence indicators (positive signals)
  const confidencePhrases = [
    "here's how",
    "you can",
    "follow these steps",
    "the solution is",
    "to resolve this",
    "i recommend",
    "based on",
  ];
  
  const confidenceCount = confidencePhrases.filter(phrase =>
    lowerResponse.includes(phrase)
  ).length;
  
  if (confidenceCount > 0) {
    score += 0.05 * Math.min(confidenceCount, 3); // Cap bonus at 0.15
  }

  // Actionability (presence of actionable content)
  const actionableIndicators = [
    /\d+\./g, // Numbered lists
    /step \d+/gi,
    /click/i,
    /go to/i,
    /navigate/i,
    /select/i,
    /enter/i,
  ];
  
  const hasActionableContent = actionableIndicators.some(pattern => 
    pattern.test(response)
  );
  
  if (hasActionableContent) {
    score += 0.1;
  }

  // Structure quality (presence of formatting)
  const hasStructure = /\n\n/.test(response) || /^[-*•]/.test(response.split('\n').join(''));
  if (hasStructure) {
    score += 0.05;
  }

  // Conversation context usage
  if (conversationContextUsed) {
    score += 0.05; // Bonus for using conversation history
  }

  // Question answering completeness
  const questionMarks = (response.match(/\?/g) || []).length;
  if (questionMarks === 0 && responseLength > 50) {
    // No questions in response suggests it's a complete answer
    score += 0.05;
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

  // Enhanced context retrieval: combine ticket message and conversation history for better search
  const conversationHistory = input.conversation_history || [];
  const searchContext = conversationHistory.length > 0
    ? `${ticket.initial_message}\n\n${conversationHistory.slice(-3).join('\n')}` // Include last 3 messages
    : ticket.initial_message;

  // Get relevant knowledge base entries with enhanced search
  let knowledgeBase: Array<{ id: string; title: string; content: string }> = [];
  let knowledgeBaseRelevance = 0.5; // Default relevance score
  
  if (input.include_knowledge_base !== false) {
    const kbEntries = await getRelevantKnowledgeForTicket(
      searchContext, // Use enhanced context
      5
    );
    
    knowledgeBase = kbEntries.map(kb => ({
      id: kb.id,
      title: kb.title,
      content: kb.content,
    }));
    
    // Calculate relevance score based on how many KB entries were found and their quality
    if (knowledgeBase.length > 0) {
      // Higher relevance if we found multiple relevant entries
      knowledgeBaseRelevance = Math.min(0.5 + (knowledgeBase.length * 0.1), 1.0);
    } else {
      knowledgeBaseRelevance = 0.2; // Low relevance if no KB entries found
    }
  }

  // Build enhanced prompt with all context
  const prompt = buildPrompt(
    {
      subject: ticket.subject,
      initial_message: ticket.initial_message,
      priority: ticket.priority,
      category: ticket.category,
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

    // Calculate enhanced confidence score with all factors
    const confidenceScore = calculateConfidenceScore(
      response,
      knowledgeBase.length,
      response.length,
      knowledgeBaseRelevance,
      conversationHistory.length > 0
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

/**
 * Get all AI responses pending review
 */
export async function getPendingReviewResponses(
  filters?: {
    minConfidence?: number;
    maxConfidence?: number;
    ticketPriority?: string;
    limit?: number;
  }
): Promise<AIResponse[]> {
  let query = supabaseAdmin
    .from('ai_responses')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (filters?.minConfidence !== undefined) {
    query = query.gte('confidence_score', filters.minConfidence);
  }

  if (filters?.maxConfidence !== undefined) {
    query = query.lte('confidence_score', filters.maxConfidence);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pending review responses: ${error.message}`);
  }

  // If filtering by ticket priority, fetch tickets and filter
  if (filters?.ticketPriority && data) {
    const ticketIds = [...new Set(data.map(r => r.ticket_id))];
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('id, priority')
      .in('id', ticketIds)
      .eq('priority', filters.ticketPriority);
    
    const filteredTicketIds = new Set(tickets?.map(t => t.id) || []);
    return (data || []).filter(r => filteredTicketIds.has(r.ticket_id));
  }

  return data || [];
}

/**
 * Check if response should auto-send based on confidence threshold
 */
export async function shouldAutoSend(confidenceScore: number): Promise<boolean> {
  const settings = await getAISettings();
  return confidenceScore >= settings.auto_send_threshold;
}

/**
 * Check if response requires review based on confidence threshold
 */
export async function requiresReview(confidenceScore: number): Promise<boolean> {
  const settings = await getAISettings();
  return confidenceScore < settings.require_review_below;
}

/**
 * Update AI response text (for editing)
 */
export async function updateAIResponseText(
  id: string,
  responseText: string
): Promise<AIResponse> {
  const { data, error } = await supabaseAdmin
    .from('ai_responses')
    .update({ 
      response_text: responseText,
      status: 'edited'
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update AI response: ${error.message}`);
  }

  return data;
}

