# AI Support Autoresponder

An intelligent support ticket autoresponder system that uses AI (OpenAI) to automatically generate contextual, helpful responses to customer support inquiries. Built with Next.js, Supabase, and OpenAI.

## 🚀 Quick Start

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Copy contents of database/schema.sql to Supabase SQL Editor

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Complete project architecture, features, and technical specifications
- **[QUICK_START.md](./QUICK_START.md)** - Step-by-step setup guide
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Detailed implementation checklist

## 🎯 Key Features

- **AI-Powered Responses**: Automatically generate contextual responses using OpenAI
- **Knowledge Base Management**: Upload and manage documentation (PDF, text)
- **Ticket Management**: Full support ticket lifecycle management
- **Response Review**: Human-in-the-loop approval workflow
- **Multi-channel Support**: Email, webhooks, API integrations
- **Analytics Dashboard**: Track response quality, costs, and metrics

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI API
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📋 Project Status

This project is in the planning phase. See [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for current progress.

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📦 Dependencies

- `next` - React framework
- `@supabase/supabase-js` - Supabase client
- `openai` - OpenAI API client
- `pdf-parse` - PDF text extraction
- `react` & `react-dom` - UI library

## 🔒 Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (server-side only)
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_APP_URL` - Application URL

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 📄 License

This project is private and proprietary.
