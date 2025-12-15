import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/webhookService';
import { createTicket } from '@/lib/ticketService';
import type { CreateTicketInput } from '@/types/ticket';

/**
 * Receive webhooks from external systems
 * This endpoint allows external systems to create tickets via webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature') || '';
    
    // Get webhook secret from settings
    const { supabaseAdmin } = await import('@/lib/supabaseClient');
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'integration_settings')
      .single();

    const webhookSecret = settingsData?.value?.webhooks?.secret || '';
    
    // Verify signature if secret is configured
    if (webhookSecret) {
      const payloadString = JSON.stringify(body);
      const isValid = verifyWebhookSignature(payloadString, signature, webhookSecret);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const { event, data } = body;

    // Handle different event types
    switch (event) {
      case 'ticket.create':
      case 'ticket.created':
        // Create ticket from webhook data
        const ticketData: CreateTicketInput = {
          subject: data.subject || data.title || 'Support Request',
          initial_message: data.message || data.description || data.body || '',
          customer_email: data.customer_email || data.email || data.user?.email || 'unknown@example.com',
          customer_name: data.customer_name || data.name || data.user?.name,
          priority: data.priority || 'medium',
          category: data.category || data.type,
          source: 'webhook',
        };

        const ticket = await createTicket(ticketData);
        
        return NextResponse.json({
          success: true,
          ticket,
          message: 'Ticket created successfully',
        });

      default:
        return NextResponse.json(
          { error: `Unsupported event type: ${event}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process webhook',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * Webhook verification endpoint (for webhook providers that require verification)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  // Return challenge for webhook verification
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

