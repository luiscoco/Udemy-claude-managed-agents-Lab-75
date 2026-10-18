export type Frame = { id: string; kind: 'session' | 'text' | 'outcome'; value: string };
export type Report = { sessionId: string | null; text: string; outcome: 'completed' | 'error' | 'incomplete'; eventCount: number };

export function reduceFrames(frames: readonly Frame[]): Report {
  const result: Report = { sessionId: null, text: '', outcome: 'incomplete', eventCount: 0 }, seen = new Set<string>();
  for (const frame of frames) {
    if (result.outcome !== 'incomplete') break;
    if (!frame || typeof frame.id !== 'string' || !frame.id || typeof frame.value !== 'string') throw new Error('Invalid frame.');
    if (seen.has(frame.id)) continue;
    seen.add(frame.id); result.eventCount++;
    if (frame.kind === 'session') {
      if (result.sessionId !== null && result.sessionId !== frame.value) throw new Error('Conflicting session.');
      result.sessionId = frame.value;
    } else if (frame.kind === 'text') result.text += frame.value;
    else if (frame.kind === 'outcome' && (frame.value === 'completed' || frame.value === 'error')) result.outcome = frame.value;
    else throw new Error('Invalid frame kind or outcome.');
  }
  return result;
}
