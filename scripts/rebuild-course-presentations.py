"""Build Labs 07–75 from the repository's lesson metadata and code tours.

The code tour catalog is checked against its source hash before use. GUI views
are existing offline captures. No live operations or screenshots are generated.
"""
from __future__ import annotations
import hashlib, json, math, re, textwrap
from pathlib import Path
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Inches, Pt
import importlib.util

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('common', ROOT/'scripts/build-lesson-presentations.py')
b=importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
CONTENT=json.loads((ROOT/'presentations/lesson-content.json').read_text(encoding='utf-8'))
TOURS={x['lessonId']:x for x in json.loads((ROOT/'public/code-tours/catalog.json').read_text(encoding='utf-8'))['tours']}

def flat(shape):
    style=shape._element.find('{http://schemas.openxmlformats.org/presentationml/2006/main}style')
    if style is not None: shape._element.remove(style)
    return shape

def rect(s,x,y,w,h,fill,line=None,rounded=False):
    shape=s.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if rounded else MSO_AUTO_SHAPE_TYPE.RECTANGLE,Inches(x),Inches(y),Inches(w),Inches(h))
    if rounded: shape.adjustments[0]=.035
    shape.fill.solid();shape.fill.fore_color.rgb=RGBColor.from_string(fill)
    if line: shape.line.color.rgb=RGBColor.from_string(line)
    else: shape.line.fill.background()
    return flat(shape)

def heading(s,title,label,n,number):
    b.bg(s,'F5F4EF');rect(s,0,0,.13,7.5,'28594A')
    b.textbox(s,.62,.3,11.9,.64,title,26,b.INK,True,'Georgia')
    b.textbox(s,.65,1.05,11.6,.24,label.upper(),10,'C65330',True)
    rect(s,.65,1.36,12.02,.018,'D8DFD8')
    b.textbox(s,.65,7.12,10,.19,f'LAB {n:02}  /  CLAUDE MANAGED AGENTS',9,'64766E')
    b.textbox(s,12.28,7.1,.4,.22,f'{number:02}',10,'64766E',True)

def card(s,x,y,w,h,title,body):
    rect(s,x,y,w,h,'FFFFFF','D8E0D9',True);rect(s,x+.24,y+.24,.44,.055,'D36A45')
    b.textbox(s,x+.24,y+.43,w-.48,.4,title.upper(),12,'B94E30',True)
    b.textbox(s,x+.24,y+1.02,w-.48,h-1.2,body,19,'20312B')

def find_route(tour,source,ui):
    route=next((s for s in tour['sections'] if s['title'].startswith('POST /')),None)
    if not route: return None,None
    region='\n'.join(source.splitlines()[route['startLine']-1:route['endLine']])
    endpoint=route['title'][5:]
    # Only state a specific endpoint if the UI source contains it.
    ui_label=endpoint if '{' not in endpoint and endpoint in ui else None
    imports=[]
    for group in re.findall(r'import\s*\{([^}]+)\}\s*from\s*[\'"](?:\.\./)+lib/[^\'"]+[\'"]',source,re.S):
        imports.extend(re.findall(r'\b(?:run|execute|create|dispatch|enqueue|start|process|handle)[A-Z]\w*\b',group))
    call=next((name for name in imports if re.search(r'\b'+re.escape(name)+r'\s*\(',region)),None)
    return ui_label,call

def diagram(s,n,endpoint,call):
    xs=[1.45,4.8,8.15,11.55]; names=[('User',''),('React UI',f'Lab {n:02} component'),('Express route',f'/api/c{n}'),('Host logic','selected operation')]
    for i,(x,(name,detail)) in enumerate(zip(xs,names)):
        rect(s,x-1.3,1.5,2.6,.55,'C65330' if i==2 else '1C302A',None,True)
        b.textbox(s,x-1.13,1.56,2.26,.22,name,13,'FFFFFF',True)
        if detail:b.textbox(s,x-1.13,1.8,2.26,.18,detail,9,'FFFFFF',True)
        line=flat(s.shapes.add_connector(1,Inches(x),Inches(2.06),Inches(x),Inches(6.55)))
        line.line.color.rgb=RGBColor.from_string('9AAFA5');line.line.width=Pt(.8);line.line.dash_style=MSO_LINE_DASH_STYLE.DASH
    messages=[(0,1,'Choose an exercise action',False),(1,2,('Request '+endpoint) if endpoint else 'Send an exercise request',False)]
    if call: messages += [(2,3,'May call '+call+'()',False),(3,2,'Return operation result',True)]
    messages += [(2,1,'Return response or progress',True),(1,0,'Render the observed result',True)]
    for i,(src,dst,label,returned) in enumerate(messages):
        y=2.45+i*.64;x1,x2=xs[src],xs[dst]
        line=flat(s.shapes.add_connector(1,Inches(x1),Inches(y),Inches(x2),Inches(y)))
        line.line.color.rgb=RGBColor.from_string('617C70' if returned else '203A30');line.line.width=Pt(1.1)
        if returned:line.line.dash_style=MSO_LINE_DASH_STYLE.DASH
        end=OxmlElement('a:tailEnd');end.set('type','triangle');line._element.spPr.ln.append(end)
        b.textbox(s,min(x1,x2)+.08,y-.3,abs(x2-x1)-.16,.28,f'{i+1}. {label}',12,'41594D' if returned else '1C252C',True)

