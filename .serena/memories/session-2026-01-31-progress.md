# LogiBill Frontend Migration - Session Progress

## Session Date: 2026-01-31

## Overview
Continuing the LogiBill frontend migration from Jinja templates to Next.js 16 with App Router. This session focused on fixing build errors and creating remaining P1/P2 pages.

## Build Issues Fixed

### Zod Schema Type Issues
- **Problem**: `z.coerce.number()` causes `unknown` type inference issues with `zodResolver` in strict TypeScript mode
- **Solution**: Use `z.number()` and add manual `Number(e.target.value)` conversion in Input `onChange` handlers
- **Files affected**: 
  - `customers/new/page.tsx`
  - `customers/[id]/edit/page.tsx`
  - `invoices/new/page.tsx`
  - `products/new/page.tsx`
  - `billing/carrier-markup/page.tsx`

### API Response Type Access
- **Problem**: `useCustomers` hook returns `ApiResponse<PaginatedResponse<Customer>>` but pages accessed `.data` incorrectly
- **Solution**: Hook returns `response.data` directly, pages access `data?.data` for array and `data?.meta` for pagination
- **Pattern**: `const customers = customersData?.data ?? []`

### SelectItem Value Type
- **Problem**: SelectItem `value` prop expects string but customer IDs may be numbers
- **Solution**: Wrap with `String(customer.id)` when passing to SelectItem

## Pages Created This Session

### Invoice Operations (P0-P1)
1. `/invoices/from-period/[periodId]` - Generate invoices from billing period with customer selection
2. `/invoices/bulk-create` - Bulk invoice creation with period and customer selection
3. `/invoices/bulk-send` - Bulk email sending with progress tracking

### Customer Management (P1)
4. `/customers/[id]/products` - Customer-specific products management

### Product Management (P1)
5. `/products/[id]/edit` - Edit product form with customer assignment

### Billing Configuration (P1)
6. `/billing/audit` - Billing audit log with filtering by action, resource, customer
7. `/billing/carrier-markup` - Carrier markup configuration (global + customer-specific)

### Operations (P2)
8. `/inventory/transactions` - Inventory transaction history with filtering
9. `/files/upload` - Multi-file upload with drag-drop and progress tracking
10. `/services/config` - Service-level configuration management

## Sidebar Navigation Updates
- Added sub-menus for Invoices, Services, Inventory, Files
- Added Billing Audit Log link
- Organized navigation into collapsible sections

## Total Pages: 40

## Architecture Patterns

### Data Fetching
```typescript
const { data: customersData } = useCustomers();
const customers = customersData?.data ?? [];
```

### Form with Number Fields
```typescript
const schema = z.object({
  weight: z.number().min(0).optional(),
});

<Input
  type="number"
  {...field}
  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
/>
```

### Mutation with Type Safety
```typescript
const createInvoice = useMutation({
  mutationFn: async (data: FormValues) => {
    const response = await api.post<{ id: string }>("/api/v1/invoices", data);
    return response.data;
  },
});
```

## Remaining Pages (Lower Priority)
- `/customers/[id]/setup` - Customer setup wizard
- `/billing/bulk` - Bulk billing operations
- `/billing/generate` - Generate billing
- `/setup` - Setup wizard
- `/onboarding` - Onboarding form
- `/admin/onboarding-tokens` - Token management
- `/billing/dual-run` - Dual run comparison
- `/customers/[id]/apply-template` - Apply rate template

## Tech Stack
- Next.js 16 with App Router
- TypeScript strict mode
- shadcn/ui + Radix UI
- TanStack Query + Table
- React Hook Form + Zod
- Tailwind CSS
- sonner for toasts
