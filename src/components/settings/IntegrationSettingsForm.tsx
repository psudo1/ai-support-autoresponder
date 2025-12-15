'use client';

import { useState, useEffect } from 'react';
import type { IntegrationSettings } from '@/types/settings';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function IntegrationSettingsForm() {
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/integrations');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings || getDefaultSettings());
    } catch (err) {
      console.error('Error fetching integration settings:', err);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): IntegrationSettings => ({
    email: {
      enabled: false,
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: '',
    },
    webhooks: {
      enabled: false,
      url: '',
      secret: '',
      events: [],
    },
    slack: {
      enabled: false,
      webhook_url: '',
      channel: '#support',
      events: [],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Integration settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateEmail = (field: keyof IntegrationSettings['email'], value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      email: { ...settings.email, [field]: value },
    });
  };

  const updateWebhooks = (field: keyof IntegrationSettings['webhooks'], value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      webhooks: { ...settings.webhooks, [field]: value },
    });
  };

  const updateSlack = (field: keyof IntegrationSettings['slack'], value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      slack: { ...settings.slack, [field]: value },
    });
  };

  const toggleEvent = (integration: 'webhooks' | 'slack', event: string) => {
    if (!settings) return;
    const currentEvents = settings[integration].events || [];
    const newEvents = currentEvents.includes(event)
      ? currentEvents.filter(e => e !== event)
      : [...currentEvents, event];
    
    if (integration === 'webhooks') {
      updateWebhooks('events', newEvents);
    } else {
      updateSlack('events', newEvents);
    }
  };

  const availableEvents = [
    { id: 'ticket.created', label: 'Ticket Created' },
    { id: 'ticket.resolved', label: 'Ticket Resolved' },
    { id: 'ticket.escalated', label: 'Ticket Escalated' },
    { id: 'ai.response.generated', label: 'AI Response Generated' },
    { id: 'ai.response.requires_review', label: 'AI Response Requires Review' },
  ];

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Email Settings */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Integration</h3>
            <p className="text-sm text-gray-500">Configure SMTP settings for sending emails</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email.enabled}
              onChange={(e) => updateEmail('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.email.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.email.smtp_host}
                onChange={(e) => updateEmail('smtp_host', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.email.smtp_port}
                onChange={(e) => updateEmail('smtp_port', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.email.smtp_user}
                onChange={(e) => updateEmail('smtp_user', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.email.smtp_password}
                onChange={(e) => updateEmail('smtp_password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Email
              </label>
              <input
                type="email"
                value={settings.email.from_email}
                onChange={(e) => updateEmail('from_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Name
              </label>
              <input
                type="text"
                value={settings.email.from_name}
                onChange={(e) => updateEmail('from_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Support Team"
              />
            </div>
          </div>
        )}
      </div>

      {/* Webhooks Settings */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
            <p className="text-sm text-gray-500">Send events to external systems via webhooks</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.webhooks.enabled}
              onChange={(e) => updateWebhooks('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.webhooks.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={settings.webhooks.url}
                onChange={(e) => updateWebhooks('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret
              </label>
              <input
                type="password"
                value={settings.webhooks.secret}
                onChange={(e) => updateWebhooks('secret', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Secret key for webhook verification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events to Send
              </label>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label key={event.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.webhooks.events.includes(event.id)}
                      onChange={() => toggleEvent('webhooks', event.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slack Settings */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Slack Integration</h3>
            <p className="text-sm text-gray-500">Send notifications to Slack channels</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.slack.enabled}
              onChange={(e) => updateSlack('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.slack.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slack Webhook URL
              </label>
              <input
                type="url"
                value={settings.slack.webhook_url}
                onChange={(e) => updateSlack('webhook_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel
              </label>
              <input
                type="text"
                value={settings.slack.channel}
                onChange={(e) => updateSlack('channel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#support"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events to Send
              </label>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label key={event.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.slack.events.includes(event.id)}
                      onChange={() => toggleEvent('slack', event.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
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
            'Save Integration Settings'
          )}
        </button>
      </div>
    </form>
  );
}

