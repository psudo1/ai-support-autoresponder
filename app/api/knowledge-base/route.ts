import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeEntries, createKnowledgeEntry, searchKnowledgeBase } from '@/lib/knowledgeBaseService';
import type { CreateKnowledgeInput } from '@/types';

/**
 * GET /api/knowledge-base
 * Get all knowledge base entries or search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let entries;

    if (query) {
      // Search mode
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      entries = await searchKnowledgeBase(query, limit, category || undefined);
    } else {
      // Get all entries
      entries = await getAllKnowledgeEntries(includeInactive);
    }

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch knowledge base' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-base
 * Create a new knowledge base entry
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateKnowledgeInput = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      );
    }

    const entry = await createKnowledgeEntry(body);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge base entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create knowledge base entry' },
      { status: 500 }
    );
  }
}

