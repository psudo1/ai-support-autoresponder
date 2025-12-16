# Admin Guide

Complete guide for administrators managing the AI Support Autoresponder system.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [User Management](#user-management)
3. [Team Management](#team-management)
4. [System Configuration](#system-configuration)
5. [API Configuration](#api-configuration)
6. [Integration Setup](#integration-setup)
7. [Security](#security)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Configuration](#advanced-configuration)

## Initial Setup

### Prerequisites

- Supabase account and project
- OpenAI API account with API key
- Domain name (for production)
- SMTP server (for email integration, optional)

### Environment Variables

Configure the following environment variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@example.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Run the database schema:
   ```sql
   -- Execute database/schema.sql in Supabase SQL Editor
   ```

2. Verify tables are created:
   ```sql
   -- Run database/verify_schema.sql
   ```

3. Set up Row Level Security (RLS) policies:
   - Policies are included in the schema
   - Verify they're active for your use case

### Initial Configuration

1. **Configure AI Settings**:
   - Navigate to Settings > AI Settings
   - Set default model (recommended: gpt-4o)
   - Configure auto-send threshold (recommended: 0.85)
   - Set default temperature and max tokens

2. **Set Up Knowledge Base**:
   - Upload initial documentation
   - Create categories for organization
   - Add tags for better searchability

3. **Configure Integrations**:
   - Set up webhook URLs if needed
   - Configure email settings
   - Set up Slack integration (optional)

## User Management

### Creating Users

1. Navigate to **Users** > **New User**
2. Fill in:
   - Email address
   - Full name
   - Role (Admin, Agent, Viewer)
   - Team assignment (optional)
3. Click **Create User**

The user will receive an invitation email with setup instructions.

### User Roles

- **Admin**: Full system access, can manage users and settings
- **Agent**: Can manage tickets, review AI responses, access analytics
- **Viewer**: Read-only access to tickets and analytics

### Managing Users

- **Edit User**: Update name, role, or team assignment
- **Deactivate User**: Remove access without deleting account
- **Delete User**: Permanently remove user (use with caution)

### Bulk Operations

- Export user list to CSV
- Import users from CSV (coming soon)
- Bulk role assignment

## Team Management

### Creating Teams

1. Navigate to **Users** > **Teams** > **New Team**
2. Enter team name and description
3. Click **Create Team**

### Managing Teams

- **Add Members**: Assign users to teams
- **Remove Members**: Remove users from teams
- **Edit Team**: Update name and description
- **Delete Team**: Remove team (members are not deleted)

### Team Permissions

Teams can be used to:
- Organize users by department
- Filter tickets by team
- Assign tickets to teams
- Generate team-specific analytics

## System Configuration

### AI Settings

**Default Model**:
- `gpt-4o`: Best quality, higher cost
- `gpt-4`: Good balance
- `gpt-3.5-turbo`: Faster, lower cost

**Temperature** (0-2):
- `0.0-0.3`: Very focused, deterministic
- `0.7`: Balanced (recommended)
- `1.0-2.0`: More creative, varied

**Auto-Send Threshold**:
- `0.9+`: Very conservative, most responses reviewed
- `0.85`: Balanced (recommended)
- `0.8-`: More automated, fewer reviews

### Integration Settings

**Webhooks**:
- Configure outgoing webhook URL
- Set webhook secret for verification
- Test webhook delivery

**Email Integration**:
- Configure SMTP settings
- Test email delivery
- Set up email templates

**Slack Integration**:
- Add Slack webhook URL
- Configure notification channels
- Test notifications

### Notification Preferences

Configure system-wide notification defaults:
- Email notifications on/off
- Slack notifications on/off
- Notification triggers (new ticket, escalation, etc.)

### Brand Voice

Set default AI response style:
- **Tone**: Professional, friendly, casual, technical
- **Style**: Formal, conversational, technical
- **Custom Instructions**: Additional guidelines

## API Configuration

### API Keys

Currently, the system uses session-based authentication. API key authentication is planned for future releases.

### Rate Limiting

Configure rate limits to prevent abuse:
- Default: 100 requests/minute per IP
- Adjust based on usage patterns
- Monitor rate limit hits in logs

### CORS Configuration

For API access from external domains:
- Configure allowed origins
- Set CORS headers appropriately
- Use environment-specific settings

## Integration Setup

### Webhook Integration

**Outgoing Webhooks**:
1. Configure webhook URL in Settings > Integrations
2. Set webhook secret
3. Test webhook delivery

**Webhook Events**:
- `ticket.created`
- `ticket.updated`
- `ticket.resolved`
- `ticket.escalated`
- `ai.response.generated`
- `ai.response.approved`
- `ai.response.rejected`
- `conversation.added`
- `feedback.received`

**Incoming Webhooks**:
- Endpoint: `/api/webhooks/receive`
- Accepts ticket creation requests
- Supports signature verification

### Email Integration

**SMTP Setup**:
1. Configure SMTP host, port, user, password
2. Test email delivery
3. Set "from" address

**Email Templates**:
- Customize ticket response emails
- Configure notification emails
- Set up email signatures

**Incoming Email**:
- Configure email webhook endpoint
- Set up email parsing
- Map emails to tickets

### Slack Integration

1. Create Slack webhook URL
2. Configure in Settings > Integrations
3. Test notification delivery
4. Customize notification format

## Security

### Authentication

- **Password Requirements**: Enforce strong passwords
- **Session Management**: Configure session timeout
- **Two-Factor Authentication**: Enable 2FA (if available)

### Authorization

- **Role-Based Access Control**: Verify role permissions
- **Team-Based Access**: Configure team permissions
- **API Access**: Restrict API access appropriately

### Data Protection

- **Encryption**: Ensure data encryption at rest and in transit
- **Backup**: Regular database backups
- **Audit Logs**: Monitor user actions
- **GDPR Compliance**: Handle data deletion requests

### Best Practices

1. Regularly review user access
2. Rotate API keys periodically
3. Monitor for suspicious activity
4. Keep dependencies updated
5. Use environment variables for secrets

## Monitoring & Maintenance

### Analytics Dashboard

Monitor key metrics:
- Ticket volume and trends
- Response times
- AI confidence scores
- Cost tracking
- Customer satisfaction

### Logs

Review logs for:
- API errors
- Failed authentication attempts
- Webhook delivery failures
- Email delivery issues

### Performance Monitoring

- Response time monitoring
- Database query performance
- API rate limit usage
- Error rates

### Regular Maintenance

**Daily**:
- Review pending tickets
- Check for failed webhooks
- Monitor error logs

**Weekly**:
- Review analytics
- Update knowledge base
- Check user activity

**Monthly**:
- Review and optimize AI settings
- Analyze cost trends
- Update documentation
- Review security logs

## Troubleshooting

### Common Issues

**AI Responses Not Generating**:
- Check OpenAI API key
- Verify API quota/limits
- Check ticket content quality
- Review error logs

**Knowledge Base Not Working**:
- Verify entries are active
- Check search indexing
- Review category filters
- Test search queries

**Webhooks Not Delivering**:
- Verify webhook URL
- Check webhook secret
- Review delivery logs
- Test webhook endpoint

**Email Not Sending**:
- Verify SMTP settings
- Test SMTP connection
- Check email logs
- Verify "from" address

**Performance Issues**:
- Check database query performance
- Review API response times
- Monitor server resources
- Optimize knowledge base queries

### Debug Mode

Enable debug logging:
```bash
DEBUG=true npm run dev
```

Check logs in:
- Browser console (client-side)
- Server logs (server-side)
- Supabase logs (database)

## Advanced Configuration

### Custom AI Prompts

Create category-specific prompts:
1. Navigate to Settings > Category Prompts
2. Create prompt for category
3. AI will use custom prompt for that category

### Response Templates

Create reusable response templates:
1. Navigate to Templates
2. Create template with variables
3. Use templates in AI responses

### Multi-Language Support

Configure language settings:
1. Navigate to Settings > Language
2. Set default language
3. Configure language-specific prompts

### Custom Branding

Customize system appearance:
1. Navigate to Settings > Branding
2. Upload logo
3. Set color scheme
4. Configure email templates

### Database Optimization

**Indexes**:
- Ensure indexes on frequently queried fields
- Monitor query performance
- Add indexes as needed

**Backups**:
- Configure automatic backups
- Test restore procedures
- Store backups securely

**Migrations**:
- Review migration files
- Test migrations in staging
- Document schema changes

## Backup & Recovery

### Database Backups

- Configure Supabase automatic backups
- Export data regularly
- Store backups securely

### Recovery Procedures

1. Restore from backup
2. Verify data integrity
3. Test system functionality
4. Notify users if needed

## Scaling

### Performance Optimization

- Use CDN for static assets
- Implement caching strategies
- Optimize database queries
- Use connection pooling

### Horizontal Scaling

- Deploy multiple instances
- Use load balancer
- Configure session storage
- Monitor resource usage

## Support & Resources

### Documentation

- API Documentation: `/docs/API.md`
- OpenAPI Spec: `/docs/openapi.yaml`
- Integration Guide: `/docs/INTEGRATIONS.md`
- Webhook Guide: `/docs/WEBHOOKS.md`

### Community

- GitHub Issues: Report bugs
- Documentation: Check guides
- Support Email: Contact support

---

**Last Updated**: 2024

