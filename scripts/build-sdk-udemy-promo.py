"""Render/verify exact Udemy promo windows; narration is never cut or accelerated."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import hashlib,html,importlib.util,json,re,subprocess,textwrap,wave
import cv2,numpy as np,imageio_ffmpeg
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-udemy-promo-88s-v1'
P=ROOT/'presentations'/NAME;OUT=ROOT/'videos'/NAME;BUILD=P/'.build/video';SLIDES=BUILD/'slides';FF=imageio_ffmpeg.get_ffmpeg_exe();FPS=30
PREFIX='Claude-Agent-SDK-Udemy-Promo-88s';LEAD=.6;TURN=.4
def run(args,output=False):
 p=subprocess.run([FF,'-hide_banner','-loglevel','error',*map(str,args)],capture_output=True)
 assert p.returncode==0 and not p.stderr,p.stderr.decode(errors='replace')[-2500:]
 return p.stdout if output else None
def status(stage,**extra):
 (OUT/'production-status.json').write_text(json.dumps({'stage':stage,'updated':datetime.now(timezone.utc).isoformat(),**extra},indent=2));print(stage,flush=True)
def encoder(file):return ['-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r','30','-threads','2','-video_track_timescale','15360',file]
def frame(cap,t):cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,f=cap.read();assert ok,t;return f
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02},{ms:03}'
def pcm(file):return np.frombuffer(run(['-i',file,'-vn','-sn','-f','f32le','-ac','1','-ar','8000','pipe:1'],True),dtype=np.float32)
def border(rect):
 x,y,w,h=rect;mask=np.zeros((h,w),bool);mask[:4]=True;mask[-4:]=True;mask[:,:4]=True;mask[:,-4:]=True;return mask
def motion():
 source=ROOT/'presentations/agent-sdk-complete-browser-tour-v3/capture/complete-browser-recording.webm'
 verified=json.loads((ROOT/'videos/agent-sdk-complete-browser-tour-v3/validation.json').read_text());assert verified['liveRun']=='success' and verified['mocked'] is False
 original=json.loads((ROOT/'videos/agent-sdk-complete-browser-tour-v3/timeline.json').read_text())
 clips=[];evidence=[]
 for n,seconds in [(39,11.6),(40,4),(41,4)]:
  scene=original['scenes'][n-1];s=scene['source'];file=BUILD/f'app-proof-{n}.mp4'
  key=hashlib.sha256(json.dumps({'source':s,'seconds':seconds,'size':[1920,1080]},sort_keys=True).encode()).hexdigest();marker=file.with_suffix('.sha256')
  if not(file.exists() and marker.exists() and marker.read_text()==key):
   vf=f'setpts=(PTS-STARTPTS)*{seconds/s["seconds"]:.12f},fps=30,scale=1920:1080,tpad=stop_mode=clone:stop_duration=1'
   run(['-y','-ss',s['start'],'-t',s['seconds'],'-i',source,'-vf',vf,'-t',seconds,*encoder(file)]);marker.write_text(key)
  clips.append(file);evidence.append({'section':n,'label':scene['label'],'source':s,'promoSeconds':seconds})
 concat=BUILD/'app-montage.txt';concat.write_text('\n'.join("file '"+f.as_posix()+"'" for f in clips),encoding='utf8');dest=BUILD/'app-montage.mp4'
 run(['-y','-f','concat','-safe','0','-i',concat,'-c:v','copy','-an',dest]);return dest,evidence
def main():
 status('preflight');spec=json.loads((P/'promo-spec.json').read_text());plan=json.loads((OUT/'narration-plan.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text());geometry=json.loads((SLIDES/'geometry.json').read_text());sections=spec['sectionTimings'];records=manifest['recordings']
 assert spec['duration']==88 and [(s['start'],s['duration']) for s in sections]==[(0,3),(3,20),(23,20),(43,20),(63,15),(78,10)]
 assert len(records)==5 and plan['presentationSha256']==manifest['presentationSha256']==hashlib.sha256((ROOT/plan['presentation']).read_bytes()).hexdigest()
 for section,row,record in zip(sections[1:],plan['slides'],records):
  assert record['duration']<=section['duration']-LEAD-.2,('Narration exceeds the fixed window; revise the script without changing voice speed',section['title'],record['duration'])
  assert [(c['id'],c['text'],c['target']) for c in row['segments']]==[(c['id'],c['text'],c['target']) for c in record['cues']]
  print(f"{section['title']}: {record['duration']:.2f}s narration within {section['duration']}s window.",flush=True)
 status('rendering');montage,evidence=motion()
 def render(n):
  section=sections[n-1];duration=section['duration']-(TURN if n>1 else 0);image=cv2.imread(str(SLIDES/f'slide-{n:02}.png'));cues=[];filters=[]
  if n>1:
   record=records[n-2]
   for cue in record['cues']:
    fits=fit_highlights(cue['target'],geometry[n-1],image);start=LEAD-TURN+cue['start'];end=LEAD-TURN+cue['end']
    for f in fits:
     x,y,w,h=f['rect'];filters.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xff2424:t=4:enable='between(t,{start:.6f},{end:.6f})'")
    cues.append({**cue,'start':section['start']+LEAD+cue['start'],'end':section['start']+LEAD+cue['end'],'rects':[f['rect'] for f in fits],'textFits':fits})
  file=BUILD/f'scene-{n:02}.mp4';identity=hashlib.sha256(image.tobytes()+json.dumps({'duration':duration,'cues':cues,'motion':evidence if n==3 else None},sort_keys=True).encode()).hexdigest();marker=file.with_suffix('.sha256')
  if not(file.exists() and marker.exists() and marker.read_text()==identity):
   args=['-y','-loop','1','-framerate','30','-i',SLIDES/f'slide-{n:02}.png']
   if n==3:
    chain='[1:v]scale=1200:675[app];[0:v][app]overlay=650:283:shortest=1,'+','.join(filters)+'[v]'
    args+=['-i',montage,'-filter_complex',chain,'-map','[v]']
   elif filters:args+=['-vf',','.join(filters)]
   run([*args,'-t',duration,*encoder(file)]);marker.write_text(identity)
  print(f'Rendered promo scene {n}: {duration}s.',flush=True)
  return {'file':file,'duration':duration,'cues':cues}
 with ThreadPoolExecutor(max_workers=2) as pool:scenes=list(pool.map(render,range(1,7)))
 module=importlib.util.spec_from_file_location('renderer',ROOT/'scripts/render-presentation-video.py');renderer=importlib.util.module_from_spec(module);module.loader.exec_module(renderer)
 pieces=[scenes[0]['file']];transitions=[]
 for i in range(1,6):
  a=cv2.VideoCapture(str(scenes[i-1]['file']));af=frame(a,scenes[i-1]['duration']-1/FPS);a.release();b=cv2.VideoCapture(str(scenes[i]['file']));bf=frame(b,0);b.release();file=BUILD/f'cube-{i:02}.mp4'
  args=[FF,'-v','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size','1920x1080','-framerate','30','-i','pipe:0',*map(str,encoder(file))]
  p=subprocess.Popen(args,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
  for k in range(12):p.stdin.write(renderer.cube_frame(af,bf,k/11).tobytes())
  p.stdin.close();error=p.stderr.read();p.wait();assert p.returncode==0,error
  pieces.extend([file,scenes[i]['file']]);transitions.append({'start':sections[i]['start'],'seconds':TURN})
 # Continuous PCM establishes the exact six windows; encode AAC only once.
 wavfile=BUILD/'soundtrack.wav'
 with wave.open(str(wavfile),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(b'\0'*(3*48000*4))
  for section,record in zip(sections[1:],records):
   data=run(['-i',ROOT/record['audio'],'-f','s16le','-ac','2','-ar','48000','pipe:1'],True);lead=round(LEAD*48000)*4;total=section['duration']*48000*4;tail=total-lead-len(data);assert tail>=0
   w.writeframes(b'\0'*lead+data+b'\0'*tail)
 cues=[c for s in scenes for c in s['cues']];srt=OUT/(PREFIX+'.srt');srt.write_text('\n'.join(f'{i}\n{stamp(c["start"])} --> {stamp(c["end"])}\n'+'\n'.join(textwrap.wrap(c['text'],85))+'\n' for i,c in enumerate(cues,1)),encoding='utf8')
 vtt=OUT/(PREFIX+'.vtt');vtt.write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt.read_text(encoding='utf8')),encoding='utf8')
 meta=[';FFMETADATA1','title=Claude Agent SDK - Free Udemy Course Promo','artist=Luis Coco Enriquez']
 for s in sections:meta+=['[CHAPTER]','TIMEBASE=1/1000',f'START={s["start"]*1000}',f'END={(s["start"]+s["duration"])*1000}','title='+s['title']]
 (BUILD/'chapters.txt').write_text('\n'.join(meta),encoding='utf8');(BUILD/'concat.txt').write_text('\n'.join("file '"+p.as_posix()+"'" for p in pieces),encoding='utf8');movie=OUT/(PREFIX+'.mp4')
 run(['-y','-f','concat','-safe','0','-i',BUILD/'concat.txt','-i',wavfile,'-f','ffmetadata','-i',BUILD/'chapters.txt','-i',srt,'-map','0:v:0','-map','1:a:0','-map','3:0','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-c:s','mov_text','-metadata:s:s:0','language=eng','-movflags','+faststart',movie])
 (OUT/'timeline.json').write_text(json.dumps({'duration':88,'sections':sections,'cues':cues,'cubeTransitions':transitions,'appEvidence':evidence},indent=2))
 status('verifying');run(['-i',movie,'-map','0:v:0','-map','0:a:0','-f','null','-'])
 video=cv2.VideoCapture(str(movie));assert (video.get(3),video.get(4))==(1920,1080) and abs(video.get(5)-30)<.001 and video.get(7)==2640
 metadata=subprocess.run([FF,'-hide_banner','-i',str(movie)],capture_output=True).stderr.decode(errors='replace');assert all(t in metadata for t in ['h264','aac','48000 Hz','mov_text']);assert len(re.findall(r'Chapter #0:\d+:',metadata))==6
 module=importlib.util.spec_from_file_location('recorder',ROOT/'scripts/record-presentation-video.py');recorder=importlib.util.module_from_spec(module);module.loader.exec_module(recorder)
 for planned,record in zip(plan['slides'],records):
  source=ROOT/record['audio'];assert hashlib.sha256(source.read_bytes()).hexdigest()==record['sha256'];assert recorder.align(planned['segments'],json.loads(source.with_suffix('.json').read_text())['timestampInfo'])==record['cues']
 checks=[]
 for c in cues:
  for point in [c['start']+.1,c['end']-.1]:
   image=frame(video,point)
   for fit in c['textFits']:
    rect=fit['rect'];x,y,w,h=rect;ix,iy,iw,ih=fit['textInkRect'];assert (ix-x,iy-y,x+w-ix-iw,y+h-iy-ih)==(8,8,8,8)
    crop=image[y:y+h,x:x+w];red=(crop[:,:,2]>170)&(crop[:,:,1]<100)&(crop[:,:,0]<120);score=float(red[border(rect)].mean());assert score>.4,(c['id'],point,score)
   checks.append({'cue':c['id'],'seconds':round(point,3)})
 # Check native section starts and the complete three-second branding hold.
 native=cv2.imread(str(SLIDES/'slide-01.png'))
 for t in [.1,1.5,2.95]:assert float(np.mean(cv2.absdiff(native,frame(video,t))))<3
 for transition in transitions:
  t=transition['start'];assert float(np.mean(cv2.absdiff(frame(video,t),frame(video,t+.2))))>3
 sound=pcm(movie);assert np.max(np.abs(sound[:24000]))<.0001,'Branding hold must be silent'
 sync=[]
 for section,record in zip(sections[1:],records):
  source=pcm(ROOT/record['audio'])
  for fraction in [.18,.5,.78]:
   candidates=[]
   for p in np.linspace(max(0,len(source)*fraction-4000),min(len(source)-6000,len(source)*fraction+4000),9):
    pos=round(p);template=source[pos:pos+6000];candidates.append((float(np.sqrt(np.mean(template**2))),pos,template))
   rms,pos,template=max(candidates,key=lambda x:x[0]);assert rms>.005
   expected=round((section['start']+LEAD)*8000)+pos;radius=800;search=sound[expected-radius:expected+6000+radius].copy();scores=cv2.matchTemplate(search.reshape(1,-1),template.copy().reshape(1,-1),cv2.TM_CCOEFF_NORMED);_,score,_,location=cv2.minMaxLoc(scores);drift=(location[0]-radius)/8000
   assert score>.9 and abs(drift)<.06,(section['title'],score,drift);sync.append({'section':section['title'],'correlation':round(score,5),'offsetSeconds':drift})
 # Verify the moving app is present and changes during the benefits window.
 first=frame(video,24)[283:958,650:1850];last=frame(video,41)[283:958,650:1850];assert float(np.mean(cv2.absdiff(first,last)))>1
 for n,s in enumerate(sections,1):cv2.imwrite(str(OUT/f'review-section-{n:02}.jpg'),frame(video,s['start']+(1 if n==1 else s['duration']*.55)))
 video.release();report={'file':movie.name,'durationSeconds':88,'frames':2640,'resolution':[1920,1080],'fps':30,'sectionWindows':[{'title':s['title'],'start':s['start'],'end':s['start']+s['duration']} for s in sections],'fullVideoAndAudioDecode':'passed','silentBrandingSeconds':3,'wordAlignedCues':len(cues),'highlightBoundaryFramesChecked':len(checks),'highlightPaddingPixels':8,'cubeTransitions':5,'transitionsInsideSpecifiedWindows':True,'liveAppEvidence':'previously verified unmocked query; authentic browser footage','audioSync':sync,'maximumAudioOffsetSeconds':max(abs(s['offsetSeconds']) for s in sync),'sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
 (OUT/'validation.json').write_text(json.dumps(report,indent=2))
 rows=''.join(f'<tr><td>{stamp(s["start"])[3:8]}–{stamp(s["start"]+s["duration"])[3:8]}</td><td>{html.escape(s["title"])}</td></tr>' for s in sections)
 page=f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claude Agent SDK · Udemy Promo</title><style>body{{font:18px Arial;background:#edf6ff;color:#090d3b;margin:24px}}main{{max-width:1400px;margin:auto}}video{{width:100%}}a{{color:#087ed3}}table{{border-collapse:collapse}}td{{padding:10px 24px 10px 0}}p{{line-height:1.5}}</style><main><h1>Claude Agent SDK: free course promo</h1><video controls preload="metadata" poster="review-section-01.jpg"><source src="{movie.name}" type="video/mp4"><track kind="subtitles" src="{vtt.name}" srclang="en" label="English"></video><p>88 seconds · 1080p · Inworld Yash narration · Word-timed highlights · Authentic app footage</p><p><a href="{movie.name}" download>Download MP4</a> · <a href="{srt.name}">English subtitles</a> · <a href="narration-script.txt">Narration script</a> · <a href="validation.json">Verification</a></p><table>{rows}</table><p>Instructor introduction uses the supplied photograph and synthetic narrator. App clips are edited for promotional pacing. This is a separate trailer; the complete course walkthrough remains unchanged.</p><p>References: <a href="https://teach.udemy.com/publishing/promo-video/">Udemy promo guide</a> · <a href="https://teach.udemy.com/course-creation/learning-objectives/">Learning objectives</a></p></main>'''
 (OUT/'index.html').write_text(page,encoding='utf8');status('complete',file=movie.name,durationSeconds=88,sha256=report['sha256'])
if __name__=='__main__':
 try:main()
 except Exception as e:status('needs_review',error=str(e));raise
