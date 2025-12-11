# How to Verify Database Schema

This guide shows you multiple ways to verify that all tables were created correctly in Supabase.

## Method 1: Supabase Dashboard (Visual - Easiest)

1. **Open your Supabase project dashboard**
2. **Navigate to Table Editor** (left sidebar)
3. **You should see 6 tables listed:**
   - ✅ `knowledge_base`
   - ✅ `tickets`
   - ✅ `conversations`
   - ✅ `ai_responses`
   - ✅ `feedback`
   - ✅ `settings`

4. **Click on each table** to verify:
   - Columns are present
   - Data types look correct
   - Primary keys are set

## Method 2: SQL Query (Quick Check)

Run this in **SQL Editor**:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'knowledge_base',
    'tickets', 
    'conversations', 
    'ai_responses', 
    'feedback', 
    'settings'
  )
ORDER BY table_name;
```

**Expected Result:** 6 rows

## Method 3: Comprehensive Verification

Run the complete verification script from `database/verify_schema.sql` in the SQL Editor. This will check:

- ✅ All 6 tables exist
- ✅ All columns are correct
- ✅ Foreign keys are set up
- ✅ Indexes are created
- ✅ Triggers are working
- ✅ Functions exist
- ✅ Row Level Security (RLS) is enabled
- ✅ Initial settings are populated

## Method 4: Test Insert (Functional Test)

Test that the schema works by creating a test ticket:

```sql
-- Insert a test ticket
INSERT INTO tickets (subject, initial_message, customer_email, status, priority)
VALUES ('Test Ticket', 'This is a test message', 'test@example.com', 'new', 'medium')
RETURNING id, ticket_number, subject, created_at;
```

**Expected:** Should return a new ticket with an auto-generated `ticket_number` like `TICK-20240101-1234`

Then verify it was created:

```sql
SELECT * FROM tickets WHERE customer_email = 'test@example.com';
```

Clean up (optional):

```sql
DELETE FROM tickets WHERE customer_email = 'test@example.com';
```

## What to Check for Each Table

### ✅ knowledge_base
- Should have columns: `id`, `title`, `content`, `file_url`, `file_type`, `category`, `tags`, `created_at`, `updated_at`, `is_active`
- `id` should be UUID primary key
- `tags` should be array type

### ✅ tickets
- Should have columns: `id`, `ticket_number`, `subject`, `initial_message`, `status`, `priority`, `category`, `customer_email`, `customer_name`, `source`, `created_at`, `updated_at`, `resolved_at`, `assigned_to`
- `ticket_number` should be unique
- `status` should have check constraint

### ✅ conversations
- Should have columns: `id`, `ticket_id`, `message`, `sender_type`, `sender_id`, `ai_confidence`, `is_ai_generated`, `requires_review`, `reviewed_by`, `reviewed_at`, `created_at`
- `ticket_id` should be foreign key to `tickets.id`

### ✅ ai_responses
- Should have columns: `id`, `ticket_id`, `conversation_id`, `prompt_used`, `model_used`, `tokens_used`, `cost`, `confidence_score`, `knowledge_sources`, `response_text`, `status`, `created_at`
- `ticket_id` should be foreign key to `tickets.id`

### ✅ feedback
- Should have columns: `id`, `conversation_id`, `rating`, `feedback_text`, `created_at`
- `conversation_id` should be foreign key to `conversations.id`

### ✅ settings
- Should have columns: `id`, `key`, `value`, `updated_at`, `updated_by`
- Should have at least 6 initial settings rows

## Common Issues

### ❌ Tables not showing up
- **Solution**: Make sure you ran the entire `schema.sql` file, not just part of it
- Check for any error messages in the SQL Editor

### ❌ Foreign key errors
- **Solution**: Tables must be created in order. Re-run the schema if needed

### ❌ RLS policies missing
- **Solution**: The schema includes RLS setup. If policies are missing, you may need to create them manually based on your auth requirements

### ❌ Extensions not found
- **Solution**: 
  - `uuid-ossp` should be available by default
  - `vector` extension might not be available on all Supabase plans (optional for embeddings)

## Next Steps

Once verified:
1. ✅ All tables exist and are correct
2. ✅ Test insert works
3. ✅ Move on to setting up environment variables
4. ✅ Start building the application

For detailed verification queries, see `database/verify_schema.sql`

