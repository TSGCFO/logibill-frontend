import { test, expect } from "@playwright/test";

test.describe("Error Pages", () => {
  test("should show 404 page for non-existent routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");

    // Should show 404 content
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText(/not found/i)).toBeVisible();

    // Should have a link back to home
    await expect(page.getByRole("link", { name: /dashboard|home/i })).toBeVisible();
  });

  test("404 page should have correct structure", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Should have a heading
    const heading = page.getByRole("heading");
    await expect(heading).toBeVisible();

    // Should have a back button
    const backButton = page.getByRole("link", { name: /back|home|dashboard/i });
    await expect(backButton).toBeVisible();
  });

  test("404 page should be accessible", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Check that the page has proper structure
    const main = page.locator("main, [role='main'], .min-h-screen");
    await expect(main.first()).toBeVisible();

    // Check that interactive elements are keyboard accessible
    const link = page.getByRole("link", { name: /back|home|dashboard/i });
    await link.focus();
    await expect(link).toBeFocused();
  });
});
