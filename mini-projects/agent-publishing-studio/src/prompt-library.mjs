import sections from './managed-curriculum.json' with {type:'json'};
export const promptSections=sections;
export const promptCount=sections.reduce((count,section)=>count+section.prompts.length,0);
