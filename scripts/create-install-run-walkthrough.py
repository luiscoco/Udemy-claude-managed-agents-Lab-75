"""Install-and-run walkthrough authored from real terminal transcripts, live page captures and instructor screenshots."""
from pathlib import Path
import ast,hashlib,html,json,re,shutil
from plan_lab_settings import SETTINGS
R=Path(__file__).resolve().parents[1];N='managed-agents-install-run-walkthrough';P=R/'presentations'/N;V=R/'videos'/N;A=P/'assets';A.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
TITLE='Install and Run the Claude Managed Agents Learning Platform'
CLONE=Path(r'C:\Students\Udemy-claude-managed-agents-Lab-75')
T=P/'terminal';e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
shutil.copy2(R/'public/images/portal-welcome.png',A/'portal-welcome.png')
def clean(text):return re.sub(r'\x1b\[[0-9;]*m','',text).replace('\r','').lstrip('﻿').replace(' 2>&1','')
def transcript(name):
 path=T/f'{name}.txt'
 if not path.exists():path=T/f'{name}.raw.txt'
 return clean(path.read_text(encoding='utf-8'))
def mask_id(text):return re.sub(r'\b(agent|env)_(\w{6})\w+(\w{4})\b',lambda m:f'{m[1]}_{m[2]}••••••••{m[3]}',text)
def mask_key(text):return re.sub(r'(ANTHROPIC_API_KEY=)sk-ant-\S+',r'\1sk-ant-usr-•••••••••••• (key hidden)',text)
assert 'sk-ant' not in ''.join(transcript(p.stem.replace('.raw','')) for p in T.glob('*.txt')),'A transcript contains a key'
slides=[]
def cue(cid,body):return f'<div class="cue" data-cue="{cid}">{body}</div>'
def head(tag,title):return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def card(cid,tag,title,body):return '<article class="card"><small>'+tag+'</small>'+cue(cid,f'<h2>{title}</h2><p>{body}</p>')+'</article>'
def add(title,body,segments,cls=''):slides.append({'title':title,'body':body,'segments':segments,'class':cls})
def bar(title,note):return f'<div class="bar top"><h1>{html.escape(title)}</h1><span>{note} · {{count}}</span></div>'
def shot(id,title,narration):
 s=next(s for s in e['shots'] if s['id']==id);cues={c['id']:c for c in s['cues']};assert set(cues)==set(narration),(id,set(cues))
 body=f'<img class="full" src="platform/{id}.png">'+bar(title,'LIVE CAPTURE')
 for cid in narration:
  x,y,w,h=cues[cid]['rect'];y=max(y,92);body+=f'<div class="shotcue" data-cue="{cid}" data-visible="{html.escape(cues[cid]["text"],quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
 add(title,body,list(narration.items()),'shot')
def image(name,title,narration,rects,note='INSTRUCTOR SCREENSHOT · KEY HIDDEN'):
 import cv2
 h,w=cv2.imread(str(P/'console'/f'{name}.png')).shape[:2];scale=min(1880/w,972/h);dw,dh=w*scale,h*scale;ox,oy=(1920-dw)/2,88+(992-dh)/2
 body=f'<img class="framed" src="console/{name}.png" style="left:{ox}px;top:{oy}px;width:{dw}px;height:{dh}px">'+bar(title,note)
 for cid in narration:
  x1,y1,x2,y2=rects[cid];body+=f'<div class="shotcue" data-cue="{cid}" style="left:{ox+x1*scale}px;top:{oy+y1*scale}px;width:{(x2-x1)*scale}px;height:{(y2-y1)*scale}px"></div>'
 add(title,body,list(narration.items()),'shot')
def term_lines(name,keep=None,mask=True):
 lines=transcript(name).rstrip('\n').split('\n')
 if keep:lines=keep(lines)
 return [mask_id(l) if mask else l for l in lines]
