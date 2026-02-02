# Backend API Integration - Implementation Plan

## Track Info
- **ID:** backend-api_20260201
- **Type:** feature
- **Phases:** 6

---

## Phase 1: Auth Foundation

**Goal:** Authentication system with JWT validation

### Tasks

- [x] 1.1 Add User model to Flask `models.py`
  ```python
  class User(db.Model):
      id = db.Column(UUID, primary_key=True)
      supabase_user_id = db.Column(String, unique=True)
      email = db.Column(String, unique=True)
      role = db.Column(Enum('admin', 'customer', 'accountant', 'viewer'))
      customer_id = db.Column(Integer, ForeignKey('customer.id'), nullable=True)
      company_id = db.Column(Integer, ForeignKey('company.id'))
      created_at = db.Column(DateTime)
      last_login = db.Column(DateTime)
  ```

- [x] 1.2 Add UserActivityLog model
  ```python
  class UserActivityLog(db.Model):
      id = db.Column(Integer, primary_key=True)
      user_id = db.Column(UUID, ForeignKey('user.id'))
      action = db.Column(String)
      resource_type = db.Column(String)
      resource_id = db.Column(String)
      ip_address = db.Column(String)
      timestamp = db.Column(DateTime)
  ```

- [x] 1.3 Create `utils/auth.py` with decorators
  - `@token_required` - Validates Supabase JWT
  - `@require_role(*roles)` - Role-based access
  - `@require_customer_access` - Customer isolation

- [x] 1.4 Create API v1 blueprint structure
  ```
  api/
  ├── __init__.py
  └── v1/
      ├── __init__.py
      ├── auth.py
      └── schemas/
          └── auth.py
  ```

- [x] 1.5 Implement auth endpoints
  - GET `/api/v1/auth/me` - Current user info
  - POST `/api/v1/auth/refresh` - Refresh token
  - POST `/api/v1/auth/logout` - Invalidate session

- [x] 1.6 Configure CORS for frontend domain
  ```python
  CORS(app, resources={
      r"/api/*": {"origins": ["http://localhost:3000", "https://logibill.vercel.app"]}
  })
  ```

- [x] 1.7 Add OpenAPI/Swagger documentation (flask-openapi3)

- [x] 1.8 Update frontend API client to use real auth
  - Update `src/lib/api/client.ts` for JWT handling
  - Test auth flow end-to-end

### Verification
```bash
# Backend
curl -X GET http://localhost:5000/api/v1/auth/me -H "Authorization: Bearer <token>"

# Frontend
npm run dev  # Verify login flow
```

---

## Phase 2: Customer & Order APIs

**Goal:** Customer management and order viewing

### Tasks

- [x] 2.1 Create `api/v1/schemas/customer.py`
  - CustomerSchema (list, detail, create, update)
  - BillingConfigSchema
  - PaginatedCustomerSchema

- [x] 2.2 Create `api/v1/customers.py`
  - GET `/customers` - List with pagination, filtering, search
  - GET `/customers/{id}` - Detail
  - POST `/customers` - Create
  - PUT `/customers/{id}` - Update
  - DELETE `/customers/{id}` - Delete

- [x] 2.3 Add customer billing config endpoints
  - GET `/customers/{id}/billing-config`
  - PUT `/customers/{id}/billing-config`

- [x] 2.4 Add customer related data endpoints
  - GET `/customers/{id}/products`
  - GET `/customers/{id}/orders`
  - GET `/customers/{id}/invoices`

- [x] 2.5 Create `api/v1/schemas/order.py`
  - OrderSchema (list, detail)
  - OrderItemSchema
  - PackageSchema

- [x] 2.6 Create `api/v1/orders.py`
  - GET `/orders` - List with filters (customer_id, status, date_from, date_to)
  - GET `/orders/{id}` - Detail with items and packages

- [x] 2.7 Connect frontend hooks
  - Update `src/hooks/use-customers.ts` to use real API
  - Update `src/hooks/use-orders.ts` to use real API
  - Verify customers page loads real data
  - Verify orders page loads real data

### Verification
```bash
# Test customer endpoints
curl http://localhost:5000/api/v1/customers?page=1&per_page=10
curl http://localhost:5000/api/v1/customers/1

# Test order endpoints
curl http://localhost:5000/api/v1/orders?customer_id=1
curl http://localhost:5000/api/v1/orders/1

# Frontend verification
npm run dev  # Check customers and orders pages
```

---

## Phase 3: Invoice & Billing APIs

**Goal:** Complete invoice management and billing periods

### Tasks

