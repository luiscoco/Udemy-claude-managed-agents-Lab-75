"""Produce an independently named narrated presentation without touching course videos."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,html,json,re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--project',required=True);parser.add_argument('--visual-only',action='store_true');a=parser.parse_args()
 assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',a.project)
 out=ROOT/'videos'/a.project;plan=json.loads((out/'narration-plan.json').read_text());prefix=plan['mediaPrefix']
 assert hashlib.sha256((ROOT/plan['presentation']).read_bytes()).hexdigest()==plan['presentationSha256']
 def status(stage,**extra):
  (out/'production-status.json').write_text(json.dumps({'project':a.project,'stage':stage,'updated':datetime.now(timezone.utc).isoformat(),**extra},indent=2))
  print(stage,flush=True)
 stages=[('recording','record-presentation-video.py',['--execute-authorized-recording']),('rendering','render-presentation-video.py',[]),('verifying','verify-presentation-video.py',[])]
 if a.visual_only:stages=[('rendering','render-presentation-video.py',['--reuse-audio']),('verifying','verify-presentation-video.py',[])]
 if plan.get('verifyPhraseBoundaries'):stages.append(('checking_phrase_boundaries','verify-overview-highlight-revision.py',[]))
 try:
  for stage,script,flags in stages:
   status(stage)
   with (out/f'{stage}.log').open('w',encoding='utf8') as log:
    result=subprocess.run([sys.executable,'-u',str(ROOT/'scripts'/script),'--project',a.project,*flags],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
   if result.returncode:raise RuntimeError(f'{stage} failed; see {stage}.log')
  report=json.loads((out/'validation.json').read_text());video=out/report['file']
  assert report['fullVideoAndAudioDecode']=='passed' and report['slides']==len(plan['slides'])
  assert report['sha256']==hashlib.sha256(video.read_bytes()).hexdigest()
  srt=(out/f'{prefix}-captions.srt').read_text();vtt='WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt)
  (out/f'{prefix}-captions.vtt').write_text(vtt,encoding='utf8')
  title=html.escape(plan['title']);filename=html.escape(report['file'])
  page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>body{{background:#1d252b;color:white;margin:0;font:18px Arial}}main{{max-width:1250px;margin:auto;padding:28px}}h1{{font:36px Georgia}}video{{width:100%}}a{{color:#f2b48f}}nav{{display:flex;gap:24px;flex-wrap:wrap}}p{{line-height:1.6}}</style><main><h1>{title}</h1><video controls preload="metadata" poster="highlight-preview.jpg"><source src="{filename}" type="video/mp4"><track kind="subtitles" src="{prefix}-captions.vtt" srclang="en" label="English"></video><p>{report['slides']} slides · {report['cubeTransitionsVerified']} cube transitions · {report['wordAlignedHighlightsVerified']} synchronized narration segments · Inworld Yash</p><nav><a href="{filename}" download>Download MP4</a><a href="{prefix}-narration.mp3" download>Narration MP3</a><a href="{prefix}-captions.srt" download>Subtitles</a><a href="all-slides-review.jpg">Slide overview</a><a href="validation.json">Verification report</a></nav></main></html>'''
  if plan.get('referenceNotes'):
   items=[]
   for note in plan['referenceNotes']:
    assert note['url'].startswith('https://')
    items.append('<li><p>'+html.escape(note['note'])+' <a href="'+html.escape(note['url'],quote=True)+'">'+html.escape(note['title'])+'</a></p></li>')
   references='<section><h2>API references and slide clarifications</h2><ul>'+''.join(items)+'</ul></section>'
   page=page.replace('</main>',references+'</main>')
  (out/'index.html').write_text(page,encoding='utf8')
  status('complete',file=report['file'],durationSeconds=report['durationSeconds'],sha256=report['sha256'])
 except Exception as error:
  status('needs_review',error=str(error));raise

if __name__=='__main__':main()
