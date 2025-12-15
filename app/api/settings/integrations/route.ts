import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseClient';
import type { IntegrationSettings } from '@/types/settings';

export async function GET(request: NextRequest) {
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

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'integration_settings')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const settings: IntegrationSettings = data?.value || {
      email: {
        enabled: false,
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        from_email: '',
        from_name: '',
      },
      webhooks: {
        enabled: false,
        url: '',
        secret: '',
        events: [],
      },
      slack: {
        enabled: false,
        webhook_url: '',
        channel: '#support',
        events: [],
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error getting integration settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get integration settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'integration_settings',
        value: settings,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating integration settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update integration settings' },
      { status: 500 }
    );
  }
}

