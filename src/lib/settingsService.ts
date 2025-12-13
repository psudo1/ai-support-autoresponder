import { supabaseAdmin } from './supabaseClient';
import type { AISettings } from '../types';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get AI settings from database
 */
export async function getAISettings(): Promise<AISettings> {
  // Default settings
  const defaults: AISettings = {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000,
    auto_send_threshold: 0.8,
    require_review_below: 0.6,
    brand_voice: 'professional and helpful',
  };

  try {
    // Fetch all AI settings
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['ai_model', 'ai_temperature', 'max_tokens', 'auto_send_threshold', 'require_review_below', 'brand_voice']);

    if (error || !data || data.length === 0) {
      return defaults;
    }

    // Build settings object from database values
    const settings: Partial<AISettings> = {};
    
    data.forEach((item: { key: string; value: any }) => {
      // JSONB values come as objects or primitives directly
      let value = item.value;
      
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if parsing fails
        }
      }
      
      switch (item.key) {
        case 'ai_model':
          settings.model = (typeof value === 'string' ? value : String(value)) || defaults.model;
          break;
        case 'ai_temperature':
          settings.temperature = typeof value === 'number' ? value : (parseFloat(String(value)) || defaults.temperature);
          break;
        case 'max_tokens':
          settings.max_tokens = typeof value === 'number' ? value : (parseInt(String(value)) || defaults.max_tokens);
          break;
        case 'auto_send_threshold':
          settings.auto_send_threshold = typeof value === 'number' ? value : (parseFloat(String(value)) || defaults.auto_send_threshold);
          break;
        case 'require_review_below':
          settings.require_review_below = typeof value === 'number' ? value : (parseFloat(String(value)) || defaults.require_review_below);
          break;
        case 'brand_voice':
          settings.brand_voice = (typeof value === 'string' ? value : String(value)) || defaults.brand_voice;
          break;
      }
    });

    return { ...defaults, ...settings };
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return defaults;
  }
}

/**
 * Update AI settings
 */
export async function updateAISettings(
  settings: Partial<AISettings>,
  updatedBy?: string
): Promise<void> {
  const updates = [];

  if (settings.model !== undefined) {
    updates.push({
      key: 'ai_model',
      value: settings.model,
      updated_by: updatedBy || null,
    });
  }

  if (settings.temperature !== undefined) {
    updates.push({
      key: 'ai_temperature',
      value: settings.temperature,
      updated_by: updatedBy || null,
    });
  }

  if (settings.max_tokens !== undefined) {
    updates.push({
      key: 'max_tokens',
      value: settings.max_tokens,
      updated_by: updatedBy || null,
    });
  }

  if (settings.auto_send_threshold !== undefined) {
    updates.push({
      key: 'auto_send_threshold',
      value: settings.auto_send_threshold,
      updated_by: updatedBy || null,
    });
  }

  if (settings.require_review_below !== undefined) {
    updates.push({
      key: 'require_review_below',
      value: settings.require_review_below,
      updated_by: updatedBy || null,
    });
  }

  if (settings.brand_voice !== undefined) {
    updates.push({
      key: 'brand_voice',
      value: settings.brand_voice,
      updated_by: updatedBy || null,
    });
  }

  // Upsert each setting
  for (const update of updates) {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: update.key,
        value: update.value,
        updated_by: update.updated_by,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      throw new Error(`Failed to update setting ${update.key}: ${error.message}`);
    }
  }
}

