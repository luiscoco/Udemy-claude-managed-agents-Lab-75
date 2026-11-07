"""Shared authoring helpers for the Lab NN step-by-step videos (Labs 04 onward).

Each create-labNN-walkthrough.py builds a Deck from its capture evidence, adds the lab's own storyline and calls
finish(). The slide styles, cue geometry and narration plan match the Lab 01-03 authoring scripts.
"""
from pathlib import Path
import ast,hashlib,html,json,re,shutil
from plan_lab_settings import SETTINGS

R=Path(__file__).resolve().parents[1]
CLONE=Path(r'C:\Students\Udemy-claude-managed-agents-Lab-75')
INSTRUCTOR='Luis Coco Enríquez'

def clean(text):return re.sub(r'\x1b\[[0-9;]*m','',text).replace('\r','').lstrip('\ufeff')
def mask(text):
 text=re.sub(r'\b(agent|env|skill|skver|sesn|sthr|sevt|file|mcpsrv|vlt)_(\w{6})\w+(\w{4})\b',lambda m:f'{m[1]}_{m[2]}••••••••{m[3]}',text)
 return re.sub(r'(ANTHROPIC_API_KEY=)sk-ant-\S+',r'\1sk-ant-usr-•••••••••••• (key hidden)',text)
def cue(cid,body):return f'<div class="cue" data-cue="{cid}">{body}</div>'
def head(tag,title):return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def card(cid,tag,title,body):return '<article class="card"><small>'+tag+'</small>'+cue(cid,f'<h2>{title}</h2><p>{body}</p>')+'</article>'

