/**
 * Zapier Integration Example
 * 
 * This example shows how to integrate with Zapier to create tickets
 * when certain events occur in other systems.
 */

/**
 * Zapier Webhook Action Configuration
 * 
 * In Zapier, configure a "Webhooks by Zapier" action with:
 * 
 * Method: POST
 * URL: https://your-domain.com/api/webhooks/receive
 * Data:
 * {
 *   "event": "ticket.create",
 *   "data": {
 *     "subject": "{{trigger_field_subject}}",
 *     "message": "{{trigger_field_message}}",
 *     "customer_email": "{{trigger_field_email}}",
 *     "customer_name": "{{trigger_field_name}}",
 *     "priority": "medium",
 *     "category": "Support"
 *   }
 * }
 */

/**
 * Example Zapier Scenarios
 */

// Scenario 1: Gmail → Support Ticket
const gmailToTicket = {
  trigger: 'New Email in Gmail',
  action: {
    url: 'https://your-domain.com/api/webhooks/receive',
    method: 'POST',
    data: {
      event: 'ticket.create',
      data: {
        subject: '{{email_subject}}',
        message: '{{email_body}}',
        customer_email: '{{email_from}}',
        customer_name: '{{email_from_name}}',
        priority: 'medium',
        category: 'Email Support',
      },
    },
  },
};

// Scenario 2: Google Forms → Support Ticket
const formToTicket = {
  trigger: 'New Form Submission',
  action: {
    url: 'https://your-domain.com/api/webhooks/receive',
    method: 'POST',
    data: {
      event: 'ticket.create',
      data: {
        subject: '{{form_question_1}}',
        message: '{{form_question_2}}',
        customer_email: '{{form_email}}',
        customer_name: '{{form_name}}',
        priority: '{{form_priority}}',
        category: '{{form_category}}',
      },
    },
  },
};

// Scenario 3: Stripe → Support Ticket (for failed payments)
const stripeToTicket = {
  trigger: 'Payment Failed',
  action: {
    url: 'https://your-domain.com/api/webhooks/receive',
    method: 'POST',
    data: {
      event: 'ticket.create',
      data: {
        subject: 'Payment Failed - {{customer_email}}',
        message: `Payment failed for customer {{customer_email}}. Amount: {{amount}}. Please investigate.`,
        customer_email: '{{customer_email}}',
        priority: 'high',
        category: 'Billing',
      },
    },
  },
};

// Scenario 4: Slack → Support Ticket
const slackToTicket = {
  trigger: 'New Message in Slack Channel',
  action: {
    url: 'https://your-domain.com/api/webhooks/receive',
    method: 'POST',
    data: {
      event: 'ticket.create',
      data: {
        subject: 'Support Request from Slack',
        message: '{{slack_message_text}}',
        customer_email: '{{slack_user_email}}',
        customer_name: '{{slack_user_name}}',
        priority: 'medium',
        category: 'Slack Support',
      },
    },
  },
};

module.exports = {
  gmailToTicket,
  formToTicket,
  stripeToTicket,
  slackToTicket,
};

