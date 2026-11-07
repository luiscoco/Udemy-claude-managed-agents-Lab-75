"""TypeScript code narration walkthrough authored from real captures of the running learning platform."""
from pathlib import Path
import ast,hashlib,html,json,shutil
from plan_lab_settings import SETTINGS
R=Path(__file__).resolve().parents[1];N='managed-agents-typescript-walkthrough';P=R/'presentations'/N;V=R/'videos'/N;A=P/'assets';A.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
TITLE='TypeScript Walkthrough: Listen, Follow the Code, and Continue Each Explanation'
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert not e['errors'] and not e['liveExecution'] and not e['labRequests']
status={s['id']:s['status'] for s in e['shots']}
assert 'Playing' in status['play'] and status['continue'].startswith('Section 2 /') and status['select'].startswith('Section 4 /') and status['next'].startswith('Section 5 /') and 'Playing' not in status['pause'] and status['fullscreen'].startswith('Section 6 /')
shutil.copy2(R/'public/images/portal-welcome.png',A/'portal-welcome.png')
slides=[]
def cue(cid,body):return f'<div class="cue" data-cue="{cid}">{body}</div>'
def head(tag,title):return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def card(cid,tag,title,body):return '<article class="card"><small>'+tag+'</small>'+cue(cid,f'<h2>{title}</h2><p>{body}</p>')+'</article>'
def add(title,body,segments,cls=''):slides.append({'title':title,'body':body,'segments':segments,'class':cls})
def shot(id,title,narration,bar='top'):
 s=next(s for s in e['shots'] if s['id']==id);cues={c['id']:c for c in s['cues']}
 assert set(cues)==set(narration),(id,set(cues),set(narration))
 body=f'<img class="full" src="platform/{id}.png"><div class="bar {bar}"><h1>{html.escape(title)}</h1><span>{{count}}</span></div>'
 for cid in narration:
  x,y,w,h=cues[cid]['rect'];body+=f'<div class="shotcue" data-cue="{cid}" data-visible="{html.escape(cues[cid]["text"],quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
 add(title,body,list(narration.items()),'shot')
