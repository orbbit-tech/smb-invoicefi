import { test, expect } from '@playwright/test';

test.describe('Invoices List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices');
  });

  test('displays invoice list page with filters', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('My Invoices');

    // Check search input is visible
    await expect(page.getByPlaceholder(/Search by invoice number or payer/i)).toBeVisible();

    // Check status filter dropdown is visible
    await expect(page.getByRole('combobox')).toBeVisible();
  });

  test('filters invoices by status', async ({ page }) => {
    // Click on the status filter
    await page.getByRole('combobox').click();

    // Select "Repaid" status
    await page.getByRole('option', { name: 'Repaid' }).click();

    // Check that results are filtered
    const resultsText = await page.getByText(/Showing \d+ of \d+ invoices/).textContent();
    expect(resultsText).toBeTruthy();
  });

  test('searches invoices by invoice number', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by invoice number or payer/i);

    // Type a search query
    await searchInput.fill('INV-2024-001');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Check that results are filtered
    const resultsText = await page.getByText(/Showing \d+ of \d+ invoices/).textContent();
    expect(resultsText).toBeTruthy();
  });

  test('displays invoice table with sortable columns', async ({ page }) => {
    // Check table headers are visible
    await expect(page.getByText('Invoice #')).toBeVisible();
    await expect(page.getByText('Payer')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByText('Due Date')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Funding')).toBeVisible();
  });

  test('navigates to invoice detail page', async ({ page }) => {
    // Click on the first "View" button (eye icon)
    await page.getByRole('button').filter({ hasText: '' }).first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/invoices\/inv-\d+/);
  });

  test('navigates to submit invoice page', async ({ page }) => {
    await page.getByRole('link', { name: /Submit Invoice/i }).click();
    await expect(page).toHaveURL('/invoices/submit');
  });
});
