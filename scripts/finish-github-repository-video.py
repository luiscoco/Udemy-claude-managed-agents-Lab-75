"""Publish the verified repository walkthrough with cover, chapters and student notes."""
from pathlib import Path
import html
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
NAME = 'github-repository-student-guide'
V, P = ROOT / 'videos' / NAME, ROOT / 'presentations' / NAME
report = json.loads((V / 'validation.json').read_text(encoding='utf-8'))
timeline = json.loads((V / 'timeline.json').read_text(encoding='utf-8'))
story = json.loads((P / 'storyboard.json').read_text(encoding='utf-8'))
evidence = json.loads((V / 'source-evidence.json').read_text(encoding='utf-8'))
assert report['fullVideoAndAudioDecode'] == 'passed'
assert len(timeline['slides']) == len(story) == report['slides']
assert 'GitHub Repository' in evidence['coverTitle']
shutil.copy2(P / '.build/video/slides/slide-01.png', V / 'cover.png')
chapters, links = [], []
for scene, row in zip(timeline['slides'], story):
    seconds = int(scene['start'])
    stamp = f'{seconds // 60:02}:{seconds % 60:02}'
    chapters.append(stamp + ' ' + row['title'])
    links.append(f'<li><button data-seek="{scene["start"]}">{stamp} · {html.escape(row["title"])}</button></li>')
(V / 'chapters.txt').write_text('\n'.join(chapters) + '\n', encoding='utf-8')
extra = '<section id="chapters"><h2>Student repository walkthrough</h2><p>Reviewed README content: setup, labs, source, included learning media, projects, optional live execution and deployment guides.</p><p><a href="readme-review.txt">README selection notes</a> · <a href="narration-script.txt">Transcript</a> · <a href="source-evidence.json">Source evidence</a> · <a href="student-quick-start.txt">Student quick start</a></p><ol>' + ''.join(links) + '</ol></section><style>#chapters ol{columns:2;line-height:1.9}button{background:transparent;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}li{break-inside:avoid}@media(max-width:750px){#chapters ol{columns:1}}</style><script>document.querySelectorAll("[data-seek]").forEach(button=>button.onclick=()=>{const video=document.querySelector("video");video.currentTime=Number(button.dataset.seek);video.play()});</script>'
page = (V / 'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"', 'poster="cover.png"')
if 'id="chapters"' not in page:
    page = page.replace('</main>', extra + '</main>')
(V / 'index.html').write_text(page, encoding='utf-8')
(V / 'student-quick-start.txt').write_text('''CLAUDE MANAGED AGENTS LEARNING PLATFORM - STUDENT QUICK START

Repository: https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75
Prerequisites: Node.js 24 or newer; Git for cloning.
Alternative: Code > Download ZIP > Extract all, then open a terminal there.

PowerShell:
git clone https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75.git
cd Udemy-claude-managed-agents-Lab-75
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev

Use the Local URL printed by Vite; keep the terminal running.
Other shells: use npm and create .env from the blank example without
overwriting existing private configuration.

Begin with offline fixtures and prepared tutor guidance: no model key needed.
Included lesson narration, illustrations and code tours require no media key.
Live execution requires separate credentials, resource setup and consent.

Three guided projects:
npm.cmd run projects:install
Then read docs/managed-milestone-projects.md for project-specific prerequisites.

In a second terminal, from the repository root:
npm.cmd run typecheck
npm.cmd run projects:install
npm.cmd run test:offline
npm.cmd run build

Focused guides:
docs/managed-setup.md
docs/ai-tutor.md
docs/learning-guide.md
docs/managed-milestone-projects.md
docs/student-build-prompts/README.md
docs/docker-desktop.md
docs/kubernetes-desktop.md
docs/azure-container-apps.md
aws/README.md
gcp/README.md

Keep credentials private and export learning backups before clearing browser
data or changing browsers. The optional build curriculum belongs in a separate
empty application folder. Remove billable tutorial resources after cloud labs.
''', encoding='utf-8')
seconds = round(report['durationSeconds'])
duration = f'{seconds // 60}:{seconds % 60:02}'
(V / 'README.txt').write_text(f'''CLAUDE MANAGED AGENTS LEARNING PLATFORM - GITHUB REPOSITORY

Final video: {report['file']}
Duration: {duration}; 1920x1080; 30 fps; H.264 video and 48 kHz AAC audio.
Inworld Yash narration, synchronized red text highlights and cube transitions.
English embedded captions plus external SRT/VTT files; chaptered local player.

The cover explicitly identifies the Learning Platform GitHub Repository.
README content was curated for Udemy students; the source README is unchanged.
See readme-review.txt for selected topics and excluded instructor details.
Actual public GitHub screenshots were captured read-only. Platform screenshots
reuse real offline workflow captures. No new cloud resources or model sessions
were created. Separate narration generation uses the existing author workflow.

Open index.html to review the final video and seek by chapter.
Use the MP4 for the Udemy lecture; uploading was not performed.
All generated media remain local in ignored videos/ and presentations/ folders.
''', encoding='utf-8')
catalog = ROOT / 'videos/index.html'
if catalog.exists():
    body = catalog.read_text(encoding='utf-8')
    card = f'<article data-project="{NAME}"><span>STUDENT REPOSITORY GUIDE</span><a href="{NAME}/index.html"><img loading="lazy" src="{NAME}/cover.png" alt="Claude Managed Agents GitHub Repository"></a><div><h2>Claude Managed Agents Learning Platform — GitHub Repository</h2><p>Verified · {duration} · 1080p · Yash narration</p><a href="{NAME}/{report["file"]}">MP4</a> · <a href="{NAME}/index.html">Player</a></div></article>'
    if f'data-project="{NAME}"' not in body:
        catalog.write_text(body.replace('<main>', '<main>' + card, 1), encoding='utf-8')
print(f'Published {duration} student repository walkthrough with {len(story)} chapters.')