add('TypeScript Walkthrough',head('CLAUDE MANAGED AGENTS · LISTEN · FOLLOW · CONTINUE','TypeScript Walkthrough:<br>Listen, Follow the Code, and Continue Each Explanation')+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('ts-welcome','<h2>Your code narration tools</h2><p>Listen to each section.<br>Follow the red rectangle.<br>Continue at your own pace.</p>')+'<div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('ts-welcome','Welcome to the TypeScript walkthrough of the Claude Managed Agents learning platform. Every lab includes a narrated tour of its main TypeScript concept file. In this lecture, you will learn how to listen to that tour, follow the code as a red rectangle moves through it, and continue each explanation at your own pace. Everything you will see was recorded from the real application running locally.')],'cover')
add('Listen, follow and continue',head('ONE NARRATED FILE PER LAB','Listen, follow the code, and continue each explanation')+'<div class="grid three">'+card('ts-listen','1 · LISTEN','Hear the main concept','Play code tour<br>Included Inworld recording<br>No API key needed')+card('ts-follow','2 · FOLLOW','Watch the exact lines','Red rectangle on the narrated lines<br>Source scrolls with the narration<br>Written explanation per section')+card('ts-continue','3 · CONTINUE','Learn at your own pace','Pause and Resume<br>Previous, Next and section selector<br>Speed, transcript and full screen')+'</div><div class="banner">75 labs · 75 narrated main concept files · 498 explained code sections</div>',[
 ('ts-listen','Listen: press Play code tour, and an included Inworld voice recording explains the file section by section. No API key is needed.'),
 ('ts-follow','Follow: a red rectangle frames the exact lines being explained, and the source panel scrolls with the narration.'),
 ('ts-continue','Continue: pause and resume, move to the previous or next explanation, jump to any section, change the speed, or read the transcript.')])
shot('source','Open the TypeScript source of a lab',{
 'source-file':'Open a lab, here Lab one, Session event streaming, and select the TypeScript source tab. The Source file selector starts on the narrated main concept file, server, concepts, zero one query dot T S.',
 'source-only':'Only this main concept file has a spoken walkthrough. The other files in the selector remain available for reading. The source is bundled as text, so viewing it never executes it.'})
shot('panel','Listen · The code tour panel',{
 'panel-intro':'The panel, Listen to the main TypeScript concept, names the narrated file and confirms that red rectangles follow the included Inworld recording.',
 'panel-actions':'Use Play code tour to start, Pause code tour to stop, and Replay code tour to begin again. Below them are the narration speed, the audio player, the section clock, and the explanation selector.'})
shot('play','Listen · Press Play code tour',{
 'play-section':'When you press Play, the page brings the source panel into view under the header. The quick controls show the current explanation: section one, Schemas, ports and the runner. The red rectangle frames lines one to nine, the imports this file depends on.',
 'play-pause':'The quick controls stay next to the code, so you can pause without scrolling back to the top of the panel.'})
shot('continue','Follow · The tour continues to the next section',{
 'continue-section':'You do not need to press anything to continue. When the recording reaches the next explanation, the tour moves to section two, Router state and origin checks. The source panel scrolls, and the red rectangle now frames lines eighteen to thirty.'})
shot('explain','Follow · Read the current explanation',{
 'explain-clock':'Above the code, the status line shows the section number, the playback time, and whether the narration is playing. Here we are in section two of seven, eighteen seconds into a recording of almost two minutes.',
 'explain-text':'Below it, the written explanation of the current section matches what you hear. Read it along with the narration, or use it later as a quick reminder of what these lines do.'})
shot('select','Continue · Jump to any explanation',{
 'select-menu':'To go straight to a specific part of the file, use the Code explanation section selector. Each option shows the section title and its line range. I chose section four, Choose the execution port, lines thirty-nine to forty-four.',
 'select-clock':'The recording jumps to the start of that explanation and continues playing from there, as the status line confirms.'})
shot('next','Continue · Move to the next explanation',{
 'next-section':'The Next button moves to the following explanation. Pressing it took us to section five, Deadlines and the event stream, and the red rectangle moved to lines forty-five to fifty.',
 'next-button':'Use Next and Previous to move through the file one explanation at a time, at the pace that suits you.'})
shot('pause','Continue · Pause and resume',{
 'pause-resume':'Pause whenever you want to study the highlighted lines more closely. The button changes to Resume, and the red rectangle stays on the current section.',
 'pause-previous':'When you are ready, choose Resume to continue the same explanation from where you stopped, or Previous to hear the earlier one again.'})
shot('speed','Continue · Choose your listening speed',{
 'speed-select':'Code narration speed offers zero point seven five, one, one point two five, and one point five times. Here I changed it to one point two five while the narration kept playing.',
 'speed-audio':'The standard audio player is also available. Use its seek bar to move to any moment; the highlighted section follows the timing of the recording.'})
shot('follow','Follow · Scroll the code yourself',{
 'follow-toggle':'Follow the narrated code inside the source panel is on by default. Turn it off when you want to scroll the code yourself. The narration keeps playing, but your page and source positions stay where you leave them, and the red rectangle appears whenever the narrated lines are in view.'})
shot('transcript','Follow · Read the code tour transcript',{
 'transcript-summary':'Prefer to read? Open Read code tour transcript. It lists every explanation in the tour, so the content is available even without audio.',
 'transcript-first':'Each entry shows the section title and its line range, followed by the full explanation. Section one, for example, covers lines one to nine.'})
shot('reading','Follow · Adjust the code reading controls',{
 'reading-font':'The code reading controls help you read comfortably. Code font size goes from fourteen to twenty-four pixels; here it is set to twenty-four.',
 'reading-wrap':'Wrap code is on by default. I turned it off, so long lines stay on one line and you scroll horizontally inside the source panel. The red rectangle is remeasured whenever the font or wrapping changes.'})
shot('fullscreen','Continue · Keep listening in full screen',{
 'full-toolbar':'Enter full-screen code opens a reader that fills the screen, with its own font, wrap, and Follow code narration controls. Here it uses a twenty pixel font with wrapping on.',
 'full-quick':'The quick controls work here too. I resumed the tour inside the full-screen reader, and it continued to section six, Progress, result and error flow. Press Escape or choose Exit full-screen code to return.'},bar='bottom')
shot('supporting','Read supporting files without narration',{
 'supporting-file':'Supporting files remain readable without narration. Here I selected the React component for this lab, source, concepts, Concept zero one Query dot T S X.',
 'supporting-note':'The note reminds you that only the main concept file has a spoken walkthrough, and Open narrated main concept takes you straight back to it.'})
shot('lab75','Every lab has a narrated main concept',{
 'lab75-section':'Every one of the seventy-five labs works the same way. Here is Lab seventy-five, the autonomous engineering team capstone, playing section one, Concept and dependencies. Across the course, there are four hundred and ninety-eight narrated code sections.'})
add('Your code reading routine',head('FOR EVERY LAB','Listen, follow the code, and continue each explanation')+'<div class="grid three">'+card('close-listen','1 · LISTEN','Start the tour','Open TypeScript source.<br>Press Play code tour.<br>Choose a comfortable speed.')+card('close-follow','2 · FOLLOW','Stay on the lines','Watch the red rectangle.<br>Read each explanation.<br>Open the transcript any time.')+card('close-continue','3 · CONTINUE','Go at your pace','Pause and Resume.<br>Previous, Next or jump.<br>Read in full screen.')+'</div><div class="banner">Start now: open Lab 01, select TypeScript source and press Play code tour.</div>',[
 ('close-listen','To sum up: listen to each main concept file with Play code tour.'),
 ('close-follow','Follow the red rectangle as it moves through the code, and use the written explanations and transcript whenever you want to read.'),
 ('close-continue','Continue each explanation at your own pace with Pause, Resume, Previous, Next, and the section selector. Open the TypeScript source of any lab and press Play code tour to begin.')])
tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:56px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:390px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.65}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px}.cover .badge small{font-size:21px;font-weight:normal}'''
css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar.bottom{bottom:0;border-top:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:21px;color:#c3d9ec}.shotcue{position:absolute;opacity:0}'''
for i,s in enumerate(slides):
 count=f'{i+1:02} / {len(slides):02}'
 if s['class']=='shot':s['body']=s['body'].replace('{count}',count)
 else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · TYPESCRIPT WALKTHROUGH</span><span>{count}</span></div>'
