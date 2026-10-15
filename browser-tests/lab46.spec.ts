import { test, expect } from '@playwright/test';

test('Lab 46 labels cache counters as authored and avoids savings claims', async ({ page }) => {
  await page.goto('/?lesson=46'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Observed cache usage and cost', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Compare usage fixtures' }).click();
  await expect(page.getByRole('status', { name: 'Lab 46 status' })).toContainText('Authored counters');
  await expect(page.getByText(/Savings claim: false/)).toBeVisible();
  await expect(page.getByText(/Provider calls: 0/)).toBeVisible();
});
