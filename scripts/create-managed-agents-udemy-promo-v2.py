"""Author the full Claude Managed Agents course promo from supplied course facts."""
from pathlib import Path
import hashlib
import html
import json
import re
import shutil
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'managed-agents-udemy-course-promo-v2'
P, V = ROOT / 'presentations' / NAME, ROOT / 'videos' / NAME
for folder in [P, V, P / 'assets', P / 'platform']: folder.mkdir(parents=True, exist_ok=True)
TITLE = 'Claude Managed Agents'
IMAGE = Path(r'C:\Users\luis.coco\Downloads\Ilustración tecnológica de agentes Claude (1).png')
shutil.copy2(IMAGE, P / 'assets/course-cover.png')
outline_path = Path(r'C:\Users\luis.coco\.codex\attachments\798934a3-f60c-4976-9240-fb51b6386e70\Pasted text.txt')
outline = outline_path.read_text(encoding='utf-8-sig')
sections = re.findall(r'^Section (\d+):\s*\n([^\n]+)', outline, re.M)
examples = re.findall(r'^Practical Example (\d+): ([^\n]+)', outline, re.M)
assert len(sections) == 18 and len(examples) == 60 and {int(n) for n, _ in examples} == set(range(1, 61))
(P / 'course-outline.txt').write_text(outline.split('\nLibrary')[0], encoding='utf-8')
platform_root = ROOT / 'presentations/managed-agents-platform-walkthrough/platform'
platform = json.loads((platform_root / 'capture-evidence.json').read_text(encoding='utf-8'))
tutor_root = ROOT / 'presentations/gcp-cloud-run-deployment/platform'
tutor = json.loads((tutor_root / 'capture-evidence.json').read_text(encoding='utf-8'))
assert tutor['complete'] and not tutor['errors']
screens = {}
for name in ['home', 'progress', 'outcome', 'map', 'source']:
    record = next(row for row in platform['shots'] if row['id'] == name)
    shutil.copy2(platform_root / (name + '.png'), P / 'platform' / (name + '.png'))
    screens[name] = record
record = next(row for row in tutor['screenshots'] if row['id'] == 'tutor-prepared')
shutil.copy2(tutor_root / 'tutor-prepared.png', P / 'platform/tutor-prepared.png')
screens['tutor-prepared'] = record
slides = []


def cue(cid, text): return f'<span class="textcue" data-cue="{cid}">{text}</span>'
def head(tag, title): return f'<div class="tag">{tag}</div><h1>{title}</h1>'
def add(title, body, segments, cls=''): slides.append({'title': title, 'body': body, 'segments': segments, 'cls': cls})


def shot(name, title, selections):
    row = screens[name]
    body = f'<img class="full" src="platform/{name}.png"><div class="shotbar"><h1>{html.escape(title)}</h1><span>ACTUAL LEARNING PLATFORM · RECORDED PREPARED WORKFLOW</span></div>'
    segments = []
    for index, narration in selections:
        target = row['cues'][index]
        cid = name + '-' + str(index)
        x, y, w, h = target['rect']
        body += f'<div class="shotcue" data-cue="{cid}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
        segments.append((cid, narration))
    add(title, body, segments, 'shot')


add('Claude Managed Agents', '<img class="full cover-art" src="assets/course-cover.png"><div class="cover-top">'
    + cue('cover-title', 'Claude Managed Agents')
    + '<p>Learn the concepts. Build the applications.</p></div><div class="cover-credit">A course by Luis Coco Enríquez</div>', [
    ('cover-title', 'Welcome to Claude Managed Agents, a practical course by Luis Coco Enriquez. Understand the concepts, then turn them into working applications.')], 'cover')

metrics = [
    ('hours', '40', 'hours of video', 'Explore forty hours of video.'),
    ('concepts', '60', 'concept lessons', 'Learn through sixty concept lessons.'),
    ('examples', '60', 'practical example applications', 'Connect the ideas to sixty practical example applications.'),
    ('labs', '75', 'platform labs', 'Practice with seventy five labs in the learning platform.'),
    ('projects', '3', 'learning projects', 'Then bring your skills together in three learning projects.')]
body = head('YOUR COURSE AT A GLANCE', 'A complete path from ideas to practice') + '<div class="metrics">'
for cid, number, label, _ in metrics:
    body += '<article>' + cue('metric-' + cid, f'<b>{number}</b><span>{label}</span>') + '</article>'
