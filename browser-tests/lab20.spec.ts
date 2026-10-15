import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=20'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
test('offline lifecycle cases distinguish execution, denial, handler error and interceptor exception', async ({ page }) => {
  let liveRuns = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c20/run') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await open(page);
  for (const [scenario, outcome] of [
    ['passing-policy', 'verified'], ['denied-pre-execution', 'host-policy-denial'],
    ['tool-failure', 'tool-error'], ['interceptor-exception', 'host-instrumentation-error'],
    ['deadline', 'deadline'], ['final-validation-failure', 'final-validation-error'],
  ] as const) {
    await page.getByLabel('Offline lifecycle scenario').selectOption(scenario);
    await page.getByRole('button', { name: 'Run offline lifecycle' }).click();
    await expect(page.getByLabel('Lifecycle result')).toContainText(`Outcome: ${outcome}`);
  }
  await expect(page.getByLabel('Lifecycle result')).toContainText('Status: reviewed');
  expect(liveRuns).toBe(0);
});

test('phone fits and readiness never starts a live session', async ({ page }) => {
  let liveRuns = 0;
  page.on('request', request => { if (request.url().endsWith('/api/c20/run') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('isolated server API key');
  await page.getByRole('button', { name: 'Run offline lifecycle' }).click();
  await expect(page.getByLabel('Lifecycle result')).toContainText('Outcome: verified');
  await page.getByRole('button', { name: 'Inspect draft.md' }).click();
  await expect(page.getByLabel('Inspected file contents')).toContainText('Status: reviewed');
  expect(liveRuns).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
