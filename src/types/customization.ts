export interface ResponseTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string | null;
  content: string;
  variables?: string[]; // e.g., ['customer_name', 'ticket_number', 'agent_name']
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateResponseTemplateInput {
  name: string;
  description?: string;
  category?: string | null;
  content: string;
  variables?: string[];
  is_active?: boolean;
}

export interface UpdateResponseTemplateInput {
  name?: string;
  description?: string;
  category?: string | null;
  content?: string;
  variables?: string[];
  is_active?: boolean;
}

export interface CategoryPrompt {
  category: string;
  prompt_template: string;
  system_message?: string;
  instructions?: string;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPromptInput {
  category: string;
  prompt_template: string;
  system_message?: string;
  instructions?: string;
  variables?: string[];
  is_active?: boolean;
}

export interface UpdateCategoryPromptInput {
  prompt_template?: string;
  system_message?: string;
  instructions?: string;
  variables?: string[];
  is_active?: boolean;
}

export interface BrandingSettings {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  company_name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  footer_text?: string | null;
  custom_css?: string | null;
}

export type SupportedLanguage = 
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ar' // Arabic
  | 'pt' // Portuguese
  | 'it' // Italian
  | 'ru' // Russian
  | 'nl' // Dutch
  | 'pl' // Polish
  | 'sv' // Swedish
  | 'da' // Danish
  | 'fi' // Finnish
  | 'no' // Norwegian
  | 'tr' // Turkish
  | 'hi' // Hindi
  | 'th' // Thai;

export interface LanguageSettings {
  default_language: SupportedLanguage;
  supported_languages: SupportedLanguage[];
  auto_detect_language: boolean;
  translation_enabled: boolean;
}

