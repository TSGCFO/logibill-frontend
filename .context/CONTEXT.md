# LogiBill Frontend - Project Context

> **Context Fingerprint:** `sprint13-complete-2026-02-01`
> **Last Updated:** 2026-02-01

## Quick Reference

| Metric | Value |
|--------|-------|
| Pages | 55 |
| Components | 70+ |
| Framework | Next.js 16.1.6 |
| React | 19.2.3 |
| Status | Frontend Complete |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LogiBill Frontend                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router                                         │
│  ├── (auth) - Login/Auth pages                             │
│  └── (dashboard) - 55 application pages                    │
├─────────────────────────────────────────────────────────────┤
│  Components (70+)                                           │
│  ├── ui/ - shadcn/ui primitives                            │
│  ├── layout/ - Sidebar, Header, CommandPalette             │
│  ├── billing/ - Billing domain + rule dialogs              │
│  ├── invoices/ - Invoice management                        │
│  ├── materials/ - Materials pricing tables                 │
│  ├── customers/ - Customer management                      │
│  ├── shared/ - Reusable components                         │
│  ├── lazy/ - Dynamic imports                               │
│  └── accessibility/ - A11y utilities                       │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── TanStack Query - Server state                         │
│  ├── Zustand - Client state                                │
│  └── API Client - JWT auth via Supabase                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Files

### Configuration
- `next.config.ts` - Performance optimizations, security headers
- `playwright.config.ts` - E2E test configuration
- `tailwind.config.ts` - Tailwind setup

### Layouts
- `src/app/layout.tsx` - Root with skip links, announcer
- `src/app/(dashboard)/layout.tsx` - Dashboard with sidebar

### API Integration
- `src/lib/api/client.ts` - Fetch wrapper with auth
- `src/lib/supabase/client.ts` - Supabase client

## Domain Components

### Billing
- `BillingMetrics` - Dashboard metrics cards
- `BillingRulesList` - Rule management
- `ChargeDisplay` - Charge formatting
- `UnbilledPreview` - Pending charges view
- **Dialogs:** CarrierRule, OrderType, Conditional

### Invoices
- `InvoiceLineItems` - Line item table
- `InvoiceTotals` - Totals summary
- `InvoiceEmailPreviewDialog` - Email preview

### Materials
- `MaterialsGlobalTable` - Global pricing
- `MaterialsOverridesTable` - Customer overrides
- `MaterialsAuditLog` - Change history
- `PackagingRateCatalog` - Rate catalog

### Customers
- `SetupChecklist` - Onboarding progress
- `PackagingOverrides` - Customer pricing
- `CustomerActivityFeed` - Activity timeline

### Shared
- `StatCard` - Dashboard metrics
- `ActivityItem` - Activity feed items
- `SearchResults` - Global search
- `EvaluationTrace` - Rule debugging
- `EmptyState` - Empty state presets

## Performance Optimizations

1. **Lazy Loading** - Charts, dialogs, heavy tables
2. **Package Optimization** - lucide-react, radix-ui, recharts
3. **Image Optimization** - AVIF/WebP formats
4. **Font Display** - swap for faster paint

## Accessibility Features

1. **Skip Links** - Jump to main content/navigation
2. **Focus Trap** - Modal keyboard management
3. **Screen Reader Announcer** - Dynamic announcements
4. **Landmark Roles** - Proper ARIA structure
5. **Keyboard Navigation** - Full support

## Next Steps

1. Implement backend REST API (56 endpoints)
2. Connect frontend to backend
3. Configure Supabase Auth
4. Run E2E test suite
5. Deploy to Vercel

## Related Resources

- **Plan:** `~/.claude/plans/indexed-sparking-hanrahan.md`
- **Serena Memories:**
  - `logibill-frontend-sprint13-complete`
  - `logibill-frontend-architecture`
