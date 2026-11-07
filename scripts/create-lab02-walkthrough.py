"""Lab 02 step-by-step walkthrough authored from real captures of the running platform (offline fixtures and three live runs)."""
from pathlib import Path
import ast,hashlib,html,json,re,shutil
from plan_lab_settings import SETTINGS
R=Path(__file__).resolve().parents[1];N='managed-agents-lab02-walkthrough';P=R/'presentations'/N;V=R/'videos'/N;A=P/'assets';A.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
TITLE='Lab 02 Step by Step: Session Options, Offline and Live'
CLONE=Path(r'C:\Students\Udemy-claude-managed-agents-Lab-75')
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert not e['errors'] and sum(r['mode']=='live' for r in e['runs'])==3 and 'deadline' in e['liveOutcome1'] and 'completed' in e['liveOutcome2'] and 'completed' in e['liveOutcome3'] and 'Live Managed Agents' in e['liveMode']
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
add('Lab 02 step by step',head('CLAUDE MANAGED AGENTS · LAB 02 · SESSION OPTIONS','Lab 02 Step by Step:<br>Session Options, Offline and Live')+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('lab-welcome','<h2>In this lab</h2><p>Request session options.<br>Compare requested and effective.<br>Test budget and deadline.<br>Change one variable live.</p>')+'<div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('lab-welcome','Welcome to Lab two, Session options. In this lecture, we will run the lab step by step on the real learning platform. You will learn how to control a dedicated session with model and system prompt overrides, a budget, text previews, and a local deadline. We will run the offline scenarios, make real live runs to Claude, and read the TypeScript code.')],'cover')
add('What you will learn',head('ONE SESSION PER EXPERIMENT','Change one variable at a time, then compare the evidence')+'<div class="grid four">'+card('ov-concepts','1 · CONCEPTS','Requested versus effective','Model and system prompt overrides<br>Budget, previews and local deadline')+card('ov-offline','2 · OFFLINE','Run the mock scenarios','Previews on and off<br>Budget reached · deadline expires')+card('ov-live','3 · LIVE','Three real runs','Deadline reached · system override<br>One variable changed each time')+card('ov-code','4 · CODE','Read the TypeScript','Request schema · router<br>Early 400 and 429 responses')+'</div><div class="banner">A local deadline proves only that your host stopped waiting. Remote state needs separate evidence.</div>',[
 ('ov-concepts','First, the concepts: the options you request, and the effective configuration the session actually received.'),
 ('ov-offline','Second, the offline scenarios: previews on and off, a budget that is reached, and a local deadline that expires.'),
 ('ov-live','Third, three real live runs, changing one variable at a time: the local deadline and the system prompt.'),
 ('ov-code','Finally, the TypeScript code that validates the request and decides which responses return early.')])
shot('lesson','Open Lab 02',{
 'lesson-title':'Open Lab zero two, Session options, in the Managed Agents fundamentals group.',
 'lesson-objective':'The objective: control a dedicated Managed Agents session with model and system overrides, a list-cost budget, connection previews, and a local deadline.'})
shot('learn','Start in the Learn tab',{
 'learn-objective':'The Learn tab repeats the objective and walks you through the lab path. Read it before you change any option.'})
for n,t,text in [(1,'The objective','Open the Concept map. Region one, the objective: each experiment creates a dedicated session, with the options you choose for that session only.'),
 (2,'Core rule','Region two, the core rule. What does a local deadline prove? Only that the host stopped waiting locally. It does not prove that the remote session stopped.'),
 (4,'How the flow works','Region four, how the flow works: run normal completion offline, then change one option, such as disabling previews, while keeping the prompt and model fixed. Then compare the requested options with the effective session snapshot.'),
 (6,'Put it to the test','Region six, put it to the test: reduce the budget or the local deadline, and explain which limit produced the outcome, and whether remote execution was confirmed stopped.')]:
 shot(f'concepts-{n}',f'Concept map · {t}',{f'concepts-{n}-region':text})
for n,t,text in [(1,'Prepare the baseline','The Lab walkthrough turns this into steps. Step one, prepare the baseline: run normal completion offline, then disable previews while keeping the prompt and model fixed.'),
 (2,'Run the comparison','Step two, run the comparison: compare the requested options with the effective configuration returned when the session was created.'),
 (3,'Inspect the boundary','Step three, inspect the boundary: run Budget reached and Deadline expires, and distinguish paused work from a local timeout.')]:
 shot(f'lab-{n}',f'Lab walkthrough · {t}',{f'lab-{n}-region':text})
shot('exercise','The requested session options',{
 'exercise-prompt':'Open Run the exercise. Keep the same prompt as Lab one, so you can compare results.',
 'exercise-model':'The Model selector chooses which Claude model this session uses. The lab always overrides the model explicitly.',
 'exercise-system':'The System prompt selector has three choices: inherit the agent\'s own system prompt, override it with your text, or clear it.'})
shot('options','Budget, previews and deadline',{
 'options-budget':'The session budget is set in US cents: fifty cents here, with a maximum of five dollars. It is list cost, which can differ from what you are billed.',
 'options-previews':'Text previews controls whether streaming previews are sent on this connection.',
 'options-deadline':'And the local deadline limits how long your host waits. When it expires, the host attempts an interruption, but it does not limit the model requests themselves.'})
shot('normal-config','Offline · Requested versus effective',{
 'normal-requested':'Run the Normal turn offline fixture. Panel one now shows two snapshots. First, the requested options you sent: prompt, model, system choice, budget, previews, and deadline.',
 'normal-effective':'Second, the effective configuration from session creation: the model, the system prompt, the budget, and the tools that the session really received. Always compare the two.'})
shot('normal-outcome','Offline · The baseline completes',{
 'normal-lifecycle':'The lifecycle events show the same contract as Lab one: running, then idle with end turn.',
 'normal-result':'The outcome is completed. This is your baseline.'})
shot('table-previews','Offline · The experiment table',{
 'table-row1':'Now uncheck Text previews and run the same fixture again. The experiment table records every run. Row one is the baseline, with previews on.',
 'table-row2':'Row two changed only one variable, previews off, and the outcome is still completed. The table makes one-variable comparisons easy to read.'})
shot('budget-reached','Offline · Budget reached',{
 'budget-reached-outcome':'Next, choose Idle, budget reached. The outcome is paused, budget reached: the turn did not finish and needs attention.',
 'budget-reached-detail':'A paused turn is not a success. The budget is checked between model requests, so a session can stop before completing its work.'})
shot('deadline','Offline · Deadline expires',{
 'deadline-outcome':'Then choose Deadline expires. The local deadline expired before the turn was confirmed finished.',
 'deadline-detail':'Notice the interruption and cleanup line. In this fixture they are simulated. In a live run, you need real evidence that the remote session stopped.'})
shot('live-disabled','Live · Setup is not ready yet',{
 'live-unavailable':'Now let us use the real model. With live mode disabled, Run live does not call Claude.',
 'live-instructions':'As in Lab one, set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend.'})
raw=clean((P/'terminal/restart-dev.raw.txt').read_text(encoding='utf-8')).split('\n')
dev=['PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> # MANAGED_LIVE_ENABLED=true saved in .env; restart:','PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> npm.cmd run dev']+[x for x in raw if x.strip() not in ('','[web]','[server]') and not x.strip().startswith(('[web] >','[server] >'))]
terminal('Live · Enable live mode and restart',[(l,'restart-cmd' if l.endswith('npm.cmd run dev') else 'restart-ready' if 'Backend ready' in l else None) for l in dev],{
 'restart-cmd':'After saving MANAGED underscore LIVE underscore ENABLED equals true, stop the platform with Control C and run npm dot cmd run dev again.',
 'restart-ready':'When the backend is ready, refresh the browser.'})
shot('live-ready','Live · Run 1 with the default options',{
 'live-ready-text':'The exercise now says live setup is ready.',
 'live-run':'For run one, keep every default option: the system prompt is inherited, the budget is fifty cents, and the local deadline is five seconds. Click Run live.'})
shot('live-effective','Live · Run 1 effective configuration',{
 'live-effective-json':'The effective configuration comes from the real session. The model is overridden, and the system prompt is inherited from the agent: you teach Claude Managed Agents, and keep answers brief.',
 'live-effective-line':'The effective budget is fifty US cents, and the line confirms: model overridden, system inherited.'},note='LIVE RUN · IDS PARTLY HIDDEN')
shot('live-answer','Live · Run 1 hits the local deadline',{
 'live-answer-text':'But look at the agent text: an incomplete preview that never received its agent message. Claude was still writing when the five-second local deadline expired. The platform then sent an interruption, which was confirmed, and archived the session.'},note='LIVE RUN')
shot('live-usage','Live · Reported token usage',{
 'live-usage-json':'Reported token usage is empty for this run.',
 'live-usage-note':'That is expected: usage is reported only from model request end events received on this connection, and the turn was interrupted before those arrived. Preview text is not a token measurement.'},note='LIVE RUN')
shot('live-override','Live · Run 2 overrides the system prompt',{
 'override-choice':'For run two, change only the system prompt. Choose Override,',
 'override-text':'and type: answer in exactly one short sentence. Then click Run live again.'})
shot('live2-answer','Live · Run 2 answer',{
 'live2-answer-text':'This time the turn completed in about six seconds, and the answer is one sentence. But it says Claude has no reliable information about Managed Agents sessions. Why? Your override replaced the agent\'s own system prompt, so the teaching context disappeared. An override replaces; it does not add.'},note='LIVE RUN')
shot('live-table','Live · Compare the two live runs',{
 'live-table-row1':'The experiment table now shows both live runs. Row one: system inherited, outcome deadline.',
 'live-table-row2':'Row two: system overridden, outcome completed. Strictly speaking, these two rows differ in more than the system prompt, because run one also hit the deadline. So let us run one more clean comparison.'},note='LIVE RUN')
shot('live3-deadline','Live · Run 3 raises only the deadline',{
 'deadline-input':'For run three, set the system prompt back to inherit and change only the local deadline, from five to sixty seconds.',
 'deadline-note':'The server allows up to one hundred and twenty seconds. Then click Run live.'})
shot('live3-answer','Live · Run 3 completes',{
 'live3-answer-text':'Now Claude finishes its answer with the inherited system prompt, and the authoritative agent message replaced its preview. Compared with run one, only the deadline changed, and that explains the different outcome.'},note='LIVE RUN')
shot('live3-outcome','Live · Run 3 outcome',{
 'live3-result':'The outcome is completed, end turn.',
 'live3-cleanup':'No interruption was needed, and the remote session was archived after the turn.'},note='LIVE RUN')
add('Three live runs, compared',head('ONE VARIABLE AT A TIME','What did each live run teach?')+'<div class="grid three">'+card('cmp-run1','RUN 1 · DEFAULTS','Deadline after 5 seconds','System inherited · deadline 5 s<br>Incomplete preview<br>Interruption confirmed')+card('cmp-run2','RUN 2 · SYSTEM OVERRIDE','The context was replaced','System overridden · completed<br>One sentence, without<br>the agent\'s teaching context')+card('cmp-run3','RUN 3 · DEADLINE 60 s','The clean comparison','System inherited · completed<br>Only the deadline changed<br>versus run 1')+'</div><div class="banner">Requested options are a request: always confirm them in the effective configuration and the outcome.</div>',[
 ('cmp-run1','Run one, with the default five-second deadline, stopped waiting before Claude finished, and the interruption was confirmed.'),
 ('cmp-run2','Run two, with an overridden system prompt, completed, but without the agent\'s teaching context.'),
 ('cmp-run3','And run three changed only the deadline compared with run one, and completed. That is the clean, one-variable comparison this lab teaches.')])
code=[(1,'Concept and dependencies','Now open the TypeScript source tab and play the code tour. Section one: the imports connect this main concept module to its request schema and the delegated implementation.'),
 (3,'POST /query','Section three is the query handler. It parses the request with the lab two request schema, then calls the live port or creates a fixture port. Its four hundred, four twenty-nine, and four twenty-two branches are the observable outcomes.'),
 (4,'Decision and early response','Section four checks whether the server is closing or has reached the maximum number of concurrent queries. If so, it returns four twenty-nine before any session is created.'),
 (5,'Decision and early response','Section five checks whether parsing failed. Invalid options, such as a budget above the maximum, return four hundred immediately.'),
 (6,'Return the module contract','Section six returns the router and its cleanup contract: on shutdown, cleanup aborts every controller and waits for all pending work to settle.')]
for n,t,text in code:
 shot(f'code-{n}',f'TypeScript · Section {n}: {t}',{f'code-{n}-section':text})
add('From query() options to session options',head('AGENT SDK · MANAGED AGENTS','Where is the options object?')+'<div class="grid three">'+card('map-sdk','CLAUDE AGENT SDK','query({ prompt, options })','model, systemPrompt, maxTurns,<br>maxBudgetUsd, partial messages<br>are local SDK options.')+card('map-managed','CLAUDE MANAGED AGENTS','sessions.create parameters','agent_with_overrides: model, system<br>budget: max_list_cost in cents<br>event_deltas on the stream')+card('map-rejected','NOT TRANSLATED','Rejected with HTTP 400','maxTurns, maxBudgetUsd and<br>includePartialMessages are<br>never forwarded or invented.')+'</div><div class="banner">The calls are in the supporting file server/lib/lab02-port.ts.</div>',[
 ('map-sdk','In the Agent SDK, you pass an options object to query, with the model, the system prompt, the maximum turns, and the maximum budget.'),
 ('map-managed','In Managed Agents there is no options object. Session options are parameters of sessions dot create: an agent with overrides for the model and system prompt, a budget limit in cents, and event deltas on the stream.'),
 ('map-rejected','Agent SDK-only options such as max turns and max budget in dollars are rejected with four hundred, never silently translated. Let us open the live port: server slash lib slash lab zero two dash port dot T S.')])
shot('port-overrides','Live port · Build the session options',{
 'port-overrides':'Here the session parameters are built: an agent of type agent with overrides, using your base agent ID, the model you chose, and the system prompt override or clear. Tools, MCP servers, and skills are emptied for this lab.',
 'port-budget':'The budget is a session limit on list cost, sent in US cents.'},note='PLATFORM SOURCE VIEWER')
shot('port-create','Live port · Create the session and read the effective options',{
 'port-retrieve':'Before creating anything, agents dot retrieve checks your base agent, and rejects a multiagent configuration.',
 'port-create':'Then sessions dot create sends the parameters. This single call is where your requested options take effect.',
 'port-effective':'And the effective configuration panel is built from the session creation response, not from your request. That is why requested and effective can differ. Streaming and sending then reuse the Lab one port.'},note='PLATFORM SOURCE VIEWER')
shot('knowledge','Check your understanding',{
 'knowledge-question':'Finish with the knowledge check: what does a local deadline prove?',
 'knowledge-feedback':'Correct: the host stopped waiting locally. Local waiting limits and remote session state require separate evidence, exactly as we saw in live run one.'})
add('Lab 02 summary',head('LAB 02 · SESSION OPTIONS','What you can now explain')+'<div class="grid three">'+card('sum-options','OPTIONS','Requested versus effective','Compare what you asked for<br>with what the session received.')+card('sum-limits','LIMITS','Budget and deadline','Budget reached means paused.<br>A local deadline stops waiting.')+card('sum-method','METHOD','One variable at a time','Use the experiment table<br>to compare runs fairly.')+'</div><div class="banner">Save a note in your notebook, tick your checklist, and continue with Lab 03 · Built-in tools.</div>',[
 ('sum-options','You can now compare the options you requested with the effective configuration the session actually received.'),
 ('sum-limits','You know that budget reached means a paused turn, and that a local deadline only proves your host stopped waiting.'),
 ('sum-method','And you practiced changing one variable at a time, with the experiment table as your evidence. Save a note, tick your checklist, and continue with Lab three.')])
tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:62px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:360px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.6}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px;margin-top:36px}.cover .badge small{font-size:21px;font-weight:normal}.four .card{min-height:250px}'''
css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:20px;color:#c3d9ec;letter-spacing:1px}.shotcue{position:absolute;opacity:0}
.termslide{background:#0b1622}.terms{position:absolute;left:60px;right:60px;top:130px;bottom:50px;display:flex;gap:30px}.term{flex:1;min-width:0;background:#012456;border:2px solid #3c6ea8;border-radius:12px;overflow:hidden}.term-title{background:#e8edf3;color:#1b2a3a;font:22px Arial;padding:10px 16px;display:flex;gap:8px;align-items:center}.term-title span{width:14px;height:14px;border-radius:50%;background:#b8c3cf;display:inline-block}.term pre{margin:0;padding:22px 26px;color:#eef3f8;font:25px/1.42 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.tl{display:block}.tl.cue{display:block;width:fit-content;max-width:100%}.ps{color:#f9f1a5;font-weight:normal}
.editor{position:absolute;left:60px;right:60px;top:130px;bottom:50px;background:#1f1f1f;border:2px solid #3a3a3a;border-radius:12px;overflow:hidden}.editor .tab{background:#181818;color:#e8e8e8;font:22px Arial;padding:12px 22px;border-bottom:1px solid #333}.editor pre{margin:0;padding:16px 0;color:#d4d4d4;font:24px/1.5 Consolas,monospace;white-space:pre}.el{display:block}.el.cue{display:block;width:fit-content}.ln{display:inline-block;width:70px;text-align:right;margin-right:26px;color:#6e7681}.editor i{color:#6a9955;font-style:normal}.editor b{color:#ce9178;font-weight:normal}'''
for i,s in enumerate(slides):
 count=f'{i+1:02} / {len(slides):02}'
 if 'shot' in s['class']:s['body']=s['body'].replace('{count}',count)
 else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · LAB 02 STEP BY STEP</span><span>{count}</span></div>'
source=P/'lab02-walkthrough.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(TITLE)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
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
 plan={'project':N,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Claude-Managed-Agents-Lab02-Step-by-Step','outputFile':'Claude-Managed-Agents-Lab02-Step-by-Step.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
words=sum(len(t.split()) for s in slides for _,t in s['segments'])
print(f'Authored {len(slides)} Lab 02 scenes; {words} narration words.')
