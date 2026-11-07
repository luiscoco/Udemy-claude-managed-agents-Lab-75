"""Repair measured text bounds using spare space, preserving font sizes."""
from pathlib import Path
import importlib.util, json
from pptx import Presentation
from pptx.util import Inches
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('review',ROOT/'scripts/improve-course-uml.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def repair(n):
    folder=ROOT/f'presentations/lab{n:02}'
    review=json.loads((folder/'uml-source-review.json').read_text(encoding='utf8'))
    target=ROOT/'presentations'/review['path'];p=Presentation(target);changes=[]
    for index in review['umlSlides']:
        s=p.slides[index-1]
        for shape in s.shapes:
            if shape.has_text_frame and abs(shape.top-Inches(1.81))<1000:
                value=m.short(shape.text,130,10.5)
                if value!=shape.text:
                    shape.text_frame.paragraphs[0].text=value
                    changes.append({'slide':index,'shape':shape.name,'fix':'participant detail kept to one readable line'})
        if any(x.has_text_frame and x.text.startswith('Decision:') for x in s.shapes):
            for shape in s.shapes:
                if shape.shape_type==1 and shape.auto_shape_type==MSO_AUTO_SHAPE_TYPE.DIAMOND:
                    shape.left=Inches(4.115);shape.width=Inches(5.1)
                elif shape.has_text_frame and abs(shape.top-Inches(3.28))<1000:
                    shape.left=Inches(4.865);shape.top=Inches(3.26);shape.width=Inches(3.6);shape.height=Inches(.6)
                    shape.text_frame.paragraphs[0].text=review['gate']['question']
                    shape.text_frame.vertical_anchor=MSO_ANCHOR.MIDDLE
                elif hasattr(shape,'begin_x') and abs(shape.begin_y-Inches(3.56))<1000 and abs(shape.end_y-Inches(3.56))<1000:
                    if abs(shape.begin_x-Inches(4.82))<1000:shape.begin_x=Inches(4.115)
                    elif abs(shape.begin_x-Inches(8.51))<1000:shape.begin_x=Inches(9.215)
            changes.append({'slide':index,'fix':'room for a centered two-line decision; font unchanged'})
    report=ROOT/f'presentations/uml-review/lab{n:02}/validation.json'
    if report.exists():
        data=json.loads(report.read_text(encoding='utf-8-sig'))
        for item in data['textOverflow']:
            s=p.slides[item['slide']-1]
            shape=next((x for x in s.shapes if x.name==item['shape']),None)
            if shape is None or not shape.has_text_frame:continue
            if item['boundWidth']>item['width']+3:
                # A wider box can admit another word and still overflow in PowerPoint.
                # Reflow roomy prose using explicit line breaks; keep its original font.
                sizes=[v for paragraph in shape.text_frame.paragraphs for v in
                       [paragraph.font.size]+[run.font.size for run in paragraph.runs] if v]
                size=max(sizes).pt if sizes else 18
                prose=' '.join(shape.text.split())
                reflow=m.wrap(prose,shape.width/12700-18,size*1.08)
                if '\n' in reflow and len(reflow.splitlines())*size*1.3<shape.height/12700-3:
                    shape.text_frame.paragraphs[0].text=reflow
                    changes.append({'slide':item['slide'],'shape':shape.name,'fix':'explicit prose line breaks; font unchanged'})
                # Use the actual measured requirement only where no neighboring panel is crossed.
                desired=Inches((item['boundWidth']+2)/72)
                right=p.slide_width-Inches(.5)
                panels=[x for x in s.shapes if x!=shape and not (x.has_text_frame and x.text) and x.width>Inches(1.4) and x.height>Inches(.45)]
                parents=[x for x in panels if x.left<=shape.left and x.top<=shape.top and x.left+x.width>=shape.left+shape.width and x.top+x.height>=shape.top+shape.height]
                if parents:right=min(parents,key=lambda x:x.width*x.height).left+min(parents,key=lambda x:x.width*x.height).width-Inches(.08)
                else:
                    for panel in panels:
                        if panel.left>=shape.left+shape.width-Inches(.03) and panel.top<shape.top+shape.height and panel.top+panel.height>shape.top:
                            right=min(right,panel.left-Inches(.15))
                if shape.left+desired<=right:
                    shape.width=desired;changes.append({'slide':item['slide'],'shape':shape.name,'fix':'width from native measurement; font unchanged'})
            if item['boundHeight']>item['height']+3:
                if item['uml'] and abs(shape.top-Inches(3.26))<1000:
                    continue
                if item['uml'] and abs(shape.top-Inches(1.81))<1000:
                    shape.text_frame.paragraphs[0].text=m.short(shape.text,130,10.5)
                    changes.append({'slide':item['slide'],'shape':shape.name,'fix':'compact participant detail; full identifier in notes'})
                else:
                    desired=Inches((item['boundHeight']+2)/72);bottom=Inches(6.95)
                    for other in s.shapes:
                        if other==shape or not other.has_text_frame or not other.text:continue
                        if other.top>=shape.top+shape.height-Inches(.02) and other.left<shape.left+shape.width and other.left+other.width>shape.left:
                            bottom=min(bottom,other.top-Inches(.06))
                    if shape.top+desired<=bottom:
                        shape.height=desired;changes.append({'slide':item['slide'],'shape':shape.name,'fix':'height from native measurement; font unchanged'})
    # Apply live-specific teaching corrections without rebuilding previously fitted GUI/code slides.
    live=p.slides[review['liveSlide']-1];case=m.live_content.scenario(n)
    if case!=review.get('liveScenario'):
        for i,(_,body) in enumerate(case['cards']):
            x=Inches(.85+(i%2)*5.95+.24);y=Inches(1.7+(i//2)*2.30+.86)
            shape=next(xshape for xshape in live.shapes if xshape.has_text_frame and abs(xshape.left-x)<1000 and abs(xshape.top-y)<1000)
            shape.text_frame.paragraphs[0].text=m.wrap(body,5.17*72-6,17)
        live.notes_slide.notes_text_frame.text += '\n\nUpdated live cleanup guidance:\n'+'\n'.join(h+': '+body for h,body in case['cards'])
        review['liveScenario']=case;changes.append({'slide':review['liveSlide'],'fix':'lesson-specific live cleanup guidance'})
    if changes:
        p.save(target)
        review.setdefault('layoutRepairs',[]).extend(changes)
        (folder/'uml-source-review.json').write_text(json.dumps(review,indent=2),encoding='utf8')
        print(f'Lab {n}: {len(changes)} layout/content refinements',flush=True)
    return changes

if __name__=='__main__':
    import sys
    first=int(sys.argv[1]) if len(sys.argv)>1 else 8;last=int(sys.argv[2]) if len(sys.argv)>2 else 75
    for n in range(first,last+1):repair(n)
