"""Preserve the approved 88s trailer and append one narrated 18s course card."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,html,importlib.util,json,re,shutil,subprocess,textwrap,wave
import cv2,numpy as np
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-udemy-promo-extended-v2';OLD='agent-sdk-udemy-promo-88s-v1'
P=ROOT/'presentations'/NAME;OUT=ROOT/'videos'/NAME;BUILD=P/'.build/video';SOURCE=ROOT/'videos'/OLD
PREFIX='Claude-Agent-SDK-Udemy-Promo-Extended-v2'
def module(file,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj);return obj
helpers=module('build-sdk-udemy-promo.py','promo_helpers');run=helpers.run;frame=helpers.frame;pcm=helpers.pcm;stamp=helpers.stamp;encoder=helpers.encoder;FF=helpers.FF
def status(stage,**extra):
 (OUT/'production-status.json').write_text(json.dumps({'stage':stage,'updated':datetime.now(timezone.utc).isoformat(),**extra},indent=2));print(stage,flush=True)
def main():
 status('preflight');plan=json.loads((OUT/'narration-plan.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text());record=manifest['recordings'][0];geometry=json.loads((BUILD/'slides/geometry.json').read_text())[0]
 before=json.loads((SOURCE/'validation.json').read_text());original=SOURCE/before['file'];original_sha=hashlib.sha256(original.read_bytes()).hexdigest();assert before['durationSeconds']==88 and before['sha256']==original_sha
 assert plan['presentationSha256']==manifest['presentationSha256']==hashlib.sha256((ROOT/plan['presentation']).read_bytes()).hexdigest();assert record['duration']<17.2
 recorder=module('record-presentation-video.py','recorder');meta=json.loads((ROOT/record['audio']).with_suffix('.json').read_text());assert recorder.align(plan['slides'][0]['segments'],meta['timestampInfo'])==record['cues'];assert hashlib.sha256((ROOT/record['audio']).read_bytes()).hexdigest()==record['sha256']
 status('rendering');image=cv2.imread(str(BUILD/'slides/slide-01.png'));cues=[];filters=[]
 for c in record['cues']:
  fits=fit_highlights(c['target'],geometry,image)
  for f in fits:
   x,y,w,h=f['rect'];filters.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xff2424:t=4:enable='between(t,{.2+c['start']:.6f},{.2+c['end']:.6f})'")
  cues.append({**c,'start':88.6+c['start'],'end':88.6+c['end'],'rects':[f['rect'] for f in fits],'textFits':fits})
 card=BUILD/'endcard.mp4';run(['-y','-loop','1','-framerate','30','-i',BUILD/'slides/slide-01.png','-vf',','.join(filters),'-t','17.6',*encoder(card)])
 video=cv2.VideoCapture(str(original));last=frame(video,88-1/30);video.release();renderer=module('render-presentation-video.py','renderer');turn=BUILD/'endcard-cube.mp4'
 p=subprocess.Popen([FF,'-v','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size','1920x1080','-framerate','30','-i','pipe:0',*map(str,encoder(turn))],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 for i in range(12):p.stdin.write(renderer.cube_frame(last,image,i/11).tobytes())
 p.stdin.close();error=p.stderr.read();p.wait();assert p.returncode==0,error
 picture=BUILD/'approved-promo-picture.mp4';run(['-y','-i',original,'-map','0:v:0','-an','-sn','-map_chapters','-1','-c:v','copy','-video_track_timescale','15360',picture])
 concat=BUILD/'concat.txt';concat.write_text('\n'.join("file '"+f.as_posix()+"'" for f in [picture,turn,card]),encoding='utf8')
 soundtrack=BUILD/'soundtrack.wav'
 with wave.open(str(soundtrack),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000)
  with wave.open(str(ROOT/'presentations'/OLD/'.build/video/soundtrack.wav'),'rb') as old:
   assert (old.getnchannels(),old.getsampwidth(),old.getframerate(),old.getnframes())==(2,2,48000,88*48000);w.writeframes(old.readframes(old.getnframes()))
  audio=run(['-i',ROOT/record['audio'],'-f','s16le','-ac','2','-ar','48000','pipe:1'],True);lead=round(.6*48000)*4;tail=18*48000*4-lead-len(audio);assert tail>=0;w.writeframes(b'\0'*lead+audio+b'\0'*tail)
 old_timeline=json.loads((SOURCE/'timeline.json').read_text());all_cues=old_timeline['cues']+cues;sections=old_timeline['sections']+[{'slide':7,'start':88,'duration':18,'title':'Separate Udemy course: Claude Managed Agents'}]
 srt=OUT/(PREFIX+'.srt');srt.write_text('\n'.join(f'{i}\n{stamp(c["start"])} --> {stamp(c["end"])}\n'+'\n'.join(textwrap.wrap(c['text'],85))+'\n' for i,c in enumerate(all_cues,1)),encoding='utf8');vtt=OUT/(PREFIX+'.vtt');vtt.write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt.read_text(encoding='utf8')),encoding='utf8')
 chapters=[';FFMETADATA1','title=Claude Agent SDK - Extended Course Promo','artist=Luis Coco Enriquez']
 for s in sections:chapters+=['[CHAPTER]','TIMEBASE=1/1000',f'START={s["start"]*1000}',f'END={(s["start"]+s["duration"])*1000}','title='+s['title']]
 (BUILD/'chapters.txt').write_text('\n'.join(chapters),encoding='utf8');movie=OUT/(PREFIX+'.mp4')
 run(['-y','-f','concat','-safe','0','-i',concat,'-i',soundtrack,'-f','ffmetadata','-i',BUILD/'chapters.txt','-i',srt,'-map','0:v:0','-map','1:a:0','-map','3:0','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-c:s','mov_text','-metadata:s:s:0','language=eng','-movflags','+faststart',movie])
 status('verifying');run(['-i',movie,'-map','0:v:0','-map','0:a:0','-f','null','-']);cap=cv2.VideoCapture(str(movie));assert (cap.get(3),cap.get(4))==(1920,1080) and abs(cap.get(5)-30)<.001 and cap.get(7)==3180
 info=subprocess.run([FF,'-hide_banner','-i',str(movie)],capture_output=True).stderr.decode(errors='replace');assert all(s in info for s in ['h264','aac','48000 Hz','mov_text']);assert len(re.findall(r'Chapter #0:\d+:',info))==7
 prior=cv2.VideoCapture(str(original));differences=[]
 for t in [1,10,30,50,70,82.5,87.9]:
  diff=float(np.mean(cv2.absdiff(frame(prior,t),frame(cap,t))));assert diff<.01,(t,diff);differences.append(diff)
 prior.release();checks=[]
 for c in all_cues:
  for t in [c['start']+.1,c['end']-.1]:
   f=frame(cap,t)
   for x,y,w,h in c['rects']:
    crop=f[y:y+h,x:x+w];red=(crop[:,:,2]>170)&(crop[:,:,1]<100)&(crop[:,:,0]<120);score=float(red[helpers.border([x,y,w,h])].mean());assert score>.4,(c['id'],t,score)
   checks.append({'cue':c['id'],'seconds':round(t,3)})
 for c in cues:
  for fit in c['textFits']:
   x,y,w,h=fit['rect'];ix,iy,iw,ih=fit['textInkRect'];assert (ix-x,iy-y,x+w-ix-iw,y+h-iy-ih)==(8,8,8,8)
 sound=pcm(movie);sync=[]
 for source,shift in [(original,0),(ROOT/record['audio'],88.6)]:
  raw=pcm(source)
  for fraction in [.15,.5,.8]:
   candidates=[]
   for pos in np.linspace(max(0,len(raw)*fraction-4000),min(len(raw)-6000,len(raw)*fraction+4000),9):
    pos=round(pos);sample=raw[pos:pos+6000];candidates.append((float(np.sqrt(np.mean(sample**2))),pos,sample))
   rms,pos,template=max(candidates,key=lambda x:x[0]);assert rms>.005;expected=round(shift*8000)+pos;radius=800;search=sound[expected-radius:expected+6000+radius].copy();scores=cv2.matchTemplate(search.reshape(1,-1),template.copy().reshape(1,-1),cv2.TM_CCOEFF_NORMED);_,score,_,location=cv2.minMaxLoc(scores);drift=(location[0]-radius)/8000;assert score>.9 and abs(drift)<.06;sync.append({'part':source.name,'correlation':round(score,5),'offsetSeconds':drift})
 assert float(np.mean(cv2.absdiff(frame(cap,88),frame(cap,88.2))))>3
 cv2.imwrite(str(OUT/'endcard-preview.jpg'),frame(cap,(cues[2]['start']+cues[2]['end'])/2));shutil.copy2(BUILD/'slides/slide-01.png',OUT/'course-promotion.png');shutil.copy2(SOURCE/'review-section-01.jpg',OUT/'cover-preview.jpg');cap.release();assert hashlib.sha256(original.read_bytes()).hexdigest()==original_sha
 report={'file':movie.name,'durationSeconds':106,'originalPromoPreservedSeconds':88,'appendStartsAtSeconds':88,'addedSlideSeconds':18,'separateCourse':'Claude Managed Agents','conceptLessons':60,'practicalApplications':60,'platformLabs':75,'fullVideoAndAudioDecode':'passed','preservedVideoFrameSamples':len(differences),'maximumFrameDifference':max(differences),'wordAlignedCues':len(all_cues),'highlightBoundaryFramesChecked':len(checks),'audioSync':sync,'maximumAudioOffsetSeconds':max(abs(s['offsetSeconds']) for s in sync),'originalFileSha256':original_sha,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
 (OUT/'validation.json').write_text(json.dumps(report,indent=2));(OUT/'timeline.json').write_text(json.dumps({'duration':106,'sections':sections,'cues':all_cues},indent=2))
 page=f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claude Agent SDK · Extended Promo</title><style>body{{font:18px Arial;color:#090d3b;background:#edf6ff;margin:24px}}main{{max-width:1400px;margin:auto}}video,img{{width:100%}}a{{color:#087fff}}p{{line-height:1.5}}</style><main><h1>Claude Agent SDK: extended course promo</h1><video controls preload="metadata" poster="cover-preview.jpg"><source src="{movie.name}" type="video/mp4"><track kind="subtitles" src="{vtt.name}" srclang="en" label="English"></video><p>1:46 · Approved 88-second promo followed by a narrated slide for the separate Claude Managed Agents course.</p><p><a href="{movie.name}" download>Download MP4</a> · <a href="course-promotion.png">Promotional slide image</a> · <a href="{srt.name}">Subtitles</a> · <a href="validation.json">Verification</a></p><button onclick="document.querySelector('video').currentTime=88;document.querySelector('video').play()">Jump to added course promotion</button><p>60 concept lessons · 60 practical example applications · Learning platform with 75 labs</p><img src="course-promotion.png" alt="Claude Managed Agents separate course: 60 concept lessons, 60 practical applications, 75 labs"></main>'''
 (OUT/'index.html').write_text(page,encoding='utf8');status('complete',file=movie.name,durationSeconds=106,sha256=report['sha256'])
if __name__=='__main__':
 try:main()
 except Exception as e:status('needs_review',error=str(e));raise
