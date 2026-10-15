import { test, expect } from '@playwright/test';

test('Lab 43 reads an allowlisted MCP resource only after local consent', async ({ page }) => {
  await page.goto('/?lesson=43'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'MCP resources through a host bridge', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Grant local consent' }).click();
  await page.getByRole('button', { name: 'Read through host bridge' }).click();
  await expect(page.getByRole('status', { name: 'Lab 43 status' })).toContainText('allowed');
  await expect(page.getByText(/Aurora Finch count: 3/)).toBeVisible();
  await expect(page.getByText(/Provider calls: 0/)).toBeVisible();
});
