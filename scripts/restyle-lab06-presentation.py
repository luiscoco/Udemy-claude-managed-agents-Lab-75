"""Rebuild Lab 06 using the Lab 01 teaching layout and verified Lab 06 sources."""
from pathlib import Path
import hashlib, importlib.util, json, re
from PIL import Image, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.xmlchemy import OxmlElement

ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'presentations/lab06'
BG,INK,ORANGE,BORDER='F5F3EF','1D252B','C3532D','E8D4C7'
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/build-lesson-presentations.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
r=Presentation();r.slide_width=Inches(13.333333);r.slide_height=Inches(7.5);blank=r.slide_layouts[6]
r.core_properties.title='Lab 06 · Sessions and retained context'

def flat(shape):
    style=shape._element.find('{http://schemas.openxmlformats.org/presentationml/2006/main}style')
    if style is not None:shape._element.remove(style)
    return shape

def rect(s,x,y,w,h,fill,line=None,rounded=False):
    shape=s.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if rounded else MSO_AUTO_SHAPE_TYPE.RECTANGLE,Inches(x),Inches(y),Inches(w),Inches(h))
    if rounded:shape.adjustments[0]=.045
    shape.fill.solid();shape.fill.fore_color.rgb=RGBColor.from_string(fill)
    if line:shape.line.color.rgb=RGBColor.from_string(line);shape.line.width=Pt(.65)
    else:shape.line.fill.background()
    return flat(shape)

def text(s,x,y,w,h,value,size=18,color=INK,bold=False,font='Arial',align=None):
    shape=b.textbox(s,x,y,w,h,value,size,color,bold,font)
    if align is not None:shape.text_frame.paragraphs[0].alignment=align
    return shape

def wrap(value,points,size,font='arial.ttf'):
    face=ImageFont.truetype('C:/Windows/Fonts/'+font,round(size*10));lines=['']
    for word in value.split():
        candidate=(lines[-1]+' '+word).strip()
        if lines[-1] and face.getlength(candidate)/10>points:lines.append(word)
        else:lines[-1]=candidate
    return '\n'.join(lines)

def slide(title,label=''):
    s=r.slides.add_slide(blank);b.bg(s,BG)
    text(s,.6,.48,12.1,.8,title,32,INK,True,'Cambria')
    if label:text(s,.64,1.25,12,.24,label.upper(),10.5,ORANGE,True)
    text(s,12.2,7.05,.6,.25,str(len(r.slides)),10,'566574',align=PP_ALIGN.RIGHT)
    return s

def notes(s,body,paths):s.notes_slide.notes_text_frame.text=body+'\n\nSources:\n'+'\n'.join(paths)

def badge(s,x,y,value,diameter=.55,size=16):
    shape=s.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL,Inches(x),Inches(y),Inches(diameter),Inches(diameter));flat(shape)
    shape.fill.solid();shape.fill.fore_color.rgb=RGBColor.from_string(ORANGE);shape.line.fill.background()
    tf=shape.text_frame;tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0;tf.vertical_anchor=MSO_ANCHOR.MIDDLE
    p=tf.paragraphs[0];p.text=str(value);p.font.name='Cambria';p.font.size=Pt(size);p.font.bold=True;p.font.color.rgb=RGBColor.from_string('FFFFFF');p.alignment=PP_ALIGN.CENTER

def card(s,x,y,w,h,title,body,number):
    rect(s,x,y,w,h,'FFFFFF',BORDER,True);badge(s,x+.18,y+.18,number,.42,14)
    text(s,x+.76,y+.2,w-.94,.4,title,15,ORANGE,True)
    text(s,x+.22,y+.8,w-.44,h-.9,wrap(body,(w-.48)*72,17),17)

def picture(s,name,x,y,w):
    path=FOLDER/'assets'/name;im=Image.open(path);h=w*im.height/im.width
    s.shapes.add_picture(str(path),Inches(x),Inches(y),width=Inches(w),height=Inches(h))

def strip(s,active):
    for i,label in enumerate(['React UI  ·  src/','Vite proxy  ·  :5174','Express server  ·  :3076','Managed Agents API']):
        x=.6+i*3.15;rect(s,x,6.3,2.7,.55,ORANGE if i in active else 'FFFFFF',None if i in active else BORDER,True)
        text(s,x+.08,6.45,2.54,.23,label,12,'FFFFFF' if i in active else '566574',i in active,align=PP_ALIGN.CENTER)
        if i<3:
            line=flat(s.shapes.add_connector(1,Inches(x+2.77),Inches(6.575),Inches(x+3.08),Inches(6.575)))
            line.line.color.rgb=RGBColor.from_string('566574');line.line.width=Pt(1)
            end=OxmlElement('a:tailEnd');end.set('type','triangle');line._element.spPr.ln.append(end)

