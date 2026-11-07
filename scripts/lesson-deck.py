"""Shared renderer for the hand-authored lesson decks (Lab 07 layout).

A lab script supplies a spec: GUI slides with offline captures, a UML sequence
diagram, workflow branches, eight source-checked steps and a challenge. The deck
order is fixed: GUI, architecture, workflow summary cards, one slide per step.
"""
from __future__ import annotations
import importlib.util
from pathlib import Path
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('course', ROOT/'scripts/rebuild-course-presentations.py')
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
b = c.b
MIN_CAPTURE_PT = 11

def build(n, spec):
    p = Presentation(); p.slide_width = Inches(13.333333); p.slide_height = Inches(7.5)
    blank = p.slide_layouts[6]; assets = ROOT/f'presentations/lab{n:02}/assets'
    def slide(title, label):
        s = p.slides.add_slide(blank); c.heading(s, title, label, n, len(p.slides)); return s
    def cards(title, label, items, size=19):
        s = slide(title, label); count = len(items); gap = .18; w = (11.9-(count-1)*gap)/count
        for i, (head, body) in enumerate(items):
            x = .7+i*(w+gap); c.rect(s, x, 1.75, w, 4.4, 'FFFFFF', 'D8E0D9', True); c.rect(s, x+.24, 1.99, .44, .055, 'D36A45')
            b.textbox(s, x+.24, 2.18, w-.48, .4, head.upper(), 12, 'B94E30', True)
            b.textbox(s, x+.24, 2.77, w-.48, 3.2, body, size, '20312B')
    def capture(title, label, filename, note=None, side=None, crop_bottom=0, below=None):
        s = slide(title, label); im = Image.open(assets/filename); ratio = im.width/im.height
        # Tall evidence sits on the left with its explanation in a card on the right.
        if side: w = min(7.6, 4.95*ratio)
        else: w = min(11.9, (4.25 if note else 5.1)*ratio)
        h = w/ratio
        # Captures are taken at one device pixel per CSS pixel. 16 px body text must reach
        # MIN_CAPTURE_PT on the slide; capture a narrower stage or split it across slides otherwise.
        text_pt = 16*w/im.width*72
        if text_pt < MIN_CAPTURE_PT:
            limit = 'at most 790x515 px with side' if side else f"at most 1245x{445 if note else 530} px{' with note' if note else ''}"
            raise ValueError(f'Lab {n} {filename}: {im.width}x{im.height} px shows 16 px text at {text_pt:.1f} pt (minimum {MIN_CAPTURE_PT}); use {limit}')
        x = .7 if side else (13.333-w)/2
        pic = s.shapes.add_picture(str(assets/filename), Inches(x), Inches(1.6), width=Inches(w), height=Inches(h))
        c.rect(s, x, 1.6, w, h, 'FFFFFF', 'D8E0D9').fill.background()
        if side:
            x = .7+w+.35; cw = 12.6-x; c.rect(s, x, 1.6, cw, 4.95, 'FFFFFF', 'D8E0D9', True); c.rect(s, x+.24, 1.84, .44, .055, 'D36A45')
            b.textbox(s, x+.24, 2.03, cw-.48, .4, side[0].upper(), 12, 'B94E30', True)
            b.textbox(s, x+.24, 2.6, cw-.48, 3.8, side[1], 18, '20312B')
        elif note:
            # The note follows the capture directly, with an accent rule, and stays clear of the footer.
            y = 1.6+h+.35; c.rect(s, .9, y+.06, .055, .62, 'D36A45')
            b.textbox(s, 1.12, y, 11.2, .8, note, 17, '28594A')
        pic.crop_bottom = crop_bottom
        if below:
            y=1.6+h+.3; count=len(below); gap=.2; cw=(11.9-gap*(count-1))/count
            for i,(head,body) in enumerate(below):
                cx=.7+i*(cw+gap); ch=6.72-y
                c.rect(s,cx,y,cw,ch,'FFFFFF','D8E0D9',True)
                b.textbox(s,cx+.22,y+.2,cw-.44,.35,head.upper(),11,'B94E30',True)
                b.textbox(s,cx+.22,y+.78,cw-.44,ch-.95,body,18,'20312B')
    def sequence(title, label, names, messages, host=3):
        s = slide(title, label); count = len(names); xs = [1.25+i*(10.6/(count-1)) for i in range(count)]
        gap = min(.4, 4.3/len(messages))
        for i, (x, (name, detail)) in enumerate(zip(xs, names)):
            c.rect(s, x-1.12, 1.48, 2.24, .52, 'C65330' if i == host else '1C302A', None, True)
            b.textbox(s, x-.98, 1.55, 1.96, .21, name, 12, 'FFFFFF', True)
            if detail: b.textbox(s, x-.98, 1.78, 1.96, .17, detail, 9, 'FFFFFF', True)
            line = c.flat(s.shapes.add_connector(1, Inches(x), Inches(2.02), Inches(x), Inches(6.73)))
            line.line.color.rgb = RGBColor.from_string('9AAFA5'); line.line.width = Pt(.8); line.line.dash_style = MSO_LINE_DASH_STYLE.DASH
        for i, (a, z, text, ret) in enumerate(messages):
            y = 2.32+i*gap; x1, x2 = xs[a], xs[z]
            if a == z:
                for ax,ay,bx,by in [(x1,y,x1+.24,y),(x1+.24,y,x1+.24,y+.13),(x1+.24,y+.13,x1,y+.13)]:
                    loop=c.flat(s.shapes.add_connector(1,Inches(ax),Inches(ay),Inches(bx),Inches(by)))
                    loop.line.color.rgb=RGBColor.from_string('203A30');loop.line.width=Pt(1.1)
                end=OxmlElement('a:tailEnd');end.set('type','triangle');loop._element.spPr.ln.append(end)
                b.textbox(s,x1-3.2,y-.16,3.02,.28,f'{i+1}. {text}',11,'1C252C',True)
                continue
            line = c.flat(s.shapes.add_connector(1, Inches(x1), Inches(y), Inches(x2), Inches(y)))
            line.line.color.rgb = RGBColor.from_string('617C70' if ret else '203A30'); line.line.width = Pt(1.1)
            if ret: line.line.dash_style = MSO_LINE_DASH_STYLE.DASH
            end = OxmlElement('a:tailEnd'); end.set('type', 'triangle'); line._element.spPr.ln.append(end)
            b.textbox(s, min(x1, x2)+.09, y-.24, abs(x2-x1)-.18, .22, f'{i+1}. {text}', 11, '41594D' if ret else '1C252C', True)

    s = p.slides.add_slide(blank); b.bg(s, '172A25'); c.rect(s, 0, 0, .14, 7.5, 'E5744A')
    b.textbox(s, .85, .72, 7.3, .35, f'CLAUDE MANAGED AGENTS  /  LAB {n:02}', 13, 'EAA185', True)
    b.textbox(s, .85, 1.55, 7.5, 1.8, spec['title'], 38, 'FFFFFF', True, 'Georgia')
    b.textbox(s, .9, 4.0, 7.0, 1.5, spec['subtitle'], 21, 'D8E5DB')
    c.rect(s, 8.75, 1.25, 3.65, 4.9, '23453A', '3A6152', True)
    for y, num, text in [(1.75, '01', 'EXPLORE THE GUI'), (2.75, '02', 'TRACE THE FLOW'), (3.75, '03', 'READ THE CODE'), (4.75, '04', spec['verify'])]:
        b.textbox(s, 9.1, y, .55, .4, num, 15, 'F1A083', True); b.textbox(s, 9.85, y, 2.25, .55, text, 15, 'FFFFFF', True)
    for item in spec['gui']:
        if 'cards' in item: cards(item['title'], item['label'], item['cards'], item.get('size', 19))
        else: capture(item['title'], item['label'], item['image'], item.get('note'), item.get('side'), item.get('crop_bottom', 0),item.get('below'))
    seq = spec['sequence']; sequence(seq['title'], seq['label'], seq['names'], seq['messages'], seq.get('host', 3))
    if spec.get('architecture'):
        architecture=spec['architecture']; s=slide('Application architecture and source boundaries','UML component view · checked module dependencies')
        positions={}
        for node in architecture['nodes']:
            key,title,path,x,y=node;positions[key]=(x,y)
            c.rect(s,x,y,3.5,1.3,'1C302A' if key=='host' else 'FFFFFF','D8E0D9',True)
            b.textbox(s,x+.2,y+.17,3.1,.24,title.upper(),11,'EAA185' if key=='host' else 'B94E30',True)
            b.textbox(s,x+.2,y+.58,3.1,.56,path,12,'FFFFFF' if key=='host' else '20312B',False,'Consolas')
        for origin,target in architecture['edges']:
            x1,y1=positions[origin];x2,y2=positions[target]
            if y1==y2:ax,ay,bx,by=x1+3.5,y1+.65,x2,y2+.65
            else:ax,ay,bx,by=x1+1.75,y1+1.3,x2+1.75,y2
            connector=c.flat(s.shapes.add_connector(1,Inches(ax),Inches(ay),Inches(bx),Inches(by)))
            connector.line.color.rgb=RGBColor.from_string('617C70');connector.line.width=Pt(1.4)
            end=OxmlElement('a:tailEnd');end.set('type','triangle');connector._element.spPr.ln.append(end)
        b.textbox(s,.85,6.45,11.65,.38,architecture['note'],15,'28594A')
    cards(*spec['branches'])
    steps = spec['steps']; count = len(steps)
    s = slide('The workflow at a glance', spec['glance'])
    for i, (title, *_rest) in enumerate(steps):
        x = .8+(i%4)*3.15; y = 1.75+(i//4)*2.35; c.rect(s, x, y, 2.9, 1.95, 'FFFFFF', 'D8E0D9', True)
        b.textbox(s, x+.22, y+.22, .5, .45, str(i+1), 20, 'C65330', True); b.textbox(s, x+.22, y+.76, 2.46, 1.1, title, 18, b.INK, True)
    for i, (title, path, body, code) in enumerate(steps):
        # Every excerpt must still exist in the named file, modulo the elisions marked with comments.
        source = (ROOT/path).read_text(encoding='utf-8')
        in_comment = False
        excerpt_source = spec.get('excerpt_sources', {}).get(i)
        if excerpt_source is not None and excerpt_source not in source:
            raise ValueError(f'Lab {n} step {i+1}: source excerpt changed in {path}')
        for line in ([] if excerpt_source is not None else code.splitlines()):
            if in_comment:
                in_comment = '*/' not in line; line = line.split('*/', 1)[-1] if '*/' in line else ''
            if '/*' in line and '*/' not in line.split('/*', 1)[1]: in_comment = True
            probe = line.split('//')[0].split('/*')[0].strip().rstrip(',;{()')
            if len(probe) > 12 and probe not in source: raise ValueError(f'Lab {n} step {i+1}: excerpt not found in {path}: {probe}')
        widest = max(map(len, code.splitlines())); rows = len(code.splitlines())
        # The code panel holds 37 Consolas columns at 18 pt and 42 columns by 10 rows at 16 pt.
        if widest > 42 or rows > 10: raise ValueError(f'Lab {n} step {i+1}: excerpt exceeds the code panel ({widest} columns, {rows} rows)')
        s = slide(f'{i+1} · {title}', 'Workflow step')
        b.textbox(s, .85, 1.7, 5.5, .35, 'WHAT HAPPENS', 11, 'C65330', True)
        b.textbox(s, .95, 2.25, 5.45, 3.4, body, 22 if len(body) < 190 else 20, b.INK)
        c.rect(s, 6.8, 1.65, 5.75, 4.65, '1C302A', None, True)
        b.textbox(s, 7.08, 1.98, 5.18, .35, 'CODE EXCERPT · SIMPLIFIED', 11, 'F27C55', True)
        b.textbox(s, 7.08, 2.55, 5.18, 2.9, code, 18 if rows <= 8 and widest <= 37 else 16, 'F5F5EE', False, 'Consolas')
        source_label=path+(f" · L{spec['source_line_numbers'][i]}" if i in spec.get('source_line_numbers',{}) else '')
        b.textbox(s, 7.08, 5.64, 5.18, .45, source_label, 11, 'B8C9BE', False, 'Consolas')
        for j in range(count): c.rect(s, .85+j*.7, 6.62, .57, .055, 'D36A45' if j == i else 'CAD7CD', None, True)
        b.textbox(s, 6.52, 6.52, 1.4, .22, f'STEP {i+1} / {count}', 9, '5C7567', True)
    cards(spec['challenge'][0], 'Student challenge', spec['challenge'][1])
    target = next((ROOT/f'presentations/lab{n:02}/output').glob('*.pptx')); p.save(target)
    print(f'Saved {target.relative_to(ROOT)}: {len(p.slides)} slides')
