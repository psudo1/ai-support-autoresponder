import nodemailer, { Transporter } from 'nodemailer';
import { getIntegrationSettings } from './settingsService';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 */
async function getEmailTransporter(): Promise<Transporter | null> {
  if (transporter) {
    return transporter;
  }

  try {
    const settings = await getIntegrationSettings();
    
    if (!settings.email_enabled || !settings.smtp_host) {
      console.warn('Email is not configured. Set email_enabled=true and SMTP settings.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
      // Add timeout and connection pool settings
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection
    await transporter.verify();
    console.log('Email transporter initialized successfully');

    return transporter;
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    transporter = null;
    return null;
  }
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const emailTransporter = await getEmailTransporter();
  
  if (!emailTransporter) {
    throw new Error('Email service is not configured. Please configure SMTP settings.');
  }

  const settings = await getIntegrationSettings();
  
  const fromEmail = options.from || settings.email_from_address;
  const fromName = options.fromName || settings.email_from_name;
  const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const mailOptions = {
    from: fromAddress,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
    attachments: options.attachments,
    headers: options.headers || {},
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Send ticket response email
 */
export async function sendTicketResponseEmail(
  ticketId: string,
  ticketNumber: string,
  customerEmail: string,
  customerName: string | null,
  responseText: string,
  isReply: boolean = false
): Promise<void> {
  const settings = await getIntegrationSettings();
  
  const subject = isReply 
    ? `Re: ${ticketNumber} - Your support request`
    : `Re: ${ticketNumber} - ${ticketNumber}`;

  // Generate reply-to header with ticket ID for threading
  const replyToHeader = `<ticket-${ticketId}@${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'localhost').hostname}>`;

  await sendEmail({
    to: customerEmail,
    subject,
    html: renderTicketResponseTemplate({
      ticketNumber,
      customerName: customerName || 'Customer',
      responseText,
      ticketId,
    }),
    text: responseText,
    replyTo: replyToHeader,
    headers: {
      'In-Reply-To': replyToHeader,
      'References': replyToHeader,
      'X-Ticket-ID': ticketId,
      'X-Ticket-Number': ticketNumber,
    },
  });
}

/**
 * Send ticket creation confirmation email
 */
export async function sendTicketConfirmationEmail(
  ticketId: string,
  ticketNumber: string,
  customerEmail: string,
  customerName: string | null,
  subject: string
): Promise<void> {
  await sendEmail({
    to: customerEmail,
    subject: `Ticket ${ticketNumber} - ${subject}`,
    html: renderTicketConfirmationTemplate({
      ticketNumber,
      customerName: customerName || 'Customer',
      subject,
      ticketId,
    }),
    text: `Thank you for contacting us. Your ticket ${ticketNumber} has been created. We'll get back to you soon.`,
  });
}

/**
 * Render ticket response email template
 */
function renderTicketResponseTemplate(data: {
  ticketNumber: string;
  customerName: string;
  responseText: string;
  ticketId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response to Ticket ${data.ticketNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #2563eb;">Response to Ticket ${data.ticketNumber}</h2>
  </div>
  
  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px;">
    <p>Hello ${data.customerName},</p>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #2563eb;">
      ${data.responseText.replace(/\n/g, '<br>')}
    </div>
    
    <p>If you have any further questions, please reply to this email.</p>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      Ticket Number: <strong>${data.ticketNumber}</strong><br>
      This is an automated response. Please reply to this email if you need additional assistance.
    </p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>This email was sent in response to your support ticket.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Render ticket confirmation email template
 */
function renderTicketConfirmationTemplate(data: {
  ticketNumber: string;
  customerName: string;
  subject: string;
  ticketId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket ${data.ticketNumber} Created</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h2 style="margin-top: 0;">Ticket Created Successfully</h2>
  </div>
  
  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px;">
    <p>Hello ${data.customerName},</p>
    
    <p>Thank you for contacting us. We've received your request and created ticket <strong>${data.ticketNumber}</strong>.</p>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #2563eb;">
      <strong>Subject:</strong> ${data.subject}
    </div>
    
    <p>Our team will review your ticket and respond as soon as possible. You'll receive an email notification when we respond.</p>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      Ticket Number: <strong>${data.ticketNumber}</strong><br>
      Please keep this number for your records.
    </p>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>This is an automated confirmation email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const emailTransporter = await getEmailTransporter();
    if (!emailTransporter) {
      return false;
    }
    
    await emailTransporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}

