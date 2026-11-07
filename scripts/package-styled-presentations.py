"""Verify and package the Lab 06-style course decks and local preview indexes."""
from pathlib import Path
from datetime import datetime,timezone
from PIL import Image,ImageDraw
from pptx import Presentation
import json,zipfile,hashlib,html
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'presentations'

def validate(n):
 folder=OUT/f'lab{n:02}';meta=json.loads((folder/'style-review.json').read_text());file=OUT/meta['path'];p=Presentation(file)
 native=json.loads((folder/'style-review/validation.json').read_text(encoding='utf-8-sig'))
 contrast_path=folder/'contrast-review/native-validation.json'
 if contrast_path.exists():
  contrast=json.loads(contrast_path.read_text(encoding='utf-8-sig'))
  assert not contrast['issues'] and not contrast['unresolvedColours'],(n,'native contrast check')
 assert not native['textOverflow'],(n,'text overflow',native['textOverflow'])
 assert set(native['checkedSlides'])==set(range(1,len(p.slides)+1)),(n,'incomplete native review')
 assert len(meta['codeSlides'])==12 and max(meta['umlSlides'])<meta['workflowOverview']<min(meta['codeSlides'])
 assert max(meta['codeSlides'])<meta['liveScenarioSlide']<meta['challengeSlide']
 assert len(meta['guiSlides'])>=2 and max(meta['guiSlides'])<min(meta['umlSlides'])
 for source in meta['sources']:
  assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256'],(n,'changed source',source['path'])
 for step in meta['steps']:
  if step.get('sourceExcerpt'):assert step['sourceExcerpt'] in (ROOT/step['path']).read_text(encoding='utf8'),(n,step['title'],'changed excerpt')
 for i,s in enumerate(p.slides,1):
  assert s.has_notes_slide and 'Sources' in s.notes_slide.notes_text_frame.text,(n,i,'source notes')
  assert (folder/f'style-review/slide-{i}.png').exists(),(n,i,'missing render')
  for x in s.shapes:
   assert x.left>=0 and x.top>=0 and x.left+x.width<=p.slide_width+1000 and x.top+x.height<=p.slide_height+1000,(n,i,x.name,'slide bounds')
   if x.shape_type==13:assert all(getattr(x,'crop_'+side)==0 for side in ['left','right','top','bottom']),(n,i,'GUI image cropped')
 with zipfile.ZipFile(file) as z:assert z.testzip() is None and len(z.namelist())==len(set(z.namelist())),(n,'invalid PowerPoint package')
 meta['deckSha256']=hashlib.sha256(file.read_bytes()).hexdigest()
 (folder/'style-review.json').write_text(json.dumps(meta,indent=2),encoding='utf8')
 # A compact contact sheet lets students/reviewers inspect the whole deck.
 sheet=Image.new('RGB',(1600,((len(p.slides)+4)//5)*202),'#ddd9d2');d=ImageDraw.Draw(sheet)
 for i in range(1,len(p.slides)+1):
  im=Image.open(folder/f'style-review/slide-{i}.png');im.thumbnail((316,178));x=((i-1)%5)*320;y=((i-1)//5)*202
  d.text((x+4,y+3),f'Slide {i}',fill='black');sheet.paste(im,(x+2,y+22))
 sheet.save(folder/'style-review/all-slides.jpg',quality=92)
 return {'lab':n,'title':meta['title'],'path':meta['path'],'slides':len(p.slides),'codeSteps':12,'guiSnapshots':len(meta['guiSlides']),'umlViews':len(meta['umlSlides']),'workflowOverview':meta['workflowOverview'],'liveBoundary':meta['liveScenario']['status'],'sha256':meta['deckSha256']}

def package(rows,first):
 selected=[x for x in rows if x['lab']>=first]
 zip_path=OUT/f'Labs-{first:02}-75-PowerPoints.zip'
 with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
  for row in selected:
   file=OUT/row['path'];z.write(file,f'Lab-{row["lab"]:02}/{file.name}')
 with zipfile.ZipFile(zip_path) as z:assert len(z.namelist())==len(selected) and z.testzip() is None
 cards=[]
 for row in selected:
  folder=f'lab{row["lab"]:02}/style-review'
  cards.append(f'''<article><a href="{html.escape(row['path'])}"><img loading="lazy" src="{folder}/slide-1.png" alt="Lab {row['lab']:02} cover"></a><div class="body"><span>LAB {row['lab']:02}</span><h2>{html.escape(row['title'])}</h2><p>{row['slides']} slides · 12 numbered code steps · {row['umlViews']} UML views</p><nav><a href="{html.escape(row['path'])}">PowerPoint</a><a href="{folder}/all-slides.jpg">All slides</a><a href="{folder}/slide-{row['workflowOverview']}.png">Workflow</a></nav></div></article>''')
 page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labs {first:02}–75 · Lab 06 presentation style</title><style>
 *{{box-sizing:border-box}}body{{margin:0;background:#f5f3ef;color:#1d252b;font:17px Arial}}header{{background:#1d252b;color:white}}header>div,main{{max-width:1250px;margin:auto;padding:44px 28px}}h1{{font:42px Cambria,Georgia,serif;margin:18px 0}}header span,article span{{color:#e9a079;font-weight:bold;font-size:13px}}header p{{max-width:920px;line-height:1.6;color:#e9e3dc}}.download{{display:inline-block;background:#c3532d;color:white;padding:15px 22px;text-decoration:none;border-radius:5px;margin-top:12px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:24px}}article{{background:white;border:1px solid #e8d4c7;border-radius:8px;overflow:hidden}}article img{{width:100%;display:block}}.body{{padding:23px}}article span{{color:#c3532d}}h2{{font:26px Cambria,Georgia,serif;line-height:1.2}}article p{{font-size:14px;line-height:1.5;color:#566574}}nav{{display:flex;gap:18px;flex-wrap:wrap}}nav a{{color:#a74425;font-size:14px}}.status{{margin-bottom:32px;line-height:1.6;max-width:1000px}}</style>
 <header><div><span>CLAUDE MANAGED AGENTS · APPROVED LAB 06 FORMAT</span><h1>Labs {first:02}–75</h1><p>{len(selected)} presentations with the approved cover, readable GUI walkthrough, detailed application UML, twelve numbered workflow cards, and one matching code slide per step with architecture highlights.</p><a class="download" href="{zip_path.name}">Download {len(selected)} PowerPoints</a></div></header><main><p class="status">Every slide was rendered and checked in native PowerPoint. Source fingerprints, excerpts, slide order and uncropped screenshot placement were verified. Live-scenario slides describe actual implementation boundaries and acceptance checks; they do not claim completed provider tests. Current live setup is not ready.</p><div class="grid">{''.join(cards)}</div></main></html>'''
 (OUT/f'Labs-{first:02}-75.html').write_text(page,encoding='utf8')
 report={'at':datetime.now(timezone.utc).isoformat(),'reference':'Approved Lab 06 presentation','decks':len(selected),'slides':sum(x['slides'] for x in selected),'codeSteps':12*len(selected),'guiSnapshots':sum(x['guiSnapshots'] for x in selected),'umlViews':sum(x['umlViews'] for x in selected),'nativePowerPointTextOverflows':0,'liveExecution':'Not performed; readiness is false. Acceptance procedures and integration boundaries are included.','lab07OfflineTestsPassed':7,'presentations':selected}
 (OUT/f'Labs-{first:02}-75-validation.json').write_text(json.dumps(report,indent=2),encoding='utf8')
 print(f'Packaged Labs {first:02}–75: {len(selected)} decks, {report["slides"]} slides, {report["codeSteps"]} code steps.',flush=True)

if __name__=='__main__':
 rows=[validate(n) for n in range(7,76)]
 for first in [7,8,23]:package(rows,first)
