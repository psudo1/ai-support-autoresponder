'use client';

import { useState, useEffect } from 'react';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { AISettings } from '@/types';

export default function AISettingsForm() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/ai');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);

      const response = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('AI settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Failed to load settings</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Auto-send Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auto-send Threshold
        </label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={settings.auto_send_threshold}
          onChange={(e) =>
            setSettings({
              ...settings,
              auto_send_threshold: parseFloat(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Responses with confidence score ≥ this value will be automatically sent (0.0 - 1.0)
        </p>
      </div>

      {/* Require Review Below */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Require Review Below
        </label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={settings.require_review_below}
          onChange={(e) =>
            setSettings({
              ...settings,
              require_review_below: parseFloat(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Responses with confidence score &lt; this value will always require review (0.0 - 1.0)
        </p>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Model
        </label>
        <select
          value={settings.model}
          onChange={(e) =>
            setSettings({
              ...settings,
              model: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature
        </label>
        <input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) =>
            setSettings({
              ...settings,
              temperature: parseFloat(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Controls randomness (0.0 = deterministic, 2.0 = very creative)
        </p>
      </div>

      {/* Max Tokens */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Tokens
        </label>
        <input
          type="number"
          min="100"
          max="4000"
          step="100"
          value={settings.max_tokens}
          onChange={(e) =>
            setSettings({
              ...settings,
              max_tokens: parseInt(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Brand Voice */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand Voice
        </label>
        <textarea
          value={settings.brand_voice}
          onChange={(e) =>
            setSettings({
              ...settings,
              brand_voice: e.target.value,
            })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., professional and helpful"
        />
        <p className="mt-1 text-sm text-gray-500">
          Describes the tone and style for AI responses
        </p>
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
            'Save AI Settings'
          )}
        </button>
      </div>
    </form>
  );
}

