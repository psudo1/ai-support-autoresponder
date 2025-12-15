import { simpleParser, ParsedMail } from 'mailparser';

export interface ParsedEmail {
  from: {
    email: string;
    name?: string;
  };
  to: {
    email: string;
    name?: string;
  }[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  date: Date;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  headers: Record<string, string | string[]>;
}

/**
 * Parse raw email content (MIME format)
 */
export async function parseEmail(rawEmail: string | Buffer): Promise<ParsedEmail> {
  try {
    const parsed: ParsedMail = await simpleParser(rawEmail);

    return {
      from: {
        email: parsed.from?.value[0]?.address || '',
        name: parsed.from?.value[0]?.name,
      },
      to: (parsed.to?.value || []).map(addr => ({
        email: addr.address,
        name: addr.name,
      })),
      subject: parsed.subject || '(No Subject)',
      text: parsed.text || parsed.textAsHtml || '',
      html: parsed.html || undefined,
      attachments: parsed.attachments?.map(att => ({
        filename: att.filename || 'attachment',
        content: att.content as Buffer,
        contentType: att.contentType || 'application/octet-stream',
      })),
      date: parsed.date || new Date(),
      messageId: parsed.messageId,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references,
      headers: parsed.headers as Record<string, string | string[]>,
    };
  } catch (error) {
    throw new Error(`Failed to parse email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract ticket number from email subject or body
 */
export function extractTicketNumber(text: string): string | null {
  // Common patterns: TKT-12345, TICKET-12345, #12345, [TKT-12345]
  const patterns = [
    /\[?TKT-(\d+)\]?/i,
    /\[?TICKET-(\d+)\]?/i,
    /\[?#(\d+)\]?/i,
    /ticket\s*#?\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Extract reply-to ticket ID from email headers
 */
export function extractReplyTicketId(email: ParsedEmail): string | null {
  // Check In-Reply-To header
  if (email.inReplyTo) {
    // Extract ticket ID from message ID if it contains one
    const ticketIdMatch = email.inReplyTo.match(/ticket-([a-f0-9-]+)/i);
    if (ticketIdMatch) {
      return ticketIdMatch[1];
    }
  }

  // Check References header
  if (email.references && Array.isArray(email.references)) {
    for (const ref of email.references) {
      const ticketIdMatch = ref.match(/ticket-([a-f0-9-]+)/i);
      if (ticketIdMatch) {
        return ticketIdMatch[1];
      }
    }
  }

  // Check subject for ticket number
  const ticketNumber = extractTicketNumber(email.subject);
  if (ticketNumber) {
    return ticketNumber;
  }

  return null;
}

/**
 * Check if email is a reply to an existing ticket
 */
export function isReplyEmail(email: ParsedEmail): boolean {
  return !!(
    email.inReplyTo ||
    (email.references && email.references.length > 0) ||
    email.subject.toLowerCase().startsWith('re:') ||
    email.subject.toLowerCase().startsWith('re[')
  );
}

/**
 * Clean email body for ticket creation
 * Removes email signatures, quoted text, etc.
 */
export function cleanEmailBody(text: string): string {
  // Remove common email signatures
  const signaturePatterns = [
    /^--\s*$/m, // Standard signature delimiter
    /^Sent from .*$/mi,
    /^Get Outlook for .*$/mi,
    /^This email was sent to .*$/mi,
  ];

  let cleaned = text;

  // Remove signatures
  for (const pattern of signaturePatterns) {
    const match = cleaned.search(pattern);
    if (match !== -1) {
      cleaned = cleaned.substring(0, match).trim();
    }
  }

  // Remove quoted replies (lines starting with >)
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n')
    .trim();

  // Remove "On [date] [person] wrote:" patterns
  cleaned = cleaned.replace(/^On .+ wrote:.*$/gmi, '').trim();

  return cleaned;
}

