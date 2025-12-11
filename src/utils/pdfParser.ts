import pdfParse from 'pdf-parse';

/**
 * Extract text content from a PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text content from a PDF file
 */
export async function parsePDFFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return parsePDF(buffer);
}

/**
 * Chunk text content into smaller pieces for better AI processing
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 2000,
  overlap: number = 200
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Clean and normalize text content
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
}

