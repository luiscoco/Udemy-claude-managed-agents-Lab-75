"""Build a curriculum index and code-led learning preview, preserving v4."""
from pathlib import Path
import ast,hashlib,html,json,shutil
from plan_lab_settings import SETTINGS
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-course-index-code-and-app-v5'
P=ROOT/'presentations'/NAME;V=ROOT/'videos'/NAME
P.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
for f in ['cover.png','astronaut.png']:shutil.copy2(ROOT/'presentations/agent-sdk-course-concepts-and-app-v4'/f,P/f)
old=ast.parse((ROOT/'scripts/create-sdk-course-infographics.py').read_text(encoding='utf8'))
style=next(ast.literal_eval(n.value) for n in old.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='style' for t in n.targets))
lectures=[
 'What is Claude Agent SDK?', 'Practical Example 1: Getting Started',
 'Your First Agent query()', 'Practical Example 2: Invoke query()',
 'How the Agent Loop Works', 'Practical Example 4: Agent Loop',
 'Understanding Agent Message Types', 'Practical Example 5: Agent Message Types',
 'Context Window and Compaction', 'Practical Example 6: Context Window and Compaction',
 'Practical Example 9: Agent Options Object', 'Practical Example 10: Models, Effort and Environment',
 'Practical Example 11: Limiting Turns and Spending']
slides=[]
def add(title,pill,sub,lecture,goal,label,cards,groups,prelude='',terminal=False):
 assert len(cards)==len(groups)==3
 slides.append(dict(title=title,pill=pill,sub=sub,lectures=lecture,goal=goal,label=label,cards=cards,groups=groups,prelude=prelude,terminal=terminal))
# Each numbered explanation corresponds to one measured code passage.
add('Start with <em>a runnable project</em>','01 · Foundation and setup','You will learn what the SDK provides and how to prepare the first practical app.',
 'LECTURES 1–2 · WHAT IS THE SDK? · PRACTICAL EXAMPLE 1',
 'Learning outcome: install, configure, and launch a small agent application.',
 'POWERSHELL · SETUP COMMANDS',[
 ('Install the library','Bring the agent loop and tools into your project.','These are the main concepts you will learn. First, understand what the SDK provides, then install the library and development tools.'),
 ('Configure authentication','The server loads credentials from your local environment.','Next, configure authentication locally. Keep credentials on the server, and avoid placing them in browser code or presentation examples.'),
 ('Run the practical app','Start the TypeScript example and inspect its output.','Then launch your TypeScript entry point. You will connect setup commands to the running application you see in the practical tour.')],[
 'npm install @anthropic-ai/claude-agent-sdk\nnpm install -D tsx typescript',
 '# Configure authentication in your local .env.\n# Keep that file out of source control.',
 'npx tsx --env-file-if-exists=.env src/cli.ts'],terminal=True)
add('Invoke <em>your first query()</em>','02 · A task becomes an asynchronous stream','You will learn to send a focused prompt and consume the SDK messages.',
 'LECTURES 3–4 · YOUR FIRST query() · PRACTICAL EXAMPLE 2',
 'Learning outcome: connect a prompt, its execution options, and the final outcome.',
 'TYPESCRIPT · SIMPLIFIED QUERY EXCERPT',[
 ('Describe one task','A clear prompt gives the example a checkable objective.','You will learn to import query and express a small, verifiable task. Here, the agent is asked which files are present.'),
 ('Call the SDK','Pass the prompt and choose the working directory.','The query call combines that prompt with options. The working directory gives this example a concrete place to look for files.'),
 ('Consume the stream','for await receives messages until the run ends.','Use an asynchronous loop to receive messages. A result message reports the outcome; earlier messages show the work leading up to it.')],[
 'import { query } from "@anthropic-ai/claude-agent-sdk";\nconst prompt = "What files are here?";',
 'const run = query({\n  prompt,\n  options: { cwd: "./sample-workspace" }\n});',
 'for await (const message of run) {\n  if (message.type === "result") {\n    console.log(message.subtype);\n  }\n}'])
