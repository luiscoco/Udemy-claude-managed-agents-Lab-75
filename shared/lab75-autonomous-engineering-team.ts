import { z } from 'zod';
export const lab75Lesson = { id: 75, title: 'Capstone 2 an autonomous engineering team', topic: 'Agents for real work', serverPrefix: '/api/c75' } as const;
export const teamScenarioSchema = z.enum(['happy-rework', 'injected-plan', 'cross-owner', 'test-gaming', 'hidden-boundary', 'budget-exhaustion', 'crash-resume']);
export const teamRunSchema = z.strictObject({ mode: z.enum(['scripted', 'live']), scenario: teamScenarioSchema,
  maxParallel: z.number().int().min(1).max(3), budgetCents: z.number().int().min(1).max(300) });
