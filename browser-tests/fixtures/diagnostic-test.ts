import { test as base } from '@playwright/test';
import { redact } from '../../src/lib/presentation';
import { writeFile } from 'node:fs/promises';

// Keep module/bootstrap failures visible even when React never renders a snapshot.
export const test = base.extend<{ pageDiagnostics: void }>({
  pageDiagnostics: [async ({ page }, use, info) => {
    const errors: string[] = [];
    const record = (text: string) => { if (errors.length < 30) errors.push(redact(text).slice(0, 1000)); };
    const path = (url: string) => { try { return new URL(url).pathname; } catch { return '(invalid URL)'; } };
    page.on('pageerror', error => record(`pageerror: ${error.message}`));
    page.on('requestfailed', request => record(`requestfailed: ${path(request.url())}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) record(`HTTP ${response.status()}: ${path(response.url())}`); });
    await use();
    if (info.status !== info.expectedStatus) {
      const report = JSON.stringify({ page: path(page.url()), readyState: await page.evaluate(() => document.readyState).catch(() => 'unavailable'), errors }, null, 2);
      console.error(`Browser bootstrap diagnostics:\n${report}`);
      await writeFile(info.outputPath('browser-bootstrap.json'), report);
      await info.attach('browser-bootstrap', { body: report, contentType: 'application/json' });
    }
  }, { auto: true }],
});
export { expect } from '@playwright/test';
