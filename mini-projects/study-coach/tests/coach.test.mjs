import {test} from 'node:test';import assert from 'node:assert/strict';
import {preparedAnswer,studyPlan,safeQuestion,learnerReview} from '../src/coach.mjs';
import * as reference from '../reference/coach.mjs';
test('prepared answer is explicit and requires a concrete question',()=>{assert.equal(safeQuestion('short'),false);assert.throws(()=>preparedAnswer('short'));const result=preparedAnswer('How should I test a tool result?');assert.equal(result.modelCalls,0);assert.equal(result.source,'prepared fixture');assert.match(result.answer,/positive and a negative case/);});
test('plan has inspectable ordered steps',()=>{const steps=studyPlan('How should I inspect evidence?');assert.equal(steps.length,4);assert.match(steps.at(-1),/source line/);});
test('learner TODO stays distinct from reference behavior',()=>{assert.equal(learnerReview('I saw a completed result and checked its source.').ready,false);assert.equal(reference.learnerReview('I saw a completed result and checked its source.').ready,true);});
