import { test, expect } from '@playwright/test';

test('Lab 60 crash recovery suppresses the unjournaled third effect', async ({ page }) => {
  await page.goto('/?lesson=60'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Durable long running agents', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start offline batch' }).click();
  await expect(page.getByRole('status', { name: 'Lab 60 status' })).toContainText('3 effects, 2 journaled');
  await page.getByRole('button', { name: 'Recover batch' }).click();
  await expect(page.getByRole('status', { name: 'Lab 60 status' })).toContainText('0 duplicate effects; 1 suppressed');
  await expect(page.getByText(/Journaled keys: 5; ledger effects: 5; duplicates: 0/)).toBeVisible();
});
