import { NextRequest, NextResponse } from 'next/server';
import { parsePDFFile, cleanText } from '@/utils/pdfParser';
import { createKnowledgeEntry } from '@/lib/knowledgeBaseService';

/**
 * POST /api/knowledge-base/upload
 * Upload a file (PDF) and create a knowledge base entry
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string | null;
    const tags = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, text, and markdown files are supported' },
        { status: 400 }
      );
    }

    // Parse file content
    let content: string;
    let fileType: 'pdf' | 'text' | 'markdown' | 'html' = 'text';

    if (file.type === 'application/pdf') {
      content = await parsePDFFile(file);
      fileType = 'pdf';
    } else {
      content = await file.text();
      if (file.type === 'text/markdown') {
        fileType = 'markdown';
      }
    }

    // Clean the content
    content = cleanText(content);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'File appears to be empty or could not be parsed' },
        { status: 400 }
      );
    }

    // Parse tags if provided
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Create knowledge base entry
    const entry = await createKnowledgeEntry({
      title,
      content,
      file_type: fileType,
      category: category || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    });

    return NextResponse.json(
      {
        entry,
        message: 'File uploaded and processed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}