add('Follow <em>the agent loop</em>','03 · One query, repeated decisions','You will learn how tool requests and tool results drive the next decision.',
 'LECTURES 5–6 · HOW THE LOOP WORKS · PRACTICAL EXAMPLE 4',
 'Learning outcome: trace model decisions, permitted tool actions, and feedback.',
 'TYPESCRIPT · TOOL-USE MESSAGE EXCERPT',[
 ('Choose the tools','Glob is available and auto-approved in this example.','You will learn to choose which tools are available. In this example, Glob can discover file paths and is explicitly allowed to run.'),
 ('Observe a request','Assistant content can include a tool_use block.','Watch for a tool use block inside assistant content. The model is requesting an action, rather than presenting a finished answer.'),
 ('Inspect the feedback','Tool results return in the message stream.','The SDK executes permitted tool calls and returns their results. You will trace how that feedback informs the next decision, without writing the loop yourself.')],[
 'const options = {\n  tools: ["Glob"], allowedTools: ["Glob"]\n};',
 'if (message.type === "assistant") {\n  for (const block of message.message.content) {\n    if (block.type === "tool_use") {\n      console.log(block.name, block.input);\n    }\n  }\n}',
 'if (message.type === "user") {\n  console.log(message.message.content);\n}'],prelude='declare const message: SDKMessage;')
add('Recognize <em>message types</em>','04 · Read progress with the right meaning','You will learn which messages describe initialization, text, and tool feedback.',
 'LECTURES 7–8 · MESSAGE TYPES · PRACTICAL EXAMPLE 5',
 'Learning outcome: display useful progress without confusing it with completion.',
 'TYPESCRIPT · MESSAGE HANDLING EXCERPT',[
 ('Initialization','system/init describes the session that started.','You will learn to recognize initialization messages. Session metadata helps connect what the interface displays with the environment that actually started.'),
 ('Assistant text','Only text blocks belong in the answer display.','Inspect assistant content by block type. Text can be rendered as an answer, while tool requests need a different presentation.'),
 ('Tool feedback','A user message can carry a tool_result block.','A user message can carry tool feedback. You will learn why message type names alone do not always identify a new human input.')],[
 'if (message.type === "system" &&\n    message.subtype === "init") {\n  console.log(message.session_id);\n}',
 'if (message.type === "assistant") {\n  for (const block of message.message.content) {\n    if (block.type === "text") {\n      console.log(block.text);\n    }\n  }\n}',
 'if (message.type === "user") {\n  console.log(message.message.content);\n}'],prelude='declare const message: SDKMessage;')
add('Check <em>how the run ended</em>','05 · A result is more than generated text','You will learn to inspect success, errors, usage, and the final outcome.',
 'LECTURES 7–8 · RESULT HANDLING IN THE MESSAGE-TYPES APP',
 'Learning outcome: distinguish successful completion from limits and execution errors.',
 'TYPESCRIPT · RESULT HANDLER EXCERPT',[
 ('Narrow the message type','Handle result messages in their own branch.','You will learn to handle the final result separately from progress messages, so your interface can report the outcome accurately.'),
 ('Check successful output','Read result only after checking its success subtype.','Read the result text only after checking the success subtype, and check the error flag before describing the run as successful.'),
 ('Handle other outcomes','Inspect errors and cost; catch failures around the loop.','For other outcomes, inspect the reported errors and cost. Production code must also catch failures around the asynchronous loop, including connection or process errors.')],[
 'function handleResult(message: SDKMessage) {\n  if (message.type !== "result") return;',
 '  if (message.subtype === "success") {\n    console.log(message.result);\n    console.log("Error:", message.is_error);\n  } else {\n    console.error(message.errors);\n  }',
 '  console.log(message.total_cost_usd);\n  console.log(message.num_turns);\n}'])
