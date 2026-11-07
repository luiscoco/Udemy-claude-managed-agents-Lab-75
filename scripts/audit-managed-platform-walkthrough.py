from pathlib import Path
import sys,json,cv2,numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent))
from presentation_highlights import fit_highlights
ROOT=Path(__file__).resolve().parents[1];NAME='managed-agents-platform-walkthrough';P=ROOT/'presentations'/NAME;V=ROOT/'videos'/NAME
plan=json.loads((V/'narration-plan.json').read_text(encoding='utf-8'));g=json.loads((P/'.build/video/slides/geometry.json').read_text(encoding='utf-8'));e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
panels=[];checks=[]
for row,geometry in zip(plan['slides'],g):
 n=row['slide'];im=cv2.imread(str(P/f'.build/video/slides/slide-{n:02}.png'));assert im.shape[:2]==(1080,1920)
 if 3<=n<=23:
  title=json.loads((P/'storyboard.json').read_text(encoding='utf-8'))[n-1]['body'];import re
  id=re.search(r'platform/([^"/]+).png',title).group(1);original=cv2.imread(str(P/f'platform/{id}.png'));diff=np.abs(im[90:].astype(float)-original[90:]).max();assert diff==0,(n,diff)
 for cue in row['segments']:
  fit=fit_highlights(cue['target'],geometry,im);checks.append({'slide':n,'cue':cue['id'],'rectangles':fit})
  view=im.copy()
  for b in fit:
   x,y,w,h=map(int,b['rect']);cv2.rectangle(view,(x,y),(x+w,y+h),(0,0,255),4)
  thumb=cv2.resize(view,(640,360));cv2.putText(thumb,f'{n:02} {cue["id"]}',(12,349),cv2.FONT_HERSHEY_SIMPLEX,.65,(0,180,255),2);panels.append(thumb)
for i in range(0,len(panels),6):
 group=panels[i:i+6]+[np.zeros((360,640,3),np.uint8)]*(6-len(panels[i:i+6]));cv2.imwrite(str(V/f'highlight-audit-{i//6+1}.jpg'),np.vstack([np.hstack(group[:2]),np.hstack(group[2:4]),np.hstack(group[4:6])]))
(V/'editorial-validation.json').write_text(json.dumps({'nativeResolution':[1920,1080],'browserZoom':1,'allAppViewsPixelIdenticalBelowHeader':True,'offlineScenariosTested':e['runs'],'normalOutcome':e['normalOutcome'],'earlyStreamOutcome':e['incompleteOutcome'],'browserErrors':e['errors'],'newLiveExecution':False,'highlights':checks},indent=2));print(f'Native app pixels and {len(checks)} highlight targets audited.')
