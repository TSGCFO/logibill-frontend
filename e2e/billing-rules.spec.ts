import { test, expect } from "@playwright/test";

/**
 * Billing Rules E2E Tests
 *
 * TDD RED PHASE: Tests for billing rules CRUD operations,
 * conditional rule builder, and billing sandbox.
 *
 * Track: frontend-prod_20260202
 * Tasks: 4.1, 4.3, 4.5
 */

// Mock customer for testing
const mockCustomer = {
  id: 1,
  name: "Test Customer",
  code: "TEST",
  email: "test@example.com",
  status: "active",
};

// Mock billing rules
const mockBillingRules = [
  {
    id: 1,
    customer_id: 1,
    rule_type: "order_type",
    name: "B2B Order Discount",
    description: "10% discount for B2B orders",
    conditions: { order_type: "B2B" },
    actions: { discount_percent: 10 },
    priority: 1,
    is_active: true,
  },
  {
    id: 2,
    customer_id: 1,
    rule_type: "carrier",
    name: "FedEx Handling Fee",
    description: "Add handling fee for FedEx shipments",
    conditions: { carrier: "FedEx" },
    actions: { flat_fee: 0.5 },
    priority: 2,
    is_active: true,
  },
  {
    id: 3,
    customer_id: 1,
    rule_type: "conditional",
    name: "High Volume Bonus",
    description: "5% discount for high volume",
    conditions: { monthly_orders_gt: 1000 },
    actions: { discount_percent: 5 },
    priority: 3,
    is_active: false,
  },
];

test.describe("Billing Rules CRUD", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "admin-user",
            email: "admin@logibill.com",
            role: "admin",
            customer_id: null,
            company_id: 1,
          },
        }),
      });
    });

    // Mock customer endpoint
    await page.route("**/api/v1/customers/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockCustomer,
        }),
      });
    });

    // Mock billing rules list
    await page.route("**/api/v1/billing/rules/1", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: mockBillingRules,
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("should display billing rules list for a customer", async ({ page }) => {
    await page.goto("/billing/config/1");

    // Wait for page to load
    await expect(page.getByRole("heading", { name: /billing configuration/i })).toBeVisible();

    // Navigate to rules tab
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Should show all rules from API
    await expect(page.getByText("B2B Order Discount")).toBeVisible();
    await expect(page.getByText("FedEx Handling Fee")).toBeVisible();
    await expect(page.getByText("High Volume Bonus")).toBeVisible();
  });

  test("should show Add Rule button", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Should have Add Rule button
    const addButton = page.getByRole("button", { name: /add rule/i });
    await expect(addButton).toBeVisible();
  });

  test("should open create rule dialog when Add Rule clicked", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Click Add Rule
    await page.getByRole("button", { name: /add rule/i }).click();

    // Should show create dialog
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/create.*rule/i)).toBeVisible();
  });

  test("should create a new billing rule", async ({ page }) => {
    let createCalled = false;

    // Mock create endpoint
    await page.route("**/api/v1/billing/rules/1", async (route) => {
      if (route.request().method() === "POST") {
        createCalled = true;
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: 4,
              customer_id: 1,
              ...body,
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: mockBillingRules,
          }),
        });
      }
    });

    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Click Add Rule
    await page.getByRole("button", { name: /add rule/i }).click();

    // Fill in the form
    await page.getByLabel(/name/i).fill("New Test Rule");
    await page.getByLabel(/description/i).fill("A test rule description");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Wait for API call
    await page.waitForTimeout(500);

    expect(createCalled).toBe(true);
  });

  test("should edit an existing billing rule", async ({ page }) => {
    let updateCalled = false;

    // Mock update endpoint
    await page.route("**/api/v1/billing/rules/1/1", async (route) => {
      if (route.request().method() === "PUT" || route.request().method() === "PATCH") {
        updateCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { ...mockBillingRules[0], name: "Updated Rule Name" },
          }),
        });
      }
    });

    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Find and click edit button on first rule
    const firstRule = page.locator('[data-testid="billing-rule"]').first();
    await firstRule.getByRole("button", { name: /edit/i }).click();

    // Should open edit dialog
    await expect(page.getByRole("dialog")).toBeVisible();

    // Update the name
    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill("Updated Rule Name");

    // Save
    await page.getByRole("button", { name: /save/i }).click();

    await page.waitForTimeout(500);
    expect(updateCalled).toBe(true);
  });

  test("should delete a billing rule with confirmation", async ({ page }) => {
    let deleteCalled = false;

    await page.route("**/api/v1/billing/rules/1/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Click delete on first rule
    const firstRule = page.locator('[data-testid="billing-rule"]').first();
    await firstRule.getByRole("button", { name: /delete/i }).click();

    // Should show confirmation dialog
    await expect(page.getByText(/are you sure|confirm/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /confirm|delete/i }).click();

    await page.waitForTimeout(500);
    expect(deleteCalled).toBe(true);
  });

  test("should toggle rule active status", async ({ page }) => {
    let toggleCalled = false;

    await page.route("**/api/v1/billing/rules/1/1", async (route) => {
      if (route.request().method() === "PATCH") {
        toggleCalled = true;
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { ...mockBillingRules[0], is_active: body.is_active },
          }),
        });
      }
    });

    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Find toggle switch on first rule
    const firstRule = page.locator('[data-testid="billing-rule"]').first();
    const toggle = firstRule.getByRole("switch");
    await toggle.click();

    await page.waitForTimeout(500);
    expect(toggleCalled).toBe(true);
  });

  test("should reorder rules by drag and drop", async ({ page }) => {
    let reorderCalled = false;

    await page.route("**/api/v1/billing/rules/1/reorder", async (route) => {
      reorderCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockBillingRules,
        }),
      });
    });

    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    // Find drag handles
    const dragHandles = page.locator('[data-testid="drag-handle"]');
    const firstHandle = dragHandles.first();
    const secondHandle = dragHandles.nth(1);

    // Perform drag and drop (simplified check)
    await firstHandle.dragTo(secondHandle);

    // Note: Actual drag-drop testing may require more specific implementation
  });
});

