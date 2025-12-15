-- Migration: Add customization tables
-- Run this in your Supabase SQL Editor

-- Response Templates Table
CREATE TABLE IF NOT EXISTS response_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Category Prompts Table
CREATE TABLE IF NOT EXISTS category_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL UNIQUE,
    prompt_template TEXT NOT NULL,
    system_message TEXT,
    instructions TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branding Settings (stored in settings table as JSONB)
-- No new table needed, will use settings table with key='branding_settings'

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON response_templates(category);
CREATE INDEX IF NOT EXISTS idx_response_templates_active ON response_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_category_prompts_category ON category_prompts(category);
CREATE INDEX IF NOT EXISTS idx_category_prompts_active ON category_prompts(is_active);

-- Add updated_at trigger for response_templates
CREATE OR REPLACE FUNCTION update_response_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_response_templates_updated_at_trigger
    BEFORE UPDATE ON response_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_response_templates_updated_at();

-- Add updated_at trigger for category_prompts
CREATE OR REPLACE FUNCTION update_category_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_prompts_updated_at_trigger
    BEFORE UPDATE ON category_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_category_prompts_updated_at();

-- Enable RLS
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view response templates" ON response_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage response templates" ON response_templates
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') OR
            EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'agent')
        )
    );

CREATE POLICY "Users can view category prompts" ON category_prompts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage category prompts" ON category_prompts
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

