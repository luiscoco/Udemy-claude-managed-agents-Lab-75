from pathlib import Path
import json,cv2,numpy as np
from presentation_highlights import fit_highlights
R=Path(__file__).resolve().parents[1];P=R/'presentations/managed-agents-lab43-walkthrough';V=R/'videos/managed-agents-lab43-walkthrough'
plan=json.loads((V/'narration-plan.json').read_text(encoding='utf-8'));g=json.loads((P/'.build/video/slides/geometry.json').read_text(encoding='utf-8'));panels=[];audit=[]
for row,geo in zip(plan['slides'],g):
 im=cv2.imread(str(P/f'.build/video/slides/slide-{row["slide"]:02}.png'));assert im.shape[:2]==(1080,1920)
 for c in row['segments']:
  rects=fit_highlights(c['target'],geo,im);view=im.copy()
  for b in rects:
   x,y,w,h=map(int,b['rect']);cv2.rectangle(view,(x,y),(x+w,y+h),(0,0,255),4)
  thumb=cv2.resize(view,(640,360));cv2.putText(thumb,str(row['slide'])+' '+c['id'],(10,348),0,.6,(0,190,255),2);panels.append(thumb);audit.append({'slide':row['slide'],'cue':c['id'],'fitted':rects})
for i in range(0,len(panels),6):
 group=panels[i:i+6]+[np.zeros((360,640,3),np.uint8)]*(6-len(panels[i:i+6]));cv2.imwrite(str(V/f'highlight-audit-{i//6+1}.jpg'),np.vstack([np.hstack(group[:2]),np.hstack(group[2:4]),np.hstack(group[4:6])]))
(V/'geometry-audit.json').write_text(json.dumps(audit,indent=2));print(len(audit),'fitted text highlights')
