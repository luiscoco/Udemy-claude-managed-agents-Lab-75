"""Author the AI Tutor lesson using real app captures and the existing cover style."""
from pathlib import Path
import hashlib, html, json
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'ai-tutor-live-lab'
P = ROOT / 'presentations' / NAME
V = ROOT / 'videos' / NAME
P.mkdir(parents=True, exist_ok=True)
V.mkdir(parents=True, exist_ok=True)
evidence = json.loads((P / 'platform/capture-evidence.json').read_text(encoding='utf-8'))
assert evidence['complete'] and len(evidence['liveRequests']) == 2
assert all(r['status'] == 200 and not r['incomplete'] for r in evidence['liveRequests'])
TITLE = 'AI Tutor Live Lab: Choose a Claude Model, Ask Questions, and Save Answers'
css = '''*{box-sizing:border-box}body{margin:0;background:#081c36;color:white;font-family:Arial}.slide{display:none;position:relative;width:1920px;height:1080px;padding:65px 80px;overflow:hidden;background:radial-gradient(ellipse at top right,#174e73,#081c36 70%)}.active{display:block}.tag{color:#ffad72;letter-spacing:2px;font-size:24px;font-weight:bold}h1{font-size:58px;line-height:1.16;margin:25px 0 36px}h2{font-size:36px;margin:0 0 22px}p,li{font-size:32px;line-height:1.55}.textcue{display:table;width:auto}.footer{position:absolute;bottom:30px;left:80px;right:80px;display:flex;justify-content:space-between;color:#bed2e5;font-size:22px}.hero{position:absolute;left:80px;top:330px;width:1180px;border:4px solid #4085a8;border-radius:22px}.cover-side{position:absolute;left:1330px;top:390px;width:490px}.cover-side p{font-size:32px;line-height:1.7}.badge{background:#ff6b24;border-radius:20px;padding:23px;font-size:26px;margin-top:35px}.badge small{font-size:22px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:70px}.card{background:#143957;border:2px solid #4085a8;border-radius:22px;padding:32px;min-height:390px}.card h2{color:#ffad72}.two{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin-top:45px}.panel{background:#143957;border:2px solid #4085a8;border-radius:20px;padding:30px}pre{font:29px/1.8 Consolas,monospace;margin:0;white-space:pre-wrap}.full{position:absolute;inset:0;width:1920px;height:1080px}.bar{position:absolute;left:0;right:0;top:0;height:88px;background:#081c36;border-bottom:3px solid #ff6b24;padding:21px 30px;display:flex;align-items:center;justify-content:space-between}.bar h1{font-size:30px;margin:0}.bar span{font-size:19px;color:#c3d9ec}.shotcue{position:absolute;opacity:0}.note{color:#c5d9e9;margin-top:40px}'''
slides = []

def custom(title, body, segments):
    slides.append({'title': title, 'body': body, 'segments': segments})

def cue(cid, text):
    return f'<span class="textcue" data-cue="{cid}">{text}</span>'

def head(tag, title):
    return f'<div class="tag">{tag}</div><h1>{title}</h1>'

def shot(sid, title, narrations):
    capture = next(s for s in evidence['shots'] if s['id'] == sid)
    assert len(capture['cues']) == len(narrations), sid
    body = f'<img class="full" src="platform/{sid}.png"><div class="bar"><h1>{html.escape(title)}</h1><span>AI TUTOR LIVE LAB · REAL APPLICATION</span></div>'
    segments = []
    for target, narration in zip(capture['cues'], narrations):
        x, y, w, h = target['rect']
        body += f'<div class="shotcue" data-cue="{target["id"]}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
        segments.append((target['id'], narration))
    custom(title, body, segments)

custom(TITLE, head('CLAUDE MANAGED AGENTS · LEARN · BUILD · EXPERIMENT', cue('cover-title', 'AI Tutor Live Lab:<br>Choose a Claude Model, Ask Questions,<br>and Save Answers')) + '<img class="hero" src="../../public/images/portal-welcome.png"><aside class="cover-side"><h2>Your study companion</h2><p>' + cue('cover-route', 'Explore free guidance.<br>Ask two Claude models.<br>Save and reopen answers.') + '</p><div class="badge">Luis Coco Enríquez<br><small>Your instructor</small></div></aside>', [
    ('cover-title', 'Welcome to AI Tutor Live Lab: Choose a Claude Model, Ask Questions, and Save Answers.'),
    ('cover-route', 'We will use the current learning platform, try free prepared guidance, ask two real Claude models, and save useful responses. You will also learn how to reopen answers without paying for another request.')])

