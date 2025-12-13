import AISettingsForm from '@/components/settings/AISettingsForm';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure AI response generation and review thresholds
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <AISettingsForm />
      </div>
    </div>
  );
}

