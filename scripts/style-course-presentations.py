"""Apply the approved Lab 06 format to Labs 07–75, retaining lesson-specific evidence.

Original decks are cached once for reproducibility. GUI screenshots and diagrams
are preserved or replaced by complete existing semantic captures. Code excerpts
are tied to source fingerprints; presentation runs never execute a live model.
"""
from pathlib import Path
from io import BytesIO
import hashlib, importlib.util, json, re, shutil, sys
from PIL import Image, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.opc.packuri import PackURI
from pptx.oxml.ns import qn

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'presentations'
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
live=module('style_live','course-live-scenarios.py')
content=module('style_uml_content','course-uml-content.py')
META=json.loads((OUT/'lesson-content.json').read_text(encoding='utf8'))
# Share the exact approved drawing primitives without executing its deck builder.
helper=ROOT/'scripts/restyle-lab06-presentation.py'
H={'__file__':str(helper)};exec(compile(helper.read_text(encoding='utf8').split('# Lab 01 cover')[0],str(helper),'exec'),H)
BG,INK,ORANGE,BORDER=[H[k] for k in ['BG','INK','ORANGE','BORDER']]
TOKEN=re.compile(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`|//[^\n]*|/\*[\s\S]*?\*/|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|=>|\?\.|\?\?|&&|\|\||==|!=|<=|>=|\.\.\.|[^\s]")

def clean(value):return value.replace('\x0b','\n').strip()
def get_text(s):return [clean(x.text) for x in s.shapes if x.has_text_frame and x.text]
def raw_source(path):return (ROOT/path).read_text(encoding='utf8')
def measured(value,size,font='arial.ttf'):
 face=ImageFont.truetype('C:/Windows/Fonts/'+font,round(size*10));return face.getlength(value)/10
def remove_shape(shape):shape._element.getparent().remove(shape._element)
def draw(name,*args,**kwargs):return H[name](*args,**kwargs)
def write_notes(s,body,paths):draw('notes',s,body,paths)

def format_code(raw,maxrows=12):
 """Keep identifiers/literals intact; comments identify omitted literals and tail."""
 tokens=TOKEN.findall(raw);lines=[];line='';previous='';level=0;truncated=False
 def flush():
  nonlocal line
  if line.strip():lines.append(line.rstrip());line=''
 for token in tokens:
  if token.startswith(('//','/*')):continue
  shown=token
  if measured(token,15.5,'consola.ttf')>365:shown='/* literal omitted */'
  if token=='}':
   if line.strip():flush()
   level=max(0,level-1)
  if not line:line='  '*min(level,3)
  tight=shown in ['.', '?.', ',', ';', ')', ']', ':'] or previous in ['.','?.','(','['] or shown=='(' and previous not in ['if','for','while','switch','catch']
  sep='' if not line.strip() or tight else ' '
  if measured(line+sep+shown,15.5,'consola.ttf')>382:
   flush();line='  '*min(level,3);sep=''
  line+=sep+shown
  if token=='{':flush();level+=1
  elif token in [';','}']:flush()
  elif token==',' and measured(line,15.5,'consola.ttf')>245:flush()
  previous=token
  if len(lines)>=maxrows-1:truncated=True;break
 flush()
 if truncated:lines=lines[:maxrows-1]+['// excerpt continues in source']
 return '\n'.join(lines)

def excerpt_at(path,terms,rows=12):
 source=raw_source(path);lines=source.splitlines();terms=terms if isinstance(terms,list) else [terms]
 chosen=next((i for term in terms for i,line in enumerate(lines) if term in line),None)
 if chosen is None:raise ValueError(f'No source anchor {terms} in {path}')
 # Include a complete source region for audit; the display is visibly elided.
 raw='\n'.join(lines[chosen:chosen+18]);return {'path':path,'line':chosen+1,'sourceExcerpt':raw,'code':format_code(raw,rows)}

def base_steps(n,p):
 if n>=23:
  data=json.loads((OUT/f'lab{n:02}/source-review.json').read_text(encoding='utf8'))
  result=[]
  for item in data['steps']:
   assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sourceSha256'],(n,item['path'],'source changed')
   assert item['sourceExcerpt'] in raw_source(item['path'])
   result.append({'title':item['title'],'body':item['explanation'],'path':item['path'],'line':item['line'],'sourceExcerpt':item['sourceExcerpt'],'code':format_code(item['sourceExcerpt'])})
  return result
 result=[]
 for s in p.slides:
  values=get_text(s)
  if not any('CODE EXCERPT' in v for v in values):continue
  title=next(clean(x.text) for x in s.shapes if x.has_text_frame and abs(x.top-Inches(.3))<1000)
  body=next(clean(x.text) for x in s.shapes if x.has_text_frame and abs(x.top-Inches(2.25))<1000)
  code=next(clean(x.text) for x in s.shapes if x.has_text_frame and abs(x.top-Inches(2.55))<1000)
  label=next(clean(x.text) for x in s.shapes if x.has_text_frame and abs(x.top-Inches(5.64))<1000)
  path=re.split(r'\s+·\s+',label)[0]
  assert (ROOT/path).exists(),(n,path)
  result.append({'title':re.sub(r'^\d+\s*·\s*','',title),'body':body,'path':path,'line':None,'code':code,'sourceExcerpt':None})
 assert len(result)==8,(n,len(result))
 return result

def supplemental(n,base):
 ui=next((ROOT/'src/concepts').glob(f'Concept{n:02}*.tsx')).relative_to(ROOT).as_posix()
 route=next((ROOT/'server/concepts').glob(f'{n:02}-*.ts')).relative_to(ROOT).as_posix()
 shared=next((ROOT/'shared').glob(f'lab{n:02}*.ts')).relative_to(ROOT).as_posix()
 start={'title':'Start the lab with one command','body':'`npm run dev` starts Express and Vite together. Defaults are API port 3076 and web port 5174. Offline exercises need no API key.',
  'path':'server/index.ts','line':20,'sourceExcerpt':None,'code':'''// package.json scripts
"dev:server": "node scripts/dev-server.mjs",
"dev:web": "vite"

// server/index.ts
const port = Number(
  process.env.LEARNING_API_PORT ?? 3076
);
app.listen(port, '127.0.0.1', () => {
  // readiness log omitted
});''','active':[1,2]}
 if n==66:
  transfer=excerpt_at(ui,['socket.current.send','new WebSocket'])
  transfer.update(title='Send a typed WebSocket command',body='The UI sends typed commands on its owned WebSocket. A command ID and resumed sequence separate replay from new work. Closing the socket alone does not cancel the host run.',active=[0,1])
 else:
  sse='streamPost(' in raw_source(ui)
  path='src/lib/sse.ts' if sse else ui
  transfer=excerpt_at(path,['const response = await fetch','await fetch(', 'fetch(', 'await post(', 'await request('])
  transfer.update(title='Send the request through the Vite proxy',body=('`streamPost()` uses POST JSON and reads an SSE response. The Vite `/api` proxy forwards to Express. Provider credentials stay on the server.' if sse else 'The React component sends the lesson request through the local `/api` proxy. Check the request method, body and owner context. An HTTP response is not a model completion claim.'),active=[0,1])
 schema=excerpt_at(shared,['export const lab'+f'{n:02}'+'RequestSchema','export const lab'+f'{n:02}'+'RunSchema','z.strictObject','z.object','Schema ='])
 schema.update(title='Read the closed data contract',body='The shared module defines the lesson’s typed inputs and evidence. Inspect the allowed fields and bounded values. The host validates the applicable schema before using the request.',active=[2])
 render=excerpt_at(ui,['if (outcome.kind', 'setResult(', 'setView(', 'setSnapshot(', 'setState(', 'setRun(', 'setReport(', 'setData(', 'useState<'])
 render.update(title='Render the checked result and evidence',body='React stores the returned lesson state and renders the visible evidence. Compare it with the selected inputs and host checks. A displayed answer alone does not prove an external effect.',active=[0])
 result=[start,base[0],transfer,schema]+base[1:]+[render]
 if len(base)==6:
  gate=content.GATES[n]
  gate_path=route
  review=json.loads((OUT/f'lab{n:02}/uml-source-review.json').read_text())
  anchors=review.get('gateSourceAnchors',[])
  if anchors:
   terms=set(re.findall(r'\w+',gate['terms']))
   anchor=max(anchors,key=lambda a:len(terms&set(re.findall(r'\w+',a['text']))));gate_path=anchor['path'];line=anchor['line'];lines=raw_source(gate_path).splitlines()
   candidate={'path':gate_path,'line':line,'sourceExcerpt':'\n'.join(lines[line-1:line+16]),'code':format_code('\n'.join(lines[line-1:line+16]))}
  else:candidate=excerpt_at(route,['safeParse','parse(', 'router.post'])
  candidate.update(title='Check the decision against its evidence',body=gate['yes']+' '+gate['no']+' '+gate['boundary'],active=[2,3],gate=True)
  cleanup=excerpt_at(route,['router.post(\'/reset','router.post(\'/close','router.post(\'/runs/:id/cancel','close:','async close()', 'close()','cleanup','router.use'])
  cleanup.update(title='Inspect cleanup and the next safe action',body='Use the lesson’s explicit reset, close or cancellation path when provided. Read the host cleanup result before repeating work. Local transport closure is separate from provider stop or archival.',active=[2,3])
  result.insert(-1,candidate);result.append(cleanup)
 assert len(result)==12,(n,len(result))
 return result

def prose_parts(body,meta,n):
 body=' '.join(body.split());parts=[v.strip() for v in re.split(r'(?<=[.!?])\s+(?=[A-Z`])',body) if v.strip()]
 if len(parts)==1 and len(parts[0])>150:
  parts=[v.strip() for v in re.split(r';\s+|\.\s+',body) if v.strip()]
 # The existing lesson action is a concrete student observation, not filler text.
 if len(parts)<2:
  terms=set(re.findall(r'\w+',body.lower()))
  action=max(meta['steps'],key=lambda v:len(terms&set(re.findall(r'\w+',v.lower()))))
  parts.append(action)
 return parts[:3]

