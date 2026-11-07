"""Guided learning walkthrough authored from real captures of the running learning platform."""
from pathlib import Path
import ast,hashlib,html,json,shutil
from plan_lab_settings import SETTINGS
R=Path(__file__).resolve().parents[1];N='managed-agents-guided-learning-walkthrough';P=R/'presentations'/N;V=R/'videos'/N;A=P/'assets';A.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
TITLE='Guided Learning Walkthrough: Study, Practice, and Track Your Progress'
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert not e['errors'] and not e['liveExecution'] and all(r['mode']=='scripted' for r in e['runs']) and 'completed' in e['normalOutcome']
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
add('Guided Learning Walkthrough',head('CLAUDE MANAGED AGENTS · STUDY · PRACTICE · TRACK','Guided Learning Walkthrough:<br>Study, Practice, and Track Your Progress')+'<img class="portal-cover" src="assets/portal-welcome.png"><aside class="cover-side">'+cue('guided-welcome','<h2>Your guided learning tools</h2><p>Study with narrated guides.<br>Practice and check answers.<br>Track progress and review.</p>')+'<div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>',[
 ('guided-welcome','Welcome to the guided learning walkthrough of the Claude Managed Agents learning platform. In this lecture, I will show you how to study each lab with guided explanations, practice with exercises and knowledge checks, and track your progress across the course. Everything you will see was captured from the real application running locally.')],'cover')
add('Three ways the platform supports you',head('ONE LAB · THREE LEARNING ACTIVITIES','Study, practice, and track your progress')+'<div class="grid three">'+card('guided-study','1 · STUDY','Guided explanations','Learning Guide and narrated tour<br>Concept map and lab walkthrough<br>Narrated TypeScript source')+card('guided-practice','2 · PRACTICE','Exercises and checks','Offline exercise fixtures<br>Knowledge check with explanations<br>Retry until it makes sense')+card('guided-track','3 · TRACK','Progress and review','Notebook, bookmarks and checklists<br>Learning paths and review queue<br>Backup of your learning state')+'</div><div class="banner">Red rectangles follow every narrated explanation, in the app and in this video.</div>',[
 ('guided-study','First, study. Every lab includes a Learning Guide with a narrated tour, an illustrated concept map, a lab walkthrough, and a narrated tour of its main TypeScript file. Red rectangles follow each spoken explanation.'),
 ('guided-practice','Second, practice. Run the exercise with offline fixtures, then test your understanding with a knowledge check that explains every answer and lets you try again.'),
 ('guided-track','Third, track your progress. Notes, bookmarks, checklists, learning paths, and a review queue are saved in your browser, and you can back them up whenever you like.')])
shot('lesson','Study · Open a lab and its learning tools',{
 'lesson-actions':'Open any lab, for example Lab one, Session event streaming. Under the title, five shortcuts take you straight to the Learning Guide, the knowledge check, your notebook, your checklist, and the exercise.',
 'lesson-promise':'As the page says, these tools are optional. Voice narration, highlighted steps, checklists, and personal notes are there to support you, and you can explore any lab at your own pace.'})
shot('guide','Study · Follow the Learning Guide step by step',{
 'guide-step':'Choose Start guided tour to open the Learning Guide panel. The lab is divided into seven steps, and here we are on step one, Understand the goal. Show section scrolls to that part of the lesson and outlines it in red. Next section moves you forward.',
 'guide-turn':'Each step ends with a Your turn prompt. Here, it asks you to describe the objective in your own words before opening the exercise. Pausing to answer these prompts turns reading into active learning.'})
shot('narrated','Study · Listen to the narrated tour',{
 'narrated-clock':'Prefer to listen? Choose Start narrated tour. The included Inworld voice recording plays, and a red rectangle follows the exact sentence being spoken. The clock shows your position in the current step.',
 'narrated-controls':'You can pause, replay, or change the playback speed at any time. The recordings ship with the course, so you do not need an Inworld API key, and the tour waits for you whenever it is your turn to act.'})
shot('map','Study · Explore the illustrated concept map',{
 'map-follow':'Next, open the Concept map tab and choose Play visual tour. Each lab has an illustrated infographic divided into six regions. With Follow the spoken region enabled, the viewer zooms and pans to the region being explained.',
 'map-clock':'The status line shows the current region and playback time. You can also use Previous and Next, the zoom controls, or numbered study links to explore the image yourself. The map is a teaching summary; the exercise shows actual results.'})
