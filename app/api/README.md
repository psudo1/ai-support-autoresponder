# API Routes Documentation

This directory contains all API routes for the AI Support Autoresponder application.

## API Endpoints

### Tickets

#### `GET /api/tickets`
Get all tickets with optional filters.

**Query Parameters:**
- `status` (optional) - Filter by status: `new`, `ai_responded`, `human_review`, `resolved`, `escalated`, `closed`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`, `urgent`
- `assigned_to` (optional) - Filter by assigned user ID
- `customer_email` (optional) - Filter by customer email
- `limit` (optional) - Limit number of results
- `offset` (optional) - Offset for pagination

**Response:**
```json
{
  "tickets": [...]
}
```

#### `POST /api/tickets`
Create a new ticket.

**Request Body:**
```json
{
  "subject": "Ticket subject",
  "initial_message": "Customer message",
  "customer_email": "customer@example.com",
  "customer_name": "Customer Name (optional)",
  "priority": "medium (optional)",
  "category": "Category (optional)",
  "source": "api (optional)"
}
```

**Response:**
```json
{
  "ticket": {...}
}
```

#### `GET /api/tickets/[id]`
Get a single ticket by ID.

**Response:**
```json
{
  "ticket": {...}
}
```

#### `PUT /api/tickets/[id]`
Update a ticket.

**Request Body:**
```json
{
  "status": "resolved (optional)",
  "priority": "high (optional)",
  "assigned_to": "user-id (optional)",
  "category": "Category (optional)"
}
```

**Response:**
```json
{
  "ticket": {...}
}
```

#### `DELETE /api/tickets/[id]`
Delete a ticket.

**Response:**
```json
{
  "message": "Ticket deleted successfully"
}
```

#### `POST /api/tickets/[id]/respond`
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
  "ai_response": {...},
  "conversation": {...},
  "confidence_score": 0.85,
  "requires_review": false
}
```

### Knowledge Base

#### `GET /api/knowledge-base`
Get all knowledge base entries or search.

**Query Parameters:**
- `q` (optional) - Search query
- `category` (optional) - Filter by category
- `include_inactive` (optional) - Include inactive entries (default: false)
- `limit` (optional) - Limit search results

**Response:**
```json
{
  "entries": [...]
}
```

#### `POST /api/knowledge-base`
Create a new knowledge base entry.

**Request Body:**
```json
{
  "title": "Entry title",
  "content": "Entry content",
  "file_url": "URL (optional)",
  "file_type": "pdf|text|markdown|html (optional)",
  "category": "Category (optional)",
  "tags": ["tag1", "tag2"] (optional)
}
```

**Response:**
```json
{
  "entry": {...}
}
```

#### `GET /api/knowledge-base/[id]`
Get a single knowledge base entry by ID.

**Response:**
```json
{
  "entry": {...}
}
```

#### `PUT /api/knowledge-base/[id]`
Update a knowledge base entry.

**Request Body:**
```json
{
  "title": "Updated title (optional)",
  "content": "Updated content (optional)",
  "category": "Category (optional)",
  "tags": ["tag1", "tag2"] (optional),
  "is_active": true (optional)
}
```

**Response:**
```json
{
  "entry": {...}
}
```

#### `DELETE /api/knowledge-base/[id]`
Delete a knowledge base entry.

**Response:**
```json
{
  "message": "Knowledge base entry deleted successfully"
}
```

#### `POST /api/knowledge-base/upload`
Upload a file (PDF, text, markdown) and create a knowledge base entry.

**Request (FormData):**
- `file` (required) - File to upload
- `title` (required) - Entry title
- `category` (optional) - Category
- `tags` (optional) - Comma-separated tags

**Response:**
```json
{
  "entry": {...},
  "message": "File uploaded and processed successfully"
}
```

### Conversations

#### `GET /api/conversations`
Get conversations for a ticket.

**Query Parameters:**
- `ticket_id` (required) - Ticket ID

**Response:**
```json
{
  "conversations": [...]
}
```

#### `POST /api/conversations`
Create a new conversation message.

**Request Body:**
```json
{
  "ticket_id": "ticket-id",
  "message": "Message content",
  "sender_type": "customer|ai|human",
  "sender_id": "user-id (optional)",
  "ai_confidence": 0.85 (optional),
  "is_ai_generated": false (optional),
  "requires_review": false (optional)
}
```

**Response:**
```json
{
  "conversation": {...}
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Usage Examples

### Create a Ticket

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Need help with login",
    "initial_message": "I cannot log into my account",
    "customer_email": "user@example.com",
    "priority": "high"
  }'
```

### Generate AI Response

```bash
curl -X POST http://localhost:3000/api/tickets/[ticket-id]/respond \
  -H "Content-Type: application/json"
```

### Upload Knowledge Base File

```bash
curl -X POST http://localhost:3000/api/knowledge-base/upload \
  -F "file=@document.pdf" \
  -F "title=Product Documentation" \
  -F "category=products"
```

### Search Knowledge Base

```bash
curl "http://localhost:3000/api/knowledge-base?q=password+reset&limit=5"
```

## Authentication

Currently, all endpoints use the Supabase admin client which bypasses RLS. In production, you should:

1. Add authentication middleware
2. Use user-specific Supabase clients
3. Implement proper authorization checks
4. Add rate limiting

## Next Steps

- Add authentication middleware
- Add request validation with Zod
- Add rate limiting
- Add API documentation with OpenAPI/Swagger
- Add request logging and monitoring

