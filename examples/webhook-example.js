/**
 * Example: Creating a ticket via webhook
 * 
 * This example shows how to create a ticket in the AI Support Autoresponder
 * by sending a webhook request.
 */

const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'https://your-domain.com/api/webhooks/receive';
const WEBHOOK_SECRET = 'your-webhook-secret'; // Optional, from Settings → Integrations

/**
 * Create a ticket via webhook
 */
async function createTicketViaWebhook(ticketData) {
  const payload = {
    event: 'ticket.create',
    data: {
      subject: ticketData.subject,
      message: ticketData.message || ticketData.initial_message,
      customer_email: ticketData.customer_email,
      customer_name: ticketData.customer_name,
      priority: ticketData.priority || 'medium',
      category: ticketData.category,
    },
  };

  const payloadString = JSON.stringify(payload);
  
  // Generate signature if secret is configured
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (WEBHOOK_SECRET) {
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
    headers['X-Webhook-Signature'] = signature;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('Ticket created:', result.ticket);
    return result;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

/**
 * Example: Receiving webhooks from AI Support Autoresponder
 */
function setupWebhookReceiver(secret) {
  const express = require('express');
  const app = express();

  // Middleware to verify signature
  app.use('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
    if (secret) {
      const signature = req.headers['x-webhook-signature'];
      const payload = req.body.toString();
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      if (!crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    req.body = JSON.parse(req.body.toString());
    next();
  });

  // Webhook endpoint
  app.post('/webhook', (req, res) => {
    const { event, timestamp, data } = req.body;

    console.log(`Received webhook: ${event} at ${timestamp}`);

    switch (event) {
      case 'ticket.created':
        console.log('New ticket:', data.ticket);
        // Handle new ticket
        break;
      
      case 'ticket.escalated':
        console.log('Ticket escalated:', data.ticket);
        // Handle escalation
        break;
      
      case 'ai.response.requires_review':
        console.log('AI response needs review:', data.ai_response);
        // Notify team, etc.
        break;
      
      default:
        console.log('Unhandled event:', event);
    }

    res.json({ received: true });
  });

  return app;
}

// Usage examples
if (require.main === module) {
  // Example 1: Create a ticket
  createTicketViaWebhook({
    subject: 'Unable to access account',
    message: 'I forgot my password and cannot log in.',
    customer_email: 'customer@example.com',
    customer_name: 'John Doe',
    priority: 'high',
    category: 'Account',
  })
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Failed:', error);
    });

  // Example 2: Setup webhook receiver
  // const app = setupWebhookReceiver(process.env.WEBHOOK_SECRET);
  // app.listen(3000, () => {
  //   console.log('Webhook receiver listening on port 3000');
  // });
}

module.exports = {
  createTicketViaWebhook,
  setupWebhookReceiver,
};

