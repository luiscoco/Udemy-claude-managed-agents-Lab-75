import type { LessonMetadata } from '../../shared/lessons.js';
export const testLesson: LessonMetadata = {
  id: 0, title: 'Framework test lesson', topic: 'Architecture and contracts', serverPrefix: '/api/c0',
  objective: 'Trace a host policy and adapter using isolated test data.',
  steps: ['Inspect a request.'], inspect: ['shared/contracts.ts'], challenge: 'Compare results.',
};
export function fixtureResponse(name: string, prompt = 'Hello Agent Platform') {
  return `Hello, ${name}.` + (prompt === 'Hello Agent Platform' ? '' : ` ${prompt}`);
}
export const testGuide = '# Lab 00\n## Guide\n### Controls\n1. Inspect\n- Compare\n\n| Input | Result |\n| --- | --- |\n| test | passed |\n\n```ts\nconst request = {};\n```\n[TypeScript handbook](https://www.typescriptlang.org/docs/)';
