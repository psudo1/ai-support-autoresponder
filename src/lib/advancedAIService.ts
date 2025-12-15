import { openai } from './openaiClient';
import type { GenerateResponseInput } from '../types';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'frustrated' | 'angry';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type IntentType = 
  | 'question'
  | 'complaint'
  | 'request'
  | 'compliment'
  | 'bug_report'
  | 'feature_request'
  | 'refund'
  | 'technical_support'
  | 'account_issue'
  | 'billing'
  | 'other';

export interface SentimentAnalysis {
  sentiment: Sentiment;
  confidence: number; // 0-1
  score: number; // -1 to 1, where -1 is very negative, 1 is very positive
  emotions?: string[]; // e.g., ['frustrated', 'confused', 'hopeful']
}

export interface UrgencyAnalysis {
  level: UrgencyLevel;
  confidence: number; // 0-1
  factors: string[]; // Reasons for urgency assessment
  score: number; // 0-1, where 1 is most urgent
}

export interface IntentAnalysis {
  intent: IntentType;
  confidence: number; // 0-1
  sub_intents?: string[]; // Additional intents detected
  entities?: Array<{ type: string; value: string; confidence: number }>; // Named entities
}

export interface ConversationContext {
  turn_count: number;
  requires_follow_up: boolean;
  conversation_stage: 'initial' | 'clarification' | 'resolution' | 'follow_up';
  key_topics: string[];
  unresolved_questions: string[];
}

export interface AdvancedAIAnalysis {
  sentiment: SentimentAnalysis;
  urgency: UrgencyAnalysis;
  intent: IntentAnalysis;
  conversation_context?: ConversationContext;
}

/**
 * Analyze sentiment of a message using OpenAI
 */
export async function analyzeSentiment(
  text: string,
  conversationHistory?: string[]
): Promise<SentimentAnalysis> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are an expert at analyzing customer sentiment in support tickets. Analyze the sentiment and return a JSON object with:
- sentiment: one of "positive", "neutral", "negative", "frustrated", "angry"
- confidence: a number between 0 and 1
- score: a number between -1 (very negative) and 1 (very positive)
- emotions: an array of detected emotions (e.g., ["frustrated", "confused", "hopeful"])

Be accurate and consider the full context.`,
    },
    {
      role: 'user' as const,
      content: `Analyze the sentiment of this customer message${conversationHistory && conversationHistory.length > 0 ? ' and conversation history' : ''}:

${conversationHistory && conversationHistory.length > 0 ? `Conversation History:\n${conversationHistory.join('\n\n')}\n\n` : ''}Current Message:\n${text}

Return only valid JSON.`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for analysis
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content);
    
    return {
      sentiment: analysis.sentiment || 'neutral',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      score: Math.max(-1, Math.min(1, analysis.score || 0)),
      emotions: analysis.emotions || [],
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    // Fallback to simple rule-based analysis
    return fallbackSentimentAnalysis(text);
  }
}

/**
 * Fallback sentiment analysis using simple rules
 */
function fallbackSentimentAnalysis(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();
  
  const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'angry', 'furious', 'disappointed', 'frustrated'];
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'thank', 'appreciate', 'wonderful', 'fantastic'];
  const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'broken', 'down'];
  
  let negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  let positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  let urgentCount = urgentWords.filter(word => lowerText.includes(word)).length;
  
  let sentiment: Sentiment = 'neutral';
  let score = 0;
  
  if (urgentCount > 0 && negativeCount > 0) {
    sentiment = 'angry';
    score = -0.8;
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = negativeCount > 2 ? 'frustrated' : 'negative';
    score = -0.5 - (negativeCount * 0.1);
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
    score = 0.5 + (positiveCount * 0.1);
  }
  
  return {
    sentiment,
    confidence: 0.6,
    score: Math.max(-1, Math.min(1, score)),
    emotions: [],
  };
}

/**
 * Analyze urgency level of a ticket
 */
export async function analyzeUrgency(
  text: string,
  subject: string,
  priority?: string,
  conversationHistory?: string[]
): Promise<UrgencyAnalysis> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are an expert at assessing urgency in customer support tickets. Analyze the urgency and return a JSON object with:
- level: one of "low", "medium", "high", "critical"
- confidence: a number between 0 and 1
- factors: an array of reasons for the urgency assessment (e.g., ["mentions downtime", "affects multiple users", "financial impact"])
- score: a number between 0 (not urgent) and 1 (critical)

Consider factors like:
- Service outages or downtime
- Financial impact
- Security concerns
- Number of users affected
- Time-sensitive requests
- Escalation language`,
    },
    {
      role: 'user' as const,
      content: `Assess the urgency of this support ticket${conversationHistory && conversationHistory.length > 0 ? ' considering conversation history' : ''}:

Subject: ${subject}
${priority ? `Current Priority: ${priority}` : ''}
${conversationHistory && conversationHistory.length > 0 ? `Conversation History:\n${conversationHistory.join('\n\n')}\n\n` : ''}Message:\n${text}

Return only valid JSON.`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content);
    
    const levelMap: Record<string, UrgencyLevel> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };
    
    return {
      level: levelMap[analysis.level?.toLowerCase()] || 'medium',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      factors: analysis.factors || [],
      score: Math.max(0, Math.min(1, analysis.score || 0.5)),
    };
  } catch (error) {
    console.error('Error analyzing urgency:', error);
    return fallbackUrgencyAnalysis(text, subject, priority);
  }
}

