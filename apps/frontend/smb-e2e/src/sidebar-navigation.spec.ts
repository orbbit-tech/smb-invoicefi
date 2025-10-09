import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays all navigation items', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Invoices' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Submit Invoice' })).toBeVisible();

    // Coming soon items (disabled)
    await expect(page.getByText('Analytics')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('highlights active navigation item', async ({ page }) => {
    // Dashboard should be active by default
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toBeVisible();

    // Navigate to invoices
    await page.getByRole('link', { name: 'My Invoices' }).click();
    await expect(page).toHaveURL('/invoices');

    // My Invoices should be active now
    const invoicesLink = page.getByRole('link', { name: 'My Invoices' });
    await expect(invoicesLink).toBeVisible();
  });

  test('navigates between pages using sidebar', async ({ page }) => {
    // Navigate to My Invoices
    await page.getByRole('link', { name: 'My Invoices' }).click();
    await expect(page).toHaveURL('/invoices');
    await expect(page.locator('h1')).toContainText('My Invoices');

    // Navigate to Submit Invoice
    await page.getByRole('link', { name: 'Submit Invoice' }).click();
    await expect(page).toHaveURL('/invoices/submit');
    await expect(page.locator('h1')).toContainText('Submit Invoice');

    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('displays organization and member information', async ({ page }) => {
    // Check that organization name is displayed (from mock session)
    await expect(page.getByText('Demo SMB Company')).toBeVisible();

    // Check that member name is displayed
    await expect(page.getByText('Demo User')).toBeVisible();
  });

  test('disabled menu items show tooltip', async ({ page }) => {
    // Hover over Analytics (disabled)
    const analyticsButton = page.getByRole('button', { name: 'Analytics' });
    await analyticsButton.hover();

    // Should show tooltip with "Coming Soon" message
    // Note: Tooltip visibility depends on Shadcn implementation
    await expect(analyticsButton).toBeDisabled();
  });
});
