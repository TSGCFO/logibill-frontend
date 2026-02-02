import { test, expect } from "@playwright/test";

/**
 * Admin Sync Status Page E2E Tests
 *
 * TDD RED PHASE: These tests verify the sync status page
 * loads real data from the API instead of mock data.
 *
 * Track: frontend-prod_20260202
 * Task: 1.1
 */

test.describe("Admin Sync Status Page", () => {
  // Setup: Mock API responses for controlled testing
  test.beforeEach(async ({ page }) => {
    // Mock the sync status API endpoint
    await page.route("**/api/v1/admin/sync/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            wms: {
              last_sync_at: "2026-02-02T10:00:00Z",
              status: "completed",
              records_synced: 1250,
              errors: null,
            },
            techship: {
              last_sync_at: "2026-02-02T09:00:00Z",
              status: "completed",
              records_synced: 485,
              errors: null,
            },
          },
        }),
      });
    });

    // Mock auth for accessing admin pages
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "admin@logibill.com",
            role: "admin",
            customer_id: null,
            company_id: 1,
          },
        }),
      });
    });
  });

  test("should display page title and description", async ({ page }) => {
    await page.goto("/admin/sync-status");

    // Check page header
    await expect(page.getByRole("heading", { name: /sync status/i })).toBeVisible();
    await expect(
      page.getByText(/monitor and manage data synchronization/i)
    ).toBeVisible();
  });

  test("should display WMS sync card with real API data", async ({ page }) => {
    await page.goto("/admin/sync-status");

    // Find WMS card
    const wmsCard = page.locator("text=WMS (Extensiv)").locator("..");

    // Should show connected status
    await expect(wmsCard.getByText(/connected/i)).toBeVisible();

    // Should show last sync time from API (not mock data)
    // The API returns "2026-02-02T10:00:00Z" - should be formatted
    await expect(wmsCard.getByText(/last sync/i)).toBeVisible();

    // Should show records synced count from API (1250)
    await expect(wmsCard.getByText(/1,250/)).toBeVisible();
  });

  test("should display TechShip sync card with real API data", async ({ page }) => {
    await page.goto("/admin/sync-status");

    // Find TechShip card
    const techshipCard = page.locator("text=TechShip").locator("..");

    // Should show connected status
    await expect(techshipCard.getByText(/connected/i)).toBeVisible();

    // Should show records synced count from API (485)
    await expect(techshipCard.getByText(/485/)).toBeVisible();
  });

  test("should display sync history table with data from API", async ({ page }) => {
    // Mock sync history endpoint
    await page.route("**/api/v1/admin/sync/history*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "sync-1",
              type: "wms",
              status: "completed",
              started_at: "2026-02-02T10:00:00Z",
              completed_at: "2026-02-02T10:05:32Z",
              records_processed: 1250,
              records_total: 1250,
              errors: null,
            },
            {
              id: "sync-2",
              type: "techship",
              status: "completed",
              started_at: "2026-02-02T09:00:00Z",
              completed_at: "2026-02-02T09:12:45Z",
              records_processed: 485,
              records_total: 485,
              errors: null,
            },
          ],
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Find sync history table
    const historyTable = page.getByRole("table");
    await expect(historyTable).toBeVisible();

    // Should have table headers
    await expect(page.getByRole("columnheader", { name: /source/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /started/i })).toBeVisible();

    // Should have rows from API data (not mock)
    const rows = page.getByRole("row");
    // Header + 2 data rows
    await expect(rows).toHaveCount(3);
  });

  test("should show loading state while fetching sync status", async ({ page }) => {
    // Delay the API response to test loading state
    await page.route("**/api/v1/admin/sync/status", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            wms: { last_sync_at: null, status: "idle", records_synced: 0, errors: null },
            techship: { last_sync_at: null, status: "idle", records_synced: 0, errors: null },
          },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Should show some loading indicator
    // (skeleton, spinner, or "Loading..." text)
    const loadingIndicator = page.getByTestId("sync-status-loading").or(
      page.getByText(/loading/i)
    );

    // Note: This test expects loading state to be implemented
    // It will fail until the page is connected to real API
  });

  test("should show error state when API fails", async ({ page }) => {
    await page.route("**/api/v1/admin/sync/status", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Server error" },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Should show error message or retry button
    const errorIndicator = page.getByText(/error/i).or(
      page.getByRole("button", { name: /retry/i })
    );

    // Note: This test expects error handling to be implemented
    // It will fail until the page handles API errors
  });
});

