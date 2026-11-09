"""Publish only a verified AWS lesson and its genuine cloud/browser evidence."""
from pathlib import Path
import html,json,shutil
ROOT=Path(__file__).resolve().parents[1]
NAME='aws-ecs-fargate-deployment'
V=ROOT/'videos'/NAME;P=ROOT/'presentations'/NAME
report=json.loads((V/'validation.json').read_text(encoding='utf-8'))
assert report['fullVideoAndAudioDecode']=='passed'
evidence=json.loads((V/'deployment-evidence.json').read_text(encoding='utf-8'))
assert evidence['deployment']['cloudProvisioningComplete'] and evidence['browser']['complete']
assert evidence['deployment']['httpVerification']['complete']
assert evidence['deployment']['imageBuild']['buildStatus']=='SUCCEEDED'
assert all(row['status']=='passed' for row in evidence['deployment']['httpVerification']['checks'])
assert all(row['mode'] in ['scripted','prepared'] for row in evidence['browser']['requests'])
timeline=json.loads((V/'timeline.json').read_text(encoding='utf-8'))
story=json.loads((P/'storyboard.json').read_text(encoding='utf-8'))
assert len(timeline['slides'])==len(story)==report['slides']
shutil.copy2(P/'.build/video/slides/slide-01.png',V/'cover.png')
shutil.copy2(ROOT/'aws/README.md',V/'student-deployment-guide.md')
chapters=[];plain=[]
for scene,row in zip(timeline['slides'],story):
    seconds=int(scene['start']);stamp=f'{seconds//60:02}:{seconds%60:02}'
    plain.append(stamp+' '+row['title'])
    chapters.append(f'<li><button type="button" data-seek="{scene["start"]}">{stamp} · {html.escape(row["title"])}</button></li>')
page=(V/'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"','poster="cover.png"')
extra='<section id="chapters"><h2>Chapters and student guide</h2><p>Actual ECS Fargate deployment and Playwright application screenshots. Source snapshots show reviewed CloudFormation excerpts. Result snapshots show clearly labelled imported AWS CloudShell output. The demonstration uses offline course scenarios and prepared tutor guidance; no Claude model calls. Server storage is ephemeral. CloudFront provides browser HTTPS; its load balancer origin connection is HTTP. A generated recording password protects application access.</p><p><a href="student-deployment-guide.md">Student deployment guide</a> · <a href="chapters.txt">Chapter notes</a> · <a href="narration-script.txt">Narration script</a> · <a href="deployment-evidence.json">Verified deployment evidence</a></p><ol>'+''.join(chapters)+'</ol></section><style>#chapters ol{columns:2;line-height:1.9}button{background:transparent;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}li{break-inside:avoid}@media(max-width:750px){#chapters ol{columns:1}}</style><script>document.querySelectorAll("[data-seek]").forEach(button=>button.onclick=()=>{const video=document.querySelector("video");video.currentTime=Number(button.dataset.seek);video.play()});</script>'
if 'id="chapters"' not in page:page=page.replace('</main>',extra+'</main>')
(V/'index.html').write_text(page,encoding='utf-8')
(V/'chapters.txt').write_text('\n'.join(plain)+'\n',encoding='utf-8')
seconds=int(report['durationSeconds']);duration=f'{seconds//60}:{seconds%60:02}'
(V/'README.txt').write_text(f'''Deploying the Claude Managed Agents Learning Platform to AWS

Final video: {report['file']}
Duration: {duration}; 1920x1080; 30 fps; H.264/AAC; Inworld Yash narration.
Includes the existing course cover, synchronized highlights, transitions,
English SRT/VTT captions, chapters, actual AWS results and browser captures.

Upload the MP4 and optional SRT to Udemy. Open index.html for local playback.
Read student-deployment-guide.md before provisioning resources in your account.
This recording uses password-protected Amazon ECS Fargate, a private
registry and dedicated IAM service roles. Server data is ephemeral in the initial template.
Browser notebook reload does not prove durable server storage or database backup.
No Claude model call is made. Separate milestone servers and host integrations
need additional setup. Cloud resource cleanup is a separate explicit step;
the recorded HTTPS hostname is evidence of capture, not a promise of ongoing hosting.

Build: python -u scripts/build-narrated-presentation.py --project {NAME}
Finalize: python scripts/finish-aws-ecs-fargate-video.py
Player: node scripts/check-video-player.mjs --project {NAME}
Generated media, account caches and deployment evidence remain local and ignored.
''',encoding='utf-8')
catalog=ROOT/'videos/index.html';body=catalog.read_text(encoding='utf-8')
card=f'<article data-project="{NAME}"><span>LEARNING PLATFORM · AWS ECS FARGATE</span><a href="{NAME}/index.html"><img loading="lazy" src="{NAME}/cover.png" alt="AWS deployment tutorial cover"></a><div><h2>Deploying the Claude Managed Agents Learning Platform to AWS</h2><p>Verified · {duration} · 1080p · Yash narration · Real cloud deployment</p><a href="{NAME}/{report["file"]}">MP4</a> · <a href="{NAME}/index.html">Player and chapters</a></div></article>'
if f'data-project="{NAME}"' not in body:catalog.write_text(body.replace('<main>','<main>'+card,1),encoding='utf-8')
print(f'Published the AWS video, student guide and {len(chapters)} chapters: {duration}.')
