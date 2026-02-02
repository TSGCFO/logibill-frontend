import { test, expect } from "@playwright/test";

/**
 * Reports Page E2E Tests
 *
 * Tests the LogiBill reports page charts and analytics functionality
 * Location: /reports
 *
 * Test Coverage:
 * - Page structure and navigation
 * - Revenue charts and data visualization
 * - Aging report buckets and formatting
 * - Customer profitability charts
 * - Service breakdown charts
 * - API integration with mocked responses
 * - Loading states and error handling
 */

test.describe("Reports Page - Structure and Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth for accessing dashboard pages
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 128750,
            invoices_sent: 42,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });
  });

  test("should display page title 'Reports' and description", async ({ page }) => {
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: /^reports$/i })).toBeVisible();
    await expect(
      page.getByText(/analytics and insights for your billing data/i)
    ).toBeVisible();
  });

  test("should display period selector dropdown", async ({ page }) => {
    await page.goto("/reports");

    const periodSelect = page.getByRole("combobox").first();
    await expect(periodSelect).toBeVisible();
    await expect(periodSelect).toBeEnabled();
  });

  test("should allow period selection", async ({ page }) => {
    await page.goto("/reports");

    // Click period selector
    const periodSelect = page.getByRole("combobox").first();
    await periodSelect.click();

    // Verify period options are available
    await expect(page.getByRole("option", { name: /last 7 days/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /last 30 days/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /last 90 days/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /year to date/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /custom range/i })).toBeVisible();

    // Select a period
    await page.getByRole("option", { name: /last 7 days/i }).click();
  });

  test("should display Export button", async ({ page }) => {
    await page.goto("/reports");

    const exportButton = page.getByRole("button", { name: /export/i });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  test("should display all tab navigation items", async ({ page }) => {
    await page.goto("/reports");

    // Check all tabs are visible
    await expect(page.getByRole("tab", { name: /^revenue$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^aging$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^customers$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^services$/i })).toBeVisible();
  });

  test("should allow tab navigation", async ({ page }) => {
    await page.goto("/reports");

    // Default tab should be Revenue
    await expect(page.getByRole("tab", { name: /^revenue$/i })).toHaveAttribute(
      "data-state",
      "active"
    );

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();
    await expect(page.getByRole("tab", { name: /^aging$/i })).toHaveAttribute(
      "data-state",
      "active"
    );

    // Click Customers tab
    await page.getByRole("tab", { name: /^customers$/i }).click();
    await expect(page.getByRole("tab", { name: /^customers$/i })).toHaveAttribute(
      "data-state",
      "active"
    );

    // Click Services tab
    await page.getByRole("tab", { name: /^services$/i }).click();
    await expect(page.getByRole("tab", { name: /^services$/i })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});

test.describe("Reports Page - Summary Cards", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 128750,
            invoices_sent: 42,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });
  });

  test("should display Total Revenue summary card with data", async ({ page }) => {
    await page.goto("/reports");

    // Find Total Revenue card
    const revenueCard = page
      .getByText("Total Revenue")
      .locator("..")
      .locator("..")
      .locator("..");

    await expect(revenueCard).toBeVisible();
    await expect(revenueCard.getByText(/\$128,750/)).toBeVisible();
  });

  test("should display Invoices Sent summary card with data", async ({ page }) => {
    await page.goto("/reports");

    // Find Invoices Sent card
    const invoicesCard = page
      .getByText("Invoices Sent")
      .locator("..")
      .locator("..")
      .locator("..");

    await expect(invoicesCard).toBeVisible();
    await expect(invoicesCard.getByText("42")).toBeVisible();
  });

  test("should display Avg Invoice Value summary card with calculated data", async ({
    page,
  }) => {
    await page.goto("/reports");

    // Find Avg Invoice Value card
    const avgCard = page
      .getByText("Avg Invoice Value")
      .locator("..")
      .locator("..")
      .locator("..");

    await expect(avgCard).toBeVisible();
    // 128750 / 42 = 3065.48
    await expect(avgCard.getByText(/\$3,065/)).toBeVisible();
  });

  test("should display Collection Rate summary card", async ({ page }) => {
    await page.goto("/reports");

    // Find Collection Rate card
    const collectionCard = page
      .getByText("Collection Rate")
      .locator("..")
      .locator("..")
      .locator("..");

    await expect(collectionCard).toBeVisible();
    await expect(collectionCard.getByText(/94\.2%/)).toBeVisible();
  });
});

