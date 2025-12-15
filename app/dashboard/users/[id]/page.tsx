'use client';

import { useParams } from 'next/navigation';
import UserForm from '@/components/users/UserForm';

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update user information and role
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <UserForm userId={userId} />
      </div>
    </div>
  );
}

