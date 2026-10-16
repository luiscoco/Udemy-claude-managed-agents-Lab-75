import { test, expect } from '@playwright/test';

test('Lab 53 trace separates a schema failure from unconfirmed stream EOF', async ({ page }) => {
  await page.goto('/?lesson=53'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Debug session and host traces', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run trace' }).click();
  await expect(page.getByText(/final report valid: false/)).toBeVisible();
  await expect(page.getByText(/event outcome completed/)).toBeVisible();
  await page.getByLabel('Failure scenario').selectOption('stream-eof');
  await page.getByRole('button', { name: 'Run trace' }).click();
  await expect(page.getByText(/event outcome incomplete; remote stop unconfirmed; cleanup/)).toBeVisible();
  await expect(page.getByRole('status', { name: 'Lab 53 status' })).toContainText('Stream EOF gives no remote completion or failure verdict');
  await page.getByRole('button', { name: 'Inspect saved run' }).click();
  await expect(page.getByRole('status', { name: 'Lab 53 status' })).toContainText('Owned trace retrieved');
});
