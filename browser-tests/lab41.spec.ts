import { test, expect } from '@playwright/test';

test('Lab 41 retains a single session through reconnect and second turn', async ({ page }) => {
  await page.goto('/?lesson=41'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Managed session lifecycle comparison', level: 2 })).toBeVisible();
  await page.getByLabel('Offline workflow').selectOption('retained');
  await page.getByRole('button', { name: 'Start workflow' }).click();
  await page.getByRole('button', { name: 'reconnect', exact: true }).click();
  await expect(page.getByText(/Reconnect creations: 0/)).toBeVisible();
  await page.getByRole('button', { name: 'second-turn' }).click();
  await expect(page.getByText(/The fictional project name is Aurora Notebook/)).toBeVisible();
});
