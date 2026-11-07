import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnswerMarkdown } from '../src/AnswerMarkdown.mjs';

test('coach answers render readable Markdown without unsafe markup', () => {
  const answer = [
    '# Testing tool results',
    '',
    'Use **two checks**:',
    '',
    '1. Confirm the expected result.',
    '2. Reject an invalid result.',
    '',
    '```python',
    'assert result == expected',
    '```',
    '',
    '<script>alert("unexpected")</script>',
    '![external image](https://example.com/tracker.png)',
  ].join('\n');
  const html = renderToStaticMarkup(React.createElement(AnswerMarkdown, { text: answer }));
  assert.match(html, /<h1>Testing tool results<\/h1>/);
  assert.match(html, /<strong>two checks<\/strong>/);
  assert.match(html, /<ol>/);
  assert.match(html, /<div class="answer-code-label">python<\/div>/);
  assert.match(html, /<pre tabindex="0"><code class="hljs">/);
  assert.match(html, /hljs-keyword">assert<\/span> result == expected/);
  assert.doesNotMatch(html, /<script|<img|tracker\.png/);
});

test('coach code fences colour typed snippets and escape untrusted code', () => {
  const answer = [
    '```typescript',
    'const answer: number = 42;',
    '```',
    '',
    '```unknown-language',
    '<script>alert(1)</script>',
    '```',
  ].join('\n');
  const html = renderToStaticMarkup(React.createElement(AnswerMarkdown, {text: answer}));
  assert.match(html, /answer-code-label">typescript<\/div>/);
  assert.match(html, /hljs-keyword/);
  assert.match(html, /hljs-number/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
