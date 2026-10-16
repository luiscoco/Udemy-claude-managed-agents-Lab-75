import type { Router } from 'express';
import { validateLessonRegistry } from '../../shared/lessons.js';
import type { LessonMetadata } from '../../shared/lessons.js';
import { lab01Lesson } from '../../shared/lab01-events.js';
import { content } from '../../src/lessons/content.js';
import { createLab01Router } from './01-query.js';
import { lab02Lesson } from '../../shared/lab02-options.js';
import { createLab02Router } from './02-options.js';
import { lab03Lesson } from '../../shared/lab03-tools.js';
import { createLab03Router } from './03-tools.js';
import { lab04Lesson } from '../../shared/lab04-permissions.js';
import { createLab04Router } from './04-permissions.js';
import { lab05Lesson } from '../../shared/lab05-custom-tools.js';
import { createLab05Router } from './05-custom-tools.js';
import { lab06Lesson } from '../../shared/lab06-sessions.js';
import { createLab06Router } from './06-sessions.js';
import { lab07Lesson } from '../../shared/lab07-hooks.js';
import { createLab07Router } from './07-hooks.js';
import { lab08Lesson } from '../../shared/lab08-subagents.js';
import { createLab08Router } from './08-subagents.js';
import { lab09Lesson } from '../../shared/lab09-system-prompts.js';
import { createLab09Router } from './09-system-prompts.js';
import { lab10Lesson } from '../../shared/lab10-structured-interrupt.js';
import { createLab10Router } from './10-structured-interrupt.js';

import { lab11Lesson } from '../../shared/lab11-skills.js';
import { createLab11Router } from './11-skills.js';
import { lab12Lesson } from '../../shared/lab12-streaming-input.js';
import { createLab12Router } from './12-streaming-input.js';
import { lab13Lesson } from '../../shared/lab13-mcp.js';
import { createLab13Router } from './13-mcp-servers.js';

import { lab14Lesson } from '../../shared/lab14-models.js';
import { createLab14Router } from './14-thinking-effort-models.js';

