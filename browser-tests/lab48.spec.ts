import { test, expect } from '@playwright/test';

test('Lab 48 displays observed local effects and loopback witness', async ({ page }) => {
  await page.goto('/?lesson=48'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Security hardening', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run local probe' }).click();
  await expect(page.getByRole('status', { name: 'Lab 48 status' })).toContainText('Blocked by');
  await expect(page.getByText(/Loopback collector hits: 0/)).toBeVisible();
  await page.getByLabel('Policy').selectOption('naive'); await page.getByLabel('Hostile request').selectOption('injected-egress');
  await page.getByRole('button', { name: 'Run local probe' }).click();
  await expect(page.getByText(/Loopback collector hits: 1/)).toBeVisible();
  await expect(page.getByRole('status', { name: 'Lab 48 status' })).toContainText('executed');
});
