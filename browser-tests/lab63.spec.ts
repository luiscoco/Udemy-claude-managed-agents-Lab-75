import { test, expect } from '@playwright/test';

test('Lab 63 proposal changes no row until separate human approval', async ({ page }) => {
  await page.goto('/?lesson=63'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'A safe database agent', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Create SQLite session' }).click();
  await expect(page.getByRole('status', { name: 'Lab 63 status' })).toContainText('created for host tenant acme');
  await page.getByRole('button', { name: 'Propose cancellation' }).click();
  await expect(page.getByRole('status', { name: 'Lab 63 status' })).toContainText('pending human decision');
  await expect(page.getByText(/O-A1: open, version 1/)).toBeVisible();
  await page.getByRole('button', { name: 'Approve as human' }).click();
  await expect(page.getByRole('status', { name: 'Lab 63 status' })).toContainText('changed rows 1');
  await expect(page.getByText(/O-A1: cancelled, version 2/)).toBeVisible();
});