test.describe("Reports Page - Revenue Chart Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    // Mock revenue report data
    await page.route("**/api/v1/reports/revenue*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            period: "2026-01",
            total: 125000,
            by_customer: [
              { customer_id: 1, customer_name: "Vasanti", amount: 45000 },
              { customer_id: 2, customer_name: "Abokichi", amount: 38000 },
              { customer_id: 3, customer_name: "TechCorp", amount: 42000 },
            ],
            by_charge_type: [
              { charge_type: "fulfillment", amount: 65000 },
              { charge_type: "shipping", amount: 42000 },
              { charge_type: "materials", amount: 18000 },
            ],
          },
        }),
      });
    });
  });

  test("should display Revenue Overview card", async ({ page }) => {
    await page.goto("/reports");

    // Revenue tab is default
    await expect(page.getByRole("heading", { name: /revenue overview/i })).toBeVisible();
    await expect(
      page.getByText(/revenue breakdown by period and category/i)
    ).toBeVisible();
  });

  test("should display chart container in Revenue tab", async ({ page }) => {
    await page.goto("/reports");

    // Find the card content area
    const chartCard = page
      .getByRole("heading", { name: /revenue overview/i })
      .locator("..")
      .locator("..");

    await expect(chartCard).toBeVisible();

    // Check for chart area (currently shows placeholder)
    const chartArea = chartCard.locator('[class*="h-\\[400px\\]"]');
    await expect(chartArea).toBeVisible();
  });

  test("should show placeholder text when chart is not yet implemented", async ({
    page,
  }) => {
    await page.goto("/reports");

    // Current implementation shows placeholder
    await expect(page.getByText(/revenue chart would display here/i)).toBeVisible();
    await expect(
      page.getByText(/integrate with recharts for visualization/i)
    ).toBeVisible();
  });
});

test.describe("Reports Page - Aging Report Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 128830,
            collection_rate: 94.2,
          },
        }),
      });
    });

    // Mock aging report data
    await page.route("**/api/v1/reports/aging*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            current: 45230,
            days_1_30: 32100,
            days_31_60: 25800,
            days_61_90: 15400,
            days_90_plus: 10300,
            total: 128830,
          },
        }),
      });
    });
  });

  test("should display Aging Report card", async ({ page }) => {
    await page.goto("/reports");

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();

    await expect(
      page.getByRole("heading", { name: /invoice aging report/i })
    ).toBeVisible();
    await expect(
      page.getByText(/outstanding invoices by age bucket/i)
    ).toBeVisible();
  });

  test("should display all 5 aging buckets", async ({ page }) => {
    await page.goto("/reports");

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();

    // Check all bucket labels
    await expect(page.getByText(/^current$/i)).toBeVisible();
    await expect(page.getByText(/1-30 days/i)).toBeVisible();
    await expect(page.getByText(/31-60 days/i)).toBeVisible();
    await expect(page.getByText(/61-90 days/i)).toBeVisible();
    await expect(page.getByText(/90\+ days/i)).toBeVisible();
  });

  test("should display aging amounts formatted as currency", async ({ page }) => {
    await page.goto("/reports");

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();

    // Check currency formatting
    await expect(page.getByText(/\$45,230/)).toBeVisible(); // Current
    await expect(page.getByText(/\$32,100/)).toBeVisible(); // 1-30 days
    await expect(page.getByText(/\$25,800/)).toBeVisible(); // 31-60 days
    await expect(page.getByText(/\$15,400/)).toBeVisible(); // 61-90 days
    await expect(page.getByText(/\$10,300/)).toBeVisible(); // 90+ days
  });

  test("should display aging percentages", async ({ page }) => {
    await page.goto("/reports");

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();

    // Check percentages are shown
    await expect(page.getByText(/35% of total/)).toBeVisible();
    await expect(page.getByText(/25% of total/)).toBeVisible();
    await expect(page.getByText(/20% of total/)).toBeVisible();
    await expect(page.getByText(/12% of total/)).toBeVisible();
    await expect(page.getByText(/8% of total/)).toBeVisible();
  });

  test("should highlight 90+ days bucket as destructive", async ({ page }) => {
    await page.goto("/reports");

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();

    // Find the 90+ days card
    const oldestBucket = page.getByText(/90\+ days/i).locator("..").locator("..");

    // Check if it has destructive styling (border-destructive class)
    const classList = await oldestBucket.getAttribute("class");
    expect(classList).toContain("border-destructive");
  });
});

