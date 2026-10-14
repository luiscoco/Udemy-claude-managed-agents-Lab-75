import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('artifacts/lab14', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.route('**/api/c14/run', async route => { if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.'); await route.continue(); });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5174'}/?lesson=14`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click(); await page.getByRole('button', { name: 'Run offline model experiment' }).click();
    const evidence = page.getByLabel('Model experiment evidence', { exact: true }); await expect(evidence).toContainText('Attempt 1: completed'); await expect(evidence).toContainText('configuration matches: true');
    await page.evaluate(() => window.scrollTo(0, 0)); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.screenshot({ path: `artifacts/lab14/normal-${width}.png`, fullPage: true }); await page.getByRole('button', { name: 'Close and reconcile experiment' }).click();
  }
} finally { await browser.close(); }
