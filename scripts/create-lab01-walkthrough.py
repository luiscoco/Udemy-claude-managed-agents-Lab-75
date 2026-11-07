"""Lab 01 step-by-step walkthrough authored from real captures of the running platform (offline fixtures and one live run)."""
from pathlib import Path
import ast,hashlib,html,json,re,shutil
from plan_lab_settings import SETTINGS
R=Path(__file__).resolve().parents[1];N='managed-agents-lab01-walkthrough';P=R/'presentations'/N;V=R/'videos'/N;A=P/'assets';A.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
TITLE='Lab 01 Step by Step: Session Event Streaming, Offline and Live'
CLONE=Path(r'C:\Students\Udemy-claude-managed-agents-Lab-75')
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert not e['errors'] and sum(r['mode']=='live' for r in e['runs'])==1 and 'completed' in e['liveOutcome'] and 'Live Managed Agents' in e['liveMode']
shutil.copy2(R/'public/images/portal-welcome.png',A/'portal-welcome.png')
def clean(text):return re.sub(r'\x1b\[[0-9;]*m','',text).replace('\r','').lstrip('\ufeff')
def mask(text):return re.sub(r'(ANTHROPIC_API_KEY=)sk-ant-\S+',r'\1sk-ant-usr-•••••••••••• (key hidden)',re.sub(r'\b(agent|env)_(\w{6})\w+(\w{4})\b',lambda m:f'{m[1]}_{m[2]}••••••••{m[3]}',text))
slides=[]
def cue(cid,body):return f'<div class="cue" data-cue="{cid}">{body}</div>'
def head(tag,title):return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def card(cid,tag,title,body):return '<article class="card"><small>'+tag+'</small>'+cue(cid,f'<h2>{title}</h2><p>{body}</p>')+'</article>'
def add(title,body,segments,cls=''):slides.append({'title':title,'body':body,'segments':segments,'class':cls})
def bar(title,note):return f'<div class="bar top"><h1>{html.escape(title)}</h1><span>{note} · {{count}}</span></div>'
def shot(id,title,narration,note='LIVE APP CAPTURE'):
 s=next(s for s in e['shots'] if s['id']==id);cues={c['id']:c for c in s['cues']};assert set(cues)==set(narration),(id,set(cues))
 body=f'<img class="full" src="platform/{id}.png">'+bar(title,note)
 for cid in narration:
  x,y,w,h=cues[cid]['rect'];top=max(y,92);h-=top-y;body+=f'<div class="shotcue" data-cue="{cid}" data-visible="{html.escape(cues[cid]["text"],quote=True)}" style="left:{x}px;top:{top}px;width:{w}px;height:{h}px"></div>'
 add(title,body,list(narration.items()),'shot')
def terminal(title,lines,narration,note='REAL COMMAND OUTPUT'):
 body=bar(title,note)+'<div class="terms"><div class="term"><div class="term-title"><span></span><span></span><span></span>Windows PowerShell</div><pre>'
 for text,cid in lines:
  esc=html.escape(text) or ' ';esc=re.sub(r'^(PS [^&]*?&gt;)',r'<b class="ps">\1</b>',esc)
  body+=(f'<span class="tl cue" data-cue="{cid}">{esc}</span>' if cid else f'<span class="tl">{esc}</span>')
 add(title,body+'</pre></div></div>',list(narration.items()),'shot termslide')
def editor(title,path,label,narration,cues,first,last,note):
 lines=mask(path.read_text(encoding='utf-8')).split('\n')[first-1:last]
 body=bar(title,note)+f'<div class="editor"><div class="tab">⚙ {html.escape(label)}</div><pre>';used=set()
 for i,l in enumerate(lines,first):
  cid=next((c for c,pat in cues if c not in used and re.search(pat,l)),None)
  esc=html.escape(l) or ' ';esc=re.sub(r'^(#.*)$',r'<i>\1</i>',esc);esc=re.sub(r'^([A-Z0-9_]+)=',r'<b>\1</b>=',esc);row=f'<span class="ln">{i}</span>{esc}'
  if cid:used.add(cid);body+=f'<span class="el cue" data-cue="{cid}">{row}</span>'
  else:body+=f'<span class="el">{row}</span>'
 add(title,body+'</pre></div>',list(narration.items()),'shot termslide')
