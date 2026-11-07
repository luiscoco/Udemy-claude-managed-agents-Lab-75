"""Visual-only promo revision: large app close-ups and the supplied platform image."""
from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
import hashlib,html,importlib.util,json,re,shutil,subprocess
import cv2,numpy as np
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-udemy-promo-zoom-v3';OLD='agent-sdk-udemy-promo-extended-v2'
P=ROOT/'presentations'/NAME;OUT=ROOT/'videos'/NAME;BUILD=P/'.build/video';SHOTS=BUILD/'shots';SOURCE=ROOT/'videos'/OLD;PREFIX='Claude-Agent-SDK-Udemy-Promo-Zoomed-v3'
def module(file,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
helpers=module('build-sdk-udemy-promo.py','helpers');run=helpers.run;frame=helpers.frame;FF=helpers.FF;encoder=helpers.encoder
def status(stage,**extra):
 (OUT/'production-status.json').write_text(json.dumps({'stage':stage,'updated':datetime.now(timezone.utc).isoformat(),**extra},indent=2));print(stage,flush=True)
def packet_hash(file,stream):return run(['-i',file,'-map',stream,'-c','copy','-f','hash','-hash','sha256','pipe:1'],True).decode().strip()
def main():
 status('preflight');spec=json.loads((P/'visual-spec.json').read_text());geometry=json.loads((SHOTS/'geometry.json').read_text());old=json.loads((SOURCE/'validation.json').read_text());source=SOURCE/old['file'];original_sha=hashlib.sha256(source.read_bytes()).hexdigest();assert original_sha==old['sha256']
 old_timeline=json.loads((SOURCE/'timeline.json').read_text());original_cues={c['id']:c for c in old_timeline['cues']};updated={};raw=ROOT/'presentations/agent-sdk-complete-browser-tour-v3/capture/complete-browser-recording.webm';tour=json.loads((ROOT/'videos/agent-sdk-complete-browser-tour-v3/timeline.json').read_text())
 # Each selected crop encloses complete controls or the complete result group.
 for name,f in spec['focus'].items():
  x,y,w,h=f['crop'];dx,dy,dw,dh=f['displayRect'];assert 0<=x<x+w<=1920 and 0<=y<y+h<=1080 and dx>=0 and dy>=170 and dx+dw<=1920 and dy+dh<=1000
  assert abs(dw/dh-w/h)<.01 and f['scaleFromCapture']>1.5
 status('rendering')
 def render(shot):
  image=cv2.imread(str(SHOTS/(shot['id']+'.png')));g=next(r for r in geometry if r['id']==shot['id']);filters=[];cues=[];duration=shot['end']-shot['start']
  for cid in shot['cues']:
   oldcue=original_cues[cid];box=next(b for b in g['rects'] if b['id']==cid);target={'textRects':[box['rect']],'paragraphGroups':[[0]]};fits=fit_highlights(target,g,image)
   assert shot['start']<=oldcue['start']<oldcue['end']<=shot['end']
   for f in fits:
    x,y,w,h=f['rect'];filters.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xff2424:t=4:enable='between(t,{oldcue['start']-shot['start']:.6f},{oldcue['end']-shot['start']:.6f})'")
   cues.append({**oldcue,'target':target,'rects':[f['rect'] for f in fits],'textFits':fits})
  file=BUILD/(shot['id']+'.mp4');identity=hashlib.sha256(image.tobytes()+json.dumps({'shot':shot,'focus':spec['focus'],'cues':cues},sort_keys=True).encode()).hexdigest();marker=file.with_suffix('.sha256')
  if not(file.exists() and marker.exists() and marker.read_text()==identity):
   args=['-y','-loop','1','-framerate','30','-i',SHOTS/(shot['id']+'.png')]
   if shot.get('focus'):
    f=spec['focus'][shot['focus']];source_scene=tour['scenes'][f['sourceScene']-1];s=source_scene['source'];seconds=s['seconds'] if shot['id']=='benefit-input' else min(.8,s['seconds']);x,y,w,h=f['crop'];dx,dy,dw,dh=f['displayRect']
    chain=f'[1:v]crop={w}:{h}:{x}:{y},scale={dw}:{dh}:flags=lanczos,setpts=(PTS-STARTPTS)*{duration/seconds:.12f},fps=30,tpad=stop_mode=clone:stop_duration=1[app];[0:v][app]overlay={dx}:{dy}:shortest=1,'+','.join(filters)+'[v]'
    args+=['-ss',s['start'],'-t',seconds,'-i',raw,'-filter_complex',chain,'-map','[v]']
   else:args+=['-vf',','.join(filters)]
   run([*args,'-t',f'{duration:.9f}',*encoder(file)]);marker.write_text(identity)
  print('Rendered close-up:',shot['id'],flush=True);return {'shot':shot,'file':file,'cues':cues}
 with ThreadPoolExecutor(max_workers=2) as pool:rendered=list(pool.map(render,spec['shots']))
 for r in rendered:
  for c in r['cues']:updated[c['id']]=c
 by_id={r['shot']['id']:r for r in rendered}
 # Decode and trim to exact frame counts; stream-copy trimming can retain two
 # future reference frames at a B-frame boundary. Use CRF 16 for retained shots.
 def retained(name,start,duration):
  file=BUILD/(name+'.mp4');enc=encoder(file);enc[enc.index('-crf')+1]='16'
  run(['-y','-ss',start,'-i',source,'-map','0:v:0','-sn','-map_chapters','-1','-vf',f'trim=end_frame={round(duration*30)},setpts=PTS-STARTPTS','-frames:v',round(duration*30),*enc])
  cap=cv2.VideoCapture(str(file));assert cap.get(7)==round(duration*30),(name,cap.get(7),duration);cap.release();return file
 cover=retained('retained-cover',0,3);middle=retained('retained-topics-learner-cta',43.4,44.6)
 renderer=module('render-presentation-video.py','renderer')
 def turn(name,previous,following):
  a=cv2.VideoCapture(str(previous));af=frame(a,(a.get(7)-1)/a.get(5));a.release();b=cv2.VideoCapture(str(following));bf=frame(b,0);b.release();dest=BUILD/(name+'.mp4')
  p=subprocess.Popen([FF,'-v','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size','1920x1080','-framerate','30','-i','pipe:0',*map(str,encoder(dest))],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
  for k in range(12):p.stdin.write(renderer.cube_frame(af,bf,k/11).tobytes())
  p.stdin.close();error=p.stderr.read();p.wait();assert p.returncode==0,error;return dest
 intro=by_id['instructor']['file'];input1=by_id['welcome-input']['file'];result1=by_id['welcome-result']['file'];input2=by_id['benefit-input']['file'];result2=by_id['benefit-result']['file'];settings=by_id['benefit-settings']['file'];platform=by_id['platform']['file']
 pieces=[cover,turn('cube-intro',cover,intro),intro,input1,result1,turn('cube-benefits',result1,input2),input2,result2,settings,turn('cube-topics',settings,middle),middle,turn('cube-platform',middle,platform),platform]
 (BUILD/'concat.txt').write_text('\n'.join("file '"+f.as_posix()+"'" for f in pieces),encoding='utf8');movie=OUT/(PREFIX+'.mp4')
 # Keep the exact AAC narration and subtitle packets from the approved version.
 run(['-y','-f','concat','-safe','0','-i',BUILD/'concat.txt','-i',source,'-map','0:v:0','-map','1:a:0','-map','1:s:0','-map_metadata','1','-map_chapters','1','-c:v','copy','-c:a','copy','-c:s','copy','-movflags','+faststart',movie])
 cues=[updated.get(c['id'],c) for c in old_timeline['cues']];(OUT/'timeline.json').write_text(json.dumps({**old_timeline,'cues':cues,'visualShots':spec['shots'],'focus':spec['focus']},indent=2))
 for suffix in ['srt','vtt']:shutil.copy2(SOURCE/f'Claude-Agent-SDK-Udemy-Promo-Extended-v2.{suffix}',OUT/f'{PREFIX}.{suffix}')
 status('verifying');run(['-i',movie,'-map','0:v:0','-map','0:a:0','-f','null','-']);cap=cv2.VideoCapture(str(movie));assert (cap.get(3),cap.get(4))==(1920,1080) and abs(cap.get(5)-30)<.001 and cap.get(7)==3180,(cap.get(5),cap.get(7))
 assert packet_hash(source,'0:a:0')==packet_hash(movie,'0:a:0'),'Narration must remain byte-identical'
 assert packet_hash(source,'0:s:0')==packet_hash(movie,'0:s:0'),'Caption timing must remain byte-identical'
 checks=[]
 for c in cues:
  for t in [c['start']+.1,c['end']-.1]:
   f=frame(cap,t)
   for x,y,w,h in c['rects']:
    crop=f[y:y+h,x:x+w];red=(crop[:,:,2]>170)&(crop[:,:,1]<100)&(crop[:,:,0]<120);assert float(red[helpers.border([x,y,w,h])].mean())>.4,(c['id'],t)
   checks.append({'cue':c['id'],'seconds':round(t,3)})
 unchanged=cv2.VideoCapture(str(source));preserved=[]
 for t in [1,48,60,68,76,82,87]:
  difference=float(np.mean(cv2.absdiff(frame(cap,t),frame(unchanged,t))));assert difference<2,(t,difference);preserved.append(difference)
 unchanged.release()
 # Check each app view against its measured, complete source region.
 bounds=[]
 for shot in spec['shots']:
  if not shot.get('focus'):continue
  f=spec['focus'][shot['focus']];dx,dy,dw,dh=f['displayRect'];assert dw>=1100 and dh>=400
  bounds.append({'shot':shot['id'],'sourceCrop':f['crop'],'displayRect':f['displayRect'],'scaleFromNativeScreenshot':f['scaleFromCapture'],'largerThanPriorBenefitsInset':round(f['scaleFromCapture']/.625,2),'completeControls':f['completeControls']})
 for name,t in [('instructor',5),('app-input',26),('app-result',31),('app-settings',37),('platform',96)]:cv2.imwrite(str(OUT/('review-'+name+'.jpg')),frame(cap,t))
 cap.release();shutil.copy2(SHOTS/'platform.png',OUT/'course-platform-slide.png');shutil.copy2(SOURCE/'cover-preview.jpg',OUT/'cover-preview.jpg');assert hashlib.sha256(source.read_bytes()).hexdigest()==original_sha
 report={'file':movie.name,'durationSeconds':106,'resolution':[1920,1080],'fps':30,'fullVideoAndAudioDecode':'passed','narrationAacPackets':'byte-identical to approved version','subtitlePackets':'byte-identical to approved version','highlightBoundaryFramesChecked':len(checks),'retainedFrameSamples':len(preserved),'maximumRetainedFrameDifference':max(preserved),'appCloseups':bounds,'platformImageSha256':hashlib.sha256((P/'learning-platform.png').read_bytes()).hexdigest(),'platformImageUnmodified':True,'courseTitleOverlay':'Claude Managed Agents','sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
 (OUT/'validation.json').write_text(json.dumps(report,indent=2))
 page=f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claude Agent SDK · Enlarged app promo</title><style>body{{font:18px Arial;color:#090d3b;background:#edf6ff;margin:24px}}main{{max-width:1500px;margin:auto}}video,img{{width:100%}}a{{color:#087fff}}p{{line-height:1.5}}</style><main><h1>Claude Agent SDK: enlarged application promo</h1><video controls preload="metadata" poster="cover-preview.jpg"><source src="{movie.name}" type="video/mp4"><track kind="subtitles" src="{PREFIX}.vtt" srclang="en" label="English"></video><p>1:46 · Full-screen app close-ups · Original narration and timing · Supplied learning-platform image with the course title overlaid</p><p><a href="{movie.name}" download>Download MP4</a> · <a href="course-platform-slide.png">Platform promotion slide</a> · <a href="validation.json">Verification</a></p><button onclick="document.querySelector('video').currentTime=23;document.querySelector('video').play()">Show enlarged application</button> <button onclick="document.querySelector('video').currentTime=88;document.querySelector('video').play()">Show final platform slide</button><p>Close-ups preserve complete prompt and Run controls, the complete answer and result summary, and the run settings. App footage is edited for promotional pacing.</p><img src="course-platform-slide.png" alt="Supplied learning platform image with Claude Managed Agents course title and 60 concept lessons, 60 practical applications, 75 labs"></main>'''
 (OUT/'index.html').write_text(page,encoding='utf8');status('complete',file=movie.name,durationSeconds=106,sha256=report['sha256'])
if __name__=='__main__':
 try:main()
 except Exception as e:status('needs_review',error=str(e));raise
