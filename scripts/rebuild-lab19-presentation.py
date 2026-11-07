import importlib.util
spec=importlib.util.spec_from_file_location('deck','scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
deck.build(19,{
 'title':'Session inventory and explicit branches',
 'subtitle':'Continue an owned conversation, inspect captured events, and create a new session with a selected-history handoff.',
 'verify':'TRACE THE BRANCH',
 'gui':[
  {'title':'Work with owned conversations','label':'GUI · session actions','cards':[
   ('Start and continue','Start an offline session, then send another turn using the same session.'),
   ('Inspect history','Select an owned conversation, review host-captured events and choose a boundary.'),
   ('Derive','Create a new session from an explicit summary of the selected history.')]},
  {'title':'Session controls','label':'GUI · application view','image':'controls.png','crop_bottom':.01},
  {'title':'Original and derived sessions','label':'GUI · offline inventory','image':'inventory.png','note':'The derived conversation has its own session and records the original conversation as its parent.'},
  {'title':'The explicit history handoff','label':'GUI · offline branch evidence','image':'handoff.png','note':'The host sends selected observed text as a summary. It does not copy hidden state or pending tool calls.'},
  {'title':'Manage the selected session','label':'GUI · lifecycle controls','cards':[
   ('Rename and tag','Update the selected owned idle session and inspect the resulting metadata.'),
   ('Archive','Close the selected session while retaining its host record and captured history.'),
   ('Delete','Explicit deletion removes the selected owned idle session; it is a separate action from archive.')]},
 ],
 'sequence':{'title':'Derive a conversation in sequence','label':'UML sequence diagram · explicit branch',
  'names':[('User',''),('React UI','Concept19SessionManagement'),('Express route','/api/c19/sessions'),('Host manager','Lab19Manager'),('Session port','fixture or live')],
  'messages':[(0,1,'Select event boundary',False),(1,2,'POST /:id/branch',False),
   (2,3,'Validate owner and input',False),(3,4,'Create new child session',False),
   (3,4,'Send summary and request',False),(4,3,'Events and response',True),
   (3,2,'Child and lineage evidence',True),(2,1,'Progress and result (SSE)',True),
   (1,0,'Display both conversations',True)]},
 'branches':('Two conversations, two histories','Workflow · lineage and evidence',[
  ('Parent','The original owned conversation and its captured events remain unchanged.'),
  ('Handoff','The host summarizes selected observed text through the chosen event boundary.'),
  ('Child','A new session receives the explicit summary and new request; it is not a cloned sandbox.')],19),
 'glance':'From owned inventory to a new explicit branch',
 'steps':[
  ('Start or continue','src/concepts/Concept19SessionManagement.tsx','The UI posts a new or continue request. A continuation includes the selected local conversation ID.',
   "const path = action === 'branch'\n  ? `/sessions/${selected}/branch`\n  : '/turn';\n// build bounded body and stream result"),
  ('Validate the owner','server/concepts/19-session-management.ts','The route requires the local origin and owner header, then validates closed request fields and deadlines.',
   "const parsed = lab19TurnSchema\n  .safeParse(request.body),\n  owner = String(\n    request.headers['x-lab-owner']);\n// invalid input is rejected first"),
  ('Prepare an owned record','server/lib/lab19-sessions.ts','A new host conversation receives a local ID and a bounded retained-session manager; continuations look up the owned record.',
   "const id = randomUUID(),\n  internalOwner = `${owner}:${id}`;\nconst sessions = new Lab15Sessions(\n  /* selected port factory */);\n// store the owned entry"),
  ('Capture completed turns','server/lib/lab19-sessions.ts','When the turn completes and the session is idle, the host records the observed user prompt and agent response.',
   "if (entry.snapshot.state === 'idle' &&\n    entry.snapshot.outcome?.kind ===\n      'completed') {\n  entry.events.push(\n    /* captured user and agent events */);\n}"),
  ('Select a boundary','server/lib/lab19-sessions.ts','The manager checks that the parent is owned and idle, then finds the selected host event in that conversation.',
   "const parent = this.get(id, owner);\nthis.idle(parent);\nconst index = parent.events.findIndex(\n  event => event.id ===\n    input.boundaryEventId);\n// reject an unknown boundary"),
  ('Create a new branch','server/lib/lab19-sessions.ts','The host selects events through the boundary, builds a bounded summary, creates a new owned entry and sends its new prompt.',
   "const selected = parent.events.slice(\n  0, index + 1);\nconst child = this.newEntry(\n  owner, parent.mode,\n  input.deadlineSeconds,\n  input.budgetCents, parent.id,\n  input.boundaryEventId, summary);"),
  ('Page through history','server/lib/lab19-sessions.ts','The host returns at most four captured events per page and marks when a subsequent page exists.',
   "const events = entry.events.slice(\n  offset, offset + 4),\n  next = offset + events.length;\n// return next cursor and omission flag"),
  ('Archive or delete','server/lib/lab19-sessions.ts','Archive preserves the host record after confirmed closure. Delete removes the selected owned idle record; live deletion must be confirmed by the provider.',
   "entry.archived = true;\nentry.version++;\n// archive returns retained detail\nthis.entries.delete(id);\n// delete removes the selected entry"),
 ],
 'challenge':('Explain the branch boundary',[
  ('Run','Continue an offline session, select a host event, and derive a new conversation.'),
  ('Compare','Inspect the parent and derived IDs and the explicit selected-history summary.'),
  ('Explain','Why is this a new host-created session rather than a native clone of hidden conversation state?')]),
})
