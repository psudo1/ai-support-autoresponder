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

