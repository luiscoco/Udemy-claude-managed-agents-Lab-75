export const safeQuestion=value=>typeof value==='string'&&value.trim().length>=8&&value.length<=1000;
export function preparedAnswer(question){
 if(!safeQuestion(question))throw Error('Ask a specific question of 8–1000 characters.');
 const q=question.trim(),topic=/test|assert|verify/i.test(q)?'test the behavior with a positive and a negative case':/tool|function|api/i.test(q)?'define a narrow input, result and failure contract':'state the goal, try one bounded example and inspect the evidence';
 return {answer:`For “${q}”, first ${topic}. Then explain what you observed in your own words.`,source:'prepared fixture',modelCalls:0};
}
export function studyPlan(question){if(!safeQuestion(question))throw Error('A valid question is required.');return ['Write the expected outcome in one sentence.','Run a prepared example and capture the result.','Compare the result with a failure case.','Record the source line and your conclusion.'];}
export function learnerReview(observation){
 // TODO M04: validate the student's own observation against the current run.
 return {ready:false,reason:'Implement the learner evidence review in M04.',observation};
}
