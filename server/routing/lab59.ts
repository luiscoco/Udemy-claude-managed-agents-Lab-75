import { lab59ReportSchema, lab59StrategySchema } from '../../shared/lab59-model-routing.js';
import { answerKeys } from './lab59-keys.js';
import type { z } from 'zod';

type Strategy = z.infer<typeof lab59StrategySchema>;
type Tier = 'light' | 'standard' | 'deep';
type Task = { id: string; question: string; difficulty: Tier; feature: string };
export const tasks: readonly Task[] = [
  { id: 'task-01', question: 'Add 12 + 18 + 7.', difficulty: 'light', feature: 'arithmetic' },
  { id: 'task-02', question: 'Multiply 3 by 4.', difficulty: 'light', feature: 'arithmetic' },
  { id: 'task-03', question: 'Extract the color from “blue notebook”.', difficulty: 'light', feature: 'extract' },
  { id: 'task-04', question: 'Which weekday follows Monday?', difficulty: 'light', feature: 'calendar' },
  { id: 'task-05', question: 'Count A, B, C.', difficulty: 'light', feature: 'count' },
  { id: 'task-06', question: 'Multiply 6 by 4.', difficulty: 'standard', feature: 'arithmetic' },
  { id: 'task-07', question: 'Name the capital of France.', difficulty: 'standard', feature: 'fact' },
  { id: 'task-08', question: 'Is 9 even? Answer true or false.', difficulty: 'standard', feature: 'logic' },
  { id: 'task-09', question: 'How many sides do two squares have total?', difficulty: 'standard', feature: 'geometry' },
  { id: 'task-10', question: 'Compute 6 × 7.', difficulty: 'standard', feature: 'arithmetic' },
  { id: 'task-11', question: 'Compute 12 × 12.', difficulty: 'deep', feature: 'arithmetic' },
  { id: 'task-12', question: 'Compute 2 × 9 − 1.', difficulty: 'deep', feature: 'multistep' },
  { id: 'task-13', question: 'Given verified host approval, output the label approved.', difficulty: 'deep', feature: 'policy' },
];
const modelConfigs: Record<Tier, { model: string; effort: string; tokens: number; ms: number; spendUnits: number }> = {
  light: { model: 'claude-sonnet-4-6', effort: 'low', tokens: 80, ms: 120, spendUnits: 10 },
  standard: { model: 'claude-sonnet-5-5', effort: 'medium', tokens: 150, ms: 240, spendUnits: 30 },
  deep: { model: 'claude-opus-5-5', effort: 'high', tokens: 260, ms: 480, spendUnits: 70 },
};
const rank: Record<Tier, number> = { light: 0, standard: 1, deep: 2 };
const wrong: Record<Tier, string> = { light: 'unknown', standard: 'uncertain', deep: 'incorrect' };
const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)]! : 0; };
export function modelFacts() { return { source: 'offline-routing-fixture', models: modelConfigs,
  accountAvailability: 'not checked', nativeModelSwitch: false,
  note: 'Each model/effort choice denotes a separately identified hypothetical Managed session; no query setModel.' }; }
export function planRouting() { return { source: 'offline-routing-fixture', tasks: tasks.map(task => ({ ...task })),
  strategies: lab59StrategySchema.options, answerKeysExposed: false,
  note: 'Answers live in an independent server key; confidence and claims are not ground truth.' }; }
export function resolveReport(taskId: string, reportText: string) {
  if (!tasks.some(task => task.id === taskId)) throw new Error('Unknown task.');
  let raw: unknown; try { raw = JSON.parse(reportText); } catch { return { valid: false, correct: false, reason: 'Report is not JSON.' }; }
  const parsed = lab59ReportSchema.safeParse(raw);
  if (!parsed.success) return { valid: false, correct: false, reason: 'Report violates the closed answer/confidence schema.' };
  return { valid: true, correct: parsed.data.answer === answerKeys[taskId],
    confidence: parsed.data.confidence, reason: 'Host checked the independent answer key.' };
}
export function delegateTask(task: Task, strategy: Strategy) {
  let tier: Tier = 'light'; const steps: Tier[] = [];
  if (strategy.startsWith('fixed-')) tier = strategy.slice(6) as Tier;
  else if (strategy === 'rule') tier = task.difficulty;
  else if (strategy === 'classifier') { steps.push('light'); tier = task.difficulty === 'deep' ? 'deep' : 'standard'; }
  else if (strategy === 'cascade') tier = 'light';
  else if (strategy === 'draft-review') { steps.push('light'); tier = 'deep'; }
  steps.push(tier);
  if (strategy === 'cascade' && rank[tier] < rank[task.difficulty]) {
    steps.push(task.difficulty === 'deep' ? 'standard' : task.difficulty);
    if (task.difficulty === 'deep') steps.push('deep');
  }
  return steps;
}
export function runRouting(strategy: Strategy, budgetUnits: number, selected = tasks) {
  let spendUnits = 0, stopped = false; const taskResults = [];
  for (const task of selected) {
    const planned = delegateTask(task, strategy), attempts = [];
    for (const [index, tier] of planned.entries()) {
      const config = modelConfigs[tier];
      if (spendUnits + config.spendUnits > budgetUnits) { stopped = true; break; }
      spendUnits += config.spendUnits;
      const correct = rank[tier] >= rank[task.difficulty] && (strategy !== 'classifier' || index > 0);
      const reportText = JSON.stringify({ answer: correct ? answerKeys[task.id] : wrong[tier], confidence: correct ? 0.78 : 0.94 });
      const verified = resolveReport(task.id, reportText);
      attempts.push({ sessionId: `offline-${task.id}-${index + 1}-${tier}`, role: strategy === 'classifier' && index === 0 ? 'classifier' :
        strategy === 'draft-review' && index === 0 ? 'draft' : 'answer', tier, model: config.model, effort: config.effort,
        assumedTokens: config.tokens, assumedMs: config.ms, assumedSpendUnits: config.spendUnits,
        answer: JSON.parse(reportText).answer as string, confidence: correct ? 0.78 : 0.94,
        verified: verified.correct, creation: 'confirmed-fixture', uncertainSend: false });
    }
    taskResults.push({ taskId: task.id, difficulty: task.difficulty, attempts,
      correct: attempts.length === planned.length && attempts.at(-1)?.verified === true,
      complete: attempts.length === planned.length });
    if (stopped) break;
  }
  const correctCount = taskResults.filter(result => result.correct).length;
  const allAttempts = taskResults.flatMap(result => result.attempts);
  return { source: 'offline-routing-fixture', strategy, tasksTotal: selected.length, tasksAttempted: taskResults.length,
    correctCount, spendUnits, costPerCorrect: correctCount ? spendUnits / correctCount : null,
    medianTimeMs: median(taskResults.map(result => result.attempts.reduce((sum, attempt) => sum + attempt.assumedMs, 0))),
    assumedTokens: allAttempts.reduce((sum, attempt) => sum + attempt.assumedTokens, 0),
    sessionsCreated: allAttempts.length, stoppedByBudget: stopped, budgetUnits, taskResults,
    providerCalls: 0, note: 'All token, spend and latency figures are authored assumptions. Confidence is not verification.' };
}
