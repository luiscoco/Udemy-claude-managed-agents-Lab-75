import { test, expect } from '@playwright/test';

test('Lab 54 shows closed contract recovery and one idempotent host refund', async ({ page }) => {
  await page.goto('/?lesson=54'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Design tools the model uses well', level: 2 })).toBeVisible();
  await expect(page.getByText(/amount field has no currency/)).toBeVisible();
  await page.getByLabel('Scenario').selectOption('correct-idempotent');
  await page.getByRole('button', { name: 'Call scripted tool' }).click();
  await expect(page.getByText(/Approvals 1; refunds 1; stable business idempotency true/)).toBeVisible();
  await page.getByLabel('Tool contract').selectOption('explicit');
  await expect(page.getByText('Contract linter: No workshop issues.')).toBeVisible();
  await page.getByRole('button', { name: 'Run all four cases' }).click();
  await expect(page.getByRole('heading', { name: 'missing-prerequisite' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Lab 54 status' })).toContainText('scripted cases completed');
});
