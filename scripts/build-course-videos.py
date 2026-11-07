"""Resumable authorized course production, with bounded recording/render queues."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,html,json,msvcrt,os,queue,subprocess,sys,threading,time,zipfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'videos';LOCK=threading.RLock();STATES={};RENDER=queue.Queue(maxsize=3)
def now():return datetime.now(timezone.utc).isoformat()
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def atomic(path,data):
 temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(json.dumps(data,indent=2),encoding='utf8');os.replace(temp,path)

def validated(lab):
 folder=OUT/f'lab{lab:02}';p=folder/'validation.json'
 if not p.exists():return None
 try:
  result=read(p);file=folder/result['file'];plan=read(folder/'narration-plan.json')
  if not file.exists() or result['sha256']!=hashlib.sha256(file.read_bytes()).hexdigest():return None
  if result.get('slides')!=len(plan['slides']) or result.get('fullVideoAndAudioDecode')!='passed':return None
  if result.get('highlightPaddingPixels')!=8 or result.get('maximumAudioSyncOffsetSeconds',1)>=.06:return None
  return result
 except (ValueError,KeyError,OSError):return None

def refresh():
 with LOCK:
  for n in range(1,76):
   if STATES.get(n,{}).get('state')=='complete':continue
   v=validated(n)
   if v:STATES[n]={'lab':n,'state':'complete','file':f'lab{n:02}/'+v['file'],'durationSeconds':v['durationSeconds'],'bytes':v['bytes'],'sha256':v['sha256']}
  completed=[n for n,x in STATES.items() if x['state']=='complete'];errors=[x for x in STATES.values() if x['state']=='needs_review']
  payload={'updated':now(),'pid':os.getpid(),'requestedLabs':[2,75],'completed':len([n for n in completed if n>=2]),'requestedCount':74,'referenceLab01':'approved','needsReview':errors,'labs':[STATES[n] for n in sorted(STATES)]}
  atomic(OUT/'production-status.json',payload)
  cards=[]
  for n in range(1,76):
   item=STATES.get(n,{'state':'queued'});state=item['state'];folder=OUT/f'lab{n:02}';planpath=folder/'narration-plan.json'
   try:title=read(planpath).get('title','Session event streaming' if n==1 else f'Lab {n:02}') if planpath.exists() else f'Lab {n:02}'
   except (ValueError,OSError):title=f'Lab {n:02}'
   if state=='complete':
    minutes=int(item['durationSeconds'])//60;seconds=round(item['durationSeconds'])%60
    content=f'<a href="lab{n:02}/index.html"><img loading="lazy" src="lab{n:02}/highlight-preview.jpg" alt="Lab {n:02} cover"></a><div><h2>{html.escape(title)}</h2><p>Verified · {minutes}:{seconds:02} · 1080p</p><a href="{html.escape(item["file"])}">MP4</a> · <a href="lab{n:02}/index.html">Player</a></div>'
   else:content=f'<div><h2>{html.escape(title)}</h2><p>{html.escape(state.replace("_"," "))}</p></div>'
   cards.append(f'<article><span>LAB {n:02}</span>{content}</article>')
  page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60"><title>Course video production</title><style>body{margin:0;background:#f5f3ef;color:#1d252b;font:17px Arial}header{padding:38px;background:#1d252b;color:white}main{max-width:1250px;margin:auto;padding:30px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px}h1,h2{font-family:Georgia}article{background:white;border:1px solid #e8d4c7;border-radius:8px;overflow:hidden}article>span{display:block;padding:14px 20px;color:#a74425;font-weight:bold;font-size:13px}article div{padding:5px 20px 24px}img{width:100%;display:block}a{color:#a74425}header a{color:#f2b48f}p{line-height:1.5}</style>'''
  archive_link=' · <a href="Labs-02-75-MP4.zip">Download all 74 MP4s</a>' if len([n for n in completed if n>=2])==74 and (OUT/'Labs-02-75-MP4.zip').exists() else ''
  page+=f'<header><h1>Course videos · Labs 01–75</h1><p>{payload["completed"]} of 74 requested remaining videos verified. Lab 01 is the approved reference. {len(errors)} need review.</p><p>Inworld Yash · TTS 2 · Enhanced · Balanced · 1.25× · 48 kHz · Cube transitions · Text-fitted red highlights</p><a href="production-status.json">Production status</a>{archive_link}</header><main>'+''.join(cards)+'</main></html>'
  (OUT/'index.html').write_text(page,encoding='utf8')

def stage(lab,state,**extra):
 with LOCK:STATES[lab]={'lab':lab,'state':state,'updated':now(),**extra};refresh()
 print(f'[{now()}] Lab {lab:02}: {state}',flush=True)

def run(lab,name,args):
 log=OUT/f'lab{lab:02}/{name}.log';log.parent.mkdir(parents=True,exist_ok=True)
 with log.open('w',encoding='utf8') as stream:
  p=subprocess.run(args,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
 if p.returncode:
  tail='\n'.join(log.read_text(encoding='utf8',errors='replace').splitlines()[-8:]);raise RuntimeError(f'{name} exited {p.returncode}: {tail}')

def wait_export(lab):
 directory=ROOT/f'presentations/lab{lab:02}/.build/video/slides'
 for _ in range(2400):
  try:
   geo=read(directory/'geometry.json');ocr=read(directory/'ocr.json')
   if len(geo)==len(ocr) and len(geo)>10:return ocr
  except (OSError,ValueError):pass
  time.sleep(3)
 raise RuntimeError('Native PowerPoint export did not become ready.')

def publish(lab):
 folder=OUT/f'lab{lab:02}';plan=read(folder/'narration-plan.json');result=read(folder/'validation.json');title=html.escape(plan.get('title','Session event streaming'));file=html.escape(result['file'])
 import re
 subtitles=folder/f'Lab{lab:02}-captions.srt';vtt='WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',subtitles.read_text());(folder/f'Lab{lab:02}-captions.vtt').write_text(vtt,encoding='utf8')
 page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lab {lab:02} · {title}</title><style>body{{margin:0;background:#1d252b;color:white;font:18px Arial}}main{{max-width:1250px;margin:auto;padding:26px}}h1{{font:36px Georgia}}video{{width:100%}}a{{color:#f2b48f}}nav{{display:flex;gap:24px;flex-wrap:wrap}}p{{line-height:1.6}}</style><main><h1>Lab {lab:02} · {title}</h1><video controls preload="metadata" poster="highlight-preview.jpg"><source src="{file}" type="video/mp4"><track kind="subtitles" src="Lab{lab:02}-captions.vtt" srclang="en" label="English"></video><p>{result['slides']} slides · {result['cubeTransitionsVerified']} cube transitions · {result['wordAlignedHighlightsVerified']} synchronized narration segments · fitted text outlines</p><nav><a href="{file}" download>Download MP4</a><a href="Lab{lab:02}-narration.mp3" download>Narration MP3</a><a href="Lab{lab:02}-captions.srt" download>Subtitles</a><a href="all-slides-review.jpg">All slides</a><a href="validation.json">Verification</a><a href="../index.html">All videos</a></nav></main></html>'''
 (folder/'index.html').write_text(page,encoding='utf8')

def produce(labs):
 try:
  for lab in labs:
   if validated(lab):continue
   try:
    stage(lab,'waiting_for_slide_export');ocr=wait_export(lab)
    # Office COM and WinRT text projections interfere when loaded in one process.
    # Re-run OCR in a fresh process when only the bounds were returned.
    if not any(line.get('text') for s in ocr for line in s['lines']):
     stage(lab,'measuring_screenshot_text');run(lab,'ocr',['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File','scripts/ocr-video-slides.ps1','-Lab',str(lab)])
    stage(lab,'planning');run(lab,'plan',[sys.executable,'scripts/plan-course-videos.py','--lab',str(lab)])
    stage(lab,'checking_highlight_fit');run(lab,'highlight-preflight',[sys.executable,'scripts/review-presentation-highlights.py','--lab',str(lab),'--plan'])
    stage(lab,'recording_inworld');run(lab,'record',[sys.executable,'scripts/record-presentation-video.py','--lab',str(lab),'--execute-authorized-recording'])
    stage(lab,'queued_for_render');RENDER.put(lab)
   except Exception as error:
    stage(lab,'needs_review',error=str(error))
    if any(f'Inworld HTTP {code}' in str(error) for code in (401,402,403)):
     for pending in labs[labs.index(lab)+1:]:stage(pending,'waiting_for_provider_configuration')
     return
    continue
 finally:
  for _ in range(2):RENDER.put(None)

def consume():
 while True:
  lab=RENDER.get()
  try:
   if lab is None:return
   try:
    stage(lab,'rendering');run(lab,'render',[sys.executable,'scripts/render-presentation-video.py','--lab',str(lab)])
    stage(lab,'verifying_video_and_audio');run(lab,'verify',[sys.executable,'scripts/verify-presentation-video.py','--lab',str(lab)])
    publish(lab);result=validated(lab);assert result,'Final output identity did not validate'
    stage(lab,'complete',file=f'lab{lab:02}/'+result['file'],durationSeconds=result['durationSeconds'],bytes=result['bytes'],sha256=result['sha256'])
   except Exception as error:stage(lab,'needs_review',error=str(error))
  finally:RENDER.task_done()

def package():
 missing=[n for n in range(2,76) if not validated(n)]
 if missing:return
 archive=OUT/'Labs-02-75-MP4.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED,allowZip64=True) as z:
  for n in range(2,76):
   folder=OUT/f'lab{n:02}';result=read(folder/'validation.json')
   for p in [folder/result['file'],folder/f'Lab{n:02}-captions.srt',folder/'validation.json']:z.write(p,f'Lab-{n:02}/'+p.name)
 print('Packaged all 74 verified MP4 videos.',flush=True)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--first',type=int,default=2);parser.add_argument('--last',type=int,default=75);parser.add_argument('--labs',help='Explicit reviewed recovery subset');args=parser.parse_args();assert 2<=args.first<=args.last<=75
 selected=sorted(set(int(v) for v in args.labs.split(','))) if args.labs else list(range(args.first,args.last+1));assert selected and all(2<=n<=75 for n in selected)
 OUT.mkdir(exist_ok=True)
 with (OUT/'production.lock').open('a+b') as handle:
  handle.seek(0);handle.write(b'0');handle.flush();handle.seek(0);msvcrt.locking(handle.fileno(),msvcrt.LK_NBLCK,1)
  try:previous={x['lab']:x for x in read(OUT/'production-status.json')['labs']}
  except (ValueError,KeyError,OSError):previous={}
  for n in range(1,76):STATES[n]=previous[n] if n not in selected and previous.get(n,{}).get('state') in ('needs_review','waiting_for_provider_configuration') else {'lab':n,'state':'queued'}
  refresh();workers=[threading.Thread(target=consume,name=f'video-render-{i}') for i in range(2)]
  for w in workers:w.start()
  producer=threading.Thread(target=produce,args=(selected,),name='inworld-recorder');producer.start()
  while producer.is_alive() or any(w.is_alive() for w in workers):refresh();time.sleep(15)
  producer.join()
  for w in workers:w.join()
  refresh();package();refresh();print('Production run finished; see production-status.json for verified outputs and any review items.',flush=True)
if __name__=='__main__':main()
