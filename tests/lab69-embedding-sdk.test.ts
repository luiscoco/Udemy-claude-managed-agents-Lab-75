import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { Lab69Backend } from '../server/concepts/69-embedding-sdk.js';
import { allowedDocument, checkedPatch, documentSnapshot, Lab69HostReview } from '../server/lib/lab69-host.js';

test('actual file folder and changed-content guards reject before write', async () => {
  const root = resolve(`artifacts/lab69/guard-${randomUUID()}`); await mkdir(root, { recursive: true });
  const file = resolve(root, 'note.md'); await writeFile(file, 'Three fictional finches.');
  assert.equal(await allowedDocument(root, file), file);
  const outside = resolve('artifacts/lab69/outside.txt'); await writeFile(outside, 'Outside allowed folder.');
  await assert.rejects(allowedDocument(root, outside), /outside/);
  const privateFile = resolve(root, '.env'); await writeFile(privateFile, 'fictional-only');
  await assert.rejects(allowedDocument(root, privateFile), /outside/);
  const documentId = randomUUID(), correlationId = randomUUID(); const base = documentSnapshot(documentId, 1, await readFile(file, 'utf8'));
  const patch = { correlationId, documentId, baseVersion: base.version, baseHash: base.hash, replacement: 'Reviewed fictional finches.' };
  assert.throws(() => checkedPatch(base, base, patch, correlationId, false), /Trusted/);
  await writeFile(file, 'Local edit.'); const changed = documentSnapshot(documentId, 2, await readFile(file, 'utf8'));
  assert.throws(() => checkedPatch(base, changed, patch, correlationId, true), /conflict/);
  assert.equal(await readFile(file, 'utf8'), 'Local edit.');
  await writeFile(file, base.text); const valid = checkedPatch(base, documentSnapshot(documentId, 1, await readFile(file, 'utf8')), patch, correlationId, true);
  await writeFile(file, valid.replacement); assert.equal(await readFile(file, 'utf8'), patch.replacement);
});
test('host ignores stale messages, consumes one patch, and disposes active work', () => {
  const host = new Lab69HostReview(); const correlationId = randomUUID(), stale = randomUUID();
  const base = documentSnapshot(randomUUID(), 1, 'Fictional note.');
  const patch = { correlationId, documentId: base.documentId, baseVersion: 1, baseHash: base.hash, replacement: 'Reviewed note.' };
  host.begin(correlationId); assert.throws(() => host.begin(stale), /active/); assert.equal(host.accepts(stale), false);
  assert.equal(host.final(stale, patch), false); assert.equal(host.final(correlationId, patch), true);
  host.cancel(stale); assert.equal(host.apply(base, base, correlationId, true).replacement, patch.replacement);
  assert.throws(() => host.apply(base, base, correlationId, true), /No reviewed/);
  host.begin(stale); host.dispose(); assert.equal(host.accepts(stale), false); assert.equal(host.final(stale, patch), false);
  assert.throws(() => host.begin(randomUUID()), /disposed/);
});
test('backend proposes only, deduplicates correlation, applies once and refuses conflict', async () => {
  const store = new Lab69Backend(); try { const owner = 'owner-a'; const context = store.document(owner); const correlationId = randomUUID();
    const input = { correlationId, context, mode: 'offline', scenario: 'normal' };
    const first = store.start(owner, input); assert.equal(store.start(owner, input).id, first.id);
    assert.throws(() => store.snapshot('other-owner', first.id), /not found/);
    const final = await store.settle(owner, first.id); assert.equal(final.state, 'completed');
    assert.equal(store.document(owner).version, 1, 'remote result does not edit local document');
    const applied = store.apply(owner, first.id); assert.equal(applied.version, 2); assert.match(applied.text, /Reviewed observation/);
    assert.throws(() => store.apply(owner, first.id), /No final patch/);
    const second = store.start(owner, { correlationId: randomUUID(), context: applied, mode: 'offline', scenario: 'normal' });
    await store.settle(owner, second.id); store.change(owner); assert.throws(() => store.apply(owner, second.id), /conflict/);
    assert.throws(() => store.start(owner, { correlationId: randomUUID(), context: { ...applied, text: 'Tampered.' }, mode: 'offline', scenario: 'normal' }), /hash mismatch/);
  } finally { await store.close(); }
});
test('transport failure and cancellation report outcomes and independent cleanup', async () => {
  const store = new Lab69Backend(); try { const context = store.document('owner-b');
    const failed = store.start('owner-b', { correlationId: randomUUID(), context, mode: 'offline', scenario: 'transport-failure' });
    assert.equal((await store.settle('owner-b', failed.id)).state, 'error');
    const correlationId = randomUUID(); const hanging = store.start('owner-b', { correlationId, context, mode: 'offline', scenario: 'hang' });
    assert.equal(store.correlation('owner-b', correlationId).id, hanging.id); store.cancel('owner-b', hanging.id);
    const stopped = await store.settle('owner-b', hanging.id); assert.equal(stopped.state, 'cancelled'); assert.equal(stopped.cleanup, 'local-fixture-closed');
  } finally { await store.close(); }
});
