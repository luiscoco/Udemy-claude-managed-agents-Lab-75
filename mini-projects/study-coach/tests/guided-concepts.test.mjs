import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guidedConcepts,guidedConceptById,topicSections,topicCategories,conceptsForRoute,categoryForConcept,promptsForConcept,preparedConceptAnswer} from '../src/guided-concepts.mjs';
test('127 Managed topics cover 75 labs in 17 sections with ten editable prompts',()=>{
 assert.equal(guidedConcepts.length,127);assert.equal(topicSections.length,17);assert.equal(new Set(guidedConcepts.map(item=>item.lesson)).size,75);
 assert.equal(guidedConceptById.size,127);assert.deepEqual(topicCategories.map(item=>item.id),['managed','patterns','projects','all']);
 for(const topic of guidedConcepts){assert.ok(topic.explanation.length>20);assert.equal(promptsForConcept(topic).length,10);assert.match(preparedConceptAnswer(topic),/authored practice explanation/);assert.ok(topicCategories.some(item=>item.id===categoryForConcept(topic)));}
 assert.equal(conceptsForRoute('all').length,127);assert.ok(conceptsForRoute('beginner','managed').length>0);
 assert.ok(guidedConcepts.filter(item=>item.source).every(item=>/^(server|shared)\//.test(item.source.file)&&item.source.sha256.length===64));
 assert.ok(!JSON.stringify(guidedConcepts).includes('@anthropic-ai/claude-agent-sdk'));
});
