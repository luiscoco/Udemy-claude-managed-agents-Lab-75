import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

mkdirSync('artifacts/lab35', { recursive: true });
let web; let api; let browser;
const webPort = Number(process.env.LEARNING_BROWSER_WEB_PORT ?? 5204);
const apiPort = Number(process.env.LEARNING_BROWSER_API_PORT ?? 3106);
try {
  if (!process.env.LESSON_UI_URL) {
    process.env.LEARNING_API_PORT = String(apiPort);
    web = await createServer({ server: { port: webPort, strictPort: true } }); await web.listen();
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    for (let attempt = 0; ; attempt++) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { if ((await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(500) })).ok) break; } catch {}
      if (attempt >= 300) throw new Error('Backend readiness timed out.'); await delay(100);
    }
  }
  browser = await chromium.launch({ channel: 'chrome' }); const page = await browser.newPage();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.LESSON_UI_URL ?? `http://127.0.0.1:${webPort}`}/?lesson=35`);
    await page.getByRole('tab', { name: 'Run the exercise' }).click();
    await expect(page.getByRole('heading', { name: 'Event mirrors and conversation indexes', level: 2 })).toBeVisible();
    await page.getByRole('button', { name: 'Start mirror' }).click();
    await expect(page.getByRole('region', { name: 'Canonical mirror events' })).toContainText('sevt_');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/lab35/mirror-${width}.png`, fullPage: true });
  }
} finally {
  await browser?.close();
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
