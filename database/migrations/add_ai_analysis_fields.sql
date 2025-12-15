-- Migration: Add AI analysis fields to tickets table
-- Run this in your Supabase SQL Editor

-- Add AI analysis columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'angry')),
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
ADD COLUMN IF NOT EXISTS urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS urgency_score FLOAT CHECK (urgency_score >= 0 AND urgency_score <= 1),
ADD COLUMN IF NOT EXISTS intent_type TEXT CHECK (intent_type IN ('question', 'complaint', 'request', 'compliment', 'bug_report', 'feature_request', 'refund', 'technical_support', 'account_issue', 'billing', 'other')),
ADD COLUMN IF NOT EXISTS intent_confidence FLOAT CHECK (intent_confidence >= 0 AND intent_confidence <= 1),
ADD COLUMN IF NOT EXISTS conversation_turn_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS conversation_stage TEXT CHECK (conversation_stage IN ('initial', 'clarification', 'resolution', 'follow_up')),
ADD COLUMN IF NOT EXISTS ai_analysis_metadata JSONB DEFAULT '{}';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_sentiment ON tickets(sentiment);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency_level ON tickets(urgency_level);
CREATE INDEX IF NOT EXISTS idx_tickets_intent_type ON tickets(intent_type);
CREATE INDEX IF NOT EXISTS idx_tickets_conversation_stage ON tickets(conversation_stage);

-- Add comment for documentation
COMMENT ON COLUMN tickets.sentiment IS 'AI-analyzed sentiment: positive, neutral, negative, frustrated, angry';
COMMENT ON COLUMN tickets.sentiment_score IS 'Sentiment score from -1 (very negative) to 1 (very positive)';
COMMENT ON COLUMN tickets.urgency_level IS 'AI-analyzed urgency level: low, medium, high, critical';
COMMENT ON COLUMN tickets.urgency_score IS 'Urgency score from 0 (not urgent) to 1 (critical)';
COMMENT ON COLUMN tickets.intent_type IS 'AI-classified intent type';
COMMENT ON COLUMN tickets.intent_confidence IS 'Confidence score for intent classification (0-1)';
COMMENT ON COLUMN tickets.conversation_turn_count IS 'Number of conversation turns';
COMMENT ON COLUMN tickets.conversation_stage IS 'Current stage of conversation: initial, clarification, resolution, follow_up';
COMMENT ON COLUMN tickets.ai_analysis_metadata IS 'Additional AI analysis data (emotions, factors, entities, etc.)';

