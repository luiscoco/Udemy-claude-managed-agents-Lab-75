import{test}from'node:test';
import assert from'node:assert/strict';
import{cases,variants,preparedRun}from'../cases.mjs';

test('prepared evaluations are labelled and use no model calls',()=>{
 for(const item of cases){
  for(const variant of Object.keys(variants)){
   const result=preparedRun(item.id,variant);
   assert.ok(result.answer.length>15);
   assert.equal(result.modelCalls,0);
   assert.equal(result.costUsd,0);
   assert.equal(result.subtype,'prepared_success');
   assert.equal(result.events.at(-1).type,'result');
  }
 }
});
test('unknown cases and variants are rejected',()=>{
 assert.throws(()=>preparedRun('missing','guided'),/Unknown evaluation case/);
 assert.throws(()=>preparedRun(cases[0].id,'missing'),/Unknown instruction variant/);
});
