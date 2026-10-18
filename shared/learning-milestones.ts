export const learningMilestones = [
  { id: 'event-viewer', pathId: 'foundations', title: 'Event stream evidence viewer', lessons: [1, 6, 15],
    summary: 'Reduce authored host event frames into answer text, session identity and an explicit outcome.',
    requirements: ['Keep answer text separate from session metadata.', 'Deduplicate repeated event IDs.', 'Require an explicit terminal outcome; otherwise report incomplete.', 'Do not let later frames rewrite a terminal outcome.'],
    hints: ['Use a set of seen event IDs.', 'Start with outcome incomplete.', 'The sample frames are a teaching contract, not raw provider events.'] },
  { id: 'http-stream', pathId: 'applications', title: 'Local streaming tutor endpoint', lessons: [1, 12, 28, 51],
    summary: 'Implement a bounded local HTTP endpoint that validates a prompt and streams deterministic SSE evidence.',
    requirements: ['Accept only POST /ask with a closed JSON prompt.', 'Reject invalid input before sending SSE headers.', 'Bound the request body and prompt length.', 'Send started, answer and done frames, then end the response.'],
    hints: ['Use node:http; no web framework is needed.', 'Encode each SSE data value with JSON.stringify.', 'The answer is deterministic: no model or API key is involved.'] },
  { id: 'approval-ledger', pathId: 'orchestration', title: 'Fictional approval and effect ledger', lessons: [5, 31, 60, 65],
    summary: 'Separate an immutable fictional proposal, local notification, reviewer decision and idempotent effect.',
    requirements: ['Require owner and trusted reviewer checks.', 'Do not execute an effect when proposing or notifying.', 'Reject tampering and repeated decisions.', 'Keep one business effect across multiple proposals for the same owner and case.'],
    hints: ['The reviewer string is an authored fixture, not enterprise login.', 'Use a stable business key rather than the proposal ID.', 'Expose frozen snapshot copies rather than mutable internal state.'] },
] as const;
export const milestoneStarterFiles = ['README.md', 'package.json', 'starter.ts', 'starter.test.mjs'] as const;
