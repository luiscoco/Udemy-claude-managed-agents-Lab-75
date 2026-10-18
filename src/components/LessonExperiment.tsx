import { lessonExperiment } from '../../shared/learning-experiments';

export function LessonExperiment({ lessonId }: { lessonId: number }) {
  const experiment = lessonExperiment(lessonId);
  return <section className="lesson-experiment" aria-label="Worked experiment plan">
    <h3>Try a baseline and compare</h3>
    <ol><li><strong>Baseline:</strong> {experiment.baseline}</li><li><strong>Change one thing:</strong> {experiment.compare}</li></ol>
    <p><strong>What to look for:</strong> {experiment.evidence}</p>
    <p>Use the actual reported source and outcome. This plan describes the concept to inspect; it does not certify a run or require a live request.</p>
    <p><strong>Connect it to code:</strong> <code>{experiment.inspect}</code></p>
  </section>;
}
