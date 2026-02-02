# Build Error: response.data.data Pattern

## Issue
TypeScript strict mode error: `'response.data' is possibly 'undefined'`

This occurs because the API client returns `ApiResponse<T>` where `data?: T` (optional).

## Files Requiring Fix (27 instances in 18 files)

### Admin
- `src/app/(dashboard)/admin/periods/[id]/page.tsx:119`

### Billing
- `src/app/(dashboard)/billing/audit/page.tsx:79`
- `src/app/(dashboard)/billing/bulk/page.tsx:91,102,117,144`
- `src/app/(dashboard)/billing/generate/page.tsx:97,112,128,143`
- `src/app/(dashboard)/billing/carrier-markup/page.tsx:114`
- `src/app/(dashboard)/billing/dual-run/page.tsx:104`
- `src/app/(dashboard)/billing/dual-run/[id]/page.tsx:88`

### Invoices
- `src/app/(dashboard)/invoices/bulk-create/page.tsx:64`
- `src/app/(dashboard)/invoices/bulk-send/page.tsx:55`
- `src/app/(dashboard)/invoices/from-period/[periodId]/page.tsx:56,66`

### Customers
- `src/app/(dashboard)/customers/[id]/apply-template/page.tsx:86,96`
- `src/app/(dashboard)/customers/[id]/products/page.tsx:47,57`
- `src/app/(dashboard)/customers/[id]/setup/page.tsx:66`

### Other
- `src/app/(dashboard)/setup/page.tsx:132`
- `src/app/(dashboard)/onboarding/page.tsx:93`
- `src/app/(dashboard)/services/config/page.tsx:118`
- `src/app/(dashboard)/products/[id]/edit/page.tsx:68`
- `src/app/(dashboard)/inventory/transactions/page.tsx:81`

## Fix Pattern

```typescript
// BEFORE (causes error)
const response = await api.get<{ data: MyType }>("/api/...");
return response.data.data;

// AFTER (fixed)
const response = await api.get<MyType>("/api/...");
return response.data;
```

## Status
Pending fix - required for successful Replit deployment