# Lab 01 cover palette, large serif headline and a compact four-stage preview.
s=r.slides.add_slide(blank);b.bg(s,INK)
text(s,.8,.82,11.7,.4,'CLAUDE MANAGED AGENTS LAB  ·  LAB 06',14,'F2A075',True)
text(s,.8,1.65,11.8,1.65,'Sessions and\nretained context',46,'FFFFFF',True,'Cambria')
text(s,.84,3.62,10.8,.9,'One conversation, multiple turns. Trace session reuse,\nreconnection and explicit closure through the application.',21,'E9E3DC')
for i,(heading,detail) in enumerate([('CREATE','A new session'),('CONTINUE','The same session ID'),('RECONNECT','History, no new prompt'),('CLOSE','Archive when idle')]):
    x=.84+i*3.05;rect(s,x,5.18,2.72,1.25,'263138',None,True)
    text(s,x+.2,5.37,2.32,.24,heading,12,'F2A075',True);text(s,x+.2,5.85,2.32,.3,detail,15,'FFFFFF')
text(s,.84,6.83,11,.25,'GUI walkthrough  /  UML sequences  /  12 code steps',11,'C7C2BC')
notes(s,'A retained session differs from a local request/turn. Offline captures are authored fixture behavior; live mode uses the Managed API adapter.',['shared/lab06-sessions.ts','server/lib/lab06-port.ts'])

s=slide('Start with the session experiment','GUI · prompt and offline scenario');picture(s,'overview.png',.72,1.57,11.9)
notes(s,'Open /?lesson=6. Select Use introduction and Normal retained session. New offline creates an authored fixture session. Full controls are shown without screenshot cropping.',['src/concepts/Concept06Sessions.tsx'])
s=slide('Choose how the conversation continues','GUI · three actions, three distinct effects');picture(s,'actions.png',.72,1.62,11.9)
for i,(title,body) in enumerate([('New offline','Create a new fixture session. Use introduction before starting.'),('Continue','Select Use follow-up. Send another message using the existing conversation ID.'),('Reconnect','Read persisted history in the same session, without sending a new prompt.')]):card(s,.72+i*4.04,4.3,3.82,2.2,title,body,i+1)
notes(s,'Continue and Reconnect require a conversation already created. They preserve the selected mode; after New live both use the live port.',['src/concepts/Concept06Sessions.tsx','shared/lab06-sessions.ts'])
s=slide('Read the IDs before comparing answers','GUI · session identity after Continue');picture(s,'identity.png',.72,1.62,11.9)
for i,(title,body) in enumerate([('Conversation UUID','The host key selects a conversation belonging to the exercise owner.'),('Managed session ID','The same sesn_ ID is reused by Continue and Reconnect.'),('Turn and sent event','A turn UUID identifies this request; sevt_ identifies the sent message.')]):card(s,.72+i*4.04,4.72,3.82,1.95,title,body,i+1)
notes(s,'Compare conversationId and sessionId across requests, then localTurnId and sentEventId. Reconnect creates a new localTurnId but sentEventId=null and turnCount is unchanged.',['server/concepts/06-sessions.ts','shared/lab06-sessions.ts'])
s=slide('The continued session retains both turns','GUI · authored fixture history and outcome');picture(s,'history.png',.72,1.55,11.9)
notes(s,'The second fixture answer contains Aurora Finch. duplicatesIgnored=2 refers to already indexed messages. archived=false means the session remains retained. This capture is not evidence of an actual Claude run.',['server/lib/lab06-port.ts','tests/lab06-sessions.test.ts'])
s=slide('Reconnect reads history without a new turn','GUI · duplicate evidence and retained state');picture(s,'reconnected.png',.72,1.6,11.9)
for i,(title,body) in enumerate([('Open first','Open the upstream stream before fetching paginated history.'),('Merge by event ID','Four indexed records produce four duplicate progress frames.'),('Keep the session','No send, new message or archive. This request stream then closes.')]):card(s,.72+i*4.04,5.0,3.82,1.8,title,body,i+1)
notes(s,'Reconnect does not enter the normal event-consumption loop. Duplicate progress IDs are synthetic markers; deduplication uses persisted IDs.',['server/concepts/06-sessions.ts','server/lib/lab06-store.ts'])