body += '</div><p class="bottom-line">Understand · Experiment · Build · Verify</p>'
add('40 hours · 60 concepts · 60 applications · 75 labs · 3 projects', body,
    [('metric-' + cid, narration) for cid, _, _, narration in metrics])

pillars = [
    ('foundations', 'Start with the foundations', 'Agents · Sessions · Environments', 'Start with agents, sessions, environments and the events that connect them.'),
    ('context', 'Build useful capabilities', 'Memory · Tools · Integrations', 'Explore context, memory, tools and integrations through practical examples.'),
    ('governance', 'Keep control of execution', 'Security · Approvals · Evaluation', 'Study security, human approvals, evaluation and reliable execution.'),
    ('orchestration', 'Coordinate larger workflows', 'Multi-agent systems · Production patterns', 'Progress to multi agent coordination, production patterns and applied capstones.')]
body = head('FROM FOUNDATIONS TO ADVANCED APPLICATIONS', 'Know how the pieces work together') + '<div class="pillars">'
for cid, title, details, _ in pillars:
    body += '<article><h2>' + title + '</h2><p>' + cue(cid, details) + '</p></article>'
body += '</div>'
add('Explore the curriculum', body, [(cid, narration) for cid, _, _, narration in pillars])

shot('home', 'Welcome to the learning platform', [(0,
    'Start on the actual platform Home page. Browse seventy five labs by topic or lesson, choose a learning path, and continue your learning.')])

capabilities = [
    ('guided', 'Guided learning', 'Narrated tours · Illustrated concept maps', 'Follow narrated tours and illustrated concept maps.'),
    ('practice', 'Hands-on practice', 'Runnable exercises · TypeScript source', 'Run exercises and inspect the TypeScript behind each lesson.'),
    ('tutor', 'Study support', 'AI Tutor · Prepared explanations', 'Use the AI Tutor for prepared explanations alongside your work.'),
    ('progress', 'Your learning tools', 'Checklists · Knowledge checks · Notes', 'Track your learning with checklists, knowledge checks and personal notes.')]
body = head('LEARN · PRACTICE · UNDERSTAND · REVIEW', 'One platform for your learning workflow') + '<div class="pillars">'
for cid, title, details, _ in capabilities:
    body += '<article><h2>' + title + '</h2><p>' + cue('capability-' + cid, details) + '</p></article>'
body += '</div>'
add('Main learning platform capabilities', body, [('capability-' + cid, narration) for cid, _, _, narration in capabilities])

shot('outcome', 'Run the exercise. Inspect the result.', [(1,
    'Move from watching to doing. Run the platform exercises, inspect their events and outcomes, and check what actually happened.')])
shot('map', 'Make complex ideas easier to follow', [(0,
    'Use illustrated concept maps and guided learning to connect the vocabulary to the behaviour of an agent application.')])
shot('source', 'Follow the actual TypeScript', [(0,
    'Read the TypeScript behind the lessons, trace the implementation, and use the examples as a starting point for your own experiments.')])
shot('tutor-prepared', 'Study with guided explanations', [
    (0, 'Explore tutor explanations alongside the exercise.'),
    (1, 'Prepared guidance lets you study the learning workflow without making a paid model call.')])

projects = [
    ('coach', '01', 'Study Coach', 'Guided questions<br>Conversational study plans', 'Build your understanding with Study Coach and its guided study conversations.'),
    ('evaluate', '02', 'Agent Evaluation Studio', 'Compare instructions<br>Inspect cases and evidence', 'Use Agent Evaluation Studio to compare instructions and inspect evaluation evidence.'),
    ('publish', '03', 'Agent Publishing Studio', 'Plan content<br>Create documents and visuals', 'Then explore Agent Publishing Studio to turn content plans into documents and visual outputs.')]
body = head('THREE LEARNING PROJECTS', 'Bring your learning together') + '<div class="projects">'
for cid, number, title, details, _ in projects:
    body += f'<article><small>{number}</small><h2>' + cue('project-' + cid, title) + '</h2><p>' + details + '</p></article>'
body += '</div>'
add('Three learning projects', body, [('project-' + cid, narration) for cid, _, _, _, narration in projects])

