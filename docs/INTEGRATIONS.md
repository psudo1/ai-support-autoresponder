# Integration Guides

Step-by-step guides for integrating the AI Support Autoresponder with popular platforms and services.

## Table of Contents

- [Zapier Integration](#zapier-integration)
- [Webhook Integration](#webhook-integration)
- [Slack Integration](#slack-integration)
- [Custom Webhook Setup](#custom-webhook-setup)
- [API Integration Examples](#api-integration-examples)

## Zapier Integration

### Creating Tickets from Zapier

1. **Create a Zap**
   - Go to Zapier and create a new Zap
   - Choose your trigger (e.g., "New Email", "New Form Submission")

2. **Add Webhook Action**
   - Search for "Webhooks by Zapier"
   - Select "POST" action
   - Configure the webhook:
     - **URL**: `https://your-domain.com/api/webhooks/receive`
     - **Method**: POST
     - **Data**: 
       ```json
       {
         "event": "ticket.create",
         "data": {
           "subject": "{{trigger_field_subject}}",
           "message": "{{trigger_field_message}}",
           "customer_email": "{{trigger_field_email}}",
           "customer_name": "{{trigger_field_name}}",
           "priority": "medium",
           "category": "Support"
         }
       }
       ```

3. **Test and Activate**
   - Test the webhook connection
   - Activate your Zap

### Example Zapier Scenarios

#### Gmail → Support Ticket
- **Trigger**: New email in Gmail
- **Action**: Create ticket via webhook
- **Mapping**:
  - Subject → ticket subject
  - Email body → ticket message
  - Sender email → customer email
  - Sender name → customer name

#### Google Forms → Support Ticket
- **Trigger**: New form submission
- **Action**: Create ticket via webhook
- **Mapping**:
  - Form question 1 → ticket subject
  - Form question 2 → ticket message
  - Email field → customer email

## Webhook Integration

### Receiving Webhooks from External Systems

Configure your external system to send webhooks to:

```
POST https://your-domain.com/api/webhooks/receive
```

### Webhook Payload Format

```json
{
  "event": "ticket.create",
  "data": {
    "subject": "Support Request",
    "message": "Customer message here",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "priority": "medium",
    "category": "Technical"
  }
}
```

### Webhook Signature Verification

If you've configured a webhook secret in Settings → Integrations, include the signature header:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify(webhookData);
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

fetch('https://your-domain.com/api/webhooks/receive', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: payload
});
```

### Example: Node.js Webhook Sender

```javascript
const crypto = require('crypto');
const fetch = require('node-fetch');

async function createTicketViaWebhook(ticketData) {
  const payload = {
    event: 'ticket.create',
    data: ticketData
  };
  
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');
  
  const response = await fetch('https://your-domain.com/api/webhooks/receive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature
    },
    body: payloadString
  });
  
  return await response.json();
}

// Usage
createTicketViaWebhook({
  subject: 'Support Request',
  message: 'I need help with...',
  customer_email: 'customer@example.com',
  priority: 'high'
});
```

## Slack Integration

### Setting Up Slack Notifications

1. **Create Slack Webhook**
   - Go to your Slack workspace settings
   - Navigate to Apps → Incoming Webhooks
   - Create a new webhook
   - Copy the webhook URL

2. **Configure in Settings**
   - Go to Settings → Integrations
   - Enable Slack integration
   - Paste your webhook URL
   - Select channel (e.g., `#support`)
   - Choose events to receive:
     - ✅ Ticket Created
     - ✅ Ticket Escalated
     - ✅ Ticket Resolved
     - ✅ AI Response Requires Review

3. **Test**
   - Create a test ticket
   - Verify notification appears in Slack

### Slack Message Format

Notifications appear as formatted messages with:
- Color-coded by event type
- Ticket details
- Direct links to tickets
- Timestamps

## Custom Webhook Setup

### Configuring Outgoing Webhooks

1. **Go to Settings → Integrations**
2. **Enable Webhooks**
3. **Configure:**
   - **Webhook URL**: Your endpoint URL
   - **Webhook Secret**: Secret for signature verification
   - **Events**: Select which events to receive

### Available Events

- `ticket.created` - New ticket created
- `ticket.updated` - Ticket updated
- `ticket.resolved` - Ticket resolved
- `ticket.escalated` - Ticket escalated
- `ai.response.generated` - AI response generated
- `ai.response.requires_review` - AI response needs review
- `ai.response.approved` - AI response approved
- `ai.response.rejected` - AI response rejected
- `conversation.added` - New conversation message
- `feedback.received` - Feedback received

### Receiving Webhooks

Your endpoint should:

1. **Verify Signature** (if secret configured):
   ```javascript
   const crypto = require('crypto');
   
   function verifySignature(payload, signature, secret) {
     const expected = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex');
     return crypto.timingSafeEqual(
       Buffer.from(signature),
       Buffer.from(expected)
     );
   }
   ```

2. **Process Event**:
   ```javascript
   app.post('/webhook', (req, res) => {
     const signature = req.headers['x-webhook-signature'];
     const payload = JSON.stringify(req.body);
     
     if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
       return res.status(401).json({ error: 'Invalid signature' });
     }
     
     const { event, data } = req.body;
     
     switch (event) {
       case 'ticket.created':
         // Handle new ticket
         break;
       case 'ticket.escalated':
         // Handle escalation
         break;
       // ... other events
     }
     
     res.json({ received: true });
   });
   ```

## API Integration Examples

### Direct API Integration

Instead of webhooks, you can integrate directly with the API:

#### Create Ticket via API

```javascript
const response = await fetch('https://your-domain.com/api/tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    subject: 'Support Request',
    initial_message: 'Customer message',
    customer_email: 'customer@example.com',
    priority: 'high'
  })
});

const { ticket } = await response.json();
```

#### Get Ticket Status

```javascript
const response = await fetch(`https://your-domain.com/api/tickets/${ticketId}`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

const { ticket } = await response.json();
console.log(`Ticket ${ticket.ticket_number} is ${ticket.status}`);
```

#### Generate AI Response

```javascript
const response = await fetch(`https://your-domain.com/api/tickets/${ticketId}/respond`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    include_knowledge_base: true
  })
});