import { lab15Lesson } from '../../shared/lab15-usage.js';
import { createLab15Router } from './15-cost-usage.js';
import { lab16Lesson } from '../../shared/lab16-settings-env.js';
import { createLab16Router } from './16-settings-env.js';
import { lab17Lesson } from '../../shared/lab17-checkpointing.js';
import { createLab17Router } from './17-checkpointing.js';
import { lab18Lesson } from '../../shared/lab18-sandbox.js';
import { createLab18Router } from './18-sandbox.js';
import { lab19Lesson } from '../../shared/lab19-session-management.js';
import { createLab19Router } from './19-session-management.js';
import { lab20Lesson } from '../../shared/lab20-hooks-in-depth.js';
import { createLab20Router } from './20-hooks-in-depth.js';
import { lab21Lesson } from '../../shared/lab21-slash-commands.js';
import { createLab21Router } from './21-slash-commands.js';
import { lab22Lesson } from '../../shared/lab22-claude-md-memory.js';
import { createLab22Router } from './22-claude-md-memory.js';
import { lab23Lesson } from '../../shared/lab23-plugins.js';
import { createLab23Router } from './23-plugins.js';
import { lab24Lesson } from '../../shared/lab24-harnesses.js';
import { createLab24Router } from './24-harnesses.js';
import { lab25Lesson } from '../../shared/lab25-compaction-context.js';
import { createLab25Router } from './25-compaction-context.js';
import { lab26Lesson } from '../../shared/lab26-query-control.js';
import { createLab26Router } from './26-query-control.js';
import { lab27Lesson } from '../../shared/lab27-background-tasks.js';
import { createLab27Router } from './27-background-tasks.js';
import { lab28Lesson } from '../../shared/lab28-errors-retries.js';
import { createLab28Router } from './28-errors-retries.js';
import { lab29Lesson } from '../../shared/lab29-images-files.js';
import { createLab29Router } from './29-images-files.js';
import { lab30Lesson } from '../../shared/lab30-todo-tracking.js';
import { createLab30Router } from './30-todo-tracking.js';
import { lab31Lesson } from '../../shared/lab31-ask-user-question.js';
import { createLab31Router } from './31-ask-user-question.js';
import { lab32Lesson } from '../../shared/lab32-plan-mode.js';
import { createLab32Router } from './32-plan-mode.js';
import { lab33Lesson } from '../../shared/lab33-mcp-elicitation.js';
import { createLab33Router } from './33-mcp-elicitation.js';
import { lab34Lesson } from '../../shared/lab34-output-styles.js';
import { createLab34Router } from './34-output-styles.js';
import { lab35Lesson } from '../../shared/lab35-session-stores.js';
import { createLab35Router } from './35-session-stores.js';
import { lab36Lesson } from '../../shared/lab36-process-spawning.js';
import { createLab36Router } from './36-process-spawning.js';
import { lab37Lesson } from '../../shared/lab37-permission-prompt-tool.js';
import { createLab37Router } from './37-permission-prompt-tool.js';
import { lab38Lesson } from '../../shared/lab38-prompt-suggestions.js';
import { createLab38Router } from './38-prompt-suggestions.js';
import { lab39Lesson } from '../../shared/lab39-project-config-root.js';
import { createLab39Router } from './39-project-config-root.js';
import { lab40Lesson } from '../../shared/lab40-resume-drops-turn.js';
import { createLab40Router } from './40-resume-drops-turn.js';
import { lab41Lesson } from '../../shared/lab41-v2-session-api.js';
import { createLab41Router } from './41-v2-session-api.js';
import { lab42Lesson } from '../../shared/lab42-web-tools.js';
import { createLab42Router } from './42-web-tools.js';
import { lab43Lesson } from '../../shared/lab43-remote-mcp-resources.js';
import { createLab43Router } from './43-remote-mcp-resources.js';
import { lab44Lesson } from '../../shared/lab44-otel-observability.js';
import { createLab44Router } from './44-otel-observability.js';
import { lab45Lesson } from '../../shared/lab45-cloud-providers.js';
import { createLab45Router } from './45-cloud-providers.js';
import { lab46Lesson } from '../../shared/lab46-prompt-caching.js';
import { createLab46Router } from './46-prompt-caching.js';
import { lab47Lesson } from '../../shared/lab47-multi-agent.js';
import { createLab47Router } from './47-multi-agent.js';
import { lab48Lesson } from '../../shared/lab48-security-hardening.js';
import { createLab48Router } from './48-security-hardening.js';
import { lab49Lesson } from '../../shared/lab49-deploy-ci-headless.js';
import { createLab49Router } from './49-deploy-ci-headless.js';
import { lab50Lesson } from '../../shared/lab50-capstone.js';
import { createLab50Router } from './50-capstone.js';
import { lab51Lesson } from '../../shared/lab51-unit-testing.js';
import { createLab51Router } from './51-unit-testing.js';
import { lab52Lesson } from '../../shared/lab52-evals.js';
import { createLab52Router } from './52-evals.js';
import { lab53Lesson } from '../../shared/lab53-debugging.js';
import { createLab53Router } from './53-debugging.js';
import { lab54Lesson } from '../../shared/lab54-tool-design.js';
import { createLab54Router } from './54-tool-design.js';
import { lab55Lesson } from '../../shared/lab55-upgrading-sdk.js';
import { createLab55Router } from './55-upgrading-sdk.js';
import { lab56Lesson } from '../../shared/lab56-agent-teams.js';
import { createLab56Router } from './56-agent-teams.js';
import { lab57Lesson } from '../../shared/lab57-parallel-worktrees.js';
import { createLab57Router } from './57-parallel-worktrees.js';
import { lab58Lesson } from '../../shared/lab58-tool-search.js';
import { createLab58Router } from './58-tool-search.js';
import { lab59Lesson } from '../../shared/lab59-model-routing.js';
import { createLab59Router } from './59-model-routing.js';
import { lab60Lesson } from '../../shared/lab60-durable-agents.js';
import { createLab60Router } from './60-durable-agents.js';
import { lab61Lesson } from '../../shared/lab61-agent-mcp-server.js';
import { createLab61Router } from './61-agent-as-mcp-server.js';
import { lab62Lesson } from '../../shared/lab62-retrieval-rag.js';
import { createLab62Router } from './62-retrieval-rag.js';
import { lab63Lesson } from '../../shared/lab63-safe-database-agent.js';
import { createLab63Router } from './63-safe-database-agent.js';

