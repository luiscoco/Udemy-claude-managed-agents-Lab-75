import { test, expect } from '@playwright/test';

test('Lab 40 refuses an undo of a kept turn and preserves the ledger', async ({ page }) => {
  await page.goto('/?lesson=40'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Safe recovery boundaries', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Build recovery case' }).click();
  await expect(page.getByText(/processed: First user turn/)).toBeVisible();
  await page.getByRole('button', { name: 'Try host-only undo' }).click();
  await expect(page.getByText(/Undo: refused/)).toBeVisible();
  await page.getByRole('button', { name: 'continue', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Lab 40 status' })).toContainText('Continue the owned session');
  await expect(page.getByText('Provider calls: 0.')).toBeVisible();
});
