"""Author a separate 88-second course trailer using the user's Udemy outline."""
from pathlib import Path
import ast,hashlib,html,json,shutil
from plan_lab_settings import SETTINGS
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-udemy-promo-88s-v1'
P=ROOT/'presentations'/NAME;V=ROOT/'videos'/NAME
P.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
for f in ['cover.png','astronaut.png']:shutil.copy2(ROOT/'presentations/agent-sdk-course-concepts-and-app-v4'/f,P/f)
shutil.copy2(ROOT/'presentations/agent-sdk-free-course-promo-v2/assets/author-photo.png',P/'author-photo.png')
cap=ROOT/'presentations/agent-sdk-complete-browser-tour-v3/capture'
for src,dest in [('scene-01.png','app-overview.png'),('scene-39.png','app-run.png')]:shutil.copy2(cap/src,P/dest)
old=ast.parse((ROOT/'scripts/create-sdk-course-infographics.py').read_text(encoding='utf8'))
style=next(ast.literal_eval(n.value) for n in old.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='style' for t in n.targets))
extra='''h1{font-size:59px;line-height:1.12;margin-top:8px}.slide{padding-top:55px}.sub{font-size:30px;margin-top:18px}.astronaut{height:180px}.tag{font-size:22px;letter-spacing:1.8px;color:#087fff;font-weight:800;margin-bottom:22px}.footer{font-size:18px}.welcome{display:grid;grid-template-columns:530px 1fr;gap:36px;margin-top:40px}.instructor{background:#edf7ff;border:1px solid #d7e9f6;border-radius:32px;padding:26px;text-align:center}.portrait{width:300px;height:303px;object-fit:contain;border-radius:28px;margin-bottom:25px;box-shadow:0 0 30px #00afff22}.name{font-size:40px;font-weight:800;line-height:1.18;margin:0 0 17px}.role{font-size:27px;line-height:1.3;margin:0}.right-label{font-size:32px;font-weight:700;margin-bottom:20px}.app-frame{background:white;border:2px solid #d7e9f6;border-radius:25px;overflow:hidden}.app-frame img{display:block;width:100%}.promise{font-size:35px;font-weight:700;line-height:1.3;background:#edf7ff;border-radius:22px;padding:22px;margin-top:22px}.benefits .skill{position:absolute;left:64px;width:540px;min-height:194px;padding:26px;border-radius:27px;border:1px solid #dce9f5;background:var(--fill)}.skill h2{font-size:32px;line-height:1.15;margin:0 0 16px}.skill p{font-size:28px;line-height:1.32;margin:0}.benefits .app-frame{position:absolute;left:650px;top:283px;width:1200px;height:675px;border:0;border-radius:0}.evidence{position:absolute;left:650px;top:972px;font-size:19px;color:#557596}.benefits .sub{max-width:1550px}.topic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:38px}.topic{height:248px;padding:32px;border-radius:29px;background:var(--fill);border:1px solid #dce9f5}.topic .num{margin-bottom:25px;background:var(--color)}.topic h2{font-size:34px;line-height:1.2;margin:0}.format{font-size:32px;font-weight:700;color:#087fff;display:inline-block;margin-top:7px}.learner-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:27px;margin-top:50px}.learner-card{height:490px;border:1px solid #dce9f5;border-radius:30px;background:var(--fill);padding:35px}.learner-card .num{background:var(--color);margin-bottom:35px}.learner-card h2{font-size:32px;color:var(--color);margin:0 0 28px}.learner-card p{font-size:37px;font-weight:700;line-height:1.32;margin:0}.learner-card small{display:block;font-size:28px;font-weight:400;line-height:1.35;margin-top:25px}.cta-panel{position:absolute;left:170px;right:170px;top:315px;border-radius:42px;border:1px solid #cde5f8;background:linear-gradient(120deg,#edf8ff,#f6f0ff);padding:63px;text-align:center}.cta-panel .free{font-size:26px;font-weight:800;color:#00a977;letter-spacing:2px}.cta-panel h2{font-size:83px;color:#087fff;margin:27px 0}.cta-panel p{font-size:37px;line-height:1.4;margin:20px 0}.cta-panel .last{font-size:30px;margin-top:35px;font-weight:700}.cta .astronaut{height:230px;right:110px;top:55px}.cta h1{max-width:1400px}.marker{position:absolute;bottom:30px;right:65px;font-size:20px;color:#087fff;font-weight:bold}'''
extra+='''.welcome .app-frame{height:420px;display:flex;align-items:center;justify-content:center;background:#f2f8ff}.welcome .app-frame img{height:100%;width:auto;max-width:100%;object-fit:contain}'''
parts=['<!doctype html><meta charset="utf-8"><title>Claude Agent SDK · Udemy Course Promo</title><style>'+style+extra+'</style>']
parts.append('<section class="slide cover active" data-slide="1"><img src="cover.png"></section>')
def start(n,cls,tag,title,sub):
 parts.append(f'<section class="slide {cls}" data-slide="{n}"><img class="astronaut" src="astronaut.png"><div class="tag">{tag}</div><h1>{title}</h1><p class="sub">{sub}</p>')
