import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=4'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
const dialog = (page: import('@playwright/test').Page) => page.getByRole('dialog');

test('approve one edit, deny another, and the files on disk show only the approved change', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('cell', { name: 'updatedInput', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  // 1. Copy the draft (write), 2. first edit: allow both.
  for (const tool of ['write', 'edit']) {
    await expect(dialog(page)).toContainText(`Review tool call: ${tool}`);
    await expect(dialog(page)).toBeFocused();
    await dialog(page).getByRole('button', { name: 'Allow' }).click();
  }
  // 3. Second edit: deny with a custom message (the student challenge).
  await expect(dialog(page)).toContainText('"Approved by the reviewer."');
  await dialog(page).getByLabel('Deny message (sent to the agent)').fill('Keep the reviewer line unchanged.');
  await dialog(page).getByRole('button', { name: 'Deny' }).click();
  // 4. A second file: the host refuses allow (422), so the reviewer denies.
  await expect(dialog(page)).toContainText('summary.md');
  await expect(dialog(page)).toContainText('allow will be refused');
  await dialog(page).getByRole('button', { name: 'Allow' }).click();
  await expect(dialog(page).getByRole('alert')).toContainText('HTTP 422');
  await dialog(page).getByRole('button', { name: 'Deny' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  await expect(dialog(page)).toHaveCount(0);
  const files = page.getByRole('group', { name: 'Sandbox files' });
  await expect(files).toContainText('Status: reviewed');
  await expect(files).toContainText('Reviewer notes are in notes.md.');
  await expect(files).not.toContainText('summary.md');
  await expect(page.getByText('denied edit with "Keep the reviewer line unchanged."')).toBeVisible();
  await page.getByRole('button', { name: 'Replay last decision' }).click();
  await page.getByRole('button', { name: 'Send with a wrong token' }).click();
  await expect(page.getByRole('list', { name: 'Decision tester results' })).toContainText('Replay: HTTP 409');
  await expect(page.getByRole('list', { name: 'Decision tester results' })).toContainText('Wrong token: HTTP 404');
  await page.screenshot({ path: 'test-results/lab04-review.png', fullPage: true });
});

test('an unanswered review expires and is denied by the host', async ({ page }) => {
  await open(page);
  await page.getByLabel('Approval window (seconds)').fill('5');
  await page.getByLabel('Local deadline (seconds)').fill('9');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(dialog(page)).toContainText('Review tool call: write');
  await expect(page.getByRole('table', { name: 'Decision log' })).toContainText('expiry', { timeout: 10_000 });
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('deadline', { timeout: 15_000 });
  await expect(page.getByRole('group', { name: 'Sandbox files' })).not.toContainText('outputs/draft.md');
});

test('cancel while a review is pending, and preallowed calls never reach the reviewer', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(dialog(page)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel query' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'released every pending approval' })).toBeVisible();
  await page.getByLabel('Offline scenario').selectOption('preallowed-only');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByText('Never asked (preallowed):')).toBeVisible();
  await expect(page.getByText('Asked (paused for review): none')).toBeVisible();
});
