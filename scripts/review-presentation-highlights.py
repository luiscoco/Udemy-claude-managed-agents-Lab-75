"""Review every text-fitting target before encoding a course video."""
import argparse,json,re
from pathlib import Path
import cv2
from PIL import Image,ImageDraw
from presentation_highlights import fit_highlights

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--lab',type=int,default=1);parser.add_argument('--project');parser.add_argument('--plan',action='store_true');args=parser.parse_args()
 root=Path(__file__).resolve().parents[1];name=args.project or f'lab{args.lab:02}';assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',name);slides=root/f'presentations/{name}/.build/video/slides';out=root/f'videos/{name}/highlight-review';out.mkdir(exist_ok=True)
 geometry=json.loads((slides/'geometry.json').read_text(encoding='utf-8-sig'));manifest=json.loads((out.parent/('narration-plan.json' if args.plan else 'recording-manifest.json')).read_text());audit=[];proofs=[]
 for row,g in zip(manifest['slides' if args.plan else 'recordings'],geometry):
  image=cv2.imread(str(slides/f"slide-{row['slide']:02}.png"))
  for cue in row['segments' if args.plan else 'cues']:
   fitted=fit_highlights(cue['target'],g,image);proof=image.copy()
   for item in fitted:
    x,y,w,h=item['rect'];cv2.rectangle(proof,(x,y),(x+w-1,y+h-1),(36,36,255),4)
   filename=f"slide-{row['slide']:02}-cue-{cue['id'].split('-')[-1]}.jpg";cv2.imwrite(str(out/filename),proof)
   audit.append({'slide':row['slide'],'cue':cue['id'],'fits':fitted});proofs.append((cue['id'],out/filename))
  print(f"Fitted slide {row['slide']:02}.",flush=True)
 if args.lab==1 and not args.project:
  challenge=next(x for x in audit if x['cue']=='27-2');assert challenge['fits'][0]['rect'][3]<65 and challenge['fits'][0]['rect'][2]<1200
 (out/'fit-audit.json').write_text(json.dumps(audit,indent=2))
 sheet=Image.new('RGB',(1600,((len(proofs)+3)//4)*250),'#e8e3dc');draw=ImageDraw.Draw(sheet)
 for k,(label,proof) in enumerate(proofs):
  with Image.open(proof) as source:im=source.copy()
  im.thumbnail((396,223));x=k%4*400;y=k//4*250;draw.text((x+5,y+4),label,fill='black');sheet.paste(im,(x+2,y+23))
 sheet.save(out/'all-highlights.jpg',quality=93)
 print(f"Reviewed {len(audit)} cues and {sum(len(x['fits']) for x in audit)} fitted rectangles.",flush=True)
if __name__=='__main__':main()
