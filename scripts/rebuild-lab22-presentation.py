import importlib.util
spec=importlib.util.spec_from_file_location('deck','scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
deck.build(22,{
 'title':'Explicit project context and memory',
 'subtitle':'Select authored files on the host and send their text explicitly in a fresh session.',
 'verify':'TRACE THE CONTEXT',
 'gui':[
  {'title':'Choose context deliberately','label':'GUI · offline scenarios','cards':[
   ('Nested','The host selects the authored root and nested project documents.'),
   ('Handoff','The host selects the root document and a separate authored summary.'),
   ('Conflict or disabled','Conflict adds untrusted content; disabled sends no selected context files.')]},
  {'title':'Context selection controls','label':'GUI · application view','image':'controls.png','crop_bottom':.01},
  {'title':'Nested files were read on the host','label':'GUI · offline evidence','image':'nested.png','crop_bottom':.025,'note':'The result identifies host reads and reports no cloud memory attachment or remote file reads.'},
  {'title':'A summary is an explicit handoff','label':'GUI · offline evidence','image':'handoff.png','crop_bottom':.025,'note':'The handoff scenario selects a different host file set and starts a fresh session.'},
  {'title':'Read the trust boundary','label':'GUI · evidence interpretation','cards':[
   ('Host inventory','Fixed file names, trust labels and hashes identify the authored fixture inputs.'),
   ('User message','The host composes file content as data in the exact message sent to the session.'),
   ('Cloud memory','No Managed memory store is attached and no remote file read is observed.')]},
 ],
 'sequence':{'title':'Explicit context in sequence','label':'UML sequence diagram · one fresh session',
  'names':[('User',''),('React UI','Concept22ClaudeMdMemory'),('Express route','POST /api/c22/run'),('Host context','selection · composer'),('Session port','fixture or live')],
  'messages':[(0,1,'Select context and question',False),(1,2,'POST /run + scenario',False),
   (2,3,'Validate and select files',False),(3,4,'Prepare fresh session',False),
   (3,4,'Send composed user message',False),(4,3,'Response and session state',True),
   (3,4,'Close session',False),(3,2,'Reads, message and response',True),
   (2,1,'Result (SSE)',True),(1,0,'Display context evidence',True)]},
 'branches':('Context sources are explicit','Workflow · selected file sets',[
  ('Nested','Root and nested authored project documents are selected.'),
  ('Handoff','Root plus a host-authored summary are selected for a new session.'),
  ('Conflict','An untrusted note is added as content; it does not become an authorization rule.')],19),
 'glance':'From allowlisted files to a fresh-session result',
 'steps':[
  ('Select the experiment','src/concepts/Concept22ClaudeMdMemory.tsx','The UI sends a scenario and bounded question. Each run creates a fresh session.',
   "streamPost('/api/c22/run', {\n  mode, scenario, question,\n  deadlineSeconds: 30, budgetCents: 50\n  // stream options omitted\n})"),
  ('Validate and admit','server/concepts/22-claude-md-memory.ts','The route validates owner, request, deadline, readiness and concurrency before starting the run.',
   "const parsed = lab22RunSchema\n  .safeParse(request.body),\n  owner = String(\n    request.headers['x-lab-owner']);\n// reject invalid request first"),
  ('Choose allowlisted files','server/lib/lab22-context.ts','Each scenario maps to fixed file keys. Disabled selects none; handoff selects root and memory.',
   "nested: ['root', 'nested'],\nconflict: ['root', 'nested',\n  'untrusted'],\ndisabled: [],\nhandoff: ['root', 'memory'],"),
  ('Guard and hash reads','server/lib/lab22-context.ts','The host checks that each real path stays within the authored fixture tree, limits its size, and records its SHA-256.',
   "const actual = await realpath(candidate),\n  pathInside = relative(root, actual);\nconst data = await readFile(actual);\n// verify boundary and size; hash bytes"),
  ('Compose the user message','server/lib/lab22-context.ts','The host labels each selected document with its key, path and trust class and includes its content as data.',
   "const body = selected.map(file =>\n  /* labelled document content */\n).join('');\nreturn head + body +\n  /* bounded answer instruction */;"),
  ('Create a fresh session','server/lib/lab22-context.ts','A new bounded text-only session receives the composed message and is closed after the turn.',
   "const prepared = this.sessions.prepare(\n  internalOwner, { mode: input.mode,\n  scenario: 'normal', prompt: message,\n  /* limits omitted */ });\n// execute once, then close"),
  ('Record evidence separately','server/lib/lab22-context.ts','The result records selected and disabled keys, the exact message, response, cleanup, and that cloud memory was not attached.',
   "selected, readKeys: selected.map(\n  file => file.key),\nuserMessage: message,\nresponse: outcome.response,\ncloudMemory: 'not-attached',\nremoteFileReads: [],"),
  ('Reset the owned result','server/lib/lab22-context.ts','The host validates ownership and removes the selected result. Authored fixture files are unchanged.',
   "const entry = this.entries.get(runId);\nif (!entry || entry.owner !== owner)\n  // reject unknown or unowned result\nthis.entries.delete(runId);"),
 ],
 'challenge':('Compare nested and handoff',[
  ('Predict','Switch from nested to handoff and predict which document markers change.'),
  ('Inspect','Compare selected host reads and the exact composed user message.'),
  ('Explain','Why is the summary an explicit host input rather than a cloud memory retrieval?')]),
})
