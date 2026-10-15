import { test, expect } from '@playwright/test';

test('Lab 35 batched events are lost at crash and eager events persist', async ({ page }) => {
  await page.goto('/?lesson=35'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Event mirrors and conversation indexes', level: 2 })).toBeVisible();
  await page.getByLabel('Flush strategy').selectOption('batched');
  await page.getByRole('button', { name: 'Start mirror' }).click();
  await expect(page.getByRole('status', { name: 'Lab 35 status' })).toContainText('0 persisted and 2 pending');
  await page.getByRole('button', { name: 'Simulate crash and restart' }).click();
  await expect(page.getByRole('status', { name: 'Lab 35 status' })).toContainText('0 persisted and 0 pending');
  await page.getByLabel('Flush strategy').selectOption('eager');
  await page.getByRole('button', { name: 'Start mirror' }).click();
  await expect(page.getByRole('status', { name: 'Lab 35 status' })).toContainText('2 persisted and 0 pending');
  await expect(page.getByRole('region', { name: 'Canonical mirror events' })).toContainText('sevt_');
});
