"""Publish a verified Lab NN step-by-step video (Labs 04 onward): cover, chapters, catalog card and README.
Usage: python scripts/finish-lab-walkthrough.py <lab number>"""
from pathlib import Path
import json,html,hashlib,shutil,sys,re
from lab_video_common import mask
R=Path(__file__).resolve().parents[1];lab=int(sys.argv[1]);nn=f'{lab:02}';N=f'managed-agents-lab{nn}-walkthrough';P=R/'presentations'/N;V=R/'videos'/N
r=json.loads((V/'validation.json').read_text(encoding='utf-8'));assert r['fullVideoAndAudioDecode']=='passed';assert hashlib.sha256((V/r['file']).read_bytes()).hexdigest()==r['sha256']
t=json.loads((V/'timeline.json').read_text(encoding='utf-8'));story=json.loads((P/'storyboard.json').read_text(encoding='utf-8'))
plan=json.loads((V/'narration-plan.json').read_text(encoding='utf-8'));TITLE=plan['title']
shutil.copy2(P/'platform/capture-evidence.json',V/'walkthrough-evidence.json');e=json.loads((V/'walkthrough-evidence.json').read_text(encoding='utf-8'))
live=sum(x.get('mode')=='live' and x.get('phase','').startswith('live') for x in e['runs']);assert len(t['slides'])==len(story) and not e['errors']
shutil.copy2(P/'.build/video/slides/slide-01.png',V/'cover.png')
chapters=[]
for row,s in zip(t['slides'],story):
 sec=int(row['start']);chapters.append(f'<li><button data-start="{row["start"]}" onclick="const v=document.querySelector(\'video\');v.currentTime=Number(this.dataset.start);v.play()">{sec//60}:{sec%60:02} · {html.escape(s["title"])}</button></li>')
page=(V/'index.html').read_text(encoding='utf-8').replace('poster="highlight-preview.jpg"','poster="cover.png"')
terminal=P/'terminal/live.raw.txt';terminalLink=''
if terminal.exists() and terminal.stat().st_size:
 raw=terminal.read_text(encoding='utf-8')
 assert 'sk-ant-' not in raw and 'Authorization:' not in raw,'Secret-like content in terminal evidence'
 (V/'live-terminal-output.txt').write_text(mask(raw),encoding='utf-8')
 terminalLink=' · <a href="live-terminal-output.txt">Live terminal evidence</a>'
 liveText='a recorded live terminal demonstration'
else:liveText=f'{live} recorded live run(s)' if live else 'no live run'
if lab==50 and e.get('liveAttemptNotes') and any(s['id']=='live-answer' for s in e['shots']):
 liveText='one successful live conversation plus an archived tool-batch refusal'
 diagnostic=P/'platform/live-attempt-diagnostic.json'
 if diagnostic.exists():
  shutil.copy2(diagnostic,V/'live-attempt-diagnostic.json')
  terminalLink+=' · <a href="live-attempt-diagnostic.json">Archived first-attempt diagnostic</a>'
if lab==62 and (V/'live-report-diagnostic.json').exists():
 terminalLink+=' · <a href="live-report-diagnostic.json">Observed verifier limitation</a>'
if lab==64 and (V/'live-report-diagnostic.json').exists():
 terminalLink+=' · <a href="live-report-diagnostic.json">Observed report framing</a> · <a href="live-browser-proof.png">Actual live browser proof</a>'
if lab==66 and (V/'live-websocket-diagnostic.json').exists():
 terminalLink+=' · <a href="live-websocket-diagnostic.json">Actual WebSocket and archive evidence</a>'
if lab==70 and (V/'live-python-diagnostic.json').exists():
 terminalLink+=' · <a href="live-python-diagnostic.json">Actual Python SDK and archive evidence</a>'
