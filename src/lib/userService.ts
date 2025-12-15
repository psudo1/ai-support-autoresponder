import { supabaseAdmin } from './supabaseClient';
import type { User } from './authService';
import crypto from 'crypto';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_KEY.');
}

export type UserRole = 'admin' | 'agent' | 'viewer';

export interface UserWithRole extends User {
  role: UserRole;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_active?: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  member_ids: string[];
  created_at: string;
  created_by: string;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<UserWithRole[]> {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }

  return (users.users || []).map((user) => ({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    role: (user.user_metadata?.role as UserRole) || 'agent',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
    is_active: !user.banned_at,
  }));
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserWithRole | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    if (error.message.includes('not found')) {
      return null;
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  if (!data.user) {
    return null;
  }

  const user = data.user;
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    role: (user.user_metadata?.role as UserRole) || 'agent',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
    is_active: !user.banned_at,
  };
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<UserWithRole> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: input.name || '',
      role: input.role || 'agent',
    },
  });

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('User creation succeeded but no user data returned');
  }

  const user = data.user;
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    role: (user.user_metadata?.role as UserRole) || 'agent',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
    is_active: !user.banned_at,
  };
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<UserWithRole> {
  const updateData: any = {};

  if (input.name !== undefined || input.role !== undefined) {
    updateData.user_metadata = {};
    if (input.name !== undefined) {
      updateData.user_metadata.name = input.name;
    }
    if (input.role !== undefined) {
      updateData.user_metadata.role = input.role;
    }
  }

  if (input.is_active !== undefined) {
    updateData.ban_expires = input.is_active ? undefined : '9999-12-31T23:59:59Z';
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    updateData
  );

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('User update succeeded but no user data returned');
  }

  const user = data.user;
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    role: (user.user_metadata?.role as UserRole) || 'agent',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
    is_active: !user.banned_at,
  };
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Invite user via email
 */
export async function inviteUser(
  email: string,
  role: UserRole = 'agent',
  name?: string
): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      name: name || '',
      role,
    },
  });

  if (error) {
    throw new Error(`Failed to invite user: ${error.message}`);
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  total: number;
  by_role: Record<UserRole, number>;
  active: number;
  inactive: number;
}> {
  const users = await getAllUsers();

  const stats = {
    total: users.length,
    by_role: {
      admin: 0,
      agent: 0,
      viewer: 0,
    } as Record<UserRole, number>,
    active: 0,
    inactive: 0,
  };

  users.forEach((user) => {
    stats.by_role[user.role] = (stats.by_role[user.role] || 0) + 1;
    if (user.is_active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }
  });

  return stats;
}

/**
 * Team Management Functions
 * Note: Teams are stored in settings table as JSONB
 */

/**
 * Get all teams
 */
export async function getAllTeams(): Promise<Team[]> {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'teams')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get teams: ${error.message}`);
  }

  return (data?.value as Team[]) || [];
}

/**
 * Create a team
 */
export async function createTeam(
  name: string,
  description: string | undefined,
  memberIds: string[],
  createdBy: string
): Promise<Team> {
  const teams = await getAllTeams();

  const newTeam: Team = {
    id: crypto.randomUUID(),
    name,
    description,
    member_ids: memberIds,
    created_at: new Date().toISOString(),
    created_by: createdBy,
  };

  teams.push(newTeam);

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({
      key: 'teams',
      value: teams,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
    });

  if (error) {
    throw new Error(`Failed to create team: ${error.message}`);
  }

  return newTeam;
}

/**
 * Update team
 */
export async function updateTeam(
  teamId: string,
  updates: {
    name?: string;
    description?: string;
    member_ids?: string[];
  }
): Promise<Team> {
  const teams = await getAllTeams();
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (teamIndex === -1) {
    throw new Error('Team not found');
  }

  teams[teamIndex] = {
    ...teams[teamIndex],
    ...updates,
  };

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({
      key: 'teams',
      value: teams,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
    });

  if (error) {
    throw new Error(`Failed to update team: ${error.message}`);
  }

  return teams[teamIndex];
}

/**
 * Delete team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const teams = await getAllTeams();
  const filteredTeams = teams.filter((t) => t.id !== teamId);

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({
      key: 'teams',
      value: filteredTeams,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
    });

  if (error) {
    throw new Error(`Failed to delete team: ${error.message}`);
  }
}
