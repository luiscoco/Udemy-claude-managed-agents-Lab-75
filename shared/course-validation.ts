// Authored evidence snapshot verified against GitHub run logs on 19 October 2026.
// This is not a live status feed or a claim about commits newer than these records.
export const validationRepository = 'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75';
export const courseValidation = {
  recordedOn: '2026-10-19',
  offline: {
    runId: '39220328920', commit: 'ff2cc39a25876110431f226a149a593a4927a406',
    testsPassed: 519, evaluatorTestsPassed: 13, browserPassed: 322, browserSkipped: 1,
  },
  live: {
    runId: '39166185199', commit: '0725b6b9f4032e1062f068c2794cd12078622a7a',
    suites: [
      { name: 'Course lifecycle', sessions: 4 },
      { name: 'Learning scenarios', sessions: 6 },
      { name: 'Host and Python', sessions: 3 },
      { name: 'Engineering team', sessions: 5 },
    ],
  },
} as const;
