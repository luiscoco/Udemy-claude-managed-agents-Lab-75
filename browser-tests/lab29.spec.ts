import { test, expect } from '@playwright/test';

test('Lab 29 compares inline and mounted fixture metadata without uploads', async ({ page }) => {
  await page.goto('/?lesson=29'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Images, documents and mounted files', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run offline comparison' }).click();
  await expect(page.getByLabel('File evidence')).toContainText('Uploaded file ID: none');
  await page.getByLabel('Delivery route').selectOption('upload');
  await page.getByRole('button', { name: 'Run offline comparison' }).click();
  await expect(page.getByLabel('File evidence')).toContainText('/mnt/session/uploads/lab29/aurora-finch.png');
  await page.getByLabel('Delivery route').selectOption('inline');
  await page.getByLabel('Payload scenario').selectOption('malformed');
  await page.getByRole('button', { name: 'Run offline comparison' }).click();
  await expect(page.getByRole('status', { name: 'Lab 29 status' })).toContainText('Malformed base64');
});
