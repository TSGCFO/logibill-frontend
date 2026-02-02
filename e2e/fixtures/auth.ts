import { test as base, expect } from "@playwright/test";

// Test user credentials (use test environment)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "testpassword123",
};

// Extended test fixture with authentication
export const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto("/login");

    // Fill in credentials
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL("/", { timeout: 10000 });

    // Use the authenticated page
    await use(base);
  },
});

export { expect };
