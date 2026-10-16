import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'extensions/lab69/tsconfig.json'], { stdio: 'inherit' });
const result = await build({ entryPoints: ['extensions/lab69/src/extension.ts'], outfile: 'extensions/lab69/dist/extension.cjs',
  platform: 'node', target: 'node22', format: 'cjs', bundle: true, external: ['vscode'], sourcemap: false, metafile: true });
if (Object.keys(result.metafile.inputs).some(path => /managed-config|anthropic|(?:^|\/)\.env/.test(path)))
  throw new Error('Provider code or private configuration reached the extension bundle.');
console.log('Lab 69 extension typecheck and bundle passed.');
