import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditInfographicAssets } from '../scripts/audit-infographic-assets.js';
import { lessonInfographics, allLessonInfographics, infographicSegments, infographicText } from '../shared/learning-infographics.js';
import { alignNarrationSegments, narrationCueAt } from '../shared/learning-narration.js';
test('published PNGs and MP3s match the authored text, sources, image regions and timings', async () => {
  const result = await auditInfographicAssets();
  assert.equal(result.images, lessonInfographics.length); assert.equal(result.recordings, lessonInfographics.length); assert.equal(result.regions, lessonInfographics.length * 6); assert.equal(result.providerRequests, 0);
});

test('full-course authoring plan has two distinct six-region tours per implemented lesson', () => {
  assert.equal(allLessonInfographics.length, 150);
  assert.equal(new Set(allLessonInfographics.map(item => `${item.lessonId}:${item.kind}`)).size, 150);
  for (let lessonId = 1; lessonId <= 75; lessonId++) {
    const pair = allLessonInfographics.filter(item => item.lessonId === lessonId);
    assert.deepEqual(pair.map(item => item.kind), ['concepts', 'lab']);
    assert.notEqual(infographicText(pair[0]!), infographicText(pair[1]!));
    for (const visual of pair) {
      assert.equal(visual.regions.length, 6);
      assert.ok(infographicText(visual).length <= 2000);
    }
  }
});
test('visual region alignment follows provider timestamps and advances over silence without a whole-image fallback', () => {
  for (const visual of lessonInfographics) {
    const segments = infographicSegments(visual), words = segments.flatMap(segment => segment.text.split(/\s+/));
    const timeline = alignNarrationSegments(visual.lessonId, visual.kind, segments, { wordAlignment: {
      words, wordStartTimeSeconds: words.map((_, i) => i * .1), wordEndTimeSeconds: words.map((_, i) => i * .1 + .07),
    } });
    assert.equal(timeline.source, 'inworld-word'); assert.deepEqual(timeline.cues.map(cue => cue.id), visual.regions.map(region => region.id));
    for (let index = 1; index < 6; index++) assert.equal(narrationCueAt(timeline, timeline.cues[index - 1]!.end), visual.regions[index]!.id);
    assert.equal(narrationCueAt(timeline, 599), visual.regions[5]!.id);
    assert.equal(alignNarrationSegments(visual.lessonId, visual.kind, segments, {}).source, 'section');
  }
});
