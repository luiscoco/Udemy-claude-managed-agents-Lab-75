import { test, expect } from '@playwright/test';

test('Lab 56 offline team controls distinguish blocked work verified evidence and shutdown', async ({ page }) => {
  const remoteCalls: string[] = [];
  page.on('request', request => { if (/\/live$/.test(new URL(request.url()).pathname)) remoteCalls.push(request.url()); });
  await page.goto('/?lesson=56');
  await page.getByRole('tab', { name: 'Run the exercise', exact: true }).click();
  const scenario = page.getByRole('combobox', { name: /^Team scenario/ });
  await page.getByRole('button', { name: 'Replay team actions', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Lab 56 status' })).toContainText('rejected actions');
  await expect(page.getByText(/Verified answer: none; clean shutdown: false/)).toBeVisible();
  await scenario.selectOption('verified-37');
  await page.getByRole('button', { name: 'Replay team actions', exact: true }).click();
  await expect(page.getByText(/Verified answer: 37/)).toBeVisible();
  await scenario.selectOption('clean-shutdown');
  await page.getByRole('button', { name: 'Replay team actions', exact: true }).click();
  await expect(page.getByText(/Verified answer: 37; clean shutdown: true/)).toBeVisible();
  await expect(page.getByText(/provider calls: 0/)).toBeVisible();
  expect(remoteCalls).toEqual([]);
});
