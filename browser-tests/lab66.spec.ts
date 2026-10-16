import { test, expect } from '@playwright/test';

test('Lab 66 streams through real local WebSocket and reconnects to same run', async ({ page }) => {
  await page.goto('/?lesson=66'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Real-time frontends over WebSocket', level: 2 })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Lab 66 status' })).toContainText('WebSocket connected');
  await page.getByRole('button', { name: 'Start guided run' }).click();
  await expect(page.getByRole('status', { name: 'Lab 66 status' })).toContainText('ready');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status', { name: 'Lab 66 status' })).toContainText('completed: Offline turn completed');
  await expect(page.getByRole('listitem').filter({ hasText: 'terminal (completed' })).toBeVisible();
  await page.getByRole('button', { name: 'Disconnect' }).click();
  await expect(page.getByRole('status', { name: 'Lab 66 status' })).toContainText('Disconnected');
  await page.getByRole('button', { name: 'Reconnect and replay' }).click();
  await expect(page.getByRole('status', { name: 'Lab 66 status' })).toContainText('existing run retained');
});
