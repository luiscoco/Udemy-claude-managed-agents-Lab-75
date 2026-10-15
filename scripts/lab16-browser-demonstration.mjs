import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('artifacts/lab16', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.route('**/api/c16/env-run', async route => { if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.'); await route.continue(); });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5174'}/?lesson=16`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click(); await page.getByLabel('Offline scenario').selectOption('winning-host-layer');
    await page.getByRole('button', { name: 'Resolve host settings' }).click(); await expect(page.getByRole('article', { name: 'OBSERVATION_REGION' })).toContainText('user override');
    await page.getByRole('button', { name: 'Run offline environment exercise' }).click(); await expect(page.getByText('Cleanup: simulated', { exact: false })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0)); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.screenshot({ path: `artifacts/lab16/provenance-${width}.png`, fullPage: true });
  }
} finally { await browser.close(); }
