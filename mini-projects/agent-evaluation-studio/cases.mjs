import curriculum from './src/managed-curriculum.json' with {type:'json'};
export const {cases,sections}=curriculum;
export const variants={baseline:'Answer the question briefly.',guided:'You are a careful Claude Managed Agents tutor. Explain directly in plain language. Separate agent, environment, session and event behavior from host code. Never claim an unobserved effect. End with an evidence check.'};
export function preparedRun(caseId,variant){
 const item=cases.find(row=>row.id===caseId);if(!item)throw Error('Unknown evaluation case.');if(!Object.hasOwn(variants,variant))throw Error('Unknown instruction variant.');
 return{answer:variant==='guided'?'## '+item.title+'\n\n'+item.explanation+'\n\n**Next check:** '+item.check:item.explanation,
 events:[{type:'request',label:'Case loaded',detail:item.title},{type:'instruction',label:'Instruction variant',detail:variant},{type:'fixture',label:'Prepared example',detail:'Authored Managed Agents teaching; no provider call.'},{type:'result',label:'Run completed',detail:'Prepared result · 0 model calls'}],
 modelCalls:0,mcpToolCalls:0,specialistCalls:0,costUsd:0,subtype:'prepared_success'};
}