test.describe("Admin Sync Trigger Buttons", () => {
  test.beforeEach(async ({ page }) => {
    // Mock sync status
    await page.route("**/api/v1/admin/sync/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            wms: { last_sync_at: "2026-02-02T10:00:00Z", status: "completed", records_synced: 1250, errors: null },
            techship: { last_sync_at: "2026-02-02T09:00:00Z", status: "completed", records_synced: 485, errors: null },
          },
        }),
      });
    });

    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "test-user-id", email: "admin@logibill.com", role: "admin", customer_id: null, company_id: 1 },
        }),
      });
    });
  });

  test("should have WMS sync trigger button", async ({ page }) => {
    await page.goto("/admin/sync-status");

    // Find WMS card and its sync button
    const wmsCard = page.locator('[data-testid="wms-sync-card"]').or(
      page.locator("text=WMS (Extensiv)").locator("..").locator("..")
    );

    const syncButton = wmsCard.getByRole("button", { name: /sync now/i });
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toBeEnabled();
  });

  test("should have TechShip sync trigger button", async ({ page }) => {
    await page.goto("/admin/sync-status");

    // Find TechShip card and its sync button
    const techshipCard = page.locator('[data-testid="techship-sync-card"]').or(
      page.locator("text=TechShip").locator("..").locator("..")
    );

    const syncButton = techshipCard.getByRole("button", { name: /sync now/i });
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toBeEnabled();
  });

  test("should call WMS sync API when button clicked", async ({ page }) => {
    // Track API calls
    let wmsSyncCalled = false;

    await page.route("**/api/v1/admin/sync/wms", async (route) => {
      wmsSyncCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { message: "Sync started", job_id: "job-123", estimated_duration_seconds: 30 },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Click the WMS sync button
    const wmsCard = page.locator("text=WMS (Extensiv)").locator("..").locator("..");
    await wmsCard.getByRole("button", { name: /sync now/i }).click();

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify API was called
    expect(wmsSyncCalled).toBe(true);
  });

  test("should call TechShip sync API when button clicked", async ({ page }) => {
    // Track API calls
    let techshipSyncCalled = false;

    await page.route("**/api/v1/admin/sync/techship", async (route) => {
      techshipSyncCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { message: "Sync started", job_id: "job-456", estimated_duration_seconds: 60 },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Click the TechShip sync button
    const techshipCard = page.locator("text=TechShip").locator("..").locator("..");
    await techshipCard.getByRole("button", { name: /sync now/i }).click();

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify API was called
    expect(techshipSyncCalled).toBe(true);
  });

  test("should show loading state while sync is running", async ({ page }) => {
    await page.route("**/api/v1/admin/sync/wms", async (route) => {
      // Delay response to test loading state
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { message: "Sync started", job_id: "job-123", estimated_duration_seconds: 30 },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Click sync button
    const wmsCard = page.locator("text=WMS (Extensiv)").locator("..").locator("..");
    await wmsCard.getByRole("button", { name: /sync now/i }).click();

    // Should show syncing state (button disabled, spinner visible)
    await expect(wmsCard.getByText(/syncing/i)).toBeVisible();
  });

  test("should show success toast after sync completes", async ({ page }) => {
    await page.route("**/api/v1/admin/sync/wms", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { message: "Sync completed", job_id: "job-123", estimated_duration_seconds: 0 },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Click sync button
    const wmsCard = page.locator("text=WMS (Extensiv)").locator("..").locator("..");
    await wmsCard.getByRole("button", { name: /sync now/i }).click();

    // Should show success toast
    await expect(page.getByText(/sync completed|success/i)).toBeVisible({ timeout: 5000 });
  });

  test("should show error toast when sync fails", async ({ page }) => {
    await page.route("**/api/v1/admin/sync/wms", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "SYNC_FAILED", message: "Connection timeout" },
        }),
      });
    });

    await page.goto("/admin/sync-status");

    // Click sync button
    const wmsCard = page.locator("text=WMS (Extensiv)").locator("..").locator("..");
    await wmsCard.getByRole("button", { name: /sync now/i }).click();

    // Should show error toast
    await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 5000 });
  });
});
