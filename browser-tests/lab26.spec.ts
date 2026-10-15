import { test, expect } from '@playwright/test';

test('Lab 26 session controls enforce idle update and fresh model handoff', async ({ page }) => {
  await page.goto('/?lesson=26'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Session controls and supported updates', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Open offline session' }).click();
  await expect(page.getByRole('status', { name: 'Lab 26 status' })).toContainText('idle');
  await page.getByRole('button', { name: 'Send slow turn' }).click();
  await expect(page.getByRole('status', { name: 'Lab 26 status' })).toContainText('running');
  await page.getByRole('button', { name: 'Replace idle tools and MCP' }).click();
  await expect(page.getByRole('status', { name: 'Lab 26 status' })).toContainText('confirmed-idle session');
  await page.getByRole('button', { name: 'Interrupt and confirm idle' }).click();
  await expect(page.getByRole('status', { name: 'Lab 26 status' })).toContainText('confirmed-idle');
  await page.getByRole('button', { name: 'Replace idle tools and MCP' }).click();
  await expect(page.getByText('Tools: none. MCP: none.')).toBeVisible();
  await page.getByRole('button', { name: 'New session with summary' }).click();
  await expect(page.getByText('fixture-model-b', { exact: false }).first()).toBeVisible();
});
