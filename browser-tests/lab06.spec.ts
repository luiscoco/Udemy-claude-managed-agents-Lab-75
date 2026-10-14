import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=6'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
const status = (page: import('@playwright/test').Page) => page.locator('p[role="status"][aria-live="polite"]');

test('one retained session recalls context, reconnects without duplicate rows, and closes explicitly', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'New offline' }).click();
  await expect(status(page)).toContainText('Turn 1 completed');
  const identity = page.locator('p').filter({ hasText: 'Managed session:' });
  await expect(identity).toContainText('sesn_fixture_');
  await page.getByRole('button', { name: 'Use follow-up' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(status(page)).toContainText('Turn 2 completed');
  await expect(page.locator('ol').filter({ hasText: 'agent.message' })).toContainText('Aurora Finch');
  await page.getByRole('button', { name: 'Reconnect' }).click();
  await expect(status(page)).toContainText('stream opened before paginated history hydration');
  await expect(page.getByText('Duplicates ignored during hydration:', { exact: false })).toContainText('4');
  await page.getByRole('button', { name: 'Inspect server index' }).click();
  await expect(page.getByText('Server index:', { exact: false })).toContainText('2 turn(s), 4 messages');
  await page.getByRole('button', { name: 'Close and archive' }).click();
  await expect(status(page)).toContainText('archived');
});

test('a fresh session does not inherit the earlier project name', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Use follow-up' }).click();
  await page.getByRole('button', { name: 'New offline' }).click();
  await expect(status(page)).toContainText('Turn 1 completed');
  await expect(page.locator('ol').filter({ hasText: 'agent.message' })).toContainText('No fictional project name');
});

