"""Confirm real captured browser frames survive in the final promotional MP4s."""
from pathlib import Path
import hashlib,json
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'presentations/agent-sdk-free-course-promo-v2/tour'
evidence=json.loads((source/'live-evidence.json').read_text())
assert evidence['mocked'] is False and evidence['status']=='Success'
assert any(e['type']=='tool' and e.get('name')=='Glob' for e in evidence['events'])
assert any(e['type']=='result' and e.get('status')=='success' for e in evidence['events'])
assert all(n in evidence['answer'].replace('\\','/') for n in ['notes.txt','src/hello.ts','todo.md'])
def frame(cap,seconds):
 cap.set(cv2.CAP_PROP_POS_MSEC,seconds*1000);ok,pixels=cap.read();assert ok;return pixels
for name in ['agent-sdk-free-course-promo-v2','agent-sdk-free-course-promo-extended-v2']:
 p=ROOT/'videos'/name;plan=json.loads((p/'narration-plan.json').read_text());timeline=json.loads((p/'timeline.json').read_text());movie=cv2.VideoCapture(str(p/plan['outputFile']));proofs=[]
 for row,scene in zip(plan['slides'],timeline['slides']):
  if not row.get('motion'):continue
  m=row['motion'];original=cv2.VideoCapture(str(ROOT/m['file']));duration=original.get(cv2.CAP_PROP_FRAME_COUNT)/original.get(cv2.CAP_PROP_FPS);x,y,w,h=m['rect'];samples=[];diffs=[]
  for fraction in [.18,.50,.92]:
   expected=cv2.resize(frame(original,duration*fraction),(w,h));encoded=frame(movie,scene['start']+scene['duration']*fraction);actual=encoded[y:y+h,x:x+w];difference=float(np.mean(cv2.absdiff(expected,actual)));assert difference<18,(name,row['slide'],fraction,difference);diffs.append(round(difference,3));samples.append(actual)
  movement=max(float(np.mean(cv2.absdiff(a,b))) for a,b in zip(samples,samples[1:]));assert movement>1,(row['slide'],'static browser footage')
  if 'live-run' in m['file']:
   completed=cv2.imread(str(source/'completed-run.png'));completed=cv2.resize(completed,(w,h));held=frame(movie,scene['start']+scene['duration']*.92);difference=float(np.mean(cv2.absdiff(completed,held[y:y+h,x:x+w])));assert difference<12,('completed result not preserved',difference);cv2.imwrite(str(p/'real-app-result-review.jpg'),held)
  proofs.append({'slide':row['slide'],'source':m['file'],'sourceSha256':hashlib.sha256((ROOT/m['file']).read_bytes()).hexdigest(),'encodedFrameDifferences':diffs,'motionDifference':round(movement,3)});original.release()
 movie.release();assert len(proofs)==3
 report={'realApiRun':'success','mocked':False,'tool':'Glob','filesVerified':3,'tourScenes':proofs,'completedResultHold':'verified','browserErrors':evidence['browserErrors']}
 (p/'real-app-tour-validation.json').write_text(json.dumps(report,indent=2));(p/'real-run-evidence.json').write_text(json.dumps(evidence,indent=2))
 print(name,'three moving browser scenes and the real completed result verified')
