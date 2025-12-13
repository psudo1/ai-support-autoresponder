import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseById, updateAIResponseText } from '@/lib/aiService';

/**
 * PUT /api/ai-responses/[id]/edit
 * Edit an AI response
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { response_text } = body;

    if (!response_text || typeof response_text !== 'string') {
      return NextResponse.json(
        { error: 'response_text is required and must be a string' },
        { status: 400 }
      );
    }

    // Get AI response
    const aiResponse = await getAIResponseById(id);
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI response not found' },
        { status: 404 }
      );
    }

    // Update response text
    const updatedResponse = await updateAIResponseText(id, response_text);

    return NextResponse.json(
      { ai_response: updatedResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error editing AI response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to edit response' },
      { status: 500 }
    );
  }
}