add('Understand <em>context and compaction</em>','06 · Keep longer work understandable','You will learn how context grows and how to observe a compaction boundary.',
 'LECTURES 9–10 · CONTEXT WINDOW · PRACTICAL EXAMPLE 6',
 'Learning outcome: observe compaction; do not treat its summary as a full transcript.',
 'TYPESCRIPT · COMPACTION OBSERVER EXCERPT',[
 ('Context is finite','Instructions, history, and tool output occupy space.','You will learn how instructions, conversation history, and tool output share a finite context window. Focused prompts make that working context easier to manage.'),
 ('Watch the boundary','system/compact_boundary signals that compaction occurred.','The runtime can summarize older history. Learn to observe the compact boundary message instead of assuming that every earlier detail remains unchanged.'),
 ('Connect it to practice','Inspect the trigger and context size before compaction.','In the practical example, connect the compaction event with its trigger and pre-compaction token count. These observations explain behavior; they do not reconstruct the full transcript.')],[
 'const prompt =\n  "Keep the task objective clear and concise.";',
 'if (message.type === "system" &&\n    message.subtype === "compact_boundary") {\n  const info = message.compact_metadata;',
 '  console.log(info.trigger);\n  console.log(info.pre_tokens);\n}'],prelude='declare const message: SDKMessage;')
add('Build <em>the options object</em>','07 · Configure the agent with intent','You will learn how workspace, tools, and permissions shape the practical run.',
 'LECTURE 11 · PRACTICAL EXAMPLE 9: AGENT OPTIONS OBJECT',
 'Learning outcome: make the configuration understandable before invoking query().',
 'TYPESCRIPT · SIMPLIFIED OPTIONS EXCERPT',[
 ('Choose the workspace','cwd selects the working directory for the task.','You will learn to collect execution settings in a typed options object. Start by choosing the working directory that contains the sample files.'),
 ('Scope and approve tools','tools and allowedTools serve different purposes.','Choose the available tools, then choose which are allowed without another approval. The distinction helps you explain what the agent can actually do.'),
 ('Pass the configuration','Reuse that options object when starting the query.','Pass the reviewed configuration to query. This connects the options lesson to the same prompt and observable run you already understand.')],[
 'const options: Options = {\n  cwd: "./sample-workspace",',
 '  tools: ["Glob"],\n  allowedTools: ["Glob"],\n  permissionMode: "default"\n};',
 'const run = query({\n  prompt: "What files are here?",\n  options\n});'])
add('Choose <em>model, effort, and environment</em>','08 · Match configuration to the task','You will learn to separate model selection, reasoning effort, and runtime settings.',
 'LECTURE 12 · PRACTICAL EXAMPLE 10: MODELS, EFFORT AND ENVIRONMENT',
 'Learning outcome: compare supported settings while keeping credentials on the server.',
 'TYPESCRIPT · SERVER-SIDE CONFIGURATION EXCERPT',[
 ('Select the model','Read a configured model name from the environment.','You will learn to select a model through application configuration. The example reads a model name from the environment and provides a fallback.'),
 ('Set supported effort','Use a reasoning-effort setting supported by the model.','Explore effort settings supported by the selected model. Effort shapes reasoning behavior; it does not replace the turn or spending limits.'),
 ('Preserve the environment','Pass runtime settings without exposing secret values.','Review runtime environment settings on the server. This snippet preserves the existing environment, and the application never displays credential values to students.')],[
 'const model = process.env.CLAUDE_MODEL\n  ?? "claude-sonnet-4-6";',
 'const options: Options = {\n  model,\n  effort: "low", // For a supporting model',
 '  env: { ...process.env },\n  cwd: "./sample-workspace"\n};'])