def end(n,label):parts.append(f'<footer class="footer">CLAUDE AGENT SDK · CORE CONCEPTS &amp; PRACTICE · FREE COURSE</footer><span class="marker">{label}</span></section>')
start(2,'','WELCOME · MEET YOUR INSTRUCTOR','A practical start with <em>Claude Agent SDK</em>','Build your foundation with concepts you can connect to working examples.')
parts.append('<div class="welcome"><div class="instructor"><img class="portrait" src="author-photo.png"><div data-cue="welcome-1"><p class="name">Luis Coco Enriquez</p><p class="role">Creator of this free<br>Claude Agent SDK course</p></div></div><div><div class="right-label" data-cue="welcome-2">Runnable learning applications, built for this course</div><div class="app-frame"><img src="app-overview.png"></div><div class="promise" data-cue="welcome-3">From your first agent request<br>to a result you can verify.</div></div></div>')
end(2,'WELCOME')
start(3,'benefits','BENEFITS · WHAT YOU WILL BE ABLE TO DO','Build skills you can <em>put to work</em>','A small application. Observable behavior. Clear execution choices.')
for y,c,fill,title,body,cid in [(283,'#087fff','#eff8ff','Run your first agent','Set up a small app and send a focused task with query().','benefit-1'),(503,'#00a977','#edfbf5','Read execution evidence','Follow messages and tool activity, then check the final result.','benefit-2'),(723,'#8838ff','#f6f1ff','Configure a bounded run','Choose the environment, turn limit, and estimated spending threshold.','benefit-3')]:
 parts.append(f'<article class="skill" style="top:{y}px;--fill:{fill}"><div data-cue="{cid}"><h2 style="color:{c}">{title}</h2><p>{body}</p></div></article>')
parts.append('<div class="app-frame"><img src="app-run.png"></div><div class="evidence">REAL APP RECORDING · EDITED FOR PROMO PACING</div>')
end(3,'PRACTICAL OUTCOMES')
start(4,'','COURSE ROADMAP · THE MAJOR TOPICS','A focused path from <em>concept to practice</em>','Concise explanations paired with practical applications.')
parts.append('<div class="format" data-cue="topics-0">13 core lectures · 8 practical examples · 2 sections</div><div class="topic-grid">')
topics=['Setup and first application','query() and the agent loop','Agent message types','Context and compaction','Options, models, effort, environment','Turns and spending']
colors=['#087fff','#00a977','#8838ff','#f58a00','#ee147e','#087fff'];fills=['#eff8ff','#edfbf5','#f6f1ff','#fff6ed','#fff1f8','#eff8ff']
for i,title in enumerate(topics):parts.append(f'<article class="topic" style="--color:{colors[i]};--fill:{fills[i]}"><span class="num">{i+1}</span><h2 data-cue="topics-{i+1}">{title}</h2></article>')
parts.append('</div>');end(4,'WHAT YOU WILL LEARN')
start(5,'','IS THIS COURSE FOR YOU?','For developers ready to <em>try agents</em>','A practical starting point, with basic coding knowledge.')
parts.append('<div class="learner-grid">')
for i,(title,main,body) in enumerate([('YOUR STARTING POINT','Developers and technical learners','You can read basic code and want a focused introduction.'),('YOUR GOAL','Build a working first example','Move from curiosity about AI agents to a small application.'),('YOUR CHALLENGE','Connect the pieces with confidence','See how SDK concepts relate to real application behavior.')]):
 parts.append(f'<article class="learner-card" style="--color:{colors[i]};--fill:{fills[i]}"><span class="num">{i+1}</span><h2>{title}</h2><div data-cue="learner-{i+1}"><p>{main}</p><small>{body}</small></div></article>')