def selected_excerpt(lines,section):
    start,end=section['startLine'],section['endLine']; candidates=[]
    for index in range(start-1,min(end,len(lines))):
        text=lines[index].strip()
        if not text or text in ('}', '};', '});') or len(text)>160: continue
        weight=0 if re.search(r'\b(router\.(?:post|get)|safeParse|await|return|status|run\w+|const router)\b',text) else 1
        if text.startswith('import '): weight=2
        wrapped=textwrap.wrap(text,width=35,break_long_words=True,break_on_hyphens=False,replace_whitespace=False,drop_whitespace=False) or ['']
        if len(wrapped)<=6:candidates.append((weight,index+1,wrapped))
    if not candidates:
        index=start-1; raw=lines[index].strip(); wrapped=textwrap.wrap(raw,width=35,break_long_words=True,break_on_hyphens=False)
        # In the unusual case of a very long single line, do not imply the partial line is executable.
        return '\n'.join(wrapped[:6])+('\n…' if len(wrapped)>6 else ''),start,'partial line' if len(wrapped)>6 else 'source line'
    _,number,wrapped=min(candidates,key=lambda item:(item[0],item[1]))
    return '\n'.join(wrapped),number,'source line'

def step_title(section,index):
    title=section['title']
    if title=='Concept and dependencies': return 'Identify the lesson components'
    if title=='Create the concept router': return 'Initialize the host router'
    if title=='Return the module contract': return 'Return the router and cleanup'
    if title=='Decision and early response':
        found=re.search(r'HTTP (\d+)',section['text'])
        return ('Check the HTTP '+found.group(1)+' branch') if found else 'Check an early response'
    if title.startswith('POST '): return 'Handle '+title
    return title