custom('Start the learning platform', head('STUDENT SETUP · NODE 24 OR NEWER', 'Install, configure and start') + '<div class="two"><div class="panel"><pre>' + cue('startup', 'npm ci\n# Create .env from .env.example\nnpm run dev') + '</pre><p>' + cue('local-url', 'Open the Local URL printed by Vite.<br>Default: http://127.0.0.1:5174') + '</p></div><div class="panel"><h2>For paid tutor questions</h2><pre>' + cue('tutor-env', 'ANTHROPIC_API_KEY=YOUR_PRIVATE_KEY\nAI_TUTOR_LIVE_ENABLED=true') + '</pre><p>Keep the key in the server environment.<br>Restart after changing configuration.</p></div></div>', [
    ('startup', 'From the course folder, install dependencies with npm ci. Create a private dot env file from the example if needed, then run npm run dev to start the web app and backend.'),
    ('local-url', 'Open the Local address printed by Vite. The default is shown here; use the actual printed address if another port is selected.'),
    ('tutor-env', 'Prepared guidance needs no key. For paid tutor answers, configure your own Anthropic API key and enable AI Tutor live mode on the server. Restart after editing the settings. Never show a real key in a recording or paste it into a question.')])

custom('Understand the two answer modes', head('BEFORE THE FIRST QUESTION', 'Prepared guidance and live answers') + '<div class="grid"><div class="card"><h2>Prepared · free</h2><p>' + cue('prepared-truth', 'Authored lesson material.<br>No model request.<br>Follows the selected topic.') + '</p></div><div class="card"><h2>Live Claude · paid</h2><p>' + cue('live-truth', 'Your question + lesson context.<br>Your selected model.<br>Consent for each request.') + '</p></div><div class="card"><h2>Tutor scope</h2><p>' + cue('tutor-scope', 'Explains course material.<br>Does not run your exercise.<br>Does not approve actions.') + '</p></div></div>', [
    ('prepared-truth', 'Prepared guidance is authored course content. It follows the suggested topic, rather than responding to custom wording. Calling it offline means no model request; the local platform still needs to be running.'),
    ('live-truth', 'Live Claude answers your actual question using the selected lesson context. Choose a model and authorize each paid request. The recording demonstrates real provider answers, not mocked responses.'),
    ('tutor-scope', 'The tutor explains and suggests. It does not execute the lab or approve its actions. This tutor uses the Messages API; the Managed Agents resource IDs used by live lab exercises and milestone projects are not required for tutor questions.')])

shot('open-tutor', '1 · Open AI Tutor inside a lesson', [
    'Open Lab zero one and choose the AI Tutor tab. The tutor is available throughout the seventy-five labs, with context from the lesson you selected.',
    'Start with the suggested questions. They cover a simple explanation, concepts and code, completion steps, a hint, expected results, and a short code example. Choose the kind of help you need.'])
shot('prepared-mode', '2 · Start with free prepared guidance', [
    'Answer mode starts on Prepared lesson guidance, free. This mode does not call an AI model and does not use API credits.',
    'Press Ask the tutor. We are running the real local prepared workflow. Its answer is based on authored lesson material, so custom wording does not change this mode into a tailored conversation.'])
shot('prepared-answer', '3 · Read the prepared explanation', [
    'Here is the prepared explanation for Session event streaming. Read the main concept and connect it to the objective of the lab.',
    'The Prepared guidance badge identifies its source. Keep this distinction when comparing it with a live response: useful authored teaching material is different from a new model answer.'])
shot('prepared-steps', '4 · Ask for steps and inspect the evidence', [
    'Now choose Steps to complete it and ask again. This gives a study sequence and checks for your work. In Lab zero one, focus on lifecycle evidence and the stop reason, not just the presence of agent text.'])
shot('prepared-code', '5 · Read coloured TypeScript examples', [
    'Simple code example shows an actual course source excerpt with syntax colours, line numbers and a Copy control. Read it alongside the surrounding TypeScript source. A short excerpt is not necessarily a complete program that you can run on its own.'])
shot('choose-model', '6 · Select Live Claude and a model', [
    'Change Answer mode to Live Claude, paid. The model selector loads models available to this server key. Here I selected Claude Haiku four point five. The catalog can change with account access, and prices vary by model; use the pricing link before choosing.'])
shot('focused-question', '7 · Write a focused question', [
    'Ask one concrete question. This request asks why visible agent text does not prove a completed turn, with three bullet points and a six-line TypeScript example. Short questions, clear output limits and the lesson number help keep the answer useful.'])