def bullets(s,values):
 # Same font as Lab 06; choose explicit word breaks with room for native metrics.
 for i,value in enumerate(values):
  shape=s.shapes.add_textbox(Inches(.62),Inches(1.84+i*1.28),Inches(5.55),Inches(1.24));tf=shape.text_frame
  tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0;tf.word_wrap=True
  p=tf.paragraphs[0];p.font.name='Arial';p.font.size=Pt(18);p.line_spacing=1.1
  run=p.add_run();run.text='•  ';run.font.color.rgb=RGBColor.from_string(ORANGE);width=17
  pieces=re.split(r'`([^`]+)`',value)
  for j,part in enumerate(pieces):
   face=ImageFont.truetype('C:/Windows/Fonts/'+('consola.ttf' if j%2 else 'arial.ttf'),180)
   tokens=re.findall(r'\s+|\S+',part)
   for k,token in enumerate(tokens):
    w=face.getlength(token)/10
    reserve=8 if j%2 and k==len(tokens)-1 and j+1<len(pieces) and re.match(r'^[.,;:!?]',pieces[j+1]) else 0
    if width+w+reserve>5.55*72-20:
     p.add_line_break();width=0
     if token.isspace():continue
    run=p.add_run();run.text=token;run.font.name='Consolas' if j%2 else 'Arial';run.font.size=Pt(18);run.font.color.rgb=RGBColor.from_string(ORANGE if j%2 else INK);width+=w

