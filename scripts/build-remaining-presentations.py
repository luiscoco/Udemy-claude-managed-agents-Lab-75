"""Source-linked continuation of the approved course presentation format.

Lesson actions are reviewed curriculum text from shared/learning-content.ts.
Implementation excerpts are ranked within that lesson's actual source graph,
recorded verbatim with SHA-256 and line anchors, and formatted without splitting
tokens. Captures come exclusively from local offline exercises.
"""
from pathlib import Path
import re, json, hashlib, importlib.util, textwrap
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('deck',ROOT/'scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
META=json.loads((ROOT/'presentations/lesson-content.json').read_text(encoding='utf8'))
workflow_spec=importlib.util.spec_from_file_location('workflows',ROOT/'scripts/presentation-workflows.py')
workflows=importlib.util.module_from_spec(workflow_spec);workflow_spec.loader.exec_module(workflows)
TITLES={
23:['Validate the bundle','Select capabilities','Check the host effect','Reject unsafe reloads'],
24:['Choose the loop owner','Apply the shared handler','Enforce the call cap','Compare effect evidence'],
25:['Read reviewed reports','Observe compaction events','Keep metrics scoped','Check the summary handoff'],
26:['Open an owned session','Update only while idle','Replace capability arrays','Opt in to budget resume','Create a fresh model session','Archive after idle'],
27:['Create a host task','Detach the browser','Reconnect the same task','Deduplicate replayed events','Confirm idle before closure'],
28:['Classify the fault','Retry safe reads','Quarantine uncertain creation','Reconcile accepted effects','Deduplicate reconnect history'],
29:['Select and inspect a fixture','Validate content bytes','Build inline content','Preview a file resource','Keep output evidence separate'],
30:['Create dependent tasks','Validate tool input','Enforce completion gates','Deduplicate call IDs','Guard plan replacement'],
31:['Store the pending question','Validate the human answer','Reject incomplete choices','Handle expiry and cancellation','Correlate one result'],
32:['Create a read-only plan','Deny planning writes','Bind approval to plan hash','Execute in a fresh session','Reject or cancel pending plans'],
33:['Start the local MCP call','Validate accepted form input','Reject invalid values','Handle decline and timeout','Keep consent IDs separate'],
34:['Read trusted style files','Compare fresh sessions','Inspect composed instructions','Preserve prior snapshots','Reject unknown styles'],
35:['Choose mirror persistence','Recover after a crash','Reconcile canonical events','Keep missing history unknown','Partition by thread'],
36:['Run the loopback transport','Classify early connection failure','Bound the host worker','Cancel and inspect cleanup','Separate host and remote work'],
37:['Observe a preallowed action','Deny the exact paused call','Reject invalid gate output','Apply the host path guard','Accept one correlated decision'],
38:['Create an answer first','Copy without sending','Send a separate user turn','Allow absent suggestions','Reject stale suggestions'],
39:['Verify the trusted manifest','Reject branch instruction takeover','Read and edit allowed data','Refuse out-of-scope paths','Fail closed on changed config'],
40:['Inspect accepted work','Refuse unsafe host undo','Reconcile uncertain effects','Preserve queued follow-up work','Restore a clean host draft'],
41:['Complete a one-shot turn','Retain a session across turns','Reconnect without creating','Confirm idle before continuing','Refuse archived mutations'],
42:['Inspect supported web tools','Distinguish snippets and pages','Treat hostile text as data','Check redirects and addresses','Verify inspected citations'],
43:['Grant local bridge consent','Read versioned resources','Return a bounded tool result','Reject unauthorized reads','Refresh the host token'],
44:['Create correlated host spans','Compare decisions and effects','Record missing model evidence','Redact content by default','Bound the collector'],
45:['Read the capability catalog','Separate API product surfaces','Check the loopback contract','Keep emulator evidence scoped','Inspect setup without a run'],
46:['Identify stable content','Compare equal-scope readings','Track changed prefix hashes','Refuse cross-scope deltas','Keep unknown usage unavailable'],
47:['Choose native or host routing','Verify worker reports','Allow one correction','Block dependency failures','Compare session usage scopes'],
48:['Choose the enforcement policy','Guard a canary read','Check write boundaries','Verify egress effects','Separate event and business IDs'],
49:['Validate the passing report','Classify failure exit codes','Handle signals and cleanup','Inspect the headless runner'],
50:['Bind the customer context','Deny a refund proposal','Approve one checked refund','Reject foreign-order effects','Resume and evaluate the desk'],
51:['Run host assertions','Probe refusal boundaries','Replay bounded event traces','Detect a policy mutation'],
52:['Record the baseline','Detect candidate regression','Calibrate the judge','Gate local promotion'],
53:['Reproduce a valid control','Find the first useful gate','Classify missing completion','Keep cleanup unconfirmed'],
54:['Inspect the tool contract','Reject invalid refund effects','Apply a stable action key','Compare scripted recovery'],
55:['Identify compatibility layers','Analyze a candidate','Rehearse canary and rollback','Keep rollback scope explicit'],
56:['Enforce role ownership','Track delivery and acknowledgment','Verify the checked result','Gate optional live delegation'],
57:['Create isolated worker trees','Serialize integration','Block failed or cancelled work','Verify local Git evidence'],
58:['Expose catalog metadata','Score tool descriptions','Bound search context','Check dispatch authority'],
59:['Inspect the fixed task set','Apply each routing strategy','Account for every attempt','Stop at the admission budget'],
60:['Load policy and tools','Crash between effect and journal','Recover with idempotency','Bound supervisor progress'],
61:['Start an authenticated client','Return typed MCP output','Handle cancellation and isolation','Keep credentials on the host'],
62:['Retrieve current tenant chunks','Verify a grounded answer','Reject unsupported citations','Keep scores and authority separate'],
63:['Create a scoped database','Propose without changing rows','Commit a checked human decision','Reject stale and foreign changes'],
64:['Inspect the fixture product','Fill the local form','Deny external navigation','Verify DOM and screenshot'],
65:['Record the immutable proposal','Notify and collect a decision','Reject repeated or changed actions','Verify the effect ledger'],
66:['Start and send one turn','Reconnect from sequence','Deduplicate a command','Cancel the host run'],
67:['Select tenant on the host','Reserve separate quotas','Reject cross-tenant probes','Release reservations once'],
68:['Coalesce scheduled intervals','Deduplicate signed incidents','Run bounded retries','Check time and cancellation'],
69:['Capture explicit context','Reject an outdated patch','Inspect independent cleanup','Validate the editor boundary'],
70:['Check interpreter readiness','Run and close retained turns','Correlate the custom tool','Bound worker failure and cleanup'],
71:['Profile and clean the dataset','Compute checked aggregates','Build ledger-cited outputs','Reject tampered reports'],
72:['Read progressive references','Enforce the document contract','Reject invalid or changed inputs','Export a verified package'],
73:['Route and verify a good fix','Reject failed host gates','Preserve the reviewable patch','Keep Git authority on the host'],
74:['Measure an attack effect','Compare cumulative defenses','Inspect payload normalization','Bound adaptive mutations'],
75:['Validate the task graph','Verify worker dependency waves','Enforce independent release gates','Resume without repeating work'],
}
STOP=set('the a an and or to of in for with from then that this its is as by on at it one only run inspect compare confirm try selected fixture offline host session using explicit actual before after separate through keep into same which when what each their show check'.split())
SOURCE_ANCHORS={
 (24,2):'for (const event of fixtureEvents(request))',
 (24,3):'if (toolCalls >= request.callLimit)',
 (28,3):'const backoff = Math.floor',
 (30,2):'const board: Board =',
 (30,4):'if (task.version !== data.expectedVersion)',
 (31,2):'const entry: Entry = { owner, runId:',
 (32,4):"return this.attempt(entry, 'execution'",
 (33,2):'spawn(process.execPath',
 (37,3):'const parsed = lab37GateOutputSchema.safeParse(output)',
 (37,4):'const allowedPath =',
 (37,5):"entry.confirmation = { type: 'user.tool_confirmation'",
 (39,3):"entry.lastOperation = { operation: 'takeover'",
 (39,4):'const path = checkedPath',
 (41,5):"if (entry.status === 'archived')",
 (43,3):'async inventory(owner:',
 (43,4):'const payload = await this.rpc',
 (47,2):'const id = native ?',
 (47,4):'const gate = workers.some',
 (47,5):'const hostAggregate = native ?',
 (60,5):"if (journal.scenario === 'lease-loss')",
 (65,2):'const proposal: Proposal',
 (66,0):'socket.current.send(JSON.stringify(value))',
 (66,1):'parsed = lab66CommandSchema.parse',
 (66,3):"if (parsed.kind === 'start')",
 (66,4):'if (commands.has(key))',
 (69,3):'run.patch = lab69PatchSchema.parse',
 (69,5):"emit('outcome', run.state",
 (72,3):"else if (call.name === 'write_spec')",
 (73,5):"await hostGit(session.root, 'add', '--', 'src/price.mjs')",
}
PRIMARY_OPERATION={
23:'/run',24:'/run',25:'/run',26:'/open',27:'/open',28:'/run',29:'/inline',30:'/run',31:'/run',32:'/run',33:'/run',34:'/compare',35:'/run',36:'/run',37:'/run',38:'/chat',39:'/start',40:'/build',41:'/oneshot',42:'/basics',43:'/host-read',44:'/tracing',45:'/failures',46:'/switches',47:'/orchestrator',48:'/secrets',49:'/ci',50:'/chat',51:'/run',52:'/run',53:'/run',54:'/call',55:'/run',56:'/replay',57:'/run',58:'/search',59:'/run',60:'/run',61:'/demo',62:'/query',63:'/sessions/:id/query',64:'/run',65:'/run',66:'/ws',67:'/runs',68:'/tick',69:'/runs',70:'/runs',71:'/sessions/:id/scripted',72:'/sessions/:id/build',73:'/sessions/:id/run',74:'/simulate',75:'/runs'}
def words(text):
 return {w for w in re.findall('[a-z][a-z0-9]+',re.sub(r'([a-z])([A-Z])',r'\1 \2',text).lower()) if len(w)>2 and w not in STOP}
def sources(n):
 paths=[ROOT/p for p in META[str(n)]['inspect'] if p.endswith(('.ts','.tsx','.py')) and (ROOT/p).exists()]
 paths += list((ROOT/'server/lib').glob(f'lab{n:02}*.ts'))
 paths += list((ROOT/'src/concepts').glob(f'Concept{n:02}*.tsx'))
 # Include domain implementations reached from the registered router.
 route=next((ROOT/'server/concepts').glob(f'{n:02}-*.ts'))
 paths.append(route)
 for imp in re.findall(r"from ['\"]([^'\"]+)['\"]",route.read_text(encoding='utf8')):
  if imp.startswith('.'):
   target=(route.parent/imp).resolve().with_suffix('.ts')
   if target.exists() and '/lib/' not in target.as_posix():paths.append(target)
 return list(dict.fromkeys(p for p in paths if p.exists() and p.name not in ['index.ts','session-events.ts']))
TOKEN=re.compile(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`|//[^\n]*|/\*[\s\S]*?\*/|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|=>|\?\.|\?\?|&&|\|\||==|!=|<=|>=|\.\.\.|[^\s]")
def candidates(n):
 result=[]
 for p in sources(n):
  source=p.read_text(encoding='utf8');offset=0
  for line in source.splitlines(keepends=True):
   text=line.strip()
   if text and not text.startswith(('import ','export type ','type ','//','*','/*')):
    # Prefer complete executable statements or checks over declarations and boilerplate.
    matches=list(re.finditer(r'(?:\b(?:const|let)\s+(?=[A-Za-z_$][\w$]*\s*[:=]|[\[{])|\bif\s*\(|\breturn |\bcase |\bawait |\bthrow |\bfor\s*\(|[A-Za-z_]\w*\.(?:set|push|parse|safeParse|has|execute|write|read|run|verify)\s*\()',line))
    literals=[(t.start(),t.end()) for t in TOKEN.finditer(line) if t.group().startswith(("'",'"','`','//','/*'))]
    for m in matches[:12]:
     if any(a<=m.start()<z for a,z in literals):continue
     raw=source[offset+m.start():offset+m.start()+600].strip()
     ts=[t for t in TOKEN.findall(raw) if not t.startswith(('//','/*'))]
     if len(ts)<5:continue
     result.append({'path':p,'line':source[:offset+m.start()].count('\n')+1,'raw':raw,'terms':words(line[m.start():]),'tokens':ts})
   offset+=len(line)
 return result
def choose(cands,title,body,used,keywords=''):
 target=words(title+' '+body)
 keys=words(keywords)
 def score(c):
  overlap=target & c['terms']; val=sum(3 if len(t)>6 else 1 for t in overlap)+12*len(keys&c['terms'])
  if c['path'].as_posix().endswith('.tsx'):val-=2
  if '/shared/' in c['path'].as_posix():val-=1
  if (str(c['path']),c['line']) in used:val-=12
  if not overlap:val-=10
  return val
 return max(cands,key=score)
def excerpt(candidate):
 # Keep literal tokens intact. Overlong literals are visibly elided, never split.
 lines=[];current='';taken=[];has_elision=False
 for token in candidate['tokens']:
  shown=token
  if len(token)>37:
   shown='/* literal omitted */';has_elision=True
  previous=taken[-1] if taken else ''
  tight_before=shown in ['.', '?.', ',', ';', ')', ']', ':']
  tight_after=previous in ['.', '?.', '(', '[']
  call=shown=='(' and previous not in ['if','for','while','switch','catch','with']
  separator='' if not current or tight_before or tight_after or call else ' '
  if len(current)+len(shown)+len(separator)>39:
   lines.append(current);current=''
  if len(lines)>=7:break
  current=(current+separator+shown).strip();taken.append(token)
  if token in [';','{','}'] and len(current)>10:
   lines.append(current);current=''
  if len(lines)>=6:break
 if current:lines.append(current)
 if len(taken)<len(candidate['tokens']):lines.append('// excerpt continues')
 return '\n'.join(lines[:9])
def guide_parts(n):
 guide=next(ROOT.glob(f'Tab{n}-*.md')).read_text(encoding='utf8')
 title=guide.splitlines()[0].lstrip('# ').strip()
 title=re.sub(r'^Lab\s*\d+\s*[:—–-]\s*','',title)
 sections={}
 for match in re.finditer(r'^## ([^\n]+)\n([\s\S]*?)(?=^## |\Z)',guide,re.M):sections[match[1]]=match[2].strip()
 return title,guide,sections
def picture_slides(n):
 assets=ROOT/f'presentations/lab{n}/assets';items=[]
 evidence=sorted(assets.glob('lesson-evidence-*.png')) or [assets/'lesson-evidence.png']
 evidence+=sorted(assets.glob('lesson-details-*.png'))
 pictures=[('lesson-controls.png','Exercise controls','GUI · complete application controls')]+[(p.name,f'Exercise evidence · view {i+1}','GUI · representative complete evidence') for i,p in enumerate(evidence)]
 for name,title,label in pictures:
  path=assets/name
  if not path.exists():continue
  im=Image.open(path); text_pt=16*min(11.9,5.1*im.width/im.height)/im.width*72
  if text_pt>=11:
   item={'title':title,'label':label,'image':name}
   if im.height<260:
    item['below']=[('What to do',META[str(n)]['steps'][0]),('What to check',META[str(n)]['steps'][min(1,len(META[str(n)]['steps'])-1)])]
   items.append(item)
 return items
def build(n):
 meta=META[str(n)];title,guide,sections=guide_parts(n);cands=candidates(n);used=set();steps=[];anchors={};audit=[]
 titles=TITLES[n];actions=meta['steps']
 ui=next((ROOT/'src/concepts').glob(f'Concept{n:02}*.tsx'))
 route=next((ROOT/'server/concepts').glob(f'{n:02}-*.ts'))
 phases=[('Choose the exercise action','The React exercise collects the selected inputs and sends the corresponding request to the lesson’s local endpoint.','fetch streamPost body JSON.stringify',ui),
         ('Validate the host request','The lesson route validates the request and host context before dispatching the operation. Unsupported fields cannot select arbitrary host methods.','safeParse request.body owner',route)]
 phases += [(head,body,terms,None) for head,body,terms in workflows.WORKFLOWS[n]]
 if n==66:
  phases[0]=('Choose the exercise action','The React exercise sends typed start, message, acknowledgment and cancellation commands over its authenticated local WebSocket.','WebSocket send',ui)
  phases[1]=('Validate the host command','The host validates the closed WebSocket command and checks run ownership before dispatch.','lab66CommandSchema parsed owner',route)
 # Each numbered step explains a domain action from the reviewed lesson metadata.
 for i,(head,body,terms,restricted) in enumerate(phases):
  pool=[c for c in cands if c['path']==restricted] if restricted else [c for c in cands if '/lib/' in c['path'].as_posix() or '/server/' in c['path'].as_posix() and '/concepts/' not in c['path'].as_posix()]
  if not pool:pool=[c for c in cands if '/server/' in c['path'].as_posix()] or cands
  candidate=choose(pool,head,body,used,terms);used.add((str(candidate['path']),candidate['line']))
  marker=SOURCE_ANCHORS.get((n,i))
  if marker:
   for module in sources(n):
    text=module.read_text(encoding='utf8');pos=text.find(marker)
    if pos>=0:
     raw=text[pos:pos+600].strip();candidate={'path':module,'line':text[:pos].count('\n')+1,'raw':raw,'tokens':[t for t in TOKEN.findall(raw) if not t.startswith(('//','/*'))]};break
   else:raise ValueError(f'Lab {n}: source marker missing: {marker}')
  path=candidate['path'].relative_to(ROOT).as_posix();raw=candidate['raw'];code=excerpt(candidate)
  steps.append((head,path,body,code));anchors[i]=raw
  audit.append({'step':i+1,'title':head,'explanation':body,'path':path,'line':candidate['line'],'sourceSha256':hashlib.sha256(candidate['path'].read_bytes()).hexdigest(),'sourceExcerpt':raw,'displayedExcerpt':code})
 # GUI guidance introduces the exercise, followed by complete selected snapshots.
 gui=[{'title':'Explore the exercise','label':'GUI · actions and observations','cards':[(titles[i],actions[i]) for i in range(min(3,len(actions)))],'size':17}]
 gui+=picture_slides(n)
 if not any('image' in item for item in gui):raise ValueError(f'Lab {n}: no readable screenshot')
 route=next((ROOT/'server/concepts').glob(f'{n:02}-*.ts'));source=route.read_text(encoding='utf8')
 routes=re.findall(r"router\.(post|get)\(['\"]([^'\"]+)",source)
 operation=next(((method.upper(),path) for method,path in routes if method=='post' and re.search(r'run|turn|call|open|start|execute|chat|message|session',path)),next(iter(routes),('POST','/run')))
 operation=('POST',PRIMARY_OPERATION[n])
 if n!=66 and operation[1] not in source and operation[1].lstrip('/') not in source:
  raise ValueError(f'Lab {n}: operation missing from registered route: {operation[1]}')
 helpers=re.findall(r"from ['\"]([^'\"]+)['\"]",source)
 core=next((p for p in sources(n) if '/shared/' not in p.as_posix() and '/concepts/' not in p.as_posix() and '/src/' not in p.as_posix()),route)
 coretext=core.read_text(encoding='utf8')
 symbols=re.findall(r'export (?:async )?(?:class|function) (\w+)',coretext)
 symbol=next((s for s in symbols if not s.endswith('Error')),core.stem)
 ranked=[]
 for module in sources(n):
  if '/server/' not in module.as_posix() or '/concepts/' in module.as_posix():continue
  for declared in re.findall(r'export (?:async )?(?:class|function) (\w+)',module.read_text(encoding='utf8')):
   if declared.endswith('Error'):continue
   score=100 if re.search(r'new\s+'+re.escape(declared)+r'\s*\(',source) else 80 if declared.lower().startswith('runlab') and re.search(r'\b'+re.escape(declared)+r'\s*\(',source) else 30 if declared in source else 0
   ranked.append((score,module,declared))
 if ranked:
  score,module,declared=max(ranked,key=lambda item:item[0])
  if score:core=module;symbol=declared
 # The architecture labels identify concrete modules. Its request/return arrows
 # describe the registered host boundary; fixture behavior is never a provider call.
 component=ui.stem if len(ui.stem)<=29 else ui.stem[:26]+'…'
 names=[('User',''),('React UI',component),('Express route',f'/api/c{n}'),('Host implementation',symbol if len(symbol)<=29 else symbol[:26]+'…')]
 messages=[(0,1,'Choose the exercise action',False),(1,2,f'{operation[0]} {operation[1]}'[:32],False),(2,3,'Validate; dispatch operation',False)]
 messages += [(3,3,head,False) for head,_,_ in workflows.WORKFLOWS[n]]
 messages += [(3,2,'Typed operation result',True),(2,1,'Response or progress frames',True),(1,0,'Render evidence and outcome',True)]
 if n==66:
  names[2]=('WebSocket host','/api/c66/ws')
  messages[1]=(1,2,'Typed WebSocket command',False)
  messages[-2]=(2,1,'Sequenced WebSocket frames',True)
 contracts=next((module for module in sources(n) if '/shared/' in module.as_posix()),None)
 architecture={'nodes':[('ui','React exercise',ui.relative_to(ROOT).as_posix(),.7,1.8),('api','Local request boundary',route.relative_to(ROOT).as_posix(),4.75,1.8),('host','Lesson implementation',core.relative_to(ROOT).as_posix(),8.8,1.8)],'edges':[('ui','api')], 'note':f'The request boundary is {"WebSocket /api/c66/ws" if n==66 else "POST /api/c"+str(n)+operation[1]}. Other arrows show imports found in these modules.'}
 if core!=route:architecture['edges'].append(('api','host'))
 if contracts:
  architecture['nodes'].append(('contracts','Shared data contracts',contracts.relative_to(ROOT).as_posix(),4.75,4.55))
  for key,module in [('ui',ui),('api',route),('host',core)]:
   if contracts.stem in module.read_text(encoding='utf8'):architecture['edges'].append((key,'contracts'))
 dependencies=re.findall(r"from ['\"]([^'\"]+)['\"]",core.read_text(encoding='utf8'))
 local=[d for d in dependencies if d.startswith('.') and '/shared/' not in d and not any(t in d for t in ['errors','managed-config'])]
 external=[d for d in dependencies if any(t in d for t in ['node:fs','node:sqlite','node:child_process','modelcontextprotocol','anthropic','node:http','ws'])]
 dependency=next(iter(local or external),None)
 if dependency:
  architecture['nodes'].append(('dependency','Implementation dependency',dependency,8.8,4.55));architecture['edges'].append(('host','dependency'))
 limitations=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',sections.get('Limitations',''))
 sentences=re.split(r'(?<=[.!?])\s+',limitations)
 boundary=next((s for s in sentences if 35<len(s)<210), 'Inspect the source and the result source label before interpreting the exercise evidence.')
 spec={'title':title,'subtitle':meta['objective'],'verify':'VERIFY THE EVIDENCE','gui':gui,
 'sequence':{'title':'The application workflow in sequence','label':f'UML sequence diagram · {title}','names':names,'messages':messages},'architecture':architecture,
 'branches':('Read the evidence at its boundary','Workflow · interpretation and checks',[(titles[0],actions[0]),(titles[min(1,len(titles)-1)],actions[min(1,len(actions)-1)]),('Evidence boundary',boundary)],17),
 'glance':'Follow the lesson action through its implementation','steps':steps,'excerpt_sources':anchors,'source_line_numbers':{i:a['line'] for i,a in enumerate(audit)},
 'challenge':('Apply the lesson independently',[('Your challenge',meta['challenge']),('Inspect implementation',str(core.relative_to(ROOT)).replace('\\','/')),('Verify','Use the visible IDs, checked state and source label to explain the result.')])}
 deck.build(n,spec)
 (ROOT/f'presentations/lab{n}/source-review.json').write_text(json.dumps({'lab':n,'title':title,'steps':audit},indent=2),encoding='utf8')
 return {'lab':n,'title':title,'slides':len(gui)+len(steps)+6,'steps':len(steps),'screenshots':len(gui)-1}
if __name__=='__main__':
 import sys
 first=int(sys.argv[1]) if len(sys.argv)>1 else 23;last=int(sys.argv[2]) if len(sys.argv)>2 else first
 results=[]
 for n in range(first,last+1):
  try:results.append(build(n))
  except Exception as e:results.append({'lab':n,'error':str(e)});print(f'Lab {n}: {e}',flush=True)
 (ROOT/f'presentations/build-audit-{first}-{last}.json').write_text(json.dumps(results,indent=2),encoding='utf8')
