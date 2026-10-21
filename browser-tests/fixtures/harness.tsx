import { createRoot } from 'react-dom/client';
import { App } from '../../src/App';
import { LessonWorkspace } from '../../src/components/LessonWorkspace';
import { sources } from '../../src/lessons/resources';
import { testLesson } from '../../tests/support/lesson';
import '../../src/styles.css';
import '../../src/visual-style.css';
import '../../src/colour-system.css';
import '../../src/learning-polish.css';
const id = new URLSearchParams(location.search).has('gap') ? 2 : 1;
const lesson = { ...testLesson, id, title: 'Framework test lesson', serverPrefix: `/api/c${id}` };
const loadGuide = () => import('./guide.md?raw').then(module => module.default);
const loadExercise = () => import('./Exercise');
function Workspace() {
  return <LessonWorkspace lesson={lesson} loadGuide={loadGuide} sources={sources}
    mainSources={['server/lib/run-store.ts', 'src/components/LessonGuide.tsx']} loadExercise={loadExercise} />;
}
// A separate development-only entry. These records never enter the runtime registries.
createRoot(document.getElementById('root')!).render(<App lessons={[{ ...lesson, component: Workspace }]} />);
