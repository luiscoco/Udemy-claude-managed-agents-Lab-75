"""Author a student-facing repository walkthrough using reviewed source and real captures."""
from pathlib import Path
import hashlib
import html
import json
import shutil
from plan_lab_settings import SETTINGS

ROOT = Path(__file__).resolve().parents[1]
NAME = 'github-repository-student-guide'
P, V = ROOT / 'presentations' / NAME, ROOT / 'videos' / NAME
for directory in [P, V, P / 'assets', P / 'platform']:
    directory.mkdir(parents=True, exist_ok=True)
TITLE = 'Claude Managed Agents Learning Platform — GitHub Repository'
PREFIX = 'Claude-Managed-Agents-GitHub-Repository'
REPO = 'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75'
readme = (ROOT / 'README.md').read_text(encoding='utf-8')
assert '75 numbered lessons' in readme and 'Node 24 or newer' in readme
cover = ROOT / 'presentations/managed-agents-udemy-course-promo-v2/assets/course-cover.png'
shutil.copy2(cover, P / 'assets/course-cover.png')
captures = json.loads((P / 'repository/capture-evidence.json').read_text(encoding='utf-8'))
assert len(captures['screenshots']) == 4
app_base = ROOT / 'presentations/managed-agents-platform-walkthrough/platform'
app = json.loads((app_base / 'capture-evidence.json').read_text(encoding='utf-8'))
for name in ['home', 'outcome', 'source', 'progress']:
    shutil.copy2(app_base / f'{name}.png', P / 'platform' / f'{name}.png')
slides = []


def cue(cid, text):
    return f'<span class="textcue" data-cue="{cid}">{text}</span>'


def head(label, title):
    return f'<div class="tag">{label}</div><h1>{title}</h1>'


def add(title, body, segments, cls=''):
    slides.append({'title': title, 'body': body, 'segments': segments, 'cls': cls})


def cards(label, title, rows):
    body = head(label, title) + '<div class="cards">'
    segments = []
    for cid, name, detail, text in rows:
        body += '<article><h2>' + cue(cid, name) + '</h2><p>' + detail + '</p></article>'
        segments.append((cid, text))
    add(title, body + '</div>', segments)


def shot(name, title, narration, group='repository', index=0):
    if group == 'repository':
        record = next(row for row in captures['screenshots'] if row['id'] == name)
        target = record['cue']
    else:
        record = next(row for row in app['shots'] if row['id'] == name)
        target = record['cues'][index]
    x, y, w, h = target['rect']
    body = f'<img class="full" src="{group}/{name}.png"><div class="shotbar"><h1>{html.escape(title)}</h1><span>ACTUAL {"PUBLIC GITHUB PAGE" if group == "repository" else "LEARNING PLATFORM"}</span></div>'
    body += f'<div class="shotcue" data-cue="shot-{name}" data-visible="{html.escape(target["text"], quote=True)}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
    add(title, body, [(f'shot-{name}', narration)], 'shot')


add('Claude Managed Agents Learning Platform — GitHub Repository',
    '<img class="full" src="assets/course-cover.png"><div class="cover-top">'
    + cue('cover', 'Claude Managed Agents<br>Learning Platform')
    + '<p>' + cue('cover-subtitle', 'GitHub Repository · Student Guide')
    + '</p></div><div class="credit">Luis Coco Enríquez · Udemy</div>', [
    ('cover', 'Welcome to the Claude Managed Agents Learning Platform.'),
    ('cover-subtitle', 'In this student guide, we will explore the GitHub repository, set up the application, and find the resources you need to learn and build.')], 'cover')

shot('repository', 'Your course repository',
    'This public repository is the cumulative learning platform through Lab seventy five. It brings the application, lesson source, student guides and project starters together. Use this repository as your finished reference while you follow the Udemy lessons.')

shot('readme', 'Start with the README',
    'Open the README first. Its Run locally section explains setup and the main learning tools. The later step by step sections record how individual labs were built. Use those detailed notes when you need a particular lesson, rather than reading the entire history before you begin.')

