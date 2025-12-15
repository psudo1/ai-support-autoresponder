import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getFeedbackStats, getAIResponseFeedbackAnalytics } from '@/lib/feedbackService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const body = await request.json();
    const { conversation_id, rating, feedback_text } = body;

    if (!conversation_id || !rating) {
      return NextResponse.json(
        { error: 'conversation_id and rating are required' },
        { status: 400 }
      );
    }

    const feedback = await createFeedback({
      conversation_id,
      rating,
      feedback_text,
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

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
    const ticketId = searchParams.get('ticket_id');
    const conversationId = searchParams.get('conversation_id');
    const stats = searchParams.get('stats') === 'true';
    const aiAnalytics = searchParams.get('ai_analytics') === 'true';

    if (aiAnalytics) {
      // Get AI response feedback analytics
      const startDate = searchParams.get('start_date')
        ? new Date(searchParams.get('start_date')!)
        : undefined;
      const endDate = searchParams.get('end_date')
        ? new Date(searchParams.get('end_date')!)
        : undefined;

      const analytics = await getAIResponseFeedbackAnalytics({
        startDate,
        endDate,
      });

      return NextResponse.json(analytics);
    }

    if (stats) {
      // Get feedback statistics
      const startDate = searchParams.get('start_date')
        ? new Date(searchParams.get('start_date')!)
        : undefined;
      const endDate = searchParams.get('end_date')
        ? new Date(searchParams.get('end_date')!)
        : undefined;

      const feedbackStats = await getFeedbackStats({
        ticketId: ticketId || undefined,
        startDate,
        endDate,
      });

      return NextResponse.json(feedbackStats);
    }

    // Get feedback by conversation or ticket
    if (conversationId) {
      const { getFeedbackByConversationId } = await import('@/lib/feedbackService');
      const feedback = await getFeedbackByConversationId(conversationId);
      return NextResponse.json(feedback);
    }

    if (ticketId) {
      const { getFeedbackByTicketId } = await import('@/lib/feedbackService');
      const feedback = await getFeedbackByTicketId(ticketId);
      return NextResponse.json(feedback);
    }

    return NextResponse.json(
      { error: 'conversation_id, ticket_id, stats, or ai_analytics parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get feedback' },
      { status: 500 }
    );
  }
}

