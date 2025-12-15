export type UserRole = 'admin' | 'agent' | 'viewer';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  created_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_active?: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  send_invite?: boolean;
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
  created_at: string;
  updated_at: string;
  created_by: string;
  member_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: User;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  member_ids?: string[];
}

export interface Permission {
  resource: string; // e.g., 'tickets', 'knowledge_base', 'settings'
  actions: string[]; // e.g., ['read', 'write', 'delete']
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