source=P/'typescript-walkthrough.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(TITLE)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
(P/'storyboard.json').write_text(json.dumps(slides,indent=2),encoding='utf-8');(V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {s["title"]}\n'+' '.join(t for _,t in s['segments']) for i,s in enumerate(slides)),encoding='utf-8')
(V/'walkthrough-evidence.json').write_text(json.dumps(e,indent=2),encoding='utf-8')
geom=P/'.build/video/slides/geometry.json'
if geom.exists():
 g=json.loads(geom.read_text(encoding='utf-8'));rows=[];audit=[]
 for i,s in enumerate(slides):
  segments=[]
  for cid,t in s['segments']:
   b=next(b for b in g[i]['rects'] if b['id']==cid);segments.append({'id':cid,'text':t,'target':{'textRects':[b['rect']],'paragraphGroups':[[0]]}});audit.append({'slide':i+1,'cue':cid,'narration':t,'visibleText':[b['text']]})
  rows.append({'slide':i+1,'segments':segments})
 plan={'project':N,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Claude-Managed-Agents-TypeScript-Walkthrough','outputFile':'Claude-Managed-Agents-TypeScript-Walkthrough.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
words=sum(len(t.split()) for s in slides for _,t in s['segments'])
print(f'Authored {len(slides)} TypeScript walkthrough scenes from {len(e["shots"])} real app captures; {words} narration words.')
