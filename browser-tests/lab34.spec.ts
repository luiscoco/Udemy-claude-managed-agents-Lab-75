import { test, expect } from '@playwright/test';

test('Lab 34 keeps the fixed question and rejects unknown host styles', async ({ page }) => {
  await page.goto('/?lesson=34'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Output instruction variants', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Try unknown style' }).click();
  await expect(page.getByRole('status', { name: 'Lab 34 status' })).toContainText('Unknown trusted host style');
  await page.getByRole('button', { name: 'Compare in fresh session' }).click();
  await expect(page.getByRole('region', { name: 'concise comparison' })).toContainText('Report schema: valid. Capabilities: 0. Provider calls: 0.');
  await page.getByLabel('Trusted style').selectOption('review-v2');
  await page.getByRole('button', { name: 'Compare in fresh session' }).click();
  await expect(page.getByRole('region', { name: 'review-v2 comparison' })).toContainText('Next steps');
  await expect(page.getByRole('region', { name: 'concise comparison' })).toBeVisible();
});
