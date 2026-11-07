"""Render full-HD slides with real timed outlines and perspective cube turns."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,math,re,subprocess,textwrap,wave
import cv2,numpy as np,imageio_ffmpeg
from PIL import Image,ImageDraw
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'videos/lab01';BUILD=ROOT/'presentations/lab01/.build/video'
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe();W,H,FPS=1920,1080,30;TURN_FRAMES=24;INTRO=.35;TAIL=.55

def run(args):
 p=subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y',*map(str,args)],capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace')[-2000:])

def encoder(path):return ['-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r',FPS,'-threads','2','-video_track_timescale','15360','-c:a','aac','-b:a','192k','-ar','48000','-ac','2',path]

def render_slide(row,geometry):
 n=row['slide'];path=BUILD/f'scene-{n:02}.mp4';duration=math.ceil((row['duration']+INTRO+TAIL)*FPS)/FPS
 filters=[];cues=[];image=cv2.imread(str(BUILD/f'slides/slide-{n:02}.png'))
 for cue in row['cues']:
  fitted=fit_highlights(cue['target'],geometry,image);start=INTRO+cue['start'];end=INTRO+cue['end']
  for item in fitted:
   x,y,w,h=item['rect'];filters.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xFF2424:t=4:enable='between(t,{start:.6f},{end:.6f})'")
  cues.append({**cue,'start':start,'end':end,'rects':[v['rect'] for v in fitted],'textFits':fitted})
 motion=row.get('motion')
 motion_bytes=(ROOT/motion['file']).read_bytes() if motion else b''
 identity=hashlib.sha256(json.dumps({'row':row,'geometry':geometry,'fittedCues':cues,'version':2},sort_keys=True).encode()+ (BUILD/f'slides/slide-{n:02}.png').read_bytes()+motion_bytes).hexdigest()
 marker=BUILD/f'scene-{n:02}.sha256'
 if not(path.exists() and marker.exists() and marker.read_text()==identity):
  if motion:
   x,y,w,h=motion['rect'];source=cv2.VideoCapture(str(ROOT/motion['file']));seconds=source.get(cv2.CAP_PROP_FRAME_COUNT)/source.get(cv2.CAP_PROP_FPS);source.release();assert seconds>0
   chain=f'[1:v]setpts=(PTS-STARTPTS)*{duration/seconds:.9f},fps={FPS},scale={w}:{h},setsar=1,tpad=stop_mode=clone:stop_duration=2[app];[0:v][app]overlay={x}:{y}:shortest=1,'+','.join(filters)+'[v]'
   run(['-loop','1','-framerate',FPS,'-i',BUILD/f'slides/slide-{n:02}.png','-i',ROOT/motion['file'],'-i',ROOT/row['audio'],'-filter_complex',chain,'-map','[v]','-map','2:a','-af',f'adelay=350|350,apad=whole_dur={duration:.6f}','-t',f'{duration:.6f}',*encoder(path)])
  else:
   hold=f'loop=loop=-1:size=1:start=0,setpts=N/({FPS}*TB),'
   run(['-threads','1','-framerate',FPS,'-i',BUILD/f'slides/slide-{n:02}.png','-i',ROOT/row['audio'],'-vf',hold+','.join(filters),'-af',f'adelay=350|350,apad=whole_dur={duration:.6f}', '-t',f'{duration:.6f}',*encoder(path)])
  marker.write_text(identity)
 print(f'Slide {n:02} rendered: {duration:.2f}s, {len(cues)} timed outlines.',flush=True)
 return {'slide':n,'path':path,'duration':duration,'cues':cues}

def cube_frame(a,b,t):
 if t<=0:return a
 if t>=1:return b
 # Two adjoining faces of a genuine rotating rectangular prism, projected in 3D.
 angle=(t*t*(3-2*t))*math.pi/2;c,s=math.cos(angle),math.sin(angle)
 ratio=H/W
 faces=[np.array([[-1,-ratio,1],[1,-ratio,1],[1,ratio,1],[-1,ratio,1]],dtype=float),np.array([[1,-ratio,1],[1,-ratio,-1],[1,ratio,-1],[1,ratio,1]],dtype=float)]
 projected=[];depths=[]
 for face in faces:
  x=face[:,0]*c-face[:,2]*s;z=face[:,0]*s+face[:,2]*c
  projected.append(np.column_stack([x/(5-z),face[:,1]/(5-z)]));depths.append(float(np.mean(z)))
 allpoints=np.vstack(projected);extent=np.max(np.abs(allpoints),axis=0)
 scale=min((W/2-3)/extent[0],(H/2-3)/extent[1]);scale*=1-.035*math.sin(math.pi*t)
 canvas=np.full((H,W,3),(32,29,26),dtype=np.uint8)
 source=np.float32([[0,0],[W-1,0],[W-1,H-1],[0,H-1]])
 for i in sorted(range(2),key=lambda i:depths[i]):
  dest=np.float32(projected[i]*scale+[W/2,H/2]);matrix=cv2.getPerspectiveTransform(source,dest)
  shade=1-.22*(math.sin(angle) if i==0 else math.cos(angle));face=cv2.convertScaleAbs(a if i==0 else b,alpha=shade)
  warped=cv2.warpPerspective(face,matrix,(W,H),flags=cv2.INTER_LINEAR)
  mask=np.zeros((H,W),np.uint8);cv2.fillConvexPoly(mask,np.round(dest).astype(np.int32),255)
  canvas[mask>0]=warped[mask>0]
 return canvas

def render_turn(n):
 path=BUILD/f'cube-{n:02}.mp4';a=cv2.imread(str(BUILD/f'slides/slide-{n:02}.png'));b=cv2.imread(str(BUILD/f'slides/slide-{n+1:02}.png'))
 if path.exists():
  cap=cv2.VideoCapture(str(path));count=cap.get(cv2.CAP_PROP_FRAME_COUNT);ok,first=cap.read();cap.set(cv2.CAP_PROP_POS_FRAMES,TURN_FRAMES-1);last_ok,last=cap.read();cap.release()
  if count==TURN_FRAMES and ok and last_ok and first.shape==a.shape and last.shape==b.shape and np.mean(cv2.absdiff(first,a))<3 and np.mean(cv2.absdiff(last,b))<3:return path
 args=[FFMPEG,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(TURN_FRAMES/FPS),*map(str,encoder(path))]
 p=subprocess.Popen(args,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  for k in range(TURN_FRAMES):
   frame=cube_frame(a,b,k/(TURN_FRAMES-1));p.stdin.write(frame.tobytes())
   if n in (1,13) and k==TURN_FRAMES//2:cv2.imwrite(str(OUT/f'cube-transition-{n:02}.jpg'),frame)
  p.stdin.close();error=p.stderr.read();p.wait();assert p.returncode==0,error.decode(errors='replace')[-1000:]
 except BaseException:
  p.kill();raise
 return path

def srt_time(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
 return f'{h:02}:{m:02}:{s:02},{ms:03}'

def continuous_soundtrack(records,scenes):
 # Concatenated AAC packets accumulate encoder padding. Assemble exact PCM samples
 # from the original MP3s instead, then encode AAC only once for the entire lesson.
 path=BUILD/'soundtrack.wav';frame_bytes=4
 with wave.open(str(path),'wb') as stream:
  stream.setnchannels(2);stream.setsampwidth(2);stream.setframerate(48000)
  for record,scene in zip(records,scenes):
   decoded=subprocess.run([FFMPEG,'-v','error','-i',str(ROOT/record['audio']),'-f','s16le','-ac','2','-ar','48000','pipe:1'],capture_output=True)
   assert decoded.returncode==0 and not decoded.stderr
   intro=round(INTRO*48000);total=round(scene['duration']*48000);samples=len(decoded.stdout)//frame_bytes
   tail=total-intro-samples;assert tail>=0
   stream.writeframes(b'\0'*(intro*frame_bytes));stream.writeframes(decoded.stdout);stream.writeframes(b'\0'*(tail*frame_bytes))
   if scene['slide']!=scenes[-1]['slide']:stream.writeframes(b'\0'*(round(TURN_FRAMES/FPS*48000)*frame_bytes))
 return path

def main():
 global OUT,BUILD
 parser=argparse.ArgumentParser();parser.add_argument('--lab',type=int,default=1);parser.add_argument('--project');parser.add_argument('--reuse-audio',action='store_true',help='Preserve the existing soundtrack for a visual-only revision');args=parser.parse_args()
 assert 1<=args.lab<=75
 OUT=ROOT/f'videos/lab{args.lab:02}';BUILD=ROOT/f'presentations/lab{args.lab:02}/.build/video'
 if args.project:
  assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',args.project)
  OUT=ROOT/'videos'/args.project;BUILD=ROOT/'presentations'/args.project/'.build/video'
 plan=json.loads((OUT/'narration-plan.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text());records=manifest['recordings']
 prefix=plan.get('mediaPrefix',f'Lab{args.lab:02}');display_title=plan.get('displayTitle',f'Lab {args.lab:02} - '+plan.get('title','Session event streaming'))
 total=len(plan['slides']);assert len(records)==total and plan['presentationSha256']==manifest['presentationSha256']==hashlib.sha256((ROOT/plan['presentation']).read_bytes()).hexdigest()
 for planned,recorded in zip(plan['slides'],records):
  assert [(c['id'],c['text'],c['target']) for c in planned['segments']]==[(c['id'],c['text'],c['target']) for c in recorded['cues']],'Recorded narration differs from the current plan'
  if planned.get('motion'):recorded['motion']=planned['motion']
 geometry=json.loads((BUILD/'slides/geometry.json').read_text(encoding='utf-8-sig'))
 prior=json.loads((OUT/'timeline.json').read_text()) if args.reuse_audio else None
 with ThreadPoolExecutor(max_workers=2) as pool:scenes=list(pool.map(lambda pair:render_slide(*pair),zip(records,geometry)))
 pieces=[];piece_durations=[];timeline=[];offset=0;captions=[];chapters=[';FFMETADATA1','title='+display_title,'artist=Luis Coco Enriquez']
 for scene in scenes:
  n=scene['slide'];pieces.append(scene['path']);piece_durations.append(scene['duration']);timeline.append({'slide':n,'start':offset,'duration':scene['duration'],'cues':[{**c,'start':offset+c['start'],'end':offset+c['end']} for c in scene['cues']]})
  for c in scene['cues']:captions.append(f"{len(captions)+1}\n{srt_time(offset+c['start'])} --> {srt_time(offset+c['end'])}\n"+'\n'.join(textwrap.wrap(c['text'],85))+'\n')
  chapters.extend(['[CHAPTER]','TIMEBASE=1/1000',f'START={round(offset*1000)}',f'END={round((offset+scene["duration"])*1000)}',f'title=Slide {n:02}'])
  offset+=scene['duration']
  if n<total:
   pieces.append(render_turn(n));piece_durations.append(TURN_FRAMES/FPS);offset+=TURN_FRAMES/FPS
   print(f'Cube transition {n:02}/{total-1} rendered.',flush=True)
 subtitles=OUT/f'{prefix}-captions.srt';subtitles.write_text('\n'.join(captions),encoding='utf8');(BUILD/'chapters.txt').write_text('\n'.join(chapters)+'\n',encoding='utf8')
 (BUILD/'concat.txt').write_text('\n'.join("file '"+x.as_posix()+"'\nduration "+f'{duration:.9f}' for x,duration in zip(pieces,piece_durations)),encoding='utf8')
 destination=OUT/plan.get('outputFile','Lab01-Application-Workflow.mp4')
 if args.reuse_audio:
  assert abs(prior['duration']-offset)<.00001 and len(prior['slides'])==len(timeline)
  for old,new in zip(prior['slides'],timeline):
   assert abs(old['start']-new['start'])<.00001 and old['duration']==new['duration']
   # Visual cues may be split at existing provider word boundaries. Retain the
   # audio only when the spoken text and the complete scene timing are identical.
   assert ' '.join(c['text'] for c in old['cues'])==' '.join(c['text'] for c in new['cues']),'Audio reuse requires unchanged narration'
  audio_source=ROOT/plan['retainedAudioSource'] if plan.get('retainedAudioSource') else destination
  assert audio_source.exists(),'The original soundtrack must exist for visual-only revision'
  soundtrack=BUILD/'retained-narration.m4a';run(['-i',audio_source,'-map','0:a:0','-c:a','copy',soundtrack]);audio_args=['-c:a','copy']
 else:
  soundtrack=continuous_soundtrack(records,scenes);audio_args=['-c:a','aac','-b:a','192k','-ar','48000']
 run(['-f','concat','-safe','0','-i',BUILD/'concat.txt','-i',soundtrack,'-f','ffmetadata','-i',BUILD/'chapters.txt','-i',subtitles,'-map','0:v','-map','1:a','-map','3:0','-map_metadata','2','-map_chapters','2','-c:v','copy',*audio_args,'-c:s','mov_text','-metadata:s:s:0','language=eng','-movflags','+faststart',destination])
 if not args.reuse_audio:run(['-i',soundtrack,'-c:a','libmp3lame','-b:a','192k','-ar','48000',OUT/f'{prefix}-narration.mp3'])
 (OUT/'timeline.json').write_text(json.dumps({'duration':offset,'fps':FPS,'resolution':[W,H],'slides':timeline,'cubeTransitions':total-1,'transitionFrames':TURN_FRAMES},indent=2))
 print(f'Created {destination.name}: {offset:.2f}s, {total} slides, {total-1} cube transitions.',flush=True)
if __name__=='__main__':main()
