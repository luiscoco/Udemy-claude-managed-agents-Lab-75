// Deterministic documentation build. Imports authored teaching data only; no network.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { foundations, experience, delivery, recoveries, sixColourStyle } from './student-prompt-stages.mjs';
import { content } from '../shared/learning-content.ts';
import { learningGuide } from '../shared/learning-guide.ts';
import { narrationSegments, narrationText } from '../shared/learning-narration.ts';
import { lessonInfographics, infographicKey } from '../shared/learning-infographics.ts';
import { zipFiles } from '../docgen-skills/atmira-docx/scripts/build-docx.mjs';
import { scanFiles } from './scan-distribution.mjs';

const args = process.argv.slice(2);
assert.ok(args.length === 1 && ['--write', '--check', '--package'].includes(args[0]), 'Use --write, --check or --package.');
const root = 'docs/student-build-prompts';
const referenceCommit = '963cbbf8a30b2341d0a932baab53d79766c32337';
const reference = `https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/tree/${referenceCommit}`;
const json = value => JSON.stringify(value, null, 2) + '\n';
// Git checkouts may use CRLF on Windows; document identity is canonical UTF-8/LF.
const read = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const hash = value => createHash('sha256').update(value).digest('hex');
const legacy = JSON.parse(await read('docs/prompt-migration/migration-manifest.json'));
const packageJson = JSON.parse(await read('package.json'));
const lock = JSON.parse(await read('package-lock.json'));
const recordings = JSON.parse(await read('public/audio/guides/manifest.json'));
const visualRecordings = JSON.parse(await read('public/infographics/pilot-manifest.json'));
const guideFiles = (await readdir('.')).filter(path => /^Tab\d+-.*\.md$/.test(path));
const uiFiles = await readdir('src/concepts');
const serverFiles = await readdir('server/concepts');
const unitFiles = await readdir('tests');
const titles = { 1: 'Session event streaming', 2: 'Session options', 3: 'Built-in tools', 4: 'Permissions', 5: 'Custom tools',
  ...Object.fromEntries(legacy.labs.map(lab => [lab.id, lab.title])) };
const files = new Map();
const put = (path, text) => { assert.ok(!files.has(path), `Duplicate output ${path}`); files.set(path, text.replaceAll('\r\n', '\n').replace(/[ \t]+$/gm, '')); };
const promptFence = text => '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(match => match[0].length)) + 1);
const block = text => { const fence = promptFence(text); return `COPY PROMPT START\n\n${fence}text\n${text.trim()}\n${fence}\n\nCOPY PROMPT END`; };
const policy = `Work in the project created by F01 and preserve completed checkpoints. Read the current workspace before editing. Implement this step; do not merely propose a plan. Use strict input schemas, explicit fixture/live labels and owner/role boundaries. Inspect installed official Managed SDK types for provider operations. Do not substitute Agent SDK query/options/hooks or invent provider capabilities. Keep keys server-only. No provisioning, paid synthesis, model session, external notification, cloud deployment, commit/push or release publication is authorized merely by this build prompt. Such operations need the student's separate explicit authorization. Never print keys or ask for them in chat. Do not use generated model prose as verification. Report files changed, exact checks run and unresolved limits.`;
function renderStep(step) {
  const introduction = step.id === 'F01' ? policy.replace('Work in the project created by F01 and preserve completed checkpoints.', 'Begin in the empty student workspace; no application exists yet.') : policy;
  return `# ${step.id} ${step.title}\n\n${step.goal}\n\n${block(`${introduction}\n\n${step.prompt}`)}\n\n**Checkpoint:** Explain the implemented behavior, run the named checks that exist at this stage, inspect the result and preserve a working checkpoint before the next prompt. If a requirement is missing, repair it with R01 instead of declaring completion.\n`;
}
const stages = [...foundations,
  { id: 'F05', title: 'Configure the optional Managed Agents runtime', goal: 'Create local readiness and explicit provider setup before L01.', prompt: legacy.foundation_blocks[0] }];
