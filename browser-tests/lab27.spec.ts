import { test, expect } from '@playwright/test';

test('Lab 27 reconnects the same authored task and stops it explicitly', async ({ page }) => {
  await page.goto('/?lesson=27'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Remote work beyond a browser connection', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Open slow offline task' }).click();
  await expect(page.getByRole('status', { name: 'Lab 27 status' })).toContainText('running');
  await page.getByRole('button', { name: 'Detach browser' }).click();
  await expect(page.getByRole('status', { name: 'Lab 27 status' })).toContainText('detached');
  await page.getByRole('button', { name: 'Reconnect same task' }).click();
  await expect(page.getByRole('status', { name: 'Lab 27 status' })).toContainText('attached');
  await expect(page.getByText('Provider creates: 1. Duplicate cards: 0.')).toBeVisible();
  await page.getByRole('button', { name: 'Stop and confirm idle' }).click();
  await expect(page.getByText('Stop evidence: confirmed-idle.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Close idle session' }).click();
  await expect(page.getByRole('status', { name: 'Lab 27 status' })).toContainText('closed');
});
