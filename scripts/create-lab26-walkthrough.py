"""Lab 26 step-by-step walkthrough authored from real captures of the running platform (offline: an authored session fixture; live: a small script making real Managed Agents calls)."""
from lab_video_common import Deck
d=Deck(26,'Lab 26 Step by Step: Session Controls and Supported Updates, Offline and Live','Session controls');e=d.e
assert e['update-running']=='This update requires a confirmed-idle session.' and e['interrupted']=='authored-fixture: idle; confirmed-idle.'
assert e['budget-no-optin']=='Raising a budget can resume work; explicit opt-in is required.' and 'Live mode is unavailable in this lab' in e['nolive']
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'Replace tools while running → refused: 400' in L and '(confirmed idle)' in L and 'Replace tools while idle → accepted' in L
assert 'Retrieved title: Aurora Finch heron notes' in L and 'Archived: yes' in L and 'Update after archive → refused: 400' in L
assert 'fixture-model-b' in e['handoff'] and 'Summary handoff: Fictional field notebook' in e['handoff'] and e['archived']=='authored-fixture: archived; not-needed.'
d.cover('CLAUDE MANAGED AGENTS · LAB 26 · SESSION CONTROLS','<h2>In this lab</h2><p>Open an owned session.<br>Update only when idle.<br>Opt in to a budget raise.<br>Hand off to a new model.</p>',
 'Welcome to Lab twenty-six, Session controls and supported updates. In this lecture, you will operate an owned session through a strict catalog of operations, see which updates require an idle session, raise a budget only with an explicit opt-in, and change the model by starting a fresh session with a summary. The app stays offline, and then a small script makes the same calls live, on a real Managed Agents session.')
d.overview('OPEN · UPDATE · HAND OFF','Update when idle; change model in a fresh session',[
 ('ov-concepts','1 · CONCEPTS','Session controls','An owned session<br>and a strict catalog','First, the concepts: an owned session and a strict catalog of supported updates.'),
 ('ov-idle','2 · IDLE','Idle-only updates','Refused while running;<br>interrupt, then confirm idle','Second, idle-only updates: refused while a turn runs, accepted after interrupt and confirmed idle.'),
 ('ov-handoff','3 · HANDOFF','Budget and model','Opt in to a budget raise;<br>new session with a summary','Third, a budget raise that needs an opt-in, and a model change through a new session.'),
 ('ov-code','4 · LIVE AND CODE','Real calls, then code','A live script run;<br>then the TypeScript','Finally, a live terminal run against a real session, and the TypeScript code that validates every operation.')],
 'Closing a browser request does not stop remote work: interrupt and confirm idle.')
d.shot('lesson','Open Lab 26',{'lesson-title':'Open Lab twenty-six, Session controls and supported updates.','lesson-objective':'The objective: operate an owned session through a strict catalog, and compare updates that require idle with an explicit fresh-session model handoff.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: operate an owned session through a strict catalog.'),
 (2,'Core rule','Region two, the core rule: a fresh-session model handoff explicitly creates new context, under checked ownership.'),
 (3,'Keep the boundary clear','Region three: owned session updates are separate from a fresh model handoff.'),
 (6,'Put it to the test','Region six: change the model through a fresh session, and inspect its resolved configuration.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: open a slow offline session and send a turn.'),
 (2,'Run the comparison','Step two: attempt the idle tool update while running, then interrupt and confirm idle.'),
 (3,'Inspect the boundary','Step three: remove a tool and an MCP server by full replacement.'),
 (4,'Follow the workflow','Step four: try a budget increase without opt-in, then opt in explicitly.')])
d.shot('experiment','The session controls experiment',{'exp-rule':'Open Run the exercise. Agent tool and MCP updates replace the full arrays and require idle. Model changes start a fresh session with an explicit host summary.',
 'exp-fields':'The supported update fields are title, metadata, agent tools, agent MCP servers, and budget. Model, system, and skills are disabled.','exp-open':'Select Open offline session.'})
d.shot('opened','Offline · An owned fixture session',{'opened-session':'The authored fixture session is idle, on fixture model A, at version one.','opened-tools':'It has two tools, one MCP server, and a budget of ten cents.'})
d.shot('update-running','Offline · Update while running',{'update-running-session':'Send a slow turn. The session is now running.','update-running-status':'Replacing tools while it runs is refused: this update requires a confirmed-idle session.'})
d.shot('interrupted','Offline · Interrupt and confirm idle',{'interrupted-session':'Send another turn, and interrupt it. The session is idle again, at version five.','interrupted-status':'The status shows confirmed idle.'})
d.shot('history','Offline · Authored history',{'history-list':'The history records both turns: the first finished with a reply, and for the second the host observed the interrupt acknowledgment and confirmed idle.'})
d.shot('replaced','Offline · Full replacement',{'replaced-tools':'Now replace the tools and MCP arrays, keeping only read report. Format note and the MCP server are removed: an omitted entry is gone.','replaced-status':'The session stays idle.'})
d.shot('budget-no-optin','Offline · Budget raise without opt-in',{'budget-no-optin-status':'Raise the budget to twenty cents without the opt-in. It is refused, because raising a budget can resume work.','budget-no-optin-tools':'The budget stays at ten cents.'})
d.shot('budget-optin','Offline · Budget raise with opt-in',{'budget-optin-tools':'Check Opt in to possible resume, and try again. The budget is now twenty cents.','budget-optin-status':'The session is still idle.'})
d.shot('title','Offline · Title and metadata',{'title-inputs':'Title and metadata are supported updates too.','title-session':'The update is accepted, and the version advances to eight.','title-status':'The session remains idle.'})
d.shot('handoff','Offline · New session with summary',{'handoff-session':'To change the model, select New session with summary. This is a new session, on fixture model B, at version one.',
 'handoff-parent':'Its parent is the original session, and the explicit summary is the only context carried forward.'})
