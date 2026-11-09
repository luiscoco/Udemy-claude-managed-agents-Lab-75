"""Publish the verified Kubernetes teaching video, chapters and student guide."""
from pathlib import Path
import html,json,shutil
ROOT=Path(__file__).resolve().parents[1];NAME='kubernetes-desktop-deployment';V=ROOT/'videos'/NAME;P=ROOT/'presentations'/NAME
report=json.loads((V/'validation.json').read_text(encoding='utf-8'));assert report['fullVideoAndAudioDecode']=='passed'
evidence=json.loads((V/'deployment-evidence.json').read_text(encoding='utf-8'))
assert evidence['deployment']['complete'] and evidence['deployment']['persistence']['proofRetained'] and evidence['browser']['complete']
latest=json.loads((P/'evidence/deployment-evidence.json').read_text(encoding='utf-8'))
assert latest['complete'] and len(latest.get('starterDownloads',[]))==3
assert all(row['status']==200 for row in latest['starterDownloads'])
evidence['finalRuntimeVerification']=latest
(V/'deployment-evidence.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
timeline=json.loads((V/'timeline.json').read_text(encoding='utf-8'));story=json.loads((P/'storyboard.json').read_text(encoding='utf-8'))
assert len(timeline['slides'])==len(story)==report['slides']
shutil.copy2(P/'.build/video/slides/slide-01.png',V/'cover.png')
shutil.copy2(ROOT/'docs/kubernetes-desktop.md',V/'student-deployment-guide.md')
chapters=[];plain=[]
for scene,row in zip(timeline['slides'],story):
    seconds=int(scene['start']);stamp=f'{seconds//60:02}:{seconds%60:02}';plain.append(stamp+' '+row['title'])
    chapters.append(f'<li><button type="button" data-seek="{scene["start"]}">{stamp} · {html.escape(row["title"])}</button></li>')
page=(V/'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"','poster="cover.png"')
extra='<section id="chapters"><h2>Chapters and student guide</h2><p>Real local Docker Desktop Kubernetes deployment and Playwright application screenshots. Command/source snapshots are clearly labelled views of actual recorded output and files. The demo includes two authored offline outcomes, prepared tutor, notebook reload and persistent-volume retention across pod replacement. No model calls or registry pushes.</p><p><a href="student-deployment-guide.md">Student deployment commands and troubleshooting</a> · <a href="chapters.txt">Chapter notes</a> · <a href="narration-script.txt">Narration script</a> · <a href="deployment-evidence.json">Recorded deployment evidence</a></p><ol>'+''.join(chapters)+'</ol></section><style>#chapters ol{columns:2;line-height:1.9}button{background:transparent;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}li{break-inside:avoid}@media(max-width:750px){#chapters ol{columns:1}}</style><script>document.querySelectorAll("[data-seek]").forEach(button=>button.onclick=()=>{const video=document.querySelector("video");video.currentTime=Number(button.dataset.seek);video.play()});</script>'
if 'id="chapters"' not in page:page=page.replace('</main>',extra+'</main>')
(V/'index.html').write_text(page,encoding='utf-8');(V/'chapters.txt').write_text('\n'.join(plain)+'\n',encoding='utf-8')
seconds=int(report['durationSeconds']);stamp=f'{seconds//60}:{seconds%60:02}'
(V/'README.txt').write_text(f'''Deploy your Learning Platform to Kubernetes

Final MP4: {report['file']}
Duration: {stamp}; 1920x1080; 30 fps; H.264 + AAC 48 kHz.
Same course cover artwork with the new title, Inworld Yash narration,
real word-aligned highlights, cube transitions, captions and chapter links.

Open index.html for the local player. Upload the MP4 and optional SRT to Udemy.
student-deployment-guide.md contains the student commands and integration limits.
The actual deployed app is available at http://127.0.0.1:8090 while the Kubernetes workload and loopback port-forward run.
This is a local Docker Desktop deployment, not public internet hosting.

Evidence: deployment-evidence.json and the source captures in presentations/{NAME}.
Docker Desktop was already installed; no installer simulation was recorded.
CLI/file snapshots use an honest evidence viewer of actual text, not a fake dashboard.
The image build, Kubernetes rollout, health, offline workflows, non-root audit, pod replacement,
volume proof and final application checks were actually executed. No model calls.
The main platform image does not install the three separate milestone app servers
or every external integration. Follow the guide for scope and additional setup.

Build: python -u scripts/build-narrated-presentation.py --project {NAME}
Finalize: python scripts/finish-kubernetes-desktop-video.py
Player: node scripts/check-video-player.mjs --project {NAME}
Keep all media local and excluded from Git.
''',encoding='utf-8')
catalog=ROOT/'videos/index.html';body=catalog.read_text(encoding='utf-8')
card=f'<article data-project="{NAME}"><span>LEARNING PLATFORM · KUBERNETES · DOCKER DESKTOP</span><a href="{NAME}/index.html"><img loading="lazy" src="{NAME}/cover.png" alt="Kubernetes deployment tutorial cover"></a><div><h2>Deploy your Learning Platform to Kubernetes</h2><p>Verified · {stamp} · 1080p · Yash narration · Real local deployment</p><a href="{NAME}/{report["file"]}">MP4</a> · <a href="{NAME}/index.html">Player and chapters</a></div></article>'
if f'data-project="{NAME}"' not in body:catalog.write_text(body.replace('<main>','<main>'+card,1),encoding='utf-8')
print(f'Published Kubernetes video, guide and {len(chapters)} chapters: {stamp}.')
