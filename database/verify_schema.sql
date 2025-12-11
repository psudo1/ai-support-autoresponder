-- Verification Queries for Database Schema
-- Run these queries in Supabase SQL Editor to verify your schema is set up correctly

-- ============================================
-- 1. Check if all tables exist
-- ============================================
SELECT 
    table_name,
    table_type
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

-- Expected result: 6 rows (one for each table)

-- ============================================
-- 2. Verify table structures (columns)
-- ============================================

-- Knowledge Base Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'knowledge_base'
ORDER BY ordinal_position;

-- Tickets Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tickets'
ORDER BY ordinal_position;

-- Conversations Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'conversations'
ORDER BY ordinal_position;

-- AI Responses Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_responses'
ORDER BY ordinal_position;

-- Feedback Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'feedback'
ORDER BY ordinal_position;

-- Settings Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'settings'
ORDER BY ordinal_position;

-- ============================================
-- 3. Check Foreign Key Constraints
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('tickets', 'conversations', 'ai_responses', 'feedback', 'settings')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 4. Check Indexes
-- ============================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')
ORDER BY tablename, indexname;

-- ============================================
-- 5. Check Triggers
-- ============================================
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND event_object_table IN ('knowledge_base', 'tickets', 'settings')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 6. Check Functions
-- ============================================
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('update_updated_at_column', 'generate_ticket_number', 'set_ticket_number')
ORDER BY routine_name;

-- ============================================
-- 7. Check Row Level Security (RLS)
-- ============================================
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')
ORDER BY tablename;

-- Expected: rowsecurity should be 't' (true) for all tables

-- ============================================
-- 8. Check RLS Policies
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')
ORDER BY tablename, policyname;

-- ============================================
-- 9. Verify Initial Settings
-- ============================================
SELECT
    key,
    value,
    updated_at
FROM settings
ORDER BY key;

-- Expected: Should have at least 6 settings rows

-- ============================================
-- 10. Test Ticket Number Generation
-- ============================================
-- This should generate a unique ticket number
SELECT generate_ticket_number() AS test_ticket_number;

-- ============================================
-- 11. Quick Test: Insert and Verify
-- ============================================
-- Test inserting a ticket (will auto-generate ticket_number)
INSERT INTO tickets (subject, initial_message, customer_email, status, priority)
VALUES ('Test Ticket', 'This is a test message', 'test@example.com', 'new', 'medium')
RETURNING id, ticket_number, subject, created_at;

-- Check if the ticket was created
SELECT * FROM tickets WHERE customer_email = 'test@example.com';

-- Clean up test data (optional)
-- DELETE FROM tickets WHERE customer_email = 'test@example.com';

-- ============================================
-- 12. Check Extensions
-- ============================================
SELECT
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector');

-- Expected: Should show both extensions if vector extension is available
-- Note: vector extension might not be available on all Supabase plans

-- ============================================
-- Summary Query: All-in-One Check
-- ============================================
SELECT 
    'Tables' AS check_type,
    COUNT(*) AS count,
    string_agg(table_name, ', ' ORDER BY table_name) AS items
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')

UNION ALL

SELECT 
    'Indexes' AS check_type,
    COUNT(*) AS count,
    string_agg(indexname, ', ' ORDER BY indexname) AS items
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')

UNION ALL

SELECT 
    'Triggers' AS check_type,
    COUNT(*) AS count,
    string_agg(trigger_name, ', ' ORDER BY trigger_name) AS items
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND event_object_table IN ('knowledge_base', 'tickets', 'settings')

UNION ALL

SELECT 
    'Functions' AS check_type,
    COUNT(*) AS count,
    string_agg(routine_name, ', ' ORDER BY routine_name) AS items
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('update_updated_at_column', 'generate_ticket_number', 'set_ticket_number')

UNION ALL

SELECT 
    'RLS Enabled Tables' AS check_type,
    COUNT(*) AS count,
    string_agg(tablename, ', ' ORDER BY tablename) AS items
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')
    AND rowsecurity = true

UNION ALL

SELECT 
    'Initial Settings' AS check_type,
    COUNT(*) AS count,
    string_agg(key, ', ' ORDER BY key) AS items
FROM settings;

