"""Apply the approved readable UML style without rebuilding unrelated deck content.

Source hashes, entry points, declaration anchors and lesson-specific gate evidence
are recorded before a deck is saved. Existing GUI/code slides remain editable.
Run again after a generator rebuild to reapply this review idempotently.
"""
from pathlib import Path
import ast, hashlib, importlib.util, json, re, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.xmlchemy import OxmlElement
from pptx.opc.packuri import PackURI
from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[1]
def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT/'scripts'/filename)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value); return value
c = module('course_style', 'rebuild-course-presentations.py')
content = module('uml_content', 'course-uml-content.py')
live_content = module('live_content', 'course-live-scenarios.py')
b = c.b
META = json.loads((ROOT/'presentations/lesson-content.json').read_text(encoding='utf8'))
MARKER = 'COURSE_UML_REVIEW_V2'
SSE = {8, 9, 10, 11, 13, 14, 15, 16, 19, 20, 22}
ASYNC = {67, 69, 70, 75}
FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 115)

def sources_for(n):
    route = next((ROOT/'server/concepts').glob(f'{n:02}-*.ts'))
    ui = next((ROOT/'src/concepts').glob(f'Concept{n:02}*.tsx'))
    files = [route, ui] + [ROOT/p for p in META[str(n)]['inspect'] if p.endswith(('.ts', '.tsx', '.py'))]
    files += list((ROOT/'server/lib').glob(f'lab{n:02}*.ts'))
    # Include actual imported domain implementations, not similarly named guesses.
    for source in list(files):
        if not source.exists(): continue
        for target in re.findall(r"from ['\"]([^'\"]+)['\"]", source.read_text(encoding='utf8')):
            if target.startswith('.'):
                resolved = (source.parent/target).resolve().with_suffix('.ts')
                if resolved.exists() and resolved.is_relative_to(ROOT) and resolved.name != 'index.ts': files.append(resolved)
    files = list(dict.fromkeys(p for p in files if p.exists() and p.name != 'index.ts'))
    return route, ui, files

def source_review(n, trace, gate):
    route, ui, files = sources_for(n)
    texts = {p: p.read_text(encoding='utf8') for p in files}
    declarations = [(p, s) for p, s in texts.items()
                    if re.search(r'\b(?:class|function|const)\s+'+re.escape(trace['symbol'])+r'\b', s)]
    if not declarations: raise ValueError(f'Lab {n}: missing implementation declaration {trace["symbol"]}')
    core, core_text = declarations[0]
    path = trace['endpoint']
    route_text = texts[route]
    if path not in route_text and path.lstrip('/') not in route_text:
        raise ValueError(f'Lab {n}: entry point {path} absent from registered route')
    if n in SSE and 'openSse' not in route_text: raise ValueError(f'Lab {n}: SSE not implemented')
    if n == 66 and 'WebSocket' not in route_text: raise ValueError('Lab 66 WebSocket boundary changed')
    terms = set(re.findall(r'[a-zA-Z_]\w+', gate['terms'].lower()))
    ranked = []
    for p, source in texts.items():
        if '/src/' in p.as_posix() or '/shared/' in p.as_posix(): continue
        for i, line in enumerate(source.splitlines(), 1):
            overlap = terms & set(re.findall(r'[a-zA-Z_]\w+', line.lower()))
            if overlap:
                ranked.append((len(overlap) + (2 if 'if (' in line else 0), p, i, line.strip()))
    if not ranked: raise ValueError(f'Lab {n}: gate has no implementation anchor')
    anchors = [{'path':p.relative_to(ROOT).as_posix(), 'line':i, 'text':line}
               for _, p, i, line in sorted(ranked, key=lambda x:x[0], reverse=True)[:4]]
    return {'lab':n, 'endpoint':f'{"WS" if n == 66 else "POST"} /api/c{n}{path}',
            'transport':'WebSocket' if n == 66 else 'HTTP JSON + owned polling' if n in ASYNC else 'POST SSE' if n in SSE else 'HTTP JSON',
            'route':route.relative_to(ROOT).as_posix(), 'ui':ui.relative_to(ROOT).as_posix(),
            'implementation':core.relative_to(ROOT).as_posix(), 'symbol':trace['symbol'],
            'gate':gate, 'gateSourceAnchors':anchors,
            'sources':[{'path':p.relative_to(ROOT).as_posix(), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}

def width(text, size): return FONT.getlength(text)*size/115
def wrap(text, points, size):
    lines, current = [], ''
    for word in text.split():
        candidate = (current+' '+word).strip()
        if current and width(candidate, size) > points:
            lines.append(current); current = word
        else: current = candidate
    if current: lines.append(current)
    return '\n'.join(lines)
def short(text, points, size):
    if width(text, size) <= points: return text
    while text and width(text+'…', size) > points: text = text[:-1]
    return text.rstrip()+'…'

def text(s, x, y, w, h, value, size=11.5, color='1D252B', bold=False, center=False):
    box = b.textbox(s, x, y, w, h, value, size, color, bold)
    if center: box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    return box

def arrow(s, x1, y1, x2, y2, returned=False, color=None, head=True):
    line = c.flat(s.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2)))
    line.line.color.rgb = RGBColor.from_string(color or ('566574' if returned else '1D252B'))
    line.line.width = Pt(1)
    if returned: line.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    if head:
        end = OxmlElement('a:tailEnd'); end.set('type', 'triangle'); line._element.spPr.ln.append(end)
    return line

