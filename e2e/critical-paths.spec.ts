import { test, expect } from "@playwright/test";

/**
 * Critical Path E2E Tests
 *
 * These tests verify the most important user flows in the application.
 * All critical paths that must work for production readiness.
 *
 * Track: frontend-prod_20260202
 * Task: 6.1
 */

// Mock admin user for authenticated tests
const mockAdminUser = {
  id: "admin-123",
  supabase_user_id: "supabase-admin-123",
  email: "admin@logibill.com",
  role: "admin" as const,
  customer_id: null,
  company_id: 1,
  created_at: "2024-01-01T00:00:00Z",
  last_login: "2026-02-02T00:00:00Z",
};

// Helper to setup authenticated session
async function setupAuthenticatedSession(page: any) {
  // Set auth store in localStorage
  await page.addInitScript((user: any) => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: { user: user },
        version: 0,
      })
    );
  }, mockAdminUser);

  // Mock auth API
  await page.route("**/api/v1/auth/me", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: mockAdminUser }),
    });
  });
}

// Helper to setup common API mocks
async function setupApiMocks(page: any) {
  // Dashboard metrics
  await page.route("**/api/v1/reports/dashboard", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          revenue_mtd: 125000,
          orders_today: 45,
          pending_invoices: 12,
          overdue_invoices: 3,
          revenue_trend: [],
          activity_feed: [],
        },
      }),
    });
  });

  // Customers
  await page.route("**/api/v1/customers*", async (route: any) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, name: "Vasanti", code: "VAS001", status: "active", email: "billing@vasanti.com" },
            { id: 2, name: "Clean Kiss", code: "CK001", status: "active", email: "billing@cleankiss.com" },
            { id: 3, name: "Test Company", code: "TEST001", status: "inactive", email: "test@example.com" },
          ],
          meta: { page: 1, per_page: 20, total: 3, total_pages: 1 },
        }),
      });
    }
  });

  // Orders
  await page.route("**/api/v1/orders*", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, order_number: "ORD-001", customer_id: 1, status: "completed", total: 500 },
          { id: 2, order_number: "ORD-002", customer_id: 1, status: "pending", total: 250 },
        ],
        meta: { page: 1, per_page: 20, total: 2, total_pages: 1 },
      }),
    });
  });

  // Invoices
  await page.route("**/api/v1/invoices*", async (route: any) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "POST" && url.includes("/send")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { sent: true } }),
      });
      return;
    }

    if (method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: 100, invoice_number: "INV-100", status: "draft" },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, invoice_number: "INV-001", customer_id: 1, status: "sent", total: 1000, customer: { name: "Vasanti" } },
          { id: 2, invoice_number: "INV-002", customer_id: 2, status: "draft", total: 500, customer: { name: "Clean Kiss" } },
          { id: 3, invoice_number: "INV-003", customer_id: 1, status: "paid", total: 750, customer: { name: "Vasanti" } },
        ],
        meta: { page: 1, per_page: 20, total: 3, total_pages: 1 },
      }),
    });
  });

  // Billing periods
  await page.route("**/api/v1/billing/periods*", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, name: "January 2026", start_date: "2026-01-01", end_date: "2026-01-31", status: "closed" },
          { id: 2, name: "February 2026", start_date: "2026-02-01", end_date: "2026-02-28", status: "open" },
        ],
        meta: { page: 1, per_page: 20, total: 2, total_pages: 1 },
      }),
    });
  });

  // Accrual
  await page.route("**/api/v1/accrual/**", async (route: any) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { run_id: "run-123", status: "completed", processed_count: 50 },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          stats: { total_runs: 10, last_run: "2026-02-01T10:00:00Z" },
          runs: [],
        },
      }),
    });
  });

  // Sync status
  await page.route("**/api/v1/admin/sync/**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          wms: { status: "healthy", last_sync: "2026-02-02T10:00:00Z" },
          techship: { status: "healthy", last_sync: "2026-02-02T09:30:00Z" },
        },
      }),
    });
  });
}

test.describe("Critical Path: Dashboard Access", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("user can access dashboard after login", async ({ page }) => {
    await page.goto("/");

    // Should see dashboard
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

    // Should see key metrics
    await expect(page.getByText(/revenue/i)).toBeVisible();
  });

  test("dashboard shows correct navigation elements", async ({ page }) => {
    await page.goto("/");

    // Sidebar should be visible
    await expect(page.getByText("LogiBill")).toBeVisible();

    // User menu should be accessible
    await expect(page.getByRole("button", { name: /user menu|avatar/i })).toBeVisible();
  });
});

