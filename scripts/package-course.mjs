import { readdir, readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { zipFiles } from '../docgen-skills/atmira-docx/scripts/build-docx.mjs';
import { forbiddenPath, scanFiles } from './scan-distribution.mjs';
// Explicit authored-source allowlist. Runtime folders are never traversed.
const roots = ['public/audio/guides', 'public/audio/infographics', 'public/infographics', 'public/images', 'src', 'shared', 'server', 'scripts', 'tests', 'browser-tests', 'fixtures', 'docgen-skills', 'skills', 'mcp-servers', 'managed', 'ci-kit', 'python/lab70', 'extensions/lab69', 'docs', '.github/workflows'];
const rootFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'playwright.config.ts', 'index.html', '.env.example', '.gitattributes', '.gitignore', '.npmignore', 'README.md'];
const allowed = path => !forbiddenPath(path) && !/\.(?:local|tmp|lock)\.json$|\.local\.|(?:^|\/)(?:dist|node_modules|__pycache__|artifacts|\.git|\.venv)(?:\/|$)/i.test(path)
  && (rootFiles.includes(path) || /^Tab\d+(?:-[a-z0-9-]+)?\.md$/.test(path)
    || /^(?:src|shared|server|scripts|tests|browser-tests|fixtures|docgen-skills|skills|mcp-servers|managed|ci-kit|python\/lab70|extensions\/lab69)\/[^\0]+\.(?:ts|tsx|mjs|js|json|md|html|css|svg|png|csv|txt|py|ps1|yaml|yml)$/.test(path)
    || /^public\/audio\/guides\/(?:manifest\.json|tour-(?:[1-9]|[1-6][0-9]|7[0-5])-(?:goal|preparation|example|controls|evidence|source|practice)-[a-f0-9]{16}\.(?:mp3|json))$/.test(path)
    || /^public\/audio\/infographics\/visual-(?:[1-9]|[1-6][0-9]|7[0-5])-(?:concepts|lab)-[a-f0-9]{16}\.(?:mp3|json)$/.test(path)
    || /^public\/infographics\/(?:pilot-manifest\.json|ARTWORK\.md|lab-(?:0[1-9]|[1-6][0-9]|7[0-5])-(?:concepts|lab)\.png|prompts\/lab-(?:0[1-9]|[1-6][0-9]|7[0-5])-(?:concepts|lab)(?:-correction)?\.txt)$/.test(path)
    || path === 'public/images/portal-welcome.png'
    || /^\.github\/workflows\/[a-z-]+\.yml$/.test(path)
    || /^docs\/student-build-prompts\/(?:coverage\.json|reference-data\/(?:course|media-catalog|reference-versions)\.json)$/.test(path)
    || path === 'ci-kit/Dockerfile' || /^docs\/managed-foundation-(?:390|1280)\.png$/.test(path) || /^docs\/[^\0]+\.(?:md|docx)$/.test(path));
const paths = new Set(rootFiles);
async function walk(path) { for (const entry of await readdir(path, { withFileTypes: true })) { const name = `${path}/${entry.name}`;
  if (entry.isSymbolicLink()) throw new Error(`Authored source link rejected: ${name}`);
  if (entry.isDirectory()) { if (!forbiddenPath(name) && !/^(?:dist|node_modules|__pycache__|artifacts|\.git|\.venv)$/.test(entry.name)) await walk(name); }
  else if (allowed(name)) paths.add(name);
} }
for (const root of roots) await walk(root);
for (const entry of await readdir('.')) if (/^Tab\d+(?:-[a-z0-9-]+)?\.md$/.test(entry)) paths.add(entry);
for (const path of paths) if (!allowed(path) || !(await lstat(path)).isFile() || relative(process.cwd(), resolve(path)).startsWith('..')) throw new Error('Invalid distribution member.');
const failures = await scanFiles([...paths]); if (failures.length) throw new Error(failures.join('\n'));
const files = {}, manifest = {};
for (const path of [...paths].sort()) { files[path] = await readFile(path); manifest[path] = createHash('sha256').update(files[path]).digest('hex'); }
files['distribution-manifest.json'] = JSON.stringify(manifest, null, 2);
await mkdir('artifacts/course', { recursive: true }); const zip = zipFiles(files); await writeFile('artifacts/course/managed-agents-labs-01-75.zip', zip);
console.log(JSON.stringify({ files: paths.size, bytes: zip.length, sha256: createHash('sha256').update(zip).digest('hex'), output: 'artifacts/course/managed-agents-labs-01-75.zip', credentialsIncluded: false }));
