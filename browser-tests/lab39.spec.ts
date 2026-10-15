import { test, expect } from '@playwright/test';

test('Lab 39 keeps a branch rule as data and refuses its takeover', async ({ page }) => {
  await page.goto('/?lesson=39'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Trusted configuration and untrusted checkouts', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Create disposable worktree' }).click();
  await expect(page.getByRole('status', { name: 'Lab 39 status' })).toContainText('Manifest ready');
  await page.getByRole('button', { name: 'Try branch takeover' }).click();
  await expect(page.getByRole('status', { name: 'Lab 39 status' })).toContainText('refused');
  await expect(page.getByText('Branch hook runs: 0. Provider calls: 0.')).toBeVisible();
  await page.getByRole('button', { name: 'Checked read' }).click();
  await expect(page.getByText(/Tool result: read notes.txt: allowed/)).toBeVisible();
});
