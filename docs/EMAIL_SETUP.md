# Email Integration Setup Guide

Complete guide for setting up email integration (incoming and outgoing) for the AI Support Autoresponder.

## Overview

The email integration allows you to:
- **Receive** customer emails and automatically create tickets
- **Send** AI-generated responses via email
- **Handle** email replies and thread them to existing tickets
- **Send** ticket confirmation emails

## Prerequisites

- SMTP server credentials (Gmail, SendGrid, Mailgun, AWS SES, etc.)
- Email service provider account with inbound email handling (optional, for receiving emails)

## Configuration

### 1. Configure SMTP Settings

Go to **Settings → Integrations → Email Integration** and configure:

- **SMTP Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
- **SMTP Port**: Usually `587` (TLS) or `465` (SSL)
- **SMTP Username**: Your SMTP username
- **SMTP Password**: Your SMTP password or app password
- **From Email Address**: Email address to send from
- **From Name**: Display name for sent emails

### 2. Common SMTP Providers

#### Gmail
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: [App Password - see below]
```

**Note**: Gmail requires an [App Password](https://support.google.com/accounts/answer/185833) for SMTP access.

#### SendGrid
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey
SMTP Password: [Your SendGrid API Key]
```

#### Mailgun
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP Username: [Your Mailgun SMTP Username]
SMTP Password: [Your Mailgun SMTP Password]
```

#### AWS SES
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP Username: [Your AWS SES SMTP Username]
SMTP Password: [Your AWS SES SMTP Password]
```

### 3. Test Email Configuration

Use the test endpoint to verify your SMTP settings:

```bash
# Test configuration
curl -X GET http://localhost:3000/api/email/test \
  -H "Cookie: [your-session-cookie]"

# Send test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"to": "test@example.com"}'
```

Or use the UI: Go to **Settings → Integrations** and click "Test Email Configuration".

## Incoming Email Setup

### Option 1: SendGrid Inbound Parse

1. Go to SendGrid Dashboard → Settings → Inbound Parse
2. Add a new hostname or use your existing domain
3. Set the webhook URL: `https://your-domain.com/api/webhooks/email`
4. SendGrid will forward emails to your webhook

### Option 2: Mailgun Routes

1. Go to Mailgun Dashboard → Receiving → Routes
2. Create a new route:
   - **Expression**: `match_recipient("support@your-domain.com")`
   - **Action**: `forward("https://your-domain.com/api/webhooks/email")`
3. Mailgun will forward matching emails to your webhook

### Option 3: Postmark Inbound

1. Go to Postmark Dashboard → Servers → Inbound
2. Configure inbound email address
3. Set webhook URL: `https://your-domain.com/api/webhooks/email`
4. Postmark will forward emails to your webhook

### Option 4: AWS SES Receiving

1. Set up SES Receiving Rule Set
2. Configure S3 bucket or Lambda function
3. Forward emails to your webhook endpoint

### Option 5: Custom Email Forwarding

If you have your own email server, you can forward emails to:
```
POST https://your-domain.com/api/webhooks/email
Content-Type: message/rfc822

[Raw email content]
```

## Email Flow

### Incoming Email Flow

1. **Email Received** → Email provider forwards to `/api/webhooks/email`
2. **Email Parsed** → Extract sender, subject, body, attachments
3. **Ticket Detection** → Check if it's a reply to existing ticket
4. **Ticket Creation/Update**:
   - If reply: Add message to existing ticket
   - If new: Create new ticket
5. **AI Analysis** → Perform sentiment, urgency, intent analysis
6. **AI Response** → Generate AI response (if auto-respond enabled)
7. **Email Sent** → Send response to customer

### Outgoing Email Flow

1. **AI Response Generated** → When confidence threshold met
2. **Email Template Rendered** → Format response with ticket details
3. **Email Sent** → Via configured SMTP server
4. **Email Threading** → Uses `In-Reply-To` and `References` headers

