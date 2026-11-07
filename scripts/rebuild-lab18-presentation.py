import importlib.util
spec=importlib.util.spec_from_file_location('deck','scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
deck.build(18,{
 'title':'Cloud sandbox and host boundaries',
 'subtitle':'Compare a disposable host policy test with a separately authorized Managed cloud diagnostic.',
 'verify':'CHECK THE EVIDENCE',
 'gui':[
  {'title':'Choose the boundary to inspect','label':'GUI · experiment actions','cards':[
   ('Offline host test','Choose an authored scenario and run a disposable local fixture test.'),
   ('Environment metadata','A deliberate live inspection checks the configured cloud environment without creating a session.'),
   ('Live diagnostic','A separate billed run permits only the exact pwd command in the remote sandbox.')]},
  {'title':'Host policy controls','label':'GUI · application view','image':'controls.png','crop_bottom':.01},
  {'title':'Allowed fixture read','label':'GUI · offline evidence','image':'allowed.png','note':'Only the exact allowlisted host fixture is read; no network call is made.'},
  {'title':'Outside path is denied','label':'GUI · offline evidence','image':'denied.png','note':'The host guard denies the outside path before any read. This does not test cloud OS containment.'},
  {'title':'Missing environment fails closed','label':'GUI · offline evidence','image':'missing.png','note':'No fixture read, socket call or remote session is started for the authored missing-environment scenario.'},
 ],
 'sequence':{'title':'A live diagnostic in sequence','label':'UML sequence diagram · separately selected live run',
  'names':[('User',''),('React UI','Concept18Sandbox'),('Express route','POST /api/c18/run'),('Host service','policy · confirmation'),('Managed API','cloud session')],
  'messages':[(0,1,'Select live diagnostic',False),(1,2,'POST /run + owner',False),
   (2,3,'Validate and check capacity',False),(3,4,'Retrieve environment',False),
   (4,3,'Environment metadata',True),(3,4,'Recheck policy; create session',False),
   (3,4,'Open stream; send prompt',False),(4,3,'bash tool request',True),
   (3,4,'Approve exact pwd only',False),(4,3,'Tool result and completion',True),
   (3,2,'Observed command evidence',True),(2,1,'Progress and result (SSE)',True)]},
 'branches':('Know what the evidence proves','Workflow · three distinct boundaries',[
  ('Host path','The offline allowlist demonstrates what the host handler reads or denies.'),
  ('Host network','The offline blocked-network result is an authored policy decision with zero socket calls.'),
  ('Cloud diagnostic','A live pwd requires matching tool use, host confirmation and successful tool result.')],19),
 'glance':'From local configuration to observed command evidence',
 'steps':[
  ('Select a scenario','src/concepts/Concept18Sandbox.tsx','The UI builds a bounded request. Offline scenarios are synthetic; live mode uses the allowed-mount selection.',
   "const body = lab18RunSchema.parse({\n  mode, scenario: mode === 'live'\n    ? 'allowed-mount' : scenario,\n  deadlineSeconds: 30, budgetCents: 50\n});"),
  ('Validate and route','server/concepts/18-sandbox.ts','The local route checks the request, owner, deadline and capacity. Scripted runs use the offline service.',
   "const parsed = lab18RunSchema\n  .safeParse(request.body);\nif (input.mode === 'scripted') {\n  // call service.offline(input)\n}"),
  ('Check availability','server/lib/lab18-sandbox.ts','A missing authored environment fails before a fixture tree or read. Live availability retrieves environment metadata without starting a session.',
   "const availability = await\n  this.availability(\n    'scripted', input.scenario);\nif (!availability.ready)\n  // return no-effect report"),
  ('Read the allowed fixture','server/lib/lab18-sandbox.ts','The offline service creates a disposable tree. Only the exact approved path is resolved, read and hashed.',
   "const root = await mkdtemp(\n  join(tmpdir(), 'lab18-'));\nconst allowed = input.scenario ===\n  'allowed-mount';\nif (allowed) {\n  // resolve, read and hash fixture\n}"),
  ('Record and clean up','server/lib/lab18-sandbox.ts','The report records read and network call counts. The owned temporary tree is removed after evidence is captured.',
   "readCalls: allowed ? 1 : 0,\nnetworkCalls: 0, fileHash: hash,\n// finally: check owned temporary path\nawait rm(actualRoot, {\n  recursive: true, force: true });"),
  ('Recheck cloud policy','server/lib/lab18-sandbox.ts','The live port retrieves the cloud environment again and requires the restricted network and package policy before creating a session.',
   "const environment = await client.beta\n  .environments.retrieve(\n    ids.environmentId, {},\n    { timeout: 3000 });\n// reject unexpected cloud policy"),
  ('Permit only exact pwd','server/lib/lab18-sandbox.ts','The live session uses bash with always_ask. Host confirmation allows only an exact pwd command; all other calls are denied.',
   "const allowed = name === 'bash' &&\n  input?.command === 'pwd';\nreturn { toolUseId: id,\n  tool: name ?? 'unknown',\n  result: allowed ? 'allow' : 'deny',\n  // reason and denyMessage omitted\n};"),
  ('Verify the tool result','server/concepts/18-sandbox.ts','The route records a matching bash tool use and requires an allowed non-error result before reporting successful command execution.',
   "commandObserved: Boolean(command),\ncommandSucceeded: Boolean(command &&\n  command.state === 'allowed-by-host' &&\n  command.result?.isError === false),\n// session cleanup reported separately"),
 ],
 'challenge':('Compare the two refusals',[
  ('Run','Compare the missing-environment and outside-mount offline scenarios.'),
  ('Inspect','Find fixture, file-read and network-call evidence for each scenario.'),
  ('Explain','Why do local host refusals not prove the isolation properties of a remote cloud sandbox?')]),
})