body = head('DEPLOY THE LEARNING PLATFORM', 'Take the application beyond your laptop')
body += '<div class="deploy-options">' + ''.join('<article>' + title + '</article>' for title in ['Docker', 'Kubernetes', 'Azure', 'AWS', 'Google Cloud']) + '</div>'
body += '<div class="deploy-note">' + cue('deployment', 'Local containers and cloud deployment lessons') + '</div>'
add('Deployment lessons', body, [('deployment', 'Follow deployment lessons for Docker and Kubernetes, then explore hosting the learning platform on Azure, AWS and Google Cloud.')])

shot('progress', 'Keep track of your learning', [(0,
    'Review your course progress, save notebook entries and bookmarks, and revisit knowledge checks. Learning backups let you export and restore your browser learning data.')])

body = '<img class="full closing-art" src="assets/course-cover.png"><div class="closing-shade"></div><div class="closing-content">'
body += '<div class="tag">YOUR NEXT STEP</div><h1>Claude Managed Agents</h1><h2>' + cue('enroll', 'Explore the course on Udemy') + '</h2><p>'
body += cue('closing', 'Learn the concepts.<br>Build something you can understand and verify.') + '</p><small>Luis Coco Enríquez · Your instructor</small></div>'
add('Start learning Claude Managed Agents', body, [
    ('enroll', 'Explore the curriculum, preview the lessons, and join me in Claude Managed Agents.'),
    ('closing', 'Let us build something you can understand and verify.')], 'closing')

css = '''*{box-sizing:border-box}body{margin:0;background:#100b30;color:#fff;font-family:Arial,sans-serif}.slide{display:none;position:relative;width:1920px;height:1080px;padding:70px 85px;overflow:hidden;background:radial-gradient(ellipse at top right,#4524a4,#100b30 72%)}.active{display:block}.tag{font-size:24px;font-weight:bold;letter-spacing:3px;color:#8ceaff}h1{font-size:66px;line-height:1.12;margin:30px 0 42px}h2{font-size:36px;line-height:1.25;margin:0 0 24px}p{font-size:32px;line-height:1.5}.textcue{display:table;width:auto}.full{position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover}.footer{position:absolute;bottom:32px;left:85px;right:85px;display:flex;justify-content:space-between;font-size:21px;color:#c9c2ea}.cover-top{position:absolute;top:0;left:0;right:0;padding:30px 65px;background:linear-gradient(90deg,rgba(10,5,45,.96),rgba(20,10,65,.82),rgba(20,10,65,.15))}.cover-top>.textcue{font-size:88px;font-weight:bold;line-height:1.1}.cover-top p{font-size:31px;margin:14px 0 0;color:#c5f6ff}.cover-credit{position:absolute;right:65px;bottom:34px;padding:18px 25px;background:rgba(12,7,46,.88);border:1px solid #7de8ff;border-radius:14px;font-size:27px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;margin-top:105px}.metrics article{background:#261958;border:2px solid #7464bb;border-radius:24px;padding:30px 21px;height:375px;display:flex;align-items:center;justify-content:center;text-align:center}.metrics b{font-size:112px;line-height:1.1;display:block;color:#ffb77b;margin-bottom:30px}.metrics span span{font-size:29px;line-height:1.35;display:block}.bottom-line{margin-top:70px;color:#adf1ff;font-size:35px;letter-spacing:2px}.pillars{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:55px}.pillars article{background:#24194e;border:2px solid #695aa4;border-radius:22px;padding:30px 34px;min-height:220px}.pillars h2{font-size:34px;color:#ffbd8d;margin-bottom:25px}.pillars p{font-size:30px;margin:0;color:#e5e2f5}.shotbar{position:absolute;left:0;right:0;top:0;height:88px;background:#160d3c;border-bottom:3px solid #ae83ff;padding:22px 30px;display:flex;align-items:center;justify-content:space-between}.shotbar h1{font-size:31px;margin:0}.shotbar span{font-size:18px;color:#d3c9f3}.shotcue{position:absolute;opacity:0}.projects{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:80px}.projects article{background:#261958;border:2px solid #8370c0;border-radius:24px;padding:40px 32px;min-height:490px}.projects small{font-size:44px;color:#8ceaff;display:block;margin-bottom:36px}.projects h2{font-size:39px;min-height:116px}.projects p{font-size:31px;color:#d6cfee;line-height:1.65}.deploy-options{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;margin-top:130px}.deploy-options article{padding:65px 12px;border:2px solid #8d7bcb;border-radius:23px;text-align:center;background:#241650;font-size:36px;font-weight:bold}.deploy-note{margin-top:85px;font-size:40px;color:#b1f5ff}.learner-panel{margin-top:80px;font-size:59px;font-weight:bold;line-height:1.55;color:#b9f4ff}.learner-caption{color:#d0c6e9;margin-top:45px}.closing-art{opacity:.38}.closing-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,7,47,.98) 0%,rgba(15,7,47,.91) 45%,rgba(15,7,47,.35) 100%)}.closing-content{position:absolute;left:85px;top:125px;max-width:1600px}.closing-content h1{font-size:86px;margin:38px 0 58px}.closing-content h2{font-size:48px;color:#ffba81}.closing-content p{font-size:43px;line-height:1.6;margin:50px 0}.closing-content small{font-size:28px;color:#cfc4ed}'''
sections_html = []
for i, row in enumerate(slides):
    footer = '' if row['cls'] in {'cover', 'shot', 'closing'} else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · LUIS COCO ENRÍQUEZ</span><span>{i+1:02} / {len(slides):02}</span></div>'
    sections_html.append(f'<section class="slide {row["cls"]} {"active" if i == 0 else ""}">{row["body"]}{footer}</section>')
