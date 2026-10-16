import { test, expect } from '@playwright/test';

test('Lab 64 Playwright MCP verifies browser state and serves proof', async ({ page }) => {
  await page.goto('/?lesson=64'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Browser tools across host and cloud', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect product' }).click();
  await expect(page.getByRole('status', { name: 'Lab 64 status' })).toContainText('browser state verified');
  await expect(page.getByText(/Aurora Finch Field Kit; Price: 29 credits/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Screenshot of the verified local fixture page' })).toBeVisible();
  await page.getByRole('button', { name: 'Try blocked navigation' }).click();
  await expect(page.getByRole('status', { name: 'Lab 64 status' })).toContainText('blocked: browser state verified');
  await page.getByRole('button', { name: 'Missing browser' }).click();
  await expect(page.getByRole('status', { name: 'Lab 64 status' })).toContainText('no verified browser proof');
});
