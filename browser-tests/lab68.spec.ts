import { test, expect } from '@playwright/test';

test('Lab 68 admission deduplicates and only explicit worker creates effect', async ({ page }) => {
  await page.goto('/?lesson=68'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Scheduled and event-driven agents', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Admit signed incident' }).click();
  await expect(page.getByRole('status', { name: 'Lab 68 status' })).toContainText('duplicate false');
  await expect(page.getByText(/Recorded effects: 0/)).toBeVisible();
  await page.getByRole('button', { name: 'Admit signed incident' }).click();
  await expect(page.getByRole('status', { name: 'Lab 68 status' })).toContainText('duplicate true');
  await page.getByRole('button', { name: 'Run one successful worker' }).click();
  await expect(page.getByRole('heading', { name: 'webhook: succeeded' })).toBeVisible();
  await expect(page.getByText(/Recorded effects: 1/)).toBeVisible();
  await page.getByRole('button', { name: 'Advance scheduling clock 60 seconds' }).click();
  await page.getByRole('button', { name: 'Stale signed request' }).click();
  await expect(page.getByRole('status', { name: 'Lab 68 status' })).toContainText('freshness rejected');
});
