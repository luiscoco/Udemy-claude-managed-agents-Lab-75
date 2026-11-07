"""Author a native-resolution, evidence-based student platform tutorial."""
from pathlib import Path
import json,html,hashlib
from plan_lab_settings import SETTINGS
ROOT=Path(__file__).resolve().parents[1];NAME='managed-agents-platform-walkthrough';P=ROOT/'presentations'/NAME;V=ROOT/'videos'/NAME
P.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert len(e['runs'])==2 and all(r['mode']=='scripted' for r in e['runs'])
assert 'completed' in e['normalOutcome'] and 'incomplete' in e['incompleteOutcome']
css='''*{box-sizing:border-box}body{margin:0;background:#081c36;color:white;font-family:Arial}.slide{display:none;position:relative;width:1920px;height:1080px;padding:80px 88px;overflow:hidden;background:radial-gradient(ellipse at top right,#174e73,#081c36 70%)}.active{display:block}h1{font-size:72px;line-height:1.15;margin:35px 0}p{font-size:34px;line-height:1.5}.tag{font-size:26px;letter-spacing:2px;color:#ffad72}.hero{position:absolute;left:88px;top:370px;width:1140px;border:5px solid #4085a8;border-radius:20px}.aside{position:absolute;left:1280px;top:430px;width:540px}.aside p{font-size:34px}.footer{position:absolute;bottom:30px;left:88px;font-size:23px;color:#b9cce0}.full{position:absolute;inset:0;width:1920px;height:1080px}.bar{position:absolute;left:0;right:0;top:0;height:88px;background:#081c36;border-bottom:3px solid #ff6b24;padding:21px 30px;display:flex;align-items:center;justify-content:space-between}.bar h1{font-size:31px;margin:0}.bar span{font-size:19px;color:#c3d9ec}.cue{position:absolute;opacity:0}.textcue{display:table;width:auto}pre{font:34px/1.65 Consolas;background:#182e45;border:2px solid #4085a8;padding:38px;border-radius:20px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:75px}.card{background:#143957;border:2px solid #4085a8;border-radius:24px;padding:32px;height:410px}.card h2{font-size:40px;color:#ffad72}.card p{font-size:32px}'''
slides=[]
def custom(title,body,cues):slides.append({'title':title,'body':body,'segments':cues})
custom('Your guide to the learning platform','''<div class="tag">CLAUDE MANAGED AGENTS · STUDENT WALKTHROUGH</div><h1 class="textcue" data-cue="welcome">Explore the platform.<br>Run your first lesson.</h1><img class="hero" src="../../public/images/portal-welcome.png"><div class="aside"><p class="textcue" data-cue="route">Find a lab<br>Follow its guide<br>Run and inspect<br>Save your learning</p></div><div class="footer">LUIS COCO ENRIQUEZ · REAL APPLICATION VIEWS AT 100% BROWSER ZOOM</div>''',[
('welcome','Welcome to the Claude Managed Agents learning platform. In this walkthrough, you will learn how to find your way around and run your first lesson.'),
('route','We will explore the learning tools, run a real offline practice scenario, inspect its events and outcome, and save notes for your next study session.')])
custom('Start the platform locally','''<div class="tag">BEFORE YOU BEGIN · LOCAL DEVELOPMENT</div><h1>Start the application</h1><pre><span class="textcue" data-cue="start">npm install<br>npm run dev</span></pre><p class="textcue" data-cue="address">Open http://127.0.0.1:5174<br>The backend normally listens on port 3076.</p><p>Follow the repository setup guide for prerequisites and supported Node versions.</p><div class="footer">FIRST EXERCISE: OFFLINE FIXTURE · NO PROVIDER CREDENTIALS REQUIRED</div>''',[
('start','From the project folder, install dependencies with npm install, then start the frontend and backend together with npm run dev. Follow the repository setup guide for prerequisites.'),
('address','Open the local address shown here, or the address printed by your terminal. The default frontend port is fifty-one seventy-four. Our first offline fixture needs no provider credentials.')])
def shot(id,title,narrations):
 s=next(s for s in e['shots'] if s['id']==id)
 assert len(s['cues'])==len(narrations),(id,len(s['cues']),len(narrations))
 body=f'<img class="full" src="platform/{id}.png"><div class="bar"><h1>{html.escape(title)}</h1><span>STUDENT WALKTHROUGH · NATIVE APP VIEW</span></div>'
 seg=[]
 for c,n in zip(s['cues'],narrations):
  x,y,w,h=c['rect'];body+=f'<div class="cue" data-cue="{c["id"]}" data-visible="{html.escape(c["text"],quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>';seg.append((c['id'],n))
 custom(title,body,seg)
