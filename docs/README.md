# Documentation Index

Welcome to the AI Support Autoresponder documentation. This directory contains comprehensive documentation for users, administrators, developers, and API consumers.

## Documentation Files

### User Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)**: Complete guide for end users and support agents
  - Getting started
  - Managing tickets
  - Using the knowledge base
  - Reviewing AI responses
  - Analytics and reporting

### Administrator Documentation

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)**: Comprehensive guide for system administrators
  - Initial setup and configuration
  - User and team management
  - System configuration
  - Security best practices
  - Monitoring and maintenance

### API Documentation

- **[API.md](./API.md)**: Complete API reference
  - All endpoints documented
  - Request/response examples
  - Authentication
  - Error handling
  - Code examples

- **[openapi.yaml](./openapi.yaml)**: OpenAPI 3.0 specification
  - Machine-readable API specification
  - Can be imported into API clients
  - Swagger UI compatible

### Integration Documentation

- **[INTEGRATIONS.md](./INTEGRATIONS.md)**: Integration guide
  - Webhook setup
  - Email integration
  - Slack integration
  - Custom integrations

- **[WEBHOOKS.md](./WEBHOOKS.md)**: Webhook documentation
  - Incoming webhooks
  - Outgoing webhooks
  - Webhook events
  - Signature verification

- **[EMAIL_SETUP.md](./EMAIL_SETUP.md)**: Email integration setup
  - SMTP configuration
  - Email templates
  - Incoming email handling

### Testing Documentation

- **[TESTING.md](./TESTING.md)**: Testing guide
  - Running tests
  - Writing tests
  - Test structure
  - Best practices

## Quick Links

### For Users
- [Getting Started](./USER_GUIDE.md#getting-started)
- [Managing Tickets](./USER_GUIDE.md#managing-tickets)
- [Knowledge Base](./USER_GUIDE.md#knowledge-base)

### For Administrators
- [Initial Setup](./ADMIN_GUIDE.md#initial-setup)
- [User Management](./ADMIN_GUIDE.md#user-management)
- [System Configuration](./ADMIN_GUIDE.md#system-configuration)

### For Developers
- [API Reference](./API.md)
- [OpenAPI Spec](./openapi.yaml)
- [Testing Guide](./TESTING.md)

### For Integrators
- [Integration Guide](./INTEGRATIONS.md)
- [Webhook Guide](./WEBHOOKS.md)
- [Email Setup](./EMAIL_SETUP.md)

## API Quick Start

### Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### Authentication

Currently using session-based authentication. API key authentication coming soon.

### Example Request

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Support request",
    "initial_message": "I need help",
    "customer_email": "customer@example.com"
  }'
```

## Getting Help

- Check the relevant guide above
- Review API documentation for technical details
- Contact your system administrator
- Check the [Admin Guide](./ADMIN_GUIDE.md#troubleshooting) for troubleshooting

## Contributing

When updating documentation:
1. Keep it up to date with code changes
2. Include examples where helpful
3. Use clear, concise language
4. Update the relevant guide and this index

---

**Last Updated**: 2024

