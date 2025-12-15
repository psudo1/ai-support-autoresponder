'use client';

import { useState, useEffect } from 'react';
import type { BrandVoiceSettings } from '@/types/settings';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function BrandVoiceForm() {
  const [settings, setSettings] = useState<BrandVoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/brand-voice');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings || getDefaultSettings());
    } catch (err) {
      console.error('Error fetching brand voice settings:', err);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): BrandVoiceSettings => ({
    tone: 'professional',
    style: '',
    language: 'en',
    greeting_template: 'Hello {{customer_name}},\n\nThank you for reaching out to us.',
    closing_template: 'Best regards,\n{{agent_name}}\n{{company_name}}',
    custom_instructions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/brand-voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Brand voice settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof BrandVoiceSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tone Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Communication Tone
        </label>
        <select
          value={settings.tone}
          onChange={(e) => updateField('tone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
          <option value="custom">Custom</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Select the default tone for AI-generated responses
        </p>
      </div>

      {/* Custom Style */}
      {settings.tone === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Style Description
          </label>
          <textarea
            value={settings.style}
            onChange={(e) => updateField('style', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your brand's communication style (e.g., 'Warm and empathetic, using simple language')"
          />
        </div>
      )}

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <select
          value={settings.language}
          onChange={(e) => updateField('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>
      </div>

      {/* Greeting Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Greeting Template
        </label>
        <textarea
          value={settings.greeting_template}
          onChange={(e) => updateField('greeting_template', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Hello {{customer_name}},&#10;&#10;Thank you for reaching out to us."
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables: {'{{customer_name}}'}, {'{{ticket_number}}'}, {'{{agent_name}}'}
        </p>
      </div>

      {/* Closing Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Closing Template
        </label>
        <textarea
          value={settings.closing_template}
          onChange={(e) => updateField('closing_template', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Best regards,&#10;{{agent_name}}&#10;{{company_name}}"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables: {'{{agent_name}}'}, {'{{company_name}}'}, {'{{support_email}}'}
        </p>
      </div>

      {/* Custom Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Instructions
        </label>
        <textarea
          value={settings.custom_instructions}
          onChange={(e) => updateField('custom_instructions', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional instructions for AI responses (e.g., 'Always apologize for inconveniences', 'Use bullet points for lists', 'Keep responses under 200 words')"
        />
        <p className="mt-1 text-xs text-gray-500">
          These instructions will be included in every AI prompt to guide response generation
        </p>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="whitespace-pre-wrap">
            {settings.greeting_template.replace(/\{\{customer_name\}\}/g, 'John Doe').replace(/\{\{ticket_number\}\}/g, '#12345')}
          </div>
          <div className="text-gray-500 italic">[AI-generated response content would appear here]</div>
          <div className="whitespace-pre-wrap">
            {settings.closing_template.replace(/\{\{agent_name\}\}/g, 'Support Team').replace(/\{\{company_name\}\}/g, 'Your Company')}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Saving...
            </span>
          ) : (
            'Save Brand Voice Settings'
          )}
        </button>
      </div>
    </form>
  );
}