- [x] 3.1 Create `api/v1/schemas/invoice.py`
  - InvoiceSchema (list, detail, create, update)
  - LineItemSchema
  - InvoicePDFSchema

- [x] 3.2 Create `api/v1/invoices.py` - Basic CRUD
  - GET `/invoices` - List with filters
  - GET `/invoices/{id}` - Detail with line items
  - POST `/invoices` - Create
  - PUT `/invoices/{id}` - Update

- [x] 3.3 Add invoice line items endpoints
  - GET `/invoices/{id}/line-items`
  - POST `/invoices/{id}/line-items`
  - PUT `/invoices/{id}/line-items/{lineId}`
  - DELETE `/invoices/{id}/line-items/{lineId}`

- [x] 3.4 Add invoice actions
  - GET `/invoices/{id}/pdf` - Generate PDF
  - POST `/invoices/{id}/send` - Send via email

- [x] 3.5 Add bulk invoice operations
  - POST `/invoices/bulk-create`
  - POST `/invoices/bulk-send`

- [x] 3.6 Create `api/v1/schemas/billing.py`
  - BillingPeriodSchema
  - UnbilledChargeSchema

- [x] 3.7 Create `api/v1/billing.py` - Periods
  - GET `/billing/periods` - List periods
  - GET `/billing/periods/{id}` - Period detail with charges
  - POST `/billing/periods` - Create period
  - POST `/billing/periods/{id}/close` - Close period
  - POST `/billing/periods/{id}/reopen` - Reopen (admin only)

- [x] 3.8 Add unbilled charges endpoint
  - GET `/billing/unbilled?customer_id=` - Unbilled by customer

- [x] 3.9 Connect frontend hooks
  - Update `src/hooks/use-invoices.ts`
  - Update `src/hooks/use-billing.ts`
  - Verify invoices page
  - Verify billing dashboard

### Verification
```bash
# Test invoice endpoints
curl http://localhost:5000/api/v1/invoices?status=pending
curl http://localhost:5000/api/v1/invoices/1
curl http://localhost:5000/api/v1/invoices/1/pdf

# Test billing endpoints
curl http://localhost:5000/api/v1/billing/periods
curl http://localhost:5000/api/v1/billing/unbilled?customer_id=1
```

---

## Phase 4: Accrual & Admin APIs

**Goal:** Accrual management and admin functions

### Tasks

- [x] 4.1 Create `api/v1/schemas/accrual.py`
  - AccrualRunSchema
  - AccrualStatsSchema

- [x] 4.2 Create `api/v1/accrual.py`
  - POST `/accrual/run` - Trigger manual accrual (all customers)
  - POST `/accrual/customer/{id}/run` - Customer-specific accrual
  - GET `/accrual/stats` - Statistics (date_from, date_to)
  - GET `/accrual/runs` - Run history (limit)

- [x] 4.3 Create `api/v1/schemas/admin.py`
  - SyncStatusSchema
  - UserAdminSchema

- [x] 4.4 Create `api/v1/admin.py` - Sync operations
  - POST `/admin/sync/wms` - Trigger WMS sync
  - POST `/admin/sync/techship` - Trigger TechShip sync
  - GET `/admin/sync/status` - Current sync status

- [x] 4.5 Add user management endpoints
  - GET `/admin/users` - List users
  - POST `/admin/users` - Create user
  - PUT `/admin/users/{id}` - Update user
  - DELETE `/admin/users/{id}` - Delete user

- [x] 4.6 Add config versioning endpoint
  - GET `/config/versions/{customerId}` - Config change history

- [x] 4.7 Connect frontend hooks
  - Update `src/hooks/use-accrual.ts`
  - Update admin pages
  - Verify accrual dashboard

### Verification
```bash
# Test accrual endpoints
curl -X POST http://localhost:5000/api/v1/accrual/run
curl http://localhost:5000/api/v1/accrual/stats

# Test admin endpoints
curl http://localhost:5000/api/v1/admin/sync/status
curl http://localhost:5000/api/v1/admin/users
```

---

## Phase 5: Materials & Services APIs

**Goal:** Materials pricing and service configuration

### Tasks

- [ ] 5.1 Create `api/v1/schemas/materials.py`
  - MaterialsPricingGlobalSchema
  - MaterialsOverrideSchema
  - PackagingRateSchema
  - MaterialsAuditLogSchema

- [ ] 5.2 Create `api/v1/materials.py` - Global pricing
  - GET `/materials/global` - List (material_type, box_size filters)
  - POST `/materials/global` - Create
  - PUT `/materials/global/{id}` - Update
  - DELETE `/materials/global/{id}` - Delete

