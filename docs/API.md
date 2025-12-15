# API Documentation

Complete API reference for the AI Support Autoresponder.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API endpoints require authentication using a session cookie (for browser requests) or an API key (for programmatic access).

### Using API Key

Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

**Note:** API key authentication is coming soon. Currently, all requests use session-based authentication.

## Rate Limits

- Default: 100 requests per minute per IP
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Endpoints

### Tickets

#### Create Ticket

**POST** `/api/tickets`

Create a new support ticket.

**Request Body:**
```json
{
  "subject": "Unable to log in",
  "initial_message": "I forgot my password and cannot access my account.",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "priority": "medium",
  "category": "Account",
  "source": "api"
}
```

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "ticket_number": "TKT-2024-001",
    "subject": "Unable to log in",
    "status": "new",
    "priority": "medium",
    "customer_email": "customer@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Tickets

**GET** `/api/tickets`

List all tickets with optional filters.

**Query Parameters:**
- `status` (optional) - Filter by status: `new`, `ai_responded`, `human_review`, `resolved`, `escalated`, `closed`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`, `urgent`
- `customer_email` (optional) - Filter by customer email
- `limit` (optional) - Limit number of results (default: 50, max: 100)
- `offset` (optional) - Offset for pagination

**Response:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "ticket_number": "TKT-2024-001",
      "subject": "Ticket subject",
      "status": "new",
      "priority": "medium",
      "customer_email": "customer@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100
}
```

#### Get Ticket

**GET** `/api/tickets/{id}`

Get a single ticket by ID.

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "ticket_number": "TKT-2024-001",
    "subject": "Ticket subject",
    "initial_message": "Customer message",
    "status": "resolved",
    "priority": "high",
    "customer_email": "customer@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "resolved_at": "2024-01-15T11:00:00Z"
  }
}
```

#### Update Ticket

**PUT** `/api/tickets/{id}`

Update a ticket.

**Request Body:**
```json
{
  "status": "resolved",
  "priority": "high",
  "assigned_to": "user-id",
  "category": "Technical"
}
```

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "status": "resolved",
    ...
  }
}
```

#### Generate AI Response

**POST** `/api/tickets/{id}/respond`

Generate an AI response for a ticket.

**Request Body (optional):**
```json
{
  "include_knowledge_base": true,
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "ai_response": {
    "id": "uuid",
    "response_text": "AI-generated response...",
    "confidence_score": 0.85,
    "status": "pending_review"
  },
  "conversation": {
    "id": "uuid",
    "message": "AI-generated response...",
    "sender_type": "ai"
  },
  "confidence_score": 0.85,
  "requires_review": false,
  "auto_sent": false
}
```

### Knowledge Base

#### List Knowledge Base Entries

**GET** `/api/knowledge-base`

Get all knowledge base entries or search.

**Query Parameters:**
- `q` (optional) - Search query
- `category` (optional) - Filter by category
- `include_inactive` (optional) - Include inactive entries (default: false)
- `limit` (optional) - Limit results

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "title": "FAQ Entry",
      "content": "Content...",
      "category": "General",
      "tags": ["faq", "account"],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Knowledge Base Entry

**POST** `/api/knowledge-base`

Create a new knowledge base entry.

**Request Body:**
```json
{
  "title": "How to reset password",
  "content": "To reset your password...",
  "category": "Account",
  "tags": ["password", "account"],
  "file_type": "text"
}
```

#### Upload File

**POST** `/api/knowledge-base/upload`

Upload a file (PDF, text, markdown) to create a knowledge base entry.

**Request (FormData):**
- `file` (required) - File to upload
- `title` (required) - Entry title
- `category` (optional) - Category
- `tags` (optional) - Comma-separated tags

### Conversations

#### Get Conversations

**GET** `/api/conversations?ticket_id={ticket_id}`

Get all conversations for a ticket.

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "message": "Message content",
      "sender_type": "customer",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Conversation

**POST** `/api/conversations`

Add a message to a ticket conversation.

**Request Body:**
```json
{
  "ticket_id": "uuid",
  "message": "Response message",
  "sender_type": "human"
}
```

### Feedback

#### Submit Feedback

**POST** `/api/feedback`

Submit feedback for a conversation.

**Request Body:**
```json
{
  "conversation_id": "uuid",
  "rating": 5,
  "feedback_text": "Very helpful response!"
}
```

**Response:**
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "rating": 5,
  "feedback_text": "Very helpful response!",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Get Feedback

**GET** `/api/feedback`

Get feedback with optional filters.

**Query Parameters:**
- `ticket_id` (optional) - Filter by ticket ID
- `conversation_id` (optional) - Filter by conversation ID
- `stats` (optional) - Return statistics instead of feedback list

### Webhooks

#### Receive Webhook

**POST** `/api/webhooks/receive`

Receive webhooks from external systems to create tickets.

**Headers:**
- `X-Webhook-Signature` (optional) - HMAC signature for verification

**Request Body:**
```json
{
  "event": "ticket.create",
  "data": {
    "subject": "Support request",
    "message": "Customer message",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "priority": "medium",
    "category": "Technical"
  }
}
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "ticket_number": "TKT-2024-001",
    ...
  },
  "message": "Ticket created successfully"
}
```

## Webhook Events (Outgoing)

When configured, the system sends webhooks to your configured URL for the following events:

### Available Events

- `ticket.created` - New ticket created
- `ticket.updated` - Ticket updated
- `ticket.resolved` - Ticket resolved
- `ticket.escalated` - Ticket escalated
- `ai.response.generated` - AI response generated
- `ai.response.requires_review` - AI response requires review
- `ai.response.approved` - AI response approved
- `ai.response.rejected` - AI response rejected
- `conversation.added` - New conversation message added
- `feedback.received` - Feedback received

### Webhook Payload Format

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

### Webhook Signature Verification

If a webhook secret is configured, all webhook requests include an `X-Webhook-Signature` header with an HMAC-SHA256 signature.

To verify:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Examples

### cURL Examples

#### Create Ticket
```bash
curl -X POST https://your-domain.com/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "subject": "Support request",
    "initial_message": "I need help with...",
    "customer_email": "customer@example.com"
  }'
```

#### Generate AI Response
```bash
curl -X POST https://your-domain.com/api/tickets/{ticket_id}/respond \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript Example

```javascript
async function createTicket(ticketData) {
  const response = await fetch('https://your-domain.com/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(ticketData)
  });
  
  return await response.json();
}

// Usage
const ticket = await createTicket({
  subject: 'Support request',
  initial_message: 'I need help',
  customer_email: 'customer@example.com'
});
```

### Python Example

```python
import requests

def create_ticket(ticket_data):
    response = requests.post(
        'https://your-domain.com/api/tickets',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        },
        json=ticket_data
    )
    return response.json()

# Usage
ticket = create_ticket({
    'subject': 'Support request',
    'initial_message': 'I need help',
    'customer_email': 'customer@example.com'
})
```

