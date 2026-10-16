import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { zipFiles } from '../docgen-skills/atmira-docx/scripts/build-docx.mjs';
const files = {};
for (const path of ['SKILL.md', 'reference/spec-format.md', 'reference/incident-report.md', 'assets/brand.json', 'scripts/build-docx.mjs'])
  files[`atmira-docx/${path}`] = await readFile(`docgen-skills/atmira-docx/${path}`);
const manifest = Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, createHash('sha256').update(bytes).digest('hex')]));
await mkdir('artifacts/lab72', { recursive: true });
await writeFile('artifacts/lab72/atmira-docx.zip', zipFiles(files));
await writeFile('artifacts/lab72/skill-manifest.json', JSON.stringify(manifest, null, 2));
console.log('Packaged authored skill and SHA256 manifest locally. No upload or provider request.');
