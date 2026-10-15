import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=17');
  await page.getByRole('tab', { name: 'Run the exercise' }).click();
}

test('snapshot restores tracked files while untracked file and conversation survive', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Start offline fixture session' }).click();
  await expect(page.getByRole('article', { name: 'notes.md' })).toContainText('Status: draft');
  await page.getByRole('button', { name: 'Take host snapshot' }).click();
  await page.getByRole('button', { name: 'Send turn and run host handler' }).click();
  await expect(page.getByRole('article', { name: 'notes.md' })).toContainText('Status: reviewed');
  await page.getByLabel('Host action').selectOption('create-draft');
  await page.getByLabel('Host text or new status').fill('New tracked draft.');
  await page.getByRole('button', { name: 'Send turn and run host handler' }).click();
  await expect(page.getByRole('article', { name: 'draft.md' })).toContainText('New tracked draft.');
  await page.getByLabel('Host action').selectOption('create-untracked');
  await page.getByLabel('Host text or new status').fill('Keep this scratch note.');
  await page.getByRole('button', { name: 'Send turn and run host handler' }).click();
  await expect(page.getByRole('article', { name: 'scratch.md' })).toContainText('Keep this scratch note.');
  await page.getByRole('button', { name: 'Dry-run restore' }).click();
  await expect(page.getByRole('article', { name: 'Restore plan' })).toContainText('restore notes.md');
  await expect(page.getByRole('article', { name: 'Restore plan' })).toContainText('delete draft.md');
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('article', { name: 'notes.md' })).toContainText('Status: draft');
  await expect(page.getByRole('article', { name: 'draft.md' })).toContainText('(absent)');
  await expect(page.getByRole('article', { name: 'scratch.md' })).toContainText('Keep this scratch note.');
  await expect(page.getByRole('heading', { name: 'Conversation history' }).locator('xpath=following-sibling::ol[1]/li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Close session' }).click();
  await expect(page.getByLabel('Snapshot experiment status')).toContainText('archived');
});

test('phone fits and live readiness does not start a billed run', async ({ page }) => {
  let starts = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c17/session')) starts++; });
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  await page.getByRole('button', { name: 'Run live', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('MANAGED_LIVE_ENABLED');
  expect(starts).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