export type ConceptRecord = LessonMetadata & { router: Router; close?: () => Promise<void> };
export function registerConcepts(): readonly ConceptRecord[] {
  const lab01 = createLab01Router();
  const lab02 = createLab02Router();
  const lab03 = createLab03Router();
  const lab04 = createLab04Router();
  const lab05 = createLab05Router();
  const lab06 = createLab06Router();
  const lab07 = createLab07Router();
  const lab08 = createLab08Router();
  const lab09 = createLab09Router();
  const lab10 = createLab10Router();
  const lab11 = createLab11Router();
  const lab12 = createLab12Router();
  const lab15 = createLab15Router();
  const lab16 = createLab16Router();
  const lab17 = createLab17Router();
  const lab18 = createLab18Router();
  const lab19 = createLab19Router();
  const lab20 = createLab20Router();
  const lab21 = createLab21Router();
  const lab22 = createLab22Router();
  const lab23 = createLab23Router();
  const lab24 = createLab24Router();
  const lab25 = createLab25Router();
  const lab26 = createLab26Router();
  const lab27 = createLab27Router();
  const lab28 = createLab28Router();
  const lab29 = createLab29Router();
  const lab30 = createLab30Router();
  const lab31 = createLab31Router();
  const lab32 = createLab32Router();
  const lab33 = createLab33Router();
  const lab34 = createLab34Router();
  const lab35 = createLab35Router();
  const lab36 = createLab36Router();
  const lab37 = createLab37Router();
  const lab38 = createLab38Router();
  const lab39 = createLab39Router();
  const lab40 = createLab40Router();
  const lab41 = createLab41Router();
  const lab42 = createLab42Router();
  const lab43 = createLab43Router();
  const lab44 = createLab44Router();
  const lab45 = createLab45Router();
  const lab46 = createLab46Router();
  const lab47 = createLab47Router();
  const lab48 = createLab48Router();
  const lab49 = createLab49Router();
  const lab50 = createLab50Router();
  const lab51 = createLab51Router();
  const lab52 = createLab52Router();
  const lab53 = createLab53Router();
  const lab54 = createLab54Router();
  const lab55 = createLab55Router();
  const lab56 = createLab56Router();
  const lab57 = createLab57Router();
  const lab58 = createLab58Router();
  const lab59 = createLab59Router();
  const lab60 = createLab60Router();
  const lab61 = createLab61Router();
  const lab62 = createLab62Router();
  const lab63 = createLab63Router();
  const lab14 = createLab14Router();
  const lab13 = createLab13Router();
  const entries: ConceptRecord[] = [
    { ...lab01Lesson, ...content[lab01Lesson.id]!, router: lab01.router, close: lab01.close },
    { ...lab02Lesson, ...content[lab02Lesson.id]!, router: lab02.router, close: lab02.close },
    { ...lab03Lesson, ...content[lab03Lesson.id]!, router: lab03.router, close: lab03.close },
    { ...lab04Lesson, ...content[lab04Lesson.id]!, router: lab04.router, close: lab04.close },
    { ...lab05Lesson, ...content[lab05Lesson.id]!, router: lab05.router, close: lab05.close },
    { ...lab06Lesson, ...content[lab06Lesson.id]!, router: lab06.router, close: lab06.close },
    { ...lab07Lesson, ...content[lab07Lesson.id]!, router: lab07.router, close: lab07.close },
    { ...lab08Lesson, ...content[lab08Lesson.id]!, router: lab08.router, close: lab08.close },
    { ...lab09Lesson, ...content[lab09Lesson.id]!, router: lab09.router, close: lab09.close },
    { ...lab10Lesson, ...content[lab10Lesson.id]!, router: lab10.router, close: lab10.close },
    { ...lab11Lesson, ...content[lab11Lesson.id]!, router: lab11.router, close: lab11.close },
    { ...lab12Lesson, ...content[lab12Lesson.id]!, router: lab12.router, close: lab12.close },
    { ...lab13Lesson, ...content[lab13Lesson.id]!, router: lab13.router, close: lab13.close },
    { ...lab14Lesson, ...content[lab14Lesson.id]!, router: lab14.router, close: lab14.close },
    { ...lab15Lesson, ...content[lab15Lesson.id]!, router: lab15.router, close: lab15.close },
    { ...lab16Lesson, ...content[lab16Lesson.id]!, router: lab16.router, close: lab16.close },
    { ...lab17Lesson, ...content[lab17Lesson.id]!, router: lab17.router, close: lab17.close },
    { ...lab18Lesson, ...content[lab18Lesson.id]!, router: lab18.router, close: lab18.close },
    { ...lab19Lesson, ...content[lab19Lesson.id]!, router: lab19.router, close: lab19.close },
    { ...lab20Lesson, ...content[lab20Lesson.id]!, router: lab20.router, close: lab20.close },
    { ...lab21Lesson, ...content[lab21Lesson.id]!, router: lab21.router, close: lab21.close },
    { ...lab22Lesson, ...content[lab22Lesson.id]!, router: lab22.router, close: lab22.close },
    { ...lab23Lesson, ...content[lab23Lesson.id]!, router: lab23.router, close: lab23.close },
    { ...lab24Lesson, ...content[lab24Lesson.id]!, router: lab24.router, close: lab24.close },
    { ...lab25Lesson, ...content[lab25Lesson.id]!, router: lab25.router, close: lab25.close },
    { ...lab26Lesson, ...content[lab26Lesson.id]!, router: lab26.router, close: lab26.close },
    { ...lab27Lesson, ...content[lab27Lesson.id]!, router: lab27.router, close: lab27.close },
    { ...lab28Lesson, ...content[lab28Lesson.id]!, router: lab28.router, close: lab28.close },
    { ...lab29Lesson, ...content[lab29Lesson.id]!, router: lab29.router, close: lab29.close },
    { ...lab30Lesson, ...content[lab30Lesson.id]!, router: lab30.router, close: lab30.close },
    { ...lab31Lesson, ...content[lab31Lesson.id]!, router: lab31.router, close: lab31.close },
    { ...lab32Lesson, ...content[lab32Lesson.id]!, router: lab32.router, close: lab32.close },
    { ...lab33Lesson, ...content[lab33Lesson.id]!, router: lab33.router, close: lab33.close },
    { ...lab34Lesson, ...content[lab34Lesson.id]!, router: lab34.router, close: lab34.close },
    { ...lab35Lesson, ...content[lab35Lesson.id]!, router: lab35.router, close: lab35.close },
    { ...lab36Lesson, ...content[lab36Lesson.id]!, router: lab36.router, close: lab36.close },
    { ...lab37Lesson, ...content[lab37Lesson.id]!, router: lab37.router, close: lab37.close },
    { ...lab38Lesson, ...content[lab38Lesson.id]!, router: lab38.router, close: lab38.close },
    { ...lab39Lesson, ...content[lab39Lesson.id]!, router: lab39.router, close: lab39.close },
    { ...lab40Lesson, ...content[lab40Lesson.id]!, router: lab40.router, close: lab40.close },
    { ...lab41Lesson, ...content[lab41Lesson.id]!, router: lab41.router, close: lab41.close },
    { ...lab42Lesson, ...content[lab42Lesson.id]!, router: lab42.router, close: lab42.close },
    { ...lab43Lesson, ...content[lab43Lesson.id]!, router: lab43.router, close: lab43.close },
    { ...lab44Lesson, ...content[lab44Lesson.id]!, router: lab44.router, close: lab44.close },
    { ...lab45Lesson, ...content[lab45Lesson.id]!, router: lab45.router, close: lab45.close },
    { ...lab46Lesson, ...content[lab46Lesson.id]!, router: lab46.router, close: lab46.close },
    { ...lab47Lesson, ...content[lab47Lesson.id]!, router: lab47.router, close: lab47.close },
    { ...lab48Lesson, ...content[lab48Lesson.id]!, router: lab48.router, close: lab48.close },
    { ...lab49Lesson, ...content[lab49Lesson.id]!, router: lab49.router, close: lab49.close },
    { ...lab50Lesson, ...content[lab50Lesson.id]!, router: lab50.router, close: lab50.close },
    { ...lab51Lesson, ...content[lab51Lesson.id]!, router: lab51.router, close: lab51.close },
    { ...lab52Lesson, ...content[lab52Lesson.id]!, router: lab52.router, close: lab52.close },
    { ...lab53Lesson, ...content[lab53Lesson.id]!, router: lab53.router, close: lab53.close },
    { ...lab54Lesson, ...content[lab54Lesson.id]!, router: lab54.router, close: lab54.close },
    { ...lab55Lesson, ...content[lab55Lesson.id]!, router: lab55.router, close: lab55.close },
    { ...lab56Lesson, ...content[lab56Lesson.id]!, router: lab56.router, close: lab56.close },
    { ...lab57Lesson, ...content[lab57Lesson.id]!, router: lab57.router, close: lab57.close },
    { ...lab58Lesson, ...content[lab58Lesson.id]!, router: lab58.router, close: lab58.close },
    { ...lab59Lesson, ...content[lab59Lesson.id]!, router: lab59.router, close: lab59.close },
    { ...lab60Lesson, ...content[lab60Lesson.id]!, router: lab60.router, close: lab60.close },
    { ...lab61Lesson, ...content[lab61Lesson.id]!, router: lab61.router, close: lab61.close },
    { ...lab62Lesson, ...content[lab62Lesson.id]!, router: lab62.router, close: lab62.close },
    { ...lab63Lesson, ...content[lab63Lesson.id]!, router: lab63.router, close: lab63.close },
  ];
  validateLessonRegistry(entries.map(({ router: _router, close: _close, ...metadata }) => metadata));
  return entries;
}
