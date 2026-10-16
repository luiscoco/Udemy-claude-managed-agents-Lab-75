import { test, expect } from '@playwright/test';

test('Lab 61 local MCP client separates transport and agent identities', async ({ page }) => {
  await page.goto('/?lesson=61'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Exposing an agent as an MCP server', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Run local MCP client' }).click();
  await expect(page.getByRole('status', { name: 'Lab 61 status' })).toContainText('normal: local MCP client completed');
  await expect(page.getByText(/Progress events: 2/)).toBeVisible();
  await expect(page.locator('pre.lab-json')).toContainText('"eligible": true');
  await page.getByLabel('Client scenario').selectOption('timeout');
  await page.getByRole('button', { name: 'Run local MCP client' }).click();
  await expect(page.getByText(/timeout: true/)).toBeVisible();
});
