import test from 'node:test';
import assert from 'node:assert/strict';
import {promptSections,promptCount} from '../src/prompt-library.mjs';
test('173 Managed publishing prompts cover the 17 ordered course sections',()=>{
 assert.equal(promptSections.length,17);assert.equal(promptCount,173);
 const prompts=promptSections.flatMap(section=>section.prompts);assert.equal(new Set(prompts).size,173);
 assert.ok(promptSections.every((section,index)=>section.title.startsWith(String(index+1).padStart(2,'0'))&&section.prompts.length>0));
 assert.ok(prompts.some(prompt=>/Managed/i.test(prompt)));assert.ok(!prompts.some(prompt=>prompt.includes('@anthropic-ai/claude-agent-sdk')));
});
