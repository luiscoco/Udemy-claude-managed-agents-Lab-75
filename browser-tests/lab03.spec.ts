import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=3'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
const outcome = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Turn outcome' });
const files = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Sandbox files' });

test('unavailable and denied writes are distinct and leave no output file', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('cell', { name: 'permissionMode', exact: true })).toBeVisible();
  await page.getByLabel('Preset').selectOption('unavailable-write');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(outcome(page)).toContainText('completed');
  await expect(page.getByRole('list', { name: 'Permission denials' })).toContainText('Unavailable write');
  await expect(page.getByRole('table', { name: 'Tool calls' })).toContainText('deny / no evaluation');
  await page.getByLabel('Preset').selectOption('denied-write');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('list', { name: 'Permission denials' })).toContainText('Denied write');
  await expect(page.getByRole('table', { name: 'Tool calls' })).toContainText('ask / always_ask');
  await expect(files(page)).not.toContainText('outputs/draft.md');
});

test('permitted edit changes the outputs copy on disk; the challenge removes edit', async ({ page }) => {
  await open(page);
  await page.getByLabel('Preset').selectOption('permitted-edit');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(outcome(page)).toContainText('completed');
  await expect(files(page)).toContainText('Status: reviewed');
  await page.getByLabel('Remove edit').check();
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(outcome(page)).toContainText('completed');
  await expect(page.locator('tbody tr').last()).toContainText('Status: draft');
  await expect(page.getByRole('list', { name: 'Permission denials' })).toContainText('Unavailable edit');
  await page.getByRole('button', { name: 'Reset sandbox' }).click();
  await expect(files(page)).not.toContainText('outputs/draft.md');
  await page.screenshot({ path: 'test-results/lab03-challenge.png', fullPage: true });
});

test('cancel during a hanging fixture', async ({ page }) => {
  await open(page);
  await page.getByLabel('Offline scenario').selectOption('hang');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await page.getByRole('button', { name: 'Cancel query' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Cancelled locally' })).toBeVisible();
});