source = P / 'walkthrough.html'
source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Claude Managed Agents · Udemy Course Promo</title><style>' + css + '</style>' + ''.join(sections_html) + '</html>', encoding='utf-8')
(P / 'storyboard.json').write_text(json.dumps(slides, indent=2), encoding='utf-8')
(V / 'narration-script.txt').write_text('\n\n'.join(f'{i+1}. {row["title"]}\n' + ' '.join(text for _, text in row['segments']) for i, row in enumerate(slides)), encoding='utf-8')
provenance = {'title': TITLE, 'courseFacts': {'videoHours': 40, 'conceptLessons': 60, 'practicalApplications': 60, 'platformLabs': 75, 'learningProjects': 3},
    'factsSource': 'User request and supplied Udemy curriculum export', 'sections': [{'number': int(n), 'title': title.strip()} for n, title in sections],
    'cover': {'source': IMAGE.name, 'sha256': hashlib.sha256(IMAGE.read_bytes()).hexdigest(), 'rasterModified': False, 'title': TITLE, 'titleTreatment': 'Native HTML title overlay on original image'},
    'screenshots': [{'file': name + '.png', 'sha256': hashlib.sha256((P / 'platform' / (name + '.png')).read_bytes()).hexdigest()} for name in screens],
    'demoMode': 'Recorded authored exercise fixtures and prepared tutor guidance; no new model call', 'newCloudResourcesCreated': False}
(V / 'source-evidence.json').write_text(json.dumps(provenance, indent=2), encoding='utf-8')
geometry = P / '.build/video/slides/geometry.json'
measured = json.loads(geometry.read_text(encoding='utf-8')) if geometry.is_file() else []
if len(measured) == len(slides):
    rows, audit = [], []
    for i, slide in enumerate(slides):
        segments = []
        for cid, text in slide['segments']:
            target = next(item for item in measured[i]['rects'] if item['id'] == cid)
            segments.append({'id': cid, 'text': text, 'target': {'textRects': [target['rect']], 'paragraphGroups': [[0]]}})
            audit.append({'slide': i+1, 'cue': cid, 'narration': text, 'visibleText': [target['text']]})
        rows.append({'slide': i+1, 'segments': segments})
    plan = {'project': NAME, 'title': 'Claude Managed Agents — Udemy Course Promo', 'displayTitle': 'Claude Managed Agents',
        'mediaPrefix': 'Claude-Managed-Agents-Udemy-Promo', 'outputFile': 'Claude-Managed-Agents-Udemy-Promo.mp4',
        'presentation': source.relative_to(ROOT).as_posix(), 'presentationSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'settings': SETTINGS, 'slides': rows, 'verifyPhraseBoundaries': True}
    (V / 'narration-plan.json').write_text(json.dumps(plan, indent=2), encoding='utf-8')
    (V / 'highlight-semantic-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
words = sum(len(text.split()) for row in slides for _, text in row['segments'])
print(f'Authored {len(slides)} course promo scenes, {words} narration words; cover title: {TITLE}.')
