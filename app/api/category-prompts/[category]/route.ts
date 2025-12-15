import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCategoryPrompt, updateCategoryPrompt, deleteCategoryPrompt } from '@/lib/templateService';
import { canPerformAction } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
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

    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    const prompt = await getCategoryPrompt(decodedCategory);

    if (!prompt) {
      return NextResponse.json({ error: 'Category prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error getting category prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get category prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
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

    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    const body = await request.json();
    const { prompt_template, system_message, instructions, variables, is_active } = body;

    const prompt = await updateCategoryPrompt(decodedCategory, {
      prompt_template,
      system_message,
      instructions,
      variables,
      is_active,
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error updating category prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update category prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
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

    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    await deleteCategoryPrompt(decodedCategory);

    return NextResponse.json({
      success: true,
      message: 'Category prompt deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete category prompt' },
      { status: 500 }
    );
  }
}

