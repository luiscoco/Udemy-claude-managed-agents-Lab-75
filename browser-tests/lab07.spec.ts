import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) { await page.goto('/?lesson=7'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); }
const status = (page: import('@playwright/test').Page) => page.locator('p[role="status"][aria-live="polite"]');
const audit = (page: import('@playwright/test').Page) => page.getByRole('table', { name: 'Policy audit' });

test('allow, deny and rewrite policies show decisions and actual file effects', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(audit(page)).toContainText('allow'); await expect(audit(page)).toContainText('executed; handler ran'); await expect(audit(page)).toContainText('Status: reviewed');

  await page.getByLabel('Host policy', { exact: true }).selectOption('deny-write'); await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(audit(page)).toContainText('Protected-file writes are denied before execution'); await expect(audit(page)).toContainText('denied; handler did not run');
  await page.getByRole('button', { name: 'Load protected.md' }).click(); await expect(page.getByLabel('Loaded file evidence')).toContainText('locked');

  await page.getByLabel('Host policy', { exact: true }).selectOption('rewrite-input'); await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(audit(page)).toContainText('rewrite'); await expect(audit(page)).toContainText('revalidated'); await expect(audit(page)).toContainText('/workspace/proposed.md'); await expect(audit(page)).toContainText('/workspace/draft.md');
  await page.getByRole('button', { name: 'Load draft.md' }).click(); await expect(page.getByLabel('Loaded file evidence')).toContainText('rewritten through policy');
  await expect(status(page)).toContainText('Host audit recorded 1 call');
});

test('handler exception is failed execution rather than a policy denial', async ({ page }) => {
  await open(page); await page.getByLabel('Offline scenario').selectOption('handler-exception'); await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(audit(page)).toContainText('failed; handler ran'); await expect(audit(page)).toContainText('Authored handler exception');
  await expect(audit(page)).toContainText('Status: draft');
});

