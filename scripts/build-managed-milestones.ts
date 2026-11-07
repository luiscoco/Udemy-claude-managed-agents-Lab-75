import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { content } from '../shared/learning-content.js';
import { registerConcepts } from '../server/concepts/registry.js';

const root = resolve(import.meta.dirname, '..');
const sections = [
  ['foundations','01 - Models, agents, environments and sessions',1,3], ['tools','02 - Tools and effect boundaries',4,5],
  ['sessions-agents','03 - Sessions and host coordination',6,8], ['prompts-output','04 - Instructions and validated output',9,10],
  ['skills-mcp','05 - Skills, MCP, models and usage',11,16], ['project-context','06 - Recovery and project context',17,23],
  ['harness','07 - Host harness and failure recovery',24,29], ['human-state','08 - Human decisions and durable state',30,35],
  ['stream-boundaries','09 - Streaming and trust boundaries',36,43], ['observability','10 - Observability and budgets',44,46],
  ['teams','11 - Coordination and support capstone',47,50], ['testing','12 - Testing and evaluation',51,55],
  ['durable','13 - Routing and durable agents',56,60], ['retrieval-data','14 - Retrieval, data and approval',61,65],
  ['delivery','15 - Application delivery',66,70], ['publishing','16 - Analysis and publishing',71,72],
  ['release','17 - Review, red teams and release',73,75],
].map(([id,title,firstLesson,lastLesson]) => ({id:String(id),title:String(title),firstLesson:Number(firstLesson),lastLesson:Number(lastLesson),
  guide:'https://platform.claude.com/docs/en/managed-agents/overview',level:Number(firstLesson)<16?'Beginner':Number(firstLesson)<51?'Intermediate':'Advanced',
  description:'Separate Managed session behavior from host validation and inspect actual course evidence.'}));
const metadata = registerConcepts();
const lessons = await Promise.all(Object.entries(content).sort(([a],[b])=>Number(a)-Number(b)).map(async ([key, lesson]) => {
  const id = Number(key), path = lesson.inspect.find(path=>/^server\/.+\.ts$/.test(path)) ?? lesson.inspect.find(path=>/^shared\/.+\.ts$/.test(path))!;
  const full = await readFile(resolve(root,path),'utf8'), lines = full.split(/\r?\n/), start = Math.max(0,lines.findIndex(line=>/^export (?:async |const |function |class |interface |type )/.test(line)));
  return {id,title:metadata.find(item=>item.id===id)!.title,...lesson,code:lines.slice(start,start+12).join('\n'),
    source:{file:path,startLine:start+1,endLine:Math.min(lines.length,start+12),sha256:createHash('sha256').update(full).digest('hex')},
    section:sections.find(section=>id>=section.firstLesson&&id<=section.lastLesson)!.id};
}));
const introductions = [
 ['LLM','A language model produces text from context. Fluent output does not establish that an action occurred.'],
 ['Agent','An agent combines model decisions with configured capabilities and observable execution.'],
 ['Harness','The host validates inputs, observes events, enforces effect policy and records evidence around a Managed session.'],
 ['Managed Agents','The platform runs the agent loop. Your application creates sessions and sends and consumes events through @anthropic-ai/sdk.'],
 ['First Managed session','Create a bounded session with an existing agent and environment. Open its event stream before sending user.message.'],
 ['Agent resource','An agent defines model, system instructions, tools and skills. A session can use explicit configuration overrides without changing the agent resource.'],
 ['Environment','An environment defines the execution setting. Its identifier is distinct from an agent or session identifier.'],
 ['Session','A session is a running instance. Its explicit status and stop reason describe progress independently of answer text.'],
 ['User message','Send user.message with typed content through sessions.events.send. The browser never receives the server credential.'],
 ['Agent message','Read text blocks in agent.message. Preview deltas and subagent-thread messages are separate evidence.'],
 ['Event identity','Deduplicate event IDs when observing streams. Replayed evidence must not create repeated business effects.'],
 ['Idle stop reason','session.status_idle with end_turn is different from budget_reached, requires_action, refusal or a stream failure.'],
 ['Session budget','Set budget.max_list_cost in integer minor currency units when creating the session. It bounds list cost, not a local SDK turn count.'],
 ['Usage','Retrieve session usage after a turn and display reported tokens and list cost. Missing cost is unknown rather than zero.'],
 ['Cancellation','Abort local observation and send user.interrupt. Inspect the remote session before reporting that execution stopped.'],
 ['Cleanup','Archive only after confirmed idle. Preserve the session ID and pending cleanup state if recovery cannot be confirmed.'],
 ['System overrides','Use agent_with_overrides to set the model and system prompt for one session, without updating the shared agent.'],
 ['Tool boundary','Set an explicit tools list. A model claim about a write is not a completed write receipt.'],
 ['MCP','Managed agents use mcp_servers and mcp_toolset configuration. Only actual agent.mcp_tool_use evidence establishes a tool call.'],
 ['Host validation','Parse generated specifications with a closed host schema before generating files or accepting effects.'],
 ['Prepared evidence','An authored fixture tests a teaching contract with zero provider calls. It cannot establish live provider behavior.'],
 ['Conversation continuity','Host conversation history and a Managed session identifier are distinct. This starter replays bounded history into a new session per paid question.'],
].map(([title,explanation],index)=>({id:`intro-${index+1}`,lesson:1,title,explanation,level:'Start here',category:'managed',
  code:index===4?'const session = await client.beta.sessions.create({\n  agent: agentId, environment_id: environmentId,\n  budget: { type: "limit", max_list_cost: { amount: "20", currency: "USD" } }\n});':'// Teaching note: inspect the actual course source for a runnable example.',
  prompts:[`Explain ${title} in Claude Managed Agents, step by step.`,`What event or host receipt would verify ${title}?`],
  check:{question:`What establishes ${title}?`,choices:[explanation,'A fluent model claim alone','An unobserved SDK callback'],correct:0,why:explanation}}));
