"""Build Lessons 06–75 presentations from their checked-in lesson guides.

Overview captures live alongside each deck in its assets folder.
The generator keeps lesson text intact and lays it out in readable cards.
"""
from __future__ import annotations
import glob
import math
import re
from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from PIL import Image, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BG, INK, ORANGE, GREEN = 'F7F5F1', '1C252C', 'CE542E', '225E4B'
FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 25)

def clean(s):
    s = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', s)
    return re.sub(r'\*\*|__|`', '', s).strip()

def fit_lines(s, width=300):
    lines=['']
    for word in s.split():
        if FONT.getlength(word) > width:
            # Long code tokens can be wrapped at character boundaries.
            parts=[]
            while word and FONT.getlength(word)>width:
                j=len(word)
                while FONT.getlength(word[:j])>width: j-=1
                parts.append(word[:j]); word=word[j:]
            if word: parts.append(word)
        else: parts=[word]
        for part in parts:
            candidate=(lines[-1]+' '+part).strip()
            if FONT.getlength(candidate)>width and lines[-1]: lines.append(part)
            else: lines[-1]=candidate
    return lines

def fragments(s):
    s=clean(s)
    if not s: return []
    # Cut at sentence or phrase boundaries, retaining every word.
    sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])',s)
    out=[]; cur=''
    for sentence in sentences:
        trial=(cur+' '+sentence).strip()
        if cur and (len(fit_lines(trial))>6 or len(trial)>230): out.append(cur);cur=''
        if len(fit_lines(sentence))<=6: cur=(cur+' '+sentence).strip(); continue
        for word in sentence.split():
            trial=(cur+' '+word).strip()
            if cur and len(fit_lines(trial))>6: out.append(cur);cur=word
            else: cur=trial
    if cur: out.append(cur)
    # Avoid an orphaned final word or phrase after a long paragraph.
    if len(out)>1 and len(out[-1])<35:
        words=out[-2].split()
        while len(out[-1])<55 and len(words)>5:
            out[-1]=words.pop()+' '+out[-1]
        out[-2]=' '.join(words)
    return out

def parse(path):
    raw=path.read_text(encoding='utf-8'); lines=raw.splitlines()
    title=clean(lines[0].lstrip('# ').strip()); title=re.sub(r'^Lab\s*\d+\s*[:—–-]\s*','',title,flags=re.I)
    section='Overview'; blocks=[]; pending=[]; code=False
    def flush():
        if pending:
            text=' '.join(pending).strip();pending.clear()
            for f in fragments(text): blocks.append((section, f))
    for line in lines[1:]:
        line=line.strip()
        if line.startswith('```'):
            flush(); code=not code; continue
        if code:
            # Refer readers to the guide for complete, executable examples;
            # splitting code across separate cards would change its meaning.
            continue
        elif line.startswith('## '): flush();section=clean(line[3:])
        elif line.startswith('# '): flush()
        elif not line: flush()
        elif line.startswith('|'):
            flush(); cells=[clean(x) for x in line.strip('|').split('|')]
            if not all(re.fullmatch(r'[-: ]*',x) for x in cells) and not all(x.lower() in ('route','host operation','description','meaning','field','value') for x in cells):
                for f in fragments(' — '.join(cells)): blocks.append((section,f))
        elif re.match(r'^[-*] ',line):
            flush()
            for f in fragments(line[2:]): blocks.append((section,f))
        else: pending.append(line)
    flush(); return title,blocks

def textbox(slide, x,y,w,h, value, size, color=INK, bold=False, font='Arial'):
    shape=slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tf=shape.text_frame
    tf.word_wrap=True; tf.margin_left=0;tf.margin_right=0;tf.margin_top=0;tf.margin_bottom=0
    p=tf.paragraphs[0];p.text=value;p.font.name=font;p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color)
    return shape

def bg(slide,color=BG):
    slide.background.fill.solid();slide.background.fill.fore_color.rgb=RGBColor.from_string(color)

def footer(slide,n,source):
    textbox(slide,.65,7.08,11,.2,source,9,'63706F')
    textbox(slide,12.4,7.08,.4,.2,str(n),9,'63706F')

def titlebar(slide,title,label,n,source):
    textbox(slide,.65,.28,11.9,.62,title,26,INK,True,'Georgia')
    textbox(slide,.68,1.08,11.8,.25,label.upper(),10,ORANGE,True)
    footer(slide,n,source)