def architecture_strip(s,n,active,local=False):
 labels=['React UI  ·  src/','Vite proxy  ·  :5174','Express host  ·  :3076','Host effects / fixture' if local else 'Managed API / fixture']
 for i,label in enumerate(labels):
  x=.6+i*3.15;draw('rect',s,x,6.3,2.7,.55,ORANGE if i in active else 'FFFFFF',None if i in active else BORDER,True)
  draw('text',s,x+.08,6.45,2.54,.23,label,12,'FFFFFF' if i in active else '566574',i in active,align=PP_ALIGN.CENTER)
  if i<3:
   line=draw('flat',s.shapes.add_connector(1,Inches(x+2.77),Inches(6.575),Inches(x+3.08),Inches(6.575)))
   line.line.color.rgb=RGBColor.from_string('566574');line.line.width=Pt(1)
   end=H['OxmlElement']('a:tailEnd');end.set('type','triangle');line._element.spPr.ln.append(end)

def reframe(s,index):
 """Keep editable diagram content while matching Lab 06 framing and palette."""
 H['b'].bg(s,BG)
 for x in list(s.shapes):
  if x.has_text_frame and x.text:
   if abs(x.top-Inches(.3))<1000:
    x.left=Inches(.6);x.top=Inches(.48);x.width=Inches(12.1);x.height=Inches(.8)
    for p in x.text_frame.paragraphs:p.font.name='Cambria';p.font.size=Pt(30 if measured(x.text,32,'cambriab.ttf')>850 else 32);p.font.color.rgb=RGBColor.from_string(INK)
   elif abs(x.top-Inches(1.05))<1000:x.top=Inches(1.25)
   elif abs(x.top-Inches(7.12))<1000:remove_shape(x);continue
   elif abs(x.top-Inches(7.1))<1000:x.left=Inches(12.2);x.top=Inches(7.05);x.text_frame.paragraphs[0].text=str(index)
  elif abs(x.left)<1000 and x.width<Inches(.2) or abs(x.top-Inches(1.36))<1000 and x.height<Inches(.03):remove_shape(x);continue
  try:
   if x.fill.type==1:
    color=str(x.fill.fore_color.rgb)
    mapping={'172A25':INK,'1C302A':INK,'203A30':INK,'23453A':INK,'E4EEE7':'F0E6DC','D8E0D9':BORDER,'D8DFD8':BORDER,'28594A':ORANGE}
    if color in mapping:x.fill.fore_color.rgb=RGBColor.from_string(mapping[color])
  except (AttributeError,TypeError):pass
  if x.has_text_frame:
   for p in x.text_frame.paragraphs:
    for font in [p.font]+[v.font for v in p.runs]:
     # Reading Font.color creates an empty solidFill when the colour is inherited.
     # Inspect the XML instead, preserving white/peach paragraph colours on dark fills.
     fill=font._rPr.find(qn('a:solidFill'))
     rgb=fill.find(qn('a:srgbClr')) if fill is not None else None
     if rgb is not None and rgb.get('val') in ['28594A','20312B','617C70','41594D']:rgb.set('val',INK)

