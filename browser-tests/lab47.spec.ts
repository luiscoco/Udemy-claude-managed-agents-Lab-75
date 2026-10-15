import { test, expect } from '@playwright/test';

test('Lab 47 separates raw worker reports, verified handoff and usage scopes', async ({ page }) => {
  await page.goto('/?lesson=47'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Model driven and host driven orchestration', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run offline coordination' }).click();
  await expect(page.getByRole('status', { name: 'Lab 47 status' })).toContainText('passed');
  await expect(page.getByText(/Parent session:/)).toBeVisible();
  await page.getByLabel('Orchestration route').selectOption('pipeline');
  await page.getByLabel('Offline scenario').selectOption('incorrect-total');
  await page.getByRole('button', { name: 'Run offline coordination' }).click();
  await expect(page.getByText('south worker: corrected')).toBeVisible();
  await expect(page.getByText(/Host aggregate:/)).toBeVisible();
});
