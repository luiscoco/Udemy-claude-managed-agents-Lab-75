import { selectGuide } from '../lib/presentation';
import { ReadableMarkdown } from './ReadableMarkdown';

export function LessonGuide({ markdown, lessonId }: { markdown: string; lessonId: number }) {
  const selected = selectGuide(markdown, lessonId);
  if (!selected) return <p role="alert">No unambiguous detailed guide is available for this lesson.</p>;
  return <div className="lesson-guide"><ReadableMarkdown text={selected} /></div>;
}