GUI_ASSETS={
 7:[('Policy experiment controls','style-controls.png'),('A protected write is denied','style-evidence.png')],
 8:[('Delegation experiment controls','style-controls.png'),('Child reports have separate histories','style-threads.png'),('The host checks each capability','style-evidence.png')],
 9:[('Instruction comparison controls','overview.png'),('Choose how instructions are composed','instructions.png'),('Compare compose and replace','compare-compose.png'),('Requested instruction composition','composition-requested.png'),('Verify resolved settings','composition-resolved.png')],
 10:[('Validated report controls','overview.png'),('Inspect the checked report','report.png'),('Observe interruption evidence','interrupt.png')],
 12:[('Queued message controls','controls.png'),('Compare the authored script','script.png'),('Inspect slow execution','slow.png'),('Cancellation leaves explicit command states','hang-commands.png')],
 14:[('Model experiment controls','overview-run.png'),('Compare the resolved model and effort','compare.png'),('Reject a settings mismatch','mismatch.png'),('Inspect fallback evidence','fallback-second.png')],
 15:[('Usage experiment controls','overview.png'),('Inspect scoped usage readings','readings.png'),('Compare thread usage','threads.png'),('A paused budget is separate evidence','paused.png')],
}

def gui_images(n,p,limit):
 if n in GUI_ASSETS:return [(title,(OUT/f'lab{n:02}/assets'/file).read_bytes()) for title,file in GUI_ASSETS[n]]
 result=[]
 for s in list(p.slides)[:limit]:
  pics=[x for x in s.shapes if x.shape_type==13]
  if pics:
   title=get_text(s)[0]
   for pic in pics:result.append((title,pic.image.blob))
 if n==29 and result:result[0]=(result[0][0],(OUT/'lab29/assets/style-controls.png').read_bytes())
 return result

