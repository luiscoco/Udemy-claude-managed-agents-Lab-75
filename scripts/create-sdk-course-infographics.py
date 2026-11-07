"""Author five curriculum infographics and an intro using the supplied course cover."""
from pathlib import Path
import html,json,shutil
import hashlib
from plan_lab_settings import SETTINGS
ROOT=Path(__file__).resolve().parents[1]
NAME='agent-sdk-course-concepts-and-app-v4'
P=ROOT/'presentations'/NAME; V=ROOT/'videos'/NAME
P.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
shutil.copy2(Path('C:/Users/luis.coco/Downloads/Curso Claude Agent SDK Gratis.png'),P/'cover.png')
shutil.copy2(ROOT/'presentations/agent-sdk-free-course-promo-v2/assets/astronaut.png',P/'astronaut.png')
# Card headings, explanatory copy, narrated learning outcome, and line-icon motif.
slides=[
 dict(title='Your first <em>Claude Agent SDK</em> agent',pill='01 · The foundation map',sub='Understand the SDK. Prepare your project. Run a small, verifiable task.',lectures='LECTURES 1–2 · WHAT IS THE SDK? · PRACTICAL EXAMPLE 1: GETTING STARTED',goal='Build a small agent you can run, observe, and understand.',cards=[
 ('The SDK','Claude Code as a library','Embed its agent loop and tools in your own application.','Discover how the SDK brings Claude Code capabilities into your own application.','gear'),
 ('Your application','You operate the process','Choose the task, working directory, permissions, and interface.','See which responsibilities belong to your application, including the workspace and permissions.','shield'),
 ('The project','Install and configure','Prepare dependencies and authentication for your example.','Prepare the project dependencies and authentication before running the example.','wrench'),
 ('The workspace','Start with real files','Give the example a small, clearly defined working directory.','Use a small working directory so you can check what the agent actually finds.','folder'),
 ('The first run','Ask a focused question','Send a simple task and watch the SDK work.','Send a focused question and follow what happens during the first run.','play'),
 ('The evidence','Check the result','Compare the answer with the actual files and run outcome.','Compare the answer with the real files and confirm the final outcome.','search')]),
 dict(title='From <em>query()</em> to the agent loop',pill='02 · One request, several decisions',sub='A task becomes a sequence of model decisions, tool calls, and results.',lectures='LECTURES 3–6 · FIRST query() · PRACTICAL EXAMPLES 2 AND 4 · AGENT LOOP',goal='Trace one query from its prompt to a verified final result.',cards=[
 ('Send the task','prompt + options','Call query() with your task and execution configuration.','Learn to invoke query with a prompt and the options for your example.','code'),
 ('Observe messages','An asynchronous stream','Use for await to consume messages as the run progresses.','Consume the asynchronous message stream instead of treating every message as a final answer.','message'),
 ('Claude decides','Text or tool use','The model evaluates the task and chooses its next action.','Follow how Claude evaluates the task and chooses text or a tool call.','gear'),
 ('The SDK acts','Tools perform the work','Permitted tools run and return observations to the loop.','Watch permitted tools perform work and feed their observations back into the loop.','wrench'),
 ('The loop repeats','Observe → decide → act','New tool results inform the next model decision.','See why one query can require several tool calls and model decisions.','loop'),
 ('Inspect completion','Read the result message','Separate assistant output from the final run outcome.','Inspect the result message to distinguish generated text from the completed run outcome.','check')]),
 dict(title='Read the <em>agent message types</em>',pill='03 · Understand the signals',sub='Different messages answer different questions about the same run.',lectures='LECTURES 7–8 · UNDERSTANDING MESSAGE TYPES · PRACTICAL EXAMPLE 5',goal='Render useful progress while checking how the run actually ended.',cards=[
 ('Initialization','system · init','Session metadata describes the environment that started.','Recognize initialization metadata and connect it to the environment that started the run.','gear'),
 ('Assistant output','assistant','Content can contain text and requests to use tools.','Read assistant content as text, tool requests, or a combination of both.','message'),
 ('Tool feedback','user · tool_result','Tool results feed observations back into the conversation.','Recognize tool feedback within user messages, rather than confusing it with a new human prompt.','wrench'),
 ('Partial output','stream_event · optional','Incremental events can support a more responsive interface.','Explore optional incremental events when your application needs to display output as it arrives.','play'),
 ('The run outcome','result','Inspect success or failure, usage, cost, and session details.','Check the final result for the run outcome and reported usage and cost.','check'),
 ('The practical view','Trace → interpret → display','Connect message types to the UI and example source code.','Map these messages to the practical example, its interface, and the source code.','search')]),
 dict(title='Manage <em>context and compaction</em>',pill='04 · Keep the task in focus',sub='The context window is finite. Longer work needs deliberate context management.',lectures='LECTURES 9–10 · CONTEXT WINDOW AND COMPACTION · PRACTICAL EXAMPLE 6',goal='Understand how longer tasks continue within a finite context window.',cards=[
 ('The window','A finite working context','Instructions, conversation, and tool output share available space.','Understand how instructions, conversation, and tool outputs occupy the available context.','folder'),
 ('Growing history','Each action adds information','Long conversations and large tool outputs increase context pressure.','See how longer conversations and tool outputs increase pressure on that finite window.','message'),
 ('Compaction','Condense earlier context','The runtime can summarize prior work as context grows.','Learn how compaction condenses earlier work as the conversation grows.','layers'),
 ('Useful continuity','Keep important task details','A summary helps continuation, but is not a full transcript.','Understand that a compaction summary supports continuation without preserving every original detail.','loop'),
 ('Focused inputs','Keep the task relevant','Use clear instructions and avoid unnecessary output.','Practice keeping instructions and tool output relevant to the task you are solving.','shield'),
 ('The experiment','Observe a longer run','Compare the behavior and evidence in the practical example.','Use the practical example to observe context management and connect the behavior to the concept.','search')]),
 dict(title='Configure <em>and control</em> the agent',pill='05 · Make execution deliberate',sub='Section 2 turns the options object into understandable execution choices.',lectures='LECTURES 11–13 · PRACTICAL EXAMPLES 9, 10 AND 11',goal='Now see these ideas in a real application, from setup to verified output.',cards=[
 ('Options object','Configure with intent','Group the settings that shape each query() run.','Build an options object whose settings match the task you want the agent to perform.','code'),
 ('Tools and workspace','cwd · tools · permissions','Choose where the agent works and which actions are permitted.','Choose the working directory, available tools, and permission behavior for the example.','shield'),
 ('Model choice','Match the work','Explore model selection for your application needs.','Explore model choices and connect them to the needs of your application.','gear'),
 ('Effort and environment','Reasoning and runtime','Explore supported effort settings and environment configuration.','Explore supported effort settings and the environment that runs your agent.','wrench'),
 ('Execution limits','maxTurns · maxBudgetUsd','Set turn and estimated-spend limits; inspect the outcome.','Set turn and estimated spending limits, then inspect the outcome rather than assuming success.','check'),
 ('The practical example','See the whole application','Setup → architecture → code → real query → verified result.','Now take the complete application tour: setup, architecture, code, a real query, and its verified result.','play')]),
]
icons={
 'gear':'<path d="M25 8h14l3 9 9 4 8-2 7 12-6 7 1 10 5 6-7 12-9-2-8 5-3 9H25l-3-9-9-4-8 2-7-12 6-7-1-10-5-6 7-12 9 2 8-5z" transform="translate(8 -5) scale(.8)"/><circle cx="32" cy="32" r="10"/>',
 'shield':'<path d="M32 5 56 16v19c0 13-24 25-24 25S8 48 8 35V16z"/><path d="m19 32 9 9 18-20"/>',
 'wrench':'<path d="M40 8a17 17 0 0 0-19 23L6 47a8 8 0 0 0 11 11l16-16A17 17 0 0 0 56 22L44 34l-13-3-3-12z"/>',
 'folder':'<path d="M5 17h23l7 7h24v32H5z"/><path d="M5 24V10h21l7 7h26v7"/>',
 'play':'<circle cx="32" cy="32" r="26"/><path d="m25 18 19 14-19 14z"/>',
 'search':'<circle cx="26" cy="26" r="20"/><path d="m41 41 20 20"/>',
 'code':'<path d="m23 16-17 16 17 16m18-32 17 16-17 16M37 9 27 55"/>',
 'message':'<path d="M9 8h46v36H29L15 57V44H9z"/><path d="M19 21h26M19 31h18"/>',
 'loop':'<path d="M53 23A23 23 0 0 0 12 15L4 24m0-16v16h16M11 41a23 23 0 0 0 41 8l8-9m0 16V40H44"/>',
 'check':'<circle cx="32" cy="32" r="26"/><path d="m17 32 10 11 21-24"/>',
 'layers':'<path d="m4 18 28-13 28 13-28 14zm0 14 28 14 28-14M4 46l28 14 28-14"/>',
}
colors=['#087fff','#00a977','#8838ff','#f58a00','#ee147e','#087fff']
fills=['#eff8ff','#edfbf5','#f6f1ff','#fff6ed','#fff1f8','#eff8ff']
style='''*{box-sizing:border-box}body{margin:0;background:#dce4ec;font-family:Arial,sans-serif;color:#090d3b}.slide{width:1920px;height:1080px;position:relative;overflow:hidden;display:none;background:radial-gradient(ellipse at 98% 2%,#deefff 0,transparent 30%),radial-gradient(ellipse at 1% 98%,#fff1e5 0,transparent 25%),white;padding:54px 64px}.slide.active{display:block}h1{font-size:51px;letter-spacing:-1.6px;margin:0 170px 20px 0;line-height:1.12}em{color:#ff4d14;font-style:normal}.pill{display:inline-block;padding:11px 24px;border-radius:40px;background:#e6f5ff;font-size:35px;font-weight:800}.sub{font-size:28px;margin:16px 0 28px}.astronaut{position:absolute;right:86px;top:28px;height:208px;width:auto}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.card{height:286px;background:var(--fill);border:1px solid #deebf6;border-radius:30px;box-shadow:inset 0 0 0 4px #ffffffa0;padding:26px 28px}.heading{display:flex;align-items:center;gap:16px}.num{background:var(--color);color:white;font-size:32px;font-weight:800;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;box-shadow:0 3px 5px #10213b22}.heading h2{font-size:32px;letter-spacing:-.6px;margin:0;line-height:1.15}.detail{display:flex;gap:24px;margin-top:23px;align-items:flex-start}.icon{width:74px;height:74px;flex-shrink:0;color:var(--color);margin-top:8px}.copy h3{font-size:28px;margin:0 0 12px;font-weight:700;line-height:1.15}.copy p{font-size:27px;line-height:1.35;margin:0;max-width:405px}.takeaway{position:absolute;bottom:77px;left:64px;right:64px;border-radius:28px;background:#e9f7ff;padding:20px 28px;text-align:center;font-size:27px;font-weight:700}.star{color:#ffb000;font-size:32px;margin-right:16px}.footer{position:absolute;left:70px;bottom:28px;font-size:17px;letter-spacing:.6px;color:#557596}.page{position:absolute;right:68px;bottom:28px;color:#087fff;font-weight:700;font-size:19px}.cover{padding:0;background:white}.cover img{width:100%;height:100%;object-fit:contain}'''
parts=['<!doctype html><meta charset="utf-8"><title>Claude Agent SDK · Course concepts</title><style>'+style+'</style><section class="slide cover active" data-slide="1"><img src="cover.png"></section>']
for n,s in enumerate(slides,2):
 parts.append(f'<section class="slide" data-slide="{n}"><img class="astronaut" src="astronaut.png"><h1>{s["title"]}</h1><div class="pill">{s["pill"]}</div><p class="sub">{s["sub"]}</p><div class="grid">')
 for i,(head,title,body,narr,icon) in enumerate(s['cards']):
  parts.append(f'<article class="card" style="--color:{colors[i]};--fill:{fills[i]}"><div class="heading"><span class="num">{i+1}</span><h2>{head}</h2></div><div class="detail"><svg class="icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">{icons[icon]}</svg><div class="copy" data-cue="{n}-{i+1}"><h3>{html.escape(title)}</h3><p>{html.escape(body)}</p></div></div></article>')
 parts.append(f'</div><div class="takeaway"><span class="star">★</span>{s["goal"]}</div><footer class="footer">{s["lectures"]}</footer><span class="page">{n-1:02} / 05</span></section>')
