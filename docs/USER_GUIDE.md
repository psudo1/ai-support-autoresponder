# User Guide

Welcome to the AI Support Autoresponder! This guide will help you get started with using the system as an end user or support agent.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Tickets](#managing-tickets)
4. [Knowledge Base](#knowledge-base)
5. [AI Responses](#ai-responses)
6. [Review Queue](#review-queue)
7. [Analytics](#analytics)
8. [Settings](#settings)
9. [Tips & Best Practices](#tips--best-practices)

## Getting Started

### Creating an Account

1. Navigate to the signup page
2. Enter your email address and create a password
3. Check your email for a confirmation link
4. Click the confirmation link to verify your account
5. Log in with your credentials

### First Login

When you first log in, you'll see the dashboard with an overview of your support tickets and system statistics.

## Dashboard Overview

The dashboard provides a quick overview of your support operations:

- **Total Tickets**: Number of all tickets in the system
- **New Tickets**: Tickets awaiting initial response
- **Resolved**: Successfully resolved tickets
- **Knowledge Base**: Number of knowledge base entries

You'll also see a list of recent tickets with their status and creation date.

## Managing Tickets

### Viewing Tickets

1. Navigate to **Tickets** from the sidebar
2. You'll see a list of all tickets with:
   - Ticket number
   - Subject
   - Customer email
   - Status
   - Priority
   - Created date

### Filtering Tickets

Use the filters at the top of the tickets page to:
- Filter by status (new, ai_responded, human_review, resolved, escalated, closed)
- Filter by priority (low, medium, high, urgent)
- Search by customer email

### Creating a New Ticket

1. Click **New Ticket** button
2. Fill in the required fields:
   - **Subject**: Brief description of the issue
   - **Initial Message**: Detailed description from the customer
   - **Customer Email**: Customer's email address
   - **Customer Name**: (Optional) Customer's name
   - **Priority**: Select appropriate priority level
   - **Category**: (Optional) Categorize the ticket
3. Click **Create Ticket**

### Viewing Ticket Details

1. Click on any ticket from the list
2. You'll see:
   - Full ticket information
   - Conversation history
   - AI-generated responses
   - Customer feedback
   - Ticket status and priority

### Updating a Ticket

From the ticket detail page, you can:
- **Change Status**: Update ticket status (e.g., mark as resolved)
- **Change Priority**: Adjust priority level
- **Assign to User**: Assign ticket to a team member
- **Add Category**: Categorize the ticket

### Generating AI Responses

1. Open a ticket
2. Click **Generate AI Response**
3. The system will:
   - Analyze the ticket content
   - Search the knowledge base for relevant information
   - Generate an appropriate response
   - Show confidence score and whether review is needed

### Sending Manual Responses

1. Open a ticket
2. Scroll to the conversation section
3. Type your response in the message box
4. Select sender type (Human)
5. Click **Send**

## Knowledge Base

The knowledge base stores information that helps the AI generate accurate responses.

### Viewing Knowledge Base Entries

1. Navigate to **Knowledge Base** from the sidebar
2. Browse entries by category or search using the search bar
3. Click on any entry to view full content

### Creating Knowledge Base Entries

1. Click **New Entry**
2. Fill in:
   - **Title**: Descriptive title
   - **Content**: Full text content
   - **Category**: Organize by category
   - **Tags**: Add relevant tags for searchability
3. Click **Create**

### Uploading Files

You can upload PDF, text, or markdown files:

1. Click **Upload File**
2. Select your file
3. Enter a title
4. Optionally add category and tags
5. Click **Upload**

The system will automatically extract text from PDFs and create a knowledge base entry.

## AI Responses

### Understanding AI Responses

When the AI generates a response, you'll see:
- **Response Text**: The generated response
- **Confidence Score**: How confident the AI is (0-1 scale)
- **Status**: pending_review, approved, rejected, or sent
- **Model Used**: Which AI model generated the response
- **Tokens Used**: API usage information

### Reviewing AI Responses

AI responses may require review before sending:

1. Navigate to **Review Queue**
2. You'll see responses that need review
3. For each response, you can:
   - **Approve**: Approve and send immediately
   - **Edit**: Modify the response before sending
   - **Reject**: Reject and regenerate

### Auto-Send Threshold

Responses with confidence scores above the auto-send threshold are automatically sent without review. You can configure this threshold in Settings.

## Review Queue

The review queue shows all AI responses that need human review.

### Reviewing Responses

1. Navigate to **Review Queue**
2. Click on a response to review
3. Read the response and ticket context
4. Choose an action:
   - **Approve & Send**: Send as-is
   - **Edit**: Modify before sending
   - **Reject**: Reject and optionally regenerate

### Editing Responses

1. Click **Edit** on a response
2. Modify the text in the editor
3. Click **Save Changes**
4. Approve to send the edited version

## Analytics

The analytics dashboard provides insights into your support operations.

### Available Metrics

- **Response Time**: Average time to respond to tickets
- **Ticket Status**: Distribution of tickets by status
- **AI Confidence**: Confidence score distribution
- **Cost Tracking**: API usage and costs
- **Customer Satisfaction**: CSAT and NPS scores
- **Escalation Rate**: Percentage of escalated tickets
- **Response Quality**: Quality trends over time
- **Feedback Analytics**: Customer feedback statistics

### Viewing Analytics

1. Navigate to **Analytics** from the sidebar
2. Select a date range (optional)
3. View charts and metrics
4. Export data using the **Export** button

### Exporting Data

1. Go to Analytics page
2. Click **Export**
3. Choose format (CSV or JSON)
4. Select date range
5. Download the file

## Settings

### AI Settings

Configure AI behavior:
- **Default Model**: Choose the AI model (e.g., gpt-4o)
- **Default Temperature**: Control creativity (0-2)
- **Default Max Tokens**: Maximum response length
- **Auto-Send Threshold**: Confidence score threshold for auto-sending
- **Include Knowledge Base**: Whether to search KB by default

### Integration Settings

Configure external integrations:
- **Webhook URL**: URL for outgoing webhooks
- **Webhook Secret**: Secret for webhook verification
- **Slack Webhook**: Slack integration URL
- **Email Settings**: SMTP configuration for email integration

### Notification Preferences

Control when you receive notifications:
- **Email Notifications**: Enable/disable email alerts
- **Slack Notifications**: Enable/disable Slack alerts
- **Notify on New Ticket**: Get notified of new tickets
- **Notify on Escalation**: Get notified when tickets escalate

### Brand Voice

Customize AI response style:
- **Tone**: Professional, friendly, casual, etc.
- **Style**: Formal, conversational, technical, etc.
- **Custom Instructions**: Additional guidelines for AI responses

## Tips & Best Practices

### For Support Agents

1. **Review High-Priority Tickets First**: Sort by priority to handle urgent issues
2. **Use Knowledge Base**: Keep KB entries updated for better AI responses
3. **Provide Feedback**: Rate AI responses to improve future suggestions
4. **Monitor Analytics**: Regularly check analytics to identify trends
5. **Edit Before Sending**: Always review AI responses before sending to customers

### For Administrators

1. **Configure Auto-Send Threshold**: Balance automation with quality
2. **Maintain Knowledge Base**: Regularly update KB with new information
3. **Monitor Costs**: Track API usage in analytics
4. **Set Up Integrations**: Configure webhooks and email for seamless workflows
5. **Train Team**: Ensure team members understand the review process

### Best Practices

- **Clear Subject Lines**: Use descriptive subjects for tickets
- **Detailed Messages**: Provide context in initial messages
- **Proper Categorization**: Categorize tickets for better organization
- **Regular Reviews**: Review AI responses regularly to maintain quality
- **Customer Feedback**: Encourage customers to provide feedback

## Troubleshooting

### Can't Generate AI Response

- Check that OpenAI API key is configured
- Verify ticket has sufficient content
- Check API usage limits

### Knowledge Base Not Found

- Ensure knowledge base entries are active
- Check search query spelling
- Verify category filters

### Response Quality Issues

- Update knowledge base with relevant information
- Adjust AI settings (temperature, model)
- Review and edit responses before sending

## Getting Help

If you need assistance:
1. Check the knowledge base for common issues
2. Contact your system administrator
3. Review the Admin Guide for advanced configuration

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New ticket
- `Esc`: Close modals

---

**Last Updated**: 2024

