import type { GuideStep } from '../../shared/learning-guide';

export function GuideExplanation({ step }: { step: GuideStep }) {
  return <details className="guide-explanation" data-guide-target={step.id}>
    <summary>{step.title} <span>Read explanation</span></summary>
    <p data-guide-transcript={step.id}>{step.text}</p>
    <p className="guide-your-turn"><strong>Your turn:</strong> {step.action}</p>
  </details>;
}