add('Put <em>limits around the run</em>','09 · Turns, estimated spending, and outcomes','You will learn to bound an experiment and inspect why it stopped.',
 'LECTURE 13 · PRACTICAL EXAMPLE 11: LIMITING TURNS AND SPENDING',
 'Next: tour the complete practical application, from setup to a real query and result.',
 'TYPESCRIPT · LIMITS AND OUTCOME EXCERPT',[
 ('Set a turn limit','maxTurns bounds the agentic work in the query.','You will learn to set a turn limit and compare a completed example with one that reaches the limit before finishing.'),
 ('Set a spending threshold','maxBudgetUsd is an estimated-spend control.','Configure an estimated spending threshold and inspect reported cost. Leave headroom, because the final response can take spending beyond that threshold.'),
 ('Inspect the stop reason','A limit outcome is different from task completion.','Check why the run stopped, rather than treating every ending as success. Now see these ideas in the complete practical application tour.')],[
 'const options: Options = {\n  maxTurns: 4,',
 '  maxBudgetUsd: 0.15\n};',
 'if (message.type === "result") {\n  console.log(message.subtype);\n  console.log(message.total_cost_usd);\n  // A limit outcome is not task completion.\n}'],prelude='declare const message: SDKMessage;')
extra='''
.code-layout{display:grid;grid-template-columns:690px 1fr;gap:30px;margin-top:26px}.learn-stack{display:grid;grid-template-rows:repeat(3,1fr);gap:18px;height:644px}.learn-card{border-radius:26px;border:1px solid #dce9f5;padding:23px 25px;background:var(--fill);display:flex;gap:20px}.learn-card .num{width:48px;height:48px;flex:0 0 48px;font-size:28px}.learn-copy h2{font-size:30px;margin:0 0 10px;line-height:1.12}.learn-copy p{font-size:27px;line-height:1.33;margin:0}.code-panel{border-radius:27px;background:#101d35;color:#f2f7ff;height:644px;padding:28px 30px;box-shadow:0 8px 26px #12305218}.code-label{font-size:20px;letter-spacing:1.2px;color:#8fd3ff;font-weight:bold;margin-bottom:21px}.code-group{margin:0 0 19px;padding-left:17px;border-left:4px solid var(--color)}pre{font:26px/1.3 Consolas,'Courier New',monospace;white-space:pre;margin:0;width:max-content;max-width:100%;color:#f5f8ff}.index-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:26px}.index-col{border-radius:25px;background:var(--fill);border:1px solid #deebf6;padding:24px 20px}.index-col h2{font-size:26px;margin:0 0 20px;color:var(--color);line-height:1.25;min-height:62px}.lecture{display:flex;align-items:flex-start;gap:13px;min-height:98px;margin-bottom:5px}.lecture b{background:var(--color);color:white;flex:0 0 39px;height:39px;display:grid;place-items:center;border-radius:50%;font-size:23px}.lecture p{font-size:26px;line-height:1.22;margin:3px 0 0}.index-note{margin-top:16px;border-radius:20px;background:white;padding:18px;font-size:25px;line-height:1.4}.index-note strong{display:block;color:#8838ff;margin-bottom:9px}.code-layout+.takeaway{font-size:25px}.code-slide .sub{margin-bottom:0}.code-slide .takeaway{bottom:67px;padding:17px 20px}.index-slide .takeaway{bottom:65px;padding:17px;font-size:26px}.code-slide .footer,.index-slide .footer{font-size:16px}.code-slide .astronaut{height:185px}.code-slide h1{font-size:49px}
'''
extra+='''.code-panel{display:flex;flex-direction:column}.code-body{display:flex;flex-direction:column;justify-content:space-between;flex:1;min-height:0;gap:18px}.code-group{margin:0}.index-note{font-size:24px;line-height:1.32}'''
parts=['<!doctype html><meta charset="utf-8"><title>Claude Agent SDK · Course index and code preview</title><style>'+style+extra+'</style><section class="slide cover active" data-slide="1"><img src="cover.png"></section>']
indexnarr=[
 ('2-1',[1,2,3,4],'Here is your course index. Section one introduces the SDK, gets your first application running, and teaches you to invoke query through a practical example.'),
 ('2-2',[5,6,7,8],'You then explore the agent loop and message types. Each concept is paired with a practical application so you can connect the explanation to real behavior.'),
 ('2-3',[9,10],'The final part of section one explains the context window and compaction, followed by a practical example that helps you observe them.'),
 ('2-4',[11,12,13],'Section two develops your configuration skills: the options object, models, effort, environment settings, and limits on turns and spending. These are the main concepts you are going to learn.')]