# Preserve the four previously approved, source-traced UML sequences.
spec=importlib.util.spec_from_file_location('uml',ROOT/'scripts/lab06-uml.py');uml=importlib.util.module_from_spec(spec);spec.loader.exec_module(uml)
uml.build(slide,rect,flat,b)

UI='src/concepts/Concept06Sessions.tsx';ROUTE='server/concepts/06-sessions.ts';PORT='server/lib/lab06-port.ts';STORE='server/lib/lab06-store.ts'
# Each entry: card/slide title, source files, highlighted architecture nodes, bullets, teaching excerpt.
steps=[
('Start the lab with one command',['package.json','server/index.ts','vite.config.ts'],[1,2],[
 '`npm run dev` starts the Express backend and Vite frontend together.',
 'The backend runs TypeScript through `tsx`; startup loads `.env` if it exists.',
 'Defaults: Express on 3076 and Vite on 5174. Offline runs need no API key.'],'''"dev:server": "node scripts/dev-server.mjs",
"dev:web": "vite"

// server/index.ts
const port = Number(
  process.env.LEARNING_API_PORT ?? 3076
);
app.listen(port, '127.0.0.1', () => {
  // log backend readiness
});'''),
('Choose New, Continue or Reconnect',[UI],[0],[
 'Open `/?lesson=6`. Start with the introduction prompt and New offline.',
 '`Continue` and `Reconnect` require the local conversation ID from a previous result.',
 'Each request clears the displayed frames and creates an `AbortController`.'],'''const needsId = action !== 'new';
if (needsId && !conversationId) {
  setStatus('Start a conversation first.');
  return;
}
const abort = new AbortController();
controller.current = abort;
setPending(true);
setFrames([]);
setResult(undefined);'''),
('POST the action through the Vite proxy',[UI,'src/lib/sse.ts','vite.config.ts'],[0,1],[
 '`streamPost()` sends JSON to `/api/c6/query` and reads SSE with `fetch`.',
 'Continue includes `conversationId`; Reconnect sends an empty prompt.',
 'The Vite `/api` proxy forwards to Express. Live credentials remain on the server.'],'''streamPost('/api/c6/query', {
  mode: chosen, action,
  ...(needsId ? { conversationId } : {}),
  prompt: action === 'reconnect'
    ? '' : prompt,
  scenario: chosen === 'scripted'
    ? scenario : 'normal',
  deadlineSeconds: 30,
  // live budget omitted
}, { /* signal, schemas, deadlines */ });'''),
('Validate the action and request owner',['shared/lab06-sessions.ts',ROUTE],[2],[
 'Express checks `lab06RequestSchema` and the exercise owner before starting SSE.',
 'New omits an ID. Continue needs an ID and prompt; Reconnect needs an ID and empty prompt.',
 'Capacity, deadline policy and live readiness can reject a request before execution.'],'''const parsed = lab06RequestSchema
  .safeParse(request.body);
const owner = ownerOf(request.headers);
if (!owner || !parsed.success) {
  // respond 400 INVALID_REQUEST
  return;
}
// Next: capacity, deadline,
// live setup and owned lookup.'''),
('Create once or reuse the owned session',[ROUTE,STORE],[2,3],[
 'New calls `port.create()` once; `store.create()` binds its session ID to the owner.',
 'Continue and Reconnect use the owned entry, without creating a second session.',
 'Each request gets a new `localTurnId`, even when the session ID stays the same.'],'''let entry = parsed.data.action === 'new'
  ? null : lookup(
      parsed.data.conversationId!,
      owner, response);
// Validation and SSE setup omitted.
if (!entry) {
  const created = await port.create(
    parsed.data);
  entry = store.create(owner, created.id);
}
const localTurnId = randomUUID();'''),
('Open the browser and upstream streams',[ROUTE,'server/sse.ts',PORT],[2,3],[
 '`openSse()` sets up the browser response with heartbeat and deadline handling.',
 'The host opens `port.open()` before sending a prompt or hydrating history.',
 'Live uses `sessions.events.stream`; offline uses `FixtureLab06Port`.'],'''const stream = openSse(
  request, response, {
    controller, heartbeatMs: 5000,
    idleMs: 20_000,
    deadlineMs:
      parsed.data.deadlineSeconds * 1000
      + 10_000,
    quiet: true
  });
// After selecting the session:
upstream = await port.open(
  entry.sessionId, controller.signal,
  parsed.data.scenario);'''),
('Send a message into the retained session',[ROUTE,PORT],[2,3],[
 'New and Continue call `port.send()` after opening the upstream stream.',
 'The live adapter sends `user.message`. Its returned event ID becomes `sentEventId`.',
 'The host increments `turnCount`. Reconnect branches earlier and skips this send.'],'''const sentEventId = await port.send(
  entry.sessionId,
  parsed.data.prompt,
  controller.signal);
entry.turnCount++;

// Live port sends this event payload:
{ type: 'user.message', content: [
  { type: 'text', text: prompt }
] }'''),
('Consume events until the turn completes',[ROUTE],[2,3],[
 'Each upstream event becomes a typed browser progress frame.',
 'Completion requires `session.status_idle` with stop reason `end_turn`.',
 'An answer or stream EOF alone does not prove completion; early EOF yields `incomplete`.'],'''let completed = false;
for await (const event of upstream.events) {
  // Emit an event progress frame.
  if (event.type === 'session.status_idle'
      && event.stop_reason.type
         === 'end_turn') {
    completed = true;
    break;
  }
}'''),
('Hydrate history and deduplicate by ID',[ROUTE,PORT,STORE],[2,3],[
 '`port.history()` retrieves persisted user and agent messages after a turn.',
 'The live adapter reads ascending pages, keeping at most 200 message records.',
 '`store.merge()` appends unseen event IDs and counts duplicates. It does not compare text.'],'''const history = await port.history(
  entry.sessionId);
const duplicates = store.merge(
  entry, history);

// Inside store.merge() event loop:
if (entry.seen.has(event.id)) {
  duplicates++;
  continue;
}
entry.seen.add(event.id);
entry.history.push(event);'''),
('Parse the result and render the evidence',['src/lib/sse.ts',UI],[0],[
 'The SSE parser checks sequential IDs, JSON and the terminal result schema.',
 'React stores progress frames separately from the result and retained history.',
 'The result updates `conversationId`, so the next action can reuse the session.'],'''// Inside run(), after streamPost():
if (outcome.kind === 'success') {
  setResult(outcome.result);
  setConversationId(
    outcome.result.conversationId);
  setStatus(outcome.result.message);
}

// Render retained messages separately:
const messages = result?.history ?? [];'''),
('Reconnect without sending a new prompt',[ROUTE,STORE],[0,2,3],[
 'Reconnect opens the stream, then fetches and merges the existing session history.',
 'It returns `reconnected` with `sentEventId: null`; no send or turn increment occurs.',
 'Finally, the host closes this upstream stream. The retained session stays open.'],'''if (parsed.data.action === 'reconnect') {
  const duplicates = store.merge(entry,
    await port.history(entry.sessionId));
  // Emit duplicate progress markers.
  stream.send('result', {
    // IDs, history and mode omitted
    sentEventId: null,
    duplicatesIgnored: duplicates,
    outcome: 'reconnected',
    archived: false
  });
  return;
}'''),
('Cancel a turn; close only when idle',[ROUTE,PORT],[0,2,3],[
 'Cancel aborts the POST. In the aborted-error path, the host attempts `port.interrupt()`.',
 'Local cancellation does not prove remote stop and does not archive the session.',
 'Close checks status separately. Unknown or non-idle status returns HTTP 409.'],'''// POST /api/c6/close (excerpt)
const status = await port.status(
  entry.sessionId
).catch(() => 'unknown');
if (status !== 'idle') {
  // respond 409 CONFLICT
  return;
}
await port.archive(entry.sessionId);
entry.archived = true;''')]