add('Lab 01 step by step',head('CLAUDE MANAGED AGENTS · LAB 01 · SESSION EVENT STREAMING','Lab 01 Step by Step:<br>Session Event Streaming, Offline and Live')+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('lab-welcome','<h2>In this lab</h2><p>Learn the event concepts.<br>Run the offline fixtures.<br>Make a real live run.<br>Read the TypeScript code.</p>')+'<div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('lab-welcome','Welcome to Lab one, Session event streaming. In this lecture, we will run the lab step by step on the real learning platform. You will learn the concepts behind a managed session, run the offline mock scenarios, make a real live call to Claude, and read the TypeScript code that implements it all.')],'cover')
add('What you will learn',head('ONE TURN · MANY EVENTS','A turn is finished by a lifecycle event, not by text')+'<div class="grid four">'+card('ov-concepts','1 · CONCEPTS','Read the event contract','Session identity · preview · message<br>Lifecycle evidence · explicit outcome')+card('ov-offline','2 · OFFLINE','Run the mock scenarios','Normal turn · repeated events<br>Stream ends early · session error')+card('ov-live','3 · LIVE','Call Claude for real','Enable live mode · restart<br>Run live · compare the evidence')+card('ov-code','4 · CODE','Read the TypeScript','Validation · execution ports<br>Deadlines · event stream · cleanup')+'</div><div class="banner">Offline fixtures are free authored data. A live run calls Claude and is billed to your account.</div>',[
 ('ov-concepts','First, you will learn the concepts: how a session streams events, which event carries the final answer, and which events tell you the turn is finished.'),
 ('ov-offline','Second, you will run the offline mock scenarios. They replay authored events, so they cost nothing and need no key.'),
 ('ov-live','Third, you will enable live mode and run the same exercise against the real Claude Managed Agents service.'),
 ('ov-code','Finally, you will connect what you saw to the TypeScript source code that validates the request, chooses the execution port, and streams the events.')])
shot('lesson','Open Lab 01',{
 'lesson-title':'Open the platform and select Lab zero one, Session event streaming, in the Managed Agents fundamentals group.',
 'lesson-objective':'Read the objective: consume a Managed Agents event stream, and tell the agent response text apart from session lifecycle events and turn completion.'})
shot('learn','Start in the Learn tab',{
 'learn-objective':'The Learn tab gives you your lab path. It repeats the objective and explains each step, with explanations you can expand.',
 'learn-baseline':'It also asks you to try a baseline and compare: run the normal scenario first, then change one thing at a time and compare the evidence.'})
regions=[('Session identity','The session panel identifies the session and its configuration. It is metadata, not the answer, and not proof that the current turn completed.'),
 ('Streaming preview','The text preview helps you follow a response as it streams. But a visible preview alone does not establish success. If the stream ends early, it may remain incomplete.'),
 ('Authoritative message','The authoritative agent message replaces its matching preview instead of being appended again, so the same answer is never displayed twice.'),
 ('Lifecycle evidence','Lifecycle events tell you when the session is running and when it becomes idle. Read the stop reason as well as the status: idle with end turn supports normal completion.'),
 ('Explicit outcome','Read the reported outcome independently from the answer text. A partial answer can coexist with an error or an incomplete stream.'),
 ('Execution boundary','An offline fixture teaches the event contract without calling a model. A live run is separate evidence and can incur charges.')]
for n,(t,text) in enumerate(regions,1):
 intro='Open the Concept map tab. This illustrated map has six regions. ' if n==1 else ''
 shot(f'concepts-{n}',f'Concept {n} of 6 · {t}',{f'concepts-{n}-region':intro+f'Region {n}, {t}. '+text})
for n,t,text in [(1,'Choose offline','Now open the Lab walkthrough tab, which turns the concepts into practical steps. Step one: choose the Normal turn offline scenario and keep the baseline prompt, so you can compare later results.'),
 (4,'Verify completion','Step four: verify completion. Inspect the idle lifecycle event, its stop reason, and the outcome panel together. Text appearing on its own is not the completion signal.'),
 (5,'Compare failures','Step five: compare failures. Change one offline scenario at a time. Repeated events test deduplication, stream ended shows incomplete evidence, and session error shows a failure even when some text has arrived.')]:
 shot(f'lab-{n}',f'Lab walkthrough · {t}',{f'lab-{n}-region':text})
shot('exercise','Prepare the exercise',{
 'exercise-prompt':'Now select Run the exercise. Keep the default prompt: give me three bullet points about Claude Managed Agents sessions.',
 'exercise-scenario':'The Offline scenario selector lists the mock scenarios. Start with Normal turn.',
 'exercise-run':'Click Run offline fixture. This replays authored events through the real backend route, without calling a model.'})
shot('normal-text','Offline · Session metadata and agent text',{
 'normal-mode':'The Mode line confirms this is an offline authored fixture: not a measurement of Claude.',
 'normal-session':'Panel one shows the session metadata: the session, agent, and environment. It comes from the session creation response, not from a stream event.',
 'normal-message':'Panel two shows the agent text. This is the authoritative agent message, and it replaced its streaming preview instead of being added twice.'})
shot('normal-outcome','Offline · Lifecycle events and outcome',{
 'normal-lifecycle':'Panel three lists the lifecycle and span events: the session starts running, the model request starts and ends, and the session becomes idle with stop reason end turn.',
 'normal-result':'Panel four derives the outcome from that evidence: completed, end turn. This is the expected result for the normal scenario.'})
shot('normal-raw','Offline · Raw session events',{
 'raw-summary':'Expand Raw events to see every event exactly as the stream delivered it.',
 'raw-code':'Each line is one JSON event with its type and identifier. When a summary panel raises a question, this raw evidence is where you look.'})
shot('repeated-events','Offline · Repeated events',{
 'repeated-events-outcome':'Now choose Repeated events and partial preview, and run it again. The outcome is still completed.',
 'repeated-events-detail':'But look at the details: two duplicates ignored. The platform deduplicates events by identifier, so a repeated event never shows the answer twice.'})
shot('stream-ended','Offline · The stream ends early',{
 'stream-ended-outcome':'Next, choose Stream ends early. This time the outcome is incomplete: the stream ended before the turn finished.',
 'stream-ended-detail':'Some text may already be visible, but without the idle lifecycle event, the turn cannot be called complete.'})
shot('session-error','Offline · Session error',{
 'session-error-outcome':'Then choose Session error. The outcome is error, reported by the session itself.',
 'session-error-detail':'This shows why you always read the outcome separately from the text: a failure can happen even after part of an answer has arrived.'})
shot('live-disabled','Live · Setup is not ready yet',{
 'live-unavailable':'Now let us try the real model. Click Run live. Because live mode is disabled, the platform does not call Claude. It says live setup unavailable.',
 'live-instructions':'The setup instructions explain why: MANAGED underscore LIVE underscore ENABLED is not true. Set it on the server, restart the backend, and check again.'})
editor('Live · Enable live mode in .env',CLONE/'.env','.env',{
 'env-live':'Open your dot env file. You already pasted your API key and your agent and environment IDs in the installation lecture. Now change MANAGED underscore LIVE underscore ENABLED to true, and save.',
 'env-budget':'The budget setting caps the cost of each live session, and the deadline setting limits how long a turn may run. Live runs are billed to your Anthropic account.'},[('env-live',r'^MANAGED_LIVE_ENABLED='),('env-budget',r'^MANAGED_BUDGET_CENTS=')],1,19,'REAL FILE · KEY AND IDS HIDDEN')
raw=clean((P/'terminal/restart-dev.raw.txt').read_text(encoding='utf-8')).split('\n')
dev=['PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> # Ctrl+C stopped the platform; start it again:','PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> npm.cmd run dev']+[x for x in raw if x.strip() not in ('','[web]','[server]') and not x.strip().startswith(('[web] >','[server] >'))]
terminal('Live · Restart the platform',[(l,'restart-cmd' if l.endswith('npm.cmd run dev') else 'restart-ready' if 'Backend ready' in l else None) for l in dev],{
 'restart-cmd':'The backend reads dot env only when it starts. Press Control C in the PowerShell window, wait for it to stop, then run npm dot cmd run dev again.',
 'restart-ready':'Wait for Backend ready, then refresh the browser.'})
shot('live-ready','Live · Setup is ready',{
 'live-ready-text':'Back in the exercise, the platform now says live setup is ready.',
 'live-prompt':'Keep the same prompt, so you can compare the live result with the offline fixture, and click Run live.'})
shot('live-text','Live · A real session',{
 'live-mode':'The Mode line now says Live Managed Agents: billed API execution. This is real Claude, not an authored fixture.',
 'live-session':'Panel one shows the real session that was created for this turn, using your agent and environment. I have hidden part of each identifier.',
 'live-message':'And panel two shows the authoritative agent message, which again replaced its streaming preview.'},note='LIVE RUN · IDS PARTLY HIDDEN')
shot('live-answer','Live · Claude answers',{
 'live-answer-text':'Here is the real answer from Claude: three bullet points. A session is a running instance of an agent; sessions are stateful; and interaction is event-based. The whole turn took about nine seconds.'},note='LIVE RUN')
shot('live-outcome','Live · Lifecycle and outcome',{
 'live-lifecycle':'The live lifecycle events follow the same contract as the fixture: running, model request start, model request end with three hundred and seventy-six output tokens, and idle with stop reason end turn.',
 'live-result':'The outcome is completed. Notice one real difference: session cleanup now says archived. The platform archived the remote session after the turn, while the offline fixture only simulated cleanup.'},note='LIVE RUN')
add('Offline and live, compared',head('SAME CONTRACT · DIFFERENT EVIDENCE','What changed between offline and live?')+'<div class="grid three">'+card('cmp-offline','OFFLINE FIXTURE','Authored teaching data','No key, no cost, repeatable<br>Covers failure scenarios<br>Cleanup is simulated')+card('cmp-live','LIVE RUN','Real Claude evidence','Billed API execution<br>Real session and token counts<br>Remote session archived')+card('cmp-same','THE SAME CONTRACT','Read the same panels','Authoritative agent.message<br>Lifecycle events and stop reason<br>Explicit turn outcome')+'</div><div class="banner">Use offline runs to learn and test failures; use live runs to confirm real behavior.</div>',[
 ('cmp-offline','Offline fixtures are free, repeatable, and let you test failures such as early stream endings and session errors.'),
 ('cmp-live','A live run is real evidence from Claude, with a real session, real token counts, and real remote cleanup, and it is billed.'),
 ('cmp-same','In both cases, you read the same evidence: the authoritative message, the lifecycle events with their stop reason, and the explicit outcome.')])
code=[(1,'Schemas, ports and the runner','Now open the TypeScript source tab and play the code tour. Section one, lines one to nine: the file separates request validation, execution ports, and the runner. Fixture and live ports share the same boundary.'),
 (3,'Validate input and reject overload','Section three validates the input. The query accepts strict JSON up to eight kilobytes. Invalid input returns four hundred, and too many concurrent queries return four twenty-nine, before any execution port is chosen.'),
 (4,'Choose the execution port','Section four chooses the execution port. This is where offline and live split: live mode calls the injected live port, otherwise a fixture port replays the selected scenario. Offline evidence and live observations stay distinct.'),
 (5,'Deadlines and the event stream','Section five sets the deadlines and opens the event stream. An abort controller carries cancellation, and the host deadline leaves time for cleanup before the stream closes.'),
 (6,'Progress, result and error flow','Section six runs the turn. The emit callback sends each progress frame to the browser, the result is sent only if the request was not aborted, and a failure sends an error before the stream ends.')]
for n,t,text in code:
 shot(f'code-{n}',f'TypeScript · Section {n}: {t}',{f'code-{n}-section':text})
add('From query() to Managed Agents',head('AGENT SDK · MANAGED AGENTS · THIS PLATFORM','Where is the query() call?')+'<div class="grid three">'+card('map-sdk','CLAUDE AGENT SDK','query({ prompt, options })','Runs the agent loop<br>in your own process.<br>Not used in this course.')+card('map-managed','CLAUDE MANAGED AGENTS','One turn = a few API calls','sessions.create<br>sessions.events.stream<br>sessions.events.send')+card('map-local','THIS PLATFORM','“query” is a local name','POST /api/c1/query is our route.<br>The calls live in the supporting<br>file server/lib/lab01-port.ts.')+'</div><div class="banner">The narrated concept file chooses the execution port. The live port makes the real API calls.</div>',[
 ('map-sdk','If you know the Claude Agent SDK, you may look for a query function in this lab. The Agent SDK runs the agent loop inside your own process, and this course does not use it.'),
 ('map-managed','With Claude Managed Agents, Anthropic runs the agent loop in a hosted session. One turn is a sequence of API calls: create a session, open its event stream, and send the user message.'),
 ('map-local','In this platform, query is only the name of our local route. The real calls are in a supporting file that the code tour does not narrate: server slash lib slash lab zero one dash port dot T S. Let us open it.')])
shot('port-create','Live port · Create the session',{
 'port-create':'In the TypeScript source tab, choose this file in the Source file selector. Here, sessions dot create creates the session with your agent ID, your environment ID, a title, and a budget limit whose amount is in US cents.',
 'port-budget-label':'This line formats that budget for the session panel. In the recordings you saw earlier it read fifty USD; it has since been corrected to show fifty US cents.'},note='PLATFORM SOURCE VIEWER')
shot('port-stream','Live port · Stream, send and clean up',{
 'port-stream':'Next, sessions dot events dot stream opens the event stream first, asking for agent message deltas, which become the previews you saw.',
 'port-send':'Only then does sessions dot events dot send deliver your prompt as a user dot message event. Opening the stream before sending means no event can be missed.',
 'port-cleanup':'Finally, interrupt sends a user dot interrupt event, status retrieves the session, and archive cleans it up. These produce the interruption and cleanup lines in the outcome panel.'},note='PLATFORM SOURCE VIEWER')
shot('knowledge','Check your understanding',{
 'knowledge-question':'Finish with the knowledge check: what establishes turn completion?',
 'knowledge-feedback':'The correct answer is the reported turn outcome and lifecycle evidence, because response text can arrive before the turn reaches its outcome.'})
add('Lab 01 summary',head('LAB 01 · SESSION EVENT STREAMING','What you can now explain')+'<div class="grid three">'+card('sum-events','EVENTS','Text versus status','The agent.message carries the answer.<br>Lifecycle events carry the status.')+card('sum-outcome','OUTCOME','Completion has evidence','Idle with end_turn means completed.<br>Incomplete and error are not success.')+card('sum-practice','PRACTICE','Offline first, then live','Fixtures teach the contract.<br>Live runs confirm real behavior.')+'</div><div class="banner">Save a note in your notebook, tick your checklist, and continue with Lab 02 · Session options.</div>',[
 ('sum-events','You can now tell the answer text apart from the lifecycle events: the authoritative agent message carries the answer, and lifecycle events carry the status.'),
 ('sum-outcome','You know that completion needs evidence: idle with stop reason end turn. Incomplete and error outcomes are not success, even when some text arrived.'),
 ('sum-practice','And you practiced both ways: offline fixtures to learn the contract, and a live run to confirm real behavior. Save a note in your notebook, tick your checklist, and continue with Lab two.')])
tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:62px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:360px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.6}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px;margin-top:36px}.cover .badge small{font-size:21px;font-weight:normal}.four .card{min-height:250px}'''
css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:20px;color:#c3d9ec;letter-spacing:1px}.shotcue{position:absolute;opacity:0}
.termslide{background:#0b1622}.terms{position:absolute;left:60px;right:60px;top:130px;bottom:50px;display:flex;gap:30px}.term{flex:1;min-width:0;background:#012456;border:2px solid #3c6ea8;border-radius:12px;overflow:hidden}.term-title{background:#e8edf3;color:#1b2a3a;font:22px Arial;padding:10px 16px;display:flex;gap:8px;align-items:center}.term-title span{width:14px;height:14px;border-radius:50%;background:#b8c3cf;display:inline-block}.term pre{margin:0;padding:22px 26px;color:#eef3f8;font:25px/1.42 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.tl{display:block}.tl.cue{display:block;width:fit-content;max-width:100%}.ps{color:#f9f1a5;font-weight:normal}
.editor{position:absolute;left:60px;right:60px;top:130px;bottom:50px;background:#1f1f1f;border:2px solid #3a3a3a;border-radius:12px;overflow:hidden}.editor .tab{background:#181818;color:#e8e8e8;font:22px Arial;padding:12px 22px;border-bottom:1px solid #333}.editor pre{margin:0;padding:16px 0;color:#d4d4d4;font:24px/1.5 Consolas,monospace;white-space:pre}.el{display:block}.el.cue{display:block;width:fit-content}.ln{display:inline-block;width:70px;text-align:right;margin-right:26px;color:#6e7681}.editor i{color:#6a9955;font-style:normal}.editor b{color:#ce9178;font-weight:normal}'''
for i,s in enumerate(slides):
 count=f'{i+1:02} / {len(slides):02}'
 if 'shot' in s['class']:s['body']=s['body'].replace('{count}',count)
 else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · LAB 01 STEP BY STEP</span><span>{count}</span></div>'