def teach_notes(s, review, title, notes, steps):
    s.notes_slide.notes_text_frame.text = (
        MARKER+'\n'+title+'\n\n'+ '\n'.join(f'{i+1}. {note}' for i, note in enumerate(notes))+
        '\n\nLesson code walkthrough:\n'+'\n'.join(steps)+
        '\n\nEntry point: '+review['endpoint']+'\nTransport: '+review['transport']+
        '\nImplementation: '+review['implementation']+'\n\nGate source anchors:\n'+
        '\n'.join(f'{a["path"]}:{a["line"]}\n{a["text"]}' for a in review['gateSourceAnchors'])+
        '\n\nSources (hashes are recorded in uml-source-review.json):\n'+
        '\n'.join(item['path'] for item in review['sources'])+
        '\n\nSolid arrows denote calls; dashed arrows denote responses/events. '
        'Local actions can summarize multiple statements; source names and notes identify the real implementation. '
        'SSE progress is emitted throughout a run, not buffered until its final result. '
        'This teaching trace is not a record of a live paid execution. '+review['gate']['boundary'])

def sequence(p, n, trace, review, steps, execution=None):
    s = p.slides.add_slide(p.slide_layouts[6])
    c.heading(s, execution['title'] if execution else review['gate']['title'],
              'UML sequence diagram · '+('adapter / resource detail · '+execution.get('scope','selected operation') if execution else review['endpoint']+' · host request path'), n, 0)
    xs = [1.84, 4.25, 6.66, 9.07, 11.48]
    names = [('User','Udemy exercise'), ('React UI',Path(review['ui']).stem),
             ('WebSocket host' if n == 66 else 'Express route',f'/api/c{n}'),
             ('Run ledger' if n == 66 else 'Host implementation',trace['symbol']),
             ('Input validator','Zod · request contract')]
    if execution: names=execution['names']
    for i, (x, (name, detail)) in enumerate(zip(xs, names)):
        c.rect(s,x-1.12,1.48,2.24,.59,'BD542F' if i == 3 else '1D252B',None,True)
        text(s,x-1.06,1.58,2.12,.21,name,12,'FFFFFF',True,True)
        text(s,x-1.06,1.81,2.12,.21,short(detail,130,10.5),10.5,'FFFFFF',True,True)
        line=arrow(s,x,2.07,x,6.43,head=False,color='8F9DA8')
        line.line.width=Pt(.7);line.line.dash_style=MSO_LINE_DASH_STYLE.DASH
    endpoint = trace['endpoint'].replace('/sessions/:id/', '/…/')
    dispatch = trace['dispatch'].replace('(...)','')
    messages = [
        (0,1,'Choose action; run',False), (1,2,'POST '+endpoint,False),
        (2,4,'Validate the request contract',False), (4,2,'Checked input; reject invalid fields',True),
        (2,3,dispatch,False), (3,3,trace['local'],False), (3,3,trace['evidence'],False),
        (3,2,'Typed result + evidence',True), (2,1,'Progress + result (SSE)' if n in SSE else 'JSON operation result',True),
        (1,1,'Update the view',False), (1,0,'Show evidence + outcome',True)]
    notes = [
        'Select the lesson inputs in '+review['ui']+'. '+META[str(n)]['objective'],
        'Send '+review['endpoint']+'. This is one named entry point, not an assertion that all lesson actions share the same route. Existing owned-session/run prerequisites still apply.',
        'The host validates the closed request contract in the named route/shared schema, including any supported mode, operation, identifiers and field limits. Host origin/identity and admission checks remain independent checks.',
        'A valid parse yields the typed input used by the handler. Invalid requests return the route\'s error response and do not follow the illustrated successful dispatch.',
        'Dispatch to '+trace['symbol']+' using '+trace['dispatch']+'. Implementation: '+review['implementation']+'. The route may construct/select an adapter or prepared entry before invoking the operation.',
        trace['local']+'. '+review['gate']['context'],
        trace['evidence']+'. '+review['gate']['boundary'],
        'Return the operation\'s typed state/evidence. Inspect the source label, stable IDs and actual host effects separately from authored or model-generated prose.',
        'Return using '+review['transport']+'. For SSE routes, progress/checkpoint frames occur while work runs and the final result arrives only if the browser remains connected. JSON-only routes do not acquire SSE semantics.',
        'The UI consumes the returned state using the implementation in '+review['ui']+'. Parsing or error handling does not grant new host authority.',
        'Show the lesson evidence and status. The following decision view expands a concrete host branch, and the existing cards/code slides explain each source step.']
    if n in ASYNC:
        messages = messages[:5]+[
            (3,2,'Accepted run identity',True), (2,1,'202 + run ID' if n != 67 else 'JSON + run ID',True),
            (3,3,trace['local'],False),(3,3,trace['evidence'],False),
            (1,2,'GET /runs/:id',False),(2,3,'Read owned run state',False),
            (3,2,'State + recorded evidence',True),(2,1,'JSON run snapshot',True),
            (1,0,'Render current state',True)]
        notes = notes[:5]+[
            'The host accepts and identifies work before it is necessarily finished. This return is not a completed report.',
            'The start route returns '+('HTTP 202' if n != 67 else 'HTTP JSON')+' with the run identity. The browser then polls the owned run endpoint.',
            'Background work: '+trace['local']+'. Do not equate acceptance or browser disconnect with completion.',
            'Background evidence: '+trace['evidence']+'. '+review['gate']['boundary'],
            'The UI issues GET /api/c'+str(n)+'/runs/:id for the accepted run, rather than creating replacement work.',
            'The handler checks the owned run and reads its current stored snapshot.',
            'Return current state and recorded evidence, including any pending, failed or cleanup state.',
            'JSON polling does not replay an SSE stream. The existing run identity is preserved.',
            'Render the current state. Polling may observe running work before a final outcome.']
    if n == 75:
        notes[4] += ' In this route store.create returns the identity before the non-awaited store.start continues worker execution.'
    if n == 66:
        messages=[(0,1,'Start owned run',False),(1,2,'Authenticated WS',False),
                  (2,4,'Parse typed WebSocket command',False),(4,2,'Closed command',True),
                  (2,2,'Check owner + key',False),(2,3,'Start / send once',False),
                  (3,3,'Record frames + effects',False),(3,2,'Sequenced progress / result',True),
                  (2,1,'WebSocket frames',True),(1,1,'Track last sequence',False),
                  (0,1,'Reconnect same run',False),(1,2,'Reconnect + lastSeq',False),
                  (2,1,'Replay later frames',True),(1,0,'Render retained run',True)]
        notes=[
            'Start the owned run from the React exercise. Credentials and run ownership are selected through the local authentication contract.',
            'Connect to /api/c66/ws using the supported local WebSocket authentication. This is not POST SSE.',
            'lab66CommandSchema validates the closed command union before dispatch.',
            'Only known typed commands reach the host command handler; malformed/foreign requests are refused.',
            'The host checks the owned run and command key. Reusing a key with conflicting content is not a new authorized command.',
            'Start the run or admit its message once. A duplicate command must not create a second accepted user turn or host effect.',
            'The host records bounded sequenced frames and checked effects in retained run state.',
            'Progress and result frames carry the host sequence, allowing reconnect to refer to a stable position.',
            'Send the recorded frames over the current WebSocket connection.',
            'The UI tracks the latest observed sequence for the current run. View state does not create a new provider session.',
            'A later reconnect refers to the same existing run. Disconnect alone does not cancel host work.',
            'Send the reconnect command with the known run and last observed sequence.',
            'The host replays only later retained frames, preserving command idempotency and run identity.',
            'Render the recovered run state; cancellation is a separate typed host command.']
    if execution:
        messages=execution['messages']
        notes=[label+'. '+execution.get('scope','') for _,_,label,_ in messages]
        notes += ['Provider-labelled methods are simulated by the fixture unless this view explicitly says live. No provider operation was executed to create this presentation.',
                  'The sequence groups adapter calls for readability. Consult the individual code slides and named sources for the full method signatures and state checks.']
        if n==9:notes += ['Compare all offline makes fresh fixture requests. The live adapter separately retrieves and verifies the real base agent and resolved configuration.']
        if n==10:notes += ['The stream opens before the prompt is sent; at most one corrective round follows host JSON validation.']
        if n==12:notes += ['Queue admission returns JSON immediately. Progress snapshots use the separately subscribed POST /api/c12/events SSE channel.']
        if n==13:notes += ['The Port + MCP lane groups two host dependencies. Local MCP operations are real local transports; the offline agent/session events are authored.']
        if n==17:notes += ['Snapshot and restore calls are separate browser requests. The dry-run plan must still match owner, snapshot ID, plan ID, version and current hashes before confirmed application.']
    gap = .30 if len(messages)>=13 else min(.40,3.90/max(1,len(messages)-1))
    for i,(a,z,label,returned) in enumerate(messages):
        y=2.43+i*gap;x1,x2=xs[a],xs[z]
        if a==z:
            arrow(s,x1,y-.09,x1+.29,y-.09,head=False)
            arrow(s,x1+.29,y-.09,x1+.29,y+.065,head=False)
            arrow(s,x1+.29,y+.065,x1,y+.065)
            tx,tw,ty=x1+.37,2.01,y-.115
        else:
            arrow(s,x1,y,x2,y,returned);tx,tw,ty=min(x1,x2)+.075,abs(x2-x1)-.15,y-.22
        value=wrap(f'{i+1}. {label}',tw*72-3,11.5)
        if '\n' in value:
            if len(messages)>=13:
                value=short(f'{i+1}. {label}',tw*72-3,11.5)
            else: ty=y-.34 if a!=z else y-.25
        box=text(s,tx,ty,tw,.34 if '\n' in value else .23,value,11.5,'566574' if returned else '1D252B')
        if '\n' in value: box.text_frame.paragraphs[0].line_spacing=Pt(12)
    c.rect(s,.72,6.57,11.9,.39,'E4EEE7',None,True)
    takeaway = ('ADAPTER DETAIL: '+review['gate']['boundary']) if execution else 'ENTRY POINT: '+review['endpoint']+' · '+review['transport']
    takeaway=short(takeaway,11.55*72-8,11.5)
    text(s,.9,6.665,11.55,.21,takeaway,11.5,'28594A',True)
    teach_notes(s,review,'Adapter/resource sequence' if execution else 'Application sequence',notes,steps)
    return s

