import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { selectGuide, redact } from '../src/lib/presentation';
import { LessonGuide } from '../src/components/LessonGuide';
import { testGuide } from './support/lesson';

test('guide selection isolates historical lessons, exact numeric IDs, fences and ambiguous sections', () => {
  const history = '# Course\nIntro\n## Lesson 00: Dummy\nONLY ZERO\n```ts\n# Lab 02\n```\n## Lesson 01: Other\nONLY ONE\n## Lab 10\nONLY TEN';
  assert.match(selectGuide(history, 0)!, /ONLY ZERO/);
  assert.doesNotMatch(selectGuide(history, 0)!, /ONLY ONE|ONLY TEN/);
  assert.match(selectGuide(history, 1)!, /ONLY ONE/);
  assert.doesNotMatch(selectGuide(history, 1)!, /ONLY TEN|ONLY ZERO/);
  assert.equal(selectGuide(history, 2), undefined);
  assert.equal(selectGuide('# Lab 0\na\n# Lesson 00\nb', 0), undefined);
  assert.equal(selectGuide('No lesson heading', 0), undefined);
  assert.equal(selectGuide(testGuide, 1), undefined);
  const concepts = '# Concept 00\nzero\n~~~ts\n# Lab 01\n~~~\n# Concept 01\none\n# 02: Next\ntwo';
  assert.doesNotMatch(selectGuide(concepts, 0)!, /\none|two/);
  assert.equal(selectGuide(concepts, 2), '# 02: Next\ntwo');
});

test('authored guide renders headings, lists, safe links, tables and fenced code', () => {
  const html = renderToStaticMarkup(createElement(LessonGuide, { markdown: testGuide, lessonId: 0 }));
  for (const tag of ['h2', 'h3', 'ol', 'ul', 'table', 'th', 'pre', 'code', 'a']) assert.match(html, new RegExp(`<${tag}[ >]`), tag);
  assert.match(html, /const request/);
  const unsafe = renderToStaticMarkup(createElement(LessonGuide, { markdown: '# Lab 0\n[x](javascript:alert)\n<script>bad</script>', lessonId: 0 }));
  assert.doesNotMatch(unsafe, /href="javascript|<script>/);
});

test('copy and evidence display redact credential formats', () => {
  const safe = redact('apiKey: "private-canary", password=hidden\nAuthorization: "Bearer another-secret"\nsk-ant-fakekey123');
  assert.doesNotMatch(safe, /private-canary|hidden|another-secret|fakekey123/);
  assert.match(safe, /REDACTED/);
  assert.equal(redact('const greeting = "Hello, Ada.";'), 'const greeting = "Hello, Ada.";');
});
