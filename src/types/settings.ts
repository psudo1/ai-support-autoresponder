export interface IntegrationSettings {
  email: {
    enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string; // Note: In production, this should be encrypted
    from_email: string;
    from_name: string;
  };
  webhooks: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[]; // e.g., ['ticket.created', 'ticket.resolved', 'ai.response.generated']
  };
  slack: {
    enabled: boolean;
    webhook_url: string;
    channel: string;
    events: string[];
  };
}

export interface NotificationPreferences {
  email: {
    ticket_created: boolean;
    ticket_resolved: boolean;
    ticket_escalated: boolean;
    ai_response_generated: boolean;
    ai_response_requires_review: boolean;
    daily_summary: boolean;
  };
  in_app: {
    ticket_assigned: boolean;
    ticket_escalated: boolean;
    ai_response_requires_review: boolean;
  };
  browser: {
    ticket_escalated: boolean;
    ai_response_requires_review: boolean;
  };
}

export interface BrandVoiceSettings {
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'custom';
  style: string; // Custom style description
  language: string;
  greeting_template: string;
  closing_template: string;
  custom_instructions: string;
}

