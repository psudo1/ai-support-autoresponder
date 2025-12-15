import { supabaseAdmin } from './supabaseClient';
import type { 
  ResponseTemplate, 
  CreateResponseTemplateInput, 
  UpdateResponseTemplateInput,
  CategoryPrompt,
  CreateCategoryPromptInput,
  UpdateCategoryPromptInput,
} from '../types/customization';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get all response templates
 */
export async function getAllResponseTemplates(filters?: {
  category?: string;
  is_active?: boolean;
}): Promise<ResponseTemplate[]> {
  let query = supabaseAdmin
    .from('response_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get response templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Get response template by ID
 */
export async function getResponseTemplateById(id: string): Promise<ResponseTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from('response_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get response template: ${error.message}`);
  }

  return data;
}

/**
 * Create response template
 */
export async function createResponseTemplate(
  input: CreateResponseTemplateInput,
  createdBy?: string
): Promise<ResponseTemplate> {
  const { data, error } = await supabaseAdmin
    .from('response_templates')
    .insert({
      ...input,
      is_active: input.is_active ?? true,
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create response template: ${error.message}`);
  }

  return data;
}

/**
 * Update response template
 */
export async function updateResponseTemplate(
  id: string,
  input: UpdateResponseTemplateInput
): Promise<ResponseTemplate> {
  const { data, error } = await supabaseAdmin
    .from('response_templates')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update response template: ${error.message}`);
  }

  return data;
}

/**
 * Delete response template
 */
export async function deleteResponseTemplate(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('response_templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete response template: ${error.message}`);
  }
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  let rendered = template;

  // Replace {{variable}} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = value !== null && value !== undefined ? String(value) : '';
    rendered = rendered.replace(new RegExp(placeholder, 'g'), replacement);
  });

  return rendered;
}

/**
 * Get all category prompts
 */
export async function getAllCategoryPrompts(activeOnly: boolean = false): Promise<CategoryPrompt[]> {
  let query = supabaseAdmin
    .from('category_prompts')
    .select('*')
    .order('category', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get category prompts: ${error.message}`);
  }

  return data || [];
}

/**
 * Get category prompt by category
 */
export async function getCategoryPrompt(category: string): Promise<CategoryPrompt | null> {
  const { data, error } = await supabaseAdmin
    .from('category_prompts')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get category prompt: ${error.message}`);
  }

  return data;
}

/**
 * Create or update category prompt
 */
export async function upsertCategoryPrompt(
  input: CreateCategoryPromptInput
): Promise<CategoryPrompt> {
  const { data, error } = await supabaseAdmin
    .from('category_prompts')
    .upsert({
      ...input,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'category',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert category prompt: ${error.message}`);
  }

  return data;
}

/**
 * Update category prompt
 */
export async function updateCategoryPrompt(
  category: string,
  input: UpdateCategoryPromptInput
): Promise<CategoryPrompt> {
  const { data, error } = await supabaseAdmin
    .from('category_prompts')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('category', category)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category prompt: ${error.message}`);
  }

  return data;
}

/**
 * Delete category prompt
 */
export async function deleteCategoryPrompt(category: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('category_prompts')
    .delete()
    .eq('category', category);

  if (error) {
    throw new Error(`Failed to delete category prompt: ${error.message}`);
  }
}