put('12-six-colour-visual-style.md', '# Six-colour visual style improvement - 21 October 2026\n\nUse this standalone prompt to upgrade an existing student app, or apply it with P01.\n\n' + block(sixColourStyle) + '\n');
const ordered = [];
for (const step of stages) { const path = `steps/${step.id}.md`; put(path, renderStep(step)); ordered.push({ ...step, path, group: 'Foundations' }); }
const lessons = [];
for (let id = 1; id <= 75; id++) {
  const padded = String(id).padStart(2, '0'), data = content[id];
  assert.ok(data && titles[id]);
  const guidePath = guideFiles.find(path => new RegExp(`^Tab${id}-`).test(path));
  assert.ok(guidePath, `Missing guide ${id}`);
  const source = [...uiFiles.filter(path => path.startsWith(`Concept${padded}`)).map(path => `src/concepts/${path}`),
    ...serverFiles.filter(path => path.startsWith(`${padded}-`)).map(path => `server/concepts/${path}`), ...data.inspect];
  for (const path of source) await access(path);
  const tests = unitFiles.filter(path => new RegExp(`^lab0?${id}-`).test(path)).map(path => `tests/${path}`);
  const extensionEntries = legacy.extras.filter(extra => Number.parseInt(extra.id, 10) === id);
  const guide = (await read(guidePath)).replace(/^# .*\r?\n/, '').trim();
  const historical = id <= 5 ? legacy.foundation_blocks[id] : legacy.labs.find(lab => lab.id === id).paragraphs.join('\n\n');
  const phaseScope = extensionEntries.length
    ? `Begin the multi-step Lab ${padded} ${titles[id]}. Read the remainder as the final target contract for the whole lab. In THIS parent checkpoint, establish the specification and minimal compiling scaffolding needed by ${extensionEntries[0].id}; implement the feature through the following lettered prompts ${extensionEntries.map(item => item.id).join(', ')}. Do not try to pass the full end-to-end lesson before those implementation substeps. Keep unfinished behavior unpublished and do not register a placeholder as an implemented lesson.`
    : `Implement Lab ${padded} ${titles[id]} after the preceding lesson.`;
  const description = `${policy}\n\n${phaseScope} Goal: ${data.objective}\n\n` +
    `Create the actual browser exercise, shared contracts, host handlers/ports, deterministic fixtures, complete detailed guide and focused tests. Register only this genuinely implemented lesson at /api/c${id}. A reserved ID or placeholder view is not completion. Use these exact reference paths for the corresponding responsibilities, authoring their implementation in the student's project:\n${[...new Set(source)].map(path => `- ${path}`).join('\n')}\n- ${guidePath}\n\n` +
    `Implementation brief\n${historical.replace(/Session creation documentation|Event delta documentation/g, '')}\n\n` +
    `Current detailed teaching specification\nThe following is the current implemented course contract and takes precedence over any less-specific older brief. Recreate its behavior, constraints, fixtures and documented limitations; this is not evidence that a live adapter has been executed.\n\n${guide}\n\n` +
    `Baseline and comparison\n${data.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nStudent challenge\n${data.challenge}\n\n` +
    `Verification\n${extensionEntries.length ? `At this parent checkpoint verify the new scaffolding compiles and prior lessons still work, then continue immediately to L${extensionEntries[0].id}. Full lesson registration, browser evidence and acceptance belong after L${extensionEntries.at(-1).id}, not before the lettered implementation prompts.` : `Create the focused test files appropriate to this lesson${tests.length ? `, using the reference responsibilities ${tests.join(', ')}` : ''}. Run typecheck, focused deterministic tests, guide/source checks and build sequentially. Include a browser demonstration using fixtures without a provider call.`} Keep previously completed lessons passing; run the broader suite when shared behavior changes. Show actual denial/failure/cleanup evidence where required. Do not automatically mark the student's checklist. If Git checkpoints are requested, commit only reviewed passing work.\n`;
  const step = { id: `L${padded}`, title: titles[id], goal: data.objective, prompt: description, path: `lessons/L${padded}.md`, group: 'Lessons', lessonId: id };
  // description already contains the shared policy; do not duplicate it.
  put(step.path, `# ${step.id} ${step.title}\n\n${step.goal}\n\n${block(description)}\n\n**Checkpoint:** ${extensionEntries.length ? `This is the whole-lab brief and compiling scaffold. Continue to L${extensionEntries[0].id}; complete the full lesson checks after L${extensionEntries.at(-1).id}.` : `Complete this lesson's baseline, comparison, error/denial cases, challenge and source inspection. Record actual checks before continuing.`}\n`);
  ordered.push(step);
  for (const [extensionIndex, extension] of extensionEntries.entries()) {
    const finalSubstep = extensionIndex === extensionEntries.length - 1;
    const extra = { id: `L${extension.id}`, title: extension.title, goal: `Implement this detailed substep of Lab ${padded} before the next numbered lesson.`, prompt: `${extension.paragraphs.join('\n\n')}\n\nApply the current detailed Lab ${padded} specification in L${padded} and its challenge when the older brief omits a boundary. ${finalSubstep ? `This is the final substep: finish the real UI/router registration and guide, run the complete lesson baseline/comparison/error cases and focused tests, verify source links and typecheck/build, then continue to the next numbered lesson. Never register an unfinished placeholder.` : `Verify the modules implemented so far and preserve prior lessons; then continue to L${extensionEntries[extensionIndex+1].id}. Full lesson UI acceptance and registration happen after L${extensionEntries.at(-1).id}.`}`, path: `lessons/L${extension.id}.md`, group: 'Extensions' };
    put(extra.path, renderStep(extra)); ordered.push(extra);
  }
  lessons.push({ id, title: titles[id], ...data, guidePath, sources: [...new Set(source)], tests });
}
for (const [group, entries] of [['Learning experience', experience], ['Quality and delivery', delivery], ['Recovery', recoveries]])
  for (const step of entries) { const path = `steps/${step.id}.md`; put(path, renderStep(step)); ordered.push({ ...step, path, group }); }
assert.equal(lessons.length, 75);
assert.equal(ordered.filter(step => step.group === 'Extensions').length, 11);
assert.equal(new Set(ordered.map(step => step.id)).size, ordered.length);

const narration = [];
for (const lesson of lessons) for (const step of learningGuide(lesson.id)) {
  const key = `${lesson.id}:${step.id}`, recording = recordings.clips[key];
  assert.equal(recording.text, narrationText(step), `Stale narration ${key}`);
  narration.push({ lessonId: lesson.id, step, segments: narrationSegments(step), recording });
}
assert.equal(narration.length, 525); assert.equal(lessonInfographics.length, 150);
const visuals = lessonInfographics.map(visual => {
  const key = infographicKey(visual.lessonId, visual.kind), asset = visualRecordings.assets[key];
  assert.equal(hash(JSON.stringify(visual)), asset.contentSha256);
  return { ...visual, asset };
});
put('reference-data/course.json', json({ referenceCommit, lessons }));
put('reference-data/media-catalog.json', json({ referenceCommit, explanation: 'Authored teaching data for optional matching instructor media reuse. No credentials, provider responses or student notes. This file is not application code.', guideClips: narration, visuals }));
put('reference-data/README.md', `# Use the teaching and media reference data\n\nKeep these supplied files outside the empty app while beginning F01. Your coding assistant may read them as reference data. Use reference-versions.json for the frozen resolved package versions, course.json for the 75 lesson contracts and media-catalog.json for matching instructor recordings/images.\n\nThe media catalog is intentionally complete and large. Read it programmatically and select one lesson; do not paste it all into a chat request. For example, load JSON with Node, filter guideClips by lessonId and visuals by lessonId, then inspect those entries only. Each guide clip provides the exact step, rendered segment IDs/text and recording metadata. Copy the referenced MP3 and timing JSON from the teacher-provided media archive.\n\nEach visual entry contains lessonId, kind, title, regions and asset metadata. Reconstruct the visual catalog value with only lessonId, kind, title and regions, in that order, before comparing its serialized SHA-256 to asset.contentSha256. The asset field belongs to the manifest, not that content hash. Keep the exact supplied narration, guide targets, source paths, region IDs and measured boxes when reusing the supplied images/MP3s.\n\nA changed transcript needs a matching new recording; a newly generated image needs its own measured bounds and identity. No fabricated timestamps or stale-hash relabeling is valid. Do not treat this authored data as provider output or a live test result. Full downloadable media is supplied separately from this small prompt package.\n`);
put('reference-data/reference-versions.json', json({ referenceCommit, date: '2026-10-20', node: packageJson.engines.node,
  dependencies: Object.fromEntries(Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies }).map(([name, declared]) => [name, { declared, resolved: lock.packages[`node_modules/${name}`]?.version ?? null }])),
  scripts: Object.fromEntries(Object.entries(packageJson.scripts).filter(([name]) => !name.startsWith('prompts:'))), python: (await read('python/lab70/requirements.txt')).trim(),
  note: 'Frozen reference versions, not a claim that later provider APIs or model availability are unchanged. Never silently substitute unsupported API fields.' }));

