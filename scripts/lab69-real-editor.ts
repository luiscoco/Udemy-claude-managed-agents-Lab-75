import { _electron, expect } from '@playwright/test';
import express from 'express';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createLab69Router } from '../server/concepts/69-embedding-sdk.js';

const root = resolve('artifacts/lab69', `real-editor-${crypto.randomUUID()}`), workspace = join(root, 'workspace');
await mkdir(join(root, 'profile', 'User'), { recursive: true }); await mkdir(workspace, { recursive: true });
const file = join(workspace, 'observation.md'); await writeFile(file, '# Observation\n\nThree fictional Aurora Finches observed offline.\n');
const feature = createLab69Router(), api = express(); api.use('/api/c69', feature.router);
const server = api.listen(0, '127.0.0.1'); await new Promise<void>(done => server.once('listening', done));
const address = server.address(); if (!address || typeof address === 'string') throw new Error('No local backend port.');
await writeFile(join(root, 'profile', 'User', 'settings.json'), JSON.stringify({
  'managedLabs69.backendOrigin': `http://127.0.0.1:${address.port}`, 'workbench.startupEditor': 'none',
  'security.workspace.trust.enabled': false, 'telemetry.telemetryLevel': 'off', 'update.mode': 'none',
  'extensions.autoCheckUpdates': false, 'extensions.autoUpdate': false, 'window.restoreWindows': 'none',
}));
const env: Record<string, string> = {};
for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA']) if (process.env[key]) env[key] = process.env[key]!;
let editor: Awaited<ReturnType<typeof _electron.launch>> | undefined;
try {
  editor = await _electron.launch({ executablePath: process.env.LAB69_VSCODE_EXECUTABLE ?? join(process.env.LOCALAPPDATA!, 'Programs', 'Microsoft VS Code', 'Code.exe'),
    args: [`--user-data-dir=${join(root, 'profile')}`, `--extensions-dir=${join(root, 'extensions')}`,
      `--extensionDevelopmentPath=${resolve('extensions/lab69')}`, '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', workspace, file], env, timeout: 60000 });
  const page = await editor.firstWindow(); await page.waitForLoadState('domcontentloaded');
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 45000 });
  await page.keyboard.press('Control+Shift+P');
  const palette = page.locator('.quick-input-widget input'); await palette.waitFor({ state: 'visible', timeout: 15000 });
  await palette.fill('>Managed Labs 69: Review Active Document');
  await page.getByRole('option', { name: /Managed Labs 69: Review Active Document/ }).first().waitFor({ state: 'visible', timeout: 15000 });
  await palette.press('Enter'); console.log('Real editor command invoked.');
  let webview: ReturnType<typeof page.mainFrame> | undefined;
  const until = Date.now() + 45000;
  while (Date.now() < until) {
    for (const frame of page.frames()) if (await frame.getByRole('button', { name: 'Start guided', exact: true }).count()) webview = frame;
    if (webview) break; await delay(250);
  }
  if (!webview) { await page.screenshot({ path: join(root, 'failure.png') }); throw new Error(`Review webview unavailable: ${(await page.locator('body').innerText()).slice(-2500)}`); }
  await webview.getByRole('button', { name: 'Start guided', exact: true }).click();
  await expect(webview.locator('#evidence')).toContainText('patch:', { timeout: 15000 });
  await webview.getByRole('button', { name: 'Apply reviewed patch', exact: true }).click();
  await expect(webview.locator('#evidence')).toContainText('Reviewed patch applied to the editor buffer.', { timeout: 10000 });
  await page.screenshot({ path: join(root, 'applied.png') });
  await webview.getByRole('button', { name: 'Start guided', exact: true }).click();
  await expect(webview.locator('#evidence')).toContainText('patch:', { timeout: 15000 });
  await page.locator('.monaco-editor .view-lines').first().click();
  await page.keyboard.press('Control+End'); await page.keyboard.type('\nConcurrent local edit.');
  await webview.getByRole('button', { name: 'Apply reviewed patch', exact: true }).click();
  await expect(webview.locator('#evidence')).toContainText('conflict', { timeout: 10000 });
  await page.screenshot({ path: join(root, 'conflict.png') });
  await writeFile(join(root, 'result.json'), JSON.stringify({ source: 'real-vscode-electron', guidedPatchApplied: true, concurrentEditRejected: true, providerCalls: 0 }, null, 2));
  console.log(JSON.stringify({ passed: true, source: 'real-vscode-electron', artifact: root, providerCalls: 0 }));
} finally { await editor?.close(); await feature.close(); server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
