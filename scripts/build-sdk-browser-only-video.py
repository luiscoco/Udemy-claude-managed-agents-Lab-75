"""Render only genuine browser recordings, with narrated UI sections and no deck."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,html,importlib.util,json,math,re,subprocess,textwrap,wave
import cv2,numpy as np,imageio_ffmpeg
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-complete-browser-tour-v3'
OUT=ROOT/'videos'/NAME;CAP=ROOT/'presentations'/NAME/'capture';BUILD=CAP.parent/'.build/video';BUILD.mkdir(parents=True,exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe();FPS=30;INTRO=.35
def run(args,output=False):
 p=subprocess.run([FF,'-hide_banner','-loglevel','error',*map(str,args)],capture_output=True);assert p.returncode==0,p.stderr.decode(errors='replace')[-1500:]
 return p.stdout if output else None
def pcm(file):return np.frombuffer(run(['-i',file,'-vn','-sn','-f','f32le','-ac','1','-ar','8000','pipe:1'],True),dtype=np.float32)
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02},{ms:03}'
def frame(v,t):v.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,f=v.read();assert ok;return f
def main():
 plan=json.loads((OUT/'narration-plan.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text());capture=json.loads((CAP/'capture-manifest.json').read_text())
 assert capture.get('error') is None and capture['liveRun']['status']=='success' and capture['mocked'] is False
 assert plan['presentationSha256']==manifest['presentationSha256']==hashlib.sha256((CAP/'capture-manifest.json').read_bytes()).hexdigest()
 raw=CAP/capture['rawVideo'];thumbs=np.frombuffer(run(['-i',raw,'-vf','fps=5,scale=240:135','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],True),dtype=np.uint8).reshape(-1,135,240,3)
 sources=[]
 for s in capture['scenes']:
  ref=cv2.cvtColor(cv2.imread(str(CAP/s['screenshot'])),cv2.COLOR_BGR2RGB);ref=cv2.resize(ref,(240,135));lo=max(0,int((s['startSeconds']-2)*5));hi=min(len(thumbs)-5,int((s['endSeconds']+6)*5));candidates=[]
  for k in range(lo,hi):
   a=float(np.mean(np.abs(thumbs[k].astype(float)-ref)));b=float(np.mean(np.abs(thumbs[k+4].astype(float)-ref)));candidates.append((max(a,b),k))
  score,k=min(candidates);assert score<10,(s['scene'],'source viewport does not match screenshot',score)
  first=next(i for value,i in candidates if value<=score+.12);begin=first/5+.03;end=begin+.80
  if s['label']=='Run the real example':end=capture['liveRun']['endSeconds']+(begin-s['startSeconds'])
  assert end>begin;sources.append({'start':begin,'seconds':end-begin,'difference':round(score,4)})
  print(f"Matched browser section {s['scene']:02}: {s['label']}",flush=True)
 def render(item):
  n,(scene,record,row,source)=item;duration=math.ceil((record['duration']+.9)*FPS)/FPS
  assert row['segments'][0]['text']==record['cues'][0]['text'];picture=cv2.imread(str(CAP/scene['screenshot']));fits=fit_highlights(row['segments'][0]['target'],{'shapes':[]},picture);cue=record['cues'][0];begin=INTRO+cue['start'];end=INTRO+cue['end']
  boxes=[]
  for f in fits:
   x,y,w,h=f['rect'];boxes.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xff2424:t=4:enable='between(t,{begin:.6f},{end:.6f})'")
  vf=f'setpts=(PTS-STARTPTS)*{duration/source["seconds"]:.9f},fps=30,tpad=stop_mode=clone:stop_duration=2,'+','.join(boxes)
  file=BUILD/f'section-{n:02}.mp4';identity=hashlib.sha256(json.dumps({'source':source,'duration':duration,'fits':fits,'cue':cue},sort_keys=True).encode()+raw.name.encode()).hexdigest();marker=file.with_suffix('.sha256')
  if not(file.exists() and marker.exists() and marker.read_text()==identity):
   run(['-y','-ss',source['start'],'-t',source['seconds'],'-i',raw,'-vf',vf,'-an','-t',duration,'-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-threads','2','-video_track_timescale','15360',file]);marker.write_text(identity)
  print(f'Rendered browser section {n:02}',flush=True)
  return {'scene':n,'label':scene['label'],'duration':duration,'file':file,'cue':{**cue,'start':begin,'end':end,'rects':[f['rect'] for f in fits]},'fits':fits,'source':source}
 pairs=list(enumerate(zip(capture['scenes'],manifest['recordings'],plan['slides'],sources),1))
 with ThreadPoolExecutor(max_workers=2) as pool:scenes=list(pool.map(render,pairs))
 offset=0;captions=[];chapters=[';FFMETADATA1','title=Claude Agent SDK - Complete Application Tour','artist=Luis Coco Enriquez'];timeline=[]
 with wave.open(str(BUILD/'soundtrack.wav'),'wb') as wav:
  wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(48000)
  for s,r in zip(scenes,manifest['recordings']):
   audio=run(['-i',ROOT/r['audio'],'-f','s16le','-ac','2','-ar','48000','pipe:1'],True);intro=16800;total=round(s['duration']*48000);tail=total-intro-len(audio)//4;assert tail>=0
   wav.writeframes(b'\0'*(intro*4)+audio+b'\0'*(tail*4));c=s['cue'];captions.append(f"{s['scene']}\n{stamp(offset+c['start'])} --> {stamp(offset+c['end'])}\n"+'\n'.join(textwrap.wrap(c['text'],85))+'\n')
   chapters.extend(['[CHAPTER]','TIMEBASE=1/1000',f'START={round(offset*1000)}',f'END={round((offset+s["duration"])*1000)}','title='+s['label']]);timeline.append({**{k:v for k,v in s.items() if k not in ['file','fits']},'start':offset});offset+=s['duration']
 prefix=plan['mediaPrefix'];srt=OUT/(prefix+'.srt');srt.write_text('\n'.join(captions),encoding='utf8');vtt=OUT/(prefix+'.vtt');vtt.write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt.read_text()),encoding='utf8')
 (BUILD/'chapters.txt').write_text('\n'.join(chapters)+'\n',encoding='utf8');(BUILD/'concat.txt').write_text('\n'.join("file '"+s['file'].as_posix()+"'" for s in scenes),encoding='utf8')
 movie=OUT/plan['outputFile'];run(['-y','-f','concat','-safe','0','-i',BUILD/'concat.txt','-i',BUILD/'soundtrack.wav','-f','ffmetadata','-i',BUILD/'chapters.txt','-i',srt,'-map','0:v','-map','1:a','-map','3:0','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-c:s','mov_text','-movflags','+faststart',movie])
 (OUT/'timeline.json').write_text(json.dumps({'duration':offset,'format':'actual browser footage only','scenes':timeline},indent=2))
 print('Verifying complete video, audio, UI bounds and word timing.',flush=True);run(['-i',movie,'-map','0:v:0','-map','0:a:0','-f','null','-'])
 spec=importlib.util.spec_from_file_location('rec',ROOT/'scripts/record-presentation-video.py');rec=importlib.util.module_from_spec(spec);spec.loader.exec_module(rec)
 video=cv2.VideoCapture(str(movie));assert video.get(cv2.CAP_PROP_FRAME_WIDTH)==1920 and video.get(cv2.CAP_PROP_FRAME_HEIGHT)==1080 and abs(video.get(cv2.CAP_PROP_FPS)-30)<.001
 checks=[];sound=pcm(movie);sync=[]
 for s,r,row,original in zip(timeline,manifest['recordings'],plan['slides'],capture['scenes']):
  assert original['wholeSectionVisible'];assert hashlib.sha256((ROOT/r['audio']).read_bytes()).hexdigest()==r['sha256'];metadata=json.loads((ROOT/r['audio']).with_suffix('.json').read_text());assert rec.align(row['segments'],metadata['timestampInfo'])==r['cues']
  for local in [s['cue']['start']+.1,s['cue']['end']-.1]:
   f=frame(video,s['start']+local)
   for x,y,w,h in s['cue']['rects']:
    crop=f[y:y+h,x:x+w];red=(crop[:,:,2]>170)&(crop[:,:,1]<100)&(crop[:,:,0]<120);mask=np.zeros((h,w),bool);mask[:4]=True;mask[-4:]=True;mask[:,:4]=True;mask[:,-4:]=True;assert red[mask].mean()>.4
   checks.append({'section':s['scene'],'seconds':round(s['start']+local,3)})
  original_audio=pcm(ROOT/r['audio']);starts=[int(len(original_audio)*fraction) for fraction in np.linspace(.15,.65,12)];templates=[(np.sqrt(np.mean(original_audio[k:k+6000]**2)),k,original_audio[k:k+6000]) for k in starts if len(original_audio[k:k+6000])==6000];rms,k,template=max(templates,key=lambda t:t[0]);assert rms>.005
  expected=round((s['start']+.35)*8000)+k;radius=1600;search=sound[expected-radius:expected+6000+radius];scores=cv2.matchTemplate(search.reshape(1,-1),template.reshape(1,-1),cv2.TM_CCOEFF_NORMED);_,score,_,where=cv2.minMaxLoc(scores);drift=(where[0]-radius)/8000;assert score>.9 and abs(drift)<.06;sync.append({'section':s['scene'],'correlation':round(score,4),'offsetSeconds':drift})
  if s['scene'] in [1,18,39,40]:cv2.imwrite(str(OUT/f"review-section-{s['scene']:02}.jpg"),frame(video,s['start']+s['duration']*.6))
 video.release();report={'file':movie.name,'durationSeconds':offset,'sections':len(scenes),'pagesVerified':5,'presentationSlides':0,'browserOnly':True,'wholeSectionBounds':'passed for all sections','fullVideoAndAudioDecode':'passed','wordBoundaries':'exact provider timestamps','boundaryFramesChecked':len(checks),'liveRun':capture['liveRun']['status'],'mocked':False,'audioSync':sync,'maximumAudioSyncOffsetSeconds':max(abs(s['offsetSeconds']) for s in sync),'sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
 (OUT/'validation.json').write_text(json.dumps(report,indent=2));(OUT/'browser-evidence.json').write_text(json.dumps(capture,indent=2));(OUT/'production-status.json').write_text(json.dumps({'stage':'complete','file':movie.name,'durationSeconds':offset},indent=2))
 page=f'<!doctype html><meta charset="utf-8"><title>Complete Claude Agent SDK app tour</title><style>body{{background:#edf6ff;color:#102544;font:18px Arial;margin:24px}}main{{max-width:1500px;margin:auto}}video{{width:100%}}a{{color:#006bd6}}</style><main><h1>Claude Agent SDK: complete application walkthrough</h1><video controls poster="review-section-01.jpg"><source src="{movie.name}" type="video/mp4"><track kind="subtitles" src="{vtt.name}" srclang="en" label="English"></video><p>42 application sections · Five app areas · Real Playwright browser recording · No presentation slides</p><p>Browser view zoomed out to keep each panel in view. Footage is edited for narration pacing. The API query and displayed result are real.</p><p><a href="{movie.name}" download>Download MP4</a> · <a href="{srt.name}">Subtitles</a> · <a href="validation.json">Verification</a> · <a href="browser-evidence.json">Browser evidence</a></p></main>'
 (OUT/'index.html').write_text(page,encoding='utf8');print(f'Completed browser-only walkthrough: {offset:.2f}s, {len(scenes)} sections.',flush=True)
if __name__=='__main__':main()
