import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Authentication and Role-Based Access Control
 *
 * Track: frontend-prod_20260202
 * Tasks: 5.1, 5.4
 */

// Mock user data for different roles
const mockUsers = {
  admin: {
    id: "admin-123",
    supabase_user_id: "supabase-admin-123",
    email: "admin@logibill.com",
    role: "admin" as const,
    customer_id: null,
    company_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    last_login: "2026-02-02T00:00:00Z",
  },
  accountant: {
    id: "accountant-123",
    supabase_user_id: "supabase-accountant-123",
    email: "accountant@logibill.com",
    role: "accountant" as const,
    customer_id: null,
    company_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    last_login: "2026-02-02T00:00:00Z",
  },
  viewer: {
    id: "viewer-123",
    supabase_user_id: "supabase-viewer-123",
    email: "viewer@logibill.com",
    role: "viewer" as const,
    customer_id: null,
    company_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    last_login: "2026-02-02T00:00:00Z",
  },
  customer: {
    id: "customer-123",
    supabase_user_id: "supabase-customer-123",
    email: "customer@vasanti.com",
    role: "customer" as const,
    customer_id: 1,
    company_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    last_login: "2026-02-02T00:00:00Z",
  },
};

// Helper to setup mock API responses
async function setupMockAuth(page: any, user: (typeof mockUsers)[keyof typeof mockUsers]) {
  // Mock the auth/me endpoint
  await page.route("**/api/v1/auth/me", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: user }),
    });
  });

  // Set the auth store via localStorage
  await page.addInitScript((userData: any) => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: { user: userData },
        version: 0,
      })
    );
  }, user);
}

// Helper to setup common API mocks
async function setupCommonMocks(page: any) {
  // Mock customers endpoint
  await page.route("**/api/v1/customers*", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, name: "Vasanti", code: "VAS001", status: "active" },
          { id: 2, name: "Clean Kiss", code: "CK001", status: "active" },
        ],
        meta: { page: 1, per_page: 20, total: 2, total_pages: 1 },
      }),
    });
  });

  // Mock dashboard metrics
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
        },
      }),
    });
  });

  // Mock admin endpoints
  await page.route("**/api/v1/admin/users*", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [mockUsers.admin, mockUsers.accountant, mockUsers.viewer],
        meta: { page: 1, per_page: 20, total: 3, total_pages: 1 },
      }),
    });
  });

  await page.route("**/api/v1/admin/sync/status", async (route: any) => {
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

test.describe("Authentication", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Form should show validation errors
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test("should have forgot password link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
  });
});

test.describe("Role-Based Access Control", () => {
  test.describe("Admin Access", () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuth(page, mockUsers.admin);
      await setupCommonMocks(page);
    });

    test("admin can access admin pages", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page).toHaveURL("/admin/users");
      await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    });

    test("admin can access sync status page", async ({ page }) => {
      await page.goto("/admin/sync-status");
      await expect(page).toHaveURL("/admin/sync-status");
      await expect(page.getByRole("heading", { name: /sync status/i })).toBeVisible();
    });

    test("admin can see admin menu in sidebar", async ({ page }) => {
      await page.goto("/");

      // Admin section should be visible
      await expect(page.getByText("Administration")).toBeVisible();

      // Open admin menu
      await page.getByRole("button", { name: /admin/i }).click();
      await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /sync status/i })).toBeVisible();
    });

    test("admin can see delete buttons on invoices", async ({ page }) => {
      // Mock invoices
      await page.route("**/api/v1/invoices*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, invoice_number: "INV-001", status: "draft", total: 1000 },
            ],
            meta: { page: 1, per_page: 20, total: 1, total_pages: 1 },
          }),
        });
      });

      await page.goto("/invoices");

      // Open actions menu on first row
      const firstRow = page.getByRole("row").nth(1);
      await firstRow.getByRole("button", { name: /actions/i }).click();

      // Delete option should be visible for admin
      await expect(page.getByRole("menuitem", { name: /delete/i })).toBeVisible();
    });
  });

  test.describe("Viewer Access", () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuth(page, mockUsers.viewer);
      await setupCommonMocks(page);
    });

    test("viewer cannot access admin pages - redirects to unauthorized", async ({ page }) => {
      await page.goto("/admin/users");

      // Should redirect to unauthorized or show access denied
      await expect(page.getByText(/access denied|unauthorized|permission/i)).toBeVisible();
    });

    test("viewer cannot see admin menu in sidebar", async ({ page }) => {
      await page.goto("/");

      // Admin section should not be visible
      await expect(page.getByText("Administration")).not.toBeVisible();
    });

    test("viewer cannot see delete buttons on invoices", async ({ page }) => {
      // Mock invoices
      await page.route("**/api/v1/invoices*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, invoice_number: "INV-001", status: "draft", total: 1000 },
            ],
            meta: { page: 1, per_page: 20, total: 1, total_pages: 1 },
          }),
        });
      });

      await page.goto("/invoices");

      // Open actions menu on first row
      const firstRow = page.getByRole("row").nth(1);
      await firstRow.getByRole("button", { name: /actions/i }).click();

      // Delete option should NOT be visible for viewer
      await expect(page.getByRole("menuitem", { name: /delete/i })).not.toBeVisible();
    });

    test("viewer can still view data", async ({ page }) => {
      await page.goto("/customers");
      await expect(page.getByRole("heading", { name: /customers/i })).toBeVisible();
      await expect(page.getByText("Vasanti")).toBeVisible();
    });
  });

  test.describe("Customer Access", () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuth(page, mockUsers.customer);
      await setupCommonMocks(page);

      // Mock customer-specific endpoints to only return their data
      await page.route("**/api/v1/customers*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, name: "Vasanti", code: "VAS001", status: "active" },
            ],
            meta: { page: 1, per_page: 20, total: 1, total_pages: 1 },
          }),
        });
      });

      await page.route("**/api/v1/invoices*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, invoice_number: "INV-001", customer_id: 1, status: "sent", total: 1000 },
            ],
            meta: { page: 1, per_page: 20, total: 1, total_pages: 1 },
          }),
        });
      });
    });

    test("customer sees only their data", async ({ page }) => {
      await page.goto("/customers");

      // Should only see their own customer
      await expect(page.getByText("Vasanti")).toBeVisible();
      // Should not see other customers
      await expect(page.getByText("Clean Kiss")).not.toBeVisible();
    });

    test("customer cannot access admin pages", async ({ page }) => {
      await page.goto("/admin/users");

      // Should show access denied
      await expect(page.getByText(/access denied|unauthorized|permission/i)).toBeVisible();
    });

    test("customer cannot access other customers data", async ({ page }) => {
      // Mock 403 for other customer
      await page.route("**/api/v1/customers/2", async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: { code: "FORBIDDEN", message: "Access denied" },
          }),
        });
      });

      // Try to access another customer's page
      await page.goto("/customers/2");

      // Should show access denied or redirect
      await expect(page.getByText(/access denied|unauthorized|not found/i)).toBeVisible();
    });
  });

  test.describe("Accountant Access", () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuth(page, mockUsers.accountant);
      await setupCommonMocks(page);
    });

    test("accountant cannot access user management", async ({ page }) => {
      await page.goto("/admin/users");

      // Should show access denied
      await expect(page.getByText(/access denied|unauthorized|permission/i)).toBeVisible();
    });

    test("accountant can access billing pages", async ({ page }) => {
      await page.route("**/api/v1/billing/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.goto("/billing");
      await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible();
    });

    test("accountant can create invoices", async ({ page }) => {
      await page.route("**/api/v1/invoices*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.goto("/invoices/new");
      await expect(page.getByRole("heading", { name: /create invoice/i })).toBeVisible();
    });
  });
});

