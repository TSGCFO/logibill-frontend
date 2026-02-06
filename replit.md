# LogiBill Frontend

## Overview
Next.js-based billing and customer management dashboard with Supabase authentication, connecting to a Python/Flask backend API (LogiBill) deployed at `https://logi-bill-hsadiq.replit.app`.

## Tech Stack
- **Framework:** Next.js 16.1.6 (Turbopack, App Router)
- **Auth:** Supabase (client-side sessions)
- **State:** Zustand stores (`auth`, `dashboard`, `customer-context`)
- **UI:** shadcn/ui, Tailwind CSS, Radix primitives
- **API Client:** Custom fetch wrapper (`src/lib/api/client.ts`)
- **Error Tracking:** Sentry

## Key Architecture Decisions

### Authentication Flow
1. User logs in via Supabase Auth (email/password or OAuth)
2. Frontend sends Supabase JWT to backend `/auth/me` endpoint
3. Backend validates JWT with `SUPABASE_JWT_SECRET`, looks up user by `supabase_user_id`
4. If user not found in backend → returns 401 (user not provisioned)
5. Frontend handles this gracefully with an informative toast, **without** signing out the valid Supabase session

### API Error Handling
- Backend returns flat errors: `{ error: "...", message: "..." }`
- API client normalizes these into: `{ success: false, error: { code, message, details } }`
- Auth error handler checks Supabase session validity before signing out on 401
- Dashboard widgets show destructive error cards instead of blank/loading states

### Dashboard Widgets
- Configurable grid layout with drag-to-reorder
- Widget types: revenue_mtd, orders_today, pending_invoices, overdue_invoices, revenue_chart, quick_actions, recent_activity, unbilled_charges, sync_status
- All metric widgets accept `error` prop and render error states gracefully

## Project Structure
```
src/
  app/
    (dashboard)/     # Protected dashboard routes
    login/           # Login page
  components/
    dashboard/       # Dashboard widgets
    layout/          # App shell (sidebar, header, banner)
    providers/       # Auth + query providers
    ui/              # shadcn/ui components
  lib/
    api/             # API client, error handling
    supabase/        # Supabase client setup
  stores/            # Zustand stores (auth, dashboard, customer-context)
```

## General Guidelines
- Use TypeScript for all new code
- Follow consistent naming conventions
- Write self-documenting code with clear variable and function names
- Prefer composition over inheritance

## Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Use trailing commas in multi-line objects and arrays

## Recent Changes (2026-02-06)
- Fixed autoscale deployment configuration (build: `npm run build`, run: `npm start`)
- Fixed API client to normalize flat backend error responses
- Fixed auth error handler to check Supabase session before signing out on 401
- Added "Account not provisioned" toast in initAuth for 401/403 without clearing session
- Added error states to all dashboard widgets including UnbilledChargesWidget
