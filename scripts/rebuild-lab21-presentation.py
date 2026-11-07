import importlib.util
spec=importlib.util.spec_from_file_location('deck','scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
deck.build(21,{
 'title':'Host commands and prompt expansion',
 'subtitle':'Expand validated host commands into explicit user messages while keeping local history operations local.',
 'verify':'TRACE THE MESSAGE',
 'gui':[
  {'title':'Choose a host command','label':'GUI · command registry','cards':[
   ('Observation','Select a permitted species, count and location for a fictional observation.'),
   ('Checklist','Select an approved location for a fixed checklist prompt.'),
   ('Inspect and reset','Read or clear bounded local command history without a provider send.')]},
  {'title':'Command and argument controls','label':'GUI · application view','image':'controls.png','crop_bottom':.01},
  {'title':'Expanded model command','label':'GUI · offline result','image':'model.png','note':'The fixed template becomes an explicit user message. The offline response is authored fixture output.'},
  {'title':'Local inspection sends nothing','label':'GUI · local result','image':'local.png','note':'Inspect reads host history without sending another provider message.'},
  {'title':'Reject unsupported input','label':'GUI · validation','cards':[
   ('Invalid arguments','A location outside the fixed enum fails before any model send.'),
   ('Unknown command','A command outside the registry is rejected before provider work.'),
   ('Bounded history','At most three command records are retained in the host process.')]},
 ],
 'sequence':{'title':'A model command in sequence','label':'UML sequence diagram · fixed prompt expansion',
  'names':[('User',''),('React UI','Concept21SlashCommands'),('Express route','POST /api/c21/run'),('Host registry','Lab21Commands'),('Session port','fixture or live')],
  'messages':[(0,1,'Choose command and args',False),(1,2,'POST /run + owned run ID',False),
   (2,3,'Validate and dispatch',False),(3,4,'Send expanded user message',False),
   (4,3,'Response and session state',True),(3,2,'Expanded text + history',True),
   (2,1,'Command result',True),(1,0,'Display message and count',True)]},
 'branches':('Two command paths','Workflow · execution boundary',[
  ('Model command','A fixed template expands validated arguments and sends one message to the retained session.'),
  ('Local command','Inspect or reset changes only bounded host history; no provider port is touched.'),
  ('Invalid command','Unknown commands and invalid arguments are rejected before provider action.')],19),
 'glance':'From selected command to an explicit execution result',
 'steps':[
  ('Prepare an owned session','src/concepts/Concept21SlashCommands.tsx','The UI prepares a scripted or live command session; preparation itself sends no model message.',
   "const data = await post('session', {\n  action: 'prepare', mode\n}) as Snapshot;\ncurrent.current = data.runId;"),
  ('Validate request and owner','server/concepts/21-slash-commands.ts','The route validates the local owner and closed request schema before dispatching a command.',
   "const data = lab21RunSchema.safeParse(\n  request.body);\nif (!data.success) {\n  // reject invalid command\n}"),
  ('Check owned session','server/lib/lab21-commands.ts','The manager finds the owner’s session and refuses concurrent or unusable sessions.',
   "const entry = this.owned(runId, owner);\nif (entry.active)\n  // reject concurrent command\nif (!entry.usable)\n  // close before another command"),
  ('Validate arguments','shared/lab21-slash-commands.ts','Each supported model command parses a strict argument shape; species and location use fixed choices.',
   "if (command === 'observation') {\n  const args = z.strictObject({\n    species, count, location\n  }).parse(raw);\n  // expand fixed template\n}"),
  ('Expand fixed template','shared/lab21-slash-commands.ts','The observation and checklist commands construct explicit user messages from validated values.',
   "if (command === 'checklist') {\n  const args = z.strictObject({\n    location }).parse(raw);\n  // return fixed checklist text\n}"),
  ('Handle local commands','server/lib/lab21-commands.ts','A null expansion identifies inspect or reset. The manager returns local history and zero provider sends.',
   "if (expanded === null) {\n  if (command === 'reset')\n    entry.history = [];\n  return { kind: 'local' as const,\n    command, history: [...entry.history],\n    providerSends: 0, expanded: null };\n}"),
  ('Send model message','server/lib/lab21-commands.ts','A model command sends the expanded text through the retained session and records whether it remains idle.',
   "const snapshot = await\n  this.sessions.execute(\n    runId, owner,\n    { type: 'send', prompt: expanded },\n    signal, () => {});\nentry.usable = snapshot.state === 'idle';"),
  ('Bound and display history','server/lib/lab21-commands.ts','The host keeps up to three command records and returns the expansion and session snapshot for inspection.',
   "if (entry.history.length === 3)\n  entry.history.shift();\nentry.history.push(\n  `${command}: ${expanded}`);\n// return model result and snapshot"),
 ],
 'challenge':('Compare local and model commands',[
  ('Run','Prepare an offline session and run an observation command.'),
  ('Inspect','Read the expanded message, session message count and local history.'),
  ('Explain','Why does inspecting local history add no provider send while the observation command does?')]),
})