body = head('GET THE APPLICATION', 'Choose a fresh course folder')
body += '<div class="terminal"><p>' + cue('requirements', 'Node.js 24 or newer + Git') + '</p><code>'
body += cue('clone', 'git clone https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75.git')
body += cue('folder', 'cd Udemy-claude-managed-agents-Lab-75') + '</code></div>'
body += '<p class="note">Alternative: GitHub → Code → Download ZIP → Extract all</p>'
add('Get the repository and prerequisites', body, [
    ('requirements', 'Install Node version twenty four or newer. Use Git to clone the project, or download and fully extract the source ZIP from GitHub.'),
    ('clone', 'Run this clone command from a parent folder where you want to keep your course work. Included learning audio and illustrations can make the first download take a little time.'),
    ('folder', 'Then change into the repository folder. Keep your own experiments in a separate working copy or branch.')])

body = head('WINDOWS POWERSHELL', 'Install, configure, start') + '<div class="terminal"><code>'
body += cue('install', 'npm.cmd ci')
body += cue('env', 'if (-not (Test-Path .env)) { Copy-Item .env.example .env }')
body += cue('dev', 'npm.cmd run dev')
body += '</code></div><p class="note">Other shells: use npm ci and npm run dev; create .env from the blank example.</p><p class="note">Open the Local URL printed by Vite. Keep this terminal running.</p>'
add('Start the platform locally', body, [
    ('install', 'In PowerShell, install the locked application dependencies with npm dot command, ci.'),
    ('env', 'Create your local environment file from the blank example, only if it does not already exist. Offline exercises do not need a model key.'),
    ('dev', 'Start the development servers and open the Local address printed by Vite. It normally starts on port fifty one seventy four. If that port is busy, use the address actually printed. Keep the terminal running; Control C stops the platform.')])

shot('home', 'From the repository to the platform Home page',
    'The platform Home page gives you seventy five numbered labs. Browse by topic or lesson, search for an objective, or choose an optional learning path. Continue learning helps you return to your work. You can start anywhere that matches the lesson you are studying.', 'platform')

cards('YOUR STUDY ROUTINE', 'Understand, run, inspect, review', [
    ('learn', 'Learn the idea', 'Read the objective and follow the Learning Guide.', 'Begin with Learn and the Learning Guide. Read the objective and understand what evidence the exercise should produce.'),
    ('run', 'Run the exercise', 'Start with a clearly labelled offline fixture.', 'Run the offline exercise and inspect the events and final outcome. Scripted fixtures teach the workflow; they are not a live provider run.'),
    ('inspect', 'Inspect the implementation', 'TypeScript source · Concept map · Lab walkthrough', 'Use TypeScript source, Concept map and Lab walkthrough to connect the result to the implementation.'),
    ('review', 'Review your understanding', 'Knowledge checks · Checklists · Personal notes', 'Try the knowledge check, write a note and assess your progress. Checklists are your self assessment, separate from verified execution evidence.')])

body = head('REPOSITORY MAP', 'Find the files you need') + '<div class="filemap">'
for cid, label, description in [
    ('frontend', 'src/', 'React interface and lesson components'),
    ('backend', 'server/', 'Express routes and server-side execution'),
    ('contracts', 'shared/', 'Shared data, validation and lesson contracts'),
    ('guides', 'docs/', 'Setup, study guides and build curriculum'),
    ('apps', 'mini-projects/', 'The three standalone learning applications'),
    ('checks', 'tests/ + browser-tests/', 'Offline behavior and browser regression checks')]:
    assert all((ROOT / part.strip()).exists() for part in label.rstrip('/').split(' + '))
    body += '<article><h2>' + cue(cid, label) + '</h2><p>' + description + '</p></article>'
