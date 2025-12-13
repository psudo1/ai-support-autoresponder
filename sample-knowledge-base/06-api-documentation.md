# API Documentation

## Getting Started

### Authentication

All API requests require authentication using an API key. Include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

### Base URL

```
https://api.company.com/v1
```

### Rate Limits

- Free Plan: 100 requests per hour
- Pro Plan: 1,000 requests per hour
- Enterprise: Custom limits

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Endpoints

### Create Ticket

**POST** `/tickets`

Create a new support ticket.

**Request Body:**
```json
{
  "subject": "Ticket subject",
  "message": "Ticket message",
  "priority": "medium",
  "category": "technical"
}
```

**Response:**
```json
{
  "id": "ticket_123",
  "subject": "Ticket subject",
  "status": "open",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Ticket

**GET** `/tickets/{id}`

Retrieve a specific ticket.

**Response:**
```json
{
  "id": "ticket_123",
  "subject": "Ticket subject",
  "status": "open",
  "messages": [...]
}
```

### List Tickets

**GET** `/tickets`

List all tickets with optional filters.

**Query Parameters:**
- `status`: Filter by status (open, closed, pending)
- `priority`: Filter by priority (low, medium, high)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

## Error Codes

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Invalid or missing API key
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

## Webhooks

Subscribe to webhook events to receive real-time notifications.

**Available Events:**
- `ticket.created`
- `ticket.updated`
- `ticket.closed`

**Webhook Payload:**
```json
{
  "event": "ticket.created",
  "data": {
    "id": "ticket_123",
    "subject": "New ticket"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDKs

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Ruby
- PHP

See our GitHub repository for SDK documentation and examples.

