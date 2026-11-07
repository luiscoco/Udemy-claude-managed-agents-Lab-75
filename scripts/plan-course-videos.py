"""Build lesson-specific narration from the approved course decks and teaching data."""
from pathlib import Path
import argparse,hashlib,json,re
from pptx import Presentation
from plan_lab_settings import SETTINGS
ROOT=Path(__file__).resolve().parents[1]
CONTENT=json.loads((ROOT/'presentations/lesson-content.json').read_text())

def plain(text):return re.sub(r'\s+',' ',text.replace('\x0b',' ').replace('`','').replace('•',' ')).strip()
def speech(text):
 text=plain(text).replace('→',' then ').replace('↔',' in both directions ').replace('&',' and ').replace(' + ',' and ')
 text=re.sub(r'([A-Za-z]\w*)\[(\d+)\]',r'\1 at index \2',text)
 text=re.sub(r'[\[\]{}]',' ',text)
 text=re.sub(r'([a-z])([A-Z])',r'\1 \2',text)
 text=text.replace('_',' ').replace('()','').replace(' / ',' or ')
 text=re.sub(r'(?<=\w)\.(?=[a-zA-Z])',' ',text)
 text=re.sub(r'\.{2,}','.',text)
 return re.sub(r'\s+',' ',text).strip(' .;')+'.'
def words(text):return set(re.findall('[a-z]{3,}',text.lower()))-{'the','and','with','for','from','this','that','then','run','lab'}
def target(index,paragraph=None):
 result={'shape':index}
 if paragraph is not None:result['paragraph']=paragraph
 return result
def texts(slide):return [(i,x,plain(x.text)) for i,x in enumerate(slide.shapes) if x.has_text_frame and plain(x.text)]
def shape_title(slide):
 ts=texts(slide)
 return next((t for i,x,t in ts if len(t)>4 and not t.startswith('CLAUDE MANAGED')),ts[0][2])
def box_join(rects):
 x=min(r[0] for r in rects);y=min(r[1] for r in rects)
 return [x,y,max(r[0]+r[2] for r in rects)-x,max(r[1]+r[3] for r in rects)-y]

def screenshot_labels(slide,ocr):
 pics=[x for x in slide.shapes if x.shape_type==13]
 result=[]
 for line in ocr.get('lines',[]):
  groups=[];current=[]
  for word in sorted(line['words'],key=lambda w:w['rect'][0]):
   if not isinstance(word.get('text'),str) or not word['text'].strip():continue
   if current:
    last=current[-1]['rect'];r=word['rect']
    if r[0]-last[0]-last[2]>max(35,r[3]*2):groups.append(current);current=[]
   current.append(word)
  if current:groups.append(current)
  # Evidence screenshots can contain whole paragraphs on one OCR line. Keep
  # readable, measured word spans rather than discarding every long line.
  spans=[]
  for group in groups:
   current=[]
   for word in group:
    proposed=' '.join(w['text'] for w in current+[word])
    if current and (len(current)>=12 or len(proposed)>120):
     spans.append(current);current=[]
    current.append(word)
   if current:spans.append(current)
  groups=spans
  for group in groups:
   text=' '.join(w['text'] for w in group);r=box_join([w['rect'] for w in group])
   if not(5<=len(text)<=130 and 11<=r[3]<=90 and len(text.split())<=16):continue
   if re.search(r'(?:sevt_|sess_|sk-ant|[{}]|[a-f0-9]{18})',text,re.I):continue
   for pic in pics:
    px,py,pw,ph=[v/914400*144 for v in [pic.left,pic.top,pic.width,pic.height]]
    if px<=r[0] and py<=r[1] and r[0]+r[2]<=px+pw+2 and r[1]+r[3]<=py+ph+2:
     result.append({'text':text,'target':{'textRects':[r]},'rect':r});break
 return result

