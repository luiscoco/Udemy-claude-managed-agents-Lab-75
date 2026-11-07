"""Lab 17 step-by-step walkthrough authored from real captures of the running platform (offline snapshot fixtures and one live retained session)."""
from lab_video_common import Deck
d=Deck(17,'Lab 17 Step by Step: Host Snapshots and File Restoration, Offline and Live','Host snapshots');e=d.e
assert 'Source: managed-api' in e['live_start'] and 'Restored tracked host files only' in e['live-restore_status'] and 'Cleanup: archived' in e['live_close']
d.cover('CLAUDE MANAGED AGENTS · LAB 17 · HOST SNAPSHOTS','<h2>In this lab</h2><p>Snapshot tracked host files.<br>Change them with host handlers.<br>Dry-run, then restore.<br>Keep the conversation.</p>',
 'Welcome to Lab seventeen, Host snapshots and file restoration. In this lecture, you will snapshot tracked host files, change them through bounded host handlers, and restore them with a two-phase plan, while the retained Managed conversation stays exactly as it was. We will run the offline fixture, and then a real session.')
d.overview('SNAPSHOT · CHANGE · RESTORE','Restoring files does not rewind the conversation',[
 ('ov-concepts','1 · CONCEPTS','Two kinds of state','Host fixture files and<br>remote conversation history','First, the concepts: host fixture files and the remote conversation are separate kinds of state.'),
 ('ov-offline','2 · OFFLINE','Snapshot fixtures','Edit · create · untracked<br>dry run · confirm','Second, the offline fixtures: edit, create, an untracked file, a dry run, and a confirmed restore.'),
 ('ov-live','3 · LIVE','A real session','Two real turns,<br>then a file restore','Third, a real session with two turns, then a file restore.'),
 ('ov-code','4 · CODE','Read the TypeScript','Plan IDs and<br>version checks','Finally, the TypeScript code that plans and confirms a restore.')],
 'Only the two tracked fixture paths are ever restored.')
d.shot('lesson','Open Lab 17',{'lesson-title':'Open Lab seventeen, Host snapshots and file restoration.','lesson-objective':'The objective: restore tracked host fixture files from an owned snapshot, while the retained Managed conversation remains intact.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: restore tracked host files from a snapshot, while the conversation remains intact.'),
 (2,'Core rule','Region two, the core rule. What does restoring host fixture files restore? The tracked host files, not the remote conversation history.'),
 (3,'Keep the boundary clear','Region three: a host file snapshot does not rewind a retained Managed conversation.'),
 (6,'Put it to the test','Region six: show which files changed back, and that the conversation did not.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: prepare an offline session, and snapshot notes dot M D and the absent draft dot M D.'),
 (2,'Run the comparison','Step two: send turns that edit notes, create the draft, and create an untracked scratch file.'),
 (3,'Inspect the boundary','Step three: dry-run the restoration, and inspect the exact restores and deletes.'),
 (4,'Follow the workflow','Step four: confirm with the current version and the matching plan ID, then inspect the files and the unchanged history.')])
d.shot('experiment','The snapshot experiment',{'exp-rule':'Open Run the exercise. Take a host snapshot, change tracked files, then inspect a dry-run restore plan. Confirming changes only the two tracked paths.',
 'exp-start':'Click Start offline fixture session.','exp-snapshot':'Then Take host snapshot.'})
d.shot('session','Offline · The prepared session',{'session-head':'The session is prepared at host version one. Built-in filesystem tools are disabled, and no host handler has run yet.'})
d.shot('files-before','Offline · Files before',{'files-before-file1':'Notes dot M D is tracked, with status draft.','files-before-file2':'Draft dot M D is tracked, but absent.','files-before-file3':'Scratch dot M D is untracked, and absent.'})
d.shot('snapshot','Offline · Take a snapshot',{'snapshot-list':'Take host snapshot records the tracked files at host version one.'})
d.shot('handler','Offline · Host handlers',{'handler-action':'Now send three turns, each with a host action: edit notes, create draft, and create untracked.',
 'handler-text':'The text field supplies the new status or file content.','handler-send':'Each click sends one bounded turn, then runs the selected host handler.'})
d.shot('files-changed','Offline · Files changed',{'files-changed-file1':'Notes now says reviewed.','files-changed-file2':'Draft dot M D exists.','files-changed-file3':'And the untracked scratch file exists too.'})
d.shot('history','Offline · The conversation',{'history-list':'The conversation history shows the three turns, each with its own host event and the same session.'})
d.shot('plan','Offline · Dry-run plan',{'plan-id':'Choose the snapshot and click Dry-run restore. The plan has its own ID, and the expected host version. The untracked file and the remote session stay untouched.',
 'plan-changes':'Exactly two changes: restore notes, and delete draft.'})
d.shot('restore-status','Offline · Confirm the restore',{'restore-status-text':'Click Confirm restore. Only the tracked host files were restored, and the three conversation turns remain untouched.',
 'restore-head':'The host version moved forward again.'})
