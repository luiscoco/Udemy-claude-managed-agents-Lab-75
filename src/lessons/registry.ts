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
import { lab17Lesson } from '../../shared/lab17-checkpointing';
import { lab18Lesson } from '../../shared/lab18-sandbox';
import { lab19Lesson } from '../../shared/lab19-session-management';
import { lab20Lesson } from '../../shared/lab20-hooks-in-depth';
import { lab21Lesson } from '../../shared/lab21-slash-commands';
import { lab22Lesson } from '../../shared/lab22-claude-md-memory';
import { lab23Lesson } from '../../shared/lab23-plugins';
import { lab24Lesson } from '../../shared/lab24-harnesses';
import { lab25Lesson } from '../../shared/lab25-compaction-context';
import { lab26Lesson } from '../../shared/lab26-query-control';
import { lab27Lesson } from '../../shared/lab27-background-tasks';
import { lab28Lesson } from '../../shared/lab28-errors-retries';
import { lab29Lesson } from '../../shared/lab29-images-files';
import { lab30Lesson } from '../../shared/lab30-todo-tracking';
import { lab31Lesson } from '../../shared/lab31-ask-user-question';
import { lab32Lesson } from '../../shared/lab32-plan-mode';
import { lab33Lesson } from '../../shared/lab33-mcp-elicitation';
import { lab34Lesson } from '../../shared/lab34-output-styles';
import { lab35Lesson } from '../../shared/lab35-session-stores';
import { lab36Lesson } from '../../shared/lab36-process-spawning';
import { lab37Lesson } from '../../shared/lab37-permission-prompt-tool';
import { lab38Lesson } from '../../shared/lab38-prompt-suggestions';
import { lab39Lesson } from '../../shared/lab39-project-config-root';
import { lab40Lesson } from '../../shared/lab40-resume-drops-turn';
import { lab41Lesson } from '../../shared/lab41-v2-session-api';
import { lab42Lesson } from '../../shared/lab42-web-tools';
import { lab43Lesson } from '../../shared/lab43-remote-mcp-resources';
import { lab44Lesson } from '../../shared/lab44-otel-observability';
import { lab45Lesson } from '../../shared/lab45-cloud-providers';
import { lab46Lesson } from '../../shared/lab46-prompt-caching';
import { lab47Lesson } from '../../shared/lab47-multi-agent';
import { lab48Lesson } from '../../shared/lab48-security-hardening';
import { lab49Lesson } from '../../shared/lab49-deploy-ci-headless';
import { lab50Lesson } from '../../shared/lab50-capstone';
import { lab51Lesson } from '../../shared/lab51-unit-testing';
import { lab52Lesson } from '../../shared/lab52-evals';
import { lab53Lesson } from '../../shared/lab53-debugging';
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
const lab17: LessonMetadata = { ...lab17Lesson, ...content[lab17Lesson.id]! };
const lab18: LessonMetadata = { ...lab18Lesson, ...content[lab18Lesson.id]! };
const lab19: LessonMetadata = { ...lab19Lesson, ...content[lab19Lesson.id]! };
const lab20: LessonMetadata = { ...lab20Lesson, ...content[lab20Lesson.id]! };
const lab21: LessonMetadata = { ...lab21Lesson, ...content[lab21Lesson.id]! };
const lab22: LessonMetadata = { ...lab22Lesson, ...content[lab22Lesson.id]! };
const lab23: LessonMetadata = { ...lab23Lesson, ...content[lab23Lesson.id]! };
const lab24: LessonMetadata = { ...lab24Lesson, ...content[lab24Lesson.id]! };
const lab25: LessonMetadata = { ...lab25Lesson, ...content[lab25Lesson.id]! };
const lab26: LessonMetadata = { ...lab26Lesson, ...content[lab26Lesson.id]! };
const lab27: LessonMetadata = { ...lab27Lesson, ...content[lab27Lesson.id]! };
const lab28: LessonMetadata = { ...lab28Lesson, ...content[lab28Lesson.id]! };
const lab29: LessonMetadata = { ...lab29Lesson, ...content[lab29Lesson.id]! };
const lab30: LessonMetadata = { ...lab30Lesson, ...content[lab30Lesson.id]! };
const lab31: LessonMetadata = { ...lab31Lesson, ...content[lab31Lesson.id]! };
const lab32: LessonMetadata = { ...lab32Lesson, ...content[lab32Lesson.id]! };
const lab33: LessonMetadata = { ...lab33Lesson, ...content[lab33Lesson.id]! };
const lab34: LessonMetadata = { ...lab34Lesson, ...content[lab34Lesson.id]! };
const lab35: LessonMetadata = { ...lab35Lesson, ...content[lab35Lesson.id]! };
const lab36: LessonMetadata = { ...lab36Lesson, ...content[lab36Lesson.id]! };
const lab37: LessonMetadata = { ...lab37Lesson, ...content[lab37Lesson.id]! };
const lab38: LessonMetadata = { ...lab38Lesson, ...content[lab38Lesson.id]! };
const lab39: LessonMetadata = { ...lab39Lesson, ...content[lab39Lesson.id]! };
const lab40: LessonMetadata = { ...lab40Lesson, ...content[lab40Lesson.id]! };
const lab41: LessonMetadata = { ...lab41Lesson, ...content[lab41Lesson.id]! };
const lab42: LessonMetadata = { ...lab42Lesson, ...content[lab42Lesson.id]! };
const lab43: LessonMetadata = { ...lab43Lesson, ...content[lab43Lesson.id]! };
const lab44: LessonMetadata = { ...lab44Lesson, ...content[lab44Lesson.id]! };
const lab45: LessonMetadata = { ...lab45Lesson, ...content[lab45Lesson.id]! };
const lab46: LessonMetadata = { ...lab46Lesson, ...content[lab46Lesson.id]! };
const lab47: LessonMetadata = { ...lab47Lesson, ...content[lab47Lesson.id]! };
const lab48: LessonMetadata = { ...lab48Lesson, ...content[lab48Lesson.id]! };
const lab49: LessonMetadata = { ...lab49Lesson, ...content[lab49Lesson.id]! };
const lab50: LessonMetadata = { ...lab50Lesson, ...content[lab50Lesson.id]! };
const lab51: LessonMetadata = { ...lab51Lesson, ...content[lab51Lesson.id]! };
const lab52: LessonMetadata = { ...lab52Lesson, ...content[lab52Lesson.id]! };
const lab53: LessonMetadata = { ...lab53Lesson, ...content[lab53Lesson.id]! };
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
  { ...lab17, component: workspace(lab17, () => import('../concepts/Concept17Checkpointing')) },
  { ...lab18, component: workspace(lab18, () => import('../concepts/Concept18Sandbox')) },
  { ...lab19, component: workspace(lab19, () => import('../concepts/Concept19SessionManagement')) },
  { ...lab20, component: workspace(lab20, () => import('../concepts/Concept20HooksInDepth')) },
  { ...lab21, component: workspace(lab21, () => import('../concepts/Concept21SlashCommands')) },
  { ...lab22, component: workspace(lab22, () => import('../concepts/Concept22ClaudeMdMemory')) },
  { ...lab23, component: workspace(lab23, () => import('../concepts/Concept23Plugins')) },
  { ...lab24, component: workspace(lab24, () => import('../concepts/Concept24Harnesses')) },
  { ...lab25, component: workspace(lab25, () => import('../concepts/Concept25CompactionContext')) },
  { ...lab26, component: workspace(lab26, () => import('../concepts/Concept26QueryControl')) },
  { ...lab27, component: workspace(lab27, () => import('../concepts/Concept27BackgroundTasks')) },
  { ...lab28, component: workspace(lab28, () => import('../concepts/Concept28ErrorsRetries')) },
  { ...lab29, component: workspace(lab29, () => import('../concepts/Concept29ImagesFiles')) },
  { ...lab30, component: workspace(lab30, () => import('../concepts/Concept30TodoTracking')) },
  { ...lab31, component: workspace(lab31, () => import('../concepts/Concept31AskUserQuestion')) },
  { ...lab32, component: workspace(lab32, () => import('../concepts/Concept32PlanMode')) },
  { ...lab33, component: workspace(lab33, () => import('../concepts/Concept33McpElicitation')) },
  { ...lab34, component: workspace(lab34, () => import('../concepts/Concept34OutputStyles')) },
  { ...lab35, component: workspace(lab35, () => import('../concepts/Concept35SessionStores')) },
  { ...lab36, component: workspace(lab36, () => import('../concepts/Concept36ProcessSpawning')) },
  { ...lab37, component: workspace(lab37, () => import('../concepts/Concept37PermissionPromptTool')) },
  { ...lab38, component: workspace(lab38, () => import('../concepts/Concept38PromptSuggestions')) },
  { ...lab39, component: workspace(lab39, () => import('../concepts/Concept39ProjectConfigRoot')) },
  { ...lab40, component: workspace(lab40, () => import('../concepts/Concept40ResumeDropsTurn')) },
  { ...lab41, component: workspace(lab41, () => import('../concepts/Concept41V2SessionApi')) },
  { ...lab42, component: workspace(lab42, () => import('../concepts/Concept42WebTools')) },
  { ...lab43, component: workspace(lab43, () => import('../concepts/Concept43RemoteMcp')) },
  { ...lab44, component: workspace(lab44, () => import('../concepts/Concept44OtelObservability')) },
  { ...lab45, component: workspace(lab45, () => import('../concepts/Concept45CloudProviders')) },
  { ...lab46, component: workspace(lab46, () => import('../concepts/Concept46PromptCaching')) },
  { ...lab47, component: workspace(lab47, () => import('../concepts/Concept47MultiAgent')) },
  { ...lab48, component: workspace(lab48, () => import('../concepts/Concept48SecurityHardening')) },
  { ...lab49, component: workspace(lab49, () => import('../concepts/Concept49DeployCiHeadless')) },
  { ...lab50, component: workspace(lab50, () => import('../concepts/Concept50Capstone')) },
  { ...lab51, component: workspace(lab51, () => import('../concepts/Concept51UnitTesting')) },
  { ...lab52, component: workspace(lab52, () => import('../concepts/Concept52Evals')) },
  { ...lab53, component: workspace(lab53, () => import('../concepts/Concept53Debugging')) },
]));
