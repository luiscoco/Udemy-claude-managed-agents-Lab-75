import { expect, test } from '@playwright/test';
test('tabs use roving focus, arrow wrap, Home/End and named panels', async ({ page }) => {
  await page.goto('/browser-tests/harness.html?lesson=1');
  const learn = page.getByRole('tab', { name: 'Learn', exact: true });
  const run = page.getByRole('tab', { name: 'Run the exercise' });
  const last = page.getByRole('tab', { name: 'Lab walkthrough', exact: true });
  await learn.focus(); await page.keyboard.press('ArrowRight');
  await expect(run).toBeFocused(); await expect(run).toHaveAttribute('aria-selected', 'true');
  await expect(learn).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('tabpanel', { name: 'Run the exercise' })).toBeVisible();
  await page.keyboard.press('End'); await expect(last).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(learn).toBeFocused();
  await page.keyboard.press('ArrowLeft'); await expect(last).toBeFocused();
  await page.keyboard.press('Home'); await expect(learn).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
});
test('source copies actual TypeScript without line numbers and reports copy failure', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/browser-tests/harness.html?lesson=1'); await page.getByRole('tab', { name: 'TypeScript source' }).click();
  await page.getByRole('combobox', { name: 'Source file' }).selectOption('shared/contracts.ts');
  const source = page.locator('.source-card .code-block pre');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    await expect(source).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(source).toHaveCSS('color', 'rgb(241, 245, 249)');
    await expect(source.locator('.syntax-keyword').first()).toHaveCSS('color', 'rgb(221, 186, 255)');
  }
  await page.getByRole('button', { name: 'Copy shared/contracts.ts' }).click();
  await expect(page.getByText('Copied.', { exact: true })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/^import \{ z \} from 'zod';/);
  expect(copied).toContain('export const runRequestSchema');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied'); }; });
  await page.getByRole('button', { name: 'Copy shared/contracts.ts' }).click();
  await expect(page.getByText('Copy unavailable. Select the text to copy it manually.')).toBeVisible();
});
test('load errors give a helpful retry path', async ({ page }) => {
  let failed = false;
  await page.route('**/browser-tests/fixtures/Exercise.tsx*', async (route) => {
    if (!failed) { failed = true; await route.abort(); } else await route.continue();
  });
  await page.goto('/browser-tests/harness.html?lesson=1'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('heading', { name: 'Exercise could not load' })).toBeVisible();
  await expect(page.getByText('Check your connection and that the local web server is running. Your lesson is still available.')).toBeVisible();
  await page.getByRole('button', { name: 'Retry loading exercise' }).click();
  await expect(page.getByRole('textbox', { name: 'Test text' })).toBeVisible();
});
test('exercise loads on demand, retains state across tabs and cancels without resubmission', async ({ page }) => {
  let loads = 0; let posts = 0;
  page.on('request', request => { if (request.url().includes('/fixtures/Exercise.tsx')) loads++; if (request.method() === 'POST') posts++; });
  await page.route('**/api/framework-test/stream', async route => {
    await route.fulfill({ contentType: 'text/event-stream', body: 'id: 1\nevent: result\ndata: {"output":"Test completed."}\n\n' });
  });
  await page.goto('/browser-tests/harness.html?lesson=1'); expect(loads).toBe(0); expect(posts).toBe(0);
  await page.getByRole('button', { name: 'Open exercise', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Run the exercise' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Test text' }).fill('retained');
  await page.getByRole('button', { name: 'Run test' }).click(); await expect(page.getByText('Test completed.', { exact: true })).toBeVisible();
  for (const name of ['Learn', 'TypeScript source', 'Run the exercise']) await page.getByRole('tab', { name, exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Test text' })).toHaveValue('retained');
  await expect(page.getByText('Test completed.', { exact: true })).toBeVisible(); expect(loads).toBe(1); expect(posts).toBe(1);
  await page.getByRole('button', { name: 'Run live', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toBeFocused();
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByText('Setup is still unavailable. Follow the instructions above.')).toBeVisible(); expect(posts).toBe(1);
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/framework-test/stream', async route => { await gate; await route.abort().catch(() => {}); });
  await page.getByRole('button', { name: 'Run test' }).click(); await expect(page.getByText('Running.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Cancelled.', { exact: true })).toBeVisible(); release(); expect(posts).toBe(2);
  await page.getByRole('button', { name: 'Run test' }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'Home' }).click();
  await page.goBack(); await page.getByRole('tab', { name: 'Run the exercise' }).click();
  await expect(page.getByRole('textbox', { name: 'Test text' })).toHaveValue('test');
});