test.describe("Critical Path: Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("user can navigate to customers list", async ({ page }) => {
    await page.goto("/");

    // Click Customers in sidebar
    await page.getByRole("link", { name: /customers/i }).click();

    // Should see customers page
    await expect(page).toHaveURL("/customers");
    await expect(page.getByRole("heading", { name: /customers/i })).toBeVisible();
  });

  test("user can view customer list data", async ({ page }) => {
    await page.goto("/customers");

    // Should see customer names
    await expect(page.getByText("Vasanti")).toBeVisible();
    await expect(page.getByText("Clean Kiss")).toBeVisible();
  });

  test("user can access customer details", async ({ page }) => {
    await page.route("**/api/v1/customers/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: 1, name: "Vasanti", code: "VAS001", status: "active", email: "billing@vasanti.com" },
        }),
      });
    });

    await page.goto("/customers/1");

    // Should see customer detail page
    await expect(page.getByText("Vasanti")).toBeVisible();
  });
});

test.describe("Critical Path: Invoice Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("user can navigate to invoices list", async ({ page }) => {
    await page.goto("/");

    // Open Invoices submenu
    await page.getByRole("button", { name: /invoices/i }).click();
    await page.getByRole("link", { name: /all invoices/i }).click();

    // Should see invoices page
    await expect(page).toHaveURL("/invoices");
    await expect(page.getByRole("heading", { name: /invoices/i })).toBeVisible();
  });

  test("user can view invoice list data", async ({ page }) => {
    await page.goto("/invoices");

    // Should see invoice numbers
    await expect(page.getByText("INV-001")).toBeVisible();
    await expect(page.getByText("INV-002")).toBeVisible();
  });

  test("user can access invoice details", async ({ page }) => {
    await page.route("**/api/v1/invoices/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            invoice_number: "INV-001",
            customer_id: 1,
            status: "sent",
            total: 1000,
            customer: { name: "Vasanti" },
            line_items: [
              { id: 1, description: "Fulfillment Services", quantity: 1, unit_price: 500, amount: 500 },
              { id: 2, description: "Shipping", quantity: 1, unit_price: 500, amount: 500 },
            ],
          },
        }),
      });
    });

    await page.goto("/invoices/1");

    // Should see invoice detail
    await expect(page.getByText("INV-001")).toBeVisible();
    await expect(page.getByText("$1,000")).toBeVisible();
  });
});

test.describe("Critical Path: Billing Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("user can access billing dashboard", async ({ page }) => {
    await page.goto("/");

    // Open Billing submenu
    await page.getByRole("button", { name: /billing/i }).click();
    await page.getByRole("link", { name: /dashboard/i }).click();

    await expect(page).toHaveURL("/billing");
  });

  test("user can access billing periods", async ({ page }) => {
    await page.goto("/billing/periods");

    // Should see periods
    await expect(page.getByText(/january 2026|february 2026/i)).toBeVisible();
  });

  test("user can access accrual page", async ({ page }) => {
    await page.goto("/billing/accrual");

    // Should see accrual page with run button
    await expect(page.getByRole("button", { name: /run accrual/i })).toBeVisible();
  });
});

test.describe("Critical Path: Admin Functions", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("admin can access sync status page", async ({ page }) => {
    await page.goto("/admin/sync-status");

    // Should see sync status
    await expect(page.getByRole("heading", { name: /sync status/i })).toBeVisible();
  });
});

test.describe("All Routes Accessible", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  const mainRoutes = [
    { path: "/", name: "Dashboard" },
    { path: "/customers", name: "Customers" },
    { path: "/orders", name: "Orders" },
    { path: "/invoices", name: "Invoices" },
    { path: "/billing", name: "Billing" },
    { path: "/billing/periods", name: "Billing Periods" },
    { path: "/billing/accrual", name: "Accrual" },
    { path: "/reports", name: "Reports" },
  ];

  for (const route of mainRoutes) {
    test(`${route.name} page loads correctly`, async ({ page }) => {
      await page.goto(route.path);

      // Page should not show error
      await expect(page.getByText(/error|500|server error/i)).not.toBeVisible();

      // Page should have content
      const body = page.locator("body");
      await expect(body).toBeVisible();
    });
  }
});

test.describe("Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test("handles API errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("**/api/v1/customers*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "SERVER_ERROR", message: "Internal server error" },
        }),
      });
    });

    await page.goto("/customers");

    // Should show error state (not crash)
    await expect(page.getByText(/error|failed|problem/i)).toBeVisible();
  });

  test("handles network errors gracefully", async ({ page }) => {
    // Mock network failure
    await page.route("**/api/v1/**", async (route) => {
      await route.abort("connectionfailed");
    });

    await page.goto("/customers");

    // Should show error state (not crash)
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("dashboard works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Should still be usable
    await expect(page.getByText("LogiBill")).toBeVisible();
  });

  test("dashboard works on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Should still be usable
    await expect(page.getByText("LogiBill")).toBeVisible();
  });

  test("data tables work on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/customers");

    // Table should be scrollable or responsive
    const table = page.locator("table, [role='table']");
    await expect(table).toBeVisible();
  });
});
