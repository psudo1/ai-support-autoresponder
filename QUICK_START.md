# Quick Start Guide

Get your AI Support Autoresponder up and running quickly.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An OpenAI API key
- npm or yarn package manager

## Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Settings** → **API** to get your credentials:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (keep this secure!)

4. Go to **SQL Editor** and run the contents of `database/schema.sql`

5. **Verify the schema was created correctly:**
   - **Option A (Visual)**: Go to **Table Editor** in Supabase dashboard. You should see 6 tables:
     - `knowledge_base`
     - `tickets`
     - `conversations`
     - `ai_responses`
     - `feedback`
     - `settings`
   
   - **Option B (SQL)**: Run the verification queries from `database/verify_schema.sql` in the SQL Editor
   
   - **Quick Check**: Run this query to see all tables:
     ```sql
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' 
       AND table_name IN ('knowledge_base', 'tickets', 'conversations', 'ai_responses', 'feedback', 'settings')
     ORDER BY table_name;
     ```
     Expected: 6 rows

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Initial Setup

1. **Add Knowledge Base Content**
   - Navigate to the Knowledge Base section
   - Upload a PDF or add text content
   - This will be used by the AI to generate responses

2. **Create Your First Ticket**
   - Use the API or UI to create a test ticket
   - The system will generate an AI response based on your knowledge base

3. **Review and Configure**
   - Check the AI response quality
   - Adjust settings in the Settings page
   - Configure auto-send thresholds

## Next Steps

- Follow the `IMPLEMENTATION_CHECKLIST.md` for detailed implementation steps
- Review `PROJECT_PLAN.md` for the full architecture and features
- Start with Phase 1 MVP features

## Troubleshooting

### Database Connection Issues
- Verify your Supabase credentials are correct
- Check that the schema has been run successfully
- Ensure RLS policies are set up correctly

### OpenAI API Issues
- Verify your API key is valid
- Check your OpenAI account has credits
- Review API rate limits

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## Getting Help

- Check the project plan document for architecture details
- Review Supabase documentation: https://supabase.com/docs
- Review OpenAI API documentation: https://platform.openai.com/docs