/**
 * Fallback urgency analysis
 */
function fallbackUrgencyAnalysis(
  text: string,
  subject: string,
  priority?: string
): UrgencyAnalysis {
  const lowerText = (text + ' ' + subject).toLowerCase();
  
  const criticalWords = ['down', 'broken', 'crash', 'emergency', 'critical', 'urgent', 'asap', 'immediately', 'not working', 'outage'];
  const highWords = ['important', 'soon', 'quickly', 'issue', 'problem', 'error', 'failed'];
  const lowWords = ['question', 'wondering', 'curious', 'information', 'general'];
  
  const criticalCount = criticalWords.filter(word => lowerText.includes(word)).length;
  const highCount = highWords.filter(word => lowerText.includes(word)).length;
  const lowCount = lowWords.filter(word => lowerText.includes(word)).length;
  
  let level: UrgencyLevel = 'medium';
  let score = 0.5;
  const factors: string[] = [];
  
  if (criticalCount > 0) {
    level = 'critical';
    score = 0.9;
    factors.push('Contains critical keywords');
  } else if (highCount > lowCount && highCount > 0) {
    level = 'high';
    score = 0.7;
    factors.push('Contains urgency indicators');
  } else if (lowCount > highCount) {
    level = 'low';
    score = 0.3;
    factors.push('Appears to be informational');
  }
  
  if (priority === 'urgent') {
    level = 'critical';
    score = 0.95;
    factors.push('Ticket marked as urgent');
  } else if (priority === 'high') {
    level = 'high';
    score = Math.max(score, 0.7);
    factors.push('Ticket marked as high priority');
  }
  
  return {
    level,
    confidence: 0.6,
    factors,
    score,
  };
}

/**
 * Classify intent of a message
 */
export async function classifyIntent(
  text: string,
  subject: string,
  conversationHistory?: string[]
): Promise<IntentAnalysis> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are an expert at classifying customer intents in support tickets. Analyze the intent and return a JSON object with:
- intent: one of "question", "complaint", "request", "compliment", "bug_report", "feature_request", "refund", "technical_support", "account_issue", "billing", "other"
- confidence: a number between 0 and 1
- sub_intents: an array of additional intents if multiple are detected
- entities: an array of named entities found (e.g., [{"type": "product", "value": "mobile app", "confidence": 0.9}])

Be accurate and consider the full context.`,
    },
    {
      role: 'user' as const,
      content: `Classify the intent of this customer message${conversationHistory && conversationHistory.length > 0 ? ' considering conversation history' : ''}:

Subject: ${subject}
${conversationHistory && conversationHistory.length > 0 ? `Conversation History:\n${conversationHistory.join('\n\n')}\n\n` : ''}Message:\n${text}