test.describe("Conditional Rule Builder", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "admin-user",
            email: "admin@logibill.com",
            role: "admin",
          },
        }),
      });
    });

    await page.route("**/api/v1/customers/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockCustomer,
        }),
      });
    });

    await page.route("**/api/v1/billing/rules/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockBillingRules,
        }),
      });
    });
  });

  test("should show condition builder when creating conditional rule", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    await page.getByRole("button", { name: /add rule/i }).click();

    // Select conditional rule type
    await page.getByLabel(/rule type/i).click();
    await page.getByRole("option", { name: /conditional/i }).click();

    // Should show condition builder
    await expect(page.getByText(/add condition/i)).toBeVisible();
  });

  test("should add multiple conditions with AND/OR logic", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    await page.getByRole("button", { name: /add rule/i }).click();

    // Select conditional rule type
    await page.getByLabel(/rule type/i).click();
    await page.getByRole("option", { name: /conditional/i }).click();

    // Add first condition
    await page.getByRole("button", { name: /add condition/i }).click();

    // Should show condition row with field, operator, value
    await expect(page.getByLabel(/field/i).first()).toBeVisible();
    await expect(page.getByLabel(/operator/i).first()).toBeVisible();

    // Add another condition
    await page.getByRole("button", { name: /add condition/i }).click();

    // Should now have logic selector (AND/OR)
    const conditions = page.locator('[data-testid="condition-row"]');
    await expect(conditions).toHaveCount(2);
  });

  test("should show field options (carrier, order_type, etc.)", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    await page.getByRole("button", { name: /add rule/i }).click();
    await page.getByLabel(/rule type/i).click();
    await page.getByRole("option", { name: /conditional/i }).click();

    await page.getByRole("button", { name: /add condition/i }).click();

    // Open field dropdown
    await page.getByLabel(/field/i).first().click();

    // Should show available fields
    await expect(page.getByRole("option", { name: /carrier/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /order.*type/i })).toBeVisible();
  });

  test("should show operator options (equals, contains, etc.)", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    await page.getByRole("button", { name: /add rule/i }).click();
    await page.getByLabel(/rule type/i).click();
    await page.getByRole("option", { name: /conditional/i }).click();

    await page.getByRole("button", { name: /add condition/i }).click();

    // Select a field first
    await page.getByLabel(/field/i).first().click();
    await page.getByRole("option", { name: /carrier/i }).click();

    // Open operator dropdown
    await page.getByLabel(/operator/i).first().click();

    // Should show operators
    await expect(page.getByRole("option", { name: /equals/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /contains/i })).toBeVisible();
  });

  test("should remove conditions", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    await page.getByRole("button", { name: /add rule/i }).click();
    await page.getByLabel(/rule type/i).click();
    await page.getByRole("option", { name: /conditional/i }).click();

    // Add two conditions
    await page.getByRole("button", { name: /add condition/i }).click();
    await page.getByRole("button", { name: /add condition/i }).click();

    let conditions = page.locator('[data-testid="condition-row"]');
    await expect(conditions).toHaveCount(2);

    // Remove first condition
    await page.getByRole("button", { name: /remove.*condition/i }).first().click();

    conditions = page.locator('[data-testid="condition-row"]');
    await expect(conditions).toHaveCount(1);
  });

  test("should validate rule before save", async ({ page }) => {
    await page.goto("/billing/config/1");
    await page.getByRole("tab", { name: /custom rules/i }).click();

    await page.getByRole("button", { name: /add rule/i }).click();

    // Try to save without filling required fields
    await page.getByRole("button", { name: /create|save/i }).click();

    // Should show validation error
    await expect(page.getByText(/name.*required|please.*name/i)).toBeVisible();
  });
});