def choose_label(labels,description,used):
 eligible=[x for x in labels if x['text'] not in used]
 if not eligible:return None
 keywords=words(description)
 def score(item):
  text=item['text'].lower();matches=len(words(text)&keywords)
  heading=bool(re.search(r'prompt|scenario|run |result|outcome|evidence|status|session|policy|options|summary|experiment|budget|deadline|audit|control|request|response',text))
  return matches*5+heading*2-min(len(text),100)/150
 result=max(eligible,key=score);used.add(result['text']);return result

def code_explanation(code,body):
 rules=[
  (r'fetch\(',"The fetch call constructs the browser request. Follow its method, headers and serialized body, then the response handling that follows."),
  (r'\.safeParse\(|\.parse\(',"Focus on the schema check in this excerpt. It turns untrusted input into checked data; inspect the rejection path before following the successful branch."),
  (r'openSse\(',"This excerpt opens the server sent event response. Inspect the controller and timing options, then follow the progress frames back to the browser."),
  (r'app\.use\(|router\.(?:post|get)\(',"This is the route boundary. The handler runs when the browser submits the corresponding request, rather than when the source module is merely loaded."),
  (r'sessions\.create\(',"The creation call passes the selected configuration to a dedicated session. Follow the returned identifier into the next event-stream operation."),
  (r'events\.stream\(',"The event stream is an asynchronous source. Follow its session identifier and cancellation signal, then check when the user message is sent."),
  (r'setResult\(|setFrames\(|setPending\(',"These state updates control what React displays. Trace the incoming result or frame into state, and distinguish displayed content from independently verified effects."),
  (r'AbortController|\.abort\(',"The cancellation controller scopes local waiting. Follow the signal through the excerpt and inspect remote cleanup separately in the full implementation."),
  (r'Promise\.race|Timeout|timeout|deadline',"The timing branch bounds the operation shown here. Inspect what happens when the bound expires; stopping a wait alone does not reverse effects that already occurred."),
  (r'createHash|sha256|\.hash\(',"The hash binds the shown data to a concrete identity. Follow what is hashed and where the expected identity is compared before the next action."),
  (r'\.interrupt\(',"This is the interruption request. Follow the separate status checks before treating remote work as confirmed stopped."),
  (r'\.archive\(',"The archival call is cleanup. Inspect the state check that permits it, and keep cleanup evidence distinct from the agent answer."),
  (r'\.write|writeFile|\.commit\(',"This excerpt reaches a state-changing boundary. Trace the checked inputs and the resulting evidence rather than assuming that an intent or a success message proves the effect."),
  (r'\.read|readFile',"Follow the scoped read and the data it returns. The next stage must use that observed content rather than infer it from a model claim."),
  (r'spawn\(|\.spawn\(',"The host starts a bounded worker here. Follow the arguments, streamed output and exit handling, and inspect cancellation separately from remote-session completion."),
  (r'app\.listen\(',"The server listens on the configured local API port. The frontend and its proxy use a separate port, so requests cross a clear browser-to-host boundary."),
 ]
 for pattern,explanation in rules:
  if re.search(pattern,code):return explanation
 cleaned='\n'.join(x for x in code.splitlines() if not x.strip().startswith('//'))
 calls=[x for x in re.findall(r'\b([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*\(',cleaned) if x not in {'if','for','while','catch','String','Number','Boolean','Map','Set'}]
 if calls:
  names=list(dict.fromkeys(calls))[:2]
  return 'Trace '+speech(' and '.join(names))+' Follow the inputs, the returned value and its use in the next workflow stage. The source file shown above the excerpt contains the complete implementation.'
 return 'Follow the data fields in this excerpt and relate them to the rule on the left. Inspect the named source file for the complete guards and the next operation.'

