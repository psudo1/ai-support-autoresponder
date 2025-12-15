import { supabaseAdmin } from './supabaseClient';
import type { BrandingSettings, LanguageSettings, SupportedLanguage } from '../types/customization';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

/**
 * Get branding settings
 */
export async function getBrandingSettings(): Promise<BrandingSettings> {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'branding_settings')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get branding settings: ${error.message}`);
  }

  return (data?.value as BrandingSettings) || {
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    company_name: null,
    support_email: null,
    support_phone: null,
    footer_text: null,
    custom_css: null,
  };
}

/**
 * Update branding settings
 */
export async function updateBrandingSettings(
  settings: Partial<BrandingSettings>,
  updatedBy?: string
): Promise<BrandingSettings> {
  const currentSettings = await getBrandingSettings();
  const updatedSettings = { ...currentSettings, ...settings };

  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({
      key: 'branding_settings',
      value: updatedSettings,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || null,
    }, {
      onConflict: 'key',
    })
    .select('value')
    .single();

  if (error) {
    throw new Error(`Failed to update branding settings: ${error.message}`);
  }

  return data.value as BrandingSettings;
}

/**
 * Get language settings
 */
export async function getLanguageSettings(): Promise<LanguageSettings> {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'language_settings')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get language settings: ${error.message}`);
  }

  const defaults: LanguageSettings = {
    default_language: 'en',
    supported_languages: ['en'],
    auto_detect_language: false,
    translation_enabled: false,
  };

  return (data?.value as LanguageSettings) || defaults;
}

/**
 * Update language settings
 */
export async function updateLanguageSettings(
  settings: Partial<LanguageSettings>,
  updatedBy?: string
): Promise<LanguageSettings> {
  const currentSettings = await getLanguageSettings();
  const updatedSettings = { ...currentSettings, ...settings };

  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({
      key: 'language_settings',
      value: updatedSettings,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || null,
    }, {
      onConflict: 'key',
    })
    .select('value')
    .single();

  if (error) {
    throw new Error(`Failed to update language settings: ${error.message}`);
  }

  return data.value as LanguageSettings;
}

/**
 * Translate text (placeholder - would integrate with translation service)
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<string> {
  // TODO: Integrate with translation service (Google Translate API, DeepL, etc.)
  // For now, return original text
  console.warn('Translation not yet implemented. Returning original text.');
  return text;
}

/**
 * Detect language from text
 */
export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  // TODO: Integrate with language detection service
  // For now, default to English
  console.warn('Language detection not yet implemented. Defaulting to English.');
  return 'en';
}

