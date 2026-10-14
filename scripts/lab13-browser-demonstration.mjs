import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('artifacts/lab13', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.route('**/api/c13/query', async route => { if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.'); await route.continue(); });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5174'}/?lesson=13`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await page.getByRole('button', { name: 'Run offline MCP experiment' }).click();
    const evidence = page.getByLabel('MCP evidence', { exact: true });
    await expect(evidence).toContainText('Cleanup: retained'); await expect(evidence).toContainText('Host result submission acknowledged: true');
    await page.evaluate(() => window.scrollTo(0, 0));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.screenshot({ path: `artifacts/lab13/working-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Close MCP session' }).click(); await expect(evidence).toContainText('State: closed');
  }
} finally { await browser.close(); }
