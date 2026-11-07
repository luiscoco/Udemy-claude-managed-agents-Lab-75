"""Authored Lab 01 teaching narration, with explicit visual targets."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'videos/lab01'
SETTINGS={'voiceId':'Yash','modelId':'inworld-tts-2','enhanceGeneration':True,'deliveryMode':'BALANCED','audioConfig':{'audioEncoding':'MP3','sampleRateHertz':48000,'speakingRate':1.25,'bitRate':192000},'timestampType':'WORD','applyTextNormalization':'OFF'}

def shape(index,paragraph=None):
 d={'shape':index}
 if paragraph is not None:d['paragraph']=paragraph
 return d
def box(x,y,w,h):return {'rect':[x,y,w,h]}
rows=[]
def slide(n,*segments):rows.append({'slide':n,'segments':[{'id':f'{n}-{i+1}','text':text,'target':target} for i,(text,target) in enumerate(segments)]})

slide(1,
 ('Welcome to Lab one: session event streaming. We will follow one prompt through the application, from the React interface to a remote Managed Agents session and back.',shape(1)),
 ('First, we will examine the interface and its recorded examples. Then we will trace the architecture and walk through twelve implementation steps. The key question is: which event carries the answer, and which event proves that the turn finished?',shape(2)))
slide(2,
 ('Start with the offline controls. The prompt asks for three bullet points about Managed Agents sessions. Keep this prompt fixed while comparing scenarios, so that the event handling is the variable you are studying.',shape(7)),
 ('Run offline fixture sends the mode, prompt, and selected scenario to the Lab one query route. The server returns an authored event sequence. This lets you study the interface without a provider account or network request.',shape(11)),
 ('Offline fixtures make no model calls and incur no provider charges. Their answers are teaching examples, so do not interpret them as measurements of Claude.',shape(15)))
slide(3,
 ('Here is the actual prompt field. You can edit it, but begin with the supplied three bullet point request. The same interface is used by both modes.',box(110,430,1700,150)),
 ('Choose Normal turn in the offline scenario selector, then use Run offline fixture. Watch how the session, answer, event history, and outcome panels populate.',box(108,590,590,105)),
 ('Run live is a separate action. This offline screenshot shows that live setup is unavailable. Completing an offline exercise does not prove that live credentials are configured.',box(108,710,970,130)))
slide(4,
 ('After a run, distinguish the creation response from the answer. Session metadata identifies the session. It is not the assistant response.',shape(7)),
 ('The authoritative agent message replaces its text preview. Appending both would display the answer twice. The application associates them using the event identity.',shape(11)),
 ('Finally, check the idle lifecycle event and its stop reason. End turn confirms normal completion. Merely seeing answer text does not establish that the turn completed.',shape(15)))
slide(5,
 ('The raw event panel preserves received event data. Use it when you need to explain why the interface changed, rather than guessing from the displayed answer.',shape(7)),
 ('Preview deltas support incremental display. Authoritative agent messages supply the final content. Lifecycle events describe session state. These are three different responsibilities.',shape(11)),
 ('Fixture order is deliberately deterministic. A live stream may contain additional events or different interleaving, so the consumer must classify events by type and identity.',shape(15)))
slide(6,
 ('This application view exposes the raw event history. Expand an event and compare its type with the explanation on the previous slide. Read the payload before drawing a conclusion.',shape(1)),
 ('As you inspect this history, locate the authoritative agent message and the lifecycle event that ends the turn. They answer different questions: what was said, and what happened to the turn?',shape(1)))
slide(7,
 ('Now compare the live controls. The prompt form remains the same; choosing Run live changes the server execution path.',shape(7)),
 ('The live path requires a server side API key, an agent identifier, and an environment identifier. These remain on the server and must never be embedded in the browser.',shape(11)),
 ('The presentation labels this example as a recorded live turn from October twelfth, twenty twenty six, replayed from event history. This video is explaining that recording; it is not executing a new live turn.',shape(2)))
slide(8,
 ('This is the live controls screenshot from that recorded example. Compare the prompt and controls with the offline view. The user experience stays familiar even though the server selects a different port implementation.',shape(1)),
 ('Before running the exercise yourself, check the current setup instructions. A historical screenshot demonstrates the recorded example, but it cannot confirm the readiness of your own account or environment.',shape(1)))
slide(9,
 ('The recorded live response contains three bullet points in the authoritative agent message. That message is the answer to the prompt.',shape(7)),
 ('The slide shows an actual historical response replayed from saved event data. Keep this separate from the authored offline example and from a new provider test.',shape(11)),
 ('Pay attention to budget units. An amount of fifty means fifty United States cents in this example. The currency label alone does not mean that the amount is fifty dollars.',shape(15)))
slide(10,
 ('Examine the authoritative answer in this application view. Check that the requested three bullet points appear once. A remaining preview with the same content would indicate a rendering error.',shape(1)),
 ('Then compare the visible answer with the underlying agent message. The interface should display provider content faithfully while keeping lifecycle status in its separate panel.',shape(1)))
slide(11,
 ('The recorded turn reached idle with the end turn stop reason. That lifecycle evidence supports the completed outcome.',shape(7)),
 ('The slide also records that cleanup archived the session. Archiving is a cleanup action after the turn, rather than the message that carries the answer.',shape(11)),
 ('The historical example reports four hundred fourteen output tokens and a list cost of one United States cent. These figures belong to this recording. List cost and billed cost are different measures, and future runs may differ.',shape(15)))
slide(12,
 ('In the application evidence, locate the lifecycle status and the final turn outcome. Verify the end turn reason independently of the assistant text.',shape(1)),
 ('For your own exercise, record the session identity and inspect the actual events you received. Do not copy the historical usage or cost values as if they were your own results.',shape(1)))
slide(13,
 ('Read this sequence diagram from top to bottom. The actors are the user, React interface, Express route, Anthropic SDK adapter, and remote Managed Agents session.',{'shapes':[7,8,9,10,11]}),
 ('The user runs the prompt. React posts the request. Express validates it, opens the browser event stream, and calls the Lab one runner. The adapter creates the remote session, opens its event stream, and sends the user message.',{'shapes':[13,15,19,21,23]}),
 ('Agent and lifecycle events return through the adapter and the event consumer. Express emits progress frames and a final local result. React parses those frames and renders the answer and turn outcome.',{'shapes':[25,27,29,33,35]}),
 ('The optional cancellation section is a different path. A browser abort closes the local request. The server independently attempts a remote interruption and checks its status. Closing the browser request alone is not proof that the remote work stopped.',{'shapes':[37,39,41,43,44]}))
slide(14,
 ('The twelve cards are our implementation checklist. The first four cover startup, entering a prompt, posting the request, and routing it to Lab one.',{'shapes':[3,6,9,12]}),
 ('Steps five through eight validate the input, open the browser event stream, create the session and send the message, then receive session events.',{'shapes':[15,18,21,24]}),
 ('The final four consume and translate events, parse the browser stream, render the interface, and classify completion, pause, failure, or cancellation. We will now examine each step with its code.',{'shapes':[27,30,33,36]}))

steps=[
 (15,'Step one. Start the lab with npm run dev. This launches the Express backend and Vite frontend together. The backend loads the local environment configuration when it exists.',
  'In the code, the server uses the configured learning API port, with three zero seven six as its default. Vite serves the browser application on port five one seven four. Offline exercises do not need a model key.',
  'The architecture strip shows the path from React, through the Vite proxy and Express, to the remote API. At startup, we are preparing the local frontend and backend.'),
 (16,'Step two. Open lesson one and choose Run the exercise. The prompt field begins with a request for three bullet points about Managed Agents sessions.',
  'The handler creates an Abort Controller, clears previous frames and results, and marks the request pending. It then calls stream Post with the selected mode, prompt, scenario, and cancellation signal.',
  'The highlighted React stage owns local interface state. Clearing old results prevents a previous answer from being mistaken for the current run.'),
 (17,'Step three. The browser posts the prompt as JSON. Offline requests also select a fixture scenario. Live requests follow the live mode contract.',
  'The fetch call uses POST and requests a text event stream response. Its body is serialized JSON, and the abort signal allows local cancellation. Native Event Source supports GET, so this POST stream uses fetch.',
  'Vite proxies the API path to Express. Provider credentials stay on the server. The browser receives only the application response stream.'),
 (18,'Step four. Express routes the request to Lab one. The lesson registry mounts each router beneath its own numeric API prefix.',
  'The excerpt mounts each registered router, then shows the query POST handler. Strict JSON parsing applies an eight kilobyte limit before the handler validates the request.',
  'This is the backend entry point. Routing chooses the lesson implementation; validation decides whether the request is allowed to proceed.'),
 (19,'Step five. Validate the request with Zod before opening the event stream. The prompt must be trimmed and contain between one and one thousand characters.',
  'The strict object schema validates the mode and scenario and rejects unknown fields. Safe parse returns a structured failure rather than executing an invalid request.',
  'Invalid input returns HTTP four hundred before event streaming or provider calls. Capacity limits return four hundred twenty nine. An invalid request must not create remote work.'),
 (20,'Step six. Open the server sent event response to the browser. Flushing its headers allows the browser to process frames as they arrive.',
  'The open SSE helper receives the request controller, heartbeat interval, idle bound, and overall deadline. A disconnected browser aborts the local controller.',
  'These controls bound local resources. Remote cleanup remains the runner responsibility, so a closed connection and a confirmed remote stop are separate facts.'),
 (21,'Step seven. In live mode, create a dedicated remote session using the configured agent, environment, and budget. This introductory lab rejects agents with tools or MCP servers.',
  'The code creates the session, opens the upstream event stream, and only then sends the user message. Opening the stream first avoids missing early response events.',
  'The remote API runs the agent. No local Claude Code process is launched by this path. The server adapter owns the remote session boundary.'),
 (22,'Step eight. Classify the session event stream. Event start and event delta provide best effort previews, identified by event and content block.',
  'The authoritative agent message replaces its preview. Do not append the complete message to the same preview text, because that would duplicate the answer.',
  'The idle event includes a stop reason. End turn indicates normal completion; requires action and budget reached indicate pauses. Arrival of text is not a substitute for lifecycle evidence.'),
 (23,'Step nine. Both authored fixtures and live streams pass through the same event consumer. This makes the deterministic examples useful for testing the real rendering path.',
  'The runner reads each upstream event and passes it to the consumer. The resulting frames are emitted as progress events. The route later sends one local result and closes its stream.',
  'Persisted events are deduplicated by identity, while preview deltas are still applied as updates. The local result describes the run; it is not another provider answer.'),
 (24,'Step ten. Parse the browser event stream incrementally. Network chunks do not necessarily align with complete event frames or text characters.',
  'The parser accepts bytes from the response reader and retains incomplete data until the next chunk. A complete frame is parsed as JSON and dispatched to the interface callback.',
  'The parser handles line endings and multiline data fields, then validates lesson contracts. A broken POST is not automatically repeated, because retrying could create another remote operation.'),
 (25,'Step eleven. React keeps session metadata, assistant content, lifecycle events, and outcomes separate. Each panel answers a different question.',
  'The code builds a set of authoritative message event identifiers. A preview is displayed only while no authoritative message with that identifier has replaced it.',
  'This prevents duplicate answers during incremental streaming. Completion changes the outcome display; it does not append the assistant answer a second time.'),
 (26,'Step twelve. Classify the outcome honestly. A completed turn requires end turn without a local cancellation or expired deadline.',
  'A paused turn, terminal failure, or stream ending before completion must not be reported as success. The outcome cards summarize these different states.',
  'Cancel aborts the browser POST. The server attempts a bounded remote interruption before closing upstream. If that interruption cannot be confirmed, inspect the session in the provider console.')]
for n,a,b,c in steps:
 slide(n,(a,shape(2,0)),(b,shape(5) if n not in (22,26) else {'shapes':[5,8,11]}),(c,shape(2,2) if n in (19,24,26) else {'shapes':[12,14,16,18]} if n in (22,26) else {'shapes':[6,8,10,12]}))
slide(27,
 ('We have followed the whole round trip: one prompt enters the application, and agent text and turn status return through separate channels.',shape(1)),
 ('Your challenge is to find the three bullet points in the authoritative agent message, then confirm the end turn stop reason in the lifecycle events. Explain why both are necessary.',shape(2)),
 ('Then compare a paused or cancelled scenario with the normal turn. If you can explain the difference between answer content, local transport state, and remote completion, you understand the central idea of Lab one.',{'shapes':[3,5,7,9]}))

def main():
 # Focus screenshot narration on the actual controls/evidence being discussed.
 gui_targets={6:[[105,255,1700,650],[115,680,1680,225]],8:[[300,398,1150,302],[300,725,1320,285]],10:[[300,410,1310,385],[300,810,1310,205]],12:[[350,155,1210,380],[365,210,1220,145]]}
 for n,rects in gui_targets.items():
  for segment,rect in zip(rows[n-1]['segments'],rects):segment['target']={'rect':rect}
 for segment in rows[5]['segments']:segment['target']['textBlock']=True
 rows[9]['segments'][0]['target']['textBlock']=True
 OUT.mkdir(parents=True,exist_ok=True)
 deck=next((ROOT/'presentations/lab01/output').glob('*.pptx'))
 plan={'lab':1,'presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':0.8},'slides':rows}
 assert len(rows)==27 and all(len(' '.join(x['text'] for x in r['segments']))<2000 for r in rows)
 (OUT/'narration-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf8')
 print('Authored 27 slides,',sum(len(r['segments']) for r in rows),'highlight segments,',sum(len(x['text']) for r in rows for x in r['segments']),'characters.')
if __name__=='__main__':main()
