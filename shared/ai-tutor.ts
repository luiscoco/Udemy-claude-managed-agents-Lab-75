import { z } from 'zod';
import type { LessonMetadata } from './lessons.js';
import { lessonExperiment } from './learning-experiments.js';
import { lessonKnowledgeCheck } from './learning-quizzes.js';

export const tutorQuestions = [
  { id: 'explain', label: 'Explain this exercise', question: 'Explain this exercise in simple words. What am I trying to achieve and why?' },
  { id: 'concepts', label: 'Concepts and code', question: 'Which concepts does this exercise teach? Explain them with a short TypeScript example.' },
  { id: 'steps', label: 'Steps to complete it', question: 'Give me clear steps to complete this exercise and check my work.' },
  { id: 'hint', label: 'Give me a hint', question: 'Give me one useful hint for the next step without doing the whole exercise for me.' },
  { id: 'expected', label: 'Expected result and why', question: 'What result should I expect, why does it happen, and what evidence should I inspect?' },
  { id: 'code', label: 'Simple code example', question: 'Show a small TypeScript example for the main concept and explain the important lines.' },
] as const;
export const tutorIntentSchema = z.enum(['explain', 'concepts', 'steps', 'hint', 'expected', 'code']);
export type TutorIntent = z.infer<typeof tutorIntentSchema>;
export const tutorRequestSchema = z.strictObject({
  mode: z.enum(['prepared', 'live']), intent: tutorIntentSchema,
  question: z.string().trim().min(3).max(2000), model: z.string().max(120).optional(), consent: z.boolean().default(false),
});
export type TutorLesson = Pick<LessonMetadata, 'id' | 'title' | 'objective' | 'steps' | 'inspect' | 'challenge'>;
export type TutorSource = { path: string; excerpt: string; sha256: string };
export function tutorContext(lesson: TutorLesson, source: TutorSource | null) {
  const quiz = lessonKnowledgeCheck(lesson.id), experiment = lessonExperiment(lesson.id);
  return { lessonId: lesson.id, title: lesson.title, objective: lesson.objective, steps: lesson.steps,
    inspect: lesson.inspect, challenge: lesson.challenge, concept: quiz.explanation,
    baseline: experiment.baseline, comparison: experiment.compare, expected: experiment.evidence, source };
}
export type TutorContext = ReturnType<typeof tutorContext>;
export function preparedTutorAnswer(context: TutorContext, intent: TutorIntent) {
  const heading = `## Lab ${context.lessonId}: ${context.title}\n\n`;
  const code = context.source ? `\n\n### Actual source excerpt\n\nSource: \`${context.source.path}\`\n\n\`\`\`typescript\n${context.source.excerpt}\n\`\`\`\n\nThis is an excerpt, not a standalone program. Open the TypeScript source tab for its surrounding checks.`
    : '\n\nOpen the TypeScript source tab for the complete implementation.';
  switch (intent) {
    case 'concepts': return heading + `### Main concept\n\n${context.concept}\n\n### What you are learning\n\n${context.objective}${code}`;
    case 'steps': return heading + `### Your steps\n\n${context.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n### Check your work\n\n${context.expected}\n\nInspect: ${context.inspect.map(path => `\`${path}\``).join(', ')}.`;
    case 'hint': return heading + `### One next step\n\n${context.baseline}\n\nBefore changing another setting, identify the input, the reported outcome and the evidence produced by this baseline. Use the source tab if you cannot connect a control to its handler.`;
    case 'expected': return heading + `### Expected behavior\n\n${context.expected}\n\n### Compare the evidence\n\n${context.comparison}\n\nPrepared guidance describes the authored lesson. It does not establish that your own exercise or a live model run succeeded.`;
    case 'code': return heading + `### Connect the concept to code\n\n${context.concept}${code}\n\nFollow the input validation, operation and returned evidence. Reading this excerpt does not execute it.`;
    default: return heading + `### Exercise goal\n\n${context.objective}\n\n### Start here\n\n${context.baseline}\n\n### Why it matters\n\n${context.concept}\n\n### Your challenge\n\n${context.challenge}`;
  }
}
export type TutorModel = { id: string; name: string };
export type TutorUsage = { inputTokens: number; outputTokens: number };
export type TutorReply = { mode: 'prepared' | 'live'; answer: string; model?: string; modelCalls: number;
  usage?: TutorUsage; pendingToken?: string; incomplete?: boolean; note: string };
export type SavedTutorAnswer = { id: string; lesson: number; intent: TutorIntent; question: string; model: string;
  answer: string; usage: TutorUsage; generatedAt: string; savedAt: string; contextHash: string };
export type CurrentTutorAnswer = SavedTutorAnswer & { current: boolean };
