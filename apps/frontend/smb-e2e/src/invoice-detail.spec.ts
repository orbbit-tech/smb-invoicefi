import { test, expect } from '@playwright/test';

test.describe('Invoice Detail Page', () => {
  test('displays invoice details and timeline', async ({ page }) => {
    // Navigate to a specific invoice
    await page.goto('/invoices/inv-001');

    // Check invoice number is displayed
    await expect(page.locator('h1')).toContainText('INV-2024-001');

    // Check invoice information section
    await expect(page.getByText('Invoice Information')).toBeVisible();
    await expect(page.getByText('Invoice Amount')).toBeVisible();
    await expect(page.getByText('Expected Funding')).toBeVisible();
    await expect(page.getByText('Due Date')).toBeVisible();
    await expect(page.getByText('Payer')).toBeVisible();

    // Check timeline section
    await expect(page.getByText('Invoice Timeline')).toBeVisible();
  });

  test('displays funding progress for partially funded invoice', async ({ page }) => {
    // Navigate to a partially funded invoice
    await page.goto('/invoices/inv-004');

    await expect(page.getByText('Funding Progress')).toBeVisible();
    await expect(page.getByText(/Amount Funded/i)).toBeVisible();

    // Check for funding in progress indicator
    await expect(page.getByText('Funding in Progress')).toBeVisible();
  });

  test('displays fully funded status', async ({ page }) => {
    // Navigate to a fully funded invoice
    await page.goto('/invoices/inv-003');

    await expect(page.getByText('Fully Funded!')).toBeVisible();
  });

  test('displays repaid status with dates', async ({ page }) => {
    // Navigate to a repaid invoice
    await page.goto('/invoices/inv-001');

    // Should show repaid status badge
    await expect(page.getByText('Repaid')).toBeVisible();

    // Quick summary should show repaid date
    await expect(page.getByText('Repaid On')).toBeVisible();
  });

  test('navigates back to invoices list', async ({ page }) => {
    await page.goto('/invoices/inv-002');

    await page.getByRole('link', { name: /Back to Invoices/i }).click();

    await expect(page).toHaveURL('/invoices');
  });

  test('displays quick summary sidebar', async ({ page }) => {
    await page.goto('/invoices/inv-002');

    await expect(page.getByText('Quick Summary')).toBeVisible();

    // Check summary contains key info
    await expect(page.locator('text=Status').first()).toBeVisible();
    await expect(page.locator('text=Invoice Amount').first()).toBeVisible();
    await expect(page.locator('text=You Receive').first()).toBeVisible();
    await expect(page.locator('text=Funding Progress').first()).toBeVisible();
  });
});