def build(lab):
 folder=ROOT/f'presentations/lab{lab:02}';deck=next(x for x in (folder/'output').glob('*.pptx') if not x.name.startswith('~$'))
 p=Presentation(deck);meta_path=folder/'style-review.json';meta=json.loads(meta_path.read_text()) if meta_path.exists() else {}
 geometry=json.loads((folder/'.build/video/slides/geometry.json').read_text(encoding='utf-8-sig'))
 ocr_path=folder/'.build/video/slides/ocr.json';ocr=json.loads(ocr_path.read_text(encoding='utf-8-sig')) if ocr_path.exists() else []
 lesson=CONTENT[str(lab)];cover=p.slides[0];title=plain(cover.shapes[1].text);rows=[];last_screen=[]
 source_refs=[]
 for source in meta.get('sources',[]):
  source_path=ROOT/source['path'];assert source_path.exists(),source['path']
  assert hashlib.sha256(source_path.read_bytes()).hexdigest()==source['sha256'],('Presentation source changed; review needed',lab,source['path'])
  source_refs.append(source)
 def add(segments,kind):
  n=len(rows)+1;segments=[s for s in segments if s[0].strip()]
  total=sum(len(s[0])+1 for s in segments)
  assert 0<total<2000,(lab,n,kind,total)
  rows.append({'slide':n,'kind':kind,'segments':[{'id':f'{n}-{i+1}','text':speech(text),'target':t} for i,(text,t) in enumerate(segments)]})
 for n,s in enumerate(p.slides,1):
  ts=texts(s);text_by_index={i:t for i,x,t in ts};title_here=shape_title(s);joined=' '.join(t for _,_,t in ts)
  if n==1:
   add([(f'Welcome to Lab {lab}. {title}.',target(1)),(lesson['objective'],target(2)),('We will explore the interface, trace the application workflow, and work through twelve implementation steps. Use the final challenge to explain the evidence independently.',target(2))],'cover');continue
  step=next(((i,x,t) for i,x,t in ts if x.name=='Step number'),None)
  is_code=n in meta.get('codeSlides',[]) or step is not None
  if is_code:
   if step is not None:
    num=int(step[2]);heading=1;body_specs=[(2,k,plain(par.text)) for k,par in enumerate(s.shapes[2].text_frame.paragraphs) if plain(par.text)];code_index=next((i for i,x,t in ts if x.name=='Code'),None)
   else:
    num=meta['codeSlides'].index(n)+1;heading=3;body_specs=[(i,None,t.lstrip('• ')) for i,x,t in ts if x.text.lstrip().startswith('•')]
    expected=meta.get('steps',[])[num-1].get('code','') if len(meta.get('steps',[]))>=num else ''
    compact=lambda value:re.sub(r'\s+','',value)
    code_index=next((i for i,x,t in ts if expected and compact(x.text)==compact(expected)),None)
    if code_index is None:code_index=next((i for i,x,t in reversed(ts) if ('\n' in x.text or '\x0b' in x.text) and 6<i<11 and not t.startswith('•')),None)
   segments=[(f'Step {num}. '+text_by_index[heading],target(heading))]
   for index,paragraph,text in body_specs:segments.append((text,target(index,paragraph)))
   if code_index is not None:
    segments.append((code_explanation(s.shapes[code_index].text,joined),target(code_index)))
   add(segments,'code');continue
  if 'workflow at a glance' in title_here.lower():
   cards=[(i,t) for i,x,t in ts if re.match(r'Overview title',x.name)]
   if not cards:cards=[(i,t) for i,x,t in ts if i>=4 and (i-4)%3==0]
   add([(f'Step {k}. {text}',target(i)) for k,(i,text) in enumerate(cards,1)],'workflow-summary');continue
  messages=[(i,t) for i,x,t in ts if re.match(r'^\d+\.\s',t)]
  uml=n in meta.get('umlSlides',[]) or 'sequence' in title_here.lower() or any('Participant' in x.name for _,x,_ in ts)
  if uml:
   segments=[('Trace '+title_here+'. Read the messages in order and follow the same identities across the application boundaries.',target(0))]
   if messages:
    for i,text in messages:segments.append(('Step '+text,target(i)))
    important=[(i,t) for i,x,t in ts if t.startswith(('CORRELATION:','DENIED:','HOST POLICY:','BOUNDARY:','EVIDENCE:'))]
    if important:segments.append((important[-1][1],target(important[-1][0])))
   else:
    for i,x,text in ts:
     if i<3 or text.isdigit() or text.startswith('UML '):continue
     if re.match(r'^(?:server|src|shared|python)/',text):continue
     if len(text)>3 and text not in {'Yes','No'}:segments.append((text,target(i)))
   if sum(len(a) for a,b in segments)>1850:segments=segments[1:]
   add(segments,'uml');continue
  legacy_cards=[(i,t) for i,x,t in ts if i in (7,11,15) and 'Screen counter' in [v.name for v in s.shapes]]
  if legacy_cards:
   last_screen=[text for i,text in legacy_cards]
   add([(title_here,target(0))]+[(text,target(i)) for i,text in legacy_cards],'gui-explanation');continue
  picture=any(x.shape_type==13 for x in s.shapes)
  if picture:
   segments=[('Examine '+title_here+'.',target(0))]
   labels=screenshot_labels(s,ocr[n-1] if len(ocr)>=n else {});used=set()
   native=[(i,t) for i,x,t in ts if i in (7,11) and len(t)>20]
   actions=[t for _,t in native] or (last_screen[:2] if lab<=5 and last_screen else lesson['steps'][:2])
   for k,action in enumerate(actions):
    label=choose_label(labels,action,used)
    if native:
     segments.append((action,target(native[k][0])))
    elif label:
     segments.append(('Locate '+label['text']+'. '+action,label['target']))
    else:raise AssertionError(('No measured screenshot text target',lab,n))
   if native and labels:
    label=choose_label(labels,actions[0],used)
    if label:segments.append(('Use the highlighted '+label['text']+' area to relate the controls to the evidence shown in this view.',label['target']))
   add(segments,'gui');continue
  # Remaining slides are native cards: choices, live acceptance or a challenge.
  if lab<=5 and n==len(p.slides):
   add([(text_by_index[1],target(1)),(text_by_index[2],target(2)),(lesson['challenge'],target(2))],'challenge');continue
  segments=[(title_here,target(0))]
  bodies=[(i,t) for i,x,t in ts if i>=3 and len(t)>24 and not re.match(r'^(?:Lab \d|GUI walkthrough|CLAUDE)',t)]
  if n==meta.get('liveScenarioSlide'):
   segments.append(('These are live acceptance instructions and integration boundaries. This video does not execute a new provider test.',target(1)))
  for i,text in bodies:segments.append((text,target(i)))
  if len(segments)==1:
   for i,x,text in ts[1:]:
    if len(text)>8:segments.append((text,target(i)))
  add(segments,'live-acceptance' if n==meta.get('liveScenarioSlide') else 'challenge-or-choices')
 out=ROOT/f'videos/lab{lab:02}';out.mkdir(parents=True,exist_ok=True)
 filename=deck.name.replace('-Claude-Managed-Agents','')
 plan={'lab':lab,'title':title,'presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'sources':source_refs,'outputFile':filename.replace('.pptx','.mp4'),'settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'slides':rows}
 assert len(rows)==len(p.slides)
 assert sum(r['kind']=='code' for r in rows)==12,('Expected twelve code steps',lab)
 assert sum(r['kind']=='workflow-summary' for r in rows)==1,('Expected workflow cards',lab)
 assert all(sum(len(s['text'])+1 for s in r['segments'])<2000 for r in rows)
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf8')
 print(f"Lab {lab:02}: {len(rows)} slides; {sum(len(r['segments']) for r in rows)} narration/highlight segments; {sum(len(s['text']) for r in rows for s in r['segments'])} characters.",flush=True)
 return plan

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--lab',type=int,required=True);args=parser.parse_args();build(args.lab)
