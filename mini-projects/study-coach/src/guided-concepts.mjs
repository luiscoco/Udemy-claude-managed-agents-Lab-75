import curriculum from './managed-curriculum.json' with {type:'json'};
export const guidedConcepts=curriculum.topics,topicSections=curriculum.sections;
export const guidedConceptById=new Map(guidedConcepts.map(item=>[item.id,item]));
export const topicCategories=[{id:'managed',title:'Managed API concepts',description:'Agents, environments, sessions and events'},{id:'patterns',title:'Build patterns',description:'Host application design and evidence'},{id:'projects',title:'Project walkthroughs',description:'Course projects and capstones'},{id:'all',title:'All topics',description:'The complete catalog'}];
export const categoryForConcept=concept=>concept.category;
export const guidedRoutes=[{id:'all',title:'All concepts',lessonIds:Array.from({length:75},(_,index)=>index+1)},
 {id:'beginner',title:'Beginner',lessonIds:[1,2,3,4,5,6,7,9,10,14,15,51]},
 {id:'application',title:'Application Developer',lessonIds:[1,3,4,5,6,7,10,12,13,28,31,47,48,50,51,54,61,62,63,64,66,67,71,72]},
 {id:'advanced',title:'Advanced Harness',lessonIds:[1,3,4,5,7,8,10,15,19,28,35,47,48,51,52,55,56,57,58,59,60,73,74,75]}];
export function conceptsForRoute(routeId,categoryId='all',sectionId='all'){
 const route=guidedRoutes.find(item=>item.id===routeId)||guidedRoutes[0],section=topicSections.find(item=>item.id===sectionId);
 return route.lessonIds.flatMap(lesson=>guidedConcepts.filter(item=>item.lesson===lesson&&(categoryId==='all'||item.category===categoryId)&&(!section||lesson>=section.firstLesson&&lesson<=section.lastLesson)));
}
export const sharedCoachPrompts=['Show simple code','Explain in plain words','Build a small complete app','Compare two approaches','Find a failure','Test the concept','Trace the evidence','Give me a practice task'];
export function promptsForConcept(concept){return[{label:'Explain step by step',question:concept.prompts[0]},{label:concept.source?'Check the lesson evidence':'Explore a key question',question:concept.prompts[1]},...sharedCoachPrompts.map(label=>({label,question:label+' for “'+concept.title+'” using Claude Managed Agents. Distinguish platform APIs from host code and name observable evidence.'}))];}
export function preparedConceptAnswer(concept){
 const source=concept.source?'\n\nCourse source: '+concept.source.file+':'+concept.source.startLine+'–'+concept.source.endLine+'.':'';
 return '## '+concept.title+'\n\n'+concept.explanation+'\n\nSource or illustrative teaching excerpt (not a standalone program):\n\n```typescript\n'+concept.code+'\n```'+source+'\n\n**Try this:** '+concept.check.question+'\n\nThis is an authored practice explanation, not a generated answer to your question.';
}