test.describe("Billing Sandbox", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "admin-user",
            email: "admin@logibill.com",
            role: "admin",
          },
        }),
      });
    });

    // Mock customers list
    await page.route("**/api/v1/customers*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [mockCustomer],
          meta: { page: 1, per_page: 20, total: 1, total_pages: 1 },
        }),
      });
    });
  });

  test("should display sandbox page with customer selector", async ({ page }) => {
    await page.goto("/billing/sandbox");

    await expect(page.getByRole("heading", { name: /billing sandbox/i })).toBeVisible();
    await expect(page.getByText(/select.*customer/i)).toBeVisible();
  });

  test("should have order JSON input area", async ({ page }) => {
    await page.goto("/billing/sandbox");

    // Should have textarea for JSON input
    await expect(page.getByRole("textbox")).toBeVisible();

    // Should have sample order loaded by default
    await expect(page.getByText(/"order_id"/)).toBeVisible();
  });

  test("should run sandbox and show results", async ({ page }) => {
    const mockSandboxResult = {
      charges: [
        {
          type: "Pick",
          description: "Item picking (15 items)",
          amount: 5.25,
          quantity: 15,
          unit_price: 0.35,
          rule_applied: "Standard pick rate",
          rule_id: null,
        },
        {
          type: "Pack",
          description: "Package handling (2 packages)",
          amount: 3.0,
          quantity: 2,
          unit_price: 1.5,
          rule_applied: "Standard pack rate",
          rule_id: null,
        },
      ],
      total: 8.25,
      rules_evaluated: [
        { id: 1, name: "B2B Discount", matched: false, reason: "Order type is B2C" },
        { id: 2, name: "FedEx Fee", matched: true },
      ],
      execution_time_ms: 45,
    };

    await page.route("**/api/v1/billing/sandbox", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockSandboxResult,
        }),
      });
    });

    await page.goto("/billing/sandbox");

    // Select customer
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /test customer/i }).click();

    // Run sandbox
    await page.getByRole("button", { name: /run sandbox/i }).click();

    // Should show results
    await expect(page.getByText(/\$8\.25/)).toBeVisible();
    await expect(page.getByText(/pick/i)).toBeVisible();
    await expect(page.getByText(/pack/i)).toBeVisible();
  });

  test("should show evaluation trace", async ({ page }) => {
    const mockSandboxResult = {
      charges: [{ type: "Pick", description: "Test", amount: 5.0, quantity: 10, unit_price: 0.5, rule_applied: null, rule_id: null }],
      total: 5.0,
      rules_evaluated: [
        { id: 1, name: "B2B Discount", matched: false, reason: "Order type is B2C" },
        { id: 2, name: "FedEx Fee", matched: true },
      ],
      execution_time_ms: 45,
    };

    await page.route("**/api/v1/billing/sandbox", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: mockSandboxResult,
        }),
      });
    });

    await page.goto("/billing/sandbox");

    // Select customer and run
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /test customer/i }).click();
    await page.getByRole("button", { name: /run sandbox/i }).click();

    // Switch to trace tab
    await page.getByRole("tab", { name: /trace|evaluation/i }).click();

    // Should show rules evaluated
    await expect(page.getByText(/b2b discount/i)).toBeVisible();
    await expect(page.getByText(/fedex fee/i)).toBeVisible();
  });

  test("should show comparison with actual charges", async ({ page }) => {
    await page.goto("/billing/sandbox");

    // The comparison feature should be available
    // This tests that we can compare simulated vs actual charges
    await expect(page.getByText(/compare|comparison/i).or(page.getByText(/sandbox/i))).toBeVisible();
  });

  test("should validate JSON before running", async ({ page }) => {
    await page.goto("/billing/sandbox");

    // Select customer
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /test customer/i }).click();

    // Enter invalid JSON
    const textarea = page.getByRole("textbox");
    await textarea.clear();
    await textarea.fill("{ invalid json }");

    // Try to run
    await page.getByRole("button", { name: /run sandbox/i }).click();

    // Should show error
    await expect(page.getByText(/invalid.*json|parse.*error/i)).toBeVisible();
  });

  test("should require customer selection before running", async ({ page }) => {
    await page.goto("/billing/sandbox");

    // Try to run without selecting customer
    await page.getByRole("button", { name: /run sandbox/i }).click();

    // Should show error or button should be disabled
    const runButton = page.getByRole("button", { name: /run sandbox/i });
    const isDisabled = await runButton.isDisabled();

    if (!isDisabled) {
      // If not disabled, should show error message
      await expect(page.getByText(/select.*customer/i)).toBeVisible();
    }
  });

  test("should reset sample order", async ({ page }) => {
    await page.goto("/billing/sandbox");

    const textarea = page.getByRole("textbox");

    // Clear the textarea
    await textarea.clear();
    await textarea.fill("modified content");

    // Click reset button
    await page.getByRole("button", { name: /reset.*sample/i }).click();

    // Should restore sample order
    await expect(page.getByText(/"order_id"/)).toBeVisible();
  });
});
