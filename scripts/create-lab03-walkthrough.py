"""Lab 03 step-by-step walkthrough authored from real captures of the running platform (offline presets and two live runs)."""
from pathlib import Path
import ast,hashlib,html,json,re,shutil
from plan_lab_settings import SETTINGS
R=Path(__file__).resolve().parents[1];N='managed-agents-lab03-walkthrough';P=R/'presentations'/N;V=R/'videos'/N;A=P/'assets';A.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
TITLE='Lab 03 Step by Step: Built-in Tools, Offline and Live'
CLONE=Path(r'C:\Students\Udemy-claude-managed-agents-Lab-75')
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert not e['errors'] and all('completed' in e[f'live_{p}']['outcome'] for p in ('denied-write','permitted-edit')) and 'Denied write' in e['live_denied-write']['denials']
assert e['live_permitted-edit']['outputs'].startswith('Outputs: downloaded') and 'Status: reviewed' in e['live_permitted_edit_draft'],'Live outputs must be verified on disk'
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
add('Lab 03 step by step',head('CLAUDE MANAGED AGENTS · LAB 03 · BUILT-IN TOOLS','Lab 03 Step by Step:<br>Built-in Tools, Offline and Live')+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('lab-welcome','<h2>In this lab</h2><p>Enabled is not permitted.<br>Compare five tool presets.<br>Watch the host decide.<br>Verify effects in files.</p>')+'<div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('lab-welcome','Welcome to Lab three, Built-in tools. In this lecture, we will run the lab step by step on the real learning platform. You will learn the difference between a tool being enabled and a tool call being permitted, watch the host approve and deny real tool calls, and learn to verify effects in files instead of trusting what the agent says.')],'cover')
add('What you will learn',head('ENABLED · PERMITTED · OBSERVED','Availability, permission and observed effects are distinct')+'<div class="grid four">'+card('ov-concepts','1 · CONCEPTS','The session toolset','Enabled tools and permission policies<br>The host answers confirmations')+card('ov-offline','2 · OFFLINE','Four presets','Read-only · Unavailable Write<br>Denied Write · Permitted edit')+card('ov-live','3 · LIVE','Two real runs','Denied Write · Permitted edit<br>Real tool calls in the container')+card('ov-code','4 · CODE','Read the TypeScript','Sandbox reset · query handler<br>Early 400 and 429 responses')+'</div><div class="banner">A tool in the toolset is enabled. Whether one call runs is decided by its policy and the host.</div>',[
 ('ov-concepts','First, the concepts: the session toolset decides which tools are enabled, and each tool\'s permission policy decides whether a call runs, asks the host, or is evaluated automatically.'),
 ('ov-offline','Second, four offline presets that show the same request ending in very different ways.'),
 ('ov-live','Third, two real live runs, where Claude calls real tools in the session container and the host answers.'),
 ('ov-code','Finally, the TypeScript code behind the sandbox and the query route.')])
shot('lesson','Open Lab 03',{
 'lesson-title':'Open Lab zero three, Built-in tools, in the Tools, MCP and skills group.',
 'lesson-objective':'The objective: distinguish a tool being enabled in the session toolset from a call being permitted, and verify the effects in files rather than in agent claims.'})
shot('learn','Start in the Learn tab',{
 'learn-objective':'As always, the Learn tab gives you the objective and the lab path. Read it first.'})
for n,t,text in [(1,'The objective','Open the Concept map. Region one, the objective: enabled, permitted, and verified are three different questions.'),
 (2,'Core rule','Region two, the core rule. What proves that a permitted file action occurred? The checked file effects and the policy evidence, not the agent\'s message.'),
 (3,'Keep the boundary clear','Region three, keep the boundary clear: availability, permission, and observed effects are distinct, and each needs its own evidence.'),
 (6,'Put it to the test','Region six, put it to the test: remove the edit tool from the Permitted edit preset, and predict whether the edit attempt will be unavailable or denied, before you run it.')]:
 shot(f'concepts-{n}',f'Concept map · {t}',{f'concepts-{n}-region':text})
for n,t,text in [(1,'Prepare the baseline','In the Lab walkthrough, step one prepares the baseline: run Read-only offline and confirm that every file on disk is unchanged.'),
 (2,'Run the comparison','Step two: run Unavailable Write and Denied Write, and compare the evaluated permission, the evaluation object, and the permission denials list.'),
 (3,'Inspect the boundary','Step three: run Permitted edit. The host allows the allowlisted copy command and the edit inside the fixture, and denies the path traversal attempts.'),
 (4,'Follow the workflow','Step four: inspect outputs slash draft dot md on disk. Then reset the sandbox, and try Auto to see server-evaluated outcomes.')]:
 shot(f'lab-{n}',f'Lab walkthrough · {t}',{f'lab-{n}-region':text})
shot('mapping','Enabled is not permitted',{
 'mapping-rule':'Open Run the exercise. The heading says it all: enabled is not permitted. A tool in the session toolset is enabled; whether one call runs depends on its permission policy and, when the session pauses, on the host.',
 'mapping-table':'This table maps Agent SDK terms to Managed Agents. Allowed tools become per-tool permission policies, and the SDK\'s can use tool callback becomes a user tool confirmation event that the host sends back.'})
shot('experiment','Choose a preset',{
 'exp-preset':'The Preset selector chooses one of five experiments.',
 'exp-summary':'Each preset has a summary. Read-only enables only read, glob, and grep, so nothing can change a file.',
 'exp-prompt':'Each preset also fills in a matching prompt that asks the agent to try the operations.'})
shot('toolset','The session toolset',{
 'toolset-json':'Expand Session toolset to see exactly what is sent when the session is created: every tool listed explicitly, enabled or disabled, with its permission policy: always allow, always ask, or auto. The web tools are always disabled.'})
shot('bashlist','The host bash allowlist',{
 'toolset-bash':'Bash is only ever enabled with always ask, and the host approves exactly these commands, such as listing folders, reading the two fixture files, and one copy command. Every other command is denied.'})
shot('read-only-calls','Offline · Read-only',{
 'read-only-table':'Run Read-only offline. The Tool calls table shows each agent tool use event: the tool and its input, the evaluated permission, the decision, and the tool result. Every call here is allowed by policy.',
 'read-only-denials':'There are no denials, and no file changed. This is the baseline.'})
shot('unavailable-write-calls','Offline · Unavailable Write',{
 'unavailable-write-table':'Now run Unavailable Write. The agent tries to use write, but write is not in the session toolset.',
 'unavailable-write-denials':'The denial says unavailable, by session toolset: no permission policy was evaluated, because the tool was never enabled.'})
shot('denied-write-calls','Offline · Denied Write',{
 'denied-write-table':'Then run Denied Write. This time write is enabled, with always ask, so the session pauses and asks the host.',
 'denied-write-denials':'The host answers deny. The denial says denied by host. Compare it with the previous run: unavailable and denied are different evidence.'})
shot('permitted-edit-calls','Offline · Permitted edit',{
 'permitted-edit-table':'Now run Permitted edit. Bash and edit are enabled with always ask. The host allows the allowlisted copy command and the edit inside the outputs folder.'})
shot('permitted-edit-denials','Offline · The host blocks traversal',{
 'permitted-edit-denials':'This fixture also includes two attacks: a bash command that tries to read etc slash passwd through dot dot segments, and an edit with path traversal. The host denies both: the command is not in the allowlist, and dot dot paths are rejected.'})
shot('permitted-edit-files','Offline · Verify the file on disk',{
 'edit-files-note':'Panel four reads the files from the disposable sandbox after the run, not from the agent\'s message.',
 'edit-files-draft':'And here is the evidence: outputs slash draft dot md now says Status: reviewed. The effect is verified on disk.'})
shot('offline-table','Offline · Compare the four presets',{
 'offline-row1':'The experiment table compares the four presets. Read-only: no denials, and no draft file.',
 'offline-row2':'Unavailable Write: the write was unavailable, because of the session toolset.',
 'offline-row3':'Denied Write: the write was denied by the host.',
 'offline-row4':'Permitted edit: the draft says Status: reviewed, and the traversal attempts were denied. All four turns completed with end turn, so the outcome alone never tells you what happened to your files.'})
shot('live-disabled','Live · Setup is not ready yet',{
 'live-unavailable':'Now let us run real tool calls. With live mode disabled, Run live does not call Claude.',
 'live-instructions':'Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend.'})
raw=clean((P/'terminal/restart-dev.raw.txt').read_text(encoding='utf-8')).split('\n')
dev=['PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> # MANAGED_LIVE_ENABLED=true saved in .env; restart:','PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> npm.cmd run dev']+[x for x in raw if x.strip() not in ('','[web]','[server]') and not x.strip().startswith(('[web] >','[server] >'))]
terminal('Live · Enable live mode and restart',[(l,'restart-cmd' if l.endswith('npm.cmd run dev') else 'restart-ready' if 'Backend ready' in l else None) for l in dev],{
 'restart-cmd':'Stop the platform with Control C, and start it again with npm dot cmd run dev.',
 'restart-ready':'When the backend is ready, refresh the browser.'})
shot('live-ready','Live · Give the tools enough time',{
 'live-deadline':'Choose the Denied Write preset. Tool calls take several model requests, so raise the local deadline to one hundred and twenty seconds. In Lab two we saw what happens when the deadline is too short.',
 'live-budget':'Keep the live session budget at fifty cents, and click Run live.'})
shot('live-denied-write-calls','Live · Denied Write: real tool calls',{
 'live-denied-write-effective':'The session panel shows the effective tools returned by the real session: read always allow, write always ask, and the others disabled.',
 'live-denied-write-table':'Claude first read the draft, allowed by policy. Then it called write. The evaluated permission was ask, so the session paused, and the host denied it. The tool result is an error: permission to use write has been rejected.'},note='LIVE RUN · IDS PARTLY HIDDEN')
shot('live-denied-write-denials','Live · Denied Write: the denial',{
 'live-denied-write-denial-list':'The denials panel records it: write, denied by host.'},note='LIVE RUN')
shot('live-denied-write-outputs','Live · Denied Write: no output file',{
 'live-denied-write-outputs-line':'And the outputs line confirms the effect: no session outputs were downloaded, because no file was ever written to the outputs folder in the container.'},note='LIVE RUN')
shot('live-denied-write-text','Live · Denied Write: Claude reports honestly',{
 'live-denied-write-message':'Claude reports exactly what happened: the write failed, the host denied permission, and nothing was changed.',
 'live-denied-write-outcome':'The turn still completed with end turn. A completed turn does not mean every tool call succeeded.'},note='LIVE RUN')
shot('live-permitted-edit-calls','Live · Permitted edit: real tool calls',{
 'live-permitted-edit-effective':'Now run Permitted edit live. The effective tools are read always allow, and bash and edit always ask.',
 'live-permitted-edit-table':'Claude read the notes, then asked to run the exact copy command. The host allowed it, because the exact command is in the allowlist. Then Claude read the copy and called edit. Unlike the fixture, the real model did not attempt any path traversal.'},note='LIVE RUN · IDS PARTLY HIDDEN')
shot('live-permitted-edit-denials','Live · Permitted edit: no denials',{
 'live-permitted-edit-denial-list':'There were no denials in this run. But a lack of denials is still not proof that the file changed.'},note='LIVE RUN')
shot('live-permitted-edit-files','Live · Permitted edit: verify the file on disk',{
 'live-edit-files-note':'So check the files panel. After the run, the host downloaded the session\'s output files from the real container into the disposable sandbox.',
 'live-edit-files-draft':'And here is the evidence: outputs slash draft dot md, written in the real container, now says Status: reviewed. The live edit is verified on disk.'},note='LIVE RUN')
shot('live-permitted-edit-outputs','Live · Permitted edit: outputs downloaded',{
 'live-permitted-edit-outputs-line':'The outputs line confirms it: draft dot md was downloaded into the host sandbox, and the uploaded originals were deleted afterwards.'},note='LIVE RUN')
shot('live-permitted-edit-text','Live · The claim matches the evidence',{
 'live-permitted-edit-message':'Claude says all four tool calls succeeded and that the draft now says Status: reviewed.',
 'live-permitted-edit-outcome':'This time the claim matches the file we checked ourselves. That is the core lesson of Lab three: trust the checked file effects and the policy evidence, and use the agent\'s message only as a claim to verify.'},note='LIVE RUN')
shot('live-table','Live · Compare the live runs',{
 'live-row1':'The experiment table compares the two live runs. Denied Write: completed, with write denied by host, and no draft on disk.',
 'live-row2':'Permitted edit: completed, with no denials, and the draft column says Status: reviewed, read from the real output file. Always read this column, not just the outcome.'},note='LIVE RUN')
add('Offline and live, compared',head('ENABLED · PERMITTED · VERIFIED','What did the live runs confirm?')+'<div class="grid three">'+card('cmp-policy','POLICY','The host decides','always_ask paused real calls<br>The host denied write<br>and allowed the exact cp')+card('cmp-claims','CLAIMS','Read them critically','Claude reported results honestly<br>but a message is not<br>proof of a file change')+card('cmp-files','FILES','Verify on disk','Offline: Status: reviewed<br>Live: Status: reviewed<br>downloaded from the container')+'</div><div class="banner">Availability, permission and observed effects are distinct: check all three.</div>',[
 ('cmp-policy','The live runs confirmed the policy flow: always ask paused real tool calls, and the host denied the write and allowed only the exact copy command.'),
 ('cmp-claims','Claude reported its results honestly, but a message is still only a claim.'),
 ('cmp-files','And verification belongs on disk: both the offline sandbox and the real container produced Status: reviewed, and in the live run the host downloaded that file to prove it.')])
code=[(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the tools module to its request schema, the sandbox, and the shared tool session implementation.'),
 (3,'POST /reset','Section three is the reset route. It restores the disposable sandbox to its original files, and returns four twenty-nine while a query is still running.'),
 (4,'POST /query','Section four is the query handler. It validates the request with the lab three schema, creates a sandbox, and calls the live port or the fixture port. Its four hundred, four twenty-nine, and four twenty-two branches are the observable outcomes.'),
 (6,'Decision and early response','Section six returns four hundred when parsing fails, for example when a request contains Agent SDK fields such as allowed tools or permission mode, which this lab rejects.'),
 (7,'Return the module contract','Section seven returns the router and its cleanup contract, which aborts any running work and waits for it to settle.')]
for n,t,text in code:
 shot(f'code-{n}',f'TypeScript · Section {n}: {t}',{f'code-{n}-section':text})
add('From allowedTools to the session toolset',head('AGENT SDK · MANAGED AGENTS','Where are allowedTools and canUseTool?')+'<div class="grid three">'+card('map-sdk','CLAUDE AGENT SDK','query({ options })','allowedTools, permissionMode<br>and canUseTool run in<br>your own process.')+card('map-managed','CLAUDE MANAGED AGENTS','Toolset and confirmations','tools[0] with permission_policy<br>sessions.create creates the session<br>host sends user.tool_confirmation')+card('map-files','FILES','Into and out of the container','files.upload mounts the inputs<br>files.list and files.download<br>collect the outputs')+'</div><div class="banner">The calls are in the supporting file server/lib/tool-session-port.ts, shared by the tool labs.</div>',[
 ('map-sdk','In the Agent SDK, allowed tools, permission mode, and the can use tool callback are options that run in your own process.'),
 ('map-managed','In Managed Agents, the toolset with its permission policies is part of the session, and the host answers paused calls by sending user tool confirmation events.'),
 ('map-files','Files move in and out through the Files API. Let us open the live port: server slash lib slash tool dash session dash port dot T S.')])
shot('port-create','Live port · Upload files and create the session',{
 'port-upload':'First, the host uploads each fixture file with files dot upload. They are mounted read-only in the container.',
 'port-create':'Then sessions dot create sends the session parameters, including the lab toolset as the session tools.'},note='PLATFORM SOURCE VIEWER')
shot('port-confirm','Live port · Stream, send and confirm',{
 'port-stream':'As in Lab one, the stream opens first,',
 'port-send':'and the prompt is sent as a user message.',
 'port-confirm':'When a call pauses with always ask, confirm sends user dot tool confirmation events: the tool use ID, the result allow or deny, and a deny message. This is the host decision you saw in the tool calls table.'},note='PLATFORM SOURCE VIEWER')
shot('port-outputs','Live port · Collect the outputs',{
 'port-list':'After the turn, collect outputs lists the session\'s files with files dot list, scoped to the session. Two details matter: scope I D filtering requires the managed agents beta header, and the list also contains read-only copies of the uploads, so only downloadable files are kept as outputs.',
 'port-download':'Each output is then downloaded and written into the host sandbox, after its path is validated. That is how the file on disk becomes your evidence.'},note='PLATFORM SOURCE VIEWER')
shot('knowledge','Check your understanding',{
 'knowledge-question':'Finish with the knowledge check: what proves a permitted file action occurred?',
 'knowledge-feedback':'The checked file effects and the policy evidence. Availability, permission, and observed effects are distinct.'})
add('Lab 03 summary',head('LAB 03 · BUILT-IN TOOLS','What you can now explain')+'<div class="grid three">'+card('sum-enabled','ENABLED','The session toolset','Not enabled means unavailable:<br>no policy is evaluated.')+card('sum-permitted','PERMITTED','Policy and host','always_allow, always_ask or auto,<br>then the host confirms or denies.')+card('sum-verified','VERIFIED','Files, not claims','Check the file on disk<br>before you trust the message.')+'</div><div class="banner">Save a note in your notebook, tick your checklist, and continue with Lab 04 · Permissions.</div>',[
 ('sum-enabled','You can now explain that a tool that is not enabled is unavailable, and no policy is even evaluated.'),
 ('sum-permitted','That an enabled tool is permitted by its policy, and when it asks, by the host\'s confirmation.'),
 ('sum-verified','And that effects must be verified in files, not in the agent\'s claims. Save a note, tick your checklist, and continue with Lab four.')])
tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:62px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:360px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.6}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px;margin-top:36px}.cover .badge small{font-size:21px;font-weight:normal}.four .card{min-height:250px}'''
css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:20px;color:#c3d9ec;letter-spacing:1px}.shotcue{position:absolute;opacity:0}
.termslide{background:#0b1622}.terms{position:absolute;left:60px;right:60px;top:130px;bottom:50px;display:flex;gap:30px}.term{flex:1;min-width:0;background:#012456;border:2px solid #3c6ea8;border-radius:12px;overflow:hidden}.term-title{background:#e8edf3;color:#1b2a3a;font:22px Arial;padding:10px 16px;display:flex;gap:8px;align-items:center}.term-title span{width:14px;height:14px;border-radius:50%;background:#b8c3cf;display:inline-block}.term pre{margin:0;padding:22px 26px;color:#eef3f8;font:25px/1.42 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.tl{display:block}.tl.cue{display:block;width:fit-content;max-width:100%}.ps{color:#f9f1a5;font-weight:normal}
.editor{position:absolute;left:60px;right:60px;top:130px;bottom:50px;background:#1f1f1f;border:2px solid #3a3a3a;border-radius:12px;overflow:hidden}.editor .tab{background:#181818;color:#e8e8e8;font:22px Arial;padding:12px 22px;border-bottom:1px solid #333}.editor pre{margin:0;padding:16px 0;color:#d4d4d4;font:24px/1.5 Consolas,monospace;white-space:pre}.el{display:block}.el.cue{display:block;width:fit-content}.ln{display:inline-block;width:70px;text-align:right;margin-right:26px;color:#6e7681}.editor i{color:#6a9955;font-style:normal}.editor b{color:#ce9178;font-weight:normal}'''
for i,s in enumerate(slides):
 count=f'{i+1:02} / {len(slides):02}'
 if 'shot' in s['class']:s['body']=s['body'].replace('{count}',count)
 else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · LAB 03 STEP BY STEP</span><span>{count}</span></div>'
source=P/'lab03-walkthrough.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(TITLE)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
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
 plan={'project':N,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Claude-Managed-Agents-Lab03-Step-by-Step','outputFile':'Claude-Managed-Agents-Lab03-Step-by-Step.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
words=sum(len(t.split()) for s in slides for _,t in s['segments'])
print(f'Authored {len(slides)} Lab 03 scenes; {words} narration words.')
