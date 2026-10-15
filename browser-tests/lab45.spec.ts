import { test, expect } from '@playwright/test';

test('Lab 45 distinguishes documented AWS Managed support from disabled local route', async ({ page }) => {
  await page.goto('/?lesson=45'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Provider availability and configuration', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Load capability catalog' }).click();
  await expect(page.locator('.lab-results').getByText(/Claude Platform on AWS/).first()).toBeVisible();
  await page.getByLabel('Target').selectOption('claude-platform-aws');
  await page.getByRole('button', { name: 'Run loopback preflight' }).click();
  await expect(page.getByRole('status', { name: 'Lab 45 status' })).toContainText('unverified');
  await expect(page.getByText(/Provider calls: 0/)).toBeVisible();
});
