import { test, expect } from '@playwright/test';

test('Lab 28 classifies bounded read retry and uncertain create without automatic mutation retry', async ({ page }) => {
  await page.goto('/?lesson=28'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Errors, retries and reconciliation', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run offline fault' }).click();
  await expect(page.getByLabel('Fault evidence')).toContainText('Read attempts: 3');
  await page.getByLabel('Offline fault scenario').selectOption('missing-create-response');
  await page.getByRole('button', { name: 'Run offline fault' }).click();
  await expect(page.getByLabel('Fault evidence')).toContainText('unknown-create-id');
  await expect(page.getByLabel('Fault evidence')).toContainText('Mutation attempts: 1');
});
