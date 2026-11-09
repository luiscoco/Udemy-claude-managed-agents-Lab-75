/** Package authored source and existing course media; never pack local credentials. */
import { readdir, lstat, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { zipFiles } from '../docgen-skills/atmira-docx/scripts/build-docx.mjs';
import { forbiddenPath, scanFiles } from './scan-distribution.mjs';

const roots = ['src', 'shared', 'server', 'scripts', 'tests', 'browser-tests',
  'fixtures', 'docgen-skills', 'skills', 'mcp-servers', 'managed', 'ci-kit',
  'python', 'extensions', 'docs', 'mini-projects', 'public', 'azure', 'aws'];
const rootFiles = ['Dockerfile', '.dockerignore', 'package.json', 'package-lock.json',
  'tsconfig.json', 'vite.config.ts', 'playwright.config.ts', 'index.html',
  '.gitattributes', '.gitignore', '.npmignore', 'README.md'];
const skip = new Set(['node_modules', 'dist', '.git', '.aws', '.agents', '.codex',
  '.claude', '.venv', '__pycache__', '.build', 'test-results', 'playwright-report',
  'aws-state', 'artifacts', 'prompt-migration']);
const starterExample = /^mini-projects\/(study-coach|agent-evaluation-studio|agent-publishing-studio)\/\.env\.example$/;
const allowed = name => !forbiddenPath(name)
  && !name.split('/').some(part => skip.has(part))
  && !/\.(?:local|tmp)\.|\.(?:pem|key|pfx|p12|jsonl|log|mp4|webm|mov|mkv|zip|msi|exe|pyc)$/i.test(name)
  && (!name.split('/').some(part => part.startsWith('.env')) || starterExample.test(name))
  && !/\.(?:lock|tmp)\.json$/.test(name);
const paths = new Set(rootFiles);
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${directory}/${entry.name}`;
    if (!allowed(name)) continue;
    if (entry.isSymbolicLink()) throw Error(`Source symlink rejected: ${name}`);
    if (entry.isDirectory()) await walk(name);
    else paths.add(name);
  }
}
for (const root of roots) await walk(root);
for (const entry of await readdir('.')) if (/^Tab\d+(?:-[a-z0-9-]+)?\.md$/.test(entry)) paths.add(entry);
for (const name of paths) if (!allowed(name) || !(await lstat(name)).isFile()) throw Error(`Unexpected source member: ${name}`);
const ordered = [...paths].sort();
console.log(`Scanning ${ordered.length} authored source and media files.`);
const failures = await scanFiles(ordered);
if (failures.length) throw Error(failures.join('\n'));
const files = {}, manifest = {};
for (const name of ordered) {
  files[name] = await readFile(name);
  manifest[name] = createHash('sha256').update(files[name]).digest('hex');
}
files['aws/source-manifest.json'] = JSON.stringify(manifest, null, 2);
console.log('Credential scan passed. Writing the source archive.');
const out = resolve('artifacts/aws-deployment'); await mkdir(out, { recursive: true });
const zip = zipFiles(files);
await writeFile(resolve(out, 'claude-learning-aws.zip'), zip);
const report = { files: ordered.length, bytes: zip.length,
  sha256: createHash('sha256').update(zip).digest('hex'),
  sourceArchive: 'artifacts/aws-deployment/claude-learning-aws.zip',
  credentialPatternScan: 'passed', cloudDeploymentExecuted: false };
await writeFile(resolve(out, 'package-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
