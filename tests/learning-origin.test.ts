import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configuredLearningOriginAllowed as allowed } from '../server/lib/learning-origin.js';

const origin = 'https://course.example.azurecontainerapps.io';
const host = new URL(origin).host;
test('cloud requests require explicit exact HTTPS host and same origin', () => {
  assert.equal(allowed({ host, origin }, {}), false);
  const env = { LEARNING_PUBLIC_ORIGIN: origin };
  assert.equal(allowed({ host, origin }, env), true);
  assert.equal(allowed({ host }, env), true);
  for (const headers of [
    { host: 'attacker.example', origin }, { host, origin: 'https://attacker.example' },
    { host: host + '.attacker.example', origin }, { host, origin: 'null' },
    { host, origin: origin + '.attacker.example' }, { host, origin: origin.replace('https:', 'http:') },
  ]) assert.equal(allowed(headers, env), false);
});
test('malformed and non-origin settings fail closed', () => {
  for (const value of ['*', 'https://*', origin + '/api', origin + '?x=1', origin + '#x',
    'https://user:password@' + host, 'http://' + host, 'not a URL']) {
    assert.equal(allowed({ host, origin }, { LEARNING_PUBLIC_ORIGIN: value }), false);
  }
});
