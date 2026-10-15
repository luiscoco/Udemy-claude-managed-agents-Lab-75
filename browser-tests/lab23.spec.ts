import { expect, test } from '@playwright/test';

async function open(page: import('@playwright/test').Page) {
  await page.goto('/?lesson=23'); await page.getByRole('tab', { name: 'Run the exercise' }).click();
}
test('offline bundle comparison validates pins and exposes only reviewed effects', async ({ page }) => {
  let liveRuns = 0; page.on('request', request => { if (request.url().endsWith('/api/c23/run') && request.postDataJSON()?.mode === 'live') liveRuns++; });
  await open(page);
  await expect(page.getByText('skill/SKILL.md')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Enable bundle' }).uncheck();
  await page.getByRole('button', { name: 'Run offline bundle' }).click();
  await expect(page.getByLabel('Bundle run result')).toContainText('No host tool effect');
  await page.getByRole('checkbox', { name: 'Enable bundle' }).check();
  await page.getByRole('checkbox', { name: 'Include skill snapshot' }).check();
  await page.getByRole('checkbox', { name: 'Include URL MCP declaration' }).check();
  await page.getByRole('button', { name: 'Run offline bundle' }).click();
  await expect(page.getByLabel('Capability inventory')).toContainText('bird.format_observation');
  await expect(page.getByLabel('Capability inventory')).toContainText('bird.catalog');
  await expect(page.getByLabel('Capability inventory')).toContainText('Worker tools: 0');
  await expect(page.getByLabel('Bundle run result')).toContainText('Aurora Finch: 3 at north marsh');
  await expect(page.getByLabel('Bundle run result')).toContainText('MCP contacted: false');
  await page.getByLabel('Reload variant').selectOption('changed-hash');
  await page.getByRole('button', { name: 'Reload local bundle' }).click();
  await expect(page.getByRole('status', { name: 'Bundle status' })).toContainText('hash differs');
  await page.getByLabel('Reload variant').selectOption('valid');
  await page.getByRole('button', { name: 'Reload local bundle' }).click();
  await expect(page.getByRole('status', { name: 'Bundle status' })).toContainText('No remote session changed');
  expect(liveRuns).toBe(0);
});

test('phone layout fits and live setup does not start a session', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await page.getByRole('button', { name: 'Run live' }).click();
  await expect(page.getByRole('region', { name: 'Live setup instructions' })).toContainText('separate setup workflow');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
