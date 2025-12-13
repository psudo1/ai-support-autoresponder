# Sample Knowledge Base Files

This directory contains sample knowledge base files for testing the AI Support Autoresponder system. These files are based on a realistic SaaS company and cover common support scenarios.

## Files Included

1. **01-faq-account-setup.txt** - Account creation, login, password management
2. **02-faq-billing.txt** - Billing, subscriptions, payments, refunds
3. **03-troubleshooting-login.md** - Login problems and solutions
4. **04-product-features.md** - Product features and functionality
5. **05-refund-policy.txt** - Refund policy and procedures
6. **06-api-documentation.md** - API documentation and integration
7. **07-system-requirements.txt** - System requirements and compatibility
8. **08-security-best-practices.md** - Security guidelines and best practices

## How to Use These Files

### Option 1: Upload via Dashboard
1. Start your dev server: `npm run dev`
2. Navigate to `/dashboard/knowledge-base/new`
3. Upload each file individually
4. Fill in title, category, and tags

### Option 2: Create via API
Use the API to create entries programmatically:

```bash
# Example: Create FAQ entry
curl -X POST http://localhost:3000/api/knowledge-base \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Account Setup FAQ",
    "content": "<paste file content>",
    "category": "Account",
    "tags": ["faq", "account", "setup"]
  }'
```

### Option 3: Manual Entry
1. Go to `/dashboard/knowledge-base/create`
2. Copy content from files
3. Paste into the form
4. Add appropriate title, category, and tags

## Suggested Categories

- **Account** - Account setup, login, password
- **Billing** - Payments, subscriptions, refunds
- **Product** - Features, functionality, usage
- **Technical** - API, integrations, system requirements
- **Support** - Troubleshooting, help guides
- **Policies** - Refunds, security, terms

## Suggested Tags

- `faq` - Frequently asked questions
- `account` - Account-related topics
- `billing` - Billing and payments
- `troubleshooting` - Problem solving
- `product` - Product features
- `api` - API documentation
- `security` - Security topics
- `policy` - Policy documents

## Testing Checklist

After uploading these files, test:

- [ ] Files upload successfully
- [ ] Content displays correctly
- [ ] Search finds relevant entries
- [ ] Categories work properly
- [ ] Tags are applied correctly
- [ ] AI responses use knowledge base content
- [ ] Search returns relevant results

## File Types

- **Text files** (`.txt`) - Ready to upload directly
- **Markdown files** (`.md`) - Ready to upload or can be converted to text/PDF if needed

## Notes

- These are sample files for testing purposes
- Content is realistic but fictional
- Adjust categories and tags to match your needs
- You can modify content as needed for your testing

## Next Steps

1. Upload these files to your knowledge base
2. Test search functionality
3. Create a test ticket
4. Generate an AI response to see how knowledge base content is used