shot('home','1 · Find your way around',[
 'The home page is your starting point. The sidebar contains seventy-five implemented lessons. Use Find a lesson to search by number, topic, or objective. Switch between topic groups and lesson order, then select a lesson to open it.'])
shot('setup','2 · Read Start here before your first exercise',[
 'Start here explains how to begin and what runs locally. Read the setup guidance before running an exercise. The browser displays the lessons; the backend owns execution. Keep provider credentials on the server, never in lesson notes or browser code.'])
shot('health','3 · Check that the backend is reachable',[
 'On the home page, choose Check backend. This view was captured after pressing that button. Backend readiness checks connectivity; it does not mean that every live provider integration is configured. If the check fails, review the backend terminal and local startup instructions.'])
shot('progress','4 · Understand your progress dashboard',[
 'Course progress separates completed checklists, work in progress, and lessons not started. These are your self-assessments, saved in this browser. They are separate from knowledge checks and exercise evidence. You can explore any lab without completing a checklist first.'])
shot('paths','5 · Choose a route through the course',[
 'Learning paths group related labs into a suggested route. Choose a path when you want structure, or use the sidebar freely. The progress area also links to a review queue and milestone projects. These tools help you plan your study rather than locking access to lessons.'])
shot('lesson','6 · Open Lab 01: Session event streaming',[
 'Now open Lab zero one, Session event streaming. Read its objective first: distinguish the agent response from lifecycle events and turn completion. The shortcuts lead to the Learning Guide, knowledge check, notebook, checklist, and exercise. The main tabs also expose source code and the concept map.'])
shot('guide','7 · Follow the Learning Guide',[
 'Choose Start guided tour to open the guide. Read the current goal, use Show section to locate it, and move with Next section. You can pause, minimize, or close the guide. Narrated guide playback depends on the recordings available for that lesson; the written guide remains useful.'])
shot('exercise','8 · Prepare your first exercise',[
 'Close the guide and select Run the exercise. Lab zero one sends one prompt and separates the answer from lifecycle status. Read the introduction before running anything.',
 'The default prompt asks for three bullet points about Managed Agents sessions. Keep it for your first run. In offline mode, the scenario selects an authored example; changing the prompt does not turn that fixture into a model response.'])
shot('controls','9 · Run the Normal turn offline fixture',[
 'Keep Offline scenario set to Normal turn, then click Run offline fixture. I pressed that button in the application for this walkthrough. This exercises the local request and event display without creating a billed provider session.',
 'Check the mode label. Offline authored fixture means deterministic teaching data, not a measurement of Claude. Run live is a separate billed action that requires the supported server configuration. It is unavailable in this recording, so no live session is being demonstrated.'])
shot('answer','10 · Inspect the answer after the run',[
 'The offline run has now produced output. Session metadata identifies the fixture session, and Agent text displays the authoritative agent message. A streaming preview may be replaced by its final message. Read the response here, but continue to the lifecycle and outcome sections before deciding whether the turn finished.'])
shot('outcome','11 · Confirm completion from lifecycle evidence',[
 'Lifecycle and span events show what happened around the message. These are separate from answer text. Look for the terminal status and its stop reason rather than assuming that a visible answer means success.',
 'Here the outcome is completed, with stop reason end turn. The application derived completion from session status idle. This is the expected result for the Normal turn fixture. Also inspect cleanup, interruption, and event counts when diagnosing a run.'])
shot('json','12 · Inspect the structured result',[
 'Expand Result JSON to inspect the same result as structured data. Raw events is another expandable section for tracing individual events. Use these views when the summary raises a question, and compare the reported source, outcome, and stop reason before drawing conclusions.'])
shot('incomplete','13 · Try an early stream ending',[
 'For a useful second experiment, select Stream ends early and run the offline fixture again. I also ran this scenario in the application. The outcome is incomplete because the stream ended before completion was confirmed. This is why answer text and turn completion must be checked separately.'])
shot('source','14 · Connect the behavior to TypeScript',[
 'Open TypeScript source to inspect the implementation behind this lab. The code viewer includes font size, wrapping, and full-screen controls. Follow the supporting modules to connect the route, request validation, event handling, and result types. Read a short relevant excerpt instead of trying to memorize the entire file.'])
shot('map','15 · Use the concept map as a recap',[
 'The Concept map tab gives you another view of how the lesson fits together. Use it after the exercise to revisit the relationships, then return to the source or Learning Guide for details. It complements the observed events; it does not replace running and checking the exercise.'])