test.describe("Session Handling", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    // Don't set up any auth
    await page.goto("/");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("session expiry redirects to login", async ({ page }) => {
    await setupMockAuth(page, mockUsers.admin);
    await setupCommonMocks(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

    // Simulate session expiry by returning 401
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Session expired" },
        }),
      });
    });

    // Navigate somewhere to trigger API call
    await page.goto("/customers");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await setupMockAuth(page, mockUsers.admin);
    await setupCommonMocks(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

    // Open user menu and click logout
    await page.getByRole("button", { name: /user menu|avatar/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Auth storage should be cleared
    const authStorage = await page.evaluate(() => localStorage.getItem("auth-storage"));
    const parsed = authStorage ? JSON.parse(authStorage) : null;
    expect(parsed?.state?.user).toBeNull();
  });

  test("login page allows authentication", async ({ page }) => {
    // Mock login endpoint
    await page.route("**/auth/v1/token*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: mockUsers.admin.supabase_user_id,
            email: mockUsers.admin.email,
          },
        }),
      });
    });

    // Mock the auth/me endpoint for after login
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockUsers.admin }),
      });
    });

    await page.goto("/login");

    // Fill in login form
    await page.getByLabel(/email/i).fill("admin@logibill.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard after login
    await expect(page).toHaveURL("/");
  });

  test("protected routes preserve redirect URL", async ({ page }) => {
    // Try to access a protected page without auth
    await page.goto("/customers/1");

    // Should redirect to login with redirectTo param
    await expect(page).toHaveURL(/\/login\?redirectTo=/);
    const url = page.url();
    expect(url).toContain("redirectTo=%2Fcustomers%2F1");
  });
});

test.describe("Permission-Based UI", () => {
  test.describe("Create/Edit Buttons", () => {
    test("admin sees create customer button", async ({ page }) => {
      await setupMockAuth(page, mockUsers.admin);
      await setupCommonMocks(page);

      await page.goto("/customers");
      await expect(page.getByRole("link", { name: /new customer|add customer/i })).toBeVisible();
    });

    test("viewer does not see create customer button", async ({ page }) => {
      await setupMockAuth(page, mockUsers.viewer);
      await setupCommonMocks(page);

      await page.goto("/customers");
      await expect(page.getByRole("link", { name: /new customer|add customer/i })).not.toBeVisible();
    });
  });

  test.describe("Billing Actions", () => {
    test("admin can trigger accrual", async ({ page }) => {
      await setupMockAuth(page, mockUsers.admin);
      await setupCommonMocks(page);

      await page.route("**/api/v1/accrual/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: {} }),
        });
      });

      await page.goto("/billing/accrual");
      await expect(page.getByRole("button", { name: /run accrual/i })).toBeVisible();
    });

    test("viewer cannot trigger accrual", async ({ page }) => {
      await setupMockAuth(page, mockUsers.viewer);
      await setupCommonMocks(page);

      await page.goto("/billing/accrual");

      // Button should either not exist or be disabled
      const runButton = page.getByRole("button", { name: /run accrual/i });
      const buttonExists = await runButton.count() > 0;

      if (buttonExists) {
        await expect(runButton).toBeDisabled();
      }
    });
  });
});
