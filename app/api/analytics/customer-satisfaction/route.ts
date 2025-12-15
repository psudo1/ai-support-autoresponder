import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSatisfactionMetrics } from '@/lib/advancedAnalyticsService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    const startDate = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : undefined;
    const endDate = searchParams.get('end_date')
      ? new Date(searchParams.get('end_date')!)
      : undefined;

    const metrics = await getCustomerSatisfactionMetrics({
      startDate,
      endDate,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error getting customer satisfaction metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get customer satisfaction metrics' },
      { status: 500 }
    );
  }
}