body += '</div>'
add('Navigate the repository folders', body, [
    ('frontend', 'The source folder contains the React interface and lesson components.'),
    ('backend', 'Server contains Express routes and the server side execution logic.'),
    ('contracts', 'Shared holds the contracts and data used across the application.'),
    ('guides', 'Docs contains focused student and setup guides.'),
    ('apps', 'Mini projects contains the three standalone applications.'),
    ('checks', 'Tests and browser tests show how the behavior and interface are checked.')])

component = (ROOT / 'src/concepts/Concept01Query.tsx').read_text(encoding='utf-8')
selected = ["type Mode = 'scripted' | 'live';", "const [mode, setMode] = useState<Mode>('scripted');", "const [frames, setFrames] = useState<Lab01Frame[]>([]);", "const [result, setResult] = useState<Lab01Result>();"]
assert all(line in component for line in selected)
body = head('TRACE ONE LESSON', 'Connect the screen to its source')
body += '<div class="terminal"><p>' + cue('file', 'src/concepts/Concept01Query.tsx') + '</p><pre>' + html.escape('\n\n'.join(selected)) + '</pre></div>'
body += '<p class="note">Selected lines from the actual Lab 01 React component.</p><p>' + cue('trace', 'Exercise state → shared event types → server behavior') + '</p>'
add('Read one real lesson component', body, [
    ('file', 'For example, Lab one has this React component. These selected lines show its scripted or live mode, event frames and final result state.'),
    ('trace', 'Use the in app source inspector to follow the lesson files, then open them in your editor. Compare the interface state with shared event types and the server behavior. Read the matching README lab section when you want the implementation story.')])

cards('INCLUDED LEARNING RESOURCES', 'Study without generating new media', [
    ('narration', 'Guided narration', 'Prerecorded lesson tours and highlighted explanations', 'Included lesson narration plays locally through the application. You do not need an Inworld account or narration key to listen.'),
    ('visuals', 'Visual explanations', 'Concept maps and illustrated lab walkthroughs', 'The concept maps and lab walkthroughs include prerecorded explanations, timed highlights and zoom or pan views.'),
    ('code', 'Code walkthroughs', 'Main TypeScript module narration and reading controls', 'Main concept modules also have recorded code walkthroughs. Use readable code controls to follow the implementation at your own pace.'),
    ('tutor', 'AI Tutor', 'Prepared guidance first; Live Claude is optional', 'The AI Tutor offers prepared course guidance without a paid model request. Live Claude is a separate option that needs server credentials and consent for each paid question.')])

shot('progress', 'Keep your learning data safe',
    'Course progress, notes, bookmarks and knowledge checks help you review your learning. The Home page can export a learning backup and preview a restore. Save a backup before changing browsers or clearing browser data. Browser study records and server saved tutor answers use different storage; a course backup is not a complete server backup.', 'platform')

shot('projects', 'The three guided learning projects',
    'The milestone guide introduces Study Coach, Agent Evaluation Studio and Agent Publishing Studio, across twenty two build stages. Run npm run projects colon install, then open Milestone projects in the sidebar. Start with prepared mode. Follow the guide for project specific Python or browser export prerequisites; the main platform install alone does not install every optional tool.')

shot('workbook', 'Optional: build your own platform from zero',
    'If you want to rebuild rather than just run the finished app, open the student build prompts guide. It provides one workbook and an ordered sequence of implementation prompts. Use a separate empty application folder, copy one prompt at a time, and verify each checkpoint. The finished repository is a reference for that learning path.')

body = head('CHECK YOUR WORK', 'Run the relevant checks') + '<div class="terminal"><code>'
body += cue('types', 'npm.cmd run typecheck')
body += cue('project-deps', 'npm.cmd run projects:install')
body += cue('tests', 'npm.cmd run test:offline')
body += cue('build', 'npm.cmd run build')
body += '</code></div><p class="note">Use a second terminal. Read failure messages before making changes.</p><p class="note">Browser checks need their documented browser setup; cloud and live checks are separate.</p>'
add('Validate local changes', body, [
    ('types', 'Use a second terminal in the repository folder. Type check catches TypeScript errors before you run the application.'),
    ('project-deps', 'Before the full offline suite, install the standalone project dependencies too. Follow the milestone guide for its additional Python and browser prerequisites.'),
    ('tests', 'The offline suite verifies authored behavior without a paid provider run. Read any prerequisite or failure message before continuing.'),
    ('build', 'Build verifies production compilation. These commands have different purposes; passing them does not prove that a live account or cloud integration is configured. GitHub Actions provides automatic regression checks on pushed changes.')])

