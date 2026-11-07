from pathlib import Path
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.oxml.xmlchemy import OxmlElement
import importlib.util
spec=importlib.util.spec_from_file_location('course','scripts/rebuild-course-presentations.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c);b=c.b
p=Presentation();p.slide_width=Inches(13.333333);p.slide_height=Inches(7.5);blank=p.slide_layouts[6]
def slide(title,label):
 s=p.slides.add_slide(blank);c.heading(s,title,label,8,len(p.slides));return s
def cards(title,label,items):
 s=slide(title,label)
 for i,(h,t) in enumerate(items):c.card(s,.7+i*4.03,1.75,3.85,4.4,h,t)
def capture(title,filename,note):
 s=slide(title,'GUI · offline fixture');path=Path('presentations/lab08/assets')/filename;im=Image.open(path);w=min(11.85,4.8*im.width/im.height);h=w*im.height/im.width
 s.shapes.add_picture(str(path),Inches((13.333-w)/2),Inches(1.6),width=Inches(w),height=Inches(h))
 if h<3.7:b.textbox(s,.9,6.15,11.5,.55,note,17,'28594A')
s=p.slides.add_slide(blank);b.bg(s,'172A25');c.rect(s,0,0,.14,7.5,'E5744A')
b.textbox(s,.85,.72,7.3,.35,'CLAUDE MANAGED AGENTS  /  LAB 08',13,'EAA185',True)
b.textbox(s,.85,1.55,7.5,1.8,'Delegation and session threads',38,'FFFFFF',True,'Georgia')
b.textbox(s,.9,4,7,1.5,'Follow predefined agents through delegated tasks, thread histories and verified host effects.',21,'D8E5DB')
c.rect(s,8.75,1.25,3.65,4.9,'23453A','3A6152',True)
for y,num,label in [(1.75,'01','EXPLORE THE GUI'),(2.75,'02','TRACE THE FLOW'),(3.75,'03','READ THE CODE'),(4.75,'04','VERIFY EFFECTS')]:
 b.textbox(s,9.1,y,.55,.4,num,15,'F1A083',True);b.textbox(s,9.85,y,2.25,.55,label,15,'FFFFFF',True)
cards('Run a delegation experiment','GUI · controls', [('Scenario','Choose normal, duplicate events, cross-posted call, wrong role or hang.'),('Run offline','The authored fixture produces deterministic thread and effect evidence.'),('Cancel','Cancel a hanging run and inspect the interruption outcome.')])
capture('Delegation experiment controls','overview.png','Choose a scenario and run the offline fixture.')
cards('Inspect threads and effects','GUI · evidence', [('Thread histories','Compare the parent and child thread IDs, roles, statuses and messages.'),('Effect ledger','See each role, action, authorization decision and independently verified effect.'),('Evidence boundary','Separate histories do not imply separate filesystems or credentials.')])
capture('Child reports have separate histories','threads.png','The fixture reports are authored examples, not proof of real parallel execution.')
capture('The host checks each capability','evidence.png','The reviewer write is denied; the host independently calculates the sum.')
s=slide('Delegation and host verification','UML sequence diagram · live topology and host evidence');xs=[1.25,3.9,6.55,9.2,11.85]
for i,(name,detail) in enumerate([('User',''),('React UI','Concept08Subagents'),('Express route','POST /api/c8/query'),('Host runner','fixture or live port'),('Session API','coordinator · threads')]):
 x=xs[i];c.rect(s,x-1.12,1.48,2.24,.52,'C65330' if i==3 else '1C302A',None,True);b.textbox(s,x-.98,1.55,1.96,.21,name,12,'FFFFFF',True)
 if detail:b.textbox(s,x-.98,1.78,1.96,.17,detail,9,'FFFFFF',True)
 line=c.flat(s.shapes.add_connector(1,Inches(x),Inches(2.02),Inches(x),Inches(6.73)));line.line.color.rgb=RGBColor.from_string('9AAFA5');line.line.width=Pt(.8);line.line.dash_style=MSO_LINE_DASH_STYLE.DASH
messages=[(0,1,'Choose scenario and run',0),(1,2,'POST /query + scenario',0),(2,3,'Validate; runLab08',0),(3,4,'Create and stream session',0),(3,4,'Send user message',0),(4,3,'Thread-created events',1),(4,3,'Thread messages and tool calls',1),(3,4,'Send custom-tool result',0),(3,4,'List threads and histories',0),(4,3,'Thread histories',1),(3,2,'States, threads and effects',1),(2,1,'Progress and result (SSE)',1)]
for i,(a,z,label,ret) in enumerate(messages):
 y=2.32+i*.36;x1,x2=xs[a],xs[z];line=c.flat(s.shapes.add_connector(1,Inches(x1),Inches(y),Inches(x2),Inches(y)));line.line.color.rgb=RGBColor.from_string('617C70' if ret else '203A30');line.line.width=Pt(1.1)
 if ret:line.line.dash_style=MSO_LINE_DASH_STYLE.DASH
 end=OxmlElement('a:tailEnd');end.set('type','triangle');line._element.spPr.ln.append(end);b.textbox(s,min(x1,x2)+.09,y-.24,abs(x2-x1)-.18,.22,f'{i+1}. {label}',11,'41594D' if ret else '1C252C',True)
cards('Enforce role capabilities','Host workflow · permitted effects',[('Researcher','The approved read is limited to the authored research fixture.'),('Reviewer','A proposed write is denied; the handler does not run.'),('Calculator','The host independently recomputes the permitted numeric result.')])
steps=[
('Select and run','src/concepts/Concept08Subagents.tsx','The UI sends the selected scenario and prompt. Live mode forces the normal scenario.',"streamPost('/api/c8/query', {\n  mode, prompt,\n  scenario: mode === 'live'\n    ? 'normal' : scenario,\n  deadlineSeconds: 30\n  // live budget omitted\n})"),
('Validate and select a port','server/concepts/08-subagents.ts','The route validates the request, applies capacity and deadline checks, and selects fixture or live execution.',"const parsed = lab08RequestSchema\n  .safeParse(request.body);\nport = parsed.data.mode === 'live'\n  ? live(parsed.data)\n  : createFixtureLab08Port(/* ... */);"),
('Configure predefined agents','server/lib/lab08-port.ts','The coordinator uses predefined agents with inline agents and workflows disabled.',"type: 'multiagent_20261001',\nsubagents: {\n  type: 'enabled',\n  inline_agents: { type: 'disabled' },\n  predefined_agents: agentIds.map(\n    id => ({ type: 'agent', id }))\n},\nworkflows: { type: 'disabled' }"),
('Execute the delegation','server/lib/lab08-run.ts','The runner calls the chosen port and emits typed thread, effect and state frames.',"const result = await port.execute(\n  input, signal, emit);\nreturn lab08ResultSchema.parse({\n  threads: result.threads,\n  effects: result.effects,\n  // other result fields omitted\n});"),
('Correlate thread identities','server/lib/lab08-port.ts','In the live port, created thread IDs are associated with recognized agent roles.',"if (raw.type ===\n    'session.thread_created') {\n  const role = roleFromName(\n    raw.agent_name);\n  if (role) roles.set(\n    String(raw.session_thread_id), role);\n}"),
('Enforce the capability','server/lib/lab08-port.ts','The host uses the thread role and tool name to decide whether an action may run.',"const threadId = typeof\n  raw.session_thread_id === 'string'\n  ? raw.session_thread_id : '';\nconst role = roles.get(threadId);\nlet decision = 'denied',\n  handlerRan = false;\n// role-specific checks follow"),
('Return and audit the result','server/lib/lab08-port.ts','The host emits an effect record and sends a custom-tool result correlated to the call ID.',"effects.push(audit);\nemit('effect', audit);\nawait client.beta.sessions.events.send(\n  session.id, { events: [{\n    type: 'user.custom_tool_result',\n    custom_tool_use_id: raw.id,\n    // content and is_error omitted\n  }] });"),
('Read history and evidence','server/lib/lab08-port.ts','The live port lists session threads and each thread history; the UI displays them beside the effect ledger.',"client.beta.sessions.threads.list(\n  session.id, { limit: 20 }, { signal });\nclient.beta.sessions.threads.events.list(\n  t.id, { session_id: session.id,\n    limit: 100 }, { signal });")]
s=slide('The workflow at a glance','From scenario to verified effect')
for i,(title,_,_,_) in enumerate(steps):
 x=.8+(i%4)*3.15;y=1.75+(i//4)*2.35;c.rect(s,x,y,2.9,1.95,'FFFFFF','D8E0D9',True);b.textbox(s,x+.22,y+.22,.5,.45,str(i+1),20,'C65330',True);b.textbox(s,x+.22,y+.85,2.46,.85,title,19,b.INK,True)
for i,(title,path,body,code) in enumerate(steps):
 s=slide(f'{i+1} · {title}','Workflow step');b.textbox(s,.85,1.7,5.5,.35,'WHAT HAPPENS',11,'C65330',True);b.textbox(s,.95,2.25,5.45,3.4,body,22,b.INK)
 c.rect(s,6.8,1.65,5.75,4.65,'1C302A',None,True);b.textbox(s,7.08,1.98,5.18,.35,'CODE EXCERPT · SIMPLIFIED',11,'F27C55',True);b.textbox(s,7.08,2.55,5.18,2.9,code,17,'F5F5EE',False,'Consolas');b.textbox(s,7.08,5.64,5.18,.45,path,11,'B8C9BE',False,'Consolas')
 for j in range(8):c.rect(s,.85+j*.7,6.62,.57,.055,'D36A45' if j==i else 'CAD7CD',None,True)
 b.textbox(s,6.52,6.52,1.4,.22,f'STEP {i+1} / 8',9,'5C7567',True)
cards('Challenge: deny a wrong-role call','Student challenge',[('Run','Choose wrong-role and run the offline fixture.'),('Inspect','Find the reviewer calculator request and its denied effect.'),('Explain','Compare the worker report with host evidence and explain why separate histories do not prove isolation.')])
target=next(Path('presentations/lab08/output').glob('*.pptx'));p.save(target);print(f'Saved {target}: {len(p.slides)} slides')
