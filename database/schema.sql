-- AI Support Autoresponder Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For embeddings (if using pgvector)

-- Knowledge Base Table
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT CHECK (file_type IN ('pdf', 'text', 'markdown', 'html')),
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    embedding vector(1536) -- OpenAI embedding dimension
);

-- Tickets Table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    initial_message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'ai_responded', 'human_review', 'resolved', 'escalated', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    source TEXT DEFAULT 'api' CHECK (source IN ('email', 'webhook', 'api', 'chat', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- AI Analysis fields (added for advanced AI features)
    conversation_turn_count INTEGER DEFAULT 1,
    conversation_stage TEXT DEFAULT 'initial' CHECK (conversation_stage IN ('initial', 'clarification', 'resolution', 'follow_up')),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'angry')),
    sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    urgency_score FLOAT CHECK (urgency_score >= 0 AND urgency_score <= 1),
    intent_type TEXT,
    intent_confidence FLOAT CHECK (intent_confidence >= 0 AND intent_confidence <= 1),
    ai_analysis_metadata JSONB
);

-- Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'human')),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ai_confidence FLOAT CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    is_ai_generated BOOLEAN DEFAULT false,
    requires_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Responses Table
CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    prompt_used TEXT NOT NULL,
    model_used TEXT DEFAULT 'gpt-4',
    tokens_used INTEGER,
    cost DECIMAL(10, 6),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    knowledge_sources JSONB DEFAULT '[]', -- Array of knowledge_base IDs
    response_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'sent', 'edited')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating IN (-1, 1, 1, 2, 3, 4, 5)), -- -1/1 for thumbs, 1-5 for stars
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for Performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer_email ON tickets(customer_email);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

CREATE INDEX idx_conversations_ticket_id ON conversations(ticket_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX idx_ai_responses_ticket_id ON ai_responses(ticket_id);
CREATE INDEX idx_ai_responses_status ON ai_responses(status);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_is_active ON knowledge_base(is_active);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

-- Full-text search index for knowledge base
CREATE INDEX idx_knowledge_base_content_search ON knowledge_base USING GIN(to_tsvector('english', content));

-- Vector similarity search index (if using pgvector)
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    LOOP
        new_number := 'TICK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_number = new_number);
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (adjust based on your auth requirements)
-- Allow authenticated users to read all tickets
CREATE POLICY "Users can view tickets" ON tickets
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to create tickets
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their assigned tickets or all tickets if admin
CREATE POLICY "Users can update tickets" ON tickets
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            assigned_to = auth.uid() OR
            EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
        )
    );

-- Similar policies for other tables...
-- (You'll need to customize these based on your specific access control needs)

-- Initial Settings
INSERT INTO settings (key, value) VALUES
    ('ai_model', '"gpt-4"'::jsonb),
    ('ai_temperature', '0.7'::jsonb),
    ('auto_send_threshold', '0.8'::jsonb),
    ('require_review_below', '0.6'::jsonb),
    ('max_tokens', '1000'::jsonb),
    ('brand_voice', '"professional and helpful"'::jsonb)
ON CONFLICT (key) DO NOTHING;

