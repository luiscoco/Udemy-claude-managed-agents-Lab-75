import { content } from './learning-content.js';
import { lessonKnowledgeCheck } from './learning-quizzes.js';

const examples: Record<number, { baseline: string; compare: string; evidence: string }> = {
  1: { baseline: 'Run the offline Normal turn scenario. Compare the answer panel with the separate lifecycle and outcome panels.', compare: 'Run an early-EOF scenario and check whether answer text can be present without a completed outcome.', evidence: 'A normal turn has explicit terminal evidence. An interrupted stream alone must not be promoted to completed.' },
  12: { baseline: 'Use the offline retained-session flow to send an initial message and a follow-up. Inspect the shared session identity and command order.', compare: 'Compare the follow-up with a fresh session, and inspect rejection of an overlapping send while another command is pending.', evidence: 'Same-session turns preserve retained context; fresh sessions and overlapping sends have different ownership and concurrency behavior.' },
  65: { baseline: 'Preview a fictional proposal, notify locally and inspect the effect count before making a reviewer decision.', compare: 'Approve once, then try a duplicate decision or a second proposal for the same owner and case.', evidence: 'Preview and notification create no archive effect. A valid approval creates one effect and the business key prevents a repeat.' },
};

export function lessonExperiment(id: number) {
  const lesson = content[id];
  if (!lesson || !Number.isInteger(id)) throw new Error('Unknown lesson experiment.');
  const quiz = lessonKnowledgeCheck(id);
  return {
    baseline: examples[id]?.baseline ?? lesson.steps[0]!,
    compare: examples[id]?.compare ?? lesson.steps[1] ?? lesson.challenge,
    evidence: examples[id]?.evidence ?? `${quiz.choices[quiz.correctIndex]} ${quiz.explanation}`,
    inspect: lesson.inspect[0]!,
  };
}
