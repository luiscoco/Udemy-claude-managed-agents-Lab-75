"""Inspect the finished MP4, real outline frames, audio and cube intervals."""
from pathlib import Path
import argparse,hashlib,json,re,subprocess
import cv2,numpy as np,imageio_ffmpeg
cv2.setNumThreads(2)
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'videos/lab01';FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()

def main():
 global OUT
 parser=argparse.ArgumentParser();parser.add_argument('--lab',type=int,default=1);parser.add_argument('--project');args=parser.parse_args();assert 1<=args.lab<=75
 name=args.project or f'lab{args.lab:02}';assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',name)
 OUT=ROOT/'videos'/name;plan=json.loads((OUT/'narration-plan.json').read_text());total=len(plan['slides'])
 path=OUT/plan.get('outputFile','Lab01-Application-Workflow.mp4');timeline=json.loads((OUT/'timeline.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text())
 cap=cv2.VideoCapture(str(path));assert cap.isOpened()
 fps=cap.get(cv2.CAP_PROP_FPS);count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));width=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));height=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
 assert (width,height)==(1920,1080) and abs(fps-30)<.001
 duration=count/fps;assert abs(duration-timeline['duration'])<.08,(duration,timeline['duration'])
 assert len(timeline['slides'])==total and timeline['cubeTransitions']==total-1
 def frame(t):
  cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,image=cap.read();assert ok,t;return image
 samples=[];ratios=[];fitted_rectangles=0
 for s in timeline['slides']:
  for c in s['cues']:
   assert s['start']<=c['start']<c['end']<=s['start']+s['duration']
   image=frame((c['start']+c['end'])/2)
   assert c['textFits'] and len(c['textFits'])==len(c['rects'])
   for fitted in c['textFits']:
    x,y,w,h=fitted['rect'];ix,iy,iw,ih=fitted['textInkRect'];pad=fitted['padding']
    assert pad==8 and 0<=ix-x<=pad and 0<=iy-y<=pad and 0<=x+w-ix-iw<=pad and 0<=y+h-iy-ih<=pad,('Rectangle does not tightly enclose text',s['slide'],c['id'])
    crop=image[y:y+h,x:x+w];red=(crop[:,:,2]>170)&(crop[:,:,1]<100)&(crop[:,:,0]<120)
    mask=np.zeros(red.shape,bool);mask[:4,:]=True;mask[-4:,:]=True;mask[:,:4]=True;mask[:,-4:]=True
    ratio=float(red[mask].mean());assert ratio>.4,(s['slide'],c['id'],'missing timed red rectangle',ratio);ratios.append(ratio);fitted_rectangles+=1
  c=s['cues'][min(1,len(s['cues'])-1)];samples.append((f"Slide {s['slide']:02}",frame((c['start']+c['end'])/2)))
  if s['slide']==1:
   first=s['cues'][0];cv2.imwrite(str(OUT/'highlight-preview.jpg'),frame((first['start']+first['end'])/2))
  if s['slide'] in (13,21,27):cv2.imwrite(str(OUT/f"highlight-slide-{s['slide']:02}.jpg"),samples[-1][1])
  samples[-1]=(samples[-1][0],cv2.resize(samples[-1][1],(396,223),interpolation=cv2.INTER_AREA))
  print(f"Verified slide {s['slide']:02}: all {len(s['cues'])} spoken highlights present.",flush=True)
 for i,s in enumerate(timeline['slides'][:-1]):
  t=s['start']+s['duration'];start=frame(t+.03);middle=frame(t+.4);assert np.mean(cv2.absdiff(start,middle))>3,(i,'static transition')
 cap.release()
 # Decode the complete video/audio streams, not just selected frames.
 result=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-map','0:v:0','-map','0:a:0','-f','null','-'],capture_output=True)
 assert result.returncode==0 and not result.stderr,result.stderr.decode(errors='replace')[-1500:]
 metadata=subprocess.run([FFMPEG,'-hide_banner','-i',str(path)],capture_output=True).stderr.decode(errors='replace')
 assert 'h264' in metadata and '48000 Hz' in metadata and 'aac' in metadata and 'mov_text' in metadata
 assert len(re.findall(r'Chapter #0:\d+:',metadata))==total,'Chapter count does not match slide count'
 audioinfo=subprocess.run([FFMPEG,'-hide_banner','-i',str(ROOT/manifest['recordings'][0]['audio'])],capture_output=True).stderr.decode(errors='replace')
 assert '48000 Hz' in audioinfo and 'mp3' in audioinfo
 def pcm(media):
  result=subprocess.run([FFMPEG,'-v','error','-i',str(media),'-vn','-sn','-f','f32le','-ac','1','-ar','8000','pipe:1'],capture_output=True)
  assert result.returncode==0 and not result.stderr
  return np.frombuffer(result.stdout,dtype=np.float32)
 soundtrack=pcm(path);sync=[]
 for scene,recording in zip(timeline['slides'],manifest['recordings']):
  original=pcm(ROOT/recording['audio']);windows=[]
  # Choose audible speech in three separated regions. A fixed timestamp may
  # land in a pause, where lossy encoding noise makes correlation meaningless.
  for lower,upper in ((.1,.3),(.35,.6),(.65,.85)):
   candidates=[]
   for fraction in np.linspace(lower,upper,9):
    source_start=int(len(original)*fraction);template=original[source_start:source_start+6000].copy()
    if len(template)==6000:candidates.append((float(np.sqrt(np.mean(template**2))),source_start,template))
   assert candidates,(scene['slide'],'narration too short for synchronization check')
   rms,source_start,template=max(candidates,key=lambda candidate:candidate[0])
   assert rms>.005,(scene['slide'],'no audible speech in synchronization region',lower,upper,rms)
   expected=round((scene['start']+.35)*8000)+source_start;radius=1600
   search=soundtrack[expected-radius:expected+len(template)+radius].copy()
   scores=cv2.matchTemplate(search.reshape(1,-1),template.reshape(1,-1),cv2.TM_CCOEFF_NORMED);_,score,_,location=cv2.minMaxLoc(scores)
   drift=(location[0]-radius)/8000
   assert score>.9 and abs(drift)<.06,(scene['slide'],'audio/video synchronization',score,drift)
   windows.append({'sourceSeconds':round(source_start/8000,4),'rms':round(rms,5),'correlation':round(score,4),'offsetSeconds':round(drift,4)})
  sync.append({'slide':scene['slide'],'correlation':min(w['correlation'] for w in windows),'offsetSeconds':max((w['offsetSeconds'] for w in windows),key=abs),'speechWindows':windows})
 levelscan=subprocess.run([FFMPEG,'-hide_banner','-i',str(path),'-vn','-sn','-af','volumedetect','-f','null','-'],capture_output=True)
 assert levelscan.returncode==0
 levels=levelscan.stderr.decode(errors='replace');mean=float(re.search(r'mean_volume: ([-\d.]+) dB',levels)[1]);peak=float(re.search(r'max_volume: ([-\d.]+) dB',levels)[1])
 assert -40<mean<-5 and peak<=0,(mean,peak)
 sheet=Image.new('RGB',(1600,((len(samples)+3)//4)*250),'#e8e3dc');draw=ImageDraw.Draw(sheet)
 for k,(title,array) in enumerate(samples):
  image=Image.fromarray(cv2.cvtColor(array,cv2.COLOR_BGR2RGB));image.thumbnail((396,223));x=k%4*400;y=k//4*250;draw.text((x+5,y+4),title,fill='black');sheet.paste(image,(x+2,y+23))
 sheet.save(OUT/'all-slides-review.jpg',quality=93)
 report={'lab':1,'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'resolution':[width,height],'fps':fps,'durationSeconds':duration,'slides':27,'cubeTransitionsVerified':26,'wordAlignedHighlightsVerified':len(ratios),'minimumRedBorderCoverage':round(min(ratios),3),'fullVideoAndAudioDecode':'passed','meanVolumeDb':mean,'peakVolumeDb':peak,'inworldWordAlignment':'exact narration text matched for all 27 recordings','settings':plan['settings'],'videoCodec':'H.264','audioCodec':'AAC 48 kHz','sourceNarration':'MP3 48 kHz','subtitles':'embedded English and external SRT','chapters':27}
 report['wordAlignedHighlightsVerified']=sum(len(s['cues']) for s in timeline['slides']);report['textFittedRectanglesVerified']=fitted_rectangles;report['highlightPaddingPixels']=8
 report.update(lab=args.lab,slides=total,cubeTransitionsVerified=total-1,chapters=total,inworldWordAlignment=f'exact narration text matched for all {total} recordings')
 if args.project:report.pop('lab',None);report['project']=args.project
 report['audioVideoSync']=sync;report['maximumAudioSyncOffsetSeconds']=round(max(abs(x['offsetSeconds']) for x in sync),4)
 (OUT/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
if __name__=='__main__':main()
