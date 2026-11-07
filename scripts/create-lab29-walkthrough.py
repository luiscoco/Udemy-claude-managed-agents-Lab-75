"""Lab 29 step-by-step walkthrough authored from real captures of the running platform (offline: authored file fixtures, nothing is uploaded; live: a small script making real Files API and Managed Agents calls)."""
from lab_video_common import Deck
d=Deck(29,'Lab 29 Step by Step: Images, Documents and Mounted Files, Offline and Live','Images and files');e=d.e
assert '"type": "image"' in e['inline_png']['result'] and '"source": "text"' in e['inline_txt']['result']
assert 'Mount path: /mnt/session/uploads/lab29/field-note.pdf' in e['upload']['result'] and 'Downloaded output: Authored session output artifact' in e['disk']['result']
assert e['malformed']['status']=='Malformed base64 payload.' and e['oversized']['status']=='Decoded payload exceeds its size bound.'
assert all('0 provider calls' in e[k]['status'] for k in ['inline_png','inline_pdf','inline_txt','upload','disk'])
live=d.transcript('live.raw.txt');L=' | '.join(live)
assert 'Uploaded observation.txt: file_' in L and '89 bytes · text/plain' in L and '→ /mnt/session/uploads/lab29/observation.txt' in L
assert 'agent.tool_use: read /mnt/session/uploads/lab29/observation.txt' in L and 'Agent: The file says: "Count: 3"' in L
assert 'inline image block (base64, 2405 bytes)' in L and 'Session archived: yes' in L and 'File deleted: yes' in L and 'Metadata after delete → 404' in L
d.cover('CLAUDE MANAGED AGENTS · LAB 29 · IMAGES AND FILES','<h2>In this lab</h2><p>Send an inline image block.<br>Send a document block.<br>Preview a file mount.<br>Keep outputs separate.</p>',
 'Welcome to Lab twenty-nine, Images, documents and mounted files. In this lecture, you will compare three ways a file can reach an agent: an inline content block, an explicit file resource mounted into the session, and a separate downloaded output. The app stays offline, with small fictional fixtures, and it never uploads a file. Then a small script makes the real calls live: it uploads one fictional text file, mounts it into a session, and deletes it again.')
d.overview('INLINE · MOUNT · DOWNLOAD','Each delivery route produces different evidence',[
 ('ov-concepts','1 · CONCEPTS','Three routes','Inline blocks, file mounts<br>and downloaded outputs','First, the concepts: inline blocks, file mounts, and downloaded outputs.'),
 ('ov-offline','2 · OFFLINE','Authored fixtures','An image, a PDF<br>and a text note','Second, the offline comparison with an image, a P D F, and a text note.'),
 ('ov-checks','3 · CHECKS','Rejected payloads','Malformed base64<br>and oversized bytes','Third, the checks that reject malformed and oversized payloads.'),
 ('ov-code','4 · LIVE AND CODE','Real calls, then code','A live upload and mount;<br>then the TypeScript','Finally, a live terminal run that uploads, mounts, reads, and deletes a real file, and the TypeScript code that builds the content blocks and the file resource.')],
 'A local host path never becomes a remote sandbox path automatically.')
d.shot('lesson','Open Lab 29',{'lesson-title':'Open Lab twenty-nine, Images, documents and mounted files.','lesson-objective':'The objective: compare checked inline image and document blocks, explicit file mounts, and separate downloaded output evidence, using small fictional fixtures.'})
d.shot('learn','Start in the Learn tab',{'learn-objective':'The Learn tab summarizes the objective and the lab path.'})
d.regions('concepts',[(1,'The objective','Open the Concept map. Region one: compare inline blocks, file mounts, and downloaded outputs.'),
 (2,'Core rule','Region two, the core rule: each route is explicit, and each produces its own evidence.'),
 (3,'Keep the boundary clear','Region three: a local path does not become a sandbox path on its own.'),
 (6,'Put it to the test','Region six: decide whether a file mount and a downloaded output are the same evidence.')])
