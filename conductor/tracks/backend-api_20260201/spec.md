# Backend API Integration Specification

## Track Info

- **ID:** backend-api_20260201
- **Type:** feature
- **Created:** 2026-02-01
- **Status:** active

## Overview

Connect the completed Next.js frontend (55 pages, 70+ components) to the Flask backend by implementing 56 REST API endpoints and integrating them with the existing TanStack Query hooks.

## Problem Statement

The frontend is complete with UI components, pages, and data hooks, but all data is currently mocked. The backend Flask application needs REST API endpoints that the frontend can consume through the existing API client at `src/lib/api/client.ts`.

## Goals

1. Implement 56 REST API endpoints following OpenAPI standards
2. Integrate Supabase Auth with JWT validation
3. Create typed API client integration with TanStack Query
4. Ensure full feature parity with legacy Jinja templates

## Non-Goals

- Backend domain restructuring (already defined in plan)
- Frontend UI changes (already complete)
- Database schema changes (use existing models)

## Technical Requirements

### API Structure

```
api/v1/
├── auth.py          # 3 endpoints
├── customers.py     # 8 endpoints
├── orders.py        # 4 endpoints
├── invoices.py      # 12 endpoints
├── billing.py       # 9 endpoints
├── accrual.py       # 4 endpoints
├── materials.py     # 9 endpoints
├── services.py      # 3 endpoints
├── reports.py       # 5 endpoints
└── admin.py         # 4 endpoints
```

### Response Format

```json
{
  "success": true,
  "data": {...},
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid customer ID",
    "details": [...]
  }
}
```

## Acceptance Criteria

### Phase 1: Auth Foundation

- [ ] User and UserActivityLog models added to Flask
- [ ] Supabase Auth JWT validation decorator
- [ ] Role-based access control (@require_role)
- [ ] Customer isolation decorator (@require_customer_access)
- [ ] `/api/v1/auth/me` returns current user
- [ ] `/api/v1/auth/refresh` refreshes token
- [ ] `/api/v1/auth/logout` invalidates session
- [ ] OpenAPI documentation configured

### Phase 2: Customer & Order APIs

- [ ] GET `/api/v1/customers` - List with pagination, filtering, search
- [ ] GET `/api/v1/customers/{id}` - Customer detail
- [ ] POST `/api/v1/customers` - Create customer
- [ ] PUT `/api/v1/customers/{id}` - Update customer
- [ ] DELETE `/api/v1/customers/{id}` - Delete customer
- [ ] GET `/api/v1/customers/{id}/billing-config` - Get billing config
- [ ] PUT `/api/v1/customers/{id}/billing-config` - Update billing config
- [ ] GET `/api/v1/customers/{id}/products` - Customer products
- [ ] GET `/api/v1/orders` - List with filters
- [ ] GET `/api/v1/orders/{id}` - Order detail with items
- [ ] Frontend hooks connected: useCustomers, useCustomer, useOrders

### Phase 3: Invoice & Billing APIs

- [ ] GET `/api/v1/invoices` - List with filters
- [ ] GET `/api/v1/invoices/{id}` - Invoice detail
- [ ] POST `/api/v1/invoices` - Create invoice
- [ ] PUT `/api/v1/invoices/{id}` - Update invoice
- [ ] GET `/api/v1/invoices/{id}/pdf` - Generate PDF
- [ ] POST `/api/v1/invoices/{id}/send` - Send via email
- [ ] CRUD `/api/v1/invoices/{id}/line-items` - Line items
- [ ] POST `/api/v1/invoices/bulk-create` - Batch create
- [ ] POST `/api/v1/invoices/bulk-send` - Batch send
- [ ] GET `/api/v1/billing/periods` - List periods
- [ ] GET `/api/v1/billing/periods/{id}` - Period detail
- [ ] POST `/api/v1/billing/periods/{id}/close` - Close period
- [ ] Frontend hooks connected: useInvoices, useInvoice, useBillingPeriods

### Phase 4: Accrual & Admin APIs

- [ ] POST `/api/v1/accrual/run` - Trigger accrual
- [ ] POST `/api/v1/accrual/customer/{id}/run` - Customer accrual
- [ ] GET `/api/v1/accrual/stats` - Statistics
- [ ] GET `/api/v1/accrual/runs` - Run history
- [ ] POST `/api/v1/admin/sync/wms` - Trigger WMS sync
- [ ] POST `/api/v1/admin/sync/techship` - Trigger TechShip sync
- [ ] GET `/api/v1/admin/sync/status` - Sync status
- [ ] CRUD `/api/v1/admin/users` - User management
- [ ] Frontend hooks connected: useAccrual, useSyncStatus

### Phase 5: Materials & Services APIs

- [ ] CRUD `/api/v1/materials/global` - Global pricing
- [ ] CRUD `/api/v1/materials/overrides` - Customer overrides
- [ ] GET `/api/v1/materials/packaging-rates` - Packaging catalog
- [ ] GET `/api/v1/materials/audit-log` - Change history
- [ ] GET `/api/v1/services/types` - Service types
- [ ] CRUD `/api/v1/services/rates` - Service rates
- [ ] GET `/api/v1/billing/rules/{customerId}` - Billing rules
- [ ] POST `/api/v1/billing/sandbox` - Test rules
- [ ] Frontend hooks connected: useMaterials, useServices, useBillingRules

### Phase 6: Reports & Dashboard APIs

- [ ] GET `/api/v1/reports/dashboard` - Dashboard metrics
- [ ] GET `/api/v1/reports/revenue` - Revenue by period
- [ ] GET `/api/v1/reports/aging` - Invoice aging
- [ ] GET `/api/v1/reports/export` - Export CSV/Excel
- [ ] GET `/api/v1/search` - Global search
- [ ] GET `/api/v1/activity` - SSE activity feed
- [ ] All frontend pages connected to real data
- [ ] Loading states verified
- [ ] Error handling verified

## Dependencies

- Flask backend repo (LogiBill)
- Existing SQLAlchemy models
- Supabase project for Auth
- Frontend API client (`src/lib/api/client.ts`)
- TanStack Query hooks (`src/hooks/`)

## Risks

| Risk | Mitigation |
|------|------------|
| CORS issues | Configure CORS early in Phase 1 |
| Auth token handling | Test auth flow thoroughly |
| Response format mismatches | Define schemas before implementation |
| Performance with large datasets | Add pagination from start |

## Success Metrics

- All 56 endpoints return correct data
- Frontend pages load with real data
- API response times < 200ms (p95)
- No TypeScript errors in frontend
- All existing E2E tests pass