class Deck:
 def __init__(self,lab,title,topic):
  self.lab=lab;self.nn=f'{lab:02}';self.title=title;self.topic=topic
  self.name=f'managed-agents-lab{self.nn}-walkthrough';self.P=R/'presentations'/self.name;self.V=R/'videos'/self.name
  (self.P/'assets').mkdir(parents=True,exist_ok=True);self.V.mkdir(parents=True,exist_ok=True)
  shutil.copy2(R/'public/images/portal-welcome.png',self.P/'assets/portal-welcome.png')
  self.e=json.loads((self.P/'platform/capture-evidence.json').read_text(encoding='utf-8'));self.slides=[]
  assert not self.e['errors'],self.e['errors']
 def add(self,title,body,segments,cls=''):self.slides.append({'title':title,'body':body,'segments':segments,'class':cls})
 def bar(self,title,note):return f'<div class="bar top"><h1>{html.escape(title)}</h1><span>{note} · {{count}}</span></div>'
 def shot(self,id,title,narration,note='LIVE APP CAPTURE'):
  s=next(s for s in self.e['shots'] if s['id']==id);cues={c['id']:c for c in s['cues']};assert set(cues)==set(narration),(id,set(cues))
  body=f'<img class="full" src="platform/{id}.png">'+self.bar(title,note)
  for cid in narration:
   x,y,w,h=cues[cid]['rect'];top=max(y,92);h-=top-y
   body+=f'<div class="shotcue" data-cue="{cid}" data-visible="{html.escape(cues[cid]["text"],quote=True)}" style="left:{x}px;top:{top}px;width:{w}px;height:{h}px"></div>'
  self.add(title,body,list(narration.items()),'shot')
 def terminal(self,title,lines,narration,note='REAL COMMAND OUTPUT'):
  body=self.bar(title,note)+'<div class="terms"><div class="term"><div class="term-title"><span></span><span></span><span></span>Windows PowerShell</div><pre>'
  for text,cid in lines:
   esc=html.escape(mask(text)) or ' ';esc=re.sub(r'^(PS [^&]*?&gt;)',r'<b class="ps">\1</b>',esc)
   body+=(f'<span class="tl cue" data-cue="{cid}">{esc}</span>' if cid else f'<span class="tl">{esc}</span>')
  self.add(title,body+'</pre></div></div>',list(narration.items()),'shot termslide')
 def transcript(self,name):return [l for l in clean((self.P/'terminal'/name).read_text(encoding='utf-8')).split('\n') if l.strip() and l.strip()!='>' ]
 # Scenes every lab video shares.
 def cover(self,tag,side,narration):
  self.add(f'Lab {self.nn} step by step',head(tag,self.title.replace(': ',':<br>',1))+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('lab-welcome',side)+f'<div class="badge">{INSTRUCTOR}<br><small>Your instructor</small></div></aside>',[('lab-welcome',narration)],'cover')
 def overview(self,tag,heading,cards,banner):
  self.add('What you will learn',head(tag,heading)+'<div class="grid four">'+''.join(card(cid,t,h,b) for cid,t,h,b,_ in cards)+f'</div><div class="banner">{banner}</div>',[(cid,n) for cid,_,_,_,n in cards])
 def regions(self,kind,items):
  label='Concept map' if kind=='concepts' else 'Lab walkthrough'
  for n,t,text in items:self.shot(f'{kind}-{n}',f'{label} · {t}',{f'{kind}-{n}-region':text})
 def live_disabled(self,first,second):
  self.shot('live-disabled','Live · Setup is not ready yet',{'live-unavailable':first,'live-instructions':second})
 def restart(self,cmd_text,ready_text):
  raw=clean((R/'presentations/managed-agents-lab04-walkthrough/terminal/restart-server.raw.txt').read_text(encoding='utf-8')).split('\n')
  lines=['PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> # MANAGED_LIVE_ENABLED=true saved in .env; restart the backend:','PS C:\\Students\\Udemy-claude-managed-agents-Lab-75> npm.cmd run dev:server']+[x for x in raw if x.strip() and not x.strip().startswith('>')]
  self.terminal('Live · Enable live mode and restart',[(l,'restart-cmd' if l.endswith('npm.cmd run dev:server') else 'restart-ready' if 'Backend ready' in l else None) for l in lines],{'restart-cmd':cmd_text,'restart-ready':ready_text})
 def code(self,sections):
  for n,t,text in sections:self.shot(f'code-{n}',f'TypeScript · Section {n}: {t}',{f'code-{n}-section':text})
 def port(self,id,title,narration):self.shot(id,title,narration,note='PLATFORM SOURCE VIEWER')
 def mapping(self,heading,cards,banner):
  self.add('From the Agent SDK to Managed Agents',head('AGENT SDK · MANAGED AGENTS',heading)+'<div class="grid three">'+''.join(card(cid,t,h,b) for cid,t,h,b,_ in cards)+f'</div><div class="banner">{banner}</div>',[(cid,n) for cid,_,_,_,n in cards])
 def knowledge(self,question,answer):self.shot('knowledge','Check your understanding',{'knowledge-question':question,'knowledge-feedback':answer})
 def compare(self,title,heading,cards,banner):
  self.add(title,head('OFFLINE · LIVE',heading)+'<div class="grid three">'+''.join(card(cid,t,h,b) for cid,t,h,b,_ in cards)+f'</div><div class="banner">{banner}</div>',[(cid,n) for cid,_,_,_,n in cards])
 def summary(self,cards,next_lab):
  self.add(f'Lab {self.nn} summary',head(f'LAB {self.nn} · {self.topic.upper()}','What you can now explain')+'<div class="grid three">'+''.join(card(cid,t,h,b) for cid,t,h,b,_ in cards)+f'</div><div class="banner">Save a note in your notebook, tick your checklist, and continue with {next_lab}.</div>',[(cid,n) for cid,_,_,_,n in cards])
 def finish(self):
  tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
  css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
  css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:62px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:360px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.6}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px;margin-top:36px}.cover .badge small{font-size:21px;font-weight:normal}.four .card{min-height:250px}'''
  css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:20px;color:#c3d9ec;letter-spacing:1px}.shotcue{position:absolute;opacity:0}
.termslide{background:#0b1622}.terms{position:absolute;left:60px;right:60px;top:130px;bottom:50px;display:flex;gap:30px}.term{flex:1;min-width:0;background:#012456;border:2px solid #3c6ea8;border-radius:12px;overflow:hidden}.term-title{background:#e8edf3;color:#1b2a3a;font:22px Arial;padding:10px 16px;display:flex;gap:8px;align-items:center}.term-title span{width:14px;height:14px;border-radius:50%;background:#b8c3cf;display:inline-block}.term pre{margin:0;padding:22px 26px;color:#eef3f8;font:25px/1.42 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.tl{display:block}.tl.cue{display:block;width:fit-content;max-width:100%}.ps{color:#f9f1a5;font-weight:normal}'''
  for i,s in enumerate(self.slides):
   count=f'{i+1:02} / {len(self.slides):02}'
   if 'shot' in s['class']:s['body']=s['body'].replace('{count}',count)
   else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · LAB {self.nn} STEP BY STEP</span><span>{count}</span></div>'
  source=self.P/f'lab{self.nn}-walkthrough.html'
  source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(self.title)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(self.slides))+'</html>',encoding='utf-8')
  page=source.read_text(encoding='utf-8');assert 'sk-ant-usr-1' not in page and not re.search(r'(agent|env)_\w{20}',page),'Unmasked secret or ID in the deck'
  (self.P/'storyboard.json').write_text(json.dumps(self.slides,indent=2),encoding='utf-8')
  (self.V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {s["title"]}\n'+' '.join(t for _,t in s['segments']) for i,s in enumerate(self.slides)),encoding='utf-8')
  geom=self.P/'.build/video/slides/geometry.json'
  if geom.exists():
   g=json.loads(geom.read_text(encoding='utf-8'))
   if len(g)==len(self.slides):
    rows=[];audit=[]
    for i,s in enumerate(self.slides):
     segments=[]
     for cid,t in s['segments']:
      b=next(b for b in g[i]['rects'] if b['id']==cid);segments.append({'id':cid,'text':t,'target':{'textRects':[b['rect']],'paragraphGroups':[[0]]}});audit.append({'slide':i+1,'cue':cid,'narration':t,'visibleText':[b['text']]})
     rows.append({'slide':i+1,'segments':segments})
    prefix=f'Claude-Managed-Agents-Lab{self.nn}-Step-by-Step'
    plan={'project':self.name,'title':self.title,'displayTitle':self.title,'mediaPrefix':prefix,'outputFile':prefix+'.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows}
    (self.V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(self.V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
  words=sum(len(t.split()) for s in self.slides for _,t in s['segments'])
  print(f'Authored {len(self.slides)} Lab {self.nn} scenes; {words} narration words.')
