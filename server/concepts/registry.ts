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
  ];
  validateLessonRegistry(entries.map(({ router: _router, close: _close, ...metadata }) => metadata));
  return entries;
}
