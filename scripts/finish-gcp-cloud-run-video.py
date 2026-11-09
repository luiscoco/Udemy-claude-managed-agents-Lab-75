"""Publish a verified Google Cloud lesson with its genuine cloud/browser evidence."""
from pathlib import Path
import html
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
NAME = 'gcp-cloud-run-deployment'
V, P = ROOT / 'videos' / NAME, ROOT / 'presentations' / NAME
report = json.loads((V / 'validation.json').read_text(encoding='utf-8'))
assert report['fullVideoAndAudioDecode'] == 'passed'
evidence = json.loads((V / 'deployment-evidence.json').read_text(encoding='utf-8'))
assert evidence['deployment']['cloudProvisioningComplete'] and evidence['browser']['complete']
assert evidence['deployment']['imageBuild']['status'] == 'SUCCESS'
assert evidence['deployment']['httpVerification']['complete']
assert all(row['status'] == 'passed' for row in evidence['deployment']['httpVerification']['checks'])
assert all(row['mode'] in ['scripted', 'prepared'] for row in evidence['browser']['requests'])
timeline = json.loads((V / 'timeline.json').read_text(encoding='utf-8'))
story = json.loads((P / 'storyboard.json').read_text(encoding='utf-8'))
assert len(timeline['slides']) == len(story) == report['slides']
shutil.copy2(P / '.build/video/slides/slide-01.png', V / 'cover.png')
shutil.copy2(ROOT / 'gcp/README.md', V / 'student-deployment-guide.md')
chapters, plain = [], []
for scene, row in zip(timeline['slides'], story):
    seconds = int(scene['start'])
    stamp = f'{seconds // 60:02}:{seconds % 60:02}'
    plain.append(stamp + ' ' + row['title'])
    chapters.append(f'<li><button type="button" data-seek="{scene["start"]}">{stamp} · {html.escape(row["title"])}</button></li>')
page = (V / 'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"', 'poster="cover.png"')
extra = '<section id="chapters"><h2>Chapters and deployment guide</h2><p>Actual Cloud Run deployment and direct browser captures. Source snapshots show reviewed helper/configuration excerpts. Result snapshots display labelled imported Google Cloud Shell results. Offline course fixtures and prepared tutor guidance are used; paid model calls are disabled. Server files are ephemeral. Cloud Run supplies managed browser HTTPS; the generated application password stays private.</p><p><a href="student-deployment-guide.pdf">PDF guide</a> · <a href="student-deployment-guide.html">HTML guide</a> · <a href="student-deployment-guide.md">Markdown guide</a> · <a href="chapters.txt">Chapter notes</a> · <a href="narration-script.txt">Narration script</a> · <a href="deployment-evidence.json">Verified deployment evidence</a></p><ol>' + ''.join(chapters) + '</ol></section><style>#chapters ol{columns:2;line-height:1.9}button{background:transparent;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}li{break-inside:avoid}@media(max-width:750px){#chapters ol{columns:1}}</style><script>document.querySelectorAll("[data-seek]").forEach(button=>button.onclick=()=>{const video=document.querySelector("video");video.currentTime=Number(button.dataset.seek);video.play()});</script>'
if 'id="chapters"' not in page: page = page.replace('</main>', extra + '</main>')
(V / 'index.html').write_text(page, encoding='utf-8')
(V / 'chapters.txt').write_text('\n'.join(plain) + '\n', encoding='utf-8')
seconds = int(report['durationSeconds'])
duration = f'{seconds // 60}:{seconds % 60:02}'
(V / 'README.txt').write_text(f'''Deploying the Claude Managed Agents Learning Platform to Google Cloud Services

Final video: {report['file']}
Duration: {duration}; 1920x1080; 30 fps; H.264/AAC; Inworld Yash narration.
Includes synchronized highlights, cube transitions, English SRT/VTT captions,
chapters, actual cloud results and direct browser captures.

Upload the MP4 and optional SRT to Udemy. Open index.html for local playback.
Read student-deployment-guide.md before creating resources in your own project.
This is a temporary password-protected Cloud Run recording deployment.
Paid model calls are disabled. Server files are ephemeral; notebook persistence
is browser state. Separate milestone servers/integrations need their own setup.
The recorded hostname is evidence of capture, not a promise of ongoing hosting.
Clean up only tutorial resources after verifying the final MP4. Check all six
resources are absent, and remove specifically identified failed source uploads.
Preserve shared projects, buckets, existing services and billing settings.
Shared logs/build history follow their retention policies.
''', encoding='utf-8')
catalog = ROOT / 'videos/index.html'
body = catalog.read_text(encoding='utf-8')
card = f'<article data-project="{NAME}"><span>LEARNING PLATFORM · GOOGLE CLOUD RUN</span><a href="{NAME}/index.html"><img loading="lazy" src="{NAME}/cover.png" alt="Google Cloud deployment tutorial cover"></a><div><h2>Deploying the Claude Managed Agents Learning Platform to Google Cloud Services</h2><p>Verified · {duration} · 1080p · Yash narration · Real cloud deployment</p><a href="{NAME}/{report["file"]}">MP4</a> · <a href="{NAME}/index.html">Player and chapters</a></div></article>'
if f'data-project="{NAME}"' not in body: catalog.write_text(body.replace('<main>', '<main>' + card, 1), encoding='utf-8')
print(f'Published the Google Cloud video and {len(chapters)} chapters: {duration}.')
