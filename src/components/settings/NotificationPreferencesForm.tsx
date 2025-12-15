'use client';

import { useState, useEffect } from 'react';
import type { NotificationPreferences } from '@/types/settings';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data.preferences || getDefaultPreferences());
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setPreferences(getDefaultPreferences());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPreferences = (): NotificationPreferences => ({
    email: {
      ticket_created: false,
      ticket_resolved: true,
      ticket_escalated: true,
      ai_response_generated: false,
      ai_response_requires_review: true,
      daily_summary: false,
    },
    in_app: {
      ticket_assigned: true,
      ticket_escalated: true,
      ai_response_requires_review: true,
    },
    browser: {
      ticket_escalated: true,
      ai_response_requires_review: true,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateEmail = (field: keyof NotificationPreferences['email'], value: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      email: { ...preferences.email, [field]: value },
    });
  };

  const updateInApp = (field: keyof NotificationPreferences['in_app'], value: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      in_app: { ...preferences.in_app, [field]: value },
    });
  };

  const updateBrowser = (field: keyof NotificationPreferences['browser'], value: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      browser: { ...preferences.browser, [field]: value },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!preferences) {
    return <div>Failed to load preferences</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Email Notifications */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Ticket Created</span>
              <p className="text-xs text-gray-500">Get notified when a new ticket is created</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email.ticket_created}
              onChange={(e) => updateEmail('ticket_created', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Ticket Resolved</span>
              <p className="text-xs text-gray-500">Get notified when a ticket is resolved</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email.ticket_resolved}
              onChange={(e) => updateEmail('ticket_resolved', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Ticket Escalated</span>
              <p className="text-xs text-gray-500">Get notified when a ticket is escalated</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email.ticket_escalated}
              onChange={(e) => updateEmail('ticket_escalated', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">AI Response Generated</span>
              <p className="text-xs text-gray-500">Get notified when AI generates a response</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email.ai_response_generated}
              onChange={(e) => updateEmail('ai_response_generated', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">AI Response Requires Review</span>
              <p className="text-xs text-gray-500">Get notified when AI response needs review</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email.ai_response_requires_review}
              onChange={(e) => updateEmail('ai_response_requires_review', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Daily Summary</span>
              <p className="text-xs text-gray-500">Receive a daily summary of ticket activity</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email.daily_summary}
              onChange={(e) => updateEmail('daily_summary', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">In-App Notifications</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Ticket Assigned</span>
              <p className="text-xs text-gray-500">Show notification when a ticket is assigned to you</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.in_app.ticket_assigned}
              onChange={(e) => updateInApp('ticket_assigned', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Ticket Escalated</span>
              <p className="text-xs text-gray-500">Show notification when a ticket is escalated</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.in_app.ticket_escalated}
              onChange={(e) => updateInApp('ticket_escalated', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">AI Response Requires Review</span>
              <p className="text-xs text-gray-500">Show notification when AI response needs review</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.in_app.ai_response_requires_review}
              onChange={(e) => updateInApp('ai_response_requires_review', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Browser Notifications */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Push Notifications</h3>
        <p className="text-sm text-gray-500 mb-4">
          Browser notifications require permission. You'll be prompted to allow notifications when you enable these.
        </p>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Ticket Escalated</span>
              <p className="text-xs text-gray-500">Receive browser notification when ticket is escalated</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.browser.ticket_escalated}
              onChange={(e) => updateBrowser('ticket_escalated', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">AI Response Requires Review</span>
              <p className="text-xs text-gray-500">Receive browser notification when AI response needs review</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.browser.ai_response_requires_review}
              onChange={(e) => updateBrowser('ai_response_requires_review', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
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
            'Save Notification Preferences'
          )}
        </button>
      </div>
    </form>
  );
}