parts.append('</div><div class="takeaway"><span class="star">★</span>A clear route from setup to your first practical agent example.</div>');end(5,'YOUR NEXT STEP')
start(6,'cta','START YOUR FIRST PRACTICAL EXAMPLE','<span data-cue="cta-1">Thank you for watching.</span>','Claude Agent SDK · Core Concepts &amp; Practice')
parts.append('<div class="cta-panel"><div class="free">FREE COURSE ON UDEMY</div><div data-cue="cta-2"><h2>Enroll for free</h2><p>Or explore the available previews.</p></div><p class="last">Take your first practical step with Claude Agent SDK.</p></div>');end(6,'JOIN THE COURSE')
parts.append('<script>window.showSlide=n=>document.querySelectorAll(".slide").forEach(s=>s.classList.toggle("active",Number(s.dataset.slide)===n));document.addEventListener("keydown",e=>{let n=Number(document.querySelector(".active").dataset.slide);showSlide(Math.max(1,Math.min(6,n+(e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0))))});</script>')
(P/'promo-slides.html').write_text('\n'.join(parts),encoding='utf8')
sections=[
 {'slide':1,'start':0,'duration':3,'title':'Course branding','segments':[]},
 {'slide':2,'start':3,'duration':20,'title':'Welcome and instructor introduction','segments':[
 ('welcome-1','Welcome to this free Claude Agent SDK course by Luis Coco Enriquez,'),
 ('welcome-2','the creator of the runnable learning applications you will see here,'),
 ('welcome-3','designed to help you move from your first agent request to reading real results and making informed choices about how your agent runs.')]},
 {'slide':3,'start':23,'duration':20,'title':'Practical benefits','segments':[
 ('benefit-1','By the end, you will be able to set up a small agent application and send a task with query.'),
 ('benefit-2','Follow its messages and tool activity, and check the final result.'),
 ('benefit-3','You will also configure the working environment and set limits on turns and estimated spending for your own experiments.')]},
 {'slide':4,'start':43,'duration':20,'title':'Major learning objectives','segments':[
 ('topics-0','Thirteen core lectures combine concise explanations with eight practical examples.'),
 ('topics-1','The topics are setup;'),('topics-2','query and the agent loop;'),('topics-3','message types;'),('topics-4','context and compaction;'),('topics-5','options, models, effort, and environment;'),('topics-6','and limits on turns and spending.')]},
 {'slide':5,'start':63,'duration':15,'title':'Ideal learner','segments':[
 ('learner-1','For developers and technical learners who can read basic code,'),
 ('learner-2','and want a practical starting point with AI agents.'),
 ('learner-3','If connecting SDK concepts to a working app feels confusing, these examples give you a clear path.')]},
 {'slide':6,'start':78,'duration':10,'title':'Thank you and call to action','segments':[
 ('cta-1','Thank you for watching.'),('cta-2','Enroll in the free course, or explore the available previews, and take your first practical step with Claude Agent SDK.')]}]
spec={'project':NAME,'duration':88,'fps':30,'resolution':[1920,1080],'sectionTimings':sections,'transitionSeconds':.4,'speechOffsetWithinSection':.6,'voice':'Inworld Yash; clearly a narrator, not a voice clone of the instructor','instructorRepresentation':'Original supplied photograph; no invented camera recording or credentials','evidenceSource':'agent-sdk-complete-browser-tour-v3; successful real query; no mocks','references':['https://teach.udemy.com/publishing/promo-video/','https://teach.udemy.com/course-creation/learning-objectives/']}
(P/'promo-spec.json').write_text(json.dumps(spec,indent=2),encoding='utf8')
(V/'narration-script.txt').write_text('\n\n'.join(f'{s["start"]:02}–{s["start"]+s["duration"]:02}s · {s["title"]}\n'+('Silent branding hold.' if not s['segments'] else ' '.join(t for _,t in s['segments'])) for s in sections),encoding='utf8')
(V/'editorial-notes.txt').write_text('Separate 88-second course trailer following the instructor-provided Udemy outline: 3 + 20 + 20 + 20 + 15 + 10 seconds. Transitions fit inside these windows. The first three seconds are silent.\nThe synthetic Yash voice introduces Luis in the third person; it is not an imitation of his voice. Instructor credibility is limited to the supplied course and runnable learning apps. The original portrait is used because no camera clip was supplied. Benefits are practical and achievable, the objectives section lists topics without teaching code, the audience assumes basic coding knowledge, and the closing invites free enrollment or previews. No other course is advertised.\nThe benefits montage reuses unmocked app footage from the verified real query. It is edited for promo pacing.\nReferences:\nhttps://teach.udemy.com/publishing/promo-video/\nhttps://teach.udemy.com/course-creation/learning-objectives/\n',encoding='utf8')
print('Authored six promo scenes with exact 88-second structure.')
geometry=P/'.build/video/slides/geometry.json'
if geometry.exists():
 g=json.loads(geometry.read_text(encoding='utf8'));rows=[];audit=[]
 for i,s in enumerate(sections[1:],1):
  seg=[]
  for cid,text in s['segments']:
   box=next(b for b in g[s['slide']-1]['rects'] if b['id']==cid);target={'textRects':[box['rect']],'paragraphGroups':[[0]]}
   seg.append({'id':cid,'text':text,'target':target});audit.append({'cue':cid,'slide':s['slide'],'narration':text,'visibleText':[box['text']]})
  rows.append({'slide':i,'visualSlide':s['slide'],'segments':seg})
 source=P/'promo-slides.html'
 plan={'project':NAME,'title':'Claude Agent SDK: Free Course Promo','mediaPrefix':'Claude-Agent-SDK-Udemy-Promo-88s','presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputFile':'Claude-Agent-SDK-Udemy-Promo-88s.mp4','settings':SETTINGS,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
 print('Prepared',len(audit),'narrated passages. Branding remains silent.')