## Email Templates

### Ticket Response Template

Includes:
- Ticket number
- Customer name
- AI-generated response
- Reply instructions
- Ticket metadata

### Ticket Confirmation Template

Includes:
- Ticket number
- Subject
- Confirmation message
- Next steps

Templates are HTML-formatted with fallback plain text.

## Email Threading

Emails are threaded using:
- `In-Reply-To` header with ticket ID
- `References` header for conversation history
- Subject line matching (Re: [Ticket Number])

This ensures replies are correctly associated with existing tickets.

## API Endpoints

### Incoming Email Webhook

**POST** `/api/webhooks/email`

Accepts raw email content (MIME format) from email providers.

**Headers:**
- `Content-Type: message/rfc822` (raw email)
- Or `Content-Type: multipart/form-data` (form data with email field)

**Response:**
```json
{
  "success": true,
  "message": "Ticket created from email",
  "ticket_id": "uuid",
  "ticket_number": "TKT-2024-001"
}
```

### Send Email

**POST** `/api/email/send`

Send a generic email.

**Request:**
```json
{
  "to": "customer@example.com",
  "subject": "Subject",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "from": "support@example.com",
  "fromName": "Support Team"
}
```

### Test Email Configuration

**GET** `/api/email/test`

Test SMTP configuration.

**POST** `/api/email/test`

Send a test email.

**Request:**
```json
{
  "to": "test@example.com"
}
```

## Troubleshooting

### Email Not Sending

1. **Check SMTP Settings**: Verify all SMTP credentials are correct
2. **Test Configuration**: Use `/api/email/test` endpoint
3. **Check Logs**: Review server logs for SMTP errors
4. **Verify Email Enabled**: Ensure `email_enabled` is `true` in settings

### Emails Not Being Received

1. **Check Webhook URL**: Verify webhook URL is accessible
2. **Check Provider Settings**: Ensure email provider is forwarding correctly
3. **Verify Webhook Format**: Check that provider sends correct format
4. **Check Logs**: Review webhook logs for errors

### Email Threading Issues

1. **Check Headers**: Verify `In-Reply-To` and `References` headers
2. **Check Ticket Number**: Ensure ticket number is in subject
3. **Verify Reply Detection**: Check `isReplyEmail()` function logic

### Common SMTP Errors

- **535 Authentication Failed**: Invalid username/password
- **Connection Timeout**: Wrong SMTP host or port
- **TLS Error**: Port mismatch (587 vs 465)
- **Rate Limit**: Too many emails sent (check provider limits)

## Security Considerations

1. **SMTP Credentials**: Store securely in environment variables or database
2. **Webhook Verification**: Implement webhook signature verification
3. **Rate Limiting**: Implement rate limiting on webhook endpoint
4. **Email Validation**: Validate email addresses before sending
5. **SPF/DKIM**: Configure SPF and DKIM records for your domain

## Best Practices

1. **Use App Passwords**: For Gmail, use app passwords instead of main password
2. **Monitor Email Delivery**: Track bounce rates and delivery failures
3. **Handle Bounces**: Implement bounce handling for invalid emails
4. **Email Queue**: Consider implementing email queue for reliability
5. **Retry Logic**: Implement retry logic for failed email sends
6. **Email Logging**: Log all sent emails for audit trail

## Example: Setting Up with SendGrid

1. **Create SendGrid Account**
2. **Generate API Key** → Settings → API Keys → Create API Key
3. **Configure SMTP**:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP Username: apikey
   SMTP Password: [Your API Key]
   ```
4. **Set Up Inbound Parse**:
   - Settings → Inbound Parse → Add Hostname
   - Webhook URL: `https://your-domain.com/api/webhooks/email`
5. **Test**: Send email to your configured address

## Support

For email integration issues:
- Check server logs for detailed error messages
- Verify SMTP credentials are correct
- Test email configuration using `/api/email/test`
- Review email provider documentation

