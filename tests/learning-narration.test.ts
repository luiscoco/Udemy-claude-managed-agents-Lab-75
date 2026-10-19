import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { learningGuide } from '../shared/learning-guide.js';
import { alignNarration, narrationCueAt, narrationSegments, narrationText, narrationTimelineSchema } from '../shared/learning-narration.js';
import { readNarrationRecording, writeNarrationRecording } from '../server/lib/learning-narration-cache.js';

function aligned(text: string) {
  const words = text.split(/\s+/);
  return { wordAlignment: { words, wordStartTimeSeconds: words.map((_, index) => index * 0.1), wordEndTimeSeconds: words.map((_, index) => index * 0.1 + 0.08) } };
}
test('all 525 explanations have matching authored speech and complete provider-derived cues', () => {
  for (let lesson = 1; lesson <= 75; lesson++) for (const step of learningGuide(lesson)) {
    const segments = narrationSegments(step), text = narrationText(step);
    assert.equal(text, `${step.title}. ${step.text} Your turn. ${step.action}`);
    assert.ok(text.length <= 2000); assert.ok(segments.length >= 3);
    const timeline = alignNarration(lesson, step, aligned(text));
    assert.equal(timeline.source, 'inworld-word', `Lab ${lesson}: ${step.id}`);
    assert.deepEqual(timeline.cues.map(cue => cue.id), segments.map(segment => segment.id));
    const first = timeline.cues[0]!, last = timeline.cues.at(-1)!;
    assert.equal(narrationCueAt(timeline, last.start + 0.001), last.id);
    assert.equal(narrationCueAt(timeline, first.start + 0.001), first.id);
    assert.equal(narrationCueAt(timeline, last.end), last.id);
    assert.equal(narrationCueAt(timeline, last.end + 1), last.id);
    for (let index = 1; index < timeline.cues.length; index++) {
      const previous = timeline.cues[index - 1]!, next = timeline.cues[index]!;
      assert.equal(narrationCueAt(timeline, previous.end), next.id);
      assert.equal(narrationCueAt(timeline, (previous.end + next.start) / 2), next.id);
    }
  }
});
test('missing, mismatched and invalid alignment never manufacture sentence timing', () => {
  const step = learningGuide(1)[0]!, good = aligned(narrationText(step));
  const bad = [undefined, {}, { wordAlignment: { ...good.wordAlignment, words: ['different'] } },
    { wordAlignment: { ...good.wordAlignment, wordEndTimeSeconds: [NaN] } },
    { wordAlignment: { ...good.wordAlignment, wordStartTimeSeconds: good.wordAlignment.words.map(() => 100) } }];
  for (const input of bad) {
    const timeline = alignNarration(1, step, input);
    assert.equal(timeline.source, 'section'); assert.deepEqual(timeline.cues, []);
  }
  const timeline = alignNarration(1, step, good);
  assert.equal(narrationCueAt(timeline, -1), undefined); assert.equal(narrationCueAt(timeline, Infinity), undefined);
  assert.equal(narrationTimelineSchema.safeParse({ ...timeline, cues: [timeline.cues[0], timeline.cues[0]] }).success, false);
});
test('recording cache verifies audio hashes, rejects tampering and rejects path escape', async () => {
  const root = await mkdtemp(join(tmpdir(), 'learning-narration-'));
  try {
    const key = 'a'.repeat(64), step = learningGuide(1)[0]!;
    const recording = { audio: Buffer.from('ID3-authored-cache-test'), timeline: alignNarration(1, step, aligned(narrationText(step))) };
    await writeNarrationRecording(root, key, recording);
    assert.deepEqual(await readNarrationRecording(root, key), recording);
    await writeFile(join(root, `${key}.mp3`), 'ID3-corrupted-cache');
    assert.equal(await readNarrationRecording(root, key), undefined);
    assert.equal(await readNarrationRecording(root, 'b'.repeat(64)), undefined);
    await assert.rejects(readNarrationRecording(root, '../outside'), /Invalid recording key/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