parts.append('<section class="slide index-slide" data-slide="2"><img class="astronaut" src="astronaut.png"><h1>Your <em>course index</em></h1><div class="pill">Concepts + practical applications</div><p class="sub">13 teaching lectures · Two sections · Learn the idea, run the example, inspect the evidence.</p><div class="index-grid">')
colors=['#087fff','#00a977','#8838ff'];fills=['#eff8ff','#edfbf5','#f6f1ff']
for ci,nums in enumerate([range(1,6),range(6,11),range(11,14)]):
 head=['SECTION 1 · FUNDAMENTALS<br>Concepts and first applications','SECTION 1 · FUNDAMENTALS<br>Behavior, messages, and context','SECTION 2 · CONFIGURATION<br>Configure and control agents'][ci]
 parts.append(f'<div class="index-col" style="--color:{colors[ci]};--fill:{fills[ci]}"><h2>{head}</h2>')
 for n in nums:parts.append(f'<div class="lecture"><b>{n}</b><p data-lecture="{n}">{html.escape(lectures[n-1])}</p></div>')
 if ci==2:parts.append('<div class="index-note"><strong>Learn → run → inspect</strong>Each practical app connects a concept to runnable code.<br>Next: a complete Getting Started app tour.</div>')
 parts.append('</div>')
parts.append('</div><div class="takeaway"><span class="star">★</span>See what you will learn, then connect the code to a real application.</div><footer class="footer">CLAUDE AGENT SDK · FREE COURSE · INSTRUCTOR: LUIS COCO ENRIQUEZ</footer><span class="page">INDEX</span></section>')
for n,s in enumerate(slides,3):
 parts.append(f'<section class="slide code-slide" data-slide="{n}"><img class="astronaut" src="astronaut.png"><h1>{s["title"]}</h1><div class="pill">{s["pill"]}</div><p class="sub">{s["sub"]}</p><div class="code-layout"><div class="learn-stack">')
 for i,(title,body,narr) in enumerate(s['cards']):
  parts.append(f'<article class="learn-card" style="--color:{colors[i]};--fill:{fills[i]}"><span class="num">{i+1}</span><div class="learn-copy" data-explanation="{n}-{i+1}"><h2>{html.escape(title)}</h2><p>{html.escape(body)}</p></div></article>')
 parts.append(f'</div><div class="code-panel"><div class="code-label">{s["label"]}</div><div class="code-body">')
 for i,code in enumerate(s['groups']):parts.append(f'<div class="code-group" style="--color:{colors[i]}"><pre data-code="{n}-{i+1}">{html.escape(code)}</pre></div>')
 parts.append(f'</div></div></div><div class="takeaway"><span class="star">★</span>{s["goal"]}</div><footer class="footer">{s["lectures"]}</footer><span class="page">{n-2:02} / {len(slides):02}</span></section>')
count=len(slides)+2
parts.append(f'''<script>window.showSlide=n=>{{document.querySelectorAll('.slide').forEach(s=>s.classList.toggle('active',Number(s.dataset.slide)===n))}};document.addEventListener('keydown',e=>{{let n=Number(document.querySelector('.active').dataset.slide);showSlide(Math.min({count},Math.max(1,n+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))))}});</script>''')
(P/'infographics.html').write_text('\n'.join(parts),encoding='utf8')
content={'project':NAME,'lectureTitles':lectures,'codeSlides':slides,'totalSlides':count,'indexNarration':indexnarr}
(P/'curriculum.json').write_text(json.dumps(content,indent=2),encoding='utf8')
# Type-check the displayed TS fragments inside independent async functions.
examples=['import { query, type Options, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";']
for n,s in enumerate(slides,3):
 if s['terminal']:continue
 prelude=s['prelude'].replace('declare const message: SDKMessage;','const message = {} as SDKMessage;')
 body='\n'.join(s['groups']);body=body.replace('import { query } from "@anthropic-ai/claude-agent-sdk";\n','')
 examples.append(f'// Slide {n}: '+html.unescape(s['title'].replace('<em>','').replace('</em>',''))+f'\nasync function slide{n}() {{\n{prelude}\n{body}\n}}')
