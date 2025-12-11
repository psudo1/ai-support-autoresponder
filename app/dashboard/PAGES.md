# Dashboard Pages

Complete list of all pages in the dashboard application.

## Page Structure

```
app/dashboard/
├── page.tsx                          # Dashboard overview
├── layout.tsx                         # Dashboard layout wrapper
├── tickets/
│   ├── page.tsx                       # Tickets list
│   ├── new/
│   │   └── page.tsx                   # Create new ticket
│   └── [id]/
│       ├── page.tsx                   # Ticket detail
│       └── not-found.tsx              # Ticket not found
└── knowledge-base/
    ├── page.tsx                       # Knowledge base list
    ├── new/
    │   └── page.tsx                   # Upload file
    ├── create/
    │   └── page.tsx                   # Create entry (manual)
    └── [id]/
        ├── page.tsx                   # Edit knowledge base entry
        └── not-found.tsx              # Entry not found
```

## Pages Overview

### Dashboard Overview
**Route:** `/dashboard`  
**File:** `app/dashboard/page.tsx`

- Statistics cards (total tickets, new tickets, resolved, knowledge base count)
- Recent tickets list
- Server-side data fetching

### Tickets

#### Tickets List
**Route:** `/dashboard/tickets`  
**File:** `app/dashboard/tickets/page.tsx`

- Displays all tickets
- Uses `TicketList` component
- Server-side initial data loading

#### Create New Ticket
**Route:** `/dashboard/tickets/new`  
**File:** `app/dashboard/tickets/new/page.tsx`

- Form to create a new ticket
- Uses `TicketForm` component
- Client-side form handling

#### Ticket Detail
**Route:** `/dashboard/tickets/[id]`  
**File:** `app/dashboard/tickets/[id]/page.tsx`

- Detailed view of a single ticket
- Uses `TicketDetail` component
- Server-side ticket validation
- Shows 404 if ticket not found

### Knowledge Base

#### Knowledge Base List
**Route:** `/dashboard/knowledge-base`  
**File:** `app/dashboard/knowledge-base/page.tsx`

- Displays all knowledge base entries
- Uses `KnowledgeBaseList` component
- Server-side initial data loading

#### Upload File
**Route:** `/dashboard/knowledge-base/new`  
**File:** `app/dashboard/knowledge-base/new/page.tsx`

- Upload PDF, text, or markdown files
- Uses `KnowledgeBaseUpload` component
- File processing and parsing

#### Create Entry (Manual)
**Route:** `/dashboard/knowledge-base/create`  
**File:** `app/dashboard/knowledge-base/create/page.tsx`

- Manual entry creation form
- Uses `KnowledgeBaseForm` component
- Text-based content input

#### Edit Entry
**Route:** `/dashboard/knowledge-base/[id]`  
**File:** `app/dashboard/knowledge-base/[id]/page.tsx`

- Edit existing knowledge base entry
- Uses `KnowledgeBaseForm` component with entry data
- Server-side entry validation
- Shows 404 if entry not found

## Navigation Flow

```
Dashboard
  ├─→ Tickets List
  │     ├─→ Create Ticket
  │     └─→ Ticket Detail
  │           └─→ Generate AI Response
  └─→ Knowledge Base
        ├─→ Upload File
        ├─→ Create Entry
        └─→ Edit Entry
```

## Features

### Server Components
- Dashboard overview page
- Tickets list page
- Knowledge base list page
- Ticket detail page (with validation)
- Knowledge base edit page (with validation)

### Client Components
- Ticket form (create)
- Ticket detail (interactive)
- Knowledge base forms
- File upload

### Error Handling
- 404 pages for missing tickets
- 404 pages for missing knowledge base entries
- Error boundaries (to be added)

## Next Steps

1. Add loading states
2. Add error boundaries
3. Add toast notifications
4. Add pagination
5. Add search functionality
6. Add filters and sorting
7. Add real-time updates