parts.append('''<script>window.showSlide=n=>{document.querySelectorAll('.slide').forEach(s=>s.classList.toggle('active',Number(s.dataset.slide)===n))};document.addEventListener('keydown',e=>{let n=Number(document.querySelector('.active').dataset.slide);showSlide(Math.min(6,Math.max(1,n+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))))});</script>''')
(P/'infographics.html').write_text('\n'.join(parts),encoding='utf8')
(P/'curriculum.json').write_text(json.dumps(slides,indent=2),encoding='utf8')
(P/'sources.txt').write_text('Curriculum: instructor-provided 13 teaching lectures.\nVisuals: supplied course cover and original astronaut reference asset.\nTechnical review: https://code.claude.com/docs/en/agent-sdk/overview\nhttps://code.claude.com/docs/en/agent-sdk/agent-loop\nhttps://code.claude.com/docs/en/agent-sdk/typescript\nNo Managed Agents session API concepts are used. Execution budget is an estimated-spend limit, not an exact billing guarantee.\n',encoding='utf8')
print('Authored cover and five curriculum infographics:',P)
geometry=P/'.build/video/slides/geometry.json'
if geometry.exists():
 rows=[];audit=[];g=json.loads(geometry.read_text(encoding='utf8'));images=P/'images';images.mkdir(exist_ok=True)
 for n in range(1,7):shutil.copy2(P/f'.build/video/slides/slide-{n:02}.png',images/f'{n:02}.png')
 covertext='Welcome to this free Claude Agent SDK course with Luis Coco Enriquez. Explore the core concepts and practical examples, then tour a real application.'
 target={'textRects':[[95,675,1130,158]],'paragraphGroups':[[0]]}
 rows.append({'slide':1,'segments':[{'id':'1-1','text':covertext,'target':target}]})
 audit.append({'slide':1,'cue':'1-1','narration':covertext,'visibleText':['Claude Agent SDK'],'selectionPolicy':'Course title on supplied cover'})
 for n,s in enumerate(slides,2):
  seg=[]
  for card,box in zip(s['cards'],g[n-1]['rects']):
   narration=card[3];target={'textRects':[box['rect']],'paragraphGroups':[[0]]};cid=box['id']
   seg.append({'id':cid,'text':narration,'target':target})
   audit.append({'slide':n,'cue':cid,'narration':narration,'visibleText':[box['text']],'selectionPolicy':'One complete card paragraph, measured from the browser DOM'})
  rows.append({'slide':n,'segments':seg})
 source=P/'infographics.html';prefix='Claude-Agent-SDK-Course-Concepts-Intro-v4'
 plan={'project':NAME,'title':'Claude Agent SDK: Course Concepts','displayTitle':'Claude Agent SDK - Course Concepts','mediaPrefix':prefix,'presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputFile':prefix+'.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
 (V/'narration-script.txt').write_text('\n\n'.join(c['text'] for r in rows for c in r['segments']),encoding='utf8')
 print('Prepared narration plan:',len(audit),'word-aligned sections')
