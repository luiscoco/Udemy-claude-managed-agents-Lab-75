import type { GuideStep } from '../../shared/learning-guide';
import { narrationSegments } from '../../shared/learning-narration';

export function GuideExplanation({ step }: { step: GuideStep }) {
  return <details className="guide-explanation" data-guide-target={step.id}>
    <summary data-guide-cue={`${step.id}-title`}>{step.title} <span>Read explanation</span></summary>
    <div data-guide-transcript={step.id}>{narrationSegments(step).filter(segment => segment.kind === 'explanation').map(segment =>
      <p key={segment.id} data-guide-cue={segment.id}>{segment.text}</p>)}</div>
    <p className="guide-your-turn" data-guide-cue={`${step.id}-action`}><strong>Your turn:</strong> {step.action}</p>
  </details>;
}
