# Webhooks Guide

Complete guide to using webhooks with the AI Support Autoresponder.

## Overview

Webhooks allow you to:
- **Receive** tickets from external systems
- **Send** events to external systems when actions occur
- Integrate with Zapier, Slack, and custom applications

## Receiving Webhooks (Incoming)

### Endpoint

```
POST /api/webhooks/receive
```

### Creating Tickets via Webhook

Send a POST request to create a ticket:

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

### Signature Verification

If you've configured a webhook secret in Settings → Integrations, include the signature header:

**Node.js Example:**
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

## Sending Webhooks (Outgoing)

### Configuration

1. Go to **Settings → Integrations**
2. Enable **Webhooks**
3. Configure:
   - **Webhook URL**: Your endpoint URL
   - **Webhook Secret**: Secret for signature verification
   - **Events**: Select which events to receive

### Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| `ticket.created` | New ticket created | `{ ticket: {...} }` |
| `ticket.updated` | Ticket updated | `{ ticket: {...} }` |
| `ticket.resolved` | Ticket resolved | `{ ticket: {...} }` |
| `ticket.escalated` | Ticket escalated | `{ ticket: {...} }` |
| `ai.response.generated` | AI response generated | `{ ticket: {...}, ai_response: {...} }` |
| `ai.response.requires_review` | AI response needs review | `{ ticket: {...}, ai_response: {...} }` |
| `ai.response.approved` | AI response approved | `{ ticket: {...}, ai_response: {...} }` |
| `ai.response.rejected` | AI response rejected | `{ ticket: {...}, ai_response: {...}, reason: string }` |
| `conversation.added` | New conversation message | `{ conversation: {...} }` |
| `feedback.received` | Feedback received | `{ feedback: {...} }` |

### Webhook Payload Format

All webhooks follow this format:

```json
{
  "event": "ticket.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "ticket": {
      "id": "uuid",
      "ticket_number": "TKT-2024-001",
      "subject": "Ticket subject",
      "status": "new",
      "customer_email": "customer@example.com"
    }
  }
}
```

### Headers

All outgoing webhooks include these headers:

- `Content-Type: application/json`
- `X-Webhook-Signature`: HMAC-SHA256 signature (if secret configured)
- `X-Webhook-Event`: Event type
- `User-Agent: AI-Support-Autoresponder/1.0`

### Verifying Signatures

**Node.js:**
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

// In your webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();
  
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const data = JSON.parse(payload);
  // Process webhook...
});
```

**Python:**
```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)
```

## Slack Integration

### Setup

1. Create a Slack Incoming Webhook
2. Go to **Settings → Integrations → Slack**
3. Enable Slack integration
4. Paste your webhook URL
5. Select channel and events

### Slack Message Format

Messages are formatted as Slack attachments with:
- Color coding by event type
- Ticket details
- Timestamps
- Direct links (if configured)

## Testing

### Test Webhook Endpoint

Use [webhook.site](https://webhook.site) or [ngrok](https://ngrok.com):

1. Get a test webhook URL
2. Configure in Settings → Integrations
3. Trigger an event
4. Check webhook.site for the payload

### Test Incoming Webhook

```bash
curl -X POST https://your-domain.com/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ticket.create",
    "data": {
      "subject": "Test Ticket",
      "message": "This is a test",
      "customer_email": "test@example.com"
    }
  }'
```

## Best Practices

1. **Always verify signatures** when secret is configured
2. **Handle errors gracefully** - webhook failures shouldn't break your app
3. **Use idempotency** - handle duplicate events
4. **Log webhook deliveries** for debugging
5. **Set timeouts** - don't wait too long for webhook responses
6. **Retry failed webhooks** (implement retry logic)

## Troubleshooting

### Webhook Not Received

- Check webhook is enabled in Settings
- Verify webhook URL is correct
- Check event subscriptions
- Review server logs
- Test webhook URL manually

### Signature Verification Failing

- Ensure webhook secret matches
- Verify signature calculation
- Check payload is stringified before signing
- Ensure signature header is included

### Webhook Delivery Failed

- Check your endpoint is accessible
- Verify endpoint accepts POST requests
- Check endpoint returns 200 status
- Review endpoint logs for errors