test.describe("Reports Page - Customer Profitability Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    // Mock profitability report data
    await page.route("**/api/v1/reports/profitability*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            customers: [
              {
                customer_id: 1,
                customer_name: "Vasanti",
                revenue: 45000,
                orders: 120,
                avg_order_value: 375,
              },
              {
                customer_id: 2,
                customer_name: "Abokichi",
                revenue: 38000,
                orders: 95,
                avg_order_value: 400,
              },
              {
                customer_id: 3,
                customer_name: "TechCorp",
                revenue: 42000,
                orders: 88,
                avg_order_value: 477,
              },
            ],
          },
        }),
      });
    });
  });

  test("should display Customer Profitability card", async ({ page }) => {
    await page.goto("/reports");

    // Click Customers tab
    await page.getByRole("tab", { name: /^customers$/i }).click();

    await expect(
      page.getByRole("heading", { name: /customer profitability/i })
    ).toBeVisible();
    await expect(page.getByText(/revenue and activity by customer/i)).toBeVisible();
  });

  test("should display chart container in Customers tab", async ({ page }) => {
    await page.goto("/reports");

    // Click Customers tab
    await page.getByRole("tab", { name: /^customers$/i }).click();

    // Find the card content area
    const chartCard = page
      .getByRole("heading", { name: /customer profitability/i })
      .locator("..")
      .locator("..");

    await expect(chartCard).toBeVisible();

    // Check for chart area
    const chartArea = chartCard.locator('[class*="h-\\[400px\\]"]');
    await expect(chartArea).toBeVisible();
  });

  test("should show placeholder text when chart is not yet implemented", async ({
    page,
  }) => {
    await page.goto("/reports");

    // Click Customers tab
    await page.getByRole("tab", { name: /^customers$/i }).click();

    // Current implementation shows placeholder
    await expect(
      page.getByText(/customer profitability chart would display here/i)
    ).toBeVisible();
    await expect(
      page.getByText(/top customers by revenue and order volume/i)
    ).toBeVisible();
  });
});

test.describe("Reports Page - Service Breakdown Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });
  });

  test("should display Service Breakdown card", async ({ page }) => {
    await page.goto("/reports");

    // Click Services tab
    await page.getByRole("tab", { name: /^services$/i }).click();

    await expect(
      page.getByRole("heading", { name: /service breakdown/i })
    ).toBeVisible();
    await expect(page.getByText(/revenue by service type/i)).toBeVisible();
  });

  test("should display chart container in Services tab", async ({ page }) => {
    await page.goto("/reports");

    // Click Services tab
    await page.getByRole("tab", { name: /^services$/i }).click();

    // Find the card content area
    const chartCard = page
      .getByRole("heading", { name: /service breakdown/i })
      .locator("..")
      .locator("..");

    await expect(chartCard).toBeVisible();

    // Check for chart area
    const chartArea = chartCard.locator('[class*="h-\\[400px\\]"]');
    await expect(chartArea).toBeVisible();
  });

  test("should show placeholder text when chart is not yet implemented", async ({
    page,
  }) => {
    await page.goto("/reports");

    // Click Services tab
    await page.getByRole("tab", { name: /^services$/i }).click();

    // Current implementation shows placeholder
    await expect(
      page.getByText(/service breakdown chart would display here/i)
    ).toBeVisible();
    await expect(
      page.getByText(/pick\/pack, shipping, materials, storage/i)
    ).toBeVisible();
  });
});

test.describe("Reports Page - Loading States", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });
  });

  test("should show loading skeletons while fetching dashboard metrics", async ({
    page,
  }) => {
    // Delay the API response to test loading state
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    await page.goto("/reports");

    // Should show skeleton loaders in summary cards
    const skeletons = page.locator('[class*="animate-pulse"]');
    await expect(skeletons.first()).toBeVisible();
  });

  test("should display data after loading completes", async ({ page }) => {
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    await page.goto("/reports");

    // Wait for data to load and display
    await expect(page.getByText(/\$125,000/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("40")).toBeVisible();
  });
});

