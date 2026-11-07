"""Apply measured layout refinements without reducing the approved font sizes."""
from pathlib import Path
import json,importlib.util,sys,re
from pptx import Presentation
from pptx.util import Inches
from pptx.opc.packuri import PackURI
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('course_style',ROOT/'scripts/style-course-presentations.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def repair(n):
 folder=ROOT/f'presentations/lab{n:02}';audit=json.loads((folder/'style-review.json').read_text());p=Presentation(ROOT/'presentations'/audit['path']);changed=set()
 for index in audit['umlSlides']:
  slide=p.slides[index-1]
  if not slide.has_notes_slide:
   slide.notes_slide.notes_text_frame.text='Checked module dependencies and implementation boundaries. The component view does not add a runtime request.\n\nSources:\n'+'\n'.join(v['path'] for v in audit['sources'])
   changed.add(index)
 for item,index in zip(audit['steps'],audit['codeSlides']):
  raw=item.get('sourceExcerpt')
  if raw:
   if item.get('gate'):
    review=json.loads((folder/'uml-source-review.json').read_text());terms=set(re.findall(r'\w+',review['gate']['terms']))
    anchor=max(review['gateSourceAnchors'],key=lambda a:len(terms&set(re.findall(r'\w+',a['text']))))
    item.update(path=anchor['path'],line=anchor['line']);lines=(ROOT/item['path']).read_text(encoding='utf8').splitlines();raw='\n'.join(lines[item['line']-1:item['line']+16]);item['sourceExcerpt']=raw
   code=m.format_code(raw)
   if code!=item['code'] or item.get('gate'):
    slide=p.slides[index-1]
    shape=next(x for x in slide.shapes if x.has_text_frame and abs(x.top-Inches(2.43))<1000)
    shape.text_frame.paragraphs[0].text=code;item['code']=code;changed.add(index)
    if item.get('gate'):
     label=next(x for x in slide.shapes if x.has_text_frame and abs(x.top-Inches(2.0))<1000)
     label.text_frame.paragraphs[0].text=m.draw('wrap',item['path']+f' · L{item["line"]} (excerpt)',5.55*72-12,11.5,'arialbd.ttf')
     slide.notes_slide.notes_text_frame.text='Checked decision: '+item['body']+'\n\nSource excerpt:\n'+raw+'\n\nSources:\n'+item['path']
 # Longer objectives retain 21 pt, using the spare room above the cover cards.
 shape=next(x for x in p.slides[0].shapes if x.has_text_frame and abs(x.top-Inches(3.62))<1000)
 if shape.height<Inches(1.27):shape.height=Inches(1.27);changed.add(1)
 report=folder/'style-review/validation.json'
 if report.exists():
  data=json.loads(report.read_text(encoding='utf-8-sig'))
  for issue in data['textOverflow']:
   index=issue['slide'];slide=p.slides[index-1];shape=next(x for x in slide.shapes if x.name==issue['shape'])
   # Formatter changes above supersede previous measurements of the code body.
   if abs(shape.top-Inches(2.43))<1000:continue
   if issue['boundHeight']>issue['height']+2:
    desired=Inches((issue['boundHeight']+3)/72)
    limit=Inches(6.95)
    for other in slide.shapes:
     if other==shape or not other.has_text_frame or not other.text:continue
     if other.top>=shape.top+shape.height-Inches(.01) and other.left<shape.left+shape.width and other.left+other.width>shape.left:limit=min(limit,other.top-Inches(.025))
    if shape.top+desired<limit:shape.height=desired;changed.add(index)
    elif index in audit['codeSlides'] and shape.left<Inches(6.4) and shape.top>Inches(1.7):
     # Give a four-line explanation room, then move subsequent bullets down.
     delta=desired-shape.height+Inches(.025);old_bottom=shape.top+shape.height
     followers=[x for x in slide.shapes if x!=shape and x.has_text_frame and x.text and x.left<Inches(6.4) and old_bottom<=x.top<Inches(6.0)]
     if all(x.top+x.height+delta<Inches(6.15) for x in followers):
      shape.height=desired
      for other in followers:other.top+=delta
      changed.add(index)
   if issue['boundWidth']>issue['width']+2:
    desired=Inches((issue['boundWidth']+3)/72)
    limit=p.slide_width-Inches(.5)
    if shape.left<Inches(6.5) and index in audit['codeSlides']:limit=Inches(6.4)
    for other in slide.shapes:
     if other==shape or other.left<shape.left+shape.width-Inches(.01):continue
     if other.top<shape.top+shape.height and other.top+other.height>shape.top:limit=min(limit,other.left-Inches(.05))
    if shape.left+desired<limit:shape.width=desired;changed.add(index)
 if changed:
  for i,slide in enumerate(p.slides,1):
   if slide.has_notes_slide:slide.notes_slide.part._partname=PackURI(f'/ppt/notesSlides/notesSlide{i}.xml')
  p.save(ROOT/'presentations'/audit['path']);audit['layoutRepairedSlides']=sorted(set(audit.get('layoutRepairedSlides',[]))|changed)
  (folder/'style-review.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
 print(f'Lab {n}: {len(changed)} slides refined; font sizes preserved.',flush=True)

if __name__=='__main__':
 first=int(sys.argv[1]);last=int(sys.argv[2]) if len(sys.argv)>2 else first
 for n in range(first,last+1):repair(n)
