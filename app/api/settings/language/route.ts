import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLanguageSettings, updateLanguageSettings } from '@/lib/brandingService';
import { canPerformAction } from '@/lib/permissions';

export async function GET() {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getLanguageSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching language settings:', error);
    return NextResponse.json({ error: 'Failed to fetch language settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user role
    const { data: { user } } = await supabase.auth.getUser();
    const userRole = user?.user_metadata?.role as string;

    // Check permission
    if (!canPerformAction(userRole as any, 'settings.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { settings } = await req.json();
    await updateLanguageSettings(settings, user?.id);
    return NextResponse.json({ message: 'Language settings updated successfully' });
  } catch (error) {
    console.error('Error updating language settings:', error);
    return NextResponse.json({ error: 'Failed to update language settings' }, { status: 500 });
  }
}