const sourceTopics = [...lessons.map(lesson=>({lesson,comparison:false})),...lessons.slice(0,27).map(lesson=>({lesson,comparison:true}))].map(({lesson,comparison})=>({
  id:`source-${lesson.id}-${comparison?'evidence':'overview'}`,lesson:lesson.id,title:comparison?`Verify ${lesson.title}`:lesson.title,
  explanation:comparison?`${lesson.steps.join(' ')} Evidence check: ${lesson.challenge}`:lesson.objective,level:lesson.id<16?'Start here':lesson.id<51?'Build applications':'Advanced',
  category:lesson.id>=50?'projects':'patterns',code:lesson.code,source:lesson.source,challenge:lesson.challenge,
  prompts:[`Explain Lab ${lesson.id}: ${lesson.title} in Claude Managed Agents.`,`Use the actual source and describe how to verify: ${lesson.challenge}`],
  check:{question:`What evidence should you inspect for ${lesson.title}?`,choices:[lesson.challenge,'Only the model answer wording','Only that a request was sent'],correct:0,why:lesson.objective},
}));
const extra = [12,15,65].map(id=>{const lesson=lessons.find(lesson=>lesson.id===id)!;return {...sourceTopics.find(topic=>topic.lesson===id)!,id:`practice-${id}`,title:`Practice the boundary: ${lesson.title}`};});
const topics=[...introductions,...sourceTopics,...extra];
const cases=sections.flatMap(section=>lessons.filter(lesson=>lesson.section===section.id).flatMap(lesson=>[
  {id:lesson.id===1?'first-query':`lab-${lesson.id}-baseline`,lesson:lesson.id,section:section.id,title:lesson.title,question:`Explain ${lesson.title} using Claude Managed Agents.`,context:lesson.objective,
    explanation:lesson.objective,check:lesson.steps[0],resource:'docs'},
  {id:`lab-${lesson.id}-failure`,lesson:lesson.id,section:section.id,title:`Verify: ${lesson.title}`,question:lesson.challenge,context:lesson.objective,
    explanation:`Compare the authored baseline and failure evidence: ${lesson.steps.join(' ')}`,check:lesson.challenge,resource:'none'},
  ...(lesson.id<=20?[{id:`lab-${lesson.id}-boundary`,lesson:lesson.id,section:section.id,title:`Boundary: ${lesson.title}`,question:`Which parts of Lab ${lesson.id} run in the host, and which use Managed Agents?`,
    context:lesson.objective,explanation:`Inspect ${lesson.inspect.join(', ')}. Distinguish host validation and prepared evidence from actual Managed session events.`,check:'Name one host-enforced rule and one observed Managed event; do not invent an equivalent SDK callback.',resource:'none'}]:[]),
])).map((item,index)=>({...item,number:index+1,category:item.lesson<16?'Beginner':item.lesson<51?'Intermediate':'Advanced',criteria:['Answer the specific question without claiming unobserved execution',item.check]}));
const promptSections = sections.map(section=>({id:section.id,title:section.title,level:section.firstLesson<16?'Beginner':section.firstLesson<51?'Intermediate':'Advanced',
  description:'Learn the actual Managed Agents protocol and the surrounding host application.',prompts:lessons.filter(lesson=>lesson.section===section.id).flatMap(lesson=>[
    `Explain ${lesson.title}: ${lesson.objective}`,`How do I verify Lab ${lesson.id}? ${lesson.challenge}`,
    ...(lesson.id<=23?[`Show a small Managed Agents example for Lab ${lesson.id}, distinguish host code, and describe a failure check.`]:[]),
  ])}));
