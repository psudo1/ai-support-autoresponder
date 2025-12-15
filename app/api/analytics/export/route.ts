import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseClient';

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
    const type = searchParams.get('type') || 'tickets'; // tickets, feedback, responses
    const format = searchParams.get('format') || 'json'; // json, csv
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    let data: any[] = [];
    let filename = '';

    if (type === 'tickets') {
      let query = supabaseAdmin.from('tickets').select('*');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data: tickets, error } = await query;
      if (error) throw error;
      data = tickets || [];
      filename = `tickets_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'feedback') {
      let query = supabaseAdmin.from('feedback').select('*');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data: feedback, error } = await query;
      if (error) throw error;
      data = feedback || [];
      filename = `feedback_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'responses') {
      let query = supabaseAdmin.from('ai_responses').select('*');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data: responses, error } = await query;
      if (error) throw error;
      data = responses || [];
      filename = `ai_responses_${new Date().toISOString().split('T')[0]}`;
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return NextResponse.json({ error: 'No data to export' }, { status: 404 });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            // Handle null, undefined, and objects
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            // Escape quotes and wrap in quotes if contains comma or newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        ),
      ];

      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // JSON format
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export data' },
      { status: 500 }
    );
  }
}

