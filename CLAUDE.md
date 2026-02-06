# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LogiBill is a billing and invoicing management system. This is the Next.js frontend that communicates with a separate Flask REST API backend.

## Commands

```bash
npm run dev              # Development server (port 5000)
npm run build            # Production build
npm run lint             # Run ESLint
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # E2E tests with interactive UI
npm run test:e2e:headed  # E2E tests in headed browser mode
npm run test:e2e:debug   # Debug E2E tests
```

Run a single E2E test:

```bash
npx playwright test e2e/auth.spec.ts
```

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript 5
- **Styling**: TailwindCSS 4, shadcn/ui (new-york style), Radix UI primitives
- **State**: TanStack Query (server state), Zustand (client state), React Hook Form + Zod (forms)
- **Tables**: TanStack Table for sorting, filtering, pagination
- **Auth**: Supabase Auth with JWT tokens
- **Testing**: Playwright (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login/register routes
│   └── (dashboard)/        # Protected dashboard routes
├── components/
│   ├── ui/                 # shadcn/ui primitives (37+ components)
│   ├── layout/             # Sidebar, Header, CommandPalette
│   ├── billing/            # Billing domain components
│   ├── invoices/           # Invoice components
│   ├── customers/          # Customer components
│   ├── shared/             # Reusable components (StatCard, ActivityItem)
│   └── lazy/               # Dynamic imports for heavy components
├── hooks/                  # Domain-specific hooks (use-customers.ts, use-invoices.ts, etc.)
├── stores/                 # Zustand stores (auth.ts, ui.ts)
├── lib/
│   ├── api/client.ts       # Type-safe API client with JWT auth
│   └── supabase/           # Supabase client and middleware
└── types/                  # TypeScript definitions
```

## Key Patterns

### API Client

```typescript
import { api, endpoints } from "@/lib/api/client";

const customers = await api.get(endpoints.customers.list, { limit: 10 });
const customer = await api.get(endpoints.customers.detail(id));
```

### Query Keys

```typescript
// Pattern: [entity, id?, filters?]
queryKey: ["customers", params]
queryKey: ["customers", id]
queryKey: ["invoices", { status: "pending" }]
```

### Error Handling

```typescript
// ApiError has type-safe checks
if (error instanceof ApiError) {
  error.isAuthError()       // 401
  error.isForbiddenError()  // 403
  error.isValidationError() // 422
  error.isNetworkError()    // Network failures
}
```

## Terminology

Use these terms consistently:

| Use | Don't Use |
|-----|-----------|
| Customer | Client, Account |
| Order | Shipment (unless specific) |
| Invoice | Bill |
| Billing Period | Cycle |
| Accrual | Deferred Revenue |
| Rule | Policy, Condition |

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Performance Notes

- Heavy components (charts, dialogs) are lazy-loaded from `src/components/lazy/`
- Package imports optimized in next.config.ts for lucide-react, recharts, date-fns
- Images optimized with AVIF/WebP formats
- Bundle analyzer available: `ANALYZE=true npm run build`

## Accessibility

- Skip links implemented for keyboard navigation
- WCAG 2.1 AA compliance targeted
- Focus management in modals
- Screen reader announcer for dynamic content

<!-- BEGIN ContextStream -->
# Workspace: LogiBill

# Project: logibill-frontend

# Workspace ID: c4cf8e08-6709-462d-b320-5f7ac409c8e5

# Claude Code Instructions

<contextstream_rules>

| Message | Required |
|---------|----------|
| **1st message** | `mcp__contextstream__init()` → `mcp__contextstream__context(user_message="...")` |
| **Every message** | `mcp__contextstream__context(user_message="...")` FIRST |
| **Before file search** | `mcp__contextstream__search(mode="hybrid")` BEFORE Glob/Grep/Read |
</contextstream_rules>

**Why?** `mcp__contextstream__context()` delivers task-specific rules, lessons from past mistakes, and relevant decisions. Skip it = fly blind.

**Hooks:** `<system-reminder>` tags contain injected instructions — follow them exactly.

**Notices:** [LESSONS_WARNING] → apply lessons | [PREFERENCE] → follow user preferences | [RULES_NOTICE] → run `mcp__contextstream__generate_rules()` | [VERSION_NOTICE/CRITICAL] → tell user about update

v0.4.58
<!-- END ContextStream -->