cards('OPTIONAL LIVE EXECUTION', 'Configure only when you are ready', [
    ('server', 'Keep keys server-side', '.env stays local · Never put credentials in VITE_*', 'Keep private credentials in the ignored local environment file. Never put them in browser settings, source code, notes or Git.'),
    ('ids', 'Configure both resource IDs', 'Agent ID + Environment ID + valid API access', 'For live Managed Agents exercises and projects, follow docs slash managed setup. A key alone is insufficient: you also need your agent and environment identifiers, permitted resources and the appropriate live settings.'),
    ('cost', 'Review consent and cost', 'Prepared mode first · Explicit paid execution', 'A Claude website login is not the application API credential. Review the exercise and budget before enabling paid execution. Optional integrations have their own setup and limits.'),
    ('restart', 'Restart after configuration changes', 'Restart the backend and any running project apps', 'After editing configuration, restart the backend and any running project applications, then check readiness again. Do not assume that an offline success proves live access.')])

cards('DEPLOYMENT GUIDES', 'Choose your next deployment lesson', [
    ('local', 'Docker and Kubernetes', 'docs/docker-desktop.md · docs/kubernetes-desktop.md', 'When local learning works, the Docker Desktop and Kubernetes guides offer separate container deployment paths.'),
    ('azure', 'Azure Container Apps', 'docs/azure-container-apps.md', 'The Azure guide covers the application image, protected access, verification and cleanup.'),
    ('cloud', 'AWS and Google Cloud', 'aws/README.md · gcp/README.md', 'AWS and Google Cloud each have their own folder, Cloud Shell helper and student guide. Follow the provider specific instructions rather than mixing commands.'),
    ('cleanup', 'Verify and clean up', 'Cloud services can be billable; remove tutorial resources.', 'Cloud deployment is optional and can incur costs. Verify the result and use the documented cleanup procedure after your exercise. Temporary teaching gateways and ephemeral storage need further work for production hosting.')])

cards('WHEN SOMETHING DOES NOT WORK', 'Check the simplest cause first', [
    ('directory', 'Confirm the folder and Node version', 'Open a terminal at the repository root.', 'If an npm command cannot find the project, check your current directory and Node version. Run from the folder containing package dot json.'),
    ('address', 'Use the printed Local address', 'Keep both development processes running.', 'If the page or API does not respond, inspect the development terminal and use the printed Vite address. Do not guess a port from an older video.'),
    ('project-help', 'Read the focused guide', 'docs/managed-setup.md · docs/managed-milestone-projects.md', 'For a disabled live project or a missing export tool, read the focused setup or milestone guide. Different features have different prerequisites.'),
    ('updates', 'Preserve your work before updating', 'Save your edits and export a learning backup.', 'Before updating from GitHub, save your own code changes and learning backup. Review incoming changes and keep your private environment file local.')])

body = head('YOUR NEXT STEPS', 'Turn the repository into a learning habit')
body += '<div class="ending">' + cue('start', 'Run the platform. Choose one lab.')
body += cue('practice', 'Understand the result. Read the source.')
body += cue('build-own', 'Build, verify and keep a checkpoint.') + '</div>'
body += '<p class="repo-url">github.com/luiscoco/Udemy-claude-managed-agents-Lab-75</p>'
add('Your student workflow', body, [
    ('start', 'You now have a map of the repository. Start the platform, choose one lab, and follow its learning objective.'),
    ('practice', 'Run an offline exercise, explain the result in your own words, and inspect the source behind it.'),
    ('build-own', 'Then adapt an example or advance a project stage, verify your change and keep a checkpoint. Return to the README and focused guides whenever you need the next step.')])

