import { test, expect } from '@playwright/test';

test.describe('SMB Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard with auth bypass enabled
    await page.goto('/');
  });

  test('displays dashboard with metrics cards', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Check metric cards are visible
    await expect(page.getByText('Total Invoices')).toBeVisible();
    await expect(page.getByText('Active Funding')).toBeVisible();
    await expect(page.getByText('Total Funded')).toBeVisible();
    await expect(page.getByText('Pending Repayments')).toBeVisible();
  });

  test('displays recent invoices table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Invoices' })).toBeVisible();

    // Check table headers
    await expect(page.getByText('Invoice #')).toBeVisible();
    await expect(page.getByText('Payer')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByText('Due Date')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('navigates to submit invoice page from CTA button', async ({ page }) => {
    await page.getByRole('link', { name: /Submit Invoice/i }).first().click();
    await expect(page).toHaveURL('/invoices/submit');
    await expect(page.locator('h1')).toContainText('Submit Invoice');
  });

  test('navigates to all invoices page', async ({ page }) => {
    await page.getByRole('link', { name: /View All/i }).click();
    await expect(page).toHaveURL('/invoices');
    await expect(page.locator('h1')).toContainText('My Invoices');
  });

  test('displays dev mode indicator when auth is bypassed', async ({ page }) => {
    // Check if dev mode indicator is present
    const devIndicator = page.getByText(/Development Mode/i);
    const isVisible = await devIndicator.isVisible();

    // This should be visible when NEXT_PUBLIC_BYPASS_AUTH=true
    expect(isVisible).toBeTruthy();
  });
});