d.regions('lab',[(1,'Prepare the baseline','In the Lab walkthrough, step one: inspect the authored fixtures and their hashes.'),
 (2,'Run the comparison','Step two: run the inline route, and compare it with the file upload and mount preview.'),
 (3,'Inspect the boundary','Step three: try the malformed and oversized payloads, and confirm they are rejected.'),
 (4,'Follow the workflow','Step four: preview the downloaded output, and keep it separate from the input files.')])
d.shot('experiment','The file experiment',{'exp-rule':'Open Run the exercise. Compare a pinned inline content block with an explicit file resource, and a separate downloaded output. Local host paths do not become remote sandbox paths automatically.',
 'exp-fixtures':'Three authored fixtures: a P N G image, a P D F field note, and a plain text observation, each with its size and SHA two fifty-six hash.','exp-status':'Inspecting the inventory does not upload anything.'})
d.shot('controls','Offline · Choose a fixture and a route',{'controls-fixture':'Choose a fixture. We start with the aurora finch image.','controls-route':'The delivery route offers an inline block, a file upload and mount preview, and a downloaded output preview.',
 'controls-run':'Click Run offline comparison.','controls-status':'The status confirms two thousand four hundred five checked bytes, and zero provider calls.'})
d.shot('inline-png','Offline · Inline image block',{'inline-png-file':'The host checked the fixture: image slash p n g, with its size and SHA two fifty-six hash.',
 'inline-png-blocks':'The redacted request shows two content blocks: the question as a text block of forty-two characters, and an image block with a base64 source. The bytes themselves are not displayed.',
 'inline-png-mount':'An inline block needs no uploaded file and no mount path.','inline-png-calls':'Zero provider calls, and no usage: this is an authored fixture, and no file was uploaded.'})
d.shot('inline-pdf','Offline · Inline PDF document',{'inline-pdf-file':'Now the P D F field note.','inline-pdf-blocks':'The P D F becomes a document block, again with a base64 source, and media type application slash p d f.'})
d.shot('inline-txt','Offline · Inline text document',{'inline-txt-file':'And the plain text observation, eighty-nine bytes.','inline-txt-blocks':'Plain text is also a document block, but its source type is text, not base64.'})
d.shot('upload','Offline · File upload and mount preview',{'upload-blocks':'Switch the route to File upload and mount preview, with the P D F. Now the message carries only a text block: the question, plus an instruction to read the mounted file.',
 'upload-mount':'The file travels separately, as a file resource. It has a file I D, and a mount path under slash m n t slash session slash uploads slash lab twenty-nine.',
 'upload-note':'This is still a preview. No file was uploaded, and no provider was called.'})
d.shot('disk','Offline · Downloaded output preview',{'disk-mount':'The downloaded output preview keeps the same mounted input.','disk-agent':'The authored agent answer describes the fictional note.',
 'disk-output':'And the downloaded output is separate evidence: a session output artifact reporting three fictional Aurora Finches. An input mount and an output download are different things.'})