shot('paid-consent', '8 · Authorize one paid answer', [
    'Check the authorization box only after reviewing your question and model. The permission is for one paid answer. Changing the question or model resets it.',
    'Then press Ask the tutor. The button stays disabled without a selected model and consent. Sending resets consent again. The Stop control can cancel waiting, but a provider request already accepted may still incur charges.'])
shot('live-answer', '9 · Inspect the first real Claude answer', [
    'This response came from a real Claude request made during capture. The model explains the distinction between visible text and confirmed lifecycle completion. Read its reasoning, then compare it with the lesson source.',
    'The Live Claude badge identifies a generated response. Helpful prose is not execution evidence. The tutor has not run the Managed Agents exercise for us, and its claims still need checking.'])
shot('live-code', '10 · Review the generated code carefully', [
    'The live answer includes a coloured TypeScript snippet. Our question asked the model to label illustrative code. Use the line numbers and Copy control to study it, but compare placeholder names and event checks against the actual course implementation before using it.'])
shot('usage-and-save', '11 · Check usage, then save the response', [
    'The answer records the selected model and returned input and output token counts. These are usage measurements, not a dollar invoice. The tutor does not display an invented monetary cost or promise a dollar cap.',
    'Press Save this answer to retain the completed live response. Saving stores this answer; it does not ask Claude to generate it again. Partial answers cannot be saved as completed responses.'])
shot('saved-confirmation', '12 · Confirm that the answer was saved', [
    'The confirmation says Answer saved. You can reopen it below without another model request. Save useful answers before changing topics. The saved response keeps its question, model, time and token usage.'])
shot('reopen-answer', '13 · Reload and reopen without another model call', [
    'I reloaded the page, returned to AI Tutor and selected the saved question. The answer is still available. Request evidence confirms reopening did not send another paid question.',
    'The metadata shows its original model, save time and token counts. This is a saved answer, not a fresh response to the current text box. If the lesson material changes, the app can flag that its context is older.'])
shot('second-model', '14 · Try another model with fresh consent', [
    'For a second short question, I selected Claude Sonnet four point six and requested a next-step hint about early stream endings. This is a new paid request with fresh consent. Two different prompts demonstrate model switching; they are not a controlled model-quality comparison.'])
shot('second-answer', '15 · Use a short hint to continue learning', [
    'The second real answer focuses on evidence to inspect and why an early stream ending is incomplete. Use a hint to choose your next action, then run and inspect the exercise yourself. We save this answer as a second item in the same lesson library.'])
shot('saved-library', '16 · Build a saved library for each lab', [
    'Saved AI Tutor answers lists the two questions for this lesson. Select an entry to revisit its response. This capture used a separate browser profile, so its demonstration library does not modify your everyday browser library.'])
shot('remove-answer', '17 · Remove an answer you no longer need', [
    'Open the answer you want to remove, then press Remove saved answer. I removed the second demonstration answer and kept the first. Removing affects the local saved library; it makes no model request and does not reverse charges from the original question.'])
shot('lab50-context', '18 · Move to another lab for different context', [
    'Now I opened Lab fifty. Its phase label confirms the tutor is attached to this lesson, rather than our previous Lab zero one.',
    'The available guidance now follows the support desk capstone. Saved answers are scoped by lesson, so Lab zero one answers do not appear here. Ask for explanation or a hint, then verify the capstone through its own exercise controls.'])

custom('Keep saved answers available', head('LOCAL STORAGE · KNOW WHAT IS SAVED', 'Your saved answers belong to this installation') + '<div class="grid"><div class="card"><h2>Server database</h2><p>' + cue('saved-database', 'artifacts/ai-tutor/<br>ai-tutor.sqlite<br><br>Keep it when moving installs.') + '</p></div><div class="card"><h2>Browser identity</h2><p>' + cue('saved-browser', 'Reopen with the same profile.<br>Clearing browser storage<br>loses access to its answers.') + '</p></div><div class="card"><h2>Separate backups</h2><p>' + cue('saved-backup', 'Do not assume the learning<br>progress backup includes<br>the tutor database.') + '</p></div></div>', [
    ('saved-database', 'Completed live answers are stored in a local SQLite database under artifacts, AI Tutor. Keep that database when maintaining or moving this installation. Generated local data remains outside Git.'),
    ('saved-browser', 'A random browser identifier controls access to that browser library. Use the same browser profile. Clearing its storage loses access, even if the database still exists. This is local teaching isolation, not a production account system.'),
    ('saved-backup', 'The course learning-progress backup and tutor database are separate. Do not assume one includes the other. Saved answers do not automatically synchronize across devices. Keep credentials out of questions and saved text.')])

