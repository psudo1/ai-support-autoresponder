# Backend Services

This directory contains all the backend service modules for the AI Support Autoresponder.

## Services Overview

### Core Services

#### `supabaseClient.ts`
- Exports `supabase` - Client for authenticated user operations
- Exports `supabaseAdmin` - Admin client (bypasses RLS) for server-side operations
- **Usage**: Import in API routes and server components

#### `openaiClient.ts`
- Exports `openai` - OpenAI API client instance
- `calculateCost()` - Calculate API costs based on model and tokens
- `getDefaultModel()` - Get default OpenAI model
- **Usage**: Used by `aiService.ts` for generating responses

#### `ticketService.ts`
- `getAllTickets()` - Get all tickets with optional filters
- `getTicketById()` - Get single ticket by ID
- `getTicketByNumber()` - Get ticket by ticket number
- `createTicket()` - Create a new ticket
- `updateTicket()` - Update ticket details
- `updateTicketStatus()` - Update ticket status
- `assignTicket()` - Assign ticket to a user
- `deleteTicket()` - Delete a ticket
- `getTicketStats()` - Get ticket statistics

#### `knowledgeBaseService.ts`
- `getAllKnowledgeEntries()` - Get all knowledge base entries
- `getKnowledgeEntryById()` - Get single entry by ID
- `searchKnowledgeBase()` - Search by text content
- `getKnowledgeByCategory()` - Get entries by category
- `createKnowledgeEntry()` - Create new entry
- `updateKnowledgeEntry()` - Update entry
- `deleteKnowledgeEntry()` - Delete entry
- `getRelevantKnowledgeForTicket()` - Get relevant entries for a ticket

#### `aiService.ts`
- `generateAIResponse()` - Generate AI response for a ticket
- `saveAIResponse()` - Save AI response to database
- `updateAIResponseStatus()` - Update response status
- `getAIResponseById()` - Get AI response by ID
- `getAIResponsesForTicket()` - Get all responses for a ticket

#### `conversationService.ts`
- `getConversationsByTicketId()` - Get all conversations for a ticket
- `getConversationById()` - Get single conversation
- `createConversation()` - Create new conversation message
- `markConversationAsReviewed()` - Mark as reviewed
- `getConversationHistoryForPrompt()` - Get formatted history for AI

## Utilities

### `src/utils/pdfParser.ts`
- `parsePDF()` - Extract text from PDF buffer
- `parsePDFFile()` - Extract text from PDF file
- `chunkText()` - Chunk text into smaller pieces
- `cleanText()` - Clean and normalize text

## Type Definitions

All types are defined in `src/types/`:
- `ticket.ts` - Ticket types and interfaces
- `knowledge.ts` - Knowledge base types
- `conversation.ts` - Conversation types
- `ai.ts` - AI response types
- `index.ts` - Re-exports all types

## Usage Examples

### Creating a Ticket

```typescript
import { createTicket } from '@/lib/ticketService';

const ticket = await createTicket({
  subject: 'Need help with login',
  initial_message: 'I cannot log into my account',
  customer_email: 'user@example.com',
  priority: 'high',
});
```

### Generating an AI Response

```typescript
import { generateAIResponse, saveAIResponse } from '@/lib/aiService';

// Generate response
const output = await generateAIResponse({
  ticket_id: ticket.id,
  include_knowledge_base: true,
});

// Save to database
const aiResponse = await saveAIResponse(
  ticket.id,
  output,
  prompt,
  conversationId
);
```

### Searching Knowledge Base

```typescript
import { searchKnowledgeBase } from '@/lib/knowledgeBaseService';

const results = await searchKnowledgeBase('password reset', 5);
```

### Getting Conversation History

```typescript
import { getConversationsByTicketId } from '@/lib/conversationService';

const conversations = await getConversationsByTicketId(ticketId);
```

## Error Handling

All services throw errors that should be caught in API routes:

```typescript
try {
  const ticket = await createTicket(input);
} catch (error) {
  // Handle error
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}
```

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (server-side only)
- `OPENAI_API_KEY` - OpenAI API key

## Next Steps

1. Create API routes in `app/api/` that use these services
2. Add error handling and validation
3. Add logging and monitoring
4. Add rate limiting for AI API calls
5. Add caching for frequently accessed data