def terminal(title,windows,narration,note='REAL COMMAND OUTPUT'):
 # windows: list of (window title, [(text, cue id or None)])
 body=bar(title,note)+'<div class="terms">'
 for wt,rows in windows:
  body+=f'<div class="term"><div class="term-title"><span></span><span></span><span></span>{html.escape(wt)}</div><pre>'
  for text,cid in rows:
   esc=html.escape(text) or ' '
   esc=re.sub(r'^(PS [^&]*?&gt;)',r'<b class="ps">\1</b>',esc)
   body+=(f'<span class="tl cue" data-cue="{cid}">{esc}</span>' if cid else f'<span class="tl">{esc}</span>')
  body+='</pre></div>'
 add(title,body+'</div>',list(narration.items()),'shot termslide')
def rows(lines,cues):return [(l,next((c for c,pat in cues if re.search(pat,l)),None)) for l in lines]
def editor(title,path,label,narration,cues,first=1,last=26,note='REAL FILE CONTENT'):
 lines=mask_id(mask_key(path.read_text(encoding='utf-8'))).split('\n')[first-1:last]
 body=bar(title,note)+f'<div class="editor"><div class="tab">⚙ {html.escape(label)}</div><pre>'
 used=set()
 for i,l in enumerate(lines,first):
  cid=next((c for c,pat in cues if c not in used and re.search(pat,l)),None)
  esc=html.escape(l) or ' ';esc=re.sub(r'^(#.*)$',r'<i>\1</i>',esc);esc=re.sub(r'^([A-Z0-9_]+)=',r'<b>\1</b>=',esc)
  row=f'<span class="ln">{i}</span>{esc}'
  if cid:used.add(cid);body+=f'<span class="el cue" data-cue="{cid}">{row}</span>'
  else:body+=f'<span class="el">{row}</span>'
 add(title,body+'</pre></div>',list(narration.items()),'shot termslide')
