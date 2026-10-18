// Authored evidence snapshot verified against GitHub run logs on 18 October 2026.
// This is not a live status feed or a claim about commits newer than these records.
export const validationRepository = 'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75';
export const courseValidation = {
  recordedOn: '2026-10-18',
  offline: {
    runId: '39134515055', commit: 'b525350e42216ec90db155d013c63f71804a6048',
    testsPassed: 518, evaluatorTestsPassed: 12, browserPassed: 320, browserSkipped: 1,
  },
  liveScenarios: {
    runId: '39128999911', commit: '855f65d19b4523cebb044499d3f85469f6d33c62',
    suites: [{ name: 'Course lifecycle', sessions: 4 }, { name: 'Learning scenarios', sessions: 6 }, { name: 'Host and Python', sessions: 3 }],
  },
  liveTeam: {
    runId: '39130740976', commit: 'cc507ed553ff165de1008483bf6de8aebb302c1f', sessions: 5,
  },
} as const;
