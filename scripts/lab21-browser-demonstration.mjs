import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

mkdirSync('artifacts/lab21', { recursive: true });
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
  await page.route('**/api/c21/session', async route => {
    if (route.request().postDataJSON().mode === 'live') throw new Error('Offline demonstration only.');
    await route.continue();
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? 'http://127.0.0.1:5184'}/?lesson=21`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await page.getByRole('button', { name: 'Prepare offline session' }).click();
    await page.getByRole('button', { name: 'Run host command' }).click();
    await expect(page.getByLabel('Command result')).toContainText('Format a fictional observation note.');
    await page.getByRole('button', { name: 'Inspect local history' }).click();
    await expect(page.getByLabel('Command result')).toContainText('This action provider sends: 0');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/lab21/commands-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Close command session' }).click();
  }
} finally {
  await browser?.close();
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
