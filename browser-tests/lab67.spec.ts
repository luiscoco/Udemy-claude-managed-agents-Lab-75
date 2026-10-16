import { test, expect } from '@playwright/test';

test('Lab 67 separates two tenant reservations and refuses five foreign probes', async ({ page }) => {
  await page.goto('/?lesson=67'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'A multi-tenant SaaS architecture', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Simulate both sign-ins' }).click();
  await expect(page.getByRole('status', { name: 'Lab 67 status' })).toContainText('principals authenticated');
  await page.getByLabel('Runner scenario').selectOption('hold');
  await page.getByRole('button', { name: 'Run both tenants' }).click();
  await expect(page.getByText(/state: running; reservation: 2/)).toHaveCount(2);
  await page.getByRole('button', { name: 'Probe Birch as Acme' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'HTTP 404' })).toHaveCount(5);
  await page.getByRole('button', { name: 'Try another Acme run' }).click();
  await expect(page.getByRole('status', { name: 'Lab 67 status' })).toContainText('concurrency');
  await page.getByRole('button', { name: 'Cancel own Acme run' }).click();
  await expect(page.getByText(/state: cancelled; reservation: 0/)).toBeVisible();
});
