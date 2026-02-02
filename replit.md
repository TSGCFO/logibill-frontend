# LogiBill Frontend

## Overview
LogiBill is a Next.js 16 frontend application with Supabase authentication and data management. Migrated from Vercel to Replit.

## Recent Changes
- **Feb 2, 2026**: Migrated from Vercel to Replit
  - Updated port bindings to 5000 for Replit compatibility
  - Removed X-Frame-Options: DENY for iframe embedding
  - Configured development workflow
  - Fixed CORS configuration in backend (TSGCFO/LogiBill) to allow Replit origins
  - Backend API: https://logi-bill-hsadiq.replit.app
  - Resolved TypeScript strict mode compilation errors:
    - Fixed Zod v4 compatibility with react-hook-form (preprocess, message instead of required_error)
    - Resolved export naming conflicts between use-billing.ts and use-billing-rules.ts 
    - Renamed customer-specific billing rule types to avoid collisions
    - Fixed JSX namespace for React 19 compatibility
    - Fixed navigator.sendBeacon type guard for SSR safety
  - Production build passes successfully

## Tech Stack
- **Framework**: Next.js 16.1.6 with Turbopack
- **UI**: React 19, Tailwind CSS 4, Radix UI components
- **State**: Zustand, React Query
- **Backend**: Supabase (authentication + database)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## Project Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utilities, Supabase client, API client
├── stores/        # Zustand stores
└── types/         # TypeScript types
```

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `NEXT_PUBLIC_API_URL` - Backend API URL (optional, defaults to localhost:5000)

## Running the Project
- **Development**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Production**: `npm run start`
- **E2E Tests**: `npm run test:e2e`

## Deployment
Configured for Replit autoscale deployment.