shot('walk','Study · Preview the practical steps',{
 'walk-follow':'The Lab walkthrough tab works the same way, but it focuses on the practical steps. Here, its first region explains how to choose the offline scenario and keep the baseline prompt.',
 'walk-clock':'Use the concept map to understand why, and the lab walkthrough to understand how. Together, they prepare you for the exercise.'})
shot('code','Study · Listen to the main TypeScript concept',{
 'code-clock':'In the TypeScript source tab, each lab includes a narrated tour of its main concept file. Choose Play code tour, and a red rectangle moves across the lines being explained. Section one of seven covers the schemas, ports, and runner in the first lines of the file.',
 'code-toolbar':'The code reading controls let you change the font size, turn line wrapping on or off, and open the code in full screen. Supporting files remain available for reading without narration.'})
shot('reader','Study · Read the code in full screen',{
 'reader-toolbar':'This is the full-screen reader, with a twenty pixel font and wrapping enabled. You can follow the code narration here, or play the code tour in full screen. Choose Exit full-screen code to return to the lesson.'},bar='bottom')
shot('practice','Practice · Run the exercise offline',{
 'practice-outcome':'Now it is time to practice. In Run the exercise, I ran the Normal turn offline fixture. The turn outcome reports completed, with stop reason end turn. Offline fixtures are authored teaching data, so they need no API key and create no billed session. The platform walkthrough lecture covers the exercise in detail.'})
shot('knowledge','Practice · Learn from the knowledge check',{
 'knowledge-question':'After the exercise, open the knowledge check. Lab one asks: what establishes turn completion? I deliberately chose a wrong answer: any answer text arriving in the stream.',
 'knowledge-feedback':'The feedback explains why. Response text can arrive before a turn reaches its reported outcome. It also shows the correct answer: the reported turn outcome and lifecycle evidence.',
 'knowledge-saved':'Your latest answer is saved in this browser. You can change your choice and check again whenever you are ready. Until then, this question waits for you in the review queue.'})
shot('knowledge-correct','Practice · Confirm your understanding',{
 'correct-question':'In Lab two, Session options, the question is: what does a local deadline prove?',
 'correct-feedback':'This time the answer is correct, and the explanation still appears. Read it anyway, because it reinforces the idea: local waiting limits and remote session state require separate evidence.'})
shot('notebook','Track · Save a note and bookmark the lab',{
 'notebook-note':'Use My lesson notebook to write down what you learned in your own words. I saved a note reminding myself that answer text can arrive before the turn ends, so I should check the outcome and lifecycle events. Saved notes are included in your learning backup.',
 'notebook-saved':'I also bookmarked the lesson for review, and the status confirms it. Notes are plain text, so keep passwords and API keys out of them.'})
shot('checklist','Track · Complete your learning checklist',{
 'checklist-summary':'My learning checklist contains four short checkpoints for each lab, such as explaining the objective and inspecting evidence. I ticked all four for Lab one, so it now shows four out of four. The checklist is your own self-assessment, saved in this browser and separate from exercise validation.'})
shot('progress','Track · See your course progress',{
 'progress-heading':'Back on Home, Course progress summarizes your journey: one of seventy-five checklists complete, one lab in progress, and seventy-three not started. Knowledge checks are counted separately: one correct, with two attempted.',
 'progress-continue':'Continue learning points to the next lab to work on, here Lab two, with direct links to its notebook, checklist, and exercise. Progress by topic and your bookmarked lessons are just below.'})
shot('paths','Track · Follow a learning path',{
 'paths-heading':'Learning paths offer four suggested routes: Managed Agents foundations, Application builder, Reliable orchestration, and the Complete course. No lesson is locked, and each path reuses your existing checklist progress.',
 'paths-status':'I chose Managed Agents foundations. The card now shows one of thirteen checklists complete and a Continue path link to Lab two. The selection is saved in this browser, and you can clear it at any time.'})
shot('review','Track · Return to your review queue',{
 'review-heading':'The review queue brings together everything that needs another look. The latest incorrect knowledge answers appear first, followed by your bookmarks. Use the filters to show all items, only knowledge checks, or only bookmarks.',
 'review-items':'Here is Lab one, listed because its knowledge check needs review and because I bookmarked it. A correct retry removes the knowledge reason; bookmarks stay until you remove them.'})