const imageIndex = [];
for (const visual of visuals) {
  const stem = `lab-${String(visual.lessonId).padStart(2, '0')}-${visual.kind}`;
  const source = `public/infographics/prompts/${stem}.txt`;
  const prompt = await read(source);
  let correction = '';
  try { correction = await read(`public/infographics/prompts/${stem}-correction.txt`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const path = `image-prompts/${stem}.md`;
  const introduction = `# Lab ${String(visual.lessonId).padStart(2, '0')} ${visual.kind === 'concepts' ? 'concept map' : 'lab walkthrough'} image prompt\n\nUse after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.\n\n`;
  put(path, introduction + block(prompt) + (correction ? `\n\n## Observed correction prompt\n\nThis corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.\n\n${block(correction)}` : '') + '\n');
  imageIndex.push({ lessonId: visual.lessonId, kind: visual.kind, path });
}
put('image-prompts/README.md', '# Image prompt collection\n\nOne original generation prompt per image. Follow P15, review with P16 and measure panels with P17 before recording/publishing. These are separate image-tool prompts, not additional app implementation steps.\n\n' + imageIndex.map(item => `- [Lab ${String(item.lessonId).padStart(2, '0')} ${item.kind}](${item.path.split('/').at(-1)})`).join('\n') + '\n');

const phaseDefinitions = [
  ['01-foundations.md', 'Build the foundations', step => step.group === 'Foundations'],
  ...[[1,15],[16,30],[31,45],[46,60],[61,75]].map(([start,end], i) => [`0${i+2}-lessons-${String(start).padStart(2,'0')}-${end}.md`, `Build lessons ${start} through ${end}`, step => ['Lessons','Extensions'].includes(step.group) && Number.parseInt(step.id.slice(1),10) >= start && Number.parseInt(step.id.slice(1),10) <= end]),
  ['07-learning-experience.md', 'Build the complete learning experience', step => step.group === 'Learning experience'],
  ['08-quality-and-delivery.md', 'Verify and deliver the platform', step => step.group === 'Quality and delivery'],
  ['09-recovery.md', 'Repair a checkpoint and audit parity', step => step.group === 'Recovery'],
];
for (const [path,title,filter] of phaseDefinitions) put(path, `# ${title}\n\nOpen one prompt at a time in this order. A lettered lesson extension belongs immediately after its parent lesson. Do not skip its checkpoint.\n\n` + ordered.filter(filter).map(step => `- [${step.id} ${step.title}](${step.path}) — ${step.goal}`).join('\n') + '\n');

const parity = [
  ['75 implemented lessons and 11 inserted extensions','L01 to L75 and lettered extensions','Real forms, strict host contracts, guides, fixtures, challenges and source inspection for every ID.'],
  ['Empty-folder scaffold and optional Managed runtime','F01 to F05','Working health/shell/dev/build, no key required for fixtures; no automatic provisioning.'],
  ['Themes responsive navigation source views','F02 F04 P01 P11 P13','Desktop/phone, search/topic/order, history and stable focus; no execution from navigation.'],
  ['Seven-step guides and spoken fragment highlights','P02 to P06','525 exact transcripts/clips; concrete paragraph/sentence DOM selection including gaps/seek/replay.'],
  ['Notes checklists visits and backups','P07','Explicit saves, optional self-assessment, closed preview/restore, legacy compatibility and rollback.'],
  ['Knowledge practice paths and review','P08','75 real questions, stored attempt validation, optional paths and bookmark/incorrect review.'],
  ['Three milestone starters and references','P09 P10','Intentionally failing starters, separate complete references, 4/3/5 tests, no learner-code upload.'],
  ['Start here and recorded validation','P12','Direct offline baseline links and evidence scoped to actual tested commits.'],
  ['Two illustrated tabs for each lesson','P14 to P19','150 PNGs, distinct poses, 150 visual MP3s, 900 measured regions; actual source links and transcripts.'],
  ['Zoom pan and follow spoken region','P19','Keyboard/touch/manual navigation, following opt-in, tab switch stops audio and keeps experiment inputs.'],
  ['Media integrity and student no-key playback','P05 P17 P18 Q01','675 total MP3s with verified identities/timings; paid author generation separate from playback.'],
  ['Host/provider execution boundaries','All lessons and Q05 Q06','Fixture/live distinction, owner/role checks, bounded calls/deadlines/costs and independently verified cleanup.'],
  ['All lesson regression and sharded CI','Q01 Q02 Q04','Original test set partitions exactly once; no weakened assertions; every prerequisite gates packaging.'],
  ['Sanitized source distribution and versioned release','Q03 Q07','Exact tested package, hash manifest/checksums, verified uploads; credentials/runtime state excluded.'],
];
put('11-final-parity-checklist.md', '# Final feature parity checklist\n\nAssess behavior and evidence, not placeholder counts or visual resemblance. Mark each row checked, unverified, blocked or missing. AI-generated code and images are not guaranteed to reproduce byte-for-byte. This workbook has not independently replayed every prompt into a fresh implementation; the acceptance gates define what the student must actually verify.\n\n| Capability | Prompts | Required evidence |\n| --- | --- | --- |\n' + parity.map(row => `| ${row.join(' | ')} |`).join('\n') + `\n\nNavigation revision, 21 October 2026: Use the searchable desktop sidebar or mobile menu and previous/next links below the lesson to change lessons. Do not render a duplicate Lab 01-75 button grid or numbered lesson strip above the main workspace. Keep the lesson heading, guide shortcuts and all lesson workspace tabs, including infographic views. The TypeScript source viewer uses a pure black background and readable syntax colors in both themes across all 75 lessons. These intentional UI changes supersede the frozen reference layout.\n\nThe frozen source reference is [${referenceCommit.slice(0,7)}](${reference}). The app release [v0.2.0](https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/releases/tag/v0.2.0) targets e61bcac, with the same application features before the later workflow-only parallelization. The repository is private: students require granted access or the instructor-supplied downloads. Do not put instructor account/resource IDs or credentials into student prompts.\n`);

const start = `# Build the Claude Managed Agents learning platform from zero\n\nA copyable prompt curriculum for Udemy students. Authored 20 October 2026 against source ${referenceCommit.slice(0,7)}; interface revised 21 October 2026 to remove the duplicate numbered lesson button grid use black TypeScript source backgrounds in both themes, and add six semantic colour families. Start with an empty folder and build the application incrementally; the finished instructor repository is an optional read-only reference, not a prerequisite application to clone. This replaces the earlier assumption that the first five labs or the app shell already exist.\n\n## What you will build\n\nAll 75 Managed Agents lessons and 11 detailed extensions; the responsive shell, safe source views, guides and exact spoken-fragment highlights; optional progress, notes/backups, quizzes/paths/review, milestones and solutions; 150 astronaut infographics with zoom/pan and 900 timed regions; 525 lesson and 150 visual recordings; offline/browser checks, explicit live acceptance, sanitized packaging and release delivery.\n\n## Choose how to read\n\nUse [WORKBOOK.md](WORKBOOK.md) for one complete document, or open the smaller step files from the sequence below. Each COPY PROMPT block is a complete request to your coding assistant. Copy only one at a time, let it implement and verify the step, inspect the result and save a working checkpoint before continuing. Recovery prompts are at the end.\n\nThe [six-colour visual style prompt](12-six-colour-visual-style.md) is included in P01 and can also be copied independently to improve an existing app.\n\n## Prerequisites\n\nUse an AI coding assistant with local file/terminal access, Node 24 or newer, Git and VS Code or another editor. Chrome is used by browser checks. Windows examples use PowerShell and npm.cmd; use npm on other systems. The reference folder is claude-managed-agents, but it can live anywhere. Dependency installation and obtaining instructor materials need internet access. Local fixtures and included audio playback need no model or Inworld key.\n\n## Build order\n\n${phaseDefinitions.slice(0,8).map(([path,title],index) => `${index+1}. [${title}](${path})`).join('\n')}\n9. [Final parity checklist](11-final-parity-checklist.md) and [recovery prompts](09-recovery.md).\n\nComplete the numbered lessons in order. Insert 50A/50B after L50, 71A after L71, 72A after L72, 73A after L73, 74A after L74 and 75A through 75E after L75. The small chapter indexes already insert them correctly. Learning features follow the 75 lessons so every catalog can reference actual implemented content.\n\n## Media reuse and new media authoring\n\n**Recommended no-key student path:** build the application code from zero, then reuse the instructor-provided media and matching authored data when you reach P02/P05/P14. Obtain the licensed media from the v0.2.0 source ZIP or a teacher-provided equivalent. Copy public/audio/guides, public/audio/infographics and public/infographics, including manifests/timing JSON. Use [course.json](reference-data/course.json) and [media-catalog.json](reference-data/media-catalog.json) to reproduce the exact spoken text, segment/region IDs, guide actions, image dimensions/boxes and file identities. Their structure is authored teaching data, not a complete app implementation. Do not change text and pretend the old recording still matches. Access to the private repository must be granted or supplied through Udemy downloads.\n\n**Author path:** write your own teaching text and create new images/recordings deliberately. The [150 image prompts](image-prompts/README.md) include topic-specific astronaut poses and observed corrections. New images need fresh visual review and measured boxes. New Inworld MP3s need the author's separate paid account, real WORD timestamps and decode/hash checks; FFmpeg/ffprobe is an author prerequisite. Image tools may also have account/cost requirements. This workbook does not authorize billed generation or live calls. Students playing supplied media need neither service key.\n\n## Verification and honest limits\n\nA prompt is an implementation specification, not evidence that its output works. Compare actual files/UI and run the stated checks. During the early build count only registered implemented lessons; require all 75 and complete media inventory only at the final gate. Report unsupported live adapters and missing external configuration rather than simulating a live success. Never use a web/desktop login as a substitute for the app's server-side API key. Keep keys out of chat, Git, notes, browser storage and source views. Local owner headers and worktrees are teaching boundaries, not production authentication or OS containment.\n\nThe pinned source documents what was implemented; later official APIs, available models and dependency versions may change. [reference-versions.json](reference-data/reference-versions.json) records the frozen dependency/script inventory. Inspect installed official types and current primary documentation for a provider-specific operation instead of guessing. A from-zero replay has not been executed for this entire curriculum, and an AI rebuild is not guaranteed pixel- or byte-identical. [coverage.json](coverage.json) maps the authored build steps, all lessons and image prompts.\n\nThe student prompt ZIP contains Markdown and authored reference JSON, not the large media files, credentials or runtime evidence. The instructor supplies the media archive separately.\n`;
const firstSession = `\n## Your first coding session\n\n1. Extract this prompt ZIP into a reference folder outside the empty app folder. Give your coding assistant read access to that reference folder, especially its reference-data files.\n2. Create a separate empty application folder and open it in your editor/assistant. Do not run these build prompts over the instructor application or an unrelated project. Replace C:/claude-managed-agents in an older lesson brief with your own application path.\n3. Open steps/F01.md, copy the text between COPY PROMPT START and COPY PROMPT END, and send it to the assistant. Do not paste the entire 120-prompt workbook into one request.\n4. Run the checkpoint commands and inspect the result. Continue to F02 only after F01 works. Keep a checkpoint after each successful step so a later failure can be repaired locally.\n\nThere are 117 ordered implementation/delivery prompts and three recovery/parity prompts, for 120 total. The 150 image-tool prompts are additional separate assets. If the assistant cannot read the reference folder, attach the specific JSON or prompt file needed by that step. Local build steps do not authorize optional paid recording, live sessions or publication.\n`;
put('README.md', start + firstSession);
put('WORKBOOK.md', start + firstSession + '\n\n---\n\n# Complete implementation prompts\n\n' + ordered.map(step => files.get(step.path).replace(/^# /, '## ')).join('\n\n---\n\n') + '\n\n---\n\n' + files.get('11-final-parity-checklist.md'));
put('coverage.json', json({ referenceCommit, date: '2026-10-20', promptCount: ordered.length,
  implementedLessons: lessons.map(({ id }) => id), insertedExtensions: ordered.filter(step => step.group === 'Extensions').map(step => step.id),
  steps: ordered.map(({ id,title,path,group }) => ({ id,title,path,group })), imagePrompts: imageIndex,
  expectedFeatures: { lessons:75, guideMP3:525, infographicPNG:150, infographicMP3:150, infographicRegions:900 },
  note:'Coverage of authored specifications and reference data; not evidence that a new AI implementation has passed.' }));

for (const step of ordered) {
  const rendered = files.get(step.path);
  assert.equal((rendered.match(/^COPY PROMPT START$/gm) ?? []).length, 1);
  assert.equal((rendered.match(/^COPY PROMPT END$/gm) ?? []).length, 1);
  assert.ok(rendered.length > 600);
}
// Validate local Markdown links in every generated document before writing or packaging.
function outsideFences(text) {
  let fence = null;
  return text.split('\n').filter(line => {
    if (fence) { if (line === fence) fence = null; return false; }
    const opening = line.match(/^(`{3,})/);
    if (opening) { fence = opening[1]; return false; }
    return true;
  }).join('\n');
}
for (const [path,text] of files) if (path.endsWith('.md')) for (const match of outsideFences(text).matchAll(/\]\(([^\s)]+)\)/g)) {
  const link = match[1]; if (/^https?:|^#/.test(link)) continue;
  const target = relative(resolve(root), resolve(root, dirname(path), link.split('#')[0])).replaceAll('\\','/');
  assert.ok(files.has(target), `Broken workbook link ${path}: ${link}`);
}
if (args[0] === '--write') {
  for (const [path,text] of files) { const target = `${root}/${path}`; await mkdir(dirname(target), {recursive:true}); await writeFile(target,text); }
} else {
  for (const [path,text] of files) assert.equal(await read(`${root}/${path}`), text, `Stale student document ${path}`);
}
const bad = await scanFiles([...files.keys()], resolve(root)); assert.deepEqual(bad, []);
if (args[0] === '--package') {
  const entries = {}, manifest = {};
  for (const [path,text] of files) { entries[`student-build-prompts/${path}`] = Buffer.from(text); manifest[path] = hash(text); }
  entries['student-build-prompts/FILE-HASHES.json'] = Buffer.from(json(manifest));
  await mkdir('artifacts/course', {recursive:true});
  const archive = zipFiles(entries); await writeFile('artifacts/course/udemy-platform-build-prompts.zip',archive);
  await writeFile('artifacts/course/udemy-platform-build-prompts.zip.sha256', `${hash(archive)}  udemy-platform-build-prompts.zip\n`);
  console.log(json({ archive:'artifacts/course/udemy-platform-build-prompts.zip', bytes:archive.length, sha256:hash(archive) }));
}
console.log(json({ mode:args[0], files:files.size, prompts:ordered.length, numberedLessons:lessons.length, extensions:11,
  imagePrompts:imageIndex.length, guideClips:narration.length, visualClips:visuals.length, providerRequests:0 }));
