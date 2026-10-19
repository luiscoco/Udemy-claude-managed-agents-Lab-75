import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Router, json } from 'express';
import { chromium, type BrowserContext } from 'playwright';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createConnection } from '@playwright/mcp';
import { lab64RunSchema, type Lab64Scenario } from '../../shared/lab64-browser-playwright-mcp.js';
import { apiError } from '../lib/errors.js';

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Aurora Finch Field Kit</title><style>
body{font:18px system-ui;background:#f4f7f2;color:#183c31;padding:36px;max-width:780px;margin:auto}article{background:white;padding:28px;border-radius:16px}label{display:block;margin:16px 0}input{font:inherit;padding:8px}button{font:inherit;padding:10px;background:#186d57;color:white;border:0;border-radius:6px}
</style></head><body><article><h1>Aurora Finch Field Kit</h1><p id="price">Price: 29 credits</p>
<form id="request"><label>Observer name <input name="observer" aria-label="Observer name" required></label>
<button type="submit">Save request</button></form><output id="confirmation" aria-live="polite"></output></article>
<script>document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('output').textContent='Request saved for '+document.querySelector('input').value})</script></body></html>`;
type Proof = { owner: string; png: Buffer; expires: number };
const allowedTools = new Set(['browser_navigate', 'browser_snapshot', 'browser_fill_form', 'browser_click']);
function contentItems(value: unknown): { type: string; text?: string; data?: string; mimeType?: string }[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object' && typeof item.type === 'string') : [];
}

// Chrome can reject a capture transiently even after fonts and DOM are ready.
// Retry this read once; never replay navigation, form submission or other errors.
export async function captureLab64Screenshot<T extends Record<string, unknown>>(capture: () => Promise<T>, recover: () => Promise<void>): Promise<T> {
  const first = await capture();
  const text = contentItems(first.content).filter(item => item.type === 'text').map(item => item.text ?? '').join('\n');
  if (!first.isError || !text.includes('Protocol error (Page.captureScreenshot): Unable to capture screenshot')) return first;
  await recover();
  return capture();
}

export function createLab64Runner() {
  const proofs = new Map<string, Proof>();
  let active = 0;
  async function run(scenario: Lab64Scenario, owner: string) {
    if (active >= 2) throw new Error('Local browser capacity reached.');
    active++;
    let fixture: HttpServer | undefined;
    let context: BrowserContext | undefined;
    let client: Client | undefined;
    let mcp: Awaited<ReturnType<typeof createConnection>> | undefined;
    let calls = 0;
    const outputRoot = resolve('artifacts/lab64/mcp-output');
    const outputDir = resolve(outputRoot, randomUUID());
    const events: string[] = [];
    try {
      if (scenario === 'missing-browser') return { outcome: 'browser-unavailable', source: 'local-fixture',
        verified: false, calls: 0, events: ['Browser launch deliberately skipped; no page evidence.'] };
      fixture = createServer((request, response) => {
        if (request.url !== '/' || request.method !== 'GET') { response.writeHead(404); response.end(); return; }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(html);
      });
      await new Promise<void>((resolve) => fixture!.listen(0, '127.0.0.1', resolve));
      const address = fixture.address(); if (!address || typeof address === 'string') throw new Error('Fixture port unavailable.');
      const origin = `http://127.0.0.1:${address.port}`;
      if (!outputDir.startsWith(`${outputRoot}${sep}`)) throw new Error('Invalid MCP output path.');
      await mkdir(outputDir, { recursive: true });
      context = await chromium.launchPersistentContext('', { channel: 'chrome', headless: true, acceptDownloads: false,
        serviceWorkers: 'block', viewport: { width: 860, height: 720 } });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin === origin && url.pathname === '/' && route.request().method() === 'GET') await route.continue();
        else { events.push('Blocked off-fixture request.'); await route.abort(); }
      });
      context.on('page', page => page.on('download', download => { void download.cancel(); events.push('Download cancelled.'); }));
      await context.newPage();
      // An attached host context must not set isolated:true: that option asks MCP
      // to create another context, which SimpleBrowserContextFactory disallows.
      mcp = await createConnection({ capabilities: ['core'], browser: { browserName: 'chromium', isolated: false },
        outputDir, outputMaxSize: 1000000, webmcp: false, network: { allowedOrigins: [origin] } },
        (async () => context!) as unknown as NonNullable<Parameters<typeof createConnection>[1]>);
      client = new Client({ name: 'lab64-host-bridge', version: '1.0.0' });
      const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
      await mcp.connect(serverTransport); await client.connect(clientTransport);
      async function call(name: string, args: Record<string, unknown>) {
        if (!allowedTools.has(name) || calls >= 6) throw new Error('Host browser tool limit exceeded.');
        if (name === 'browser_navigate' && args.url !== `${origin}/`) throw new Error('Navigation outside fixture blocked before MCP.');
        calls++;
        const result = await client!.callTool({ name, arguments: args }, undefined, { timeout: 20000 });
        if (result.isError) throw new Error(`Local MCP ${name} failed: ${JSON.stringify(result.content).slice(0, 500)}`);
        for (const current of context!.pages()) {
          if (current.url() !== 'about:blank' && current.url() !== `${origin}/`)
            throw new Error('Browser escaped fixture URL.');
        }
        events.push(`${name}: completed`); return result;
      }
      await call('browser_navigate', { url: `${origin}/` });
      const initial = await call('browser_snapshot', {});
      const initialText = contentItems(initial.content).filter(item => item.type === 'text').map(item => item.text).join('\n');
      const page = context.pages().find(current => current.url() === `${origin}/`);
      if (!page) throw new Error('Fixture page missing after MCP navigation.');
      const product = await page.locator('h1').textContent();
      const price = await page.locator('#price').textContent();
      if (scenario === 'blocked-navigation') {
        let blocked = false;
        try { await call('browser_navigate', { url: 'https://example.com/' }); } catch { blocked = true; }
        return { outcome: blocked ? 'blocked' : 'error', source: 'playwright-mcp', verified: blocked && page.url() === `${origin}/`,
          calls, events, product, price, proofId: undefined };
      }
      let confirmation: string | null = null;
      if (scenario === 'fill-form') {
        await call('browser_fill_form', { fields: [{ name: 'Observer name', type: 'textbox', target: 'input[name="observer"]', value: 'Ada Finch' }] });
        await call('browser_click', { target: 'button[type="submit"]' });
        const after = await call('browser_snapshot', {});
        const afterText = contentItems(after.content).filter(item => item.type === 'text').map(item => item.text).join('\n');
        confirmation = await page.locator('#confirmation').textContent();
        if (!afterText.includes('Request saved for Ada Finch')) confirmation = null;
      }
      const verified = initialText.includes('Aurora Finch Field Kit') && initialText.includes('Price: 29 credits') &&
        product === 'Aurora Finch Field Kit' && price === 'Price: 29 credits' &&
        (scenario !== 'fill-form' || confirmation === 'Request saved for Ada Finch');
      if (calls >= 6) throw new Error('Host browser tool limit exceeded.');
      const screenshot = await captureLab64Screenshot(async () => {
        // Six normal tool calls plus at most one read-only capture recovery.
        if (calls >= 7) throw new Error('Host browser tool limit exceeded.');
        calls++;
        return client!.callTool({ name: 'browser_take_screenshot', arguments: { scale: 'css', type: 'png' } }, undefined, { timeout: 20000 });
      }, async () => {
        events.push('browser_take_screenshot: transient Chrome capture failure; retrying once');
        await page.bringToFront();
      });
      if (screenshot.isError) {
        const detail = contentItems(screenshot.content).filter(item => item.type === 'text')
          .map(item => item.text ?? '').join('\n').slice(0, 1000);
        throw new Error(`MCP screenshot failed: ${detail || 'No diagnostic text returned.'}`);
      }
      events.push('browser_take_screenshot: completed');
      const image = contentItems(screenshot.content).find(item => item.type === 'image');
      const proofId = randomUUID();
      if (verified && image?.type === 'image' && image.mimeType === 'image/png' && image.data) {
        const png = Buffer.from(image.data, 'base64');
        if (png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
          proofs.set(proofId, { owner, png, expires: Date.now() + 300000 });
      }
      while (proofs.size > 20) proofs.delete(proofs.keys().next().value!);
      return { outcome: verified && proofs.has(proofId) ? 'verified' : 'unverified', source: 'playwright-mcp',
        verified: verified && proofs.has(proofId), calls, events, product, price, confirmation,
        proofId: proofs.has(proofId) ? proofId : undefined };
    } finally {
      await client?.close().catch(() => {}); await mcp?.close().catch(() => {}); await context?.close().catch(() => {});
      if (fixture) await new Promise<void>(resolve => fixture!.close(() => resolve())); active--;
      if (outputDir.startsWith(`${outputRoot}${sep}`)) await rm(outputDir, { recursive: true, force: true }).catch(() => {});
    }
  }
  function proof(id: string, owner: string) { const item = proofs.get(id); return item?.owner === owner && item.expires > Date.now() ? item.png : undefined; }
  return { run, proof, close: async () => { proofs.clear(); } };
}

