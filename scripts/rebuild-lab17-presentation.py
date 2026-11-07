import importlib.util
spec=importlib.util.spec_from_file_location('deck','scripts/lesson-deck.py')
deck=importlib.util.module_from_spec(spec);spec.loader.exec_module(deck)
deck.build(17,{
 'title':'Host snapshots and file restoration',
 'subtitle':'Restore tracked host fixtures while preserving the session conversation and treating remote outputs separately.',
 'verify':'VERIFY THE RESTORE',
 'gui':[
  {'title':'Start, snapshot and change','label':'GUI · offline experiment','cards':[
   ('Start','Prepare an owned offline session and isolated host fixture tree.'),
   ('Snapshot','Save the tracked notes.md and draft.md contents and their hashes.'),
   ('Change','Send a bounded turn, then apply a selected host file handler after confirmed idle.')]},
  {'title':'Host action and conversation','label':'GUI · application controls','image':'controls.png','crop_bottom':.01},
  {'title':'Plan before applying changes','label':'GUI · offline dry run','image':'plan.png','crop_bottom':.01,'note':'The plan restores notes.md and deletes the new tracked draft.md; the untracked file and remote session are untouched.'},
  {'title':'The note after restoration','label':'GUI · restored host file','image':'restored.png','note':'The host restores tracked content while the existing conversation remains in the session history.'},
  {'title':'Distinguish the two boundaries','label':'GUI · evidence','cards':[
   ('Tracked host files','notes.md and draft.md are captured and restored inside the host fixture.'),
   ('Untracked file','scratch.md is deliberately outside the snapshot and remains untouched.'),
   ('Conversation and outputs','Restoration does not rewind conversation events or remote outputs; inspect those separately.')]},
 ],
 'sequence':{'title':'Host snapshot and restore in sequence','label':'UML sequence diagram · offline restore',
  'names':[('User',''),('React UI','Concept17Checkpointing'),('Express route','/api/c17 operations'),('Host manager','Lab17Manager'),('Host fixture','tracked files')],
  'messages':[(0,1,'Start offline session',False),(1,2,'POST /session',False),(2,3,'Prepare owned session',False),
   (3,4,'Create fixture tree',False),(1,2,'POST /snapshot',False),(2,3,'Snapshot owned run',False),
   (3,4,'Read and persist tracked files',False),(1,2,'POST /send',False),(2,3,'Complete turn; run handler',False),
   (3,4,'Change selected host file',False),(1,2,'POST /restore: dry run',False),(3,4,'Compare tracked hashes',False),
   (1,2,'POST /restore: confirm',False),(3,4,'Apply checked plan',False)]},
 'branches':('Two-phase restore and its safeguards','Workflow · restoration checks',[
  ('Dry run','Build a plan with tracked-path changes and the expected fixture version; do not change files.'),
  ('Confirm','Require the same owner, snapshot, plan ID and version, and check current hashes before applying.'),
  ('Preserve','Untracked files, conversation and remote sandbox remain outside the host restore.')],19),
 'glance':'From an owned session to a verified host restore',
 'steps':[
  ('Prepare the fixture','server/lib/lab17-run.ts','The manager checks capacity and owner, prepares a retained session, and creates a separate fixture tree.',
   "const input = lab17SessionSchema\n  .parse(raw);\nroot = await createLab17Tree(\n  underlying.runId);\n// owner and capacity checked above"),
  ('Create the host tree','server/lib/lab17-files.ts','The fixture is created inside generated/lab17, guarded against path escape and symbolic links.',
   "const root = join(base, runId);\nawait safeDirectory(root);\nconst actual = await realpath(root);\n// verify fixture remains inside workspace\nawait writeFile(join(root, 'notes.md'),\n  initialNotes, /* options */);"),
  ('Save tracked paths','server/lib/lab17-run.ts','The snapshot records the contents and metadata of notes.md and draft.md, plus correlation IDs.',
   "const snapshotId = randomUUID();\nawait persistLab17Snapshot(\n  entry.root, snapshotId, contents);\nentry.snapshots.push({\n  metadata, contents });\nentry.plan = null;"),
  ('Complete a turn first','server/lib/lab17-run.ts','A host file handler runs only after the retained turn completes with confirmed idle. The model answer does not itself perform the host edit.',
   "if (session.state !== 'idle' ||\n    session.outcome?.kind !==\n      'completed') {\n  // host handler did not run\n}\n// then run selected hostAction"),
  ('Build a restore plan','server/lib/lab17-run.ts','The dry run computes exact tracked-file operations for the selected snapshot and current fixture version.',
   "entry.plan = { planId: randomUUID(),\n  snapshotId: input.snapshotId,\n  expectedVersion: entry.version,\n  changes: await lab17Changes(\n    entry.root, saved.contents),\n  untrackedUntouched: true,\n  remoteSessionUntouched: true };"),
  ('Check owner and version','server/lib/lab17-run.ts','Confirm requires an existing matching plan, snapshot and unchanged version. A stale plan is refused before files change.',
   "if (!entry.plan ||\n    entry.plan.planId !== input.planId ||\n    entry.plan.snapshotId !==\n      input.snapshotId ||\n    entry.plan.expectedVersion !==\n      entry.version)\n  // reject stale plan"),
  ('Apply checked changes','server/lib/lab17-files.ts','Before writing or deleting tracked files, the host recomputes the changes and compares them with the approved dry run.',
   "const fresh = await lab17Changes(\n  root, contents);\nif (JSON.stringify(fresh) !==\n    JSON.stringify(plan.changes))\n  throw new Error(/* stale plan */);\n// apply each tracked change"),
  ('Keep history and outputs','server/lib/lab17-run.ts','The restored host files do not erase the recorded turns; session-scoped remote output inspection remains a separate operation.',
   "if (input.dryRun) {\n  // build plan\n} else {\n  await applyLab17Changes(\n    entry.root, entry.plan,\n    saved.contents);\n  // conversation stays recorded\n}"),
 ],
 'challenge':('Restore the files, retain the conversation',[
  ('Run','Snapshot the fixture, edit notes and create a tracked draft and an untracked scratch file.'),
  ('Restore','Inspect the dry-run plan, then confirm it with the same version and plan ID.'),
  ('Explain','Compare tracked and untracked files and explain why conversation and remote output history remain separate.')]),
})
