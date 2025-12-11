# Frontend Components

This directory contains all React components for the AI Support Autoresponder application.

## Component Structure

### Layout Components

#### `layout/DashboardLayout.tsx`
Main dashboard layout with sidebar navigation.

**Features:**
- Fixed sidebar with navigation
- Active route highlighting
- Responsive design

**Usage:**
```tsx
<DashboardLayout>
  {children}
</DashboardLayout>
```

### Ticket Components

#### `tickets/TicketList.tsx`
Displays a list of tickets with filtering and pagination.

**Features:**
- Status filtering
- Priority display
- Ticket number and customer info
- Links to ticket details

**Props:**
- `initialTickets?: Ticket[]` - Initial tickets to display

#### `tickets/TicketDetail.tsx`
Detailed view of a single ticket with conversation.

**Features:**
- Ticket information display
- Generate AI response button
- Conversation history
- Send new messages
- Status and priority display

#### `tickets/AIResponseDisplay.tsx`
Displays AI-generated responses for a ticket.

**Features:**
- Shows AI response status
- Confidence score display
- Token usage and cost
- Knowledge sources used

**Props:**
- `ticketId: string` - Ticket ID to fetch responses for

### Knowledge Base Components

#### `knowledge/KnowledgeBaseList.tsx`
Displays knowledge base entries in a grid layout.

**Features:**
- Search functionality
- Category and tag display
- Grid layout
- Links to individual entries

**Props:**
- `initialEntries?: KnowledgeBase[]` - Initial entries to display

#### `knowledge/KnowledgeBaseUpload.tsx`
Form for uploading files to the knowledge base.

**Features:**
- File upload (PDF, text, markdown)
- Title, category, and tags input
- Form validation
- Upload progress

#### `knowledge/KnowledgeBaseForm.tsx`
Form for creating or editing knowledge base entries.

**Features:**
- Create or edit mode
- Title, content, category, tags
- Form validation
- Save and cancel buttons

**Props:**
- `entry?: KnowledgeBase` - Entry to edit (optional)

## Pages

### Dashboard Pages (`app/dashboard/`)

#### `dashboard/page.tsx`
Main dashboard overview page.

**Features:**
- Statistics cards
- Recent tickets list
- Knowledge base count

#### `dashboard/tickets/page.tsx`
Tickets list page.

#### `dashboard/tickets/[id]/page.tsx`
Individual ticket detail page.

#### `dashboard/knowledge-base/page.tsx`
Knowledge base list page.

#### `dashboard/knowledge-base/new/page.tsx`
New knowledge base entry upload page.

## Styling

All components use Tailwind CSS for styling. The design follows:
- Clean, modern UI
- Consistent color scheme (blue primary, gray secondary)
- Responsive layouts
- Hover states and transitions

## State Management

Components use React hooks for state management:
- `useState` for local state
- `useEffect` for data fetching
- Server components for initial data loading

## Data Fetching

- Server components fetch initial data using the service functions
- Client components use `fetch` API for updates
- Error handling with try/catch blocks

## Next Steps

1. Add loading skeletons
2. Add error boundaries
3. Add toast notifications for user feedback
4. Add form validation with Zod
5. Add optimistic updates
6. Add pagination for large lists
7. Add real-time updates with Supabase subscriptions

