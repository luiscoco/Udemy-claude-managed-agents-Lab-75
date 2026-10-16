import { test, expect } from '@playwright/test';

test('Lab 50 approval is host-owned and denial leaves the refund ledger empty', async ({ page }) => {
  await page.goto('/?lesson=50'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Acme Support Desk', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Send to desk' }).click();
  await expect(page.getByRole('region', { name: 'Pending refund review' })).toContainText('2500 cents');
  await page.getByRole('button', { name: 'Deny refund' }).click();
  await expect(page.getByText(/Refunds: none/)).toBeVisible();
  await page.getByRole('button', { name: 'Send to desk' }).click();
  await page.getByRole('button', { name: 'Approve refund' }).click();
  await expect(page.getByText(/Refunds: refund_/)).toBeVisible();
  await page.getByRole('button', { name: 'Run offline evals' }).click();
  await expect(page.getByText(/approved-damage-refund: pass/)).toBeVisible();
  await page.getByRole('button', { name: 'Close conversation' }).click();
  await expect(page.getByRole('status', { name: 'Lab 50 status' })).toContainText('archived');
});