for(const id of ['study-coach','agent-evaluation-studio','agent-publishing-studio']){
  const dir=resolve(root,'mini-projects',id);
  const data=id==='study-coach'?{topics,sections}:id==='agent-evaluation-studio'?{cases,sections}:promptSections;
  await writeFile(resolve(dir,'src/managed-curriculum.json'),JSON.stringify(data,null,2)+'\n');
  for(const name of await readdir(resolve(dir,'prompts'))){
    const number=Number(/^m(\d+)/.exec(name)?.[1]); if(!number)continue;
    const start=id==='study-coach'?1:id==='agent-evaluation-studio'?8:15;
    const goals=id==='study-coach'?['Build the prepared coach and validate questions','Render safe answers and coloured code','Add bounded Managed sessions and fresh consent','Review student evidence independently','Replay bounded host conversation history','Record usage and cleanup receipts','Test and package the Managed coach']:
      id==='agent-evaluation-studio'?['Build the Managed evaluation catalog','Compare instruction variants','Observe Managed session events','Configure scoped MCP access','Review through an independent Managed session','Record and export review evidence','Test limits and cleanup']:
      ['Create prepared publishing answers','Validate document plans','Generate and inspect Word and PDF','Build deterministic SVG and PNG','Extract bounded source uploads','Add paid Managed answer sessions','Validate Managed JSON plans','Inspect PNG references and package the app'];
    const goal=goals[number-start];
    const prompt=`# M${String(number).padStart(2,'0')} - ${goal}\n\nBuild this stage in mini-projects/${id}. Use the working starter as an example, not proof that your implementation passed.\n\n## Goal\n\n${goal}. Use Claude Managed Agents through @anthropic-ai/sdk, never the Claude Agent SDK query process.\n\n## Build\n\n1. Inspect server.mjs, managed-runtime.mjs, src/main.jsx and the project tests. Make the smallest reviewable change for this stage.\n2. Keep prepared fixtures separate from live results. Validate inputs before opening a remote session.\n3. Live execution requires a configured existing agent and environment, MANAGED_LIVE_ENABLED=true and fresh paid consent. Create a budgeted session using agent_with_overrides; do not mutate shared agents.\n4. Open sessions.events.stream before sending user.message. Deduplicate event IDs, preserve partial output, and require session.status_idle with end_turn before accepting completion.\n5. On cancellation or failure, send user.interrupt, inspect status and usage, archive confirmed-idle sessions, and preserve pending cleanup IDs.\n6. Keep host file generation, validation, review decisions and persistence distinct from Managed API behavior. Validate a JSON plan locally; do not invent an SDK outputFormat option.\n\n## Verify\n\nRun npm test and npm run build. Demonstrate a prepared success, a rejected input, an interrupted or budget-limited fake session, and a cleanup failure with its retained session ID. Offline tests use an injected fake Managed client and spend no API credits. A real run needs separate authorization in the UI.\n\n## Student evidence\n\nRecord your code change, test output, source path, Managed session/event receipts when applicable, and unresolved limitations. A green fixture does not certify live behavior. No automatic grading or course completion is implied.\n`;
    await writeFile(resolve(dir,'prompts',name),prompt);
  }
}
// Remove the imported Agent SDK catalogs; the generated Managed catalog is authoritative.
for(const path of ['study-coach/src/source-concepts.json','study-coach/src/supplemental-concepts.mjs','agent-evaluation-studio/curriculum-cases.mjs'])await unlink(resolve(root,'mini-projects',path)).catch(()=>{});
console.log(`Generated ${topics.length} Managed topics, ${cases.length} evaluation cases and ${promptSections.flatMap(section=>section.prompts).length} publishing prompts from ${lessons.length} course labs.`);
console.log(`Source root: ${relative(root,resolve(root,'shared/learning-content.ts'))}`);
