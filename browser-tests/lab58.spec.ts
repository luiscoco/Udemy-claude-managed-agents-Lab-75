import { test, expect } from '@playwright/test';

test('Lab 58 search returns bounded definitions and the host rejects unauthorized refund', async ({ page }) => {
  await page.goto('/?lesson=58'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Tool catalogs and bounded discovery', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Search catalog' }).click();
  await expect(page.getByRole('status', { name: 'Lab 58 status' })).toContainText('5 definitions returned');
  await expect(page.locator('li strong').filter({ hasText: 'billing_refund_invoice' })).toBeVisible();
  await page.getByRole('button', { name: 'Try unauthorized refund' }).click();
  await expect(page.getByRole('status', { name: 'Lab 58 status' })).toContainText('denied invoice refund');
  await expect(page.locator('pre.lab-json')).toContainText('"effect": "none"');
  await page.getByRole('button', { name: 'Run authorized fixture' }).click();
  await expect(page.locator('pre.lab-json')).toContainText('"effect": "recorded-once"');
});
