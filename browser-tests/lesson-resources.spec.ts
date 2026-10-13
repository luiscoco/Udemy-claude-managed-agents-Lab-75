import { expect, test } from '@playwright/test';

test('real UI and server text have syntax, line numbers and catalog-only supporting navigation', async ({ page }) => {
  const executions: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'POST' || (url.pathname.endsWith('/LessonGuide.tsx') && !url.searchParams.has('raw'))) executions.push(request.url());
  });
  await page.goto('/browser-tests/harness.html?lesson=1');
  executions.length = 0;
  await page.getByRole('tab', { name: 'TypeScript source' }).click();
  const selector = page.getByRole('combobox', { name: 'Source file' });
  await selector.selectOption('src/components/LessonGuide.tsx');
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('pre')).toContainText('export function LessonGuide');
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('.line-number').first()).toHaveText('1');
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('.syntax-keyword').first()).toBeVisible();
  await page.getByRole('navigation', { name: 'Supporting imports' }).getByRole('button', { name: 'src/lib/presentation.ts', exact: true }).click();
  await expect(selector).toHaveValue('src/lib/presentation.ts');
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('pre')).toContainText('selectGuide');
  await selector.selectOption('server/lib/run-store.ts');
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('pre')).toContainText('export class RunStore');
  expect(executions).toEqual([]);
});

for (const resource of ['source', 'guide']) test(`${resource} load failure retries with a fresh document`, async ({ page }) => {
  let failed = false;
  await page.route(resource === 'source' ? '**/server/lib/run-store.ts?*' : '**/browser-tests/fixtures/guide.md?*', async (route) => {
    if (new URL(route.request().url()).searchParams.has('raw') && !failed) { failed = true; await route.abort(); }
    else await route.continue();
  });
  await page.goto('/browser-tests/harness.html?lesson=1');
  if (resource === 'source') await page.getByRole('tab', { name: 'TypeScript source' }).click();
  else await page.getByText('Detailed guide', { exact: true }).click();
  const label = resource === 'source' ? 'server/lib/run-store.ts' : 'guide';
  await expect(page.getByRole('alert')).toContainText(`${label} could not load`);
  await page.getByRole('button', { name: `Retry loading ${label}`, exact: true }).click();
  if (resource === 'source') {
    await expect(page.getByRole('combobox', { name: 'Source file' })).toHaveValue(label);
    await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).locator('pre')).toContainText('export class RunStore');
  } else await expect(page.getByRole('table')).toBeVisible();
});

test('source shows loading and empty states without executing returned text', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/server/lib/run-store.ts?*', async (route) => {
    await gate;
    await route.fulfill({ contentType: 'application/javascript', body: 'export default "";' });
  });
  await page.goto('/browser-tests/harness.html?lesson=1');
  await page.getByRole('tab', { name: 'TypeScript source' }).click();
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).getByRole('status')).toContainText('Loading server/lib/run-store.ts');
  release();
  await expect(page.getByRole('tabpanel', { name: 'TypeScript source' }).getByRole('status')).toContainText('server/lib/run-store.ts is empty.');
});
