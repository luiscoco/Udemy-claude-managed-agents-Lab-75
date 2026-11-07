"""Extract before/after examples from the actual encoded lesson videos."""
from pathlib import Path
import json
import cv2
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
CASES=[('lesson01-overview-setup','2-8'),('lesson02-agents-versions','2-20'),('lesson03-environments','2-3'),('lesson04-sessions','2-2')]

def frame(movie,seconds):
 cap=cv2.VideoCapture(str(movie));cap.set(cv2.CAP_PROP_POS_MSEC,seconds*1000);ok,result=cap.read();cap.release();assert ok
 return Image.fromarray(cv2.cvtColor(result,cv2.COLOR_BGR2RGB))

def main():
 rows=[]
 for number,(name,cueid) in enumerate(CASES,1):
  out=ROOT/'videos'/name;original=out/'before-highlight-revision'
  plan=json.loads((out/'narration-plan.json').read_text());prior=json.loads((original/'timeline.json').read_text());current=json.loads((out/'timeline.json').read_text())
  a=next(c for s in prior['slides'] for c in s['cues'] if c['id']==cueid)
  b=next(c for s in current['slides'] for c in s['cues'] if c['id']==cueid)
  # Same instant and same audio in both versions, including merged paragraph cues.
  seconds=(a['start']+a['end'])/2;rects=a['rects']+b['rects']
  left=max(0,min(r[0] for r in rects)-28);top=max(0,min(r[1] for r in rects)-28)
  right=min(1920,max(r[0]+r[2] for r in rects)+28);bottom=min(1080,max(r[1]+r[3] for r in rects)+28)
  images=[]
  for folder in [original,out]:
   im=frame(folder/plan['outputFile'],seconds).crop((left,top,right,bottom));im.thumbnail((610,300));images.append(im)
  height=max(im.height for im in images)+50;row=Image.new('RGB',(1260,height),'#eeeeee');draw=ImageDraw.Draw(row)
  for i,im in enumerate(images):
   draw.text((i*630+12,12),f'Lesson {number}: '+('Before' if i==0 else 'Revised paragraph highlight'),fill='black');row.paste(im,(i*630+12,40))
  row.save(out/'paragraph-highlight-comparison.jpg');rows.append(row)
 sheet=Image.new('RGB',(1260,sum(row.height for row in rows)),'#eeeeee');y=0
 for row in rows:sheet.paste(row,(0,y));y+=row.height
 sheet.save(ROOT/'videos/lesson-highlights-comparison.jpg')
 print('Saved four encoded-frame comparisons.',flush=True)

if __name__=='__main__':main()
