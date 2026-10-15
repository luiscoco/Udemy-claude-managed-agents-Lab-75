import { test, expect } from '@playwright/test';

test('Lab 30 refuses a blocked review then accepts checked evidence in order', async ({ page }) => {
  await page.goto('/?lesson=30'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Host task board and completion gates', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start offline board' }).click();
  await expect(page.getByText('task_2: Review field note')).toBeVisible();
  await page.getByRole('button', { name: 'Attempt review completion' }).click();
  await expect(page.getByRole('status', { name: 'Lab 30 status' })).toContainText('refused');
  await page.getByRole('button', { name: 'Complete draft with evidence' }).click();
  await expect(page.getByRole('status', { name: 'Lab 30 status' })).toContainText('accepted');
  await page.getByRole('button', { name: 'Attempt review completion' }).click();
  await page.getByRole('button', { name: 'Complete publish with evidence' }).click();
  await expect(page.getByRole('row', { name: /task_3: Publish field note/ })).toContainText('done');
});
