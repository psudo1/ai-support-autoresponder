export type AIResponseStatus = 
  | 'pending_review' 
  | 'approved' 
  | 'rejected' 
  | 'sent' 
  | 'edited';

export interface AIResponse {
  id: string;
  ticket_id: string;
  conversation_id: string | null;
  prompt_used: string;
  model_used: string;
  tokens_used: number | null;
  cost: number | null;
  confidence_score: number | null;
  knowledge_sources: string[]; // Array of knowledge_base IDs
  response_text: string;
  status: AIResponseStatus;
  created_at: string;
}

export interface GenerateResponseInput {
  ticket_id: string;
  conversation_history?: string[];
  include_knowledge_base?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface GenerateResponseOutput {
  response: string;
  confidence_score: number;
  knowledge_sources: string[];
  tokens_used: number;
  cost: number;
  model_used: string;
}

export interface AISettings {
  model: string;
  temperature: number;
  max_tokens: number;
  auto_send_threshold: number;
  require_review_below: number;
  brand_voice: string;
}

