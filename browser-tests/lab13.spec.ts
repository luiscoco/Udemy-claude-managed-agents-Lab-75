import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) { await page.goto('/?lesson=13'); await page.getByRole('tab', { name: 'Run the exercise' }).click(); }
test('real local MCP works and idle disable prevents a second reservation', async ({ page }) => {
  await open(page); await page.getByRole('checkbox', { name: 'Enable fictional stock reservation tool' }).check();
  await page.getByLabel('Offline authored tool plan').selectOption('reserve'); await page.getByRole('button', { name: 'Run offline MCP experiment' }).click();
  const evidence = page.getByLabel('MCP evidence', { exact: true }); await expect(evidence).toContainText('NOTEBOOK: 7 available');
  await expect(evidence).toContainText('Path: host-mcp'); await expect(evidence).toContainText('Host result submission acknowledged: true');
  await page.getByRole('checkbox', { name: 'Enable inventory server' }).uncheck(); await page.getByRole('button', { name: 'Apply idle MCP configuration' }).click();
  await expect(evidence).toContainText('inventory / streamable-http: disabled');
  await page.getByRole('button', { name: 'Run offline MCP experiment' }).click(); await expect(evidence).toContainText('Path: host-rejected');
  await expect(evidence).toContainText('NOTEBOOK: 7 available'); await page.getByRole('button', { name: 'Close MCP session' }).click(); await expect(evidence).toContainText('State: closed');
});
test('unauthorized and missing local connections are errors, not cloud measurements', async ({ page }) => {
  await open(page); const evidence = page.getByLabel('MCP evidence', { exact: true });
  for (const [scenario, status] of [['unauthorized', '401'], ['missing', '404']]) {
    await page.getByLabel('Offline connection scenario').selectOption(scenario!); await page.getByRole('button', { name: 'Run offline MCP experiment' }).click();
    await expect(evidence).toContainText(`HTTP status: ${status}`); await expect(evidence).toContainText('Host handler attempted: false');
    await page.getByRole('button', { name: 'Close MCP session' }).click(); await expect(evidence).toContainText('State: closed');
  }
});
test('cancel a hanging offline turn, inspect cleanup and fit phone evidence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByLabel('Offline connection scenario').selectOption('hang'); await page.getByRole('button', { name: 'Run offline MCP experiment' }).click();
  await expect(page.getByLabel('MCP evidence', { exact: true })).toContainText('State: running');
  await page.getByRole('button', { name: 'Cancel experiment' }).click();
  await expect(page.getByRole('button', { name: 'Inspect local stock and session' })).toBeEnabled();
  await page.getByRole('button', { name: 'Inspect local stock and session' }).click();
  await expect(page.getByLabel('MCP evidence', { exact: true })).toContainText('State: closed');
  await page.getByText('Full MCP transport and session evidence', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('native URL setup stays unavailable without endpoint/vault and never starts a model', async ({ page }) => {
  let executions = 0; page.on('request', request => { if (/\/api\/c13\/(query|session|send)$/.test(request.url())) executions++; });
  await page.route('**/api/c13/servers', route => route.fulfill({ json: { liveReady: true, nativeUrlReady: false, cloudReachability: 'not-tested', protocolVersion: '2025-11-25' } }));
  await open(page); await page.getByLabel('Live integration').selectOption('managed-url');
  await page.getByRole('button', { name: 'Run live', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('CLAUDE_MANAGED_LAB13_VAULT_ID'); expect(executions).toBe(0);
});
