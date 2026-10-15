import { test, expect } from '@playwright/test';

test('Lab 37 valid gate allow is overridden by a stricter host path check', async ({ page }) => {
  await page.goto('/?lesson=37'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'External policy decision service', level: 2 })).toBeVisible();
  await page.getByLabel('Offline scenario').selectOption('host-refusal');
  await page.getByRole('button', { name: 'Start policy review' }).click();
  await page.getByRole('button', { name: 'Ask policy worker' }).click();
  await expect(page.getByRole('status', { name: 'Lab 37 status' })).toContainText('denied; 1 confirmation(s), 0 checked file effect(s)');
  await expect(page.getByText('Gate: allow. Host: deny. File effects: 0.')).toBeVisible();
  await page.getByLabel('Offline scenario').selectOption('malformed');
  await page.getByRole('button', { name: 'Start policy review' }).click();
  await page.getByRole('button', { name: 'Ask policy worker' }).click();
  await expect(page.getByRole('status', { name: 'Lab 37 status' })).toContainText('malformed; 0 confirmation(s), 0 checked file effect(s)');
});
