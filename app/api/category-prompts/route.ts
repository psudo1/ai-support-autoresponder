import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAllCategoryPrompts, upsertCategoryPrompt } from '@/lib/templateService';
import { canPerformAction } from '@/lib/permissions';

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

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    const prompts = await getAllCategoryPrompts(activeOnly);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error getting category prompts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get category prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check permission (admin only)
    if (!canPerformAction(userRole as any, 'settings.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { category, prompt_template, system_message, instructions, variables, is_active } = body;

    if (!category || !prompt_template) {
      return NextResponse.json(
        { error: 'Category and prompt_template are required' },
        { status: 400 }
      );
    }

    const prompt = await upsertCategoryPrompt({
      category,
      prompt_template,
      system_message,
      instructions,
      variables,
      is_active,
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating category prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create category prompt' },
      { status: 500 }
    );
  }
}

