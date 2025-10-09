import { test, expect } from '@playwright/test';

test.describe('Submit Invoice Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices/submit');
  });

  test('displays multi-step form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Submit Invoice');

    // Check step indicator
    await expect(page.getByText('Invoice Details')).toBeVisible();
    await expect(page.getByText('Review & Submit')).toBeVisible();

    // Step 1 should be active
    const step1Indicator = page.locator('div').filter({ hasText: '1' }).first();
    await expect(step1Indicator).toBeVisible();
  });

  test('validates required fields in step 1', async ({ page }) => {
    // Try to go to next step without filling fields
    await page.getByRole('button', { name: /Next: Review & Submit/i }).click();

    // Should show validation errors
    await expect(page.getByText('Invoice number is required')).toBeVisible();
    await expect(page.getByText('Please enter a valid amount')).toBeVisible();
    await expect(page.getByText('Due date is required')).toBeVisible();
    await expect(page.getByText('Payer name is required')).toBeVisible();
  });

  test('completes step 1 and proceeds to step 2', async ({ page }) => {
    // Fill in required fields
    await page.getByLabel(/Invoice Number/i).fill('TEST-INV-001');
    await page.getByLabel(/Invoice Amount/i).fill('50000');

    // Set due date to a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const formattedDate = futureDate.toISOString().split('T')[0];
    await page.getByLabel(/Due Date/i).fill(formattedDate);

    await page.getByLabel(/Payer Name/i).fill('Test Corporation');
    await page.getByLabel(/Payer Industry/i).fill('Technology');
    await page.getByLabel(/Description/i).fill('Test invoice for software services');

    // Check that expected funding amount is displayed
    await expect(page.getByText(/You will receive approximately/i)).toBeVisible();
    await expect(page.getByText(/\$40,000/i)).toBeVisible(); // 80% of $50,000

    // Click next
    await page.getByRole('button', { name: /Next: Review & Submit/i }).click();

    // Should be on step 2
    await expect(page.getByRole('heading', { name: 'Review Your Invoice' })).toBeVisible();
  });

  test('reviews and submits invoice', async ({ page }) => {
    // Fill in step 1
    await page.getByLabel(/Invoice Number/i).fill('TEST-INV-002');
    await page.getByLabel(/Invoice Amount/i).fill('25000');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const formattedDate = futureDate.toISOString().split('T')[0];
    await page.getByLabel(/Due Date/i).fill(formattedDate);

    await page.getByLabel(/Payer Name/i).fill('Adobe Systems');
    await page.getByRole('button', { name: /Next: Review & Submit/i }).click();

    // Verify review information
    await expect(page.getByText('TEST-INV-002')).toBeVisible();
    await expect(page.getByText('Adobe Systems')).toBeVisible();
    await expect(page.getByText('$25,000')).toBeVisible();
    await expect(page.getByText('$20,000')).toBeVisible(); // 80% of $25,000

    // Submit the form
    await page.getByRole('button', { name: /Submit Invoice/i }).click();

    // Should show loading state
    await expect(page.getByText(/Submitting.../i)).toBeVisible();

    // Wait for redirect to invoices page
    await page.waitForURL('/invoices?submitted=true', { timeout: 5000 });
  });

  test('can go back from step 2 to step 1', async ({ page }) => {
    // Fill and proceed to step 2
    await page.getByLabel(/Invoice Number/i).fill('TEST-INV-003');
    await page.getByLabel(/Invoice Amount/i).fill('15000');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const formattedDate = futureDate.toISOString().split('T')[0];
    await page.getByLabel(/Due Date/i).fill(formattedDate);

    await page.getByLabel(/Payer Name/i).fill('Stripe Inc');
    await page.getByRole('button', { name: /Next: Review & Submit/i }).click();

    // Click back button
    await page.getByRole('button', { name: /Back/i }).click();

    // Should be back on step 1 with preserved data
    await expect(page.getByLabel(/Invoice Number/i)).toHaveValue('TEST-INV-003');
    await expect(page.getByLabel(/Invoice Amount/i)).toHaveValue('15000');
    await expect(page.getByLabel(/Payer Name/i)).toHaveValue('Stripe Inc');
  });

  test('validates due date is in the future', async ({ page }) => {
    await page.getByLabel(/Invoice Number/i).fill('TEST-INV-004');
    await page.getByLabel(/Invoice Amount/i).fill('10000');

    // Set a past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const formattedDate = pastDate.toISOString().split('T')[0];
    await page.getByLabel(/Due Date/i).fill(formattedDate);

    await page.getByLabel(/Payer Name/i).fill('Test Payer');

    // Try to proceed
    await page.getByRole('button', { name: /Next: Review & Submit/i }).click();

    // Should show validation error
    await expect(page.getByText('Due date must be in the future')).toBeVisible();
  });
});
