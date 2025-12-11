export type SenderType = 'customer' | 'ai' | 'human';

export interface Conversation {
  id: string;
  ticket_id: string;
  message: string;
  sender_type: SenderType;
  sender_id: string | null;
  ai_confidence: number | null;
  is_ai_generated: boolean;
  requires_review: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateConversationInput {
  ticket_id: string;
  message: string;
  sender_type: SenderType;
  sender_id?: string | null;
  ai_confidence?: number | null;
  is_ai_generated?: boolean;
  requires_review?: boolean;
}