const { ai_response, confidence_score } = await response.json();
```

### Python Integration Example

```python
import requests

class SupportAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_ticket(self, subject, message, customer_email, **kwargs):
        response = requests.post(
            f'{self.base_url}/api/tickets',
            headers=self.headers,
            json={
                'subject': subject,
                'initial_message': message,
                'customer_email': customer_email,
                **kwargs
            }
        )
        return response.json()
    
    def get_ticket(self, ticket_id):
        response = requests.get(
            f'{self.base_url}/api/tickets/{ticket_id}',
            headers=self.headers
        )
        return response.json()
    
    def generate_ai_response(self, ticket_id):
        response = requests.post(
            f'{self.base_url}/api/tickets/{ticket_id}/respond',
            headers=self.headers
        )
        return response.json()

# Usage
api = SupportAPI('https://your-domain.com', 'your-api-key')
ticket = api.create_ticket(
    subject='Support Request',
    message='I need help',
    customer_email='customer@example.com',
    priority='high'
)
```

## Testing Integrations

### Test Webhook Endpoint

Use a service like [webhook.site](https://webhook.site) or [ngrok](https://ngrok.com) to test webhook delivery:

1. Get a test webhook URL
2. Configure it in Settings → Integrations
3. Trigger an event (create ticket, etc.)
4. Check webhook.site to see the payload

### Test API Endpoint

Use tools like Postman or curl:

```bash
# Create ticket
curl -X POST https://your-domain.com/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "subject": "Test Ticket",
    "initial_message": "This is a test",
    "customer_email": "test@example.com"
  }'
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook is enabled in Settings
2. Verify webhook URL is correct
3. Check event subscriptions
4. Review server logs for errors
5. Test webhook URL manually

### Signature Verification Failing

1. Ensure webhook secret matches
2. Verify signature is calculated correctly
3. Check payload is stringified before signing
4. Ensure signature header is included

### API Authentication Issues

1. Verify API key is correct
2. Check Authorization header format
3. Ensure session is valid (for browser requests)
4. Review rate limits

## Support

For integration help:
- Check API documentation: `/docs/API.md`
- Review example code in this guide
- Contact support for assistance