shot('milestones','Track · Apply several labs in a milestone project',{
 'milestones-heading':'When you are ready to combine several labs, try a milestone project. There are three offline projects. They use Node twenty-four or newer and need no dependency installation or API key.',
 'milestones-first':'The first, Event stream evidence viewer, builds on Labs one, six, and fifteen. Each starter is intentionally incomplete, so its tests fail until you implement it. Requirements, hints, and a solution walkthrough are included.'})
shot('backup','Track · Back up your learning state',{
 'backup-summary':'Finally, because your learning state lives in this browser, use Back up or restore my learning. Download a learning backup before clearing browser data or moving to another device. To restore, choose a backup file and review its preview before applying it.'})
add('Your guided learning routine',head('FOR EVERY LAB','Study, practice, and track your progress')+'<div class="grid three">'+card('close-study','1 · STUDY','Understand the idea','Start the guided tour.<br>Play the visual tours.<br>Listen to the code tour.')+card('close-practice','2 · PRACTICE','Test it yourself','Run the offline exercise.<br>Answer the knowledge check.<br>Read every explanation.')+card('close-track','3 · TRACK','Keep your momentum','Save notes and bookmarks.<br>Tick your checklist.<br>Follow a path and review.')+'</div><div class="banner">Start now: open Lab 01 and choose Start guided tour.</div>',[
 ('close-study','To sum up: study each lab with the Learning Guide, the illustrated tours, and the narrated code.'),
 ('close-practice','Practice with the offline exercise and the knowledge check, and let the explanations sharpen your understanding.'),
 ('close-track','Then track your journey with notes, checklists, learning paths, and the review queue. Open Lab one, start the guided tour, and enjoy learning with Claude Managed Agents.')])
tree=ast.parse((R/'scripts/create-agent-sdk-course-welcome.py').read_text(encoding='utf-8'));css=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in n.targets))
css=css.replace("background:linear-gradient(#ffffffee,#f7fbffec),url('../agent-sdk-platform-architecture/assets/claude-agent-sdk-learning-hero-background.png') center/cover","background:radial-gradient(ellipse at top right,#e1f2ff,#fff 70%)")
css+='''.cover{background:radial-gradient(ellipse at top right,#174e73,#081c36 70%);color:white}.cover h1{font-size:64px;margin-top:22px}.cover .tag{color:#ffad72}.portal-cover{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:390px;width:510px}.cover-side h2{font-size:39px}.cover-side p{font-size:33px;line-height:1.65}.cover .footer{color:#bed2e5}.cover .badge{font-size:26px}.cover .badge small{font-size:21px;font-weight:normal}'''
css+='''.shot{padding:0;background:#000}.shot .full{position:absolute;inset:0;width:1920px;height:1080px}.shot .bar{position:absolute;left:0;right:0;height:88px;background:#081c36;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:white;z-index:2}.shot .bar.top{top:0;border-bottom:3px solid #ff6b24}.shot .bar.bottom{bottom:0;border-top:3px solid #ff6b24}.shot .bar h1{font-size:34px;margin:0;line-height:1.2}.shot .bar span{font-size:21px;color:#c3d9ec}.shotcue{position:absolute;opacity:0}'''
for i,s in enumerate(slides):
 count=f'{i+1:02} / {len(slides):02}'
 if s['class']=='shot':s['body']=s['body'].replace('{count}',count)
 else:s['body']+=f'<div class="footer"><span>CLAUDE MANAGED AGENTS · GUIDED LEARNING WALKTHROUGH</span><span>{count}</span></div>'
source=P/'guided-learning.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(TITLE)+'</title><style>'+css+'</style>'+''.join(f'<section class="slide {s["class"]} {"active" if i==0 else ""}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
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
 plan={'project':N,'title':TITLE,'displayTitle':TITLE,'mediaPrefix':'Claude-Managed-Agents-Guided-Learning-Walkthrough','outputFile':'Claude-Managed-Agents-Guided-Learning-Walkthrough.mp4','presentation':source.relative_to(R).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8');(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
words=sum(len(t.split()) for s in slides for _,t in s['segments'])
print(f'Authored {len(slides)} guided learning scenes from {len(e["shots"])} real app captures; {words} narration words.')
