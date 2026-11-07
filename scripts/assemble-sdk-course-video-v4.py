"""Join the verified concept introduction to the entire verified practical tour."""
from pathlib import Path
import argparse,hashlib,html,importlib.util,json,re,subprocess,textwrap,wave,zipfile
import cv2,numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-course-concepts-and-app-v4';OLD='agent-sdk-complete-browser-tour-v3'
OUT=ROOT/'videos'/NAME;BUILD=ROOT/'presentations'/NAME/'.build/video';APP=ROOT/'videos'/OLD
FF=imageio_ffmpeg.get_ffmpeg_exe();PREFIX='Claude-Agent-SDK-Course-Concepts-and-Complete-App-Tour-v4'
def run(args,output=False):
 p=subprocess.run([FF,'-hide_banner','-loglevel','error',*map(str,args)],capture_output=True)
 assert p.returncode==0 and not p.stderr,p.stderr.decode(errors='replace')[-2000:]
 return p.stdout if output else None
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
 return f'{h:02}:{m:02}:{s:02},{ms:03}'
def getframe(cap,t):
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,f=cap.read();assert ok,t;return f
def pcm(file):return np.frombuffer(run(['-i',file,'-vn','-sn','-f','f32le','-ac','1','-ar','8000','pipe:1'],True),dtype=np.float32)
def main():
 global NAME,OUT,BUILD,PREFIX
 parser=argparse.ArgumentParser();parser.add_argument('--project',default=NAME);args=parser.parse_args()
 assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',args.project)
 NAME=args.project;OUT=ROOT/'videos'/NAME;BUILD=ROOT/'presentations'/NAME/'.build/video'
 status=json.loads((OUT/'production-status.json').read_text());assert status['stage']=='complete','Introduction must pass every verification before assembly'
 it=json.loads((OUT/'timeline.json').read_text());at=json.loads((APP/'timeline.json').read_text());plan=json.loads((OUT/'narration-plan.json').read_text());ap=json.loads((APP/'narration-plan.json').read_text())
 if NAME.endswith('-v5'):PREFIX='Claude-Agent-SDK-Course-Index-Code-and-Complete-App-Tour-v5'
 curriculum=json.loads((ROOT/'presentations'/NAME/'curriculum.json').read_text(encoding='utf8'))
 has_index=isinstance(curriculum,dict) and 'codeSlides' in curriculum
 if has_index:
  code_check=json.loads((ROOT/'presentations'/NAME/'code-validation.json').read_text())
  assert code_check['result']=='passed' and code_check['diagnostics']==0,'Displayed code must pass its SDK type check'
 count=len(it['slides']);concept_count=count-1-int(has_index);expected_chapters=count+len(at['scenes'])
 intro=OUT/plan['outputFile'];app=APP/ap['outputFile'];iv=json.loads((OUT/'validation.json').read_text());av=json.loads((APP/'validation.json').read_text())
 assert iv['sha256']==hashlib.sha256(intro.read_bytes()).hexdigest();assert av['sha256']==hashlib.sha256(app.read_bytes()).hexdigest()
 spec=importlib.util.spec_from_file_location('renderer',ROOT/'scripts/render-presentation-video.py');renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
 # A silent cube turn separates the concept map from the intact application tour.
 a=cv2.imread(str(BUILD/f'slides/slide-{count:02}.png'));v=cv2.VideoCapture(str(app));b=getframe(v,0);v.release();turn=BUILD/'intro-to-app-cube.mp4'
 p=subprocess.Popen([FF,'-v','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size','1920x1080','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-threads','2','-video_track_timescale','15360',str(turn)],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 for k in range(24):p.stdin.write(renderer.cube_frame(a,b,k/23).tobytes())
 p.stdin.close();error=p.stderr.read();p.wait();assert p.returncode==0,error
 offset=it['duration']+.8;total=offset+at['duration'];chapters=[];cues=[]
 names=['Course cover','SDK foundations and setup','query() and the agent loop','Agent message types','Context and compaction','Configuration and execution controls']
 if has_index:names=['Course cover','Course index: all 13 lectures']+[re.sub('<[^>]+>','',s['title']) for s in curriculum['codeSlides']]
 assert len(names)==count
 for s,label in zip(it['slides'],names):
  chapters.append({'start':s['start'],'end':s['start']+s['duration'],'label':label})
  cues.extend(s['cues'])
 for s in at['scenes']:
  chapters.append({'start':offset+s['start'],'end':offset+s['start']+s['duration'],'label':s['label']})
  c=s['cue'];cues.append({**c,'start':offset+s['start']+c['start'],'end':offset+s['start']+c['end']})
 srt=OUT/(PREFIX+'.srt');srt.write_text('\n'.join(f'{i}\n{stamp(c["start"])} --> {stamp(c["end"])}\n'+'\n'.join(textwrap.wrap(c['text'],85))+'\n' for i,c in enumerate(cues,1)),encoding='utf8')
 vtt=OUT/(PREFIX+'.vtt');vtt.write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt.read_text(encoding='utf8')),encoding='utf8')
 meta=[';FFMETADATA1','title=Claude Agent SDK - Course Concepts and Complete App Tour','artist=Luis Coco Enriquez']
 for c in chapters:meta+=['[CHAPTER]','TIMEBASE=1/1000',f'START={round(c["start"]*1000)}',f'END={round(c["end"]*1000)}','title='+c['label']]
 (BUILD/'combined-chapters.txt').write_text('\n'.join(meta),encoding='utf8')
 # Remove AAC priming timestamps before concatenating the picture streams.
 # Otherwise concat can advance the first boundary by one AAC packet.
 picture_parts=[]
 for file,label in [(intro,'intro'),(app,'app')]:
  target=BUILD/(label+'-picture-only.mp4')
  run(['-y','-i',file,'-map','0:v:0','-an','-sn','-map_chapters','-1','-c:v','copy','-video_track_timescale','15360',target]);picture_parts.append(target)
 pieces=[(picture_parts[0],it['duration']),(turn,.8),(picture_parts[1],at['duration'])]
 (BUILD/'combined-concat.txt').write_text('\n'.join("file '"+p.as_posix()+"'\nduration "+f'{d:.9f}' for p,d in pieces),encoding='utf8')
 # Reuse the original PCM narration. AAC is encoded once, avoiding segment padding.
 wavpath=BUILD/'combined-soundtrack.wav'
 with wave.open(str(wavpath),'wb') as out:
  out.setnchannels(2);out.setsampwidth(2);out.setframerate(48000)
  for file,dur in [(BUILD/'soundtrack.wav',it['duration']),(None,.8),(ROOT/'presentations'/OLD/'.build/video/soundtrack.wav',at['duration'])]:
   size=round(dur*48000)*4
   if file:
    with wave.open(str(file),'rb') as source:
     assert (source.getnchannels(),source.getsampwidth(),source.getframerate())==(2,2,48000);data=source.readframes(source.getnframes());assert len(data)==size,(file,len(data),size);out.writeframes(data)
   else:out.writeframes(b'\0'*size)
 movie=OUT/(PREFIX+'.mp4')
 print(f'Assembling {total:.2f}s; app starts at {offset:.2f}s; {len(chapters)} chapters.',flush=True)
 run(['-y','-f','concat','-safe','0','-i',BUILD/'combined-concat.txt','-i',wavpath,'-f','ffmetadata','-i',BUILD/'combined-chapters.txt','-i',srt,'-map','0:v:0','-map','1:a:0','-map','3:0','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-c:s','mov_text','-metadata:s:s:0','language=eng','-movflags','+faststart',movie])
 # Full decode, exact time/format checks, and comparison to every original scene.
 run(['-i',movie,'-map','0:v:0','-map','0:a:0','-f','null','-'])
 cap=cv2.VideoCapture(str(movie));assert cap.isOpened();duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS)
 assert abs(duration-total)<.04 and abs(cap.get(cv2.CAP_PROP_FPS)-30)<.001 and (cap.get(3),cap.get(4))==(1920,1080),(duration,total,cap.get(cv2.CAP_PROP_FPS))
 metadata=subprocess.run([FF,'-hide_banner','-i',str(movie)],capture_output=True).stderr.decode(errors='replace');assert all(s in metadata for s in ['h264','aac','48000 Hz','mov_text']);assert len(re.findall(r'Chapter #0:\d+:',metadata))==expected_chapters
 preserved=[]
 for media,scenes,shift in [(intro,it['slides'],0),(app,at['scenes'],offset)]:
  source=cv2.VideoCapture(str(media))
  for scene in scenes:
   t=scene['start']+scene['duration']*.55;original=getframe(source,t);actual=getframe(cap,shift+t);diff=float(np.mean(cv2.absdiff(original,actual)));assert diff<.05,('Source scene changed',t,diff);preserved.append(diff)
  source.release()
 sync=[];actual=pcm(movie)
 for file,shift,dur in [(intro,0,it['duration']),(app,offset,at['duration'])]:
  original=pcm(file)
  for fraction in [.08,.3,.6,.9]:
   candidates=[]
   for t in np.linspace(max(.3,dur*fraction-2),min(dur-1,dur*fraction+2),15):
    pos=round(t*8000);chunk=original[pos:pos+6000];candidates.append((float(np.sqrt(np.mean(chunk**2))),pos,chunk))
   rms,pos,chunk=max(candidates,key=lambda c:c[0]);assert rms>.005
   expected=round(shift*8000)+pos;radius=1600;search=actual[expected-radius:expected+len(chunk)+radius].copy()
   scores=cv2.matchTemplate(search.reshape(1,-1),chunk.copy().reshape(1,-1),cv2.TM_CCOEFF_NORMED);_,score,_,loc=cv2.minMaxLoc(scores);drift=(loc[0]-radius)/8000
   assert score>.9 and abs(drift)<.06,(score,drift);sync.append({'part':file.name,'correlation':round(score,5),'offsetSeconds':drift})
 for label,t in [('cover',3),('infographic',it['slides'][2]['start']+4),('app-start',offset+3),('real-result',offset+at['scenes'][39]['start']+2)]:cv2.imwrite(str(OUT/('combined-review-'+label+'.jpg')),getframe(cap,t))
 cap.release()
 report={'file':movie.name,'durationSeconds':duration,'introDurationSeconds':it['duration'],'appStartsAtSeconds':offset,'appDurationSeconds':at['duration'],'cover':1,'courseIndexSlides':int(has_index),'infographics':concept_count,'applicationSections':len(at['scenes']),'chapters':expected_chapters,'wordAlignedCues':len(cues),'fullVideoAndAudioDecode':'passed','preservedSceneSamples':len(preserved),'maximumFrameDifference':max(preserved),'audioSync':sync,'sourceAppValidation':('../'+OLD+'/validation.json'),'introHighlightValidation':'highlight-timing-validation.json','sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
 (OUT/'combined-validation.json').write_text(json.dumps(report,indent=2));(OUT/'combined-timeline.json').write_text(json.dumps({'duration':total,'chapters':chapters,'cues':cues},indent=2))
 images=''.join(f'<a href="../../presentations/{NAME}/images/{n:02}.png"><img alt="'+html.escape(names[n-1])+f'" src="../../presentations/{NAME}/images/{n:02}.png"></a>' for n in range(1,count+1))
 page=f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claude Agent SDK: concepts and practical app tour</title><style>body{{font:18px Arial;color:#090d3b;background:#edf6ff;margin:24px}}main{{max-width:1500px;margin:auto}}video{{width:100%;background:black}}a{{color:#006bce}}.gallery{{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}}img{{width:100%}}p{{line-height:1.5}}</style><main><h1>Claude Agent SDK: concepts and practical app tour</h1><video controls preload="metadata" poster="../../presentations/{NAME}/images/01.png"><source src="{movie.name}" type="video/mp4"><track kind="subtitles" src="{vtt.name}" srclang="en" label="English"></video><p>Course cover · Five concept infographics · Complete 42-section practical application tour · Inworld Yash narration · Timed red highlights · English subtitles</p><p><a href="{movie.name}" download>Download MP4</a> · <a href="{srt.name}">Subtitles</a> · <a href="combined-validation.json">Verification</a> · <a href="../../presentations/{NAME}/infographics.html">Open editable infographic deck</a></p><p>The practical application tour begins at {int(offset)//60}:{int(offset)%60:02}. The entire previously created tour is included. Browser footage is edited for narration pacing; the displayed query and result are real.</p><div class="gallery">{images}</div><p>Technical references: <a href="https://code.claude.com/docs/en/agent-sdk/overview">SDK overview</a> · <a href="https://code.claude.com/docs/en/agent-sdk/agent-loop">Agent loop</a></p></main>'''
 page=page.replace('Five concept infographics',f'{concept_count} concept slides with code' if has_index else f'{concept_count} concept infographics')
 if has_index:
  page=page.replace('Course cover ·','Course cover · Full course index ·')
  page=page.replace('Open editable infographic deck','Open the course-index and code slides')
  assets=ROOT/'presentations'/NAME;archive=OUT/'Claude-Agent-SDK-Course-Index-Code-Slides-v5.zip'
  with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as bundle:
   for file in [*sorted((assets/'images').glob('*.png')),*[assets/f for f in ['cover.png','astronaut.png','infographics.html','curriculum.json','code-examples.ts','code-validation.json','sources.txt']]]:bundle.write(file,file.relative_to(assets))
  jump=lambda t:f"document.querySelector('video').currentTime={t:.6f};document.querySelector('video').play()"
  shortcuts=f'<p><button onclick="{jump(it["slides"][1]["start"])}">Jump to course index</button> <button onclick="{jump(offset)}">Jump to practical app tour</button></p>'
  downloads=f'<p><a href="{archive.name}" download>Download all slide images and code excerpts</a> · <a href="../../presentations/{NAME}/code-examples.ts">TypeScript snippets</a></p>'
  page=page.replace('<div class="gallery">',shortcuts+downloads+'<div class="gallery">')
 (OUT/'index.html').write_text(page,encoding='utf8');(OUT/'combined-production-status.json').write_text(json.dumps({'stage':'complete',**report},indent=2))
 print('Verified complete course video:',movie,flush=True)
if __name__=='__main__':main()
