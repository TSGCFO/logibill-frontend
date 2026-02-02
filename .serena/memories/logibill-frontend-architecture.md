# LogiBill Frontend Architecture Reference

## Directory Structure

```
logibill-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Main dashboard layout with sidebar
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── customers/              # Customer management (6 pages)
│   │   │   ├── orders/                 # Order viewing (2 pages)
│   │   │   ├── invoices/               # Invoice management (6 pages)
│   │   │   ├── billing/                # Billing operations (12 pages)
│   │   │   ├── products/               # Product management (4 pages)
│   │   │   ├── services/               # Service configuration (4 pages)
│   │   │   ├── reports/                # Reporting (1 page)
│   │   │   ├── admin/                  # Admin functions (8 pages)
│   │   │   ├── inventory/              # Inventory (2 pages)
│   │   │   ├── files/                  # File management (2 pages)
│   │   │   ├── setup/                  # Setup wizard
│   │   │   ├── onboarding/             # Onboarding flow
│   │   │   └── bulk-upload/            # Bulk operations
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui (37 components)
│   │   ├── layout/                     # App layout (sidebar, header, command-palette)
│   │   ├── tables/                     # Data table components
│   │   ├── billing/                    # Billing-specific components
│   │   │   └── dialogs/                # Rule dialogs
│   │   ├── invoices/                   # Invoice components
│   │   ├── materials/                  # Materials pricing components
│   │   ├── customers/                  # Customer components
│   │   ├── shared/                     # Reusable shared components
│   │   ├── lazy/                       # Dynamic imports
│   │   ├── accessibility/              # A11y utilities
│   │   └── providers/                  # React context providers
│   │
│   ├── lib/
│   │   ├── api/client.ts               # API client with auth
│   │   ├── supabase/                   # Supabase client setup
│   │   ├── utils.ts                    # Utility functions (cn)
│   │   └── format.ts                   # Formatting utilities
│   │
│   ├── hooks/                          # Custom React hooks
│   ├── stores/                         # Zustand stores
│   └── types/                          # TypeScript types
│
├── e2e/                                # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── navigation.spec.ts
│   ├── error-pages.spec.ts
│   └── fixtures/auth.ts
│
├── playwright.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Key Patterns

### Data Fetching
- TanStack Query for server state
- API client at `@/lib/api/client` with JWT auth
- Query keys follow `[entity, id?, filters?]` pattern

### Forms
- React Hook Form + Zod validation
- Form components from shadcn/ui
- Inline validation with real-time feedback

### Tables
- TanStack Table v8 for data tables
- `DataTable` component at `@/components/tables/data-table`
- Supports sorting, filtering, pagination, selection

### Dialogs/Modals
- Radix Dialog via shadcn/ui
- Lazy loaded for performance
- FocusTrap for accessibility

### Loading States
- Skeleton components in each route's `loading.tsx`
- Suspense boundaries for lazy components

### Empty States
- Centralized `EmptyState` component with presets
- Consistent illustrations and CTAs

## API Integration Points

Backend API expected at: `${NEXT_PUBLIC_API_URL}/api/v1/`

Key endpoints:
- `/auth/*` - Authentication
- `/customers/*` - Customer CRUD
- `/orders/*` - Order viewing
- `/invoices/*` - Invoice management
- `/billing/*` - Billing operations
- `/accrual/*` - Accrual management
- `/materials/*` - Materials pricing
- `/reports/*` - Dashboard & reports
- `/admin/*` - Admin functions

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```
