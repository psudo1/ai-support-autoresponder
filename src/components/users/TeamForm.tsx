'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Team, CreateTeamInput, User } from '@/types/user';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TeamFormProps {
  teamId?: string;
  onSuccess?: () => void;
}

export default function TeamForm({ teamId, onSuccess }: TeamFormProps) {
  const router = useRouter();
  const toast = useToastContext();
  const [loading, setLoading] = useState(!!teamId);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<CreateTeamInput>({
    name: '',
    description: '',
    member_ids: [],
  });

  useEffect(() => {
    fetchUsers();
    if (teamId) {
      // Could fetch team details here if editing
    }
  }, [teamId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }

      toast.success('Team created successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/users?tab=teams');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (userId: string) => {
    const currentIds = formData.member_ids || [];
    if (currentIds.includes(userId)) {
      setFormData({
        ...formData,
        member_ids: currentIds.filter(id => id !== userId),
      });
    } else {
      setFormData({
        ...formData,
        member_ids: [...currentIds, userId],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Support Team, Engineering Team"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description of the team"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Members
        </label>
        <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No users available</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <label key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.member_ids?.includes(user.id) || false}
                    onChange={() => toggleMember(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {user.name || user.email} ({user.role || 'agent'})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {formData.member_ids?.length || 0} member(s) selected
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Creating...
            </span>
          ) : (
            'Create Team'
          )}
        </button>
      </div>
    </form>
  );
}