def decision(p,n,review,steps):
    gate=review['gate'];s=p.slides.add_slide(p.slide_layouts[6])
    c.heading(s,'Decision: '+gate['question'].rstrip('?'), 'UML activity diagram · selected host gate · not an additional browser endpoint', n, 0)
    dot=c.flat(s.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL,Inches(6.58),Inches(1.53),Inches(.17),Inches(.17)))
    dot.fill.solid();dot.fill.fore_color.rgb=RGBColor.from_string('1D252B');dot.line.fill.background()
    arrow(s,6.665,1.7,6.665,1.93)
    c.rect(s,.9,1.93,11.5,.87,'FFFFFF','D8E0D9',True)
    text(s,1.15,2.08,11,.57,wrap(gate['context'],11*72-8,18),18)
    arrow(s,6.665,2.8,6.665,3.05)
    diamond=c.flat(s.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.DIAMOND,Inches(4.115),Inches(3.05),Inches(5.1),Inches(1.02)))
    diamond.fill.solid();diamond.fill.fore_color.rgb=RGBColor.from_string('1D252B');diamond.line.fill.background()
    question=text(s,4.865,3.26,3.6,.60,gate['question'],17,'FFFFFF',True,True)
    question.text_frame.vertical_anchor=MSO_ANCHOR.MIDDLE
    arrow(s,4.115,3.56,3.57,3.56,head=False,color='28594A')
    arrow(s,3.57,3.56,3.57,4.32,color='28594A')
    arrow(s,9.215,3.56,9.77,3.56,head=False,color='C65330')
    arrow(s,9.77,3.56,9.77,4.32,color='C65330')
    text(s,3.66,3.29,.65,.21,'[yes]',11.5,'28594A',True)
    text(s,9.08,3.29,.65,.21,'[no]',11.5,'B94E30',True)
    for x,title,body,color in [(.9,'YES · CHECKED OUTCOME',gate['yes'],'28594A'),(6.95,'NO · ALTERNATE OUTCOME',gate['no'],'B94E30')]:
        c.rect(s,x,4.32,5.45,1.67,'FFFFFF','D8E0D9',True)
        c.rect(s,x+.23,4.53,.44,.05,color)
        text(s,x+.23,4.73,4.99,.22,title,11,color,True)
        text(s,x+.23,5.08,4.99,.88,wrap(body,4.99*72-5,17),17)
    # The branches are outcomes, not permission to execute unrelated capabilities.
    c.rect(s,.9,6.22,11.5,.65,'E4EEE7',None,True)
    text(s,1.12,6.36,11.05,.39,wrap(gate['boundary'],11.05*72-6,13),13,'28594A',True)
    teach_notes(s,review,gate['title'],[
        gate['context'],
        'Evaluate the actual host condition: '+gate['question']+' The yes/no labels refer to this exact question, not to generic model permission.',
        'Yes branch: '+gate['yes'],
        'No branch: '+gate['no'],
        gate['boundary'],
        'This is a decision inside the operation described in the context. It can be a subsequent request or a particular scenario; the main sequence names its own entry point. Do not assume every lesson action executes in one request.',
        'For students: predict the branch, run the corresponding offline scenario, then point to IDs, file/database state, ledger entries or terminal events that corroborate the result.'],steps)
    return s

