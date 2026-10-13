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

export type ConceptRecord = LessonMetadata & { router: Router; close?: () => Promise<void> };
export function registerConcepts(): readonly ConceptRecord[] {
  const lab01 = createLab01Router();
  const lab02 = createLab02Router();
  const lab03 = createLab03Router();
  const lab04 = createLab04Router();
  const lab05 = createLab05Router();
  const entries: ConceptRecord[] = [
    { ...lab01Lesson, ...content[lab01Lesson.id]!, router: lab01.router, close: lab01.close },
    { ...lab02Lesson, ...content[lab02Lesson.id]!, router: lab02.router, close: lab02.close },
    { ...lab03Lesson, ...content[lab03Lesson.id]!, router: lab03.router, close: lab03.close },
    { ...lab04Lesson, ...content[lab04Lesson.id]!, router: lab04.router, close: lab04.close },
    { ...lab05Lesson, ...content[lab05Lesson.id]!, router: lab05.router, close: lab05.close },
  ];
  validateLessonRegistry(entries.map(({ router: _router, close: _close, ...metadata }) => metadata));
  return entries;
}
