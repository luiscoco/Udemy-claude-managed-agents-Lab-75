import importlib.util
spec=importlib.util.spec_from_file_location('deck','scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
deck.build(20,{
 'title':'Lifecycle events and host interceptors',
 'subtitle':'Separate observed provider events from host policy, execution audit and final application verification.',
 'verify':'COMPARE THE AUDITS',
 'gui':[
  {'title':'Choose a lifecycle scenario','label':'GUI · offline experiment','cards':[
   ('Passing or denied','Compare an allowed draft edit with a pre-execution denial of a protected write.'),
   ('Failure paths','Compare a tool-handler failure with an interceptor exception before session creation.'),
   ('Final verification','An application report can fail validation after a completed turn and file edit.')]},
  {'title':'Lifecycle experiment controls','label':'GUI · application view','image':'controls.png','crop_bottom':.01},
  {'title':'Interceptor fails before a session','label':'GUI · offline evidence','image':'interceptor.png','note':'This authored interceptor exception skips session creation and the custom handler.'},
  {'title':'A tool handler can fail','label':'GUI · offline evidence','image':'failure.png','note':'Here the handler is reached but fails because the old text is absent. This is distinct from pre-execution denial.'},
  {'title':'Read the evidence separately','label':'GUI · result interpretation','cards':[
   ('Provider projection','Only observed frames appear; offline frames are authored fixture evidence.'),
   ('Host audit','Review pre-execution, handler, post-execution and final-validation records.'),
   ('Fixture files','Inspect actual host fixture contents. A post-execution record cannot undo an effect.')]},
 ],
 'sequence':{'title':'Custom tool lifecycle in sequence','label':'UML sequence diagram · passing policy',
  'names':[('User',''),('React UI','Concept20HooksInDepth'),('Express route','POST /api/c20/run'),('Host runner','audit · policy'),('Session port','fixture or live')],
  'messages':[(0,1,'Run lifecycle experiment',False),(1,2,'POST /run + scenario',False),
   (2,3,'Validate; runLab20',False),(3,4,'Create and open session',False),
   (3,4,'Send user message',False),(4,3,'Custom tool request',True),
   (3,4,'Send correlated tool result',False),(4,3,'Events and completion',True),
   (3,2,'Audit, events and file evidence',True),(2,1,'Progress and result (SSE)',True)]},
 'branches':('Policy, execution and validation','Workflow · independent outcomes',[
  ('Interceptor failure','The host preflight fails before a session exists; the handler is skipped.'),
  ('Handler failure','The policy allows the call but the custom handler fails during execution.'),
  ('Final validation','A completed turn can still fail the closed application report check; no corrective loop starts.')],19),
 'glance':'From a lifecycle scenario to separately classified evidence',
 'steps':[
  ('Choose a scenario','src/concepts/Concept20HooksInDepth.tsx','The UI sends the selected offline scenario. Live mode uses the passing-policy path.',
   "const body = { mode,\n  scenario: mode === 'live'\n    ? 'passing-policy' : scenario,\n  prompt, deadlineSeconds: 30,\n  budgetCents: 50 };"),
  ('Validate the run','server/concepts/20-hooks-in-depth.ts','The route checks the local owner, bounded request, deadline, live readiness and capacity before running.',
   "const parsed = lab20RunSchema\n  .safeParse(request.body),\n  owner = String(\n    request.headers['x-lab-owner']);\n// reject invalid requests first"),
  ('Prepare host evidence','server/lib/lab20-run.ts','The runner creates an isolated fixture, initializes draft and protected files, and maintains separate provider and host audit arrays.',
   "const sandbox = await createSandbox();\nawait sandbox.writeText(\n  'workspace/draft.md',\n  /* authored draft */);\n// separate providerEvents and hostAudit"),
  ('Fail closed on interceptor error','server/lib/lab20-run.ts','An interceptor exception is recorded before a port or session is created. The custom handler is skipped.',
   "if (input.scenario ===\n    'interceptor-exception') {\n  // record failure and skipped handler\n  return finish(\n    'host-instrumentation-error',\n    'not-needed', /* note */);\n}"),
  ('Run the custom tool','server/lib/lab20-run.ts','The runner selects the Lab 07 fixture or live port and passes the policy and sandbox into the shared tool-session pipeline.',
   "const result = await runLab07(\n  request, port, sandbox, runId,\n  signal, frame => {\n    // project events and audit frames\n  });"),
  ('Project only observed events','server/lib/lab20-run.ts','Lifecycle, tool, message, span and thread frames are projected only when observed; correlation IDs are retained when available.',
   "if (frame.kind === 'lifecycle')\n  provider({ /* observed event */ });\nelse if (frame.kind === 'span')\n  provider({ /* observed span */ });\n// other observed types follow"),
  ('Record host phases','server/lib/lab20-run.ts','For each audit frame the host records its pre-execution decision, whether the handler ran, and the post-execution outcome.',
   "if (frame.kind === 'audit') {\n  const eventId = frame.audit.id;\n  audit({ /* pre-execution */ });\n  audit({ /* handler before */ });\n  audit({ /* handler after */ });\n  audit({ /* post-execution */ });\n}"),
  ('Classify final evidence','server/lib/lab20-run.ts','The result distinguishes provider errors, host denial, handler failure and final-validation failure. A completed turn does not automatically prove the file effect.',
   "if (result.outcome.kind !==\n    'completed')\n  // classify provider outcome\nelse if (result.audits.some(\n  entry => entry.outcome === 'denied'))\n  outcome = 'host-policy-denial';\n// other outcomes checked separately"),
 ],
 'challenge':('Compare two failure boundaries',[
  ('Run','Execute interceptor-exception and tool-failure in offline mode.'),
  ('Inspect','Compare session creation, handler phase and the final draft file.'),
  ('Explain','Which failure reached the handler, and what does the file evidence prove?')]),
})
