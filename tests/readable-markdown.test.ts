import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentMessage } from '../src/components/AgentMessage';
import { ReadableMarkdown } from '../src/components/ReadableMarkdown';
import { lessonExperiment } from '../shared/learning-experiments';
import { content } from '../shared/learning-content';

test('agent prose renders headings lists bold code and tables while retaining exact text', () => {
  const text = '# Observation\n- **Species:** Aurora Finch\n- Count: `3`\n\n| Kind | Count |\n| --- | --- |\n| Finch | 3 |\n\n```ts\nconst count = 3;\n```';
  const html = renderToStaticMarkup(createElement(AgentMessage, { text }));
  assert.match(html, /<h4>Observation<\/h4>/); assert.match(html, /<strong>Species:<\/strong>/);
  assert.match(html, /<ul>/); assert.match(html, /<table>/); assert.match(html, /<code>3<\/code>/);
  assert.match(html, /Inspect exact agent message/); assert.match(html, /const count/);
});

test('raw HTML and unsafe links do not become executable elements or embedded resources', () => {
  const text = '<img src=x onerror=alert(1)>\n<script>alert(1)</script>\n[unsafe](javascript:alert) [hidden](data:text/html,bad) [safe](https://example.com/guide)';
  const html = renderToStaticMarkup(createElement(ReadableMarkdown, { text }));
  assert.doesNotMatch(html, /<img|<script|href="javascript:|href="data:/);
  assert.match(html, /&lt;script&gt;/); assert.match(html, /href="https:\/\/example.com\/guide"/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(ReadableMarkdown, { text: '[external](//example.com) [escape](/\\example.com)' })), /<a /);
});

test('all 75 experiment plans use registered source and lesson-specific baseline and evidence', () => {
  const evidence = new Set<string>();
  for (let id = 1; id <= 75; id++) {
    const plan = lessonExperiment(id);
    assert.ok(plan.baseline.length > 20 && plan.compare.length > 20 && plan.evidence.length > 20);
    assert.ok(content[id]!.inspect.includes(plan.inspect)); evidence.add(plan.evidence);
  }
  assert.equal(evidence.size, 75);
  assert.throws(() => lessonExperiment(76));
});