d.shot('malformed','Offline · Malformed base64',{'malformed-payload':'Back on the inline route, choose the Malformed base64 payload.','malformed-status':'The host rejects it before building any block: Malformed base64 payload.'})
d.shot('oversized','Offline · Oversized payload',{'oversized-payload':'Now the Oversized text payload.','oversized-status':'Rejected again: the decoded payload exceeds its size bound. Every fixture has a byte limit, checked after decoding.'})
d.shot('no-live','The app stays offline',{'no-live-text':'This lab has no Run live button. Live upload is unavailable until a separate, explicit Files A P I adapter is configured, and source inspection never uploads a file. So the app stays offline, and its previews show the exact request shapes. Now we make the real calls from a small script in the terminal of the project: the script is that separate, explicit Files A P I adapter, opted in for this demo.'})
d.terminal('Live · Upload and mount a real file',[(l,'lv-run' if l.startswith('PS ') else 'lv-upload' if l.startswith('Uploaded') else 'lv-mount' if l.startswith('Resource listed') else 'lv-image' if l.startswith('user.message sent') else None) for l in live[:5]],
 {'lv-run':'The script reads the agent and environment IDs from dot env, and runs with node and t s x.',
  'lv-upload':'It uploads one fictional fixture, observation dot t x t, with the Files A P I. The answer is a real file I D, eighty-nine bytes, of type text slash plain.',
  'lv-mount':'It creates a session with that file as a file resource, and only the read tool. Sessions dot resources dot list shows the mount path, slash m n t slash session slash uploads slash lab twenty-nine slash observation dot t x t. Notice that the listed file I D is different: the session mounts its own copy of the upload.',
  'lv-image':'One user message carries a text block, plus the aurora finch picture as an inline image block, base64, two thousand four hundred five bytes.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.terminal('Live · Read, quote, clean up',[(l,'lv-read' if l.startswith('agent.tool_use') else 'lv-quote' if 'Count: 3' in l else 'lv-deleted' if l.startswith('File deleted') else None) for l in live[:1]+live[5:]],
 {'lv-read':'The turn ends idle. The agent called the read tool on the mounted path: the local file did not become a sandbox file by itself, the explicit resource put it there.',
  'lv-quote':'It quotes the Count line, Count three, and describes the inline image as an orange cartoon bird on a branch.',
  'lv-deleted':'Finally, the session is archived, and the uploaded file is deleted. Retrieving its metadata afterwards returns four hundred four, not found.'},note='LIVE RUN · IDS PARTLY HIDDEN')
d.compare('Offline and live, compared','What did the real upload prove?',[
 ('vs-mount','MOUNT','A real mount path','The listed resource matches<br>the offline mount preview','The offline preview showed a mount path under slash m n t slash session slash uploads slash lab twenty-nine, and the real session listed exactly that path.'),
 ('vs-inline','INLINE','Image in the message','A base64 image block,<br>no upload needed','The inline image needed no upload and no mount: it travelled inside the user message.'),
 ('vs-cleanup','CLEANUP','Delete what you upload','Archive the session,<br>delete the file','And the live run cleaned up after itself: the session was archived and the uploaded file was deleted.')],'Only the fictional fixture was uploaded, and the session read it through the read tool.')
d.code([(1,'Concept and dependencies','Now open the TypeScript source tab. Section one: the imports connect the concept router to the Lab twenty-nine files module.'),
 (3,'POST /inline','Section three handles the inline route.'),
 (4,'POST /upload','Section four handles the upload and mount preview.'),
 (5,'POST /disk','Section five handles the downloaded output preview.')])
d.mapping('Where do images and files go?',[
 ('map-sdk','CLAUDE AGENT SDK','Images and files in prompts','Content blocks in the<br>prompt you send to query','In the Agent SDK, you put images and documents into the prompt as content blocks.'),
 ('map-managed','CLAUDE MANAGED AGENTS','Content blocks and file resources','user.message blocks · Files API<br>session file resources','This platform uses Managed Agents beta sessions, not the Agent SDK. Inline blocks go into a user message event. Larger files go through the Files A P I, and are attached as session file resources with a mount path.'),
 ('map-port','THIS PLATFORM','The Lab 29 files module','server/lib/lab29-files.ts','The code is in the Lab twenty-nine files module.')],'Content blocks, the file mount and the redaction are in server/lib/lab29-files.ts.')
d.port('port-inline','Source · Inline content blocks',{'port-image':'A P N G fixture becomes an image block with a base64 source.','port-document':'A P D F becomes a base64 document block, and a text file becomes a document block with a text source.',
 'port-message':'The question and the block are sent together in one user dot message event.'})
d.port('port-mount','Source · File resource and redaction',{'port-mount':'For the upload route, the file resource has type file, a file I D, and a mount path.','port-offline':'Any mode other than scripted is refused: live upload needs a separate Files A P I adapter.',
 'port-redact':'And the request shown to you is redacted: block types, source types, and byte counts, never the bytes.'})
d.knowledge('Finish with the knowledge check: are file mounts and downloaded outputs the same evidence?','No. Inline blocks, file mounts, and downloaded output evidence have different roles.')
d.summary([('sum-inline','INLINE','Content blocks','Image or document, checked first.','You can now send a checked image or document as an inline content block.'),
 ('sum-mount','MOUNT','File resources','An explicit file and mount path.','Attach a file explicitly, as a session file resource with a mount path.'),
 ('sum-output','OUTPUT','Separate evidence','Downloads are not inputs.','And keep downloaded outputs separate from the files you sent.')],'Lab 30 · Task boards')
d.finish()