shot('knowledge','16 · Check your understanding',[
 'Open the knowledge check. Choose an answer, then press Check answer and read the explanation. If you need another look, use Review lesson source. A correct knowledge answer shows understanding of the concept; it does not certify that an exercise or a live API run passed.'])
shot('notebook','17 · Save a useful note and bookmark',[
 'Open your lesson notebook and write the observation you want to remember. I entered a note about checking lifecycle completion, saved it, and bookmarked this lesson for review.',
 'The saved status confirms that the note is stored in this browser. Notes are plain text and are not sent to the provider. Keep credentials and private information out of them. A bookmark makes it easier to revisit the lesson later.'])
shot('checklist','18 · Record your own learning progress',[
 'Open My learning checklist and tick only the checkpoint you have actually reviewed. In this example, one item is checked. This updates your local self-assessment. Keep the distinction clear: checklist completion, a correct knowledge answer, and a successful execution are three different kinds of evidence.'])
shot('review','19 · Return to your review queue',[
 'Back on Home, the review queue helps you revisit bookmarked lessons and knowledge checks that need attention. Use its filters to focus your next session. Your notebook, checklist, and review tools belong to your browser profile, so another device will not automatically have the same state.'])
shot('backup','20 · Back up your learning state',[
 'Use Back up or restore my learning to download a backup of the learning state supported by this feature. To restore, choose a backup file and inspect its preview before confirming. No restore was performed in this walkthrough. Keep a backup before clearing browser storage or moving devices.'])
shot('validation','21 · Read recorded validation evidence carefully',[
 'Validation results contains recorded test evidence and links to the associated runs and commits. Check its date and scope. Opening this page does not run tests or certify every live integration. Your own exercise outcome and the current workflow status remain separate checks.'])
custom('Your next study session','''<div class="tag">YOUR NEXT STEP · LEARN, RUN, INSPECT, REVIEW</div><h1>Repeat a simple learning loop</h1><div class="cards"><div class="card"><h2>1 · Understand</h2><p class="textcue" data-cue="understand">Read the objective.<br>Follow the guide.</p></div><div class="card"><h2>2 · Experiment</h2><p class="textcue" data-cue="experiment">Run a scenario.<br>Inspect events and outcome.</p></div><div class="card"><h2>3 · Remember</h2><p class="textcue" data-cue="remember">Check your understanding.<br>Save notes and review.</p></div></div><p>Start with Lab 01, then continue through your chosen learning path.</p><div class="footer">CLAUDE MANAGED AGENTS · LEARNING PLATFORM</div>''',[
('understand','For each new lab, begin with its objective and guide.'),('experiment','Run a supported scenario, identify the source of its data, and inspect the outcome.'),('remember','Then check your understanding, save a useful note, and choose what to review next. You are ready to start learning with Lab zero one.')])
source=P/'walkthrough.html';source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Managed Agents Platform Walkthrough</title><style>'+css+'</style>'+''.join(f'<section class="slide {"active" if i==0 else ""}" data-slide="{i+1}">{s["body"]}</section>' for i,s in enumerate(slides))+'</html>',encoding='utf-8')
(P/'storyboard.json').write_text(json.dumps(slides,indent=2),encoding='utf-8')
(V/'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {s["title"]}\n'+' '.join(t for _,t in s['segments']) for i,s in enumerate(slides)),encoding='utf-8')
(V/'walkthrough-evidence.json').write_text(json.dumps(e,indent=2),encoding='utf-8')
geometry=P/'.build/video/slides/geometry.json'
if geometry.exists():
 g=json.loads(geometry.read_text(encoding='utf-8'));rows=[];audit=[]
 for i,s in enumerate(slides):
  segments=[]
  for cid,t in s['segments']:
   b=next(r for r in g[i]['rects'] if r['id']==cid);segments.append({'id':cid,'text':t,'target':{'textRects':[b['rect']],'paragraphGroups':[[0]]}});audit.append({'slide':i+1,'cue':cid,'narration':t,'visibleText':[b['text']]})
  rows.append({'slide':i+1,'segments':segments})
 (V/'narration-plan.json').write_text(json.dumps({'project':NAME,'title':'Claude Managed Agents — Learning Platform Walkthrough','displayTitle':'Claude Managed Agents — Learning Platform Walkthrough','mediaPrefix':'Claude-Managed-Agents-Platform-Walkthrough','outputFile':'Claude-Managed-Agents-Platform-Walkthrough.mp4','presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'verifyPhraseBoundaries':True,'slides':rows},indent=2),encoding='utf-8')
 (V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(f'Authored {len(slides)} tutorial scenes.')
