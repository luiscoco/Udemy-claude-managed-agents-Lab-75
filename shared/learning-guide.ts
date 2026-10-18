import { content } from './learning-content.js';
import { lessonExperiment } from './learning-experiments.js';

export type GuideView = 0 | 1 | 2;
export type GuideStep = { id: string; title: string; view: GuideView; text: string; action: string; waitForStudent: boolean };

/** A single authored transcript drives the page, tour and server-only synthesis. */
export function learningGuide(lessonId: number): GuideStep[] {
  const lesson = content[lessonId];
  if (!lesson || !Number.isInteger(lessonId)) throw new Error('Unknown learning guide.');
  const experiment = lessonExperiment(lessonId);
  return [
    { id: 'goal', title: 'Understand the goal', view: 0, waitForStudent: false,
      text: `In Lab ${lessonId}, your objective is: ${lesson.objective} Start by identifying what the application must demonstrate. An answer on screen is only part of the evidence: check the reported outcome and the host state before deciding that the exercise succeeded.`,
      action: 'Describe the objective in your own words before opening the exercise.' },
    { id: 'preparation', title: 'Prepare your experiment', view: 0, waitForStudent: false,
      text: 'Keep the local application and backend running. Read the detailed guide for this lab and check any prerequisites. Start with the authored offline or local path where provided. Live controls require the isolated credentials and resource pins shown by that exercise. A ready indicator confirms configuration, not a successful remote test. Live actions can incur provider charges.',
      action: 'Read the setup instructions. Choose a local baseline before considering a live run.' },
    { id: 'example', title: 'Choose your example', view: 1, waitForStudent: true,
      text: `Use this lesson plan: ${lesson.steps.join(' ')} Read the scenario labels and keep the defaults for your baseline. Change one setting at a time so you can connect an input with the resulting behavior. Opening a view or following this guide does not submit the exercise.`,
      action: lesson.steps[0]! },
    { id: 'controls', title: 'Run at your own pace', view: 1, waitForStudent: true,
      text: 'Use the labeled controls in the exercise below. You must choose and click the action yourself; this guide never starts an agent, sends a notification or approves an effect. Wait for the reported outcome before trying another action. Some scenarios deliberately demonstrate denial, interruption or failure. Read the explanation before retrying, especially if a remote operation might already have succeeded.',
      action: 'Carry out your chosen experiment and wait for its result. Continue when you are ready.' },
    { id: 'evidence', title: 'Read the evidence', view: 1, waitForStudent: true,
      text: `Compare the reported result with the objective: ${lesson.objective} What to look for in this lab: ${experiment.evidence} Look for the outcome, evidence source, effect counts and cleanup or session state where provided. Authored fixtures explain behavior; they do not prove a remote request ran. Keep unexpected errors visible while investigating.`,
      action: 'Inspect the exercise output. Explain which evidence supports the result and which limits remain.' },
    { id: 'source', title: 'Connect behavior to source', view: 2, waitForStudent: false,
      text: `Read the actual TypeScript implementation using the source selector. Start with ${lesson.inspect.slice(0, 2).join(' and ')}. Follow the input validation, the operation and the returned evidence. Reading or copying source does not execute it. Connect a visible control to its handler and explain the guard that protects the operation.`,
      action: 'Find the code behind the control you used and explain how it produces the observed result.' },
    { id: 'practice', title: 'Practice and reflect', view: 1, waitForStudent: true,
      text: `Try this challenge: ${lesson.challenge} Compare the new result with your baseline. Only mark a checkpoint after inspecting your evidence. The learning checklist records your own assessment in this browser; it is not an automatic test pass or proof of live execution.`,
      action: lesson.challenge },
  ];
}
