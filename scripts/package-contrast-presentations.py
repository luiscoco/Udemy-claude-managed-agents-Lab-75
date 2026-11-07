"""Publish local downloads/previews only after the contrast audit passes."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,zipfile,html,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'presentations'

def main():
 report=json.loads((OUT/'contrast-validation.json').read_text());assert report['decks']==75 and report['remainingLowContrast']==0
 rows=[]
 for n in range(1,76):
  folder=OUT/f'lab{n:02}';audit=json.loads((folder/'contrast-review.json').read_text());target=OUT/audit['path']
  assert hashlib.sha256(target.read_bytes()).hexdigest()==audit['sha256'],(n,'deck changed since colour audit')
  native=json.loads((folder/'contrast-review/native-validation.json').read_text(encoding='utf-8-sig'))
  assert not native['issues'] and not native['unresolvedColours'] and not native['textBoundsIssues'],(n,'native contrast or layout issue')
  style=folder/'style-review.json'
  if style.exists():
   meta=json.loads(style.read_text());meta['deckSha256']=audit['sha256'];meta['contrastVerified']=True;style.write_text(json.dumps(meta,indent=2),encoding='utf8')
  if n<=5:
   # Cover previews are available from the independent PowerPoint contrast check.
   cover=f'lab{n:02}/contrast-review/slide-1.png';title=target.stem.split('Managed-Agents-')[-1].replace('-',' ')
  else:
   cover=f'lab{n:02}/style-review/slide-1.png';title=json.loads(style.read_text()).get('title','Sessions and retained context')
  rows.append({'lab':n,'path':audit['path'],'title':title,'cover':cover,'slides':audit['slides']})
 archive=OUT/'Labs-01-75-PowerPoints.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for row in rows:z.write(OUT/row['path'],f'Lab-{row["lab"]:02}/'+Path(row['path']).name)
 with zipfile.ZipFile(archive) as z:assert len(z.namelist())==75 and z.testzip() is None
 cards=''.join(f'<article><a href="{html.escape(x["path"])}"><img loading="lazy" src="{x["cover"]}" alt="Lab {x["lab"]:02} cover"></a><div><span>LAB {x["lab"]:02}</span><h2>{html.escape(x["title"])}</h2><p>{x["slides"]} slides · contrast reviewed</p><a href="{html.escape(x["path"])}">Open PowerPoint</a></div></article>' for x in rows)
 page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labs 01–75 · Contrast reviewed presentations</title><style>body{{margin:0;background:#f5f3ef;color:#1d252b;font:17px Arial}}header{{background:#1d252b;color:white;padding:45px max(28px,calc((100vw - 1200px)/2))}}h1{{font:42px Cambria,Georgia,serif}}header p{{color:#e9e3dc;max-width:950px;line-height:1.6}}header a{{display:inline-block;background:#c3532d;color:white;padding:14px 22px;border-radius:5px;text-decoration:none}}main{{max-width:1200px;margin:auto;padding:35px 25px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}}article{{background:white;border:1px solid #e8d4c7;border-radius:8px;overflow:hidden}}article img{{display:block;width:100%}}article div{{padding:24px}}span{{color:#a74425;font-size:13px;font-weight:bold}}h2{{font:26px Cambria,Georgia,serif}}article p{{font-size:14px;color:#566574}}article a{{color:#a74425}}</style><header><h1>Labs 01–75</h1><p>All 75 presentations reviewed for text visibility. Dark UML and architecture shapes now use readable inherited text colours. The generator also checks contrast before saving future decks.</p><a href="{archive.name}">Download all 75 PowerPoints</a></header><main>{cards}</main></html>'''
 (OUT/'Labs-01-75.html').write_text(page,encoding='utf8')
 # Refresh the existing course preview sheets now that every changed slide is rendered.
 for start in range(7,76,5):
  items=[]
  for n in range(start,min(start+5,76)):
   r=json.loads((OUT/f'lab{n:02}/style-review.json').read_text())
   for i in [1,r['guiSlides'][0],r['umlSlides'][0],r['workflowOverview'],r['codeSlides'][5],r['liveScenarioSlide']]:items.append((n,i,OUT/f'lab{n:02}/style-review/slide-{i}.png'))
  sheet=Image.new('RGB',(1200,((len(items)+2)//3)*245),'#ddd9d2');d=ImageDraw.Draw(sheet)
  for k,(n,i,path) in enumerate(items):
   im=Image.open(path);im.thumbnail((396,222));x=(k%3)*400;y=(k//3)*245;d.text((x+4,y+4),f'Lab {n:02} / slide {i}',fill='black');sheet.paste(im,(x+2,y+22))
  sheet.save(OUT/f'style-gallery/batch-{start:02}.jpg',quality=92)
 print('Packaged all 75 contrast-reviewed presentations and refreshed collection previews.')
if __name__=='__main__':main()