custom('Troubleshoot without repeating paid requests blindly', head('WHEN SOMETHING DOES NOT FINISH', 'Check configuration, scope and completion') + '<div class="grid"><div class="card"><h2>Live unavailable</h2><p>' + cue('error-config', 'Check server key and tutor flag.<br>Restart the platform.<br>Use Reload models if needed.') + '</p></div><div class="card"><h2>Partial answer</h2><p>' + cue('error-partial', 'Read the warning.<br>Cannot save as completed.<br>Ask a narrower question.') + '</p></div><div class="card"><h2>Timeout or stop</h2><p>' + cue('error-timeout', 'No automatic paid retry.<br>Accepted work may be billed.<br>Review before sending again.') + '</p></div></div>', [
    ('error-config', 'If live mode is unavailable, check the server API key and AI Tutor live enabled setting, then restart. A failed model list offers Reload models. Diagnose the configuration before sending a paid question.'),
    ('error-partial', 'The tutor allows at most four thousand ninety-six output tokens and requests concise answers. An output-limit response is labelled partial and cannot be saved as complete. A narrower question is a new request that needs new consent.'),
    ('error-timeout', 'Requests have a local deadline and no automatic paid retry. Stop or a timeout does not prove accepted provider work was free. These are troubleshooting instructions, not deliberately induced paid failures in this recording.')])

custom('Your next AI Tutor study session', head('PRACTICE · VERIFY · REMEMBER', 'Choose the smallest useful question') + '<div class="grid"><div class="card"><h2>1 · Understand</h2><p>' + cue('recap-prepared', 'Choose a lab.<br>Read prepared guidance.<br>Inspect a source example.') + '</p></div><div class="card"><h2>2 · Ask</h2><p>' + cue('recap-live', 'Choose a Claude model.<br>Write a focused question.<br>Authorize one paid answer.') + '</p></div><div class="card"><h2>3 · Remember</h2><p>' + cue('recap-save', 'Verify against the course.<br>Save useful answers.<br>Reopen without another call.') + '</p></div></div>', [
    ('recap-prepared', 'Begin with free prepared guidance and the actual source excerpt. Decide what you still need to understand.'),
    ('recap-live', 'When tailored help is useful, select a model, write one focused question and authorize a single paid answer.'),
    ('recap-save', 'Check the response against the lesson, save the useful result and revisit it without another model call. You are ready to make AI Tutor part of your own study routine.')])

source = P / 'walkthrough.html'
sections = []
for index, row in enumerate(slides):
    footer = '' if 'class="full"' in row['body'] else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · AI TUTOR LIVE LAB</span><span>{index+1:02} / {len(slides):02}</span></div>'
    sections.append(f'<section class="slide {"active" if index == 0 else ""}">{row["body"]}{footer}</section>')
source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>' + TITLE + '</title><style>' + css + '</style>' + ''.join(sections) + '</html>', encoding='utf-8')
(P / 'storyboard.json').write_text(json.dumps(slides, indent=2), encoding='utf-8')
(V / 'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {row["title"]}\n' + ' '.join(text for _, text in row['segments']) for i, row in enumerate(slides)), encoding='utf-8')
(V / 'walkthrough-evidence.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
geometry = P / '.build/video/slides/geometry.json'
if geometry.exists():
    measured = json.loads(geometry.read_text(encoding='utf-8'))
    assert len(measured) == len(slides)
    rows, audit = [], []
    for index, row in enumerate(slides):
        segments = []
        for cid, text in row['segments']:
            target = next(item for item in measured[index]['rects'] if item['id'] == cid)
            segments.append({'id': cid, 'text': text, 'target': {'textRects': [target['rect']], 'paragraphGroups': [[0]]}})
            audit.append({'slide': index+1, 'cue': cid, 'narration': text, 'visibleText': [target['text']]})
        rows.append({'slide': index+1, 'segments': segments})
    (V / 'narration-plan.json').write_text(json.dumps({'project': NAME, 'title': TITLE, 'displayTitle': TITLE, 'mediaPrefix': 'AI-Tutor-Live-Lab', 'outputFile': 'AI-Tutor-Live-Lab.mp4', 'presentation': source.relative_to(ROOT).as_posix(), 'presentationSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'settings': SETTINGS, 'verifyPhraseBoundaries': True, 'slides': rows}, indent=2), encoding='utf-8')
    (V / 'highlight-semantic-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
print(f'Authored {len(slides)} AI Tutor scenes using two real completed Claude responses.')
