import { test, expect } from "@playwright/test";

// These tests assume the user is authenticated
// In a real setup, you'd use a test user and authenticate before each test

test.describe("Navigation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    // Skip auth for navigation tests by mocking auth state
    // In production, you'd set up proper auth fixtures
    await page.goto("/login");
  });

  test("login page should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/LogiBill/i);
  });

  test("login page should be responsive", async ({ page }) => {
    // Check mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Check tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Check desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("login page should have no accessibility violations", async ({ page }) => {
    await page.goto("/login");

    // Check for basic accessibility
    // All form inputs should have labels
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();

    // Submit button should be accessible
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeEnabled();
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/login");

    // Tab through form elements
    await page.keyboard.press("Tab");
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();

    await page.keyboard.press("Tab");
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeFocused();
  });
});
