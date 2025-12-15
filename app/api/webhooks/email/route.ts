import { NextRequest, NextResponse } from 'next/server';
import { parseEmail, extractReplyTicketId, isReplyEmail, cleanEmailBody } from '@/lib/emailParser';
import { createTicket, getTicketByNumber, getTicketById } from '@/lib/ticketService';
import { createConversation } from '@/lib/conversationService';
import { getIntegrationSettings } from '@/lib/settingsService';
import { generateAIResponse } from '@/lib/aiService';
import { sendTicketResponseEmail, sendTicketConfirmationEmail } from '@/lib/emailService';
import { getConversationHistoryForPrompt } from '@/lib/conversationService';
import { performAdvancedAnalysis } from '@/lib/advancedAIService';
import { updateTicketAIAnalysis, incrementConversationTurn } from '@/lib/ticketService';

/**
 * POST /api/webhooks/email
 * Handle incoming emails from email service providers
 * 
 * This endpoint can be called by:
 * - SendGrid Inbound Parse
 * - Mailgun Routes
 * - Postmark Inbound
 * - AWS SES Receiving
 * - Custom email forwarding services
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw email content
    // Different providers send emails in different formats
    const contentType = request.headers.get('content-type') || '';
    
    let rawEmail: string | Buffer;
    
    if (contentType.includes('multipart/form-data')) {
      // Some providers send as form data (e.g., SendGrid)
      const formData = await request.formData();
      const emailFile = formData.get('email') as File | null;
      const emailText = formData.get('text') as string | null;
      
      if (emailFile) {
        rawEmail = Buffer.from(await emailFile.arrayBuffer());
      } else if (emailText) {
        rawEmail = emailText;
      } else {
        return NextResponse.json(
          { error: 'No email content found in form data' },
          { status: 400 }
        );
      }
    } else {
      // Raw email content (e.g., Mailgun, Postmark)
      rawEmail = await request.text();
    }

    // Parse email
    const parsedEmail = await parseEmail(rawEmail);

    // Verify email is enabled
    const settings = await getIntegrationSettings();
    if (!settings.email_enabled) {
      return NextResponse.json(
        { error: 'Email integration is not enabled' },
        { status: 503 }
      );
    }

    // Check if this is a reply to an existing ticket
    const isReply = isReplyEmail(parsedEmail);
    let ticketId: string | null = null;
    let ticket = null;

    if (isReply) {
      // Try to find existing ticket
      ticketId = extractReplyTicketId(parsedEmail);
      
      if (ticketId) {
        // Check if it's a UUID (ticket ID) or ticket number
        if (ticketId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          ticket = await getTicketById(ticketId);
        } else {
          ticket = await getTicketByNumber(ticketId);
        }
      }
    }

    if (ticket) {
      // Add message to existing ticket
      const cleanedMessage = cleanEmailBody(parsedEmail.text);
      
      await createConversation({
        ticket_id: ticket.id,
        message: cleanedMessage,
        sender_type: 'customer',
      });

      // Increment conversation turn
      await incrementConversationTurn(ticket.id);

      // Generate AI response if auto-respond is enabled
      try {
        const conversationHistory = await getConversationHistoryForPrompt(ticket.id);
        
        // Perform AI analysis
        const aiAnalysis = await performAdvancedAnalysis(
          {
            subject: ticket.subject,
            initial_message: cleanedMessage,
            priority: ticket.priority,
          },
          conversationHistory
        );
        
        await updateTicketAIAnalysis(ticket.id, aiAnalysis);

        // Generate AI response
        const aiResponse = await generateAIResponse({
          ticket_id: ticket.id,
          conversation_history: conversationHistory,
          include_knowledge_base: true,
        });

        // Send response email
        await sendTicketResponseEmail(
          ticket.id,
          ticket.ticket_number,
          parsedEmail.from.email,
          parsedEmail.from.name || null,
          aiResponse.response,
          true // isReply
        );
      } catch (error) {
        console.error('Error generating AI response for email reply:', error);
        // Don't fail the webhook if AI response fails
      }

      return NextResponse.json({
        success: true,
        message: 'Email added to existing ticket',
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
      });
    } else {
      // Create new ticket from email
      const cleanedMessage = cleanEmailBody(parsedEmail.text);
      
      const newTicket = await createTicket({
        subject: parsedEmail.subject,
        initial_message: cleanedMessage,
        customer_email: parsedEmail.from.email,
        customer_name: parsedEmail.from.name || undefined,
        source: 'email',
      });

      // Perform AI analysis
      try {
        const aiAnalysis = await performAdvancedAnalysis({
          subject: newTicket.subject,
          initial_message: newTicket.initial_message,
          priority: newTicket.priority,
        });
        
        await updateTicketAIAnalysis(newTicket.id, aiAnalysis);
      } catch (error) {
        console.error('Error performing AI analysis:', error);
      }

      // Send confirmation email
      try {
        await sendTicketConfirmationEmail(
          newTicket.id,
          newTicket.ticket_number,
          parsedEmail.from.email,
          parsedEmail.from.name || null,
          parsedEmail.subject
        );
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't fail ticket creation if email fails
      }

      // Generate and send AI response if auto-respond is enabled
      try {
        const aiResponse = await generateAIResponse({
          ticket_id: newTicket.id,
          conversation_history: [],
          include_knowledge_base: true,
        });

        await sendTicketResponseEmail(
          newTicket.id,
          newTicket.ticket_number,
          parsedEmail.from.email,
          parsedEmail.from.name || null,
          aiResponse.response,
          false // isReply
        );
      } catch (error) {
        console.error('Error generating AI response for new email:', error);
        // Don't fail ticket creation if AI response fails
      }

      return NextResponse.json({
        success: true,
        message: 'Ticket created from email',
        ticket_id: newTicket.id,
        ticket_number: newTicket.ticket_number,
      });
    }
  } catch (error) {
    console.error('Error processing incoming email:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process email',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/email
 * Webhook verification endpoint (for some email providers)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  const verifyToken = searchParams.get('verify_token');

  // Some providers require verification
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  if (verifyToken) {
    // Verify token matches expected value
    const expectedToken = process.env.EMAIL_WEBHOOK_TOKEN;
    if (verifyToken === expectedToken) {
      return NextResponse.json({ verified: true });
    }
    return NextResponse.json({ verified: false }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Email webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