Return only valid JSON.`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content);
    
    const intentMap: Record<string, IntentType> = {
      question: 'question',
      complaint: 'complaint',
      request: 'request',
      compliment: 'compliment',
      bug_report: 'bug_report',
      feature_request: 'feature_request',
      refund: 'refund',
      technical_support: 'technical_support',
      account_issue: 'account_issue',
      billing: 'billing',
      other: 'other',
    };
    
    return {
      intent: intentMap[analysis.intent?.toLowerCase()] || 'other',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      sub_intents: analysis.sub_intents || [],
      entities: analysis.entities || [],
    };
  } catch (error) {
    console.error('Error classifying intent:', error);
    return fallbackIntentClassification(text, subject);
  }
}

/**
 * Fallback intent classification
 */
function fallbackIntentClassification(
  text: string,
  subject: string
): IntentAnalysis {
  const lowerText = (text + ' ' + subject).toLowerCase();
  
  const intentPatterns: Record<IntentType, RegExp[]> = {
    question: [/how do/i, /what is/i, /can you/i, /is it possible/i, /\?/],
    complaint: [/not working/i, /broken/i, /terrible/i, /disappointed/i, /unhappy/i, /issue/i],
    request: [/please/i, /can you/i, /would you/i, /i need/i, /i want/i],
    compliment: [/thank/i, /great/i, /love/i, /excellent/i, /amazing/i],
    bug_report: [/bug/i, /error/i, /crash/i, /glitch/i, /not working/i],
    feature_request: [/feature/i, /add/i, /suggest/i, /would be nice/i],
    refund: [/refund/i, /money back/i, /cancel/i, /return/i],
    technical_support: [/help/i, /support/i, /troubleshoot/i, /fix/i],
    account_issue: [/account/i, /login/i, /password/i, /access/i],
    billing: [/billing/i, /charge/i, /payment/i, /invoice/i, /subscription/i],
    other: [],
  };
  
  let bestIntent: IntentType = 'other';
  let maxMatches = 0;
  
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const matches = patterns.filter(pattern => pattern.test(lowerText)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestIntent = intent as IntentType;
    }
  }
  
  return {
    intent: bestIntent,
    confidence: maxMatches > 0 ? 0.6 : 0.3,
    sub_intents: [],
    entities: [],
  };
}

/**
 * Analyze conversation context for multi-turn handling
 */
export async function analyzeConversationContext(
  conversationHistory: string[],
  currentMessage: string
): Promise<ConversationContext> {
  const turnCount = conversationHistory.length + 1;
  
  // Determine conversation stage
  let conversationStage: ConversationContext['conversation_stage'] = 'initial';
  if (turnCount === 1) {
    conversationStage = 'initial';
  } else if (turnCount <= 3) {
    conversationStage = 'clarification';
  } else if (turnCount <= 5) {
    conversationStage = 'resolution';
  } else {
    conversationStage = 'follow_up';
  }
  
  // Detect if follow-up is needed
  const lowerMessage = currentMessage.toLowerCase();
  const requiresFollowUp = 
    lowerMessage.includes('?') ||
    lowerMessage.includes('please') ||
    lowerMessage.includes('can you') ||
    lowerMessage.includes('would you') ||
    conversationStage === 'clarification';
  
  // Extract key topics (simple keyword extraction)
  const allText = [...conversationHistory, currentMessage].join(' ').toLowerCase();
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];
  const words = allText.split(/\W+/).filter(word => word.length > 3 && !commonWords.includes(word));
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  const keyTopics = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  // Detect unresolved questions
  const unresolvedQuestions: string[] = [];
  const questionPattern = /(?:how|what|when|where|why|who|can|will|is|are|do|does|did)\s+[^?.!]+[?.!]/gi;
  const questions = currentMessage.match(questionPattern);
  if (questions) {
    unresolvedQuestions.push(...questions.slice(0, 3));
  }
  
  return {
    turn_count: turnCount,
    requires_follow_up: requiresFollowUp,
    conversation_stage: conversationStage,
    key_topics: keyTopics,
    unresolved_questions: unresolvedQuestions,
  };
}

/**
 * Perform comprehensive AI analysis on a ticket
 */
export async function performAdvancedAnalysis(
  ticket: {
    subject: string;
    initial_message: string;
    priority?: string;
  },
  conversationHistory?: string[]
): Promise<AdvancedAIAnalysis> {
  const text = ticket.initial_message;
  const fullHistory = conversationHistory || [];
  
  // Run all analyses in parallel for efficiency
  const [sentiment, urgency, intent, conversationContext] = await Promise.all([
    analyzeSentiment(text, fullHistory),
    analyzeUrgency(text, ticket.subject, ticket.priority, fullHistory),
    classifyIntent(text, ticket.subject, fullHistory),
    fullHistory.length > 0 
      ? analyzeConversationContext(fullHistory, text)
      : Promise.resolve({
          turn_count: 1,
          requires_follow_up: false,
          conversation_stage: 'initial' as const,
          key_topics: [],
          unresolved_questions: [],
        }),
  ]);
  
  return {
    sentiment,
    urgency,
    intent,
    conversation_context: conversationContext,
  };
}

