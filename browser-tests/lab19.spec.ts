import { expect, test } from '@playwright/test';

test('offline inventory, retained turns, derived session and archive are distinct', async ({ page }) => {
  let liveRuns = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c19/turn') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await page.goto('/?lesson=19'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Start offline session' }).click();
  await expect(page.getByLabel('Selected conversation evidence')).toContainText('State: idle');
  const firstId = await page.getByLabel('Selected conversation evidence').locator('code').first().textContent();
  await page.getByLabel('Session prompt').fill('What is the fictional project name?');
  await page.getByRole('button', { name: 'Send another turn' }).click();
  await expect(page.getByLabel('Selected conversation evidence')).toContainText(firstId!);
  await expect(page.getByLabel('Selected conversation evidence').getByRole('listitem')).toHaveCount(8);
  await page.getByRole('button', { name: 'Derive conversation' }).click();
  await expect(page.getByLabel('Selected conversation evidence')).toContainText('Explicit summary handoff');
  await expect(page.getByLabel('Selected conversation evidence')).toContainText('Parent:');
  const derivedId = await page.getByLabel('Selected conversation evidence').locator('code').first().textContent();
  expect(derivedId).not.toBe(firstId);
  await page.getByRole('button', { name: 'Archive idle session' }).click();
  await expect(page.getByLabel('Selected conversation evidence')).toContainText('State: archived');
  await expect(page.getByRole('button', { name: 'Send another turn' })).toBeDisabled();
  expect(liveRuns).toBe(0);
});

test('phone layout and explicit idle deletion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/?lesson=19'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await page.getByRole('button', { name: 'Start offline session' }).click();
  await expect(page.getByLabel('Selected conversation evidence')).toContainText('State: idle');
  await page.getByRole('button', { name: 'Delete selected idle session' }).click();
  await expect(page.getByLabel('Session experiment status')).toContainText('deleted');
  await expect(page.getByRole('heading', { name: 'Selected conversation' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
