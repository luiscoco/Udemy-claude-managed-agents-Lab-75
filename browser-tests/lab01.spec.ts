import { expect, test } from '@playwright/test';

// Offline only: every scenario is an authored fixture, so no credentials, API calls or charges are involved.
async function openExercise(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=1');
  await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
test('normal turn separates metadata, authoritative text, lifecycle and outcome', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  const outcome = page.getByRole('group', { name: 'Turn outcome' });
  await expect(outcome).toContainText('completed');
  await expect(outcome).toContainText('end_turn');
  const heading = page.getByText('Authoritative agent.message', { exact: true });
  await expect(heading).toBeVisible();
  await expect(page.getByText('replaced its preview').first()).toBeVisible();
  await expect(page.getByText('sesn_fixture_lab01', { exact: true }).first()).toBeVisible();
  await expect(page.locator('main ol li').filter({ hasText: 'session.status_idle' }).filter({ hasText: 'stop_reason: end_turn' })).toBeVisible();
  // The text exists once: the preview was replaced, not appended to.
  const text = await heading.locator('xpath=ancestor::div[1]').innerText();
  expect(text.match(/means the turn finished/g)).toHaveLength(1);
  await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
});
test('stream that ends early is incomplete, never successful', async ({ page }) => {
  await openExercise(page);
  await page.getByLabel('Offline scenario').selectOption('stream-ended');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('incomplete');
  await expect(page.getByText('Incomplete preview')).toBeVisible();
});
test('empty prompt is rejected locally without a request', async ({ page }) => {
  let posts = 0;
  page.on('request', (request) => { if (request.method() === 'POST') posts++; });
  await openExercise(page);
  await page.getByLabel('Prompt').fill('   ');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a prompt');
  expect(posts).toBe(0);
});
test('cancel aborts the query and reports the limit of a local abort', async ({ page }) => {
  await openExercise(page);
  await page.getByLabel('Offline scenario').selectOption('cancel');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await page.getByRole('button', { name: 'Cancel query' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Cancelled locally' })).toContainText('user.interrupt');
});