s=slide('The workflow at a glance')
for i,(title,*_) in enumerate(steps):
    x=.6+(i%4)*3.11;y=1.65+(i//4)*1.65
    rect(s,x,y,2.81,1.36,'FFFFFF',BORDER,True);badge(s,x+.19,y+.19,i+1,.5,14)
    text(s,x+.19,y+.83,2.43,.49,wrap(title,2.39*72,14,'arialbd.ttf'),14,INK,True)
notes(s,'Twelve cards map one-to-one to twelve following code slides. Main path: steps 1–10. Step 11 explains reconnect; step 12 distinguishes cancellation from explicit close.',[ROUTE,UI])

def bullets(s,values):
    for i,value in enumerate(values):
        shape=s.shapes.add_textbox(Inches(.62),Inches(1.84+i*1.28),Inches(5.55),Inches(1.16));tf=shape.text_frame
        tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0;tf.word_wrap=True
        p=tf.paragraphs[0];p.font.name='Arial';p.font.size=Pt(18);p.line_spacing=1.1
        run=p.add_run();run.text='•  ';run.font.color.rgb=RGBColor.from_string(ORANGE)
        line_width=17
        for j,part in enumerate(re.split(r'`([^`]+)`',value)):
            face=ImageFont.truetype('C:/Windows/Fonts/'+('consola.ttf' if j%2 else 'arial.ttf'),180)
            for token in re.findall(r'\s+|\S+',part):
                width=face.getlength(token)/10
                if line_width+width>5.55*72-20:
                    p.add_line_break();line_width=0
                    if token.isspace():continue
                run=p.add_run();run.text=token;run.font.name='Consolas' if j%2 else 'Arial';run.font.size=Pt(18);run.font.color.rgb=RGBColor.from_string(ORANGE if j%2 else INK)
                line_width+=width

for i,(title,paths,active,values,code) in enumerate(steps):
    s=slide('');badge(s,.6,.48,i+1,.8,24);text(s,1.65,.48,11.1,.8,title,30,INK,True,'Cambria')
    bullets(s,values);rect(s,6.6,1.75,6.15,4.2,INK,None,True)
    label=paths[0]+(' + related source' if len(paths)>1 else '')
    text(s,6.9,2.0,5.55,.32,label,11.5,'F2A075',True)
    text(s,6.9,2.43,5.55,3.35,code,15.5,'FFFFFF',False,'Consolas');strip(s,active)
    notes(s,f'Workflow step {i+1}: {title}\n'+'\n'.join(values)+'\n\nTeaching excerpt: whitespace reformatted; comments mark omitted statements. Full source contains remaining validation and error handling. The last architecture node applies to live mode; offline uses the fixture port. Ports shown are defaults; Vite may select the next free port.',paths)

s=slide('Prove session reuse with a controlled comparison','Student exercise · inspect the IDs and persisted history')
for i,(title,body) in enumerate([('Introduce → Continue','Start New offline with Aurora Finch. Use follow-up and Continue. Expect the same session ID and four messages.'),('Fresh session','Run the follow-up in a new session. Its fixture has no introduced project name. Compare the new session ID.'),('Reconnect → Close','Reconnect: four messages, sentEventId null. Close the idle session; reusing that conversation then returns 409.')]):card(s,.72+i*4.04,1.85,3.82,3.65,title,body,i+1)
rect(s,.72,5.9,11.9,.67,INK,None,True)
text(s,.95,6.08,11.42,.3,'Explain: session reuse, new local request IDs, duplicate history, and explicit archival.',16,'FFFFFF')
notes(s,'The five existing Lab 06 tests check contracts, retention, ownership/expiry, stream order and real HTTP/SSE routing. Offline recollection is authored behavior.',['tests/lab06-sessions.test.ts'])
s=slide('Repeat the experiment with the live adapter','Live scenario · prerequisites, acceptance evidence and cleanup')
for i,(title,body) in enumerate([('Prepare','Configure the server key, existing agent/environment IDs and live opt-in. Confirm readiness before New live.'),('Run and compare','Introduce a fictional name with New live, then Continue. Check the session ID, sent event IDs and persisted messages.'),('Reconnect and close','Reconnect must send no message. Retrieve session status independently; close only when idle. Verify the archive result.')]):card(s,.72+i*4.04,1.85,3.82,3.95,title,body,i+1)
text(s,.84,6.15,11.6,.6,'Fixture captures and injected SDK tests do not establish a completed provider run. Record actual live evidence separately.',17,ORANGE,True)
notes(s,'Acceptance procedure, not a completed live-run claim. GUI live input uses budgetCents=50 and deadlineSeconds=30; server policy also applies. Continue/reconnect preserve live mode. Cancellation alone does not prove idle. Archive only after an idle status result.',[UI,PORT,ROUTE,'server/lib/managed-config.ts'])

sources=sorted(set(path for _,paths,_,_,_ in steps for path in paths)|{'scripts/dev-server.mjs','scripts/lab06-uml.py','tests/lab06-sessions.test.ts'})
review={'lab':6,'reference':'Lab 01 cover and slides 14–17','slides':len(r.slides),'guiSlides':list(range(2,7)),'umlSlides':list(range(7,11)),'workflowOverview':11,'codeSlides':list(range(12,24)),'liveScenarioSlide':25,'sources':[{'path':path,'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest()} for path in sources]}
target=next((FOLDER/'output').glob('*.pptx'));r.save(target)
(FOLDER/'style-review.json').write_text(json.dumps(review,indent=2),encoding='utf8')
print(f'Saved {target.name}: {len(r.slides)} slides, 12 numbered code steps.')