extra='<section><h2>Lesson chapters</h2><ol style="columns:2;line-height:2">'+''.join(chapters)+f'</ol><p>{len(e["shots"])} views were captured with Playwright from the platform running in a fresh clone: offline fixtures and {liveText}. Session, agent and environment IDs are partly hidden.</p><p><a href="walkthrough-evidence.json">Capture evidence</a> · <a href="narration-script.txt">Narration script</a> · <a href="geometry-audit.json">Highlight geometry</a></p></section><style>button{{background:none;border:0;color:#f2b48f;font:inherit;text-align:left;cursor:pointer}}li{{break-inside:avoid}}@media(max-width:750px){{ol{{columns:1!important}}}}</style>'
if terminalLink:extra=extra.replace('Highlight geometry</a>','Highlight geometry</a>'+terminalLink)
page=re.sub(r'<section><h2>Lesson chapters</h2>.*?</section><style>.*?</style>','',page,flags=re.S)
page=page.replace('</main>',extra+'</main>')
(V/'index.html').write_text(page,encoding='utf-8');sec=int(r['durationSeconds']);stamp=f'{sec//60}:{sec%60:02}'
catalog=R/'videos/index.html';body=catalog.read_text(encoding='utf-8');tag=f'<article data-project="{N}">'
i=body.find(tag)
if i>=0:body=body[:i]+body[body.index('</article>',i)+len('</article>'):]
card=f'{tag}<span>CLAUDE MANAGED AGENTS · LAB {nn} STEP BY STEP</span><a href="{N}/index.html"><img loading="lazy" src="{N}/cover.png" alt="{html.escape(TITLE)}"></a><div><h2>{html.escape(TITLE)}</h2><p>Verified · {stamp} · 1080p · Yash narration · offline fixtures and {liveText}</p><a href="{N}/{r["file"]}">MP4</a> · <a href="{N}/index.html">Player and chapters</a></div></article>'
catalog.write_text(body.replace('<main>','<main>'+card,1),encoding='utf-8')
authorSteps=(f'python scripts/prepare-recovered-walkthroughs.py {lab}' if 46<=lab<=75 else f'python scripts/create-lab{nn}-walkthrough.py; node scripts/capture-lab{nn}-walkthrough-slides.mjs; python scripts/create-lab{nn}-walkthrough.py; python scripts/audit-lab{nn}-walkthrough.py')
liveStep=(f'node --env-file=.env --import tsx scripts/live-labs/lab{nn}-live.ts (save actual output as presentations/{N}/terminal/live.raw.txt)' if 46<=lab<=49 else f'enable live, restart, node scripts/capture-lab{nn}-walkthrough.mjs live')
captureStep=f'node scripts/capture-lab{nn}-walkthrough.mjs offline'
if 51<=lab<=55:
 captureStep=f'node scripts/capture-quality-walkthrough.mjs {lab}'
 liveStep=f'node --env-file=.env --import tsx scripts/live-labs/quality-live.ts {lab} (save actual output as presentations/{N}/terminal/live.raw.txt)'
elif 56<=lab<=60:
 captureStep=f'node scripts/capture-operations-walkthrough.mjs {lab}'
 liveStep=f'node --env-file=.env --import tsx scripts/live-labs/operations-live.ts {lab} (save actual output as presentations/{N}/terminal/live.raw.txt)'
elif 61<=lab<=62:
 captureStep=f'node scripts/capture-retrieval-walkthrough.mjs {lab}'
 liveStep=f'node --env-file=.env --import tsx scripts/live-labs/retrieval-live.ts {lab} (save actual output as presentations/{N}/terminal/live.raw.txt; preserve the report diagnostic for the observed Lab 62 verifier rejection)'
elif 63<=lab<=65:
 captureStep=f'node scripts/capture-trusted-host-walkthrough.mjs {lab}'
 liveStep=f'node --env-file=.env --import tsx scripts/live-labs/trusted-host-live.ts {lab} (save actual output as presentations/{N}/terminal/live.raw.txt; preserve the report diagnostic and PNG for the observed Lab 64 framing rejection)'
elif 66<=lab<=70:
 captureStep=f'node scripts/capture-protocol-walkthrough.mjs {lab}'
 liveFile='websocket-live' if lab==66 else 'python-live' if lab==70 else 'host-runtime-live'
 liveArg='' if lab in (66,70) else f' {lab}'
 liveStep=f'node --env-file=.env --import tsx scripts/live-labs/{liveFile}.ts{liveArg} (save actual output as presentations/{N}/terminal/live.raw.txt and retain the owned-session diagnostics)'
elif 71<=lab<=75:
 captureStep=f'node scripts/capture-final-workshops.mjs {lab}'
 liveStep=f'node --env-file=.env --import tsx scripts/live-labs/final-workshops-live.ts {lab} (save actual output as presentations/{N}/terminal/live.raw.txt; existing-agent controls are separate from the scripted browser roles)'
(V/'README.txt').write_text(f'CLAUDE MANAGED AGENTS: {TITLE.upper()}\nDuration: {stamp}. 1920x1080, 30 fps, H.264/AAC. Inworld Yash, TTS 2, enhanced, balanced delivery, speaking rate 1.25, 48kHz.\n\n{len(story)} scenes: '+'; '.join(s['title'] for s in story)+f'.\n\nCaptured with Playwright from the platform running in a fresh clone (C:\\Students). Offline fixtures and {liveText} (each capped by the session budget).\n\nRebuild (platform running from the clone): {captureStep}; {liveStep}; node scripts/capture-live-port-code.mjs {lab}; {authorSteps}; python -u scripts/build-narrated-presentation.py --project {N}; python scripts/finish-lab-walkthrough.py {lab}\n',encoding='utf-8')
print(f'Lab {nn} walkthrough player ready: {stamp}, {len(chapters)} chapters.')
