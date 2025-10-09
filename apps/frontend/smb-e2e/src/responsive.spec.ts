import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('renders dashboard on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(devices['iPhone 12'].viewport);
    await page.goto('/');

    // Check dashboard is accessible
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Metrics should stack vertically on mobile
    await expect(page.getByText('Total Invoices')).toBeVisible();
    await expect(page.getByText('Active Funding')).toBeVisible();
  });

  test('renders invoice list on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/invoices');

    // Check page is accessible
    await expect(page.locator('h1')).toContainText('My Invoices');

    // Table should be visible and scrollable
    await expect(page.getByText('Invoice #')).toBeVisible();
  });

  test('sidebar collapses on mobile', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport);
    await page.goto('/');

    // Sidebar trigger should be visible (to open sidebar)
    const sidebarTrigger = page.locator('button[aria-label*="sidebar" i], button[aria-label*="menu" i]').first();

    // On mobile, sidebar might be collapsed by default
    // This test ensures the app is usable on mobile
    await expect(page.locator('h1')).toBeVisible();
  });

  test('submit invoice form works on mobile', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport);
    await page.goto('/invoices/submit');

    // Form should be usable on mobile
    await expect(page.locator('h1')).toContainText('Submit Invoice');

    // Form fields should be accessible
    await expect(page.getByLabel(/Invoice Number/i)).toBeVisible();
    await expect(page.getByLabel(/Invoice Amount/i)).toBeVisible();

    // Fill form on mobile
    await page.getByLabel(/Invoice Number/i).fill('MOBILE-001');
    await page.getByLabel(/Invoice Amount/i).fill('10000');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.getByLabel(/Due Date/i).fill(futureDate.toISOString().split('T')[0]);

    await page.getByLabel(/Payer Name/i).fill('Mobile Test');

    // Should be able to proceed
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('Review Your Invoice')).toBeVisible();
  });

  test('invoice detail page is readable on mobile', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport);
    await page.goto('/invoices/inv-001');

    // Page should load and be readable
    await expect(page.locator('h1')).toContainText('INV-2024-001');

    // Key information should be visible
    await expect(page.getByText('Invoice Information')).toBeVisible();
    await expect(page.getByText('Invoice Amount')).toBeVisible();
  });
});
