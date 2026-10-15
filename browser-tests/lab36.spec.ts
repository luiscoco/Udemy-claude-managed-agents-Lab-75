import { test, expect } from '@playwright/test';

test('Lab 36 separates completed loopback work from pending remote cleanup', async ({ page }) => {
  await page.goto('/?lesson=36'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Remote transport and host runners', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run transport experiment' }).click();
  await expect(page.getByRole('status', { name: 'Lab 36 status' })).toContainText('completed; cleanup confirmed');
  await expect(page.getByRole('region', { name: 'Remote lifecycle' })).toContainText('stream-complete');
  await page.getByLabel('Offline scenario').selectOption('cancel-pending-cleanup');
  await page.getByRole('button', { name: 'Run transport experiment' }).click();
  await expect(page.getByRole('status', { name: 'Lab 36 status' })).toContainText('canceled; cleanup pending');
  await expect(page.getByText('Remote stop confirmed: false', { exact: false })).toBeVisible();
});
