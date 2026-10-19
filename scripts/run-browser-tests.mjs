import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

// Own Node children directly; Windows shell wrappers otherwise leave servers running.
let web; let api;
const webPort = Number(process.env.LEARNING_BROWSER_WEB_PORT ?? 5184);
const apiPort = Number(process.env.LEARNING_BROWSER_API_PORT ?? 3086);
try {
  if (process.env.LEARNING_BROWSER_EXTERNAL_SERVERS !== '1') {
    process.env.LEARNING_API_PORT = String(apiPort);
    process.env.LESSON_UI_URL = `http://127.0.0.1:${webPort}`;
    web = await createServer({ server: { port: webPort, strictPort: true } });
    await web.listen();
    api = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit', env: process.env });
    for (let attempt = 0; ; attempt++) {
      if (api.exitCode !== null) throw new Error('Backend exited before readiness.');
      try { const response = await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(500) }); if (response.ok) break; } catch {}
      if (attempt >= 300) throw new Error('Backend readiness timed out.');
      await delay(100);
    }
    // An HTTP-ready Vite server is not yet a rendered React application.
    // Load the actual lesson registry before measuring individual scenarios.
    // This performs no exercise POST or provider action.
    const warmup = await chromium.launch({ channel: 'chrome', headless: true });
    try {
      const page = await warmup.newPage();
      await page.goto(`${process.env.LESSON_UI_URL}/?lesson=1`, { timeout: 120000, waitUntil: 'domcontentloaded' });
      await page.locator('main h1').waitFor({ state: 'visible', timeout: 120000 });
      console.log('Lesson UI rendered; starting browser scenarios.');
    } finally {
      await warmup.close();
    }
  }
  const runner = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit', env: { ...process.env, LEARNING_BROWSER_EXTERNAL_SERVERS: '1' },
  });
  const [code] = await once(runner, 'exit'); process.exitCode = code ?? 1;
} finally {
  if (api && api.exitCode === null) { const done = once(api, 'exit'); api.kill(); await done; }
  await web?.close();
}
