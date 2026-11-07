"""Inspect text against its actual filled backdrop without mutating colour reads.

PowerPoint treats an empty run-level solidFill as black rather than inheriting the
paragraph colour. Remove those invalid overrides before checking contrast.
"""
from pathlib import Path
from datetime import datetime,timezone
import argparse,json,hashlib,colorsys
from pptx import Presentation
from pptx.oxml.ns import qn
from pptx.dml.color import RGBColor

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'presentations'
def luminance(rgb):
 values=[int(rgb[i:i+2],16)/255 for i in (0,2,4)]
 values=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values]
 return sum(a*b for a,b in zip(values,[.2126,.7152,.0722]))
def contrast(a,b):
 x,y=sorted([luminance(a),luminance(b)]);return (y+.05)/(x+.05)
def theme_colours(p):
 result={'dk1':'000000','lt1':'FFFFFF','dk2':'1F497D','lt2':'EEECE1'}
 part=next((part for part in p.part.package.iter_parts() if str(part.partname)=='/ppt/theme/theme1.xml'),None)
 if part:
  from lxml import etree
  root=etree.fromstring(part.blob)
  scheme=next(root.iter(qn('a:clrScheme')),None)
  if scheme is not None:
   for node in scheme:
    if len(node):result[node.tag.split('}')[-1]]=node[0].get('val') if node[0].tag==qn('a:srgbClr') else node[0].get('lastClr','000000')
 result.update({'tx1':result['dk1'],'bg1':result['lt1'],'tx2':result['dk2'],'bg2':result['lt2']})
 return result
def colour(parent,theme,empty='000000'):
 if parent is None:return None
 fill=parent.find(qn('a:solidFill'))
 if fill is None:return None
 if not len(fill):return empty
 node=fill[0];tag=node.tag.split('}')[-1]
 if tag=='srgbClr':rgb=node.get('val')
 elif tag=='schemeClr':rgb=theme.get(node.get('val'),'000000')
 elif tag=='sysClr':rgb=node.get('lastClr','000000')
 elif tag=='prstClr':rgb={'white':'FFFFFF','black':'000000'}.get(node.get('val'),'000000')
 else:return None
 channels=[int(rgb[i:i+2],16)/255 for i in (0,2,4)]
 for transform in node:
  key=transform.tag.split('}')[-1];value=int(transform.get('val','100000'))/100000
  if key=='tint':channels=[v+(1-v)*value for v in channels]
  elif key=='shade':channels=[v*value for v in channels]
  elif key in ['lumMod','lumOff']:
   h,l,s=colorsys.rgb_to_hls(*channels);l=l*value if key=='lumMod' else l+value;channels=list(colorsys.hls_to_rgb(h,max(0,min(l,1)),s))
 return ''.join(f'{round(max(0,min(1,v))*255):02X}' for v in channels)
def shape_fill(shape,theme):
 props=shape._element.find(qn('p:spPr'))
 return colour(props,theme,empty=None)
def contains(shape,x,y):
 if not (shape.left<=x<=shape.left+shape.width and shape.top<=y<=shape.top+shape.height):return False
 geom=shape._element.find('.//'+qn('a:prstGeom'))
 if geom is not None and geom.get('prst')=='diamond':
  return abs((x-shape.left)/shape.width-.5)*2+abs((y-shape.top)/shape.height-.5)*2<=1
 return True
def background(s,shape,index,theme):
 own=shape_fill(shape,theme)
 if own:return own
 x=shape.left+shape.width/2;y=shape.top+shape.height/2
 for other in reversed(list(s.shapes)[:index]):
  fill=shape_fill(other,theme)
  if fill and contains(other,x,y):return fill
 # Earlier decks inherit their cover/end-card background from the slide layout.
 for owner in [s._element,s.slide_layout._element,s.slide_layout.slide_master._element]:
  bg=owner.find('.//'+qn('p:bgPr'))
  value=colour(bg,theme,empty=None)
  if value:return value
 return 'FFFFFF'
