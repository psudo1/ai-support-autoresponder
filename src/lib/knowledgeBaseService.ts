import { supabaseAdmin } from './supabaseClient';
import type { 
  KnowledgeBase, 
  CreateKnowledgeInput, 
  UpdateKnowledgeInput,
  KnowledgeSearchResult 
} from '../types';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get all knowledge base entries
 */
export async function getAllKnowledgeEntries(
  includeInactive: boolean = false
): Promise<KnowledgeBase[]> {
  let query = supabaseAdmin
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch knowledge entries: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single knowledge base entry by ID
 */
export async function getKnowledgeEntryById(id: string): Promise<KnowledgeBase | null> {
  const { data, error } = await supabaseAdmin
    .from('knowledge_base')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch knowledge entry: ${error.message}`);
  }

  return data;
}

/**
 * Search knowledge base by text content
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 10,
  category?: string
): Promise<KnowledgeSearchResult[]> {
  let dbQuery = supabaseAdmin
    .from('knowledge_base')
    .select('*')
    .eq('is_active', true)
    .textSearch('content', query, {
      type: 'websearch',
      config: 'english'
    })
    .limit(limit);

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(`Failed to search knowledge base: ${error.message}`);
  }

  return data || [];
}

/**
 * Search knowledge base by category
 */
export async function getKnowledgeByCategory(category: string): Promise<KnowledgeBase[]> {
  const { data, error } = await supabaseAdmin
    .from('knowledge_base')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch knowledge by category: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new knowledge base entry
 */
export async function createKnowledgeEntry(
  input: CreateKnowledgeInput
): Promise<KnowledgeBase> {
  const { data, error } = await supabaseAdmin
    .from('knowledge_base')
    .insert({
      title: input.title,
      content: input.content,
      file_url: input.file_url || null,
      file_type: input.file_type || null,
      category: input.category || null,
      tags: input.tags || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge entry: ${error.message}`);
  }

  return data;
}

/**
 * Update a knowledge base entry
 */
export async function updateKnowledgeEntry(
  id: string,
  input: UpdateKnowledgeInput
): Promise<KnowledgeBase> {
  const { data, error } = await supabaseAdmin
    .from('knowledge_base')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update knowledge entry: ${error.message}`);
  }

  return data;
}

/**
 * Delete a knowledge base entry
 */
export async function deleteKnowledgeEntry(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('knowledge_base')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete knowledge entry: ${error.message}`);
  }
}

/**
 * Get relevant knowledge base entries for a ticket
 * Uses text search to find the most relevant entries
 */
export async function getRelevantKnowledgeForTicket(
  ticketMessage: string,
  limit: number = 5
): Promise<KnowledgeBase[]> {
  // Extract keywords from the ticket message
  const keywords = extractKeywords(ticketMessage);
  
  // Search for relevant knowledge entries
  const results = await searchKnowledgeBase(keywords.join(' '), limit);
  
  return results;
}

/**
 * Extract keywords from text for searching
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - can be enhanced with NLP
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out short words

  // Remove common stop words
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were',
    'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'now'
  ]);

  const keywords = words
    .filter(word => !stopWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords

  return keywords;
}

