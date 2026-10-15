import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { lab29RequestSchema } from '../shared/lab29-images-files.js';
import { buildInlineMessage, Lab29Error, mountFor, readLab29Fixture, runLab29 } from '../server/lib/lab29-files.js';
import { createLab29Router } from '../server/concepts/29-images-files.js';

const request = { mode: 'scripted' as const, name: 'aurora-finch.png' as const, question: 'Describe the fictional fixture.' };
test('authored PNG, PDF and text fixtures have checked signatures and distinct hashes', async () => {
  const files = await Promise.all(['aurora-finch.png', 'field-note.pdf', 'observation.txt'].map(name => readLab29Fixture(name as typeof request.name)));
  assert.equal(new Set(files.map(file => file.sha256)).size, 3);
  assert.deepEqual(files.map(file => file.mime), ['image/png', 'application/pdf', 'text/plain']);
  assert.equal(buildInlineMessage('aurora-finch.png', 'Look', files[0]!.bytes).content[1]?.type, 'image');
  assert.equal(buildInlineMessage('field-note.pdf', 'Read', files[1]!.bytes).content[1]?.type, 'document');
  assert.equal(mountFor('observation.txt', 'file_fixture').mount_path, '/lab29/observation.txt');
});
test('inline, file resource and downloaded output keep evidence and usage separate', async () => {
  const inline = await runLab29('inline', request); const mounted = await runLab29('upload', request);
  assert.equal(inline.sha256, mounted.sha256); assert.equal(inline.uploadedFileId, null);
  assert.equal(mounted.mountPath, '/mnt/session/uploads/lab29/aurora-finch.png');
  assert.equal(mounted.providerCalls, 0); assert.equal(mounted.usage, null);
  const disk = await runLab29('disk', { ...request, name: 'observation.txt' });
  assert.match(disk.downloadedOutput ?? '', /output artifact/); assert.notEqual(disk.downloadedOutput, disk.agentText);
  assert.equal(JSON.stringify(inline.sentBlocks).includes('iVBOR'), false);
});
test('malformed and oversized payloads, unknown fields and live mode fail closed', async () => {
  await assert.rejects(runLab29('inline', { ...request, data: '%%%' }), Lab29Error);
  await assert.rejects(runLab29('inline', { ...request, name: 'observation.txt', data: 'QUFB'.repeat(3000) }),
    (error: unknown) => error instanceof Lab29Error && error.statusCode === 413);
  await assert.rejects(runLab29('upload', { ...request, mode: 'live' }), Lab29Error);
  await assert.rejects(runLab29('upload', { ...request, data: 'AAAA' }), Lab29Error);
  assert.equal(lab29RequestSchema.safeParse({ ...request, path: '../secret' }).success, false);
});
test('HTTP inventory is host-only, body limit is route-specific and names are allowlisted', async () => {
  const app = express(), instance = createLab29Router(); app.use('/api/c29', instance.router);
  const server = app.listen(0, '127.0.0.1'); after(() => { void instance.close(); server.close(); });
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port');
  const base = `http://127.0.0.1:${address.port}/api/c29`, headers = { 'Content-Type': 'application/json', 'X-Lab-Owner': 'alice' };
  const inventory = await fetch(`${base}/files`); assert.equal(inventory.status, 200);
  assert.equal((await inventory.json() as { providerCalls: number }).providerCalls, 0);
  assert.equal((await fetch(`${base}/file/aurora-finch.png`)).status, 200);
  assert.equal((await fetch(`${base}/file/..%2Fsecret`)).status, 404);
  const payload = await fetch(`${base}/inline`, { method: 'POST', headers, body: JSON.stringify(request) });
  assert.equal(payload.status, 200);
  const invalid = await fetch(`${base}/upload`, { method: 'POST', headers, body: JSON.stringify({ ...request, data: 'A'.repeat(10000) }) });
  assert.equal(invalid.status, 413); assert.match((await invalid.json() as { error: { message: string } }).error.message, /too large/i);
});
