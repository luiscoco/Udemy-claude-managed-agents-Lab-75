import { test, expect } from '@playwright/test';

test('Lab 70 real Python worker retains an owned session and closes it', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/?lesson=70'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Python client for Managed Agents', level: 2 })).toBeVisible();
  await expect(page.getByText(/Interpreter available:/)).toBeVisible();
  if (await page.getByText(/Interpreter available: false/).count()) test.skip(true, 'No allowlisted Python interpreter.');
  await page.getByLabel('Session operation').selectOption('retained-start');
  await page.getByLabel('Offline scenario').selectOption('custom-tool');
  await page.getByRole('button', { name: 'Start offline Python' }).click();
  await expect(page.getByRole('status', { name: 'Lab 70 status' })).toContainText('completed: Python worker finished', { timeout: 20000 });
  await expect(page.getByText(/3 fictional Aurora Finch birds/)).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: /Handle .*; idle/ })).toHaveCount(1);
  await page.getByLabel('Session operation').selectOption('retained-turn');
  await page.getByRole('button', { name: 'Start offline Python' }).click();
  await expect(page.getByRole('status', { name: 'Lab 70 status' })).toContainText('completed: Python worker finished', { timeout: 20000 });
  await page.getByLabel('Session operation').selectOption('close');
  await page.getByRole('button', { name: 'Start offline Python' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: /Handle .*; closed/ })).toHaveCount(1, { timeout: 20000 });
});
