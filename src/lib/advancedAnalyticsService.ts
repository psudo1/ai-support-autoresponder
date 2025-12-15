import { supabaseAdmin } from './supabaseClient';
import type { TicketStatus } from '../types/ticket';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

export interface CustomerSatisfactionMetrics {
  csat_score: number; // Customer Satisfaction Score (0-100)
  nps_score: number; // Net Promoter Score (-100 to 100)
  response_rate: number; // Percentage of tickets with feedback
  satisfaction_by_rating: Array<{ rating: number; count: number; percentage: number }>;
  satisfaction_over_time: Array<{ date: string; csat: number; nps: number; response_count: number }>;
  total_responses: number;
}

export interface EscalationMetrics {
  total_escalated: number;
  escalation_rate: number; // Percentage of tickets escalated
  escalation_by_priority: Array<{ priority: string; escalated: number; total: number; rate: number }>;
  escalation_by_category: Array<{ category: string; escalated: number; total: number; rate: number }>;
  escalation_over_time: Array<{ date: string; escalated: number; total: number; rate: number }>;
  average_time_to_escalation: number; // in hours
  escalation_reasons: Array<{ reason: string; count: number }>; // Based on ticket status transitions
}

export interface ResponseQualityTrends {
  average_confidence_over_time: Array<{ date: string; confidence: number; response_count: number }>;
  average_rating_over_time: Array<{ date: string; rating: number; feedback_count: number }>;
  quality_score_over_time: Array<{ date: string; quality_score: number; response_count: number }>;
  confidence_vs_satisfaction: Array<{ confidence_range: string; average_rating: number; count: number }>;
  first_response_quality: {
    average_confidence: number;
    average_rating: number;
    total_responses: number;
  };
}

/**
 * Calculate Customer Satisfaction (CSAT) and Net Promoter Score (NPS)
 */