def build(n):
 folder=OUT/f'lab{n:02}';target=next((folder/'output').glob('*.pptx'));cache=OUT/'style-source'/f'lab{n:02}.pptx';cache.parent.mkdir(exist_ok=True)
 if not cache.exists():shutil.copy2(target,cache)
 p=Presentation(cache);H['r']=p;H['blank']=p.slide_layouts[6];meta=META[str(n)];original=list(p.slides)
 title=next(clean(x.text) for x in original[0].shapes if x.has_text_frame and abs(x.top-Inches(1.55))<1000)
 title=title.replace('Capstone 2 an autonomous engineering team','An autonomous engineering team')
 base=base_steps(n,p);steps=supplemental(n,base)
 review=json.loads((folder/'uml-source-review.json').read_text()) if (folder/'uml-source-review.json').exists() else None
 if n==7:uml_indices=[7,8,9,10];gui_end=6
 else:
  uml_indices=review['umlSlides'];gui_end=min(uml_indices)-1
 diagrams=[]
 for i,s in enumerate(original,1):
  ts=get_text(s)
  if i in uml_indices or any('UML COMPONENT VIEW' in v for v in ts):diagrams.append(s)
 images=gui_images(n,p,gui_end);assert len(images)>=2,(n,'missing GUI evidence')
 # Detach the old ordering, retaining diagram parts and relationships in memory.
 for rid in list(p.slides._sldIdLst):p.slides._sldIdLst.remove(rid)
 # Unused original slide relationships are removed so old slides are not packaged.
 diagram_parts={s.part for s in diagrams}
 for rel in list(p.part.rels.values()):
  if rel.reltype.endswith('/slide') and rel.target_part not in diagram_parts:p.part.drop_rel(rel.rId)
 s=p.slides.add_slide(p.slide_layouts[6]);H['b'].bg(s,INK)
 draw('text',s,.8,.82,11.7,.4,f'CLAUDE MANAGED AGENTS LAB  ·  LAB {n:02}',14,'F2A075',True)
 cover=draw('wrap',title,11.7*72,46,'cambriab.ttf')
 assert len(cover.splitlines())<=2,(n,'cover title too long',cover)
 draw('text',s,.8,1.65,11.8,1.65,cover,46,'FFFFFF',True,'Cambria')
 objective=draw('wrap',meta['objective'],10.8*72-12,21)
 draw('text',s,.84,3.62,10.8,1.27,objective,21,'E9E3DC')
 for i,(head,body) in enumerate([('EXPLORE','The lesson GUI'),('TRACE','The application UML'),('FOLLOW','12 workflow steps'),('VERIFY','Independent evidence')]):
  x=.84+i*3.05;draw('rect',s,x,5.18,2.72,1.25,'263138',None,True)
  draw('text',s,x+.2,5.37,2.32,.24,head,12,'F2A075',True);draw('text',s,x+.2,5.85,2.32,.3,body,15,'FFFFFF')
 draw('text',s,.84,6.83,11,.25,'GUI walkthrough  /  UML sequences  /  12 code steps',11,'C7C2BC')
 write_notes(s,meta['objective']+'\nLive claims require actual provider evidence; existing screenshots show local/offline exercises.',[steps[1]['path']])
 gui_indices=[]
 for i,(heading,blob) in enumerate(images):
  s=draw('slide',heading,'GUI · complete representative application evidence');gui_indices.append(len(p.slides))
  im=Image.open(BytesIO(blob));w=min(11.9,5.1*im.width/im.height);h=w*im.height/im.width
  minpt=16*w/im.width*72;assert minpt>=10.5,(n,heading,'unreadable capture',im.size,minpt)
  s.shapes.add_picture(BytesIO(blob),Inches((13.333-w)/2),Inches(1.6),width=Inches(w),height=Inches(h))
  if h<3.0:
   y=max(3.5,1.6+h+.3);height=6.78-y
   actions=meta['steps']
   for j in range(2):
    body=actions[(i+j)%len(actions)]
    draw('card',s,.72+j*6.04,y,5.86,height,['Choose / observe','Verify the evidence'][j],body,j+1)
  write_notes(s,'\n'.join(meta['steps'])+'\n\nThis screenshot contains complete selected GUI components. It is not a live-run success claim.',[steps[1]['path']])
 new_diagrams=[]
 for s in diagrams:
  rid=p.part.relate_to(s.part,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide')
  p.slides._sldIdLst.add_sldId(rid);new_diagrams.append(len(p.slides));reframe(s,len(p.slides))
  if not s.has_notes_slide:write_notes(s,'Checked module dependencies and implementation boundaries. This view identifies code components rather than an additional runtime request.',[v['path'] for v in base])
 s=draw('slide','The workflow at a glance');overview=len(p.slides)
 for i,item in enumerate(steps):
  x=.6+(i%4)*3.11;y=1.65+(i//4)*1.65;draw('rect',s,x,y,2.81,1.36,'FFFFFF',BORDER,True);draw('badge',s,x+.19,y+.19,i+1,.5,14)
  draw('text',s,x+.19,y+.83,2.43,.5,draw('wrap',item['title'],2.38*72,14,'arialbd.ttf'),14,INK,True)
 write_notes(s,'Twelve cards map one-to-one to the twelve following implementation slides.\n'+'\n'.join(f'{i+1}. {item["title"]}' for i,item in enumerate(steps)),sorted(set(v['path'] for v in steps)))
 codes=[];local=n not in live.SUPPORTED and n!=7
 for i,item in enumerate(steps):
  s=draw('slide','');codes.append(len(p.slides));draw('badge',s,.6,.48,i+1,.8,24)
  draw('text',s,1.65,.48,11.1,.8,item['title'],30,INK,True,'Cambria');values=prose_parts(item['body'],meta,n);bullets(s,values)
  draw('rect',s,6.6,1.75,6.15,4.2,INK,None,True)
  label=item['path']+(f' · L{item["line"]}' if item.get('line') else '')+' (excerpt)'
  label=draw('wrap',label,5.55*72-12,11.5,'arialbd.ttf')
  draw('text',s,6.9,2.0,5.55,.4,label,11.5,'F2A075',True)
  draw('text',s,6.9,2.43,5.55,3.35,item['code'],15.5,'FFFFFF',False,'Consolas')
  active=item.get('active',[0] if item['path'].startswith('src/') else [2,3]);architecture_strip(s,n,active,local)
  write_notes(s,f'Step {i+1}: {item["title"]}\n{item["body"]}\n\nThe excerpt is reformatted; comments identify elisions. Read the full source for validation, error handling and cleanup. The last architecture node is host/fixture evidence for local-only lessons; an implemented Managed adapter still requires explicit configured live execution.\n\nSource excerpt:\n'+str(item.get('sourceExcerpt') or item['code']),[item['path']])
 # Preserve the reviewed live acceptance boundaries, using the approved card style.
 if n==7:
  case={'status':'implemented-adapter; actual execution requires readiness','cards':[
   ('Prepare live setup','Configure the Lab 07 custom-tool agent and shared environment/key with live opt-in.'),
   ('Run and verify','Run the policy experiment. Compare the correlated tool event, host audit, handler status and before/after file contents.'),
   ('Test cleanup','Deny a protected write, then cancel bounded work. Check status and archival independently; interruption alone is not a stop proof.') ]}
 else:case=live.scenario(n)
 s=draw('slide','Live scenario and acceptance checks','Live / integration boundary · '+case['status']);live_index=len(p.slides)
 cards=case['cards']
 if len(cards)==4:
  for i,(head,body) in enumerate(cards):
   x=.72+(i%2)*6.04;y=1.72+(i//2)*2.42
   draw('card',s,x,y,5.86,2.35,re.sub(r'^\d+\s*·\s*','',head),body,i+1)
 else:
  for i,(head,body) in enumerate(cards):draw('card',s,.72+i*4.04,1.85,3.82,3.95,head,body,i+1)
 draw('text',s,.84,6.65,11.6,.33,'Record local effects and actual provider outcomes separately; readiness alone is not a live test.',14,ORANGE,True)
 write_notes(s,case['status']+'\n'+'\n'.join(head+': '+body for head,body in cards),[item['path'] for item in steps])
 s=draw('slide','Apply the lesson independently','Student challenge · predict, run and explain');challenge=len(p.slides)
 for i,(head,body) in enumerate([('Predict',meta['challenge']),('Run and inspect',meta['steps'][0]),('Explain the evidence',meta['steps'][-1])]):draw('card',s,.72+i*4.04,1.85,3.82,3.95,head,body,i+1)
 write_notes(s,meta['challenge']+'\n'+'\n'.join(meta['steps']),sorted(set(v['path'] for v in steps)))
 # Explicit renaming prevents duplicate slide part names after removing/adding slides.
 for i,s in enumerate(p.slides,1):
  s.part._partname=PackURI(f'/ppt/slides/slide{i}.xml')
  if s.has_notes_slide:s.notes_slide.part._partname=PackURI(f'/ppt/notesSlides/notesSlide{i}.xml')
 from collections import Counter
 names=Counter(str(part.partname) for part in p.part.package.iter_parts())
 assert not [name for name,count in names.items() if count>1],[name for name,count in names.items() if count>1]
 contrast_review=module('presentation_contrast','audit-presentation-contrast.py')
 contrast_review.repair(p)
 p.save(target)
 paths=set(v['path'] for v in steps)|{'package.json','vite.config.ts','server/index.ts'}
 if review:paths|={v['path'] for v in review['sources']}
 audit={'lab':n,'title':title,'path':target.relative_to(OUT).as_posix(),'reference':'Approved Lab 06 style','slides':len(p.slides),'guiSlides':gui_indices,'umlSlides':new_diagrams,'workflowOverview':overview,'codeSlides':codes,'liveScenarioSlide':live_index,'challengeSlide':challenge,'liveScenario':case,'steps':steps,'sources':[{'path':path,'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest()} for path in sorted(paths)]}
 (folder/'style-review.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
 print(f'Lab {n:02}: {len(p.slides)} slides, 12 workflow steps, {len(images)} GUI captures, {len(new_diagrams)} UML views.',flush=True)
 return {'lab':n,'slides':len(p.slides),'path':audit['path']}

if __name__=='__main__':
 first=int(sys.argv[1]) if len(sys.argv)>1 else 7;last=int(sys.argv[2]) if len(sys.argv)>2 else first
 results=[]
 for n in range(first,last+1):results.append(build(n))
 (OUT/f'style-build-{first}-{last}.json').write_text(json.dumps(results,indent=2),encoding='utf8')
