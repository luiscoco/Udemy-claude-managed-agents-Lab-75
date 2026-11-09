"""Publish the verified Udemy course promo and its local review player."""
from pathlib import Path
import hashlib
import html
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
NAME = 'managed-agents-udemy-course-promo-v2'
V, P = ROOT / 'videos' / NAME, ROOT / 'presentations' / NAME
report = json.loads((V / 'validation.json').read_text(encoding='utf-8'))
assert report['fullVideoAndAudioDecode'] == 'passed'
source = json.loads((V / 'source-evidence.json').read_text(encoding='utf-8'))
assert source['title'] == 'Claude Managed Agents' and source['cover']['title'] == 'Claude Managed Agents'
assert source['courseFacts'] == {'videoHours': 40, 'conceptLessons': 60, 'practicalApplications': 60, 'platformLabs': 75, 'learningProjects': 3}
assert not source['cover']['rasterModified']
assert hashlib.sha256((P / 'assets/course-cover.png').read_bytes()).hexdigest() == source['cover']['sha256']
timeline = json.loads((V / 'timeline.json').read_text(encoding='utf-8'))
story = json.loads((P / 'storyboard.json').read_text(encoding='utf-8'))
assert len(timeline['slides']) == len(story) == report['slides'] == 13
shutil.copy2(P / '.build/video/slides/slide-01.png', V / 'cover.png')
plain, links = [], []
for scene, row in zip(timeline['slides'], story):
    seconds = int(scene['start'])
    stamp = f'{seconds // 60:02}:{seconds % 60:02}'
    plain.append(stamp + ' ' + row['title'])
    links.append(f'<li><button type="button" data-seek="{scene["start"]}">{stamp} · {html.escape(row["title"])}</button></li>')
extra = '<section id="chapters"><h2>Revised promo scenes</h2><p>The first learning-platform scene now shows the actual Home page. A new capabilities overview explains guided tours, concept maps, exercises, source code, AI Tutor and learning tools, followed by actual progress-page footage.</p><p>40 hours of video · 60 concept lessons · 60 practical example applications · 75 platform labs · 3 learning projects.</p><p>Course facts supplied by the instructor and current curriculum export. Application scenes reuse actual recorded learning-platform screens with authored fixtures and prepared guidance. No new cloud deployment or model execution was performed for these demonstrations.</p><p><a href="narration-script.txt">Narration script</a> · <a href="source-evidence.json">Source notes</a> · <a href="chapters.txt">Scene list</a></p><ol>' + ''.join(links) + '</ol></section><style>#chapters ol{columns:2;line-height:1.9}button{background:transparent;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}li{break-inside:avoid}@media(max-width:750px){#chapters ol{columns:1}}</style><script>document.querySelectorAll("[data-seek]").forEach(button=>button.onclick=()=>{const video=document.querySelector("video");video.currentTime=Number(button.dataset.seek);video.play()});</script>'
page = (V / 'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"', 'poster="cover.png"')
if 'id="chapters"' not in page: page = page.replace('</main>', extra + '</main>')
(V / 'index.html').write_text(page, encoding='utf-8')
(V / 'chapters.txt').write_text('\n'.join(plain) + '\n', encoding='utf-8')
seconds = int(report['durationSeconds'])
duration = f'{seconds // 60}:{seconds % 60:02}'
(V / 'README.txt').write_text(f'''CLAUDE MANAGED AGENTS - UDEMY COURSE PROMO

Final MP4: {report['file']}
Duration: {duration}; 1920x1080; 30 fps; H.264/AAC.
English Inworld Yash narration, synchronized text highlights, cube transitions,
English SRT/VTT captions and scene navigation in index.html.

Upload the final MP4 in the Udemy course Promotional video field.
The upload/publishing step has not been performed by this local workflow.
The supplied illustration is the cover artwork. The cover title is explicitly
Claude Managed Agents; this is the full course, not the earlier free promo.

Course scope: 40 hours of video; 60 concept lessons; 60 practical example
applications; a learning platform with 75 labs; 3 learning projects.
Projects: Study Coach; Agent Evaluation Studio; Agent Publishing Studio.
Deployment coverage: Docker, Kubernetes, Azure, AWS and Google Cloud.
The source curriculum export contains 18 sections and 60 practical examples.

Revision: the first platform scene uses the actual Home page. A capabilities
overview and progress-page scene explain the main learning tools.

Application scenes reuse real recorded screens with authored offline fixtures
and prepared tutor guidance. No new remote agent or cloud resource was created
for the demo. No passwords, credentials, pricing or employment claims appear.
''', encoding='utf-8')
catalog = ROOT / 'videos/index.html'
body = catalog.read_text(encoding='utf-8')
card = f'<article data-project="{NAME}"><span>CLAUDE MANAGED AGENTS · UDEMY PROMO</span><a href="{NAME}/index.html"><img loading="lazy" src="{NAME}/cover.png" alt="Claude Managed Agents course promo cover"></a><div><h2>Claude Managed Agents — Revised Course Promo</h2><p>Verified · {duration} · 1080p · Yash narration</p><a href="{NAME}/{report["file"]}">MP4</a> · <a href="{NAME}/index.html">Player</a></div></article>'
if f'data-project="{NAME}"' not in body: catalog.write_text(body.replace('<main>', '<main>' + card, 1), encoding='utf-8')
print(f'Published verified {duration} Udemy promo with the supplied cover and updated course title.')
