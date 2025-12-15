'use client';

import { useState } from 'react';
import AISettingsForm from '@/components/settings/AISettingsForm';
import IntegrationSettingsForm from '@/components/settings/IntegrationSettingsForm';
import NotificationPreferencesForm from '@/components/settings/NotificationPreferencesForm';
import BrandVoiceForm from '@/components/settings/BrandVoiceForm';

type SettingsTab = 'ai' | 'integrations' | 'notifications' | 'brand-voice';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');

  const tabs = [
    { id: 'ai' as SettingsTab, label: 'AI Settings', icon: '🤖' },
    { id: 'integrations' as SettingsTab, label: 'Integrations', icon: '🔌' },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: '🔔' },
    { id: 'brand-voice' as SettingsTab, label: 'Brand Voice', icon: '✍️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Configure your AI support system settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'ai' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Settings</h2>
            <p className="text-sm text-gray-500 mb-6">
              Configure AI response generation and review thresholds
            </p>
            <AISettingsForm />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Settings</h2>
            <p className="text-sm text-gray-500 mb-6">
              Configure email, webhooks, and third-party integrations
            </p>
            <IntegrationSettingsForm />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose which notifications you want to receive
            </p>
            <NotificationPreferencesForm />
          </div>
        )}

        {activeTab === 'brand-voice' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Voice Configuration</h2>
            <p className="text-sm text-gray-500 mb-6">
              Customize the tone, style, and templates for AI-generated responses
            </p>
            <BrandVoiceForm />
          </div>
        )}
      </div>
    </div>
  );
}
