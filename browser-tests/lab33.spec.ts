import { test, expect } from '@playwright/test';

test('Lab 33 rejects invalid values, then correlates one local MCP form result', async ({ page }) => {
  await page.goto('/?lesson=33'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Human forms during tool work', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start MCP form' }).click();
  await expect(page.getByRole('region', { name: 'Pending MCP form' })).toContainText('fictional observation date');
  await page.getByRole('button', { name: 'Try invalid quantity' }).click();
  await expect(page.getByRole('status', { name: 'Lab 33 status' })).toContainText('Invalid closed form response');
  await page.getByRole('button', { name: 'Submit form' }).click();
  await expect(page.getByRole('status', { name: 'Lab 33 status' })).toContainText('accepted; MCP calls 1; answers 1');
  await expect(page.getByText(/^MCP tool result: Recorded fictional field note:/)).toBeVisible();
  await expect(page.getByText(/custom_tool_use_id/)).toBeVisible();
});
