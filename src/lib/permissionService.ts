import type { UserRole, Permission } from '@/types/user';

/**
 * Permission definitions for each role
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'tickets', actions: ['read', 'write', 'delete', 'assign', 'escalate'] },
    { resource: 'knowledge_base', actions: ['read', 'write', 'delete', 'upload'] },
    { resource: 'ai_responses', actions: ['read', 'write', 'approve', 'reject', 'edit'] },
    { resource: 'settings', actions: ['read', 'write'] },
    { resource: 'users', actions: ['read', 'write', 'delete', 'invite'] },
    { resource: 'teams', actions: ['read', 'write', 'delete'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'feedback', actions: ['read', 'export'] },
  ],
  agent: [
    { resource: 'tickets', actions: ['read', 'write', 'assign'] },
    { resource: 'knowledge_base', actions: ['read', 'write'] },
    { resource: 'ai_responses', actions: ['read', 'write', 'approve', 'reject', 'edit'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'teams', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'feedback', actions: ['read'] },
  ],
  viewer: [
    { resource: 'tickets', actions: ['read'] },
    { resource: 'knowledge_base', actions: ['read'] },
    { resource: 'ai_responses', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'teams', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'feedback', actions: ['read'] },
  ],
};

/**
 * Check if a user role has permission for a resource and action
 */
export function hasPermission(
  role: UserRole | undefined,
  resource: string,
  action: string
): boolean {
  if (!role) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[role] || [];
  const resourcePermission = permissions.find(p => p.resource === resource);

  if (!resourcePermission) {
    return false;
  }

  return resourcePermission.actions.includes(action);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(
  userRole: UserRole | undefined,
  resource: string,
  action: string
): boolean {
  return hasPermission(userRole, resource, action);
}

/**
 * Require permission - throws error if user doesn't have permission
 */
export function requirePermission(
  userRole: UserRole | undefined,
  resource: string,
  action: string
): void {
  if (!hasPermission(userRole, resource, action)) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

