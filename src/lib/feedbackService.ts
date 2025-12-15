import { supabaseAdmin } from './supabaseClient';
import type { Feedback, CreateFeedbackInput, FeedbackStats } from '@/types/feedback';

/**
 * Create feedback for a conversation
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  // Validate rating
  const validRatings = [-1, 1, 2, 3, 4, 5];
  if (!validRatings.includes(input.rating)) {
    throw new Error('Invalid rating. Must be -1, 1, 2, 3, 4, or 5.');
  }

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .insert({
      conversation_id: input.conversation_id,
      rating: input.rating,
      feedback_text: input.feedback_text || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create feedback: ${error.message}`);
  }

  return data;
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(id: string): Promise<Feedback | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get feedback: ${error.message}`);
  }

  return data;
}

/**
 * Get feedback for a conversation
 */
export async function getFeedbackByConversationId(conversationId: string): Promise<Feedback[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get feedback: ${error.message}`);
  }

  return data || [];
}

/**
 * Get feedback for a ticket (all conversations)
 */
export async function getFeedbackByTicketId(ticketId: string): Promise<Feedback[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  // First get all conversation IDs for this ticket
  const { data: conversations, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('ticket_id', ticketId);

  if (convError) {
    throw new Error(`Failed to get conversations: ${convError.message}`);
  }

  if (!conversations || conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map(c => c.id);

  // Then get feedback for those conversations
  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get feedback: ${error.message}`);
  }

  return data || [];
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(options?: {
  ticketId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<FeedbackStats> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  let conversationIds: string[] | undefined;

  // Filter by ticket if provided
  if (options?.ticketId) {
    // Get conversation IDs for this ticket first
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('ticket_id', options.ticketId);
    
    if (convError) {
      throw new Error(`Failed to get conversations: ${convError.message}`);
    }
    
    if (conversations && conversations.length > 0) {
      conversationIds = conversations.map(c => c.id);
    } else {
      // No conversations, return empty stats
      return {
        total: 0,
        average_rating: 0,
        rating_distribution: [],
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0,
        with_text_count: 0,
        recent_feedback: [],
      };
    }
  }

  // Build query
  let query = supabaseAdmin
    .from('feedback')
    .select('*');

  if (conversationIds) {
    query = query.in('conversation_id', conversationIds);
  }

  // Filter by date range if provided
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get feedback stats: ${error.message}`);
  }

  const feedbacks = data || [];

  // Calculate statistics
  const total = feedbacks.length;
  const ratings = feedbacks.map(f => f.rating);
  const average_rating = total > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / total
    : 0;

  // Rating distribution
  const ratingCounts: Record<number, number> = {};
  ratings.forEach(rating => {
    ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
  });

  const rating_distribution = Object.entries(ratingCounts).map(([rating, count]) => ({
    rating: parseInt(rating),
    count,
  })).sort((a, b) => a.rating - b.rating);

  // Positive/negative/neutral counts
  // Positive: rating >= 4 (stars) or rating === 1 (thumbs up)
  const positive_count = feedbacks.filter(f => f.rating >= 4 || f.rating === 1).length;
  // Negative: rating === -1 (thumbs down) or rating <= 2 (stars, excluding 1 which is thumbs up)
  const negative_count = feedbacks.filter(f => f.rating === -1 || (f.rating <= 2 && f.rating !== 1)).length;
  // Neutral: rating === 3 (stars only)
  const neutral_count = feedbacks.filter(f => f.rating === 3).length;

  // Count feedback with text
  const with_text_count = feedbacks.filter(f => f.feedback_text && f.feedback_text.trim().length > 0).length;

  // Recent feedback (last 10)
  const recent_feedback = feedbacks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return {
    total,
    average_rating: Math.round(average_rating * 100) / 100, // Round to 2 decimal places
    rating_distribution,
    positive_count,
    negative_count,
    neutral_count,
    with_text_count,
    recent_feedback,
  };
}

/**
 * Get feedback analytics for AI responses
 * Correlates feedback with AI response quality
 */
export async function getAIResponseFeedbackAnalytics(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  total_responses_with_feedback: number;
  average_confidence_by_rating: {
    rating: number;
    average_confidence: number;
    count: number;
  }[];
  feedback_by_confidence_range: {
    range: string;
    positive_feedback_rate: number;
    total_feedback: number;
  }[];
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  // Get feedback with associated AI responses
  let query = supabaseAdmin
    .from('feedback')
    .select(`
      rating,
      conversations!inner(
        ai_confidence,
        ai_responses!inner(
          confidence_score
        )
      )
    `);

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get AI response feedback analytics: ${error.message}`);
  }

  const feedbacks = data || [];

  // Filter to only feedback with AI responses
  const feedbackWithAI = feedbacks.filter(f => 
    f.conversations?.ai_responses && f.conversations.ai_responses.length > 0
  );

  const total_responses_with_feedback = feedbackWithAI.length;

  // Group by rating and calculate average confidence
  const ratingGroups: Record<number, { confidences: number[] }> = {};
  
  feedbackWithAI.forEach(f => {
    const rating = f.rating;
    const confidence = f.conversations?.ai_responses?.[0]?.confidence_score || 
                      f.conversations?.ai_confidence || 0;
    
    if (!ratingGroups[rating]) {
      ratingGroups[rating] = { confidences: [] };
    }
    ratingGroups[rating].confidences.push(confidence);
  });

  const average_confidence_by_rating = Object.entries(ratingGroups).map(([rating, group]) => ({
    rating: parseInt(rating),
    average_confidence: group.confidences.reduce((sum, c) => sum + c, 0) / group.confidences.length,
    count: group.confidences.length,
  }));

  // Group by confidence ranges
  const confidenceRanges = [
    { min: 0, max: 0.5, label: '0-0.5' },
    { min: 0.5, max: 0.7, label: '0.5-0.7' },
    { min: 0.7, max: 0.9, label: '0.7-0.9' },
    { min: 0.9, max: 1.0, label: '0.9-1.0' },
  ];

  const feedback_by_confidence_range = confidenceRanges.map(range => {
    const inRange = feedbackWithAI.filter(f => {
      const confidence = f.conversations?.ai_responses?.[0]?.confidence_score || 
                        f.conversations?.ai_confidence || 0;
      return confidence >= range.min && confidence < range.max;
    });

    const positive = inRange.filter(f => f.rating >= 4 || f.rating === 1).length;
    const total = inRange.length;

    return {
      range: range.label,
      positive_feedback_rate: total > 0 ? (positive / total) * 100 : 0,
      total_feedback: total,
    };
  });

  return {
    total_responses_with_feedback,
    average_confidence_by_rating,
    feedback_by_confidence_range,
  };
}

