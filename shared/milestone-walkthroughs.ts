export const milestoneWalkthroughs = {
  'event-viewer': {
    notebookLesson: 1, tests: 4,
    steps: [
      'Open starter.ts and starter.test.mjs together. The frames are authored host events, not raw Managed API events.',
      'Initialize sessionId to null, text to an empty string, outcome to incomplete and eventCount to zero. Track seen frame IDs in a Set.',
      'Skip duplicate IDs. For each consumed unique frame, increment eventCount and handle session identity, text or terminal outcome separately.',
      'Reject conflicting session IDs and unknown kinds. Stop processing after the first completed or error outcome so later text cannot rewrite the result.',
      'Save starter.ts, run the tests again, and explain why text arriving without an outcome remains incomplete.',
    ],
    pitfalls: ['Not implemented means the TODO is still present or the edited file was not saved.', 'A rejection test can pass merely because the placeholder throws; inspect all four tests.', 'Do not count duplicate IDs or frames after the terminal outcome.'],
    extension: 'Add a test with two distinct text frames and confirm their text joins in order.',
  },
  'http-stream': {
    notebookLesson: 12, tests: 3,
    steps: [
      'Open starter.ts. Export createTutorServer using node:http createServer; the tests start and close it on a temporary loopback port.',
      'Validate the /ask route, POST method and application/json content type before reading the input. Return 404, 405 or 415 for those invalid cases.',
      'Retain at most 1024 bytes of body data. Reject an oversized body with 413. Parse JSON and accept exactly one prompt string whose trimmed length is 1 through 200.',
      'After validation, send text/event-stream headers. Write started, answer and done frames with JSON.stringify and a blank line between frames, then end the response.',
      'Save and rerun the tests. Inspect both the successful event order and JSON errors that occur before SSE starts.',
    ],
    pitfalls: ['Do not start a second server manually; these tests manage their own server.', 'Use JSON.stringify so a newline in the prompt stays inside one SSE data line.', 'Node runtime tests can pass while VS Code lacks Node type definitions. Editor diagnostics and executed test results are separate checks.'],
    extension: 'Add a valid request with surrounding whitespace and verify the streamed answer uses the trimmed prompt.',
  },
  'approval-ledger': {
    notebookLesson: 65, tests: 5,
    steps: [
      'Store proposals in a Map and executed business keys in a Set. Keep each proposal bound to its owner and the fictional CASE-2042.',
      'propose creates a pending record and returns a frozen snapshot copy. notify records a local notification without adding an effect.',
      'Before deciding, check the owner, trusted-reviewer fixture identity, pending state, notification and supported decision. A repeated decision must fail.',
      'For approval, add archive:owner:caseId to the effect Set. Using the business key rather than proposal ID prevents another proposal from duplicating the same effect.',
      'Reject without adding an effect. Return the new state and total effect count, save the file and rerun all five tests.',
    ],
    pitfalls: ['Notification does not mean approval and must leave effectCount at zero.', 'Readonly TypeScript types alone do not freeze a runtime object; return Object.freeze on a copy.', 'The fixture reviewer string is not real authentication, and the in-memory Set does not survive a restart.'],
    extension: 'Explain why two approved proposals for one owner and case yield one effect, while two different owners yield two.',
  },
} as const;