export async function getCustomerSatisfactionMetrics(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<CustomerSatisfactionMetrics> {
  // Get feedback data
  const { getFeedbackStats } = await import('./feedbackService');
  const feedbackStats = await getFeedbackStats({
    startDate: options?.startDate,
    endDate: options?.endDate,
  });

  // Get total tickets in the period
  let ticketQuery = supabaseAdmin.from('tickets').select('id, created_at', { count: 'exact' });
  
  if (options?.startDate) {
    ticketQuery = ticketQuery.gte('created_at', options.startDate.toISOString());
  }
  if (options?.endDate) {
    ticketQuery = ticketQuery.lte('created_at', options.endDate.toISOString());
  }

  const { count: totalTickets } = await ticketQuery;

  // Calculate CSAT (percentage of ratings >= 4)
  const csat_score = feedbackStats.total > 0
    ? (feedbackStats.positive_count / feedbackStats.total) * 100
    : 0;

  // Calculate NPS
  // Promoters: rating >= 4 or rating === 1 (thumbs up)
  // Detractors: rating === -1 (thumbs down) or rating <= 2 (excluding 1)
  // Passives: rating === 3
  const promoters = feedbackStats.positive_count;
  const detractors = feedbackStats.negative_count;
  const nps_score = feedbackStats.total > 0
    ? ((promoters - detractors) / feedbackStats.total) * 100
    : 0;

  // Response rate
  const response_rate = totalTickets && totalTickets > 0
    ? (feedbackStats.total / totalTickets) * 100
    : 0;

  // Satisfaction by rating
  const satisfaction_by_rating = feedbackStats.rating_distribution.map(item => ({
    rating: item.rating,
    count: item.count,
    percentage: feedbackStats.total > 0
      ? (item.count / feedbackStats.total) * 100
      : 0,
  }));

  // Satisfaction over time
  const satisfactionOverTimeMap = new Map<string, { ratings: number[]; count: number }>();
  
  feedbackStats.recent_feedback.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    const existing = satisfactionOverTimeMap.get(date) || { ratings: [], count: 0 };
    existing.ratings.push(item.rating);
    existing.count += 1;
    satisfactionOverTimeMap.set(date, existing);
  });

  const satisfaction_over_time = Array.from(satisfactionOverTimeMap.entries())
    .map(([date, data]) => {
      const positive = data.ratings.filter(r => r >= 4 || r === 1).length;
      const negative = data.ratings.filter(r => r === -1 || (r <= 2 && r !== 1)).length;
      const csat = data.ratings.length > 0 ? (positive / data.ratings.length) * 100 : 0;
      const nps = data.ratings.length > 0 ? ((positive - negative) / data.ratings.length) * 100 : 0;
      
      return {
        date,
        csat: Math.round(csat * 100) / 100,
        nps: Math.round(nps * 100) / 100,
        response_count: data.count,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    csat_score: Math.round(csat_score * 100) / 100,
    nps_score: Math.round(nps_score * 100) / 100,
    response_rate: Math.round(response_rate * 100) / 100,
    satisfaction_by_rating,
    satisfaction_over_time,
    total_responses: feedbackStats.total,
  };
}

/**
 * Calculate escalation metrics
 */
export async function getEscalationMetrics(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<EscalationMetrics> {
  let ticketQuery = supabaseAdmin
    .from('tickets')
    .select('id, status, priority, category, created_at, updated_at');

  if (options?.startDate) {
    ticketQuery = ticketQuery.gte('created_at', options.startDate.toISOString());
  }
  if (options?.endDate) {
    ticketQuery = ticketQuery.lte('created_at', options.endDate.toISOString());
  }

  const { data: tickets, error } = await ticketQuery;

  if (error) {
    throw new Error(`Failed to get escalation metrics: ${error.message}`);
  }

  const allTickets = tickets || [];
  const escalatedTickets = allTickets.filter(t => t.status === 'escalated');
  const total_escalated = escalatedTickets.length;
  const escalation_rate = allTickets.length > 0
    ? (total_escalated / allTickets.length) * 100
    : 0;

  // Escalation by priority
  const priorityMap = new Map<string, { escalated: number; total: number }>();
  allTickets.forEach(ticket => {
    const priority = ticket.priority || 'medium';
    const existing = priorityMap.get(priority) || { escalated: 0, total: 0 };
    existing.total += 1;
    if (ticket.status === 'escalated') {
      existing.escalated += 1;
    }
    priorityMap.set(priority, existing);
  });

  const escalation_by_priority = Array.from(priorityMap.entries())
    .map(([priority, data]) => ({
      priority,
      escalated: data.escalated,
      total: data.total,
      rate: data.total > 0 ? (data.escalated / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Escalation by category
  const categoryMap = new Map<string, { escalated: number; total: number }>();
  allTickets.forEach(ticket => {
    const category = ticket.category || 'uncategorized';
    const existing = categoryMap.get(category) || { escalated: 0, total: 0 };
    existing.total += 1;
    if (ticket.status === 'escalated') {
      existing.escalated += 1;
    }
    categoryMap.set(category, existing);
  });

  const escalation_by_category = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      escalated: data.escalated,
      total: data.total,
      rate: data.total > 0 ? (data.escalated / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Escalation over time
  const escalationOverTimeMap = new Map<string, { escalated: number; total: number }>();
  allTickets.forEach(ticket => {
    const date = new Date(ticket.created_at).toISOString().split('T')[0];
    const existing = escalationOverTimeMap.get(date) || { escalated: 0, total: 0 };
    existing.total += 1;
    if (ticket.status === 'escalated') {
      existing.escalated += 1;
    }
    escalationOverTimeMap.set(date, existing);
  });

  const escalation_over_time = Array.from(escalationOverTimeMap.entries())
    .map(([date, data]) => ({
      date,
      escalated: data.escalated,
      total: data.total,
      rate: data.total > 0 ? (data.escalated / data.total) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Average time to escalation (for escalated tickets)
  let totalHoursToEscalation = 0;
  let escalatedCount = 0;
  
  escalatedTickets.forEach(ticket => {
    const created = new Date(ticket.created_at);
    const updated = new Date(ticket.updated_at);
    const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
    if (hours > 0) {
      totalHoursToEscalation += hours;
      escalatedCount += 1;
    }
  });

  const average_time_to_escalation = escalatedCount > 0
    ? totalHoursToEscalation / escalatedCount
    : 0;

  // Escalation reasons (simplified - based on status transitions)
  // In a real system, you'd track explicit escalation reasons
  const escalation_reasons = [
    { reason: 'Complex issue requiring human intervention', count: escalatedTickets.length },
  ];

  return {
    total_escalated,
    escalation_rate: Math.round(escalation_rate * 100) / 100,
    escalation_by_priority,
    escalation_by_category,
    escalation_over_time,
    average_time_to_escalation: Math.round(average_time_to_escalation * 100) / 100,
    escalation_reasons,
  };
}

/**
 * Calculate response quality trends
 */
export async function getResponseQualityTrends(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ResponseQualityTrends> {
  // Get AI responses
  let responseQuery = supabaseAdmin
    .from('ai_responses')
    .select('id, confidence_score, created_at');

  if (options?.startDate) {
    responseQuery = responseQuery.gte('created_at', options.startDate.toISOString());
  }
  if (options?.endDate) {
    responseQuery = responseQuery.lte('created_at', options.endDate.toISOString());
  }

  const { data: responses, error: responseError } = await responseQuery;

  if (responseError) {
    throw new Error(`Failed to get AI responses: ${responseError.message}`);
  }

  const allResponses = responses || [];

  // Get feedback
  const { getFeedbackStats } = await import('./feedbackService');
  const feedbackStats = await getFeedbackStats({
    startDate: options?.startDate,
    endDate: options?.endDate,
  });

  // Average confidence over time
  const confidenceOverTimeMap = new Map<string, { confidences: number[]; count: number }>();
  allResponses.forEach(response => {
    const date = new Date(response.created_at).toISOString().split('T')[0];
    const existing = confidenceOverTimeMap.get(date) || { confidences: [], count: 0 };
    if (response.confidence_score !== null) {
      existing.confidences.push(response.confidence_score);
    }
    existing.count += 1;
    confidenceOverTimeMap.set(date, existing);
  });

  const average_confidence_over_time = Array.from(confidenceOverTimeMap.entries())
    .map(([date, data]) => ({
      date,
      confidence: data.confidences.length > 0
        ? data.confidences.reduce((sum, c) => sum + c, 0) / data.confidences.length
        : 0,
      response_count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Average rating over time
  const ratingOverTimeMap = new Map<string, { ratings: number[]; count: number }>();
  feedbackStats.recent_feedback.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    const existing = ratingOverTimeMap.get(date) || { ratings: [], count: 0 };
    existing.ratings.push(item.rating);
    existing.count += 1;
    ratingOverTimeMap.set(date, existing);
  });

  const average_rating_over_time = Array.from(ratingOverTimeMap.entries())
    .map(([date, data]) => ({
      date,
      rating: data.ratings.length > 0
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
        : 0,
      feedback_count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Quality score over time (combination of confidence and rating)
  const qualityScoreMap = new Map<string, { scores: number[]; count: number }>();
  
  // Match responses with feedback by date
  const dateSet = new Set([
    ...average_confidence_over_time.map(d => d.date),
    ...average_rating_over_time.map(d => d.date),
  ]);

  dateSet.forEach(date => {
    const confidenceData = average_confidence_over_time.find(d => d.date === date);
    const ratingData = average_rating_over_time.find(d => d.date === date);
    
    if (confidenceData && ratingData) {
      // Normalize rating to 0-1 scale (assuming 1-5 stars)
      const normalizedRating = (ratingData.rating - 1) / 4;
      // Quality score = average of confidence and normalized rating
      const qualityScore = (confidenceData.confidence + normalizedRating) / 2;
      
      const existing = qualityScoreMap.get(date) || { scores: [], count: 0 };
      existing.scores.push(qualityScore);
      existing.count += 1;
      qualityScoreMap.set(date, existing);
    }
  });

  const quality_score_over_time = Array.from(qualityScoreMap.entries())
    .map(([date, data]) => ({
      date,
      quality_score: data.scores.length > 0
        ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
        : 0,
      response_count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Confidence vs satisfaction
  const confidenceRanges = [
    { min: 0, max: 0.5, label: '0-0.5' },
    { min: 0.5, max: 0.7, label: '0.5-0.7' },
    { min: 0.7, max: 0.9, label: '0.7-0.9' },
    { min: 0.9, max: 1.0, label: '0.9-1.0' },
  ];

  // Get feedback with associated AI responses
  const { getAIResponseFeedbackAnalytics } = await import('./feedbackService');
  const aiFeedbackAnalytics = await getAIResponseFeedbackAnalytics({
    startDate: options?.startDate,
    endDate: options?.endDate,
  });

  // Get feedback with ratings for confidence ranges
  const confidence_vs_satisfaction = aiFeedbackAnalytics.feedback_by_confidence_range.map(range => {
    // Match by confidence range - we need to get actual ratings for this range
    // For now, use the positive feedback rate as a proxy for satisfaction
    // In a real implementation, you'd join feedback with AI responses by conversation_id
    const rangeMin = parseFloat(range.range.split('-')[0]);
    const rangeMax = parseFloat(range.range.split('-')[1]);
    
    // Find matching confidence data
    const matchingRatings = aiFeedbackAnalytics.average_confidence_by_rating.filter(
      r => r.average_confidence >= rangeMin && r.average_confidence < rangeMax
    );
    
    // Calculate average rating from matching data
    const average_rating = matchingRatings.length > 0
      ? matchingRatings.reduce((sum, r) => sum + r.average_confidence, 0) / matchingRatings.length
      : 0;

    return {
      confidence_range: range.range,
      average_rating: Math.round(average_rating * 100) / 100,
      count: range.total_feedback,
    };
  });

  // First response quality
  const firstResponses = allResponses
    .filter(r => r.confidence_score !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const firstResponseConfidences = firstResponses
    .slice(0, Math.min(100, firstResponses.length))
    .map(r => r.confidence_score!);

  const average_confidence = firstResponseConfidences.length > 0
    ? firstResponseConfidences.reduce((sum, c) => sum + c, 0) / firstResponseConfidences.length
    : 0;

  const firstResponseRatings = feedbackStats.recent_feedback
    .slice(0, Math.min(100, feedbackStats.recent_feedback.length))
    .map(f => f.rating);

  const average_rating = firstResponseRatings.length > 0
    ? firstResponseRatings.reduce((sum, r) => sum + r, 0) / firstResponseRatings.length
    : 0;

  return {
    average_confidence_over_time,
    average_rating_over_time,
    quality_score_over_time,
    confidence_vs_satisfaction,
    first_response_quality: {
      average_confidence: Math.round(average_confidence * 1000) / 1000,
      average_rating: Math.round(average_rating * 100) / 100,
      total_responses: firstResponseConfidences.length,
    },
  };
}

