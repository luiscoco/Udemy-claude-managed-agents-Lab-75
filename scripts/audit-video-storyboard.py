"""Fit all storyboard highlight targets and generate a pre-narration review sheet."""
from pathlib import Path
import argparse,json
import cv2
from PIL import Image,ImageDraw
from presentation_highlights import fit_highlights
parser=argparse.ArgumentParser();parser.add_argument('--project',required=True);args=parser.parse_args()
assert all(char in 'abcdefghijklmnopqrstuvwxyz0123456789.-' for char in args.project)
ROOT=Path(__file__).resolve().parents[1]
V=ROOT/'videos'/args.project;P=ROOT/'presentations'/args.project/'.build/video/slides'
plan=json.loads((V/'narration-plan.json').read_text(encoding='utf-8'))
geometry=json.loads((P/'geometry.json').read_text(encoding='utf-8'))
sheet=Image.new('RGB',(1600,((len(plan['slides'])+3)//4)*250),'#e8e3dc');draw=ImageDraw.Draw(sheet);count=0
for index,row in enumerate(plan['slides']):
    image=cv2.imread(str(P/f'slide-{index+1:02}.png'));assert image.shape[:2]==(1080,1920)
    for segment in row['segments']:
        targets=fit_highlights(segment['target'],geometry[index],image);count+=len(targets)
        for item in targets:
            x,y,w,h=item['rect'];cv2.rectangle(image,(x,y),(x+w,y+h),(36,36,255),3)
    thumb=Image.fromarray(cv2.cvtColor(image,cv2.COLOR_BGR2RGB));thumb.thumbnail((396,223));x,y=index%4*400,index//4*250
    draw.text((x+5,y+4),f'Scene {index+1:02}',fill='black');sheet.paste(thumb,(x+2,y+23))
sheet.save(V/'visual-review.jpg',quality=94)
(V/'visual-validation.json').write_text(json.dumps({'scenes':len(plan['slides']),'measuredTextHighlights':count,'textFitting':'passed'},indent=2),encoding='utf-8')
print(f'All {len(plan["slides"])} scenes and {count} text highlights fitted.')
