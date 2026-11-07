"""Assemble and verify an SDK Bonus Lecture with the full supplied platform tour."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,html,importlib.util,json,math,re,subprocess,textwrap,wave,sys
import cv2,numpy as np
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-bonus-course'
P=ROOT/'presentations'/NAME;OUT=ROOT/'videos'/NAME;B=P/'.build/video';SL=B/'slides'
REF=Path(r'C:\Users\luis.coco\Downloads\learning-platform-overview-lesson-1.mp4')
PREFIX='Claude-Agent-SDK-Bonus-Lecture';FPS=30;TURN=.8;LEAD=.6
def module(file,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
H=module('build-sdk-udemy-promo.py','helpers');R=module('render-presentation-video.py','renderer');REC=module('record-presentation-video.py','recorder')
FF=H.FF;VERIFY_ONLY='--verify-only' in sys.argv;COVER_ONLY='--cover-only' in sys.argv
def run(args,output=False):
 if VERIFY_ONLY and '-y' in args:
  assert Path(args[-1]).is_file(),args[-1]
  return None
 if COVER_ONLY and '-y' in args and Path(args[-1]).name in ['reference-normalized.mp4','new-section-2.mp4','new-section-3.mp4']:
  assert Path(args[-1]).is_file(),args[-1]
  return None
 return H.run(args,output)
def pcm(file):
 # Rebase decoded samples before 8 kHz comparison. The supplied recording
 # has irregular packet timestamps which otherwise round to duplicate DTS.
 return np.frombuffer(run(['-i',file,'-vn','-sn','-af','aresample=8000,asetpts=N/SR/TB','-f','f32le','-ac','1','-ar','8000','pipe:1'],True),dtype=np.float32)
def status(stage,**extra):
 (OUT/'production-status.json').write_text(json.dumps({'stage':stage,'updated':datetime.now(timezone.utc).isoformat(),**extra},indent=2));print(stage,flush=True)
def cube(a,b,file):
 if VERIFY_ONLY or (COVER_ONLY and file.name!='turn-01.mp4'):
  assert file.is_file();return
 proc=subprocess.Popen([FF,'-v','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size','1920x1080','-framerate','30','-i','pipe:0',*map(str,H.encoder(file))],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 for i in range(24):proc.stdin.write(R.cube_frame(a,b,i/23).tobytes())
 proc.stdin.close();err=proc.stderr.read();proc.wait();assert proc.returncode==0,err
def main():
 status('preflight');plan=json.loads((OUT/'narration-plan.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text());g=json.loads((SL/'geometry.json').read_text());records=manifest['recordings'];original_sha=hashlib.sha256(REF.read_bytes()).hexdigest()
 assert plan['presentationSha256']==manifest['presentationSha256']==hashlib.sha256((ROOT/plan['presentation']).read_bytes()).hexdigest()
 parts=[];cues=[];sections=[];audio_parts=[];clock=0;images=[];checks=[]
 ref_pcm=run(['-i',REF,'-vn','-sn','-f','s16le','-ac','2','-ar','48000','pipe:1'],True)
 cap=cv2.VideoCapture(str(REF));ref_seconds=max(cap.get(7)/cap.get(5),len(ref_pcm)/192000);ref_duration=math.ceil(ref_seconds*30)/30
 ref_first=H.frame(cap,0);ref_last=H.frame(cap,cap.get(7)/cap.get(5)-.1);cap.release()
 def add_turn(a,b):
  nonlocal clock
  file=B/f'turn-{len(parts):02}.mp4';cube(a,b,file);parts.append(file);audio_parts.append(b'\0'*round(TURN*48000)*4);clock+=TURN
 for i,(row,record) in enumerate(zip(plan['slides'],records)):
  if i==2:
   add_turn(images[-1],ref_first);status('rendering_reference_tour')
   reference=B/'reference-normalized.mp4'
   run(['-y','-i',REF,'-map','0:v:0','-vf','fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=1','-frames:v',round(ref_duration*30),*H.encoder(reference)])
   ref_start=clock;sections.append({'title':'Learning platform — complete supplied tour','start':clock,'duration':ref_duration,'originalNarration':True});parts.append(reference)
   pad=round(ref_duration*48000)*4-len(ref_pcm);assert pad>=0;audio_parts.append(ref_pcm+b'\0'*pad);clock+=ref_duration
   add_turn(ref_last,cv2.imread(str(SL/'slide-03.png')))
  elif i==1:add_turn(images[-1],cv2.imread(str(SL/'slide-02.png')))
  image=cv2.imread(str(SL/f'slide-{i+1:02}.png'));images.append(image)
  assert record['sha256']==hashlib.sha256((ROOT/record['audio']).read_bytes()).hexdigest()
  meta=json.loads((ROOT/record['audio']).with_suffix('.json').read_text());assert REC.align(row['segments'],meta['timestampInfo'])==record['cues']
  dur=math.ceil((LEAD+record['duration']+.8)*30)/30;filters=[]
  for c in record['cues']:
   fits=fit_highlights(c['target'],g[i],image)
   for fit in fits:
    x,y,w,h=fit['rect'];assert x>=0 and y>=0 and x+w<=1920 and y+h<=1080
    filters.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xff2424:t=4:enable='between(t,{LEAD+c['start']:.6f},{LEAD+c['end']:.6f})'")
   cues.append({**c,'start':clock+LEAD+c['start'],'end':clock+LEAD+c['end'],'rects':[f['rect'] for f in fits],'textFits':fits})
  file=B/f'new-section-{i+1}.mp4';status('rendering_new_section',section=i+1)
  run(['-y','-loop','1','-framerate','30','-i',SL/f'slide-{i+1:02}.png','-vf',','.join(filters),'-frames:v',round(dur*30),*H.encoder(file)]);parts.append(file)
  raw=run(['-i',ROOT/record['audio'],'-f','s16le','-ac','2','-ar','48000','pipe:1'],True);lead=b'\0'*round(LEAD*48000)*4;tail=round(dur*48000)*4-len(lead)-len(raw);assert tail>=0;audio_parts.append(lead+raw+b'\0'*tail)
  sections.append({'title':['Continue with Claude Agent SDK','Concepts, applications and 75 labs','Bonus Lecture coupon resources'][i],'start':clock,'duration':dur,'recording':i+1});clock+=dur
 duration=round(clock*30)/30
 concat=B/'concat.txt';concat.write_text('\n'.join("file '"+p.as_posix()+"'" for p in parts),encoding='utf8')
 sound=B/'soundtrack.wav'
 with wave.open(str(sound),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(b''.join(audio_parts))
 srt=OUT/(PREFIX+'-new-sections.srt');srt.write_text('\n'.join(f'{i}\n{H.stamp(c["start"])} --> {H.stamp(c["end"])}\n'+'\n'.join(textwrap.wrap(c['text'],85))+'\n' for i,c in enumerate(cues,1)),encoding='utf8')
 vtt=OUT/(PREFIX+'-new-sections.vtt');vtt.write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt.read_text(encoding='utf8')),encoding='utf8')
 chapters=[';FFMETADATA1','title=Bonus Lecture - Claude Agent SDK','artist=Luis Coco Enriquez']
 for s in sections:chapters+=['[CHAPTER]','TIMEBASE=1/1000',f'START={round(s["start"]*1000)}',f'END={round((s["start"]+s["duration"])*1000)}','title='+s['title']]
 (B/'chapters.txt').write_text('\n'.join(chapters),encoding='utf8');movie=OUT/(PREFIX+'.mp4');status('assembling')
 run(['-y','-f','concat','-safe','0','-i',concat,'-i',sound,'-f','ffmetadata','-i',B/'chapters.txt','-i',srt,'-map','0:v:0','-map','1:a:0','-map','3:0','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-c:s','mov_text','-metadata:s:s:0','language=eng','-metadata:s:s:0','title=New introduction and closing only','-movflags','+faststart',movie])
 status('verifying');run(['-i',movie,'-map','0:v:0','-map','0:a:0','-f','null','-'])
 cap=cv2.VideoCapture(str(movie));assert (cap.get(3),cap.get(4),cap.get(5))==(1920,1080,30);assert cap.get(7)==round(duration*30),(cap.get(7),duration)
 for c in cues:
  for t in [c['start']+.1,c['end']-.1]:
   f=H.frame(cap,t)
   for rect in c['rects']:
    x,y,w,h=rect;crop=f[y:y+h,x:x+w];red=(crop[:,:,2]>170)&(crop[:,:,1]<100)&(crop[:,:,0]<120);assert red[H.border(rect)].mean()>.4,(c['id'],t)
   checks.append({'cue':c['id'],'time':t})
 for i,s in enumerate(sections):cv2.imwrite(str(OUT/f'review-section-{i+1}.jpg'),H.frame(cap,s['start']+min(3,s['duration']/2)))
 for s in sections[:-1]:
  t=s['start']+s['duration'];assert float(np.mean(cv2.absdiff(H.frame(cap,t+.03),H.frame(cap,t+.4))))>3,'Static cube transition'
 # Check the retained tour's framing and original narration at separated points.
 original=cv2.VideoCapture(str(REF));differences=[]
 for t in [7,38,75,112,150]:
  diff=float(np.mean(cv2.absdiff(H.frame(original,t),H.frame(cap,ref_start+t))));assert diff<3,(t,diff);differences.append(diff)
 original.release();cap.release();final_audio=pcm(movie);sync=[]
 for file,offset in [(REF,ref_start)]+[(ROOT/records[s['recording']-1]['audio'],s['start']+LEAD) for s in sections if 'recording' in s]:
  raw=pcm(file)
  for fraction in [.2,.5,.8]:
   candidates=[]
   for pos in np.linspace(max(0,len(raw)*(fraction-.12)),min(len(raw)-6000,len(raw)*(fraction+.12)),31):
    pos=round(pos);sample=raw[pos:pos+6000];candidates.append((float(np.sqrt(np.mean(sample**2))),pos,sample))
   rms,pos,template=max(candidates,key=lambda x:x[0]);assert rms>.004,(file.name,fraction,rms)
   expected=round(offset*8000)+pos;radius=800;search=final_audio[expected-radius:expected+6000+radius].copy()
   scores=cv2.matchTemplate(search.reshape(1,-1),template.copy().reshape(1,-1),cv2.TM_CCOEFF_NORMED);_,score,_,location=cv2.minMaxLoc(scores);drift=(location[0]-radius)/8000
   assert score>.9 and abs(drift)<.06,(file.name,score,drift);sync.append({'source':file.name,'correlation':score,'offsetSeconds':drift})
 metadata=subprocess.run([FF,'-hide_banner','-i',str(movie)],capture_output=True).stderr.decode(errors='replace');assert all(k in metadata for k in ['h264','aac','48000 Hz','mov_text']);assert len(re.findall(r'Chapter #0:\d+:',metadata))==4
 assert hashlib.sha256(REF.read_bytes()).hexdigest()==original_sha
 report={'file':movie.name,'durationSeconds':duration,'resolution':[1920,1080],'fps':30,'fullVideoAndAudioDecode':'passed','cubeTransitions':3,'newWordAlignedCues':len(cues),'highlightBoundaryFramesChecked':len(checks),'referenceTour':'Full supplied video, full-screen, with original narration','referenceTourStart':ref_start,'referenceTourDuration':ref_duration,'maximumReferenceFrameDifference':max(differences),'audioSync':sync,'couponStatus':'No coupon supplied; conditional wording; attach actual coupon and terms before publishing','subtitles':'New introduction and closing only; source tour has no supplied transcript','referenceSha256':original_sha,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
 (OUT/'validation.json').write_text(json.dumps(report,indent=2));(OUT/'timeline.json').write_text(json.dumps({'duration':duration,'sections':sections,'cues':cues},indent=2));shutil_copy=__import__('shutil').copy2;shutil_copy(SL/'slide-01.png',OUT/'cover.png')
 page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bonus Lecture · Claude Agent SDK</title><style>body{{background:#081c36;color:white;font:18px Arial;margin:28px}}main{{max-width:1400px;margin:auto}}video{{width:100%}}a{{color:#ffad72}}p{{line-height:1.6}}</style><main><h1>Bonus Lecture · Claude Agent SDK</h1><video controls preload="metadata" poster="cover.png"><source src="{movie.name}" type="video/mp4"><track kind="subtitles" src="{vtt.name}" srclang="en" label="New introduction and closing only"></video><p>{math.floor(duration/60)}:{round(duration%60):02} · 1080p · Original full-screen platform tour + new Inworld Yash introduction and closing · Cube transitions</p><p><a href="{movie.name}" download>Download MP4</a> · <a href="publication-notes.txt">Publishing and coupon notes</a> · <a href="validation.json">Verification</a></p><p>No actual coupon was supplied. Before publishing, attach the real coupon link and its expiry/redemption terms to the final Bonus Lecture. New subtitles cover only the newly narrated sections.</p><p>Udemy: <a href="https://support.udemy.com/hc/en-us/sections/360001151954-Marketing-Tools">Bonus Lecture policy</a> · <a href="https://support.udemy.com/hc/en-us/sections/206458388-Pricing-coupons">Coupon rules</a></p></main></html>'''
 (OUT/'index.html').write_text(page,encoding='utf8');status('complete',file=movie.name,durationSeconds=duration)
if __name__=='__main__':
 try:main()
 except Exception as e:status('needs_review',error=str(e));raise
