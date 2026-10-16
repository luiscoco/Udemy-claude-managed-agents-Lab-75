import { test, expect } from '@playwright/test';

test('Lab 69 remote proposal conflicts after local change and fresh review applies', async ({ page }) => {
  await page.goto('/?lesson=69'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Desktop and IDE host integration', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start guided review' }).click();
  await expect(page.getByRole('heading', { name: 'Proposed replacement' })).toBeVisible();
  await expect(page.getByText(/Host document version: 1/)).toBeVisible();
  await page.getByRole('button', { name: 'Change local document' }).click();
  await page.getByRole('button', { name: 'Apply reviewed patch' }).click();
  await expect(page.getByRole('status', { name: 'Lab 69 status' })).toContainText('version/hash conflict');
  await page.getByRole('button', { name: 'Start guided review' }).click();
  await expect(page.getByRole('status', { name: 'Lab 69 status' })).toContainText('completed; cleanup');
  await page.getByRole('button', { name: 'Apply reviewed patch' }).click();
  await expect(page.getByRole('status', { name: 'Lab 69 status' })).toContainText('Reviewed patch applied');
  await expect(page.getByText(/Host document version: 3/)).toBeVisible();
});