css = '''*{box-sizing:border-box}body{margin:0;background:#100b30;color:#fff;font-family:Arial,sans-serif}.slide{display:none;position:relative;width:1920px;height:1080px;padding:65px 85px;overflow:hidden;background:radial-gradient(ellipse at top right,#4524a4,#100b30 72%)}.active{display:block}.tag{font-size:24px;font-weight:bold;letter-spacing:3px;color:#8ceaff}h1{font-size:62px;line-height:1.15;margin:26px 0 38px}h2{font-size:34px;line-height:1.25;margin:0 0 22px}p{font-size:30px;line-height:1.45}.textcue{display:table;width:auto;max-width:100%}.full{position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover}.footer{position:absolute;bottom:30px;left:85px;right:85px;display:flex;justify-content:space-between;font-size:20px;color:#c9c2ea}.cover-top{position:absolute;top:0;left:0;right:0;padding:28px 65px;background:linear-gradient(90deg,rgba(10,5,45,.98),rgba(20,10,65,.9),rgba(20,10,65,.35))}.cover-top>.textcue{font-size:75px;font-weight:bold;line-height:1.08}.cover-top p{font-size:38px;margin:18px 0 0;color:#b4f4ff}.credit{position:absolute;right:65px;bottom:34px;padding:18px 25px;background:#100b30dd;border:1px solid #7de8ff;border-radius:14px;font-size:27px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:45px}.cards article{background:#24194e;border:2px solid #695aa4;border-radius:22px;padding:30px 34px;min-height:250px}.cards h2{color:#ffbd8d}.cards p{font-size:28px;margin:0;color:#e5e2f5;overflow-wrap:anywhere}.terminal{padding:34px 40px;background:#070b16;border:2px solid #685b9b;border-radius:22px;margin-top:40px}.terminal p{font-family:Consolas,monospace;font-size:32px;color:#aaf2ff;margin:0 0 30px}.terminal code{display:block;font:28px/1.6 Consolas,monospace;color:#f3f0ff}.terminal code .textcue{margin:20px 0}.terminal pre{font:28px/1.5 Consolas,monospace;white-space:pre-wrap;color:#f7f3ff;margin:10px 0}.note{font-size:29px;color:#d1c9e9;margin:30px 0 0}.filemap{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:35px}.filemap article{padding:26px 32px;background:#24194e;border:2px solid #695aa4;border-radius:20px;min-height:184px}.filemap h2{font:34px Consolas,monospace;color:#9ceaff;margin:0 0 15px}.filemap p{font-size:27px;margin:0;color:#ded7f3}.shotbar{position:absolute;left:0;right:0;top:0;height:88px;background:#160d3c;border-bottom:3px solid #ae83ff;padding:22px 30px;display:flex;align-items:center;justify-content:space-between}.shotbar h1{font-size:30px;margin:0}.shotbar span{font-size:18px;color:#d3c9f3}.shotcue{position:absolute;opacity:0}.ending{font-size:51px;line-height:1.45;margin-top:90px;color:#b1f4ff;font-weight:bold}.ending .textcue{margin-bottom:34px}.repo-url{font:27px Consolas,monospace;color:#dfd6f5;margin-top:55px}'''
sections = []
for index, row in enumerate(slides):
    footer = '' if row['cls'] in {'cover', 'shot'} else f'<div class="footer"><span>CLAUDE MANAGED AGENTS · GITHUB REPOSITORY STUDENT GUIDE</span><span>{index+1:02} / {len(slides):02}</span></div>'
    sections.append(f'<section class="slide {row["cls"]} {"active" if index == 0 else ""}">{row["body"]}{footer}</section>')
