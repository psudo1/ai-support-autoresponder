import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { canPerformAction, type Permission } from './permissions';
import type { NextRequest } from 'next/server';

/**
 * Check if user has permission for a route
 * Use this in API routes to enforce permissions
 */
export async function checkPermission(
  request: NextRequest,
  permission: Permission
): Promise<{ authorized: boolean; userRole?: string; userId?: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { authorized: false };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role as string;

  if (!userRole) {
    return { authorized: false, userId: user?.id };
  }

  const authorized = canPerformAction(userRole as any, permission);

  return {
    authorized,
    userRole,
    userId: user?.id,
  };
}

/**
 * Route permission mapping
 * Maps routes to required permissions
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard/users': 'users.view',
  '/dashboard/users/new': 'users.create',
  '/dashboard/settings': 'settings.view',
  '/dashboard/analytics': 'analytics.view',
  '/dashboard/review': 'review_queue.view',
};

/**
 * Check if user can access a route
 */
export async function canAccessRoute(
  request: NextRequest,
  route: string
): Promise<boolean> {
  const permission = ROUTE_PERMISSIONS[route];
  if (!permission) {
    return true; // No permission required
  }

  const { authorized } = await checkPermission(request, permission);
  return authorized;
}