- [ ] 5.3 Add materials overrides endpoints
  - GET `/materials/overrides` - List (customer_id filter)
  - POST `/materials/overrides` - Create
  - DELETE `/materials/overrides/{id}` - Delete

- [ ] 5.4 Add packaging and audit endpoints
  - GET `/materials/packaging-rates` - Packaging catalog
  - GET `/materials/audit-log` - Change history (days filter)

- [ ] 5.5 Create `api/v1/schemas/services.py`
  - ServiceTypeSchema
  - ServiceRateSchema

- [ ] 5.6 Create `api/v1/services.py`
  - GET `/services/types` - Service types
  - GET `/services/rates` - Service rates (customer_id filter)
  - POST `/services/rates` - Create rate
  - PUT `/services/rates/{id}` - Update rate
  - DELETE `/services/rates/{id}` - Delete rate
  - GET `/services/rates/templates` - Rate templates

- [ ] 5.7 Add billing rules endpoints to `billing.py`
  - GET `/billing/rules/{customerId}` - Get rules
  - POST `/billing/rules/{customerId}` - Create/update rules
  - PUT `/billing/rules/{customerId}/{ruleId}` - Update rule
  - DELETE `/billing/rules/{customerId}/{ruleId}` - Delete rule
  - POST `/billing/sandbox` - Test rules

- [ ] 5.8 Connect frontend hooks
  - Update `src/hooks/use-materials.ts`
  - Update `src/hooks/use-services.ts`
  - Update `src/hooks/use-billing-rules.ts`
  - Verify materials config page
  - Verify services page
  - Verify billing rules page

### Verification
```bash
# Test materials endpoints
curl http://localhost:5000/api/v1/materials/global
curl http://localhost:5000/api/v1/materials/overrides?customer_id=1

# Test services endpoints
curl http://localhost:5000/api/v1/services/types
curl http://localhost:5000/api/v1/services/rates

# Test billing rules
curl http://localhost:5000/api/v1/billing/rules/1
```

---

## Phase 6: Reports & Dashboard APIs

**Goal:** Analytics, reporting, and final integration

### Tasks

- [ ] 6.1 Create `api/v1/schemas/reports.py`
  - DashboardMetricsSchema
  - RevenueReportSchema
  - AgingReportSchema

- [ ] 6.2 Create `api/v1/reports.py`
  - GET `/reports/dashboard` - Dashboard metrics
  - GET `/reports/revenue` - Revenue by period/customer
  - GET `/reports/aging` - Invoice aging
  - GET `/reports/profitability` - Customer profitability
  - GET `/reports/export` - Export CSV/Excel (format, type params)

- [ ] 6.3 Add search endpoint
  - GET `/search?q=` - Global search across entities

- [ ] 6.4 Add activity feed endpoint (SSE)
  - GET `/activity` - Server-Sent Events stream

- [ ] 6.5 Connect all remaining frontend hooks
  - Update `src/hooks/use-dashboard.ts`
  - Update `src/hooks/use-reports.ts`
  - Verify dashboard page
  - Verify reports page

- [ ] 6.6 Full integration testing
  - Test all 56 endpoints
  - Verify all pages load with real data
  - Test loading states
  - Test error handling

- [ ] 6.7 Performance verification
  - API response times < 200ms (p95)
  - No N+1 queries
  - Pagination working correctly

- [ ] 6.8 Final verification
  - Run TypeScript check: `npx tsc --noEmit`
  - Run linting: `npm run lint`
  - Run E2E tests: `npm run test:e2e`

### Verification
```bash
# Test reports endpoints
curl http://localhost:5000/api/v1/reports/dashboard
curl http://localhost:5000/api/v1/reports/revenue?period=monthly
curl http://localhost:5000/api/v1/reports/aging

# Test search
curl http://localhost:5000/api/v1/search?q=vasanti

# Full frontend verification
npm run build
npm run test:e2e
```

---

## Progress Tracking

| Phase | Status | Tasks | Complete |
|-------|--------|-------|----------|
| 1. Auth Foundation | [x] | 8 | 8/8 |
| 2. Customer & Order | [x] | 7 | 7/7 |
| 3. Invoice & Billing | [x] | 9 | 9/9 |
| 4. Accrual & Admin | [x] | 7 | 7/7 |
| 5. Materials & Services | [ ] | 8 | 0/8 |
| 6. Reports & Dashboard | [ ] | 8 | 0/8 |
| **Total** | | **47** | **31/47** |

---

## Notes

- Backend changes are in the LogiBill Flask repo
- Frontend changes are in this repo (logibill-frontend)
- Use existing models from Flask - no schema changes needed
- Follow response format standards for consistency
- Test each endpoint before moving to frontend integration
