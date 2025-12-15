'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '@/types/user';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

interface UserFormProps {
  userId?: string;
  onSuccess?: () => void;
}

export default function UserForm({ userId, onSuccess }: UserFormProps) {
  const router = useRouter();
  const toast = useToastContext();
  const [loading, setLoading] = useState(!!userId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput & UpdateUserInput>({
    email: '',
    password: '',
    name: '',
    role: 'agent',
    send_invite: false,
    is_active: true,
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setFormData({
        email: data.user.email,
        name: data.user.name || '',
        role: data.user.role || 'agent',
        is_active: data.user.is_active !== false,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (userId) {
        // Update user
        const updateData: UpdateUserInput = {
          name: formData.name,
          role: formData.role,
          is_active: formData.is_active,
        };

        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }

        toast.success('User updated successfully');
      } else {
        // Create user
        if (formData.send_invite) {
          // Send invitation
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              name: formData.name,
              role: formData.role,
              invite: true,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to invite user');
          }

          toast.success('Invitation sent successfully');
        } else {
          // Create user directly
          const createData: CreateUserInput = {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
          };

          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
          }

          toast.success('User created successfully');
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create user');
        }

        toast.success('User created successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/users');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!userId && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {!formData.send_invite ? '*' : ''}
            </label>
            <input
              type="password"
              required={!formData.send_invite}
              disabled={formData.send_invite}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder={formData.send_invite ? 'Will be set via invite email' : ''}
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.send_invite}
                onChange={(e) => setFormData({ ...formData, send_invite: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Send invitation email (user will set their own password)
              </span>
            </label>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="admin">Admin - Full access</option>
          <option value="agent">Agent - Can manage tickets and responses</option>
          <option value="viewer">Viewer - Read-only access</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {formData.role === 'admin' && 'Full access to all features and settings'}
          {formData.role === 'agent' && 'Can create and edit tickets, approve AI responses'}
          {formData.role === 'viewer' && 'Read-only access to tickets and analytics'}
        </p>
      </div>

      {userId && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active !== false}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Inactive users cannot sign in
          </p>
        </div>
      )}

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
              Saving...
            </span>
          ) : (
            userId ? 'Update User' : 'Create User'
          )}
        </button>
      </div>
    </form>
  );
}