def build(n):
    info=CONTENT[str(n)];tour=TOURS[n];source_path=ROOT/tour['path']
    data=source_path.read_bytes().replace(b'\r\n',b'\n')
    if hashlib.sha256(data).hexdigest()!=tour['sourceSha256']: raise ValueError(f'Stale code tour for Lab {n}')
    source=data.decode('utf-8');lines=source.splitlines()
    ui_path=next((ROOT/'src/concepts').glob(f'Concept{n:02}*.tsx')); ui=ui_path.read_text(encoding='utf-8')
    guides=list(ROOT.glob(f'Tab{n}-*.md'));assert len(guides)==1
    title=b.clean(guides[0].read_text(encoding='utf-8').splitlines()[0].lstrip('# '));title=re.sub(r'^Lab\s*\d+\s*[:—–-]\s*','',title,flags=re.I)
    prs=Presentation();prs.slide_width=Inches(13.333333);prs.slide_height=Inches(7.5); blank=prs.slide_layouts[6]
    def slide(t,label):
        s=prs.slides.add_slide(blank);heading(s,t,label,n,len(prs.slides));return s
    s=prs.slides.add_slide(blank);b.bg(s,'172A25');rect(s,0,0,.14,7.5,'E5744A')
    b.textbox(s,.85,.72,7.3,.35,f'CLAUDE MANAGED AGENTS  /  LAB {n:02}',13,'EAA185',True)
    b.textbox(s,.85,1.55,7.5,1.8,title,34,'FFFFFF',True,'Georgia')
    b.textbox(s,.9,4.0,7.2,1.5,info['objective'],19,'D8E5DB')
    rect(s,8.75,1.25,3.65,4.9,'23453A','3A6152',True)
    for y,num,label in [(1.75,'01','EXPLORE THE GUI'),(2.75,'02','TRACE THE FLOW'),(3.75,'03','READ THE CODE'),(4.75,'04','TRY THE CHALLENGE')]:
        b.textbox(s,9.1,y,.55,.4,num,15,'F1A083',True);b.textbox(s,9.85,y,2.25,.55,label,15,'FFFFFF',True)
    # Present actual lesson-specific controls and student observations.
    for offset in range(0,len(info['steps']),3):
        group=info['steps'][offset:offset+3];s=slide('Explore the exercise','GUI · lesson actions and evidence')
        count=len(group);w=3.85 if count==3 else 5.84 if count==2 else 11.9;gap=.18;start=(13.333-(count*w+(count-1)*gap))/2
        for i,item in enumerate(group):card(s,start+i*(w+gap),1.75,w,4.5,f'Action {offset+i+1}',item)
    image_path=ROOT/f'presentations/lab{n:02}/assets/overview.png'
    if image_path.exists():
        s=slide('The exercise in the application','GUI · initial view')
        im=Image.open(image_path);wide=im.width;high=im.height
        if high<=350:
            w=11.85;h=w*high/wide;pic=s.shapes.add_picture(str(image_path),Inches((13.333-w)/2),Inches(1.55),width=Inches(w),height=Inches(h));pic.crop_bottom=.01
            y=max(4.5,1.55+h+.15)
            b.textbox(s,.85,y,11.5,.3,'WHAT TO EXPLORE',11,'C65330',True)
            b.textbox(s,.85,y+.45,11.5,1.0,info['steps'][0],20,'20312B')
        else:
            w=min(11.85,5.1*wide/high);h=w*high/wide
            pic=s.shapes.add_picture(str(image_path),Inches((13.333-w)/2),Inches(1.55),width=Inches(w),height=Inches(h));pic.crop_bottom=.01
    s=slide('The application request in sequence','UML sequence diagram · source navigation')
    endpoint,call=find_route(tour,source,ui);diagram(s,n,endpoint,call)
    sections=tour['sections']; count=len(sections)
    # The summary cards have a one-to-one correspondence with the code slides.
    for offset in range(0,count,8):
        group=sections[offset:offset+8]; s=slide('The workflow at a glance','From the router to the implementation')
        for i,sec in enumerate(group):
            x=.8+(i%4)*3.15;y=1.75+(i//4)*2.35;rect(s,x,y,2.9,1.95,'FFFFFF','D8E0D9',True)
            b.textbox(s,x+.22,y+.22,.5,.45,str(offset+i+1),20,'C65330',True)
            title_step=step_title(sec,offset+i);b.textbox(s,x+.22,y+.8,2.46,1.0,title_step,18,'1C252C',True)
    for i,sec in enumerate(sections):
        title_step=step_title(sec,i);s=slide(f'{i+1} · {title_step}','Workflow step · checked source')
        b.textbox(s,.85,1.7,5.5,.35,'WHAT HAPPENS',11,'C65330',True)
        narrative=sec['text'];size=20 if len(narrative)<210 else 18
        b.textbox(s,.95,2.2,5.45,3.8,narrative,size,'1C252C')
        rect(s,6.8,1.65,5.75,4.65,'1C302A',None,True)
        code,line_no,kind=selected_excerpt(lines,sec)
        b.textbox(s,7.08,1.98,5.18,.35,f'{kind.upper()} · LINE {line_no}',11,'F27C55',True)
        b.textbox(s,7.08,2.55,5.18,2.9,code,19,'F5F5EE',False,'Consolas')
        b.textbox(s,7.08,5.62,5.18,.45,tour['path'],11,'B8C9BE',False,'Consolas')
        for j in range(count):rect(s,.85+j*min(.7,5.6/count),6.62,min(.57,4.56/count),.055,'D36A45' if j==i else 'CAD7CD',None,True)
        b.textbox(s,6.52,6.52,1.4,.22,f'STEP {i+1} / {count}',9,'5C7567',True)
    s=slide('Student challenge','Apply and verify')
    b.textbox(s,.85,1.8,11.6,.8,'Try the lesson independently',30,'28594A',True,'Georgia')
    card(s,.85,2.9,7.2,3.35,'Your challenge',info['challenge'])
    inspect=next((p for p in info['inspect'] if (ROOT/p).exists()),tour['path'])
    card(s,8.25,2.9,4.25,3.35,'Inspect the code',inspect)
    files=list((ROOT/f'presentations/lab{n:02}/output').glob('*.pptx'))
    if len(files)!=1:raise ValueError(f'Expected one existing deck for Lab {n}: {files}')
    prs.save(files[0]);print(f'Lab {n:02}: {len(prs.slides)} slides, {count} code steps, '+('GUI capture' if image_path.exists() else 'no GUI capture'),flush=True)

if __name__=='__main__':
    import sys
    requested=[int(x) for x in sys.argv[1:]] if len(sys.argv)>1 else list(range(7,76))
    for n in requested:build(n)
