import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=2'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
test('offline preview comparison records identical authoritative text and distinct effective settings', async ({ page }) => {
  await open(page);
  await expect(page.getByText('50 US cents ($0.50)', { exact: false }).first()).toBeVisible();
  await page.getByLabel('System prompt', { exact: true }).selectOption('clear');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  const first = await page.getByText('Authoritative agent.message', { exact: true }).locator('xpath=ancestor::div[1]').locator('pre').innerText();
  await page.getByLabel('Text previews for this connection').uncheck();
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('completed');
  expect(await page.getByText('Authoritative agent.message', { exact: true }).locator('xpath=ancestor::div[1]').locator('pre').innerText()).toBe(first);
  await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody tr').last()).toContainText('cleared');
  await page.locator('tbody tr').last().getByText('Full requested options', { exact: true }).click();
  await expect(page.locator('tbody tr').last()).toContainText('"previews": false');
  await page.locator('tbody tr').last().getByText('Full requested options', { exact: true }).click();
  await expect(page.locator('tbody tr').last()).toContainText('Not reported');
  await page.screenshot({ path: 'test-results/lab02-preview-comparison.png', fullPage: true });
});

test('browser cancellation records a local result with unknown cleanup', async ({ page }) => {
  await open(page); await page.getByLabel('Offline scenario').selectOption('cancel');
  await page.getByRole('button', { name: 'Run offline fixture' }).click();
  await page.getByRole('button', { name: 'Cancel query' }).click();
  await expect(page.locator('tbody tr')).toContainText('cancelled');
  await expect(page.locator('tbody tr')).toContainText('unconfirmed');
  await expect(page.locator('tbody tr')).toContainText('Unknown: session response unavailable');
});

test('offline budget, deadline, terminal error, requires_action and incomplete stream have separate outcomes', async ({ page }) => {
  await open(page); await page.getByLabel('Local deadline (seconds)').fill('1');
  for (const [scenario, kind] of [['budget-reached', 'paused'], ['deadline', 'deadline'], ['session-error', 'error'],
    ['requires-action', 'paused'], ['stream-ended', 'incomplete']]) {
    await page.getByLabel('Offline scenario').selectOption(scenario!);
    await page.getByRole('button', { name: 'Run offline fixture' }).click();
    await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText(kind!);
    if (scenario === 'deadline') await expect(page.getByRole('group', { name: 'Turn outcome' })).toContainText('Interruption: simulated');
  }
  await expect(page.locator('tbody tr')).toHaveCount(5);
});

test('actual lesson guide and source are available', async ({ page }) => {
  await page.goto('/?lesson=2');
  await page.getByText('Detailed guide', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Migration', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'TypeScript source' }).click();
  await page.getByRole('combobox', { name: 'Source file' }).selectOption('server/lib/lab02-port.ts');
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('pre')).toContainText('agent_with_overrides');
});
