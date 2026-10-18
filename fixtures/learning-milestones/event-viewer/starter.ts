export type Frame = { id: string; kind: 'session' | 'text' | 'outcome'; value: string };
export type Report = { sessionId: string | null; text: string; outcome: 'completed' | 'error' | 'incomplete'; eventCount: number };

export function reduceFrames(_frames: readonly Frame[]): Report {
  // TODO: implement the requirements in README.md and inspect starter.test.mjs.
  throw new Error('Not implemented: reduceFrames');
}
