"""Publish the verified local AI Tutor MP4 player and chapter guide."""
from pathlib import Path
import html, json, shutil

ROOT = Path(__file__).resolve().parents[1]
NAME = 'ai-tutor-live-lab'
V = ROOT / 'videos' / NAME
P = ROOT / 'presentations' / NAME
report = json.loads((V / 'validation.json').read_text(encoding='utf-8'))
assert report['fullVideoAndAudioDecode'] == 'passed'
evidence = json.loads((V / 'walkthrough-evidence.json').read_text(encoding='utf-8'))
assert evidence['complete'] and len(evidence['liveRequests']) == 2
assert len({row['model'] for row in evidence['liveRequests']}) == 2
timeline = json.loads((V / 'timeline.json').read_text(encoding='utf-8'))
storyboard = json.loads((P / 'storyboard.json').read_text(encoding='utf-8'))
assert len(timeline['slides']) == len(storyboard) == report['slides']
shutil.copy2(P / '.build/video/slides/slide-01.png', V / 'cover.png')
chapters, plain = [], []
for scene, story in zip(timeline['slides'], storyboard):
    seconds = int(scene['start'])
    stamp = f'{seconds//60:02}:{seconds%60:02}'
    plain.append(f'{stamp} {story["title"]}')
    chapters.append(f'<li><button type="button" data-seek="{scene["start"]}">{stamp} · {html.escape(story["title"])}</button></li>')
page = (V / 'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"', 'poster="cover.png"')
extra = '<section id="chapters"><h2>Chapters</h2><p>Captured in the current learning platform: three prepared questions and two completed real Claude requests, using Haiku 4.5 and Sonnet 4.6. Saving, reload/reopen and removal were verified without additional model requests. Troubleshooting is explained separately.</p><ol>' + ''.join(chapters) + '</ol><p><a href="narration-script.txt">Teaching script</a> · <a href="chapters.txt">Udemy chapter notes</a> · <a href="walkthrough-evidence.json">Capture evidence</a></p></section><style>#chapters ol{columns:2;line-height:1.9}button{background:transparent;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}li{break-inside:avoid}@media(max-width:750px){#chapters ol{columns:1}}</style><script>document.querySelectorAll("[data-seek]").forEach(button=>button.onclick=()=>{const video=document.querySelector("video");video.currentTime=Number(button.dataset.seek);video.play()});</script>'
if 'id="chapters"' not in page:
    page = page.replace('</main>', extra + '</main>')
(V / 'index.html').write_text(page, encoding='utf-8')
(V / 'chapters.txt').write_text('\n'.join(plain) + '\n', encoding='utf-8')
duration = int(report['durationSeconds'])
stamp = f'{duration//60}:{duration%60:02}'
readme = f'''AI Tutor Live Lab: Choose a Claude Model, Ask Questions, and Save Answers

MP4: {report['file']}
Duration: {stamp}; 1920 x 1080; 30 fps; H.264 + AAC 48 kHz.
Same Learning Portal cover artwork and course visual style.
Inworld Yash, TTS 2, enhanced, balanced, 1.25x; real word alignment.
English captions, timed red text outlines, cube transitions, chapter links.

Open index.html for the player. Upload the MP4 and optional SRT to Udemy.
chapters.txt contains chapter timestamps; narration-script.txt contains the script.
walkthrough-evidence.json records the two actual live model calls and prepared workflows.
The capture used an isolated browser profile. No instructor API key was displayed.
Two paid questions appear in the completed demonstration. One earlier completed
Haiku question was captured before a browser selector failed; its answer and usage
remain recorded in previousAttempts. Three paid questions were sent in total.
No automatic provider retry was used. The capture was restarted after review.
Save, reopen after reload, lesson scoping and remove were exercised in the application.
The tutorial distinguishes the tutor Messages API from Managed Agents lab execution.
Do not treat these two different questions as a controlled model comparison.
Troubleshooting and backup limitations are explained, not simulated as live failures.

Rebuild:
python scripts/create-ai-tutor-live-lab.py
node scripts/capture-ai-tutor-live-lab-slides.mjs
python scripts/create-ai-tutor-live-lab.py
python -u scripts/build-narrated-presentation.py --project {NAME}
python scripts/finish-ai-tutor-live-lab.py
Completed browser evidence is reused; capture script refuses to repeat partial paid captures.
'''
(V / 'README.txt').write_text(readme, encoding='utf-8')
catalog = ROOT / 'videos/index.html'
body = catalog.read_text(encoding='utf-8')
card = f'<article data-project="{NAME}"><span>LEARNING PLATFORM · AI TUTOR LIVE LAB</span><a href="{NAME}/index.html"><img loading="lazy" src="{NAME}/cover.png" alt="AI Tutor Live Lab cover"></a><div><h2>Choose a Claude Model, Ask Questions, and Save Answers</h2><p>Verified · {stamp} · 1080p · Yash narration · 2 real live questions</p><a href="{NAME}/{report["file"]}">MP4</a> · <a href="{NAME}/index.html">Player and chapters</a></div></article>'
if f'data-project="{NAME}"' not in body:
    catalog.write_text(body.replace('<main>', '<main>' + card, 1), encoding='utf-8')
print(f'Published AI Tutor video, player and {len(chapters)} chapter links: {stamp}.')