export function createLab64Router(runner = createLab64Runner()) {
  const router = Router(); router.use(json({ strict: true, limit: '1kb' }));
  router.use((request, response, next) => {
    const host = request.headers.host ?? ''; const owner = request.headers['x-lab-owner'];
    if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || request.headers.origin && request.headers.origin !== `http://${host}` ||
      typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
      response.status(403).json(apiError('INVALID_REQUEST', 'Use the local origin and experiment owner.')); return; }
    response.set('Cache-Control', 'no-store'); next();
  });
  router.get('/facts', (_request, response) => response.json({ source: 'playwright-mcp', providerCalls: 0,
    pinnedPackage: '@playwright/mcp@0.0.83', isolation: 'fresh temporary browser profile; fixture-only network route',
    note: 'A host-supplied context uses isolated:false; only the host may issue allowlisted MCP calls. Cloud Managed sessions cannot reach host localhost.' }));
  router.get('/code', (_request, response) => response.json({ files: ['shared/lab64-browser-playwright-mcp.ts',
    'server/concepts/64-browser-playwright-mcp.ts'], note: 'Actual DOM and screenshot establish proof.' }));
  router.post('/run', async (request, response) => {
    const parsed = lab64RunSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json(apiError('INVALID_REQUEST', 'Choose a supported browser scenario.')); return; }
    try { response.json(await runner.run(parsed.data.scenario, request.headers['x-lab-owner'] as string)); }
    catch (error) { response.status(503).json(apiError('INTERNAL', error instanceof Error ? error.message : 'Local browser failed.')); }
  });
  router.get('/artifacts/:id/proof.png', (request, response) => {
    const png = runner.proof(request.params.id as string, request.headers['x-lab-owner'] as string);
    if (!png) { response.status(404).json(apiError('NOT_FOUND', 'Proof unavailable.')); return; }
    response.type('png').send(png);
  });
  return { router, close: runner.close };
}
