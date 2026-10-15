import { test, expect } from '@playwright/test';

test('Lab 38 copying a suggestion does not send it', async ({ page }) => {
  await page.goto('/?lesson=38'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Application follow up suggestions', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Start conversation' }).click();
  await page.getByRole('button', { name: 'Check suggestions' }).click();
  await expect(page.getByRole('region', { name: 'Follow up suggestions', exact: true })).toContainText('What observation detail');
  await page.getByRole('button', { name: /Copy: What observation detail/ }).click();
  await expect(page.getByRole('status', { name: 'Lab 38 status' })).toContainText('no message sent');
  await expect(page.getByText('Explicit sends: 1. Auto-sends: 0.')).toBeVisible();
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status', { name: 'Lab 38 status' })).toContainText('2 explicit user send(s); auto-sends 0');
});