PS='PS C:\\Students\\Udemy-claude-managed-agents-Lab-75>'
# 1. Cover and roadmap
add('Install and Run the Learning Platform',head('CLAUDE MANAGED AGENTS · INSTALL · CONFIGURE · RUN','Install and Run the<br>Claude Managed Agents Learning Platform')+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('install-welcome','<h2>Your setup journey</h2><p>Get the code.<br>Configure your .env file.<br>Create your resources.<br>Run the platform.</p>')+'<div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('install-welcome','Welcome! In this lecture, I will show you step by step how to install and run the Claude Managed Agents learning platform on your own computer. Everything you will see is real: the GitHub repository, the Claude Console, the commands, and their actual output, recorded on a fresh Windows installation.')],'cover')
add('Your setup roadmap',head('FOUR STAGES · ABOUT 20 MINUTES','From an empty folder to a running platform')+'<div class="grid four">'+card('road-code','1 · GET THE CODE','Clone or download','Check Node.js, npm and Git<br>git clone or Download ZIP · npm ci')+card('road-env','2 · CONFIGURE','Create your .env file','Copy .env.example to .env<br>Create and paste your API key')+card('road-resources','3 · CREATE RESOURCES','Agent and environment','npm run managed:provision<br>Paste both IDs · managed:verify')+card('road-run','4 · RUN','Start the platform','npm run dev · open the browser<br>Optional: two PowerShell windows')+'</div><div class="banner">Offline labs need no API key: the key and the two IDs are only needed for live work.</div>',[
 ('road-code','First, you will check the prerequisites and get the code, either with git clone or by downloading a ZIP file, and install the dependencies.'),
 ('road-env','Second, you will create your dot env file from dot env dot example, create an Anthropic API key in the Claude Console, and paste it into dot env.'),
 ('road-resources','Third, you will run one command that creates your managed agent and environment, and paste the two IDs it prints into dot env.'),
 ('road-run','Finally, you will start the platform with npm run dev, open it in your browser, and learn the optional way to run the backend and frontend in two separate PowerShell windows.')])
# 2. Prerequisites and code
terminal('Check the prerequisites',[('Windows PowerShell',rows(term_lines('01-node')+term_lines('01-npm')+term_lines('01-git'),[('pre-node',r'node --version|^v24'),('pre-git',r'git --version|git version')]))],{
 'pre-node':'Open PowerShell and check the prerequisites. The platform requires Node.js version twenty-four or newer. Type node dash dash version: here it reports version twenty-four. On Windows, use npm dot cmd in PowerShell, which comes with Node.',
 'pre-git':'You also need Git to clone the repository. Type git dash dash version to confirm it is installed. If a command is not recognized, install Node.js or Git for Windows first, then open a new PowerShell window.'})
shot('gh-repo','Open the GitHub repository',{
 'gh-name':'Now open the learning platform repository on GitHub, at github dot com, slash luiscoco, slash Udemy dash claude dash managed dash agents dash Lab dash seventy-five. The repository is public, so you do not need a GitHub account to download it.',
 'gh-code':'Click the green Code button to see the download options.'})
shot('gh-clone','Choose: clone with Git or download a ZIP',{
 'gh-https':'On the HTTPS tab, copy the repository address with the copy button. This is the address you will use with git clone.',
 'gh-zip':'Alternatively, choose Download ZIP to get the files without Git. Cloning is recommended, because later you can update the platform with a single git pull command.'})
clone=term_lines('02-clone',lambda l:[l[0],l[1],'⋮',l[-1]])
terminal('Option A · Clone the repository with Git',[('Windows PowerShell',rows(['PS C:\\Students> # choose any folder for your course projects']+clone,[('clone-cmd',r'git clone'),('clone-done',r'100%.*done')]))],{
 'clone-cmd':'Option A: choose a folder for your course projects, here C colon backslash Students, and run git clone followed by the address you copied.',
 'clone-done':'Git downloads the repository and checks out more than three thousand files. When it reports one hundred percent, done, change into the new folder with Set-Location Udemy dash claude dash managed dash agents dash Lab dash seventy-five.'})
z=term_lines('02b-zip-download')+term_lines('02b-zip-expand')+term_lines('02b-zip-ls')
terminal('Option B · Download and extract the ZIP file',[('Windows PowerShell',rows([l for l in z if l.strip()],[('zip-cmd',r'Invoke-WebRequest|Expand-Archive'),('zip-folder',r'^Udemy-claude-managed-agents-Lab-75-main$')]))],{
 'zip-cmd':'Option B: if you downloaded the ZIP file, extract it. In File Explorer, right-click the file and choose Extract All, or use the Expand-Archive command shown here. The download is large, about five hundred and seventy megabytes, because it includes the course media.',
 'zip-folder':'The extracted folder ends with dash main. Open PowerShell inside that folder and continue with the same steps. Remember that a ZIP copy is not connected to Git, so to update it later you download a new ZIP.'})
shot('gh-readme','Read the README setup section',{
 'readme-requires':'The README on GitHub summarizes the requirements: Node twenty-four or newer and Git on your PATH. On Windows, use PowerShell and npm dot cmd.',
 'readme-commands':'It also lists the setup commands we are about to run: install the dependencies, create dot env if it does not exist, and start the platform.'})
ci=term_lines('03-npm-ci',lambda l:[x for x in l if x.strip()][:1]+['⋮']+[x for x in l if re.search(r'added \d+ packages',x)])
terminal('Install the dependencies',[('Windows PowerShell',rows(ci,[('ci-cmd',r'npm\.cmd ci'),('ci-done',r'added \d+ packages')]))],{
 'ci-cmd':'Inside the project folder, run npm dot cmd ci. The c i command installs the exact package versions recorded in package-lock dot json.',
 'ci-done':'It can take a few minutes. Here it added two hundred and seventy-four packages. npm may also print funding or audit notices; they do not stop the installation.'})
# 3. Configure .env
cp=term_lines('04-copy-env')+term_lines('09-ignored')
terminal('Create .env from .env.example',[('Windows PowerShell',rows(cp,[('env-copy',r'Copy-Item'),('env-ignored',r'check-ignore|\.gitignore:1')]))],{
 'env-copy':'Next, create your configuration file. This command copies dot env dot example to a new file named dot env, but only if dot env does not exist yet, so it never overwrites your settings. Test-Path returns True: the file is there.',
 'env-ignored':'The dot env file holds your secrets, and the repository ignores it. git check-ignore confirms that rule, so your key will never be committed or pushed to GitHub.'})
editor('The .env.example template',CLONE/'.env.example','.env.example',{
 'tpl-key':'Open the project in Visual Studio Code and look at the template. The first setting is ANTHROPIC underscore API underscore KEY, which is empty. These are server-only settings: the key is never sent to the browser.',
 'tpl-ids':'The next two settings, CLAUDE underscore MANAGED underscore AGENT underscore ID and CLAUDE underscore MANAGED underscore ENVIRONMENT underscore ID, are also empty. You will fill them in a few minutes.',
 'tpl-live':'Notice that MANAGED underscore LIVE underscore ENABLED is false. Live, billed runs stay disabled until you deliberately turn them on, and the budget is capped at fifty cents per session.'},[('tpl-key',r'^ANTHROPIC_API_KEY='),('tpl-ids',r'^CLAUDE_MANAGED_AGENT_ID='),('tpl-live',r'^MANAGED_LIVE_ENABLED=')],last=20,note='REAL FILE CONTENT')
rd=term_lines('05-ready-nokey')
terminal('Check what is still missing',[('Windows PowerShell',rows(rd,[('ready-cmd',r'npm\.cmd run managed:ready'),('ready-missing',r'"missing"'),('ready-offline',r'"offlineAvailable"')]))],{
 'ready-cmd':'Run npm run managed colon ready at any time. It checks your local configuration only; it never contacts Anthropic.',
 'ready-missing':'Right now it reports three missing values: the API key, the agent ID, and the environment ID. Let us create them.',
 'ready-offline':'Notice offline available is true. You can already run the offline labs without any key.'})
# 4. API key
shot('docs-prereq','What you need from Anthropic',{
 'docs-heading':'The official Managed Agents quickstart lists the prerequisites:',
 'docs-list':'a Claude Console account and an API key from the Console. A Claude chat subscription is different: API usage is billed separately, so make sure your Console account has credits.'})
image('google-search','Search for the Anthropic API key page',{
 'g-result':'An easy way to find the right page is to search for anthropic api key. The first result is the official Claude Platform documentation: Get your Claude API key.',
 'g-steps':'The summary already tells you the three steps: sign in to the Console, create a key, and copy it immediately, because it is shown only once.'},
 {'g-result':(146,345,858,385),'g-steps':(150,695,1100,945)},note='INSTRUCTOR SCREENSHOT')
image('docs-get-api-key','Open the API keys page',{
 'k-title':'The documentation page explains that API keys live in the Claude Console.',
 'k-link':'Click the API keys link to open the Console page at platform dot claude dot com slash settings slash keys.'},
 {'k-title':(287,200,592,235),'k-link':(583,318,659,347)},note='INSTRUCTOR SCREENSHOT')
shot('console-signin','Sign in to the Claude Console',{
 'signin-google':'If you are not signed in yet, the Console asks you to log in. Continue with Google,',
 'signin-email':'or enter your email and choose Continue with email. New users can create an account here.'})
image('console-keys','Create a new API key',{
 'c-heading':'After signing in, you see your list of API keys. My Console is shown in Spanish, so Claves de API means API keys.',
 'c-create':'Click Create key, which is Crear clave in Spanish.'},
 {'c-heading':(276,158,425,186),'c-create':(1124,155,1243,187)})
image('console-federation','Continue with an API key',{
 'f-text':'The Console may first suggest identity federation, which is meant for cloud and CI workloads.',
 'f-continue':'For this course, a regular API key is the right choice. Click Continue with an API key.'},
 {'f-text':(395,248,840,268),'f-continue':(393,562,866,594)})
image('console-create','Name the key and set its expiration',{
 'n-name':'Give the key a name you will recognize, for example my key for udemy.',
 'n-expire':'Choose an expiration, here thirty days, and keep the default workspace.',
 'n-create':'Then click Create key.'},
 {'n-name':(397,238,867,266),'n-expire':(397,307,867,337),'n-create':(769,582,866,613)})
image('console-copy','Copy your key now',{
 'p-warning':'The Console now shows your new key. Read the warning: you will not be able to see it again. I have hidden my key in this video, and you should never share yours or paste it into a chat.',
 'p-copy':'Click Copy key. If you lose it, simply create a new key and delete the old one.'},
 {'p-warning':(396,352,848,392),'p-copy':(668,486,792,514)})
image('vscode-env-key','Paste the key into .env',{
 'v-file':'Back in Visual Studio Code, open the dot env file.',
 'v-line':'Paste the key right after ANTHROPIC underscore API underscore KEY equals, with no spaces and no quotes, and save the file. Alternatively, the setup guide offers a script that keeps the key only in your current PowerShell session.'},
 {'v-file':(52,168,118,190),'v-line':(343,103,1183,125)})
rk=term_lines('10-ready-key')
terminal('Check the configuration again',[('Windows PowerShell',rows(rk,[('rk-missing',r'"missing"'),('rk-ids',r'"CLAUDE_MANAGED_ENVIRONMENT_ID"')]))],{
 'rk-missing':'Run managed ready again. The API key is no longer missing.',
 'rk-ids':'Only the agent ID and the environment ID remain. One command creates both.'})
# 5. Resources
pv=term_lines('11-provision')
terminal('Create your agent and environment',[('Windows PowerShell',rows(pv,[('pv-cmd',r'npm\.cmd run managed:provision'),('pv-agent',r'^CLAUDE_MANAGED_AGENT_ID='),('pv-env',r'^CLAUDE_MANAGED_ENVIRONMENT_ID=')]))],{
 'pv-cmd':'Run npm run managed colon provision. This contacts Anthropic and creates two resources in your account: a text-only agent for Lab one and a cloud environment. It does not start a session or run the model.',
 'pv-agent':'It prints your new CLAUDE underscore MANAGED underscore AGENT underscore ID, which starts with agent underscore.',
 'pv-env':'And your CLAUDE underscore MANAGED underscore ENVIRONMENT underscore ID, which starts with env underscore. Run provisioning only once: the IDs are also saved in managed slash resources dot local dot json, and the command refuses to create duplicates.'},note='REAL OUTPUT · IDS PARTLY HIDDEN')
editor('Paste both IDs into .env',CLONE/'.env','.env',{
 'ids-agent':'Copy each printed line and paste the values into dot env, after CLAUDE underscore MANAGED underscore AGENT underscore ID equals,',
 'ids-env':'and after CLAUDE underscore MANAGED underscore ENVIRONMENT underscore ID equals. Save the file.'},[('ids-agent',r'^CLAUDE_MANAGED_AGENT_ID=agent_'),('ids-env',r'^CLAUDE_MANAGED_ENVIRONMENT_ID=env_')],last=12,note='REAL FILE · KEY AND IDS PARTLY HIDDEN')
vf=term_lines('12-verify')+term_lines('13-ready-final')
terminal('Verify your setup',[('Windows PowerShell',rows(vf,[('vf-ok',r'Provider access verified'),('vf-configured',r'"configured": true'),('vf-live',r'"liveEnabled"')]))],{
 'vf-ok':'Now verify the connection with npm run managed colon verify. This read-only check confirms that your key can access the agent and environment. It starts no session.',
 'vf-configured':'Run managed ready once more: configured is now true, and nothing is missing.',
 'vf-live':'Live enabled is still false, which is exactly what we want for now. You will start with the offline exercises.'},note='REAL OUTPUT')
# 6. Run
dv=term_lines('06-dev.raw',lambda l:[x for x in l if x.strip() not in ('','[web]','[server]') and not x.strip().startswith('[web] >') and not x.strip().startswith('[server] >')])
dv=[PS+' npm.cmd run dev']+dv
terminal('Start the platform',[('Windows PowerShell',rows(dv,[('dev-cmd',r'npm\.cmd run dev$'),('dev-backend',r'Backend ready'),('dev-local',r'Local:')]))],{
 'dev-cmd':'Now start the platform with npm dot cmd run dev. One command starts both parts of the application.',
 'dev-backend':'The backend reports Backend ready at one two seven dot zero dot zero dot one, port three zero seven six.',
 'dev-local':'The frontend, Vite, prints the Local address: port fifty-one seventy-four. The first start can take a minute while dependencies are optimized. If that port is busy, Vite picks the next free one, so always use the address it prints.'})
shot('app-home','Open the platform in your browser',{
 'home-banner':'Open that address in your browser. Here is the Claude Managed Agents learning portal, running on your computer.',
 'home-start':'Choose Start with Lab zero one to begin your first lesson.'})
shot('app-backend','Check the backend connection',{
 'backend-heading':'On the Home page, scroll to Backend readiness and click Check backend.',
 'backend-result':'Backend ready confirms that the browser can reach your local server. This check does not call Claude.'})
shot('app-offline','Run your first offline exercise',{
 'offline-outcome':'In Lab zero one, open Run the exercise and run the Normal turn offline fixture. The outcome is completed, with stop reason end turn. Offline fixtures need no key and cost nothing.'})
sv=[PS+' npm.cmd run dev:server']+[x for x in term_lines('07-dev-server.raw') if x.strip() and not x.startswith('>')]
wb=[PS+' npm.cmd run dev:web']+[x for x in term_lines('08-dev-web.raw') if x.strip() and not x.startswith('>')]
terminal('Optional · Backend and frontend in two windows',[('PowerShell 1 · Backend',rows(sv,[('two-server',r'dev:server$'),('two-ready',r'Backend ready')])),('PowerShell 2 · Frontend',rows(wb,[('two-web',r'dev:web$'),('two-local',r'Local:')]))],{
 'two-server':'Optionally, you can run each part in its own PowerShell window. This makes their logs easier to read. In the first window, run npm dot cmd run dev colon server.',
 'two-ready':'Wait for Backend ready on port three zero seven six.',
 'two-web':'In a second PowerShell window, in the same folder, run npm dot cmd run dev colon web.',
 'two-local':'Vite prints the same Local address. The frontend forwards every API request to the backend, so open this address as before. To stop, press Control C in each window.'})
image('vscode-env-live','When you are ready for live runs',{
 'l-file':'Later, when a lab asks for a live run, open dot env again.',
 'l-line':'Set MANAGED underscore LIVE underscore ENABLED to true, save, and restart the platform. Live runs call Claude and are billed to your account, with a budget cap of fifty cents per session. Keep it false whenever you only need the offline exercises.'},
 {'l-file':(53,167,115,190),'l-line':(343,302,513,322)})
ex=term_lines('09-git-pull')+term_lines('09-status')+[PS+' # Ctrl+C stops the platform; then confirm the ports are free:']+term_lines('09-ports')
terminal('Useful commands to remember',[('Windows PowerShell',rows([x for x in ex if x.strip()],[('ex-pull',r'Already up to date'),('ex-status',r'git status'),('ex-ports',r'Get-NetTCPConnection')]))],{
 'ex-pull':'A few more commands are worth remembering. To get course updates, stop the platform and run git pull, then npm dot cmd ci again if the dependencies changed.',
 'ex-status':'git status shows no changes, even though you created dot env and the resources file: both are ignored, so your secrets stay on your computer.',
 'ex-ports':'Press Control C to stop the platform, and wait for it to finish. If a port is still busy, Get-NetTCPConnection shows which process is listening on ports three zero seven six and fifty-one seventy-four. An empty result means both ports are free.'})
add('Your setup checklist',head('YOU ARE READY TO LEARN','Install and run the learning platform')+'<div class="grid four">'+card('done-code','✔ CODE','Cloned and installed','git clone or ZIP<br>npm.cmd ci')+card('done-env','✔ CONFIGURATION','.env is ready','API key pasted<br>Never committed or shared')+card('done-resources','✔ RESOURCES','Agent and environment','managed:provision · IDs pasted<br>managed:verify passed')+card('done-run','✔ RUNNING','Platform in your browser','npm.cmd run dev<br>Offline first, live when ready')+'</div><div class="banner">Keep your API key private. If it is ever exposed, revoke it in the Console and create a new one.</div>',[
 ('done-code','Congratulations! You cloned or downloaded the platform and installed its dependencies.'),
 ('done-env','You created your dot env file and pasted your API key. Keep it private: if a key is ever exposed, revoke it in the Console and create a new one.'),
 ('done-resources','You created your agent and environment, pasted their IDs, and verified the connection.'),
 ('done-run','And you started the platform and ran your first offline exercise. Next, open Lab zero one and enjoy learning with Claude Managed Agents.')])
tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:62px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:360px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.6}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px;margin-top:36px}.cover .badge small{font-size:21px;font-weight:normal}.four .card{min-height:250px}'''
css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.framed{position:absolute;border:2px solid #3a4b5c;border-radius:6px;background:white}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:20px;color:#c3d9ec;letter-spacing:1px}.shotcue{position:absolute;opacity:0}
.termslide{background:#0b1622}.terms{position:absolute;left:60px;right:60px;top:130px;bottom:50px;display:flex;gap:30px}.term{flex:1;min-width:0;background:#012456;border:2px solid #3c6ea8;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px #0008}.term-title{background:#e8edf3;color:#1b2a3a;font:22px Arial;padding:10px 16px;display:flex;gap:8px;align-items:center}.term-title span{width:14px;height:14px;border-radius:50%;background:#b8c3cf;display:inline-block}.term pre{margin:0;padding:22px 26px;color:#eef3f8;font:25px/1.42 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.tl{display:block}.tl.cue{display:block;width:fit-content;max-width:100%}.ps{color:#f9f1a5;font-weight:normal}
.editor{position:absolute;left:60px;right:60px;top:130px;bottom:50px;background:#1f1f1f;border:2px solid #3a3a3a;border-radius:12px;overflow:hidden}.editor .tab{background:#181818;color:#e8e8e8;font:22px Arial;padding:12px 22px;border-bottom:1px solid #333}.editor pre{margin:0;padding:16px 0;color:#d4d4d4;font:24px/1.5 Consolas,monospace;white-space:pre}.el{display:block}.el.cue{display:block;width:fit-content}.ln{display:inline-block;width:70px;text-align:right;margin-right:26px;color:#6e7681}.editor i{color:#6a9955;font-style:normal}.editor b{color:#ce9178;font-weight:normal}'''
for i,s in enumerate(slides):
 count=f'{i+1:02} / {len(slides):02}'
 if 'shot' in s['class']:s['body']=s['body'].replace('{count}',count)
 else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · INSTALL AND RUN</span><span>{count}</span></div>'
