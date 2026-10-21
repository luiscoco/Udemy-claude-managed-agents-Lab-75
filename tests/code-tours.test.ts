import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { codeCatalogSchema, codeManifestSchema, codeTourText, normalizedCode } from '../shared/code-tours.js';

test('every lab has exactly one main TypeScript concept tour with valid source anchors', async () => {
  const catalog = codeCatalogSchema.parse(JSON.parse(await readFile('public/code-tours/catalog.json', 'utf8')));
  assert.equal(catalog.tours.length, 75);
  assert.equal(new Set(catalog.tours.map(tour => tour.lessonId)).size, 75);
  for (let id = 1; id <= 75; id++) {
    const tour = catalog.tours.find(item => item.lessonId === id)!;
    assert.match(tour.path, new RegExp(`^server/concepts/${String(id).padStart(2, '0')}-`));
    const code = normalizedCode(await readFile(tour.path, 'utf8'));
    assert.equal(createHash('sha256').update(code).digest('hex'), tour.sourceSha256);
    assert.equal(normalizedCode(code.replaceAll('\n', '\r\n')), code);
    assert.ok(codeTourText(tour).length <= 2000);
    for (const section of tour.sections) {
      assert.ok(section.endLine <= code.split('\n').length);
      assert.ok(code.split('\n').slice(section.startLine - 1, section.endLine).join('\n').trim());
    }
  }
});

test('code media contracts reject unrelated files, invalid ranges and duplicate IDs', async () => {
  const raw = JSON.parse(await readFile('public/code-tours/catalog.json', 'utf8'));
  const bad = structuredClone(raw); bad.tours[0].path = '.env';
  assert.equal(codeCatalogSchema.safeParse(bad).success, false);
  bad.tours[0] = structuredClone(raw.tours[0]); bad.tours[0].sections[0].endLine = 0;
  assert.equal(codeCatalogSchema.safeParse(bad).success, false);
  bad.tours[0] = structuredClone(raw.tours[0]); bad.tours[0].sections[1].id = bad.tours[0].sections[0].id;
  assert.equal(codeCatalogSchema.safeParse(bad).success, false);
  assert.equal(codeManifestSchema.safeParse({ version: 1, provider: 'inworld', voiceId: 'Yash', modelId: 'test', recordings: { 1: { file: 'https://example.com/audio.mp3' } } }).success, false);
});