d.shot('archived','Offline · Archive the idle session',{'archived-session':'Finally, archive the idle session.','archived-status':'Archived sessions cannot be mutated.'})
d.shot('no-live','The app stays offline',{'no-live-text':'The app stays offline in this lab: there is no Run live button, and the authored fixture cannot confirm provider effects or billed usage. So now we make the real calls from a small script, in the terminal of the project.'})
d.terminal('Live · Refused while running, then idle',[(l,'lv-run' if l.startswith('PS ') else 'lv-created' if l.startswith('Session sesn_') else 'lv-running' if l.startswith('Status running') else 'lv-refused' if l.startswith('Replace tools while running') else 'lv-idle' if l.startswith('Polled') else None) for l in live[:7]],
 {'lv-run':'The script reads the agent and environment IDs from dot env, and runs with node and t s x.',
  'lv-created':'It creates one session, with no tools and a budget of twenty-five cents. The session starts idle.',
  'lv-running':'It sends a user message that asks for a longer answer. After zero point seven seconds, the session is running.',
  'lv-refused':'Replacing the tools now is refused by the API: four hundred, bad request error. Agent tool updates require a session that is not running.',
  'lv-idle':'It sends user dot interrupt, and polls sessions dot retrieve. After eleven seconds, the status is idle: confirmed idle.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Update, archive, refused',[(l,'lv-replaced' if l.startswith('Replace tools while idle') else 'lv-budget' if l.startswith('Budget raised') else 'lv-title' if l.startswith('Retrieved title') else 'lv-archived' if l.startswith('Archived') else 'lv-after' if l.startswith('Update after archive') else None) for l in live[:1]+live[7:]],
 {'lv-replaced':'Now the same tools replacement is accepted: zero tools and zero MCP servers.',
  'lv-budget':'After the host opt-in, the script raises the budget to thirty cents.',
  'lv-title':'The title and metadata update is confirmed by a fresh retrieve. The history holds the user message, an agent message, and the user interrupt.',
  'lv-archived':'Then the script archives the session. Archived: yes, with an archived at timestamp.',
  'lv-after':'And an update after archive is refused: four hundred again. Archived sessions cannot be mutated.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real session prove?',[
 ('vs-idle','IDLE','Refused while running','The API rejects a tools<br>update until idle','Like the fixture, the real API refused a tools replacement while running, and accepted it once idle.'),
 ('vs-interrupt','INTERRUPT','Confirm, do not assume','user.interrupt, then poll<br>until status is idle','Interrupt was confirmed by polling the session status, not by closing a request.'),
 ('vs-archive','ARCHIVE','Final state','Archived sessions<br>refuse updates','And the archived session refused any further update.')],'The budget opt-in is a host rule: the API accepted the raise once the host allowed it.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the route to the session controls and the operation schemas.'),
 (3,'POST /open','Section three opens an offline session.'),
 (4,'Decision and early response','Section four handles the decision and the early response.'),
 (5,'POST /call','Section five validates each call against the operation catalog.')])
d.mapping('Where are session controls?',[
 ('map-sdk','CLAUDE AGENT SDK','In-process query options','Interrupt a query; options<br>are set when it starts','In the Agent SDK, you interrupt a running query in your own process, and options such as the model are set when the query starts.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Session operations','sessions.update, interrupt<br>and archive on a remote session','This platform uses Managed Agents beta sessions, not the Agent SDK. A remote session is updated, interrupted, and archived through the sessions API.'),
 ('map-port','THIS PLATFORM','The Lab 26 fixture','server/lib/lab26-controls.ts','Here, the Lab twenty-six controls model that boundary with an authored fixture.')],'Idle checks, budget opt-in and the summary handoff are in server/lib/lab26-controls.ts.')
d.port('port-idle','Source · Scripted only, idle first',{'port-scripted':'Opening anything other than a scripted session is refused, so no billed session is opened.',
 'port-interrupt':'An interrupt clears the running turn, and records confirmed idle.','port-idle':'Every other update requires an idle session.'})
d.port('port-updates','Source · Replace, opt in, hand off',{'port-replace':'Tools and MCP servers are replaced as full arrays.','port-budget':'A budget raise without confirm resume is refused.',
 'port-handoff':'A model change creates a new session, with the parent ID and the summary.'})
d.knowledge('Finish with the knowledge check: what should a fresh-session model handoff do?','Explicitly create new context under checked ownership. Owned session updates are separate from a fresh model handoff.')
d.summary([('sum-idle','IDLE','Update when idle','Interrupt, then confirm.','You can now apply supported updates only to a confirmed-idle session.'),
 ('sum-budget','BUDGET','Opt in to resume','A raise can resume work.','Require an explicit opt-in before raising a budget.'),
 ('sum-handoff','HANDOFF','Fresh session','The summary is the context.','And change the model through a fresh session with an explicit summary.')],'Lab 27 · Remote work beyond a browser connection')
d.finish()