source=P/'lab01-walkthrough.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(TITLE)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
page=source.read_text(encoding='utf-8');assert 'sk-ant-usr-1' not in page and not re.search(r'(agent|env)_\w{20}',page)
(P/'storyboard.json').write_text(json.dumps(slides,indent=2),encoding='utf-8');(V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {s["title"]}\n'+' '.join(t for _,t in s['segments']) for i,s in enumerate(slides)),encoding='utf-8')
geom=P/'.build/video/slides/geometry.json'
if geom.exists():
 g=json.loads(geom.read_text(encoding='utf-8'));rows=[];audit=[]
 for i,s in enumerate(slides):
  segments=[]
  for cid,t in s['segments']:
   b=next(b for b in g[i]['rects'] if b['id']==cid);segments.append({'id':cid,'text':t,'target':{'textRects':[b['rect']],'paragraphGroups':[[0]]}});audit.append({'slide':i+1,'cue':cid,'narration':t,'visibleText':[b['text']]})
  rows.append({'slide':i+1,'segments':segments})
 plan={'project':N,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Claude-Managed-Agents-Lab01-Step-by-Step','outputFile':'Claude-Managed-Agents-Lab01-Step-by-Step.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
words=sum(len(t.split()) for s in slides for _,t in s['segments'])
print(f'Authored {len(slides)} Lab 01 scenes; {words} narration words.')
