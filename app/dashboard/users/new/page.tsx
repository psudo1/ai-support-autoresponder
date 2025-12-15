'use client';

import UserForm from '@/components/users/UserForm';

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new user to the system
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <UserForm />
      </div>
    </div>
  );
}

