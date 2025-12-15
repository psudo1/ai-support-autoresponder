import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseClient';
import type { BrandVoiceSettings } from '@/types/settings';

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

    // Try to get brand voice settings
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'brand_voice_settings')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Also get brand_voice from AI settings for backward compatibility
    const { data: aiData } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'brand_voice')
      .single();

    const defaultSettings: BrandVoiceSettings = {
      tone: 'professional',
      style: '',
      language: 'en',
      greeting_template: 'Hello {{customer_name}},\n\nThank you for reaching out to us.',
      closing_template: 'Best regards,\n{{agent_name}}\n{{company_name}}',
      custom_instructions: '',
    };

    const settings: BrandVoiceSettings = data?.value || defaultSettings;
    
    // If we have old brand_voice setting, use it
    if (aiData?.value && !data) {
      settings.style = typeof aiData.value === 'string' ? aiData.value : '';
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error getting brand voice settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get brand voice settings' },
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
        key: 'brand_voice_settings',
        value: settings,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      throw error;
    }

    // Also update the old brand_voice setting for backward compatibility
    if (settings.style) {
      await supabaseAdmin
        .from('settings')
        .upsert({
          key: 'brand_voice',
          value: settings.style,
          updated_by: session.user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating brand voice settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update brand voice settings' },
      { status: 500 }
    );
  }
}