source = P / 'walkthrough.html'
source.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>' + TITLE + '</title><style>' + css + '</style>' + ''.join(sections) + '</html>', encoding='utf-8')
(P / 'storyboard.json').write_text(json.dumps(slides, indent=2), encoding='utf-8')
(V / 'narration-script.txt').write_text('\n\n'.join(f'{index+1}. {row["title"]}\n' + ' '.join(text for _, text in row['segments']) for index, row in enumerate(slides)), encoding='utf-8')
review = '''README REVIEW FOR THE STUDENT VIDEO

Source: README.md and the focused student guides in this repository.
Included: prerequisites, local startup, offline/live distinctions, 75 labs,
navigation, narration and illustrations, source inspection, study records,
three milestone apps, the build-from-zero workbook, validation commands,
optional provider deployment guides and practical troubleshooting.

Excluded: instructor-specific filesystem paths, author narration generation,
private historical checkpoint dependencies, dated integration audit details,
paid smoke-run instructions, implementation-by-implementation change history,
and claims that every integration works merely because offline checks pass.

The original README has not been rewritten. This video curates its content.
Actual public GitHub pages were captured read-only. Existing platform captures
show real authored offline exercises and learning tools, not a new live run.
No cloud resource or model session was created for this walkthrough.
Narration production uses the established separate Inworld author workflow.
'''
(V / 'readme-review.txt').write_text(review, encoding='utf-8')
documents = ['README.md', 'docs/managed-setup.md', 'docs/managed-milestone-projects.md', 'docs/student-build-prompts/README.md', 'docs/learning-guide.md', 'docs/ai-tutor.md', 'docs/docker-desktop.md', 'docs/kubernetes-desktop.md', 'docs/azure-container-apps.md', 'aws/README.md', 'gcp/README.md', 'src/concepts/Concept01Query.tsx']
evidence = {'title': TITLE, 'repository': REPO, 'readmeReview': 'readme-review.txt', 'coverTitle': 'Claude Managed Agents Learning Platform — GitHub Repository', 'coverRasterModified': False,
    'sources': [{'path': name, 'sha256': hashlib.sha256((ROOT / name).read_bytes()).hexdigest()} for name in documents],
    'coverSha256': hashlib.sha256(cover.read_bytes()).hexdigest(), 'githubCaptures': captures,
    'platformScreens': {'provenance': app_base.relative_to(ROOT).as_posix(), 'mode': 'previous actual offline learning-platform captures'},
    'newCloudResources': False, 'newModelSessions': False, 'instructorReadmeHistoryOmitted': True}
(V / 'source-evidence.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
geometry = P / '.build/video/slides/geometry.json'
measured = json.loads(geometry.read_text(encoding='utf-8')) if geometry.exists() else []
if len(measured) == len(slides) and all(
    {cid for cid, _ in slide['segments']} <= {item['id'] for item in measured[index]['rects']}
    for index, slide in enumerate(slides)
):
    rows, audit = [], []
    for index, slide in enumerate(slides):
        segments = []
        for cid, text in slide['segments']:
            target = next(item for item in measured[index]['rects'] if item['id'] == cid)
            segments.append({'id': cid, 'text': text, 'target': {'textRects': [target['rect']], 'paragraphGroups': [[0]]}})
            audit.append({'slide': index+1, 'cue': cid, 'narration': text, 'visibleText': [target['text']]})
        rows.append({'slide': index+1, 'segments': segments})
    plan = {'project': NAME, 'title': TITLE, 'displayTitle': TITLE, 'mediaPrefix': PREFIX, 'outputFile': PREFIX + '.mp4',
        'presentation': source.relative_to(ROOT).as_posix(), 'presentationSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'settings': SETTINGS, 'slides': rows, 'verifyPhraseBoundaries': True}
    (V / 'narration-plan.json').write_text(json.dumps(plan, indent=2), encoding='utf-8')
    (V / 'highlight-semantic-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
print(f'Authored {len(slides)} scenes, {sum(len(text.split()) for row in slides for _, text in row["segments"])} words. Cover: {TITLE}')