def build(n):
    matches=list(ROOT.glob(f'Tab{n}-*.md')); assert len(matches)==1, n
    guide=matches[0]; title,blocks=parse(guide)
    prs=Presentation();prs.slide_width=Inches(13.333333);prs.slide_height=Inches(7.5); blank=prs.slide_layouts[6]
    sl=prs.slides.add_slide(blank);bg(sl,'182127')
    textbox(sl,.9,.75,11.5,.3,f'CLAUDE MANAGED AGENTS LAB  ·  LAB {n:02}',12,'F27C55',True)
    titlebox=textbox(sl,.9,1.65,11.3,2,title,38,'FFFFFF',True,'Georgia')
    overview=next((text for label,text in blocks if label=='Overview'), '')
    if overview: textbox(sl,.95,4.15,10.8,1.7,overview,20,'E3E9E4')
    textbox(sl,.95,6.8,10,.25,'Lesson guide and implementation in this repository',11,'A9BBB1')
    content=list(blocks)
    if overview: content.remove(('Overview',overview))
    capture=ROOT/f'presentations/lab{n:02}/assets/overview.png'
    if capture.exists():
        sl=prs.slides.add_slide(blank); bg(sl);titlebar(sl,'The exercise at a glance','Initial exercise view',len(prs.slides),guide.name)
        im=Image.open(capture)
        compact=im.height <= 350 and len(content)>=2
        scale=min(Inches(12.05)/im.width,Inches(3.5 if compact else 5.35)/im.height);w=int(im.width*scale);h=int(im.height*scale)
        top=Inches(1.55) if compact else int(Inches(1.55)+(Inches(5.35)-h)/2)
        sl.shapes.add_picture(str(capture),int((prs.slide_width-w)/2),top,width=w,height=h)
        if compact:
            y=(top+h)/914400+.12
            for i,(section,item) in enumerate(content[:2]):
                x=.65+i*6.15
                box=sl.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE,Inches(x),Inches(y),Inches(5.85),Inches(1.75))
                box.fill.solid();box.fill.fore_color.rgb=RGBColor.from_string('FFFFFF');box.line.color.rgb=RGBColor.from_string('DADBD7')
                textbox(sl,x+.2,y+.15,5.45,.25,section.upper(),9,ORANGE,True)
                textbox(sl,x+.2,y+.48,5.45,1.15,item,15,INK)
            content=content[2:]
    # Balance pages so one trailing item is not left on a nearly empty slide.
    count=math.ceil(len(content)/3); count=max(1,count)
    groups=[]; k=0
    for i in range(count):
        size=math.ceil((len(content)-k)/(count-i)); groups.append(content[k:k+size]);k+=size
    for group in groups:
        sl=prs.slides.add_slide(blank);bg(sl)
        unique=list(dict.fromkeys(x[0] for x in group))
        heading=unique[0] if len(unique)==1 else ' · '.join(unique[:2])
        if len(heading)>55: heading='Lesson concepts and practice'
        titlebar(sl,heading,f'Lab {n:02}  ·  {title}',len(prs.slides),guide.name)
        num=len(group); cardw=3.83 if num==3 else 5.83 if num==2 else 11.8
        gap=.26; total=num*cardw+(num-1)*gap; start=(13.333-total)/2
        for i,(section,text) in enumerate(group):
            x=start+i*(cardw+gap); box=sl.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.65), Inches(cardw), Inches(4.95));box.adjustments[0]=.045
            box.fill.solid();box.fill.fore_color.rgb=RGBColor.from_string('FFFFFF');box.line.color.rgb=RGBColor.from_string('DADBD7')
            textbox(sl,x+.3,1.97,cardw-.6,.5,section.upper(),10,ORANGE,True)
            shape=textbox(sl,x+.3,2.62,cardw-.6,3.55,text,18,INK)
            # Text was split conservatively against a narrower card than this.
            assert len(fit_lines(text))<=6,(n,section,text)
    # Pointers to actual repository files, not invented implementation snippets.
    paths=[guide.name]
    for pattern in [f'src/concepts/Concept{n:02}*.tsx',f'server/concepts/{n:02}-*.ts',f'shared/lab{n:02}*.ts',f'tests/lab{n:02}*.test.ts']:
        hits=sorted(ROOT.glob(pattern))
        if hits: paths.append(str(hits[0].relative_to(ROOT)).replace('\\','/'))
    sl=prs.slides.add_slide(blank);bg(sl);titlebar(sl,'Explore the implementation','Source and verification',len(prs.slides),guide.name)
    for i,path in enumerate(paths):
        y=1.7+i*.9
        box=sl.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(.8),Inches(y),Inches(11.7),Inches(.72));box.adjustments[0]=.1;box.fill.solid();box.fill.fore_color.rgb=RGBColor.from_string('FFFFFF');box.line.color.rgb=RGBColor.from_string('DADBD7')
        textbox(sl,1.05,y+.20,11.1,.35,path,17,GREEN,True)
    outdir=ROOT/f'presentations/lab{n:02}/output';outdir.mkdir(parents=True,exist_ok=True)
    slug=re.sub(r'[^A-Za-z0-9]+','-',title).strip('-')[:65]
    output=outdir/f'Lab{n:02}-Claude-Managed-Agents-{slug}.pptx';prs.save(output)
    print(n,len(prs.slides),'slides', 'with screenshot' if capture.exists() else 'no screenshot',flush=True)

if __name__=='__main__':
    for number in range(6,76): build(number)