def live_slide(p,n,review,steps):
    case=live_content.scenario(n)
    s=p.slides.add_slide(p.slide_layouts[6])
    c.heading(s,'Live scenario and acceptance checks','Live / integration boundary · '+case['status'],n,0)
    for i,(title,body) in enumerate(case['cards']):
        x=.85+(i%2)*5.95;y=1.7+(i//2)*2.30
        c.rect(s,x,y,5.65,2.12,'FFFFFF','D8E0D9',True)
        c.rect(s,x+.24,y+.23,.44,.05,'BD542F')
        text(s,x+.24,y+.43,5.17,.25,title.upper(),12,'B94E30',True)
        text(s,x+.24,y+.86,5.17,1.12,wrap(body,5.17*72-6,17),17)
    c.rect(s,.85,6.48,11.6,.42,'E4EEE7',None,True)
    text(s,1.04,6.56,11.22,.33,wrap(case['boundary'],11.22*72-8,11.5),11.5,'28594A',True)
    teach_notes(s,review,'Live scenario and acceptance checks',[case['status']]+[head+': '+body for head,body in case['cards']]+[case['boundary'],
        'Test evidence from this review is recorded separately. Never infer actual provider success from an injected SDK or an authored fixture test.',
        'Configured sessions must use the existing bounded budgets/deadlines and independent interruption/archival checks. No new cloud resources are provisioned by this presentation build.'],steps)
    return s,case

def old_steps(p):
    steps=[]
    for s in p.slides:
        shapes=[x for x in s.shapes if x.has_text_frame]
        if not any('CODE EXCERPT' in x.text for x in shapes): continue
        title=next((x.text for x in shapes if x.top<Inches(1) and x.left>Inches(.3)), '')
        body=next((x.text for x in shapes if x.left<Inches(6.4) and x.top>=Inches(2.2) and len(x.text)>50), '')
        source=next((x.text for x in shapes if re.search(r'(?:server|src|shared)/.*\.tsx?',x.text)), '')
        steps.append(title+' — '+body+'\nSource: '+source)
    return steps

def execution_spec(n):
    if n>22:return None
    tree=ast.parse((ROOT/f'scripts/rebuild-lab{n:02}-presentation.py').read_text(encoding='utf8'))
    if n==8:
        messages=next(ast.literal_eval(node.value) for node in ast.walk(tree) if isinstance(node,ast.Assign)
                      and any(isinstance(t,ast.Name) and t.id=='messages' for t in node.targets))
        result={'title':'Delegation and host verification',
                'names':[('User','Udemy exercise'),('React UI','Concept08Subagents'),('Express route','/api/c8/query'),
                         ('Host runner','runLab08 + role checks'),('Session adapter','Coordinator + threads')],
                'messages':messages}
    else:
        result=None
        for node in ast.walk(tree):
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='build' and len(node.args)>1:
                try: result=ast.literal_eval(node.args[1])['sequence'];break
                except (ValueError,KeyError):pass
        if result is None:raise ValueError(f'Lab {n}: original execution trace missing')
    result=dict(result)
    result['messages']=[tuple(message) for message in result['messages']]
    result['scope']='live path; fixture evidence is separate' if n in {16,18} else 'offline simulates session methods; local file/MCP effects are real'
    result['names']=[(name,detail) for name,detail in result['names']]
    if n==9:result['names'][-1]=('Session adapter','Authored or live port')
    if n==10:
        result['messages'][4]=(3,4,'Open stream; send prompt',False)
    if n==16:result['messages'][0]=(0,1,'Run live experiment',False)
    if n==17:
        replacements={6:'Persist tracked files',8:'Turn then host handler',11:'Compare file hashes',13:'Apply verified plan'}
        result['messages']=[(a,z,replacements.get(i,label),ret) for i,(a,z,label,ret) in enumerate(result['messages'])]
    return result

def improve(n):
    trace=content.TRACES[n];gate=content.GATES[n];review=source_review(n,trace,gate)
    folder=ROOT/f'presentations/lab{n:02}'
    target=next((folder/'output').glob('*.pptx'));p=Presentation(target)
    old=[];old_live=[]
    for i,s in enumerate(p.slides):
        texts='\n'.join(x.text for x in s.shapes if x.has_text_frame)
        ours=s.has_notes_slide and MARKER in s.notes_slide.notes_text_frame.text
        if ours and 'Live scenario and acceptance checks' in texts:old_live.append((i,s))
        elif ours or 'UML SEQUENCE DIAGRAM' in texts.upper():old.append((i,s))
    if not old:raise ValueError(f'Lab {n}: missing sequence insertion point')
    insertion=min(i for i,_ in old+old_live);steps=old_steps(p)
    if len(steps)<4:raise ValueError(f'Lab {n}: expected existing individual code-step slides')
    old_ids=[p.slides._sldIdLst[i] for i,_ in old]
    old_live_ids=[p.slides._sldIdLst[i] for i,_ in old_live]
    execution=execution_spec(n)
    sequence(p,n,trace,review,steps)
    if execution:sequence(p,n,trace,review,steps,execution)
    decision(p,n,review,steps)
    count=3 if execution else 2
    new_ids=list(p.slides._sldIdLst)[-count:]
    for element in new_ids:p.slides._sldIdLst.remove(element)
    for element in old_ids:
        p.part.drop_rel(element.rId);p.slides._sldIdLst.remove(element)
    for j,element in enumerate(new_ids):p.slides._sldIdLst.insert(insertion+j,element)
    for element in old_live_ids:p.part.drop_rel(element.rId);p.slides._sldIdLst.remove(element)
    live,case=live_slide(p,n,review,steps)
    live_id=p.slides._sldIdLst[-1];p.slides._sldIdLst.remove(live_id)
    # Live checks follow the individual source walkthrough, before the final challenge.
    p.slides._sldIdLst.insert(len(p.slides)-1,live_id)
    # Keep the original slide order and existing content, updating only page numbers.
    for i,s in enumerate(p.slides,1):
        for shape in s.shapes:
            if shape.has_text_frame and shape.top>Inches(6.95) and shape.left>Inches(12) and shape.text.isdigit():
                shape.text_frame.paragraphs[0].runs[0].text=f'{i:02}'
    for i,s in enumerate(p.slides):
        for shape in s.shapes:
            if shape.left<0 or shape.top<0 or shape.left+shape.width>p.slide_width+1000 or shape.top+shape.height>p.slide_height+1000:
                if s in [p.slides[insertion+j] for j in range(count)]:raise ValueError(f'Lab {n}: new UML shape outside slide')
    # Deleting/replacing slides can leave gaps in part numbers. Assign unique
    # names after all additions; python-pptx otherwise reuses a live part name.
    for i,s in enumerate(p.slides,1):
        s.part._partname=PackURI(f'/ppt/slides/slide{i}.xml')
        if s.has_notes_slide:s.notes_slide.part._partname=PackURI(f'/ppt/notesSlides/notesSlide{i}.xml')
    part_names=[str(part.partname) for part in p.part.package.iter_parts()]
    if len(part_names)!=len(set(part_names)):raise ValueError(f'Lab {n}: duplicate package part name')
    p.save(target)
    review.update({'path':target.relative_to(ROOT/'presentations').as_posix(),'slides':len(p.slides),
                   'umlSlides':[insertion+j+1 for j in range(count)],'liveSlide':len(p.slides)-1,'liveScenario':case,'codeSteps':len(steps),
                   'deckSha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    (folder/'uml-source-review.json').write_text(json.dumps(review,indent=2),encoding='utf8')
    print(f'Lab {n:02}: {len(p.slides)} slides; UML {insertion+1}–{insertion+count}; {review["transport"]}',flush=True)
    return review

if __name__=='__main__':
    first=int(sys.argv[1]) if len(sys.argv)>1 else 8
    last=int(sys.argv[2]) if len(sys.argv)>2 else 75
    results=[]
    for n in range(first,last+1):
        try:results.append(improve(n))
        except Exception as exc:
            print(f'FAILED Lab {n}: {exc}',flush=True);results.append({'lab':n,'error':str(exc)})
    destination=ROOT/f'presentations/uml-build-{first}-{last}.json'
    destination.write_text(json.dumps(results,indent=2),encoding='utf8')
    if any('error' in x for x in results):sys.exit(1)