d.shot('files-restored','Offline · Files after',{'files-restored-file1':'Notes is back to draft.','files-restored-file2':'Draft dot M D is gone again.','files-restored-file3':'But the untracked scratch file is still there. It was never part of the snapshot.'})
d.shot('history-after','Offline · History unchanged',{'history-after-list':'And the conversation history is unchanged. Restoring files did not rewind the conversation.'})
d.live_disabled('Now real Claude. With live mode disabled, Run live does not call Claude.','Live mode starts one billed text-only session. Host file handlers run only on the separate fixture tree.')
d.restart('Set MANAGED underscore LIVE underscore ENABLED to true in dot env, and restart the backend with npm dot cmd run dev colon server.','Wait for Backend ready.')
d.shot('live-run','Live · Start a real session',{'live-run-button':'Back in Lab seventeen, click Run live. It creates one billed session and sends a first read-only turn.'},note='LIVE RUN')
d.shot('live-session','Live · The real session',{'live-head':'The source is the managed API, the session is idle, and one host handler call ran. Built-in filesystem tools stay disabled.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-files-changed','Live · Edit notes',{'live-files-changed-file1':'Take a snapshot, then send an edit notes turn. Notes now says reviewed.','live-files-changed-file2':'Draft is absent.','live-files-changed-file3':'And there is no scratch file.'},note='LIVE RUN')
d.shot('live-history','Live · Two real turns',{'live-history-list':'The history shows two real turns in the same session: the first read-only turn, and the edit turn, each with Claude\'s public reply.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-plan','Live · The dry run',{'live-plan-id':'Dry-run the restore. A new plan ID, with the expected version.','live-plan-changes':'One change: restore notes.'},note='LIVE RUN')
d.shot('live-restore-status','Live · Confirm',{'live-restore-status-text':'Confirm it. Only tracked host files were restored; both real conversation turns remain untouched.','live-restore-head':'The session is still idle.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-files-restored','Live · Files restored',{'live-files-restored-file1':'Notes is back to draft.','live-files-restored-file2':'Draft is still absent.','live-files-restored-file3':'No scratch file.'},note='LIVE RUN')
d.shot('live-history-after','Live · History kept',{'live-history-after-list':'And the real conversation history is exactly the same as before the restore.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.shot('live-close','Live · Close the session',{'live-close-head':'Finally, close the session. It is closed, and the real session was archived.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the restore prove?',[
 ('vs-files','FILES','Tracked paths only','Notes restored, draft deleted,<br>scratch untouched','Only the two tracked paths changed back; the untracked file stayed.'),
 ('vs-plan','PLAN','Two phases','A dry-run plan ID and<br>the current host version','The restore needed a dry-run plan ID and the current host version.'),
 ('vs-history','HISTORY','Conversation kept','The retained session<br>was not rewound','And the conversation, offline and live, was never rewound.')],'A host file snapshot is not a conversation checkpoint.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the checkpointing module to the run controller and the fixture files.'),
 (3,'POST /session','Section three creates the session, offline or live.'),
 (6,'POST /snapshot','Section six takes a host snapshot.'),
 (7,'POST /restore','Section seven handles the dry run and the confirmed restore.')])
d.mapping('Where is file checkpointing?',[
 ('map-sdk','CLAUDE AGENT SDK','enableFileCheckpointing','The SDK can rewind files<br>it edited locally','In the Agent SDK, file checkpointing can rewind files that the agent edited on your machine.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Host-owned snapshots','The host snapshots its own<br>tracked files; history stays','Here, the agent runs in the cloud. The host snapshots and restores its own tracked files, and the retained conversation is never rewound.'),
 ('map-port','THIS PLATFORM','The Lab 17 controller','server/lib/lab17-run.ts','The code is in the Lab seventeen run controller.')],'Sessions, handlers, plans and restores are in server/lib/lab17-run.ts.')
d.port('port-session','Source · A text-only session',{'port-session':'The live session reuses the bounded, text-only Lab fifteen port.'})
d.port('port-handler','Source · Host handlers',{'port-handler':'File changes are made by host handlers, like create draft, on the host fixture tree, never by the agent.'})
d.port('port-restore','Source · Two-phase restore',{'port-version':'A restore first checks the expected host version.','port-plan':'The dry run creates a plan with its own ID.','port-confirm':'And the confirmation must match the plan ID, the snapshot, and the version.'})
d.knowledge('Finish with the knowledge check: what does restoring host fixture files restore?','The tracked host files. A host file snapshot does not rewind a retained Managed conversation.')
d.summary([('sum-snapshot','SNAPSHOT','Tracked files','Owned by the host.','You can now snapshot tracked host files.'),
 ('sum-restore','RESTORE','Two phases','Dry run, then confirm.','Restore them with a dry-run plan and a confirmation.'),
 ('sum-keep','KEEP','The conversation','Never rewound.','And explain why the conversation is never rewound.')],'Lab 18 · Cloud sandbox')
d.finish()
