import assert from 'node:assert/strict';
import { test } from 'node:test';
import { testLesson } from './support/lesson';
import { numericOrder, readRoute, routeHref, searchLessons, topicGroups } from '../src/lessons/navigation';

test('query parsing accepts registered numeric IDs and rejects ambiguous or unavailable IDs', () => {
  for (const query of ['', '?other=value']) assert.deepEqual(readRoute(query, [testLesson]), { lesson: undefined, invalid: false });
  for (const query of ['?lesson=0', '?lesson=00']) assert.equal(readRoute(query, [testLesson]).lesson?.id, 0);
  for (const query of ['?lesson=', '?lesson=-1', '?lesson=1', '?lesson=75', '?lesson=dummy', '?lesson=0.0', '?lesson=0&lesson=0', '?lesson=000'])
    assert.equal(readRoute(query, [testLesson]).invalid, true, query);
  assert.equal(routeHref(undefined, 'http://localhost/?lesson=0&other=kept'), '/?other=kept');
  assert.equal(routeHref(0, 'http://localhost/'), '/?lesson=0');
  assert.equal(routeHref(2, 'http://localhost/?lesson=1#lesson-notebook-1'), '/?lesson=2');
  assert.equal(routeHref(undefined, 'http://localhost/?lesson=1#lesson-exercise-1'), '/');
  assert.equal(routeHref(1, 'http://localhost/?lesson=1#lesson-checklist-1'), '/?lesson=1');
  assert.equal(routeHref(2, 'http://localhost/#course-progress'), '/?lesson=2');
  assert.equal(routeHref(2, 'http://localhost/#course-validation'), '/?lesson=2');
});

test('search is case insensitive across IDs, titles, objectives and topic terms', () => {
  for (const query of ['0', '00', 'FRAMEWORK TEST', 'HOST POLICY', 'CONTRACTS', '  adapter  ', ''])
    assert.equal(searchLessons([testLesson], query).length, 1, query);
  assert.equal(searchLessons([testLesson], 'unregistered').length, 0);
  assert.equal(topicGroups.length, 8);
});

test('numeric navigation follows implemented IDs across gaps independently of topic and search order', () => {
  const registry = [9, 0, 3].map((id) => ({ ...testLesson, id, title: `Lab ${id}`, topic: id === 9 ? 'SDK fundamentals' : 'Tools and extensions' }));
  const ordered = numericOrder(registry);
  assert.deepEqual(ordered.map(({ id }) => id), [0, 3, 9]);
  assert.deepEqual(registry.map(({ id }) => id), [9, 0, 3]);
  assert.deepEqual(searchLessons(ordered, 'Lab 3').map(({ id }) => id), [3]);
  assert.equal(ordered[ordered.findIndex(({ id }) => id === 3) + 1]?.id, 9);
});
