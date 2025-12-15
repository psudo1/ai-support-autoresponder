import type { UserRole } from './userService';

export type Permission = 
  | 'tickets.view'
  | 'tickets.create'
  | 'tickets.update'
  | 'tickets.delete'
  | 'tickets.assign'
  | 'tickets.resolve'
  | 'knowledge_base.view'
  | 'knowledge_base.create'
  | 'knowledge_base.update'
  | 'knowledge_base.delete'
  | 'ai_responses.view'
  | 'ai_responses.approve'
  | 'ai_responses.reject'
  | 'ai_responses.edit'
  | 'review_queue.view'
  | 'review_queue.manage'
  | 'analytics.view'
  | 'settings.view'
  | 'settings.update'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.invite'
  | 'teams.view'
  | 'teams.create'
  | 'teams.update'
  | 'teams.delete';

/**
 * Permission matrix: role -> permissions
 */
const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'tickets.view',
    'tickets.create',
    'tickets.update',
    'tickets.delete',
    'tickets.assign',
    'tickets.resolve',
    'knowledge_base.view',
    'knowledge_base.create',
    'knowledge_base.update',
    'knowledge_base.delete',
    'ai_responses.view',
    'ai_responses.approve',
    'ai_responses.reject',
    'ai_responses.edit',
    'review_queue.view',
    'review_queue.manage',
    'analytics.view',
    'settings.view',
    'settings.update',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.invite',
    'teams.view',
    'teams.create',
    'teams.update',
    'teams.delete',
  ],
  agent: [
    'tickets.view',
    'tickets.create',
    'tickets.update',
    'tickets.assign',
    'tickets.resolve',
    'knowledge_base.view',
    'knowledge_base.create',
    'knowledge_base.update',
    'ai_responses.view',
    'ai_responses.approve',
    'ai_responses.reject',
    'ai_responses.edit',
    'review_queue.view',
    'analytics.view',
  ],
  viewer: [
    'tickets.view',
    'knowledge_base.view',
    'ai_responses.view',
    'analytics.view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return PERMISSIONS[role] || [];
}

/**
 * Check if user can perform action
 */
export function canPerformAction(
  userRole: UserRole | undefined,
  permission: Permission
): boolean {
  if (!userRole) {
    return false;
  }
  return hasPermission(userRole, permission);
}

