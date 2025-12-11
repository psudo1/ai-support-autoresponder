export type TicketStatus = 
  | 'new' 
  | 'ai_responded' 
  | 'human_review' 
  | 'resolved' 
  | 'escalated' 
  | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketSource = 'email' | 'webhook' | 'api' | 'chat' | 'manual';

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  initial_message: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  customer_email: string;
  customer_name: string | null;
  source: TicketSource;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
}

export interface CreateTicketInput {
  subject: string;
  initial_message: string;
  customer_email: string;
  customer_name?: string;
  priority?: TicketPriority;
  category?: string;
  source?: TicketSource;
}

export interface UpdateTicketInput {
  subject?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigned_to?: string | null;
  resolved_at?: string | null;
}

