import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=5'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
const calls = (page: import('@playwright/test').Page) => page.getByRole('table', { name: 'Custom tool calls' });
const row = (page: import('@playwright/test').Page, id: string) => calls(page).getByRole('row').filter({ hasText: id });

test('tour: valid calls change state, malformed input and bad IDs come back as is_error', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('cell', { name: 'createSdkMcpServer({ tools })', exact: true })).toBeVisible();
  await page.getByText('Custom tool definitions on the agent (3)').click();
  await expect(page.getByLabel('Custom tool definitions', { exact: true })).toContainText('"additionalProperties": false');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  await expect(row(page, 'sevt_custom_2')).toContainText('added task_3');
  await expect(row(page, 'sevt_custom_3')).toContainText('task_3 open → done');
  const malformed = row(page, 'sevt_custom_4');
  await expect(malformed).toContainText('rejected: title: Invalid input: expected string, received undefined');
  await expect(malformed).toContainText('did not run');
  await expect(malformed).toContainText('is_error: true');
  await expect(malformed).toContainText('no change');
  await expect(row(page, 'sevt_custom_5')).toContainText('No task has the ID task_99');
  await expect(row(page, 'sevt_custom_6')).toContainText('task_3 is already done');
  const state = page.getByRole('group', { name: 'Task state' });
  await expect(state).toContainText('add_task 1, complete_task 3 — for 7 tool calls and 7 results sent');
  await page.getByRole('button', { name: 'Load task state from GET /api/c5/tasks' }).click();
  await expect(page.getByRole('group', { name: 'Server task state' })).toContainText('task_3 [done] Write the custom tools guide (high)');
  await page.screenshot({ path: 'test-results/lab05-tour.png', fullPage: true });
});

test('student challenge: a wrong-typed title is rejected and the handler never runs', async ({ page }) => {
  await open(page);
  await page.getByLabel('Malformed add_task input (Tour, offline)').fill('{"title": 42}');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  await expect(row(page, 'sevt_custom_4')).toContainText('rejected: title: Invalid input: expected string, received number');
  await expect(row(page, 'sevt_custom_4')).toContainText('no change');
  await expect(page.getByRole('group', { name: 'Task state' })).toContainText('add_task 1,');
  await page.getByLabel('Malformed add_task input (Tour, offline)').fill('not json');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'must be a JSON object' })).toBeVisible();
});

test('the Tour results fit a 390px screen without horizontal page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await open(page);
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/lab05-tour-390.png', fullPage: true });
});

test('slow handler passes its deadline and saves nothing; a hanging run can be cancelled', async ({ page }) => {
  await open(page);
  await page.getByLabel('Offline scenario').selectOption('slow-handler');
  await page.getByLabel('Handler deadline (ms)').fill('300');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  await expect(row(page, 'sevt_custom_1')).toContainText('exceeded the 300 ms host handler deadline');
  await expect(page.getByRole('group', { name: 'Task state' })).not.toContainText('Slow handler demo');
  await page.getByLabel('Offline scenario').selectOption('hang');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(row(page, 'sevt_custom_1')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel query' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'attempted user.interrupt' })).toBeVisible();
});
