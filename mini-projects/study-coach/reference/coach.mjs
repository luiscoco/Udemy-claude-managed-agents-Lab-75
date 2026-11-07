import {preparedAnswer,studyPlan,safeQuestion} from './engine.mjs';
export {preparedAnswer,studyPlan};
export function learnerReview(observation){return {ready:typeof observation==='string'&&observation.trim().length>=20,reason:'Reference checks require a concrete observation.'};}
export function reviewRequest(value){return safeQuestion(value?.question)&&['prepared','live'].includes(value?.mode);}
