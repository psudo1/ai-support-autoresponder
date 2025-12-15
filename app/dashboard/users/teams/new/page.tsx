'use client';

import TeamForm from '@/components/users/TeamForm';

export default function NewTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Team</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a team to organize users and manage permissions
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <TeamForm />
      </div>
    </div>
  );
}

