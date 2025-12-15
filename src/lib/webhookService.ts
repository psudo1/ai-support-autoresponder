import { supabaseAdmin } from './supabaseClient';
import crypto from 'crypto';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

export type WebhookEvent = 
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.resolved'
  | 'ticket.escalated'
  | 'ai.response.generated'
  | 'ai.response.requires_review'
  | 'ai.response.approved'
  | 'ai.response.rejected'
  | 'conversation.added'
  | 'feedback.received';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEvent[];
}

/**
 * Get webhook configuration from settings
 */
export async function getWebhookConfig(): Promise<WebhookConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'integration_settings')
    .single();

  if (error || !data) {
    return null;
  }

  const settings = data.value;
  if (!settings?.webhooks?.enabled || !settings.webhooks.url) {
    return null;
  }

  return {
    url: settings.webhooks.url,
    secret: settings.webhooks.secret || '',
    events: settings.webhooks.events || [],
  };
}

/**
 * Generate webhook signature for verification
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    return false; // Can't verify without secret
  }
  
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send webhook event to configured webhook URL
 */
export async function sendWebhookEvent(
  event: WebhookEvent,
  data: any
): Promise<void> {
  const config = await getWebhookConfig();
  
  if (!config) {
    return; // Webhooks not configured
  }

  if (!config.events.includes(event)) {
    return; // Event not subscribed to
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = config.secret 
    ? generateWebhookSignature(payloadString, config.secret)
    : '';

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'User-Agent': 'AI-Support-Autoresponder/1.0',
      },
      body: payloadString,
    });

    if (!response.ok) {
      console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
      // In production, you might want to retry or queue failed webhooks
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
    // In production, you might want to retry or queue failed webhooks
  }
}

/**
 * Send webhook to Slack
 */
export async function sendSlackWebhook(
  event: WebhookEvent,
  data: any
): Promise<void> {
  const { data: settingsData } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'integration_settings')
    .single();

  if (!settingsData) {
    return;
  }

  const settings = settingsData.value;
  if (!settings?.slack?.enabled || !settings.slack.webhook_url) {
    return;
  }

  if (!settings.slack.events.includes(event)) {
    return;
  }

  const channel = settings.slack.channel || '#support';
  
  // Format message based on event type
  let message = '';
  let color = '#36a64f'; // Green by default

  switch (event) {
    case 'ticket.created':
      message = `🎫 New ticket created: ${data.ticket?.subject || 'Untitled'}`;
      color = '#36a64f';
      break;
    case 'ticket.escalated':
      message = `⚠️ Ticket escalated: ${data.ticket?.subject || 'Untitled'}`;
      color = '#ff0000';
      break;
    case 'ticket.resolved':
      message = `✅ Ticket resolved: ${data.ticket?.subject || 'Untitled'}`;
      color = '#36a64f';
      break;
    case 'ai.response.requires_review':
      message = `🔍 AI response requires review for ticket: ${data.ticket?.subject || 'Untitled'}`;
      color = '#ff9900';
      break;
    default:
      message = `📢 Event: ${event}`;
  }

  const slackPayload = {
    channel,
    username: 'AI Support Bot',
    icon_emoji: ':robot_face:',
    attachments: [
      {
        color,
        text: message,
        fields: [
          {
            title: 'Event',
            value: event,
            short: true,
          },
          {
            title: 'Time',
            value: new Date().toISOString(),
            short: true,
          },
        ],
        footer: 'AI Support Autoresponder',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(settings.slack.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      console.error(`Slack webhook delivery failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending Slack webhook:', error);
  }
}