source=P/'install-run.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(TITLE)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
assert 'sk-ant-usr-1' not in source.read_text(encoding='utf-8') and not re.search(r'(agent|env)_\w{20}',source.read_text(encoding='utf-8'))
(P/'storyboard.json').write_text(json.dumps(slides,indent=2),encoding='utf-8');(V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {s["title"]}\n'+' '.join(t for _,t in s['segments']) for i,s in enumerate(slides)),encoding='utf-8')
geom=P/'.build/video/slides/geometry.json'
if geom.exists():
 g=json.loads(geom.read_text(encoding='utf-8'));rows_=[];audit=[]
 for i,s in enumerate(slides):
  segments=[]
  for cid,t in s['segments']:
   b=next(b for b in g[i]['rects'] if b['id']==cid);segments.append({'id':cid,'text':t,'target':{'textRects':[b['rect']],'paragraphGroups':[[0]]}});audit.append({'slide':i+1,'cue':cid,'narration':t,'visibleText':[b['text']]})
  rows_.append({'slide':i+1,'segments':segments})
 plan={'project':N,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Claude-Managed-Agents-Install-and-Run','outputFile':'Claude-Managed-Agents-Install-and-Run.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows_}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
words=sum(len(t.split()) for s in slides for _,t in s['segments'])
print(f'Authored {len(slides)} install-and-run scenes; {words} narration words.')
