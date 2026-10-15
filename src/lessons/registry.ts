import { createElement } from 'react';
import type { ComponentType } from 'react';
import { validateLessonRecords } from '../../shared/lessons';
import type { LessonMetadata } from '../../shared/lessons';
import { lab01Lesson } from '../../shared/lab01-events';
import { lab02Lesson } from '../../shared/lab02-options';
import { lab03Lesson } from '../../shared/lab03-tools';
import { lab04Lesson } from '../../shared/lab04-permissions';
import { lab05Lesson } from '../../shared/lab05-custom-tools';
import { lab06Lesson } from '../../shared/lab06-sessions';
import { lab07Lesson } from '../../shared/lab07-hooks';
import { lab08Lesson } from '../../shared/lab08-subagents';
import { lab09Lesson } from '../../shared/lab09-system-prompts';
import { lab11Lesson } from '../../shared/lab11-skills';
import { lab12Lesson } from '../../shared/lab12-streaming-input';
import { lab15Lesson } from '../../shared/lab15-usage';
import { lab16Lesson } from '../../shared/lab16-settings-env';
import { lab14Lesson } from '../../shared/lab14-models';
import { lab13Lesson } from '../../shared/lab13-mcp';
import { lab10Lesson } from '../../shared/lab10-structured-interrupt';
import { LessonWorkspace } from '../components/LessonWorkspace';
import { content } from './content';
import { loadGuide, mainSources, sources } from './resources';

export type LessonRecord = LessonMetadata & { component: ComponentType };
function workspace(lesson: LessonMetadata, loadExercise: () => Promise<{ default: ComponentType }>): ComponentType {
  const component = () => createElement(LessonWorkspace, { lesson, loadGuide: () => loadGuide(lesson.id),
    sources, mainSources: mainSources(sources, lesson.id), loadExercise });
  component.displayName = `Lesson${lesson.id}`;
  return component;
}
const lab01: LessonMetadata = { ...lab01Lesson, ...content[lab01Lesson.id]! };
const lab02: LessonMetadata = { ...lab02Lesson, ...content[lab02Lesson.id]! };
const lab03: LessonMetadata = { ...lab03Lesson, ...content[lab03Lesson.id]! };
const lab04: LessonMetadata = { ...lab04Lesson, ...content[lab04Lesson.id]! };
const lab05: LessonMetadata = { ...lab05Lesson, ...content[lab05Lesson.id]! };
const lab06: LessonMetadata = { ...lab06Lesson, ...content[lab06Lesson.id]! };
const lab07: LessonMetadata = { ...lab07Lesson, ...content[lab07Lesson.id]! };
const lab08: LessonMetadata = { ...lab08Lesson, ...content[lab08Lesson.id]! };
const lab09: LessonMetadata = { ...lab09Lesson, ...content[lab09Lesson.id]! };
const lab10: LessonMetadata = { ...lab10Lesson, ...content[lab10Lesson.id]! };
const lab11: LessonMetadata = { ...lab11Lesson, ...content[lab11Lesson.id]! };
const lab12: LessonMetadata = { ...lab12Lesson, ...content[lab12Lesson.id]! };
const lab13: LessonMetadata = { ...lab13Lesson, ...content[lab13Lesson.id]! };
const lab14: LessonMetadata = { ...lab14Lesson, ...content[lab14Lesson.id]! };
const lab15: LessonMetadata = { ...lab15Lesson, ...content[lab15Lesson.id]! };
const lab16: LessonMetadata = { ...lab16Lesson, ...content[lab16Lesson.id]! };
// Register a lesson only when its UI, router, guide and scripted/guided path exist.
export const lessons: readonly LessonRecord[] = Object.freeze(validateLessonRecords<ComponentType>([
  { ...lab01, component: workspace(lab01, () => import('../concepts/Concept01Query')) },
  { ...lab02, component: workspace(lab02, () => import('../concepts/Concept02Options')) },
  { ...lab03, component: workspace(lab03, () => import('../concepts/Concept03Tools')) },
  { ...lab04, component: workspace(lab04, () => import('../concepts/Concept04Permissions')) },
  { ...lab05, component: workspace(lab05, () => import('../concepts/Concept05CustomTools')) },
  { ...lab06, component: workspace(lab06, () => import('../concepts/Concept06Sessions')) },
  { ...lab07, component: workspace(lab07, () => import('../concepts/Concept07Hooks')) },
  { ...lab08, component: workspace(lab08, () => import('../concepts/Concept08Subagents')) },
  { ...lab09, component: workspace(lab09, () => import('../concepts/Concept09SystemPrompts')) },
  { ...lab10, component: workspace(lab10, () => import('../concepts/Concept10StructuredInterrupt')) },
  { ...lab11, component: workspace(lab11, () => import('../concepts/Concept11Skills')) },
  { ...lab12, component: workspace(lab12, () => import('../concepts/Concept12StreamingInput')) },
  { ...lab13, component: workspace(lab13, () => import('../concepts/Concept13McpServers')) },
  { ...lab14, component: workspace(lab14, () => import('../concepts/Concept14ThinkingEffortModels')) },
  { ...lab15, component: workspace(lab15, () => import('../concepts/Concept15CostUsage')) },
  { ...lab16, component: workspace(lab16, () => import('../concepts/Concept16SettingsEnv')) },
]));
