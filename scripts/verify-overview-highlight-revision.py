"""Check phrase onset/end frames, remove stale outlines, and preserve the soundtrack."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,re,subprocess
import cv2,numpy as np,imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1];NAME='managed-agents-v1.3.0';OUT=ROOT/'videos'/NAME
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe();cv2.setNumThreads(2)

def border(rect):
 x,y,w,h=rect;mask=np.zeros((h,w),bool);mask[:4,:]=True;mask[-4:,:]=True;mask[:,:4]=True;mask[:,-4:]=True;return mask

def audio_hash(file):
 result=subprocess.run([FFMPEG,'-v','error','-i',str(file),'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'],capture_output=True,check=True)
 return result.stdout.decode().strip()

def main():
 global NAME,OUT
 parser=argparse.ArgumentParser();parser.add_argument('--project',default=NAME);args=parser.parse_args();assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',args.project)
 NAME=args.project;OUT=ROOT/'videos'/NAME
 plan=json.loads((OUT/'narration-plan.json').read_text());manifest=json.loads((OUT/'recording-manifest.json').read_text());timeline=json.loads((OUT/'timeline.json').read_text())
 original_path=OUT/'before-highlight-revision/recording-manifest.json';original=json.loads(original_path.read_text()) if original_path.exists() else manifest;audit=json.loads((OUT/plan.get('highlightAudit','highlight-semantic-audit.json')).read_text())
 spec=importlib.util.spec_from_file_location('recorder',ROOT/'scripts/record-presentation-video.py');recorder=importlib.util.module_from_spec(spec);spec.loader.exec_module(recorder)
 movie=OUT/plan['outputFile'];cap=cv2.VideoCapture(str(movie));assert cap.isOpened();checks=[];stale_checks=0
 for planned,recorded,prior,scene in zip(plan['slides'],manifest['recordings'],original['recordings'],timeline['slides']):
  assert recorded['sha256']==prior['sha256'] and recorded['duration']==prior['duration']
  assert hashlib.sha256((ROOT/recorded['audio']).read_bytes()).hexdigest()==recorded['sha256']
  metadata=json.loads((ROOT/recorded['audio']).with_suffix('.json').read_text())
  assert recorder.align(planned['segments'],metadata['timestampInfo'])==recorded['cues'],'Phrase times must be exact provider word boundaries'
  native=cv2.imread(str(ROOT/'presentations'/NAME/f'.build/video/slides/slide-{scene["slide"]:02}.png'));previous=[]
  for cue in scene['cues']:
   proof=next(a for a in audit if a['cue']==cue['id']);assert proof['narration']==cue['text'] and len(proof['visibleText'])==len(cue['rects'])
   for point in (cue['start']+.1,cue['end']-.1):
    assert cue['start']<point<cue['end'];cap.set(cv2.CAP_PROP_POS_MSEC,point*1000);ok,frame=cap.read();assert ok
    red=(frame[:,:,2]>170)&(frame[:,:,1]<100)&(frame[:,:,0]<120)
    fresh=red&(np.max(np.abs(frame.astype(np.int16)-native.astype(np.int16)),axis=2)>70)
    for rect in cue['rects']:
     x,y,w,h=rect;coverage=float(red[y:y+h,x:x+w][border(rect)].mean());assert coverage>.4,(cue['id'],point,'outline missing near phrase boundary',coverage)
    for rect in previous:
     x,y,w,h=rect;mask=border(rect)
     for ax,ay,aw,ah in cue['rects']:
      left=max(x,ax);top=max(y,ay);right=min(x+w,ax+aw);bottom=min(y+h,ay+ah)
      if right>left and bottom>top:mask[top-y:bottom-y,left-x:right-x]=False
     if mask.sum()<40:continue
     stale=float(fresh[y:y+h,x:x+w][mask].mean());assert stale<.18,(cue['id'],point,'previous outline still visible',stale);stale_checks+=1
    checks.append({'cue':cue['id'],'seconds':round(point,4)})
   previous=cue['rects']
  print(f'Checked phrase boundaries and previous-outline removal on slide {scene["slide"]:02}.',flush=True)
 cap.release();report={'phraseCues':len(audit),'phraseBoundaryFramesChecked':len(checks),'staleOutlineChecks':stale_checks,'providerWordBoundaries':'exact','sourceAudioFilesVerified':len(manifest['recordings']),'checks':checks}
 if plan.get('retainedAudioSource'):
  before=audio_hash(ROOT/plan['retainedAudioSource']);after=audio_hash(movie);assert before==after,'The visual revision must preserve the exact AAC packets'
  report.update(audioPacketHashBefore=before,audioPacketHashAfter=after,originalAudioPreserved=True)
 filename='highlight-revision-validation.json' if plan.get('retainedAudioSource') else 'highlight-timing-validation.json'
 (OUT/filename).write_text(json.dumps(report,indent=2));print('Phrase timing and outline removal passed.',flush=True)

if __name__=='__main__':main()
