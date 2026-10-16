import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';
import express from 'express';
import { createLab69Router, Lab69Backend } from '../server/concepts/69-embedding-sdk.js';

test('bundled extension in a mocked VS Code host validates webview script, apply guard and disposal cleanup', async () => {
  const root = resolve(`artifacts/lab69/extension-${randomUUID()}`); await mkdir(root, { recursive: true });
  const file = resolve(root, 'observation.md'); let text = 'Three fictional Aurora Finches.'; let version = 1; await writeFile(file, text);
  const store = new Lab69Backend(); const feature = createLab69Router(store); const app = express(); app.use('/api/c69', feature.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(done => server.once('listening', done));
  try { const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
    const origin = `http://127.0.0.1:${address.port}`;
    let command: (() => void) | undefined; let receiver: ((input: unknown) => Promise<void>) | undefined;
    let dispose: (() => void) | undefined; let owner = ''; const messages: { type: string; text: string; correlationId: string }[] = [];
    const panel = { webview: { html: '', postMessage: async (message: typeof messages[number]) => { messages.push(message); return true; },
      onDidReceiveMessage: (callback: typeof receiver) => { receiver = callback; return { dispose() {} }; } },
      onDidDispose: (callback: () => void) => { dispose = callback; }, dispose: () => dispose?.() };
    const editor = { document: { uri: { scheme: 'file', fsPath: file }, get version() { return version; },
      getText: () => text, positionAt: (offset: number) => offset },
      edit: async (callback: (builder: { replace: (_range: unknown, replacement: string) => void }) => void) => {
        callback({ replace: (_range, replacement) => { text = replacement; version++; } }); return true;
      } };
    const vscode = { commands: { registerCommand: (_name: string, callback: () => void) => { command = callback; return { dispose() {} }; } },
      workspace: { isTrusted: true, getWorkspaceFolder: () => ({ uri: { fsPath: root } }),
        getConfiguration: () => ({ inspect: () => ({ globalValue: origin }) }) },
      window: { activeTextEditor: editor, showErrorMessage: async () => {}, createWebviewPanel: () => panel },
      ViewColumn: { Beside: 2 }, Range: class { constructor(_start: unknown, _end: unknown) {} } };
    const output = await build({ entryPoints: ['extensions/lab69/src/extension.ts'], bundle: true, platform: 'node',
      format: 'cjs', target: 'node22', external: ['vscode'], write: false });
    const module = { exports: {} as { activate: (context: unknown) => void; deactivate: () => Promise<void> } };
    const nodeRequire = createRequire(import.meta.url);
    runInNewContext(output.outputFiles[0]!.text, { module, exports: module.exports,
      require: (name: string) => name === 'vscode' ? vscode : nodeRequire(name), console, process, Buffer, URL,
      AbortController, AbortSignal, setTimeout, clearTimeout,
      fetch: (input: string | URL | Request, init?: RequestInit) => { owner = (init?.headers as Record<string, string>)?.['X-Lab-Owner'] ?? owner;
        return fetch(input, init); } });
    module.exports.activate({ subscriptions: [] }); command!();
    const script = /<script nonce="[^"]+">([\s\S]+)<\/script>/.exec(panel.webview.html)?.[1]; assert.ok(script);
    assert.doesNotThrow(() => new Function(script)); assert.match(panel.webview.html, /default-src 'none'/);
    const first = randomUUID(); await receiver!({ type: 'start', correlationId: first, mode: 'offline' });
    assert.ok(messages.some(message => message.type === 'patch' && message.correlationId === first));
    assert.equal(text, 'Three fictional Aurora Finches.');
    await receiver!({ type: 'apply', correlationId: first }); assert.match(text, /Reviewed observation/);
    const second = randomUUID(); await receiver!({ type: 'start', correlationId: second, mode: 'offline' });
    text += '\nConcurrent local edit.'; version++;
    await receiver!({ type: 'apply', correlationId: second });
    assert.ok(messages.some(message => message.type === 'error' && message.correlationId === second && /conflict/.test(message.text)));
    const third = randomUUID(); const pending = receiver!({ type: 'start', correlationId: third, mode: 'offline' });
    await delay(40); dispose!(); await pending; await module.exports.deactivate();
    assert.equal(store.correlation(owner, third).state, 'cancelled');
    assert.equal(panel.webview.html.includes(owner), false, 'owner capability stays in the extension host');
  } finally { await feature.close(); await new Promise<void>(done => server.close(() => done())); }
});
