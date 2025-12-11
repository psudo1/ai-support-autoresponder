import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeEntryById, updateKnowledgeEntry, deleteKnowledgeEntry } from '@/lib/knowledgeBaseService';
import type { UpdateKnowledgeInput } from '@/types';

/**
 * GET /api/knowledge-base/[id]
 * Get a single knowledge base entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getKnowledgeEntryById(id);

    if (!entry) {
      return NextResponse.json(
        { error: 'Knowledge base entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry }, { status: 200 });
  } catch (error) {
    console.error('Error fetching knowledge base entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch knowledge base entry' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge-base/[id]
 * Update a knowledge base entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateKnowledgeInput = await request.json();

    // Check if entry exists
    const existingEntry = await getKnowledgeEntryById(id);
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Knowledge base entry not found' },
        { status: 404 }
      );
    }

    const entry = await updateKnowledgeEntry(id, body);

    return NextResponse.json({ entry }, { status: 200 });
  } catch (error) {
    console.error('Error updating knowledge base entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update knowledge base entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-base/[id]
 * Delete a knowledge base entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if entry exists
    const existingEntry = await getKnowledgeEntryById(id);
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Knowledge base entry not found' },
        { status: 404 }
      );
    }

    await deleteKnowledgeEntry(id);

    return NextResponse.json(
      { message: 'Knowledge base entry deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting knowledge base entry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete knowledge base entry' },
      { status: 500 }
    );
  }
}

