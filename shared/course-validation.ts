// Authored evidence snapshot verified against GitHub run logs on 21 October 2026.
// This is not a live status feed or a claim about commits newer than these records.
export const validationRepository = 'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75';
export const courseValidation = {
  recordedOn: '2026-10-21',
  offline: {
    runId: '39588821437', commit: 'd1cfdd01440fdb58d828fdc5f8940f3e94a438db',
    testsPassed: 528, evaluatorTestsPassed: 13, browserPassed: 489, browserSkipped: 0,
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