def strip_empty_overrides(p):
 changed={};count=0
 for i,s in enumerate(p.slides,1):
  for shape in s.shapes:
   for fill in list(shape._element.iter(qn('a:solidFill'))):
    # Only text formatting, never geometry fills or line colours.
    if not len(fill) and fill.getparent().tag in [qn('a:rPr'),qn('a:defRPr'),qn('a:endParaRPr')]:
     fill.getparent().remove(fill);changed.setdefault(i,[]).append(shape.name);count+=1
 return changed,count
def inspect(p,fix=False):
 theme=theme_colours(p);findings=[];review=[];spans=0
 for i,s in enumerate(p.slides,1):
  for j,shape in enumerate(s.shapes):
   if not shape.has_text_frame or not shape.text.strip():continue
   bg=background(s,shape,j,theme)
   review.append({'slide':i,'shapeIndex':j+1,'shape':shape.name,'background':bg,'text':shape.text[:160],'dark':luminance(bg)<.20})
   for paragraph in shape.text_frame.paragraphs:
    ppr=paragraph._p.find(qn('a:pPr'));default=ppr.find(qn('a:defRPr')) if ppr is not None else None
    for run in paragraph.runs:
     if not run.text.strip():continue
     props=run._r.find(qn('a:rPr'))
     fg=colour(props,theme) or colour(default,theme) or theme['tx1'];ratio=contrast(fg,bg);spans+=1
     if ratio<3:
      replacement=max(['FFFFFF','1D252B'],key=lambda v:contrast(v,bg))
      findings.append({'slide':i,'shape':shape.name,'text':run.text[:160],'foreground':fg,'background':bg,'ratio':round(ratio,2),'replacement':replacement,'replacementRatio':round(contrast(replacement,bg),2)})
      if fix:run.font.color.rgb=RGBColor.from_string(replacement)
 return findings,review,spans
def repair(p):
 changed,count=strip_empty_overrides(p)
 findings,_,_=inspect(p,fix=True)
 for finding in findings:changed.setdefault(finding['slide'],[]).append(finding['shape'])
 return changed,count,findings
def main(fix):
 decks=[]
 for folder in sorted(OUT.glob('lab[0-9][0-9]')):
  files=list((folder/'output').glob('*.pptx'))
  if not files:continue
  target=files[0];p=Presentation(target)
  before,_,_=inspect(p)
  changed,count,extra=repair(p) if fix else ({},0,[])
  if changed:p.save(target)
  after,shapes,spans=inspect(p)
  item={'lab':int(folder.name[3:]),'path':target.relative_to(OUT).as_posix(),'slides':len(p.slides),'textSpansReviewed':spans,'emptyOverridesRemoved':count,'changedSlides':sorted(changed),'lowContrastBefore':len(before),'additionalColourFixes':extra,'remainingLowContrast':after,'shapeBackgrounds':shapes,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
  (folder/'contrast-review.json').write_text(json.dumps(item,indent=2),encoding='utf8');decks.append({k:v for k,v in item.items() if k!='shapeBackgrounds'})
  print(f'{folder.name}: {count} empty overrides removed; {len(extra)} colour corrections; {len(after)} low-contrast spans remain.',flush=True)
 report={'at':datetime.now(timezone.utc).isoformat(),'decks':len(decks),'slides':sum(x['slides'] for x in decks),'affectedDecks':sum(bool(x['changedSlides']) for x in decks),'changedSlides':sum(len(x['changedSlides']) for x in decks),'emptyOverridesRemoved':sum(x['emptyOverridesRemoved'] for x in decks),'remainingLowContrast':sum(len(x['remainingLowContrast']) for x in decks),'presentations':decks}
 (OUT/'contrast-validation.json').write_text(json.dumps(report,indent=2),encoding='utf8')
 print(json.dumps({k:v for k,v in report.items() if k!='presentations'}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--fix',action='store_true');main(parser.parse_args().fix)
