import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

mkdirSync('artifacts/lab23', { recursive: true });
let web; let api; let browser;
try {
  if (!process.env.LESSON_UI_URL) {
    process.env.LEARNING_API_PORT = '3086';
    web = await createServer({ server: { port: 5184, strictPort: true } }); await web.listen();
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    for (let attempt = 0; ; attempt++) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { if ((await fetch('http://127.0.0.1:3086/api/health', { signal: AbortSignal.timeout(500) })).ok) break; } catch {}
      if (attempt >= 300) throw new Error('Backend readiness timed out.'); await delay(100);
    }
  }
  browser = await chromium.launch({ channel: 'chrome' }); const page = await browser.newPage();
  await page.route('**/api/c23/run', async route => {
    if (route.request().postDataJSON().mode !== 'scripted') throw new Error('Offline demonstration only.');
    await route.continue();
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5184'}/?lesson=23`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await page.getByRole('checkbox', { name: 'Include skill snapshot' }).check();
    await page.getByRole('button', { name: 'Run offline bundle' }).click();
    await expect(page.getByLabel('Bundle run result')).toContainText('Aurora Finch: 3 at north marsh');
    await expect(page.getByLabel('Capability inventory')).toContainText('Worker tools: 0');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/lab23/bundle-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Clear comparisons' }).click();
  }
} finally {
  await browser?.close();
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