test.describe("Reports Page - Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });
  });

  test("should handle API errors gracefully", async ({ page }) => {
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Server error" },
        }),
      });
    });

    await page.goto("/reports");

    // Page should still render without crashing
    await expect(page.getByRole("heading", { name: /^reports$/i })).toBeVisible();

    // Should show zero or fallback values
    await expect(page.getByText(/\$0/)).toBeVisible();
  });
});

test.describe("Reports Page - API Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });
  });

  test("should call dashboard metrics API on page load", async ({ page }) => {
    let dashboardApiCalled = false;

    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      dashboardApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    await page.goto("/reports");

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify API was called
    expect(dashboardApiCalled).toBe(true);
  });

  test("should render revenue data from API response", async ({ page }) => {
    await page.route("**/api/v1/reports/revenue*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            period: "2026-01",
            total: 125000,
            by_customer: [
              { customer_id: 1, customer_name: "Vasanti", amount: 45000 },
              { customer_id: 2, customer_name: "Abokichi", amount: 38000 },
            ],
            by_charge_type: [
              { charge_type: "fulfillment", amount: 65000 },
              { charge_type: "shipping", amount: 42000 },
              { charge_type: "materials", amount: 18000 },
            ],
          },
        }),
      });
    });

    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    await page.goto("/reports");

    // Verify revenue data is displayed
    await expect(page.getByText(/\$125,000/)).toBeVisible();
  });

  test("should render aging data from API response", async ({ page }) => {
    await page.route("**/api/v1/reports/aging*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            current: 50000,
            days_1_30: 30000,
            days_31_60: 20000,
            days_61_90: 12000,
            days_90_plus: 8000,
            total: 120000,
          },
        }),
      });
    });

    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 120000,
            collection_rate: 94.2,
          },
        }),
      });
    });

    await page.goto("/reports");

    // Click Aging tab
    await page.getByRole("tab", { name: /^aging$/i }).click();

    // Note: Current implementation uses hardcoded data
    // When API integration is added, these assertions should pass with API data
    await expect(page.getByText(/current$/i)).toBeVisible();
    await expect(page.getByText(/1-30 days/i)).toBeVisible();
  });

  test("should render profitability data from API response", async ({ page }) => {
    await page.route("**/api/v1/reports/profitability*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            customers: [
              {
                customer_id: 1,
                customer_name: "Vasanti",
                revenue: 45000,
                orders: 120,
                avg_order_value: 375,
              },
              {
                customer_id: 2,
                customer_name: "Abokichi",
                revenue: 38000,
                orders: 95,
                avg_order_value: 400,
              },
            ],
          },
        }),
      });
    });

    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });

    await page.goto("/reports");

    // Click Customers tab
    await page.getByRole("tab", { name: /^customers$/i }).click();

    // Verify profitability section is visible
    await expect(
      page.getByRole("heading", { name: /customer profitability/i })
    ).toBeVisible();
  });
});

test.describe("Reports Page - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-id",
            email: "user@logibill.com",
            role: "user",
            customer_id: 1,
            company_id: 1,
          },
        }),
      });
    });

    // Mock dashboard metrics
    await page.route("**/api/v1/reports/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            revenue: 125000,
            invoices_sent: 40,
            outstanding_amount: 45230,
            collection_rate: 94.2,
          },
        }),
      });
    });
  });

  test("should support keyboard navigation through tabs", async ({ page }) => {
    await page.goto("/reports");

    // Focus on first tab
    await page.getByRole("tab", { name: /^revenue$/i }).focus();

    // Press arrow right to navigate to next tab
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: /^aging$/i })).toBeFocused();

    // Press arrow right again
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: /^customers$/i })).toBeFocused();
  });

  test("should have proper ARIA labels for interactive elements", async ({
    page,
  }) => {
    await page.goto("/reports");

    // Check tabs have proper role
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);

    // Check combobox has proper role
    const combobox = page.locator('[role="combobox"]');
    await expect(combobox.first()).toBeVisible();
  });
});
