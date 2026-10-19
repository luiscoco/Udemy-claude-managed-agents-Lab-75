import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditLearningNarration } from '../scripts/audit-learning-narration.js';

test('all 75 lessons ship seven matching MP3s and complete Inworld word timings without credentials', async () => {
  const result = await auditLearningNarration();
  assert.equal(result.clips, 525);
  assert.equal(result.files, 1051);
  assert.equal(result.providerRequests, 0);
});
