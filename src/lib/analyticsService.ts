import { supabaseAdmin } from './supabaseClient';
import type { TicketStatus, TicketPriority } from '../types';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

export interface ResponseTimeMetrics {
  average: number; // in minutes
  median: number;
  p95: number;
  p99: number;
  totalResponses: number;
}

export interface TicketStatusAnalytics {
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  statusOverTime: Array<{ date: string; status: TicketStatus; count: number }>;
  priorityOverTime: Array<{ date: string; priority: TicketPriority; count: number }>;
}

export interface ConfidenceDistribution {
  ranges: Array<{ range: string; count: number; percentage: number }>;
  average: number;
  median: number;
  totalResponses: number;
}

export interface CostMetrics {
  totalCost: number;
  averageCostPerResponse: number;
  costByModel: Array<{ model: string; cost: number; count: number }>;
  costOverTime: Array<{ date: string; cost: number; count: number }>;
  totalTokens: number;
  averageTokensPerResponse: number;
}

/**
 * Calculate response time metrics
 * Response time = time from ticket creation to first AI response
 */
export async function getResponseTimeMetrics(
  startDate?: string,
  endDate?: string
): Promise<ResponseTimeMetrics> {
  // First get all AI responses
  let responseQuery = supabaseAdmin
    .from('ai_responses')
    .select('id, ticket_id, created_at')
    .order('created_at', { ascending: false });

  if (startDate) {
    responseQuery = responseQuery.gte('created_at', startDate);
  }
  if (endDate) {
    responseQuery = responseQuery.lte('created_at', endDate);
  }

  const { data: responses, error: responseError } = await responseQuery;

  if (responseError) {
    throw new Error(`Failed to fetch response time data: ${responseError.message}`);
  }

  if (!responses || responses.length === 0) {
    return {
      average: 0,
      median: 0,
      p95: 0,
      p99: 0,
      totalResponses: 0,
    };
  }

  // Get ticket creation times for all tickets
  const ticketIds = [...new Set(responses.map((r: any) => r.ticket_id))];
  const { data: tickets, error: ticketError } = await supabaseAdmin
    .from('tickets')
    .select('id, created_at')
    .in('id', ticketIds);

  if (ticketError) {
    throw new Error(`Failed to fetch ticket data: ${ticketError.message}`);
  }

  // Create a map of ticket IDs to creation times
  const ticketMap = new Map(
    (tickets || []).map((t: any) => [t.id, t.created_at])
  );

  // Calculate response times in minutes
  const responseTimes = responses
    .map((response: any) => {
      const ticketCreated = ticketMap.get(response.ticket_id);
      if (!ticketCreated) return null;
      
      const ticketTime = new Date(ticketCreated).getTime();
      const responseTime = new Date(response.created_at).getTime();
      return (responseTime - ticketTime) / (1000 * 60); // Convert to minutes
    })
    .filter((time: number | null): time is number => time !== null && time >= 0) // Filter out nulls and negative times
    .sort((a: number, b: number) => a - b);

  if (responseTimes.length === 0) {
    return {
      average: 0,
      median: 0,
      p95: 0,
      p99: 0,
      totalResponses: 0,
    };
  }

  const sum = responseTimes.reduce((a: number, b: number) => a + b, 0);
  const average = sum / responseTimes.length;
  const median = responseTimes[Math.floor(responseTimes.length / 2)];
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p99Index = Math.floor(responseTimes.length * 0.99);
  const p95 = responseTimes[p95Index] || responseTimes[responseTimes.length - 1];
  const p99 = responseTimes[p99Index] || responseTimes[responseTimes.length - 1];

  return {
    average: Math.round(average * 100) / 100,
    median: Math.round(median * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    p99: Math.round(p99 * 100) / 100,
    totalResponses: responseTimes.length,
  };
}

/**
 * Get ticket status analytics
 */
export async function getTicketStatusAnalytics(
  startDate?: string,
  endDate?: string
): Promise<TicketStatusAnalytics> {
  let query = supabaseAdmin
    .from('tickets')
    .select('status, priority, created_at')
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch ticket status data: ${error.message}`);
  }

  const byStatus: Record<TicketStatus, number> = {
    new: 0,
    ai_responded: 0,
    human_review: 0,
    resolved: 0,
    escalated: 0,
    closed: 0,
  };

  const byPriority: Record<TicketPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  const statusOverTimeMap = new Map<string, Map<TicketStatus, number>>();
  const priorityOverTimeMap = new Map<string, Map<TicketPriority, number>>();

  data?.forEach((ticket: any) => {
    // Count by status
    byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
    
    // Count by priority
    byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;

    // Group by date for time series
    const date = new Date(ticket.created_at).toISOString().split('T')[0];
    
    if (!statusOverTimeMap.has(date)) {
      statusOverTimeMap.set(date, new Map());
    }
    const statusMap = statusOverTimeMap.get(date)!;
    statusMap.set(ticket.status, (statusMap.get(ticket.status) || 0) + 1);

    if (!priorityOverTimeMap.has(date)) {
      priorityOverTimeMap.set(date, new Map());
    }
    const priorityMap = priorityOverTimeMap.get(date)!;
    priorityMap.set(ticket.priority, (priorityMap.get(ticket.priority) || 0) + 1);
  });

  // Convert maps to arrays
  const statusOverTime: Array<{ date: string; status: TicketStatus; count: number }> = [];
  statusOverTimeMap.forEach((statusMap, date) => {
    statusMap.forEach((count, status) => {
      statusOverTime.push({ date, status, count });
    });
  });

  const priorityOverTime: Array<{ date: string; priority: TicketPriority; count: number }> = [];
  priorityOverTimeMap.forEach((priorityMap, date) => {
    priorityMap.forEach((count, priority) => {
      priorityOverTime.push({ date, priority, count });
    });
  });

  return {
    byStatus,
    byPriority,
    statusOverTime: statusOverTime.sort((a, b) => a.date.localeCompare(b.date)),
    priorityOverTime: priorityOverTime.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Get AI confidence distribution
 */
export async function getConfidenceDistribution(
  startDate?: string,
  endDate?: string
): Promise<ConfidenceDistribution> {
  let query = supabaseAdmin
    .from('ai_responses')
    .select('confidence_score')
    .not('confidence_score', 'is', null);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch confidence data: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      ranges: [],
      average: 0,
      median: 0,
      totalResponses: 0,
    };
  }

  const scores = data
    .map((item: any) => item.confidence_score)
    .filter((score: number) => score !== null && score !== undefined)
    .sort((a: number, b: number) => a - b);

  // Define ranges
  const ranges = [
    { min: 0, max: 0.3, label: '0-30%' },
    { min: 0.3, max: 0.5, label: '30-50%' },
    { min: 0.5, max: 0.7, label: '50-70%' },
    { min: 0.7, max: 0.9, label: '70-90%' },
    { min: 0.9, max: 1.0, label: '90-100%' },
  ];

  const rangeCounts = ranges.map(range => {
    const count = scores.filter(
      (score: number) => score >= range.min && score < range.max
    ).length;
    return {
      range: range.label,
      count,
      percentage: Math.round((count / scores.length) * 100 * 100) / 100,
    };
  });

  const sum = scores.reduce((a: number, b: number) => a + b, 0);
  const average = sum / scores.length;
  const median = scores[Math.floor(scores.length / 2)];

  return {
    ranges: rangeCounts,
    average: Math.round(average * 10000) / 10000,
    median: Math.round(median * 10000) / 10000,
    totalResponses: scores.length,
  };
}

/**
 * Get cost tracking metrics
 */
export async function getCostMetrics(
  startDate?: string,
  endDate?: string
): Promise<CostMetrics> {
  let query = supabaseAdmin
    .from('ai_responses')
    .select('cost, tokens_used, model_used, created_at')
    .not('cost', 'is', null);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch cost data: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalCost: 0,
      averageCostPerResponse: 0,
      costByModel: [],
      costOverTime: [],
      totalTokens: 0,
      averageTokensPerResponse: 0,
    };
  }

  const totalCost = data.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.cost) || 0);
  }, 0);

  const totalTokens = data.reduce((sum: number, item: any) => {
    return sum + (parseInt(item.tokens_used) || 0);
  }, 0);

  const averageCostPerResponse = totalCost / data.length;
  const averageTokensPerResponse = totalTokens / data.length;

  // Group by model
  const modelMap = new Map<string, { cost: number; count: number }>();
  data.forEach((item: any) => {
    const model = item.model_used || 'unknown';
    const cost = parseFloat(item.cost) || 0;
    const existing = modelMap.get(model) || { cost: 0, count: 0 };
    modelMap.set(model, {
      cost: existing.cost + cost,
      count: existing.count + 1,
    });
  });

  const costByModel = Array.from(modelMap.entries()).map(([model, data]) => ({
    model,
    cost: Math.round(data.cost * 10000) / 10000,
    count: data.count,
  }));

  // Group by date
  const costOverTimeMap = new Map<string, { cost: number; count: number }>();
  data.forEach((item: any) => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    const cost = parseFloat(item.cost) || 0;
    const existing = costOverTimeMap.get(date) || { cost: 0, count: 0 };
    costOverTimeMap.set(date, {
      cost: existing.cost + cost,
      count: existing.count + 1,
    });
  });

  const costOverTime = Array.from(costOverTimeMap.entries())
    .map(([date, data]) => ({
      date,
      cost: Math.round(data.cost * 10000) / 10000,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalCost: Math.round(totalCost * 10000) / 10000,
    averageCostPerResponse: Math.round(averageCostPerResponse * 10000) / 10000,
    costByModel,
    costOverTime,
    totalTokens,
    averageTokensPerResponse: Math.round(averageTokensPerResponse * 100) / 100,
  };
}

export interface FeedbackAnalytics {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Array<{ rating: number; count: number }>;
  positive_rate: number; // Percentage of positive feedback
  negative_rate: number; // Percentage of negative feedback
  feedback_with_text_rate: number; // Percentage with text comments
  feedback_over_time: Array<{ date: string; count: number; average_rating: number }>;
}

/**
 * Get feedback analytics
 */
export async function getFeedbackAnalytics(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<FeedbackAnalytics> {
  const { getFeedbackStats } = await import('./feedbackService');
  
  const stats = await getFeedbackStats({
    startDate: options?.startDate,
    endDate: options?.endDate,
  });

  // Calculate feedback over time
  const feedbackOverTimeMap = new Map<string, { ratings: number[]; count: number }>();
  
  stats.recent_feedback.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    const existing = feedbackOverTimeMap.get(date) || { ratings: [], count: 0 };
    existing.ratings.push(item.rating);
    existing.count += 1;
    feedbackOverTimeMap.set(date, existing);
  });

  const feedback_over_time = Array.from(feedbackOverTimeMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      average_rating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const positive_rate = stats.total > 0 
    ? (stats.positive_count / stats.total) * 100 
    : 0;
  const negative_rate = stats.total > 0 
    ? (stats.negative_count / stats.total) * 100 
    : 0;
  const feedback_with_text_rate = stats.total > 0 
    ? (stats.with_text_count / stats.total) * 100 
    : 0;

  return {
    total_feedback: stats.total,
    average_rating: stats.average_rating,
    rating_distribution: stats.rating_distribution,
    positive_rate: Math.round(positive_rate * 100) / 100,
    negative_rate: Math.round(negative_rate * 100) / 100,
    feedback_with_text_rate: Math.round(feedback_with_text_rate * 100) / 100,
    feedback_over_time,
  };
}

