import { test, expect } from '@playwright/test';

test('Lab 59 counts routed sessions and exposes high-confidence wrong answers', async ({ page }) => {
  await page.goto('/?lesson=59'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Routing with verified outcomes', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run routing fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 59 status' })).toContainText('13 of 13 correct');
  await page.getByLabel('Routing strategy').selectOption('fixed-light');
  await page.getByRole('button', { name: 'Run routing fixture' }).click();
  await expect(page.getByRole('status', { name: 'Lab 59 status' })).toContainText('5 of 13 correct');
  await expect(page.getByText(/confidence 0.94, key check false/).first()).toBeVisible();
});