(P/'code-examples.ts').write_text('\n\n'.join(examples),encoding='utf8')
(P/'sources.txt').write_text('Lecture titles and ordering: instructor-provided curriculum. Practical example numbers are retained.\nCode: simplified teaching excerpts checked against the installed Agent SDK TypeScript declarations and the corresponding instructor apps: lesson01-getting-started, lesson04-agent-loop, lesson05-message-types, lesson06-context-compaction, lesson09-options, lesson10-models-environment, lesson11-limits.\nhttps://code.claude.com/docs/en/agent-sdk/overview\nhttps://code.claude.com/docs/en/agent-sdk/agent-loop\nhttps://code.claude.com/docs/en/agent-sdk/typescript\nSnippets are learning previews, not complete production programs. The first query illustrates invocation; later examples introduce explicit tool controls, result checks, and execution limits. A working directory is not a security sandbox. maxBudgetUsd is an estimated-spend threshold and can be exceeded by the last response. Effort must be supported by the selected model. No secret values are displayed.\n',encoding='utf8')
print('Authored',count,'slides including the full course index and',len(slides),'code-focused concept slides.')
geometry=P/'.build/video/slides/geometry.json'
if geometry.exists():
 g=json.loads(geometry.read_text(encoding='utf8'));assert len(g)==count
 rows=[];audit=[];images=P/'images';images.mkdir(exist_ok=True)
 for n in range(1,count+1):shutil.copy2(P/f'.build/video/slides/slide-{n:02}.png',images/f'{n:02}.png')
 def cue(n,cid,narration,boxes):
  target={'textRects':[b['rect'] for b in boxes],'paragraphGroups':[[i] for i in range(len(boxes))]}
  audit.append({'slide':n,'cue':cid,'narration':narration,'visibleText':[b['text'] for b in boxes],'selectionPolicy':'Measured course-index entry, explanation paragraph, or complete code passage'})
  return {'id':cid,'text':narration,'target':target}
 cover='Welcome to this free Claude Agent SDK course with Luis Coco Enriquez. Discover what you will learn, preview the code, and explore a real practical application.'
 rows.append({'slide':1,'segments':[cue(1,'1-1',cover,[{'rect':[95,675,1130,158],'text':'Claude Agent SDK'}])]})
 rows.append({'slide':2,'segments':[cue(2,cid,text,[next(b for b in g[1]['rects'] if b['id']==f'lecture-{num}') for num in nums]) for cid,nums,text in indexnarr]})
 for n,s in enumerate(slides,3):
  segments=[]
  for i,card in enumerate(s['cards'],1):
   cid=f'{n}-{i}';boxes=[b for b in g[n-1]['rects'] if b['id'] in [cid+'-explanation',cid+'-code']];assert len(boxes)==2
   segments.append(cue(n,cid,card[2],boxes))
  rows.append({'slide':n,'segments':segments})
 source=P/'infographics.html';prefix='Claude-Agent-SDK-Course-Index-Code-Intro-v5'
 plan={'project':NAME,'title':'Claude Agent SDK: Course Index and Code Preview','displayTitle':'Claude Agent SDK - Course Index and Code Preview','mediaPrefix':prefix,'presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputFile':prefix+'.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
 (V/'narration-script.txt').write_text('\n\n'.join(c['text'] for row in rows for c in row['segments']),encoding='utf8')
 print('Prepared',len(audit),'narrated passages.')
