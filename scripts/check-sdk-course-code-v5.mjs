import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const app='C:/Users/luis.coco/Downloads/Udemy-claude-managed-agents-Lab-75-main/Udemy-claude-managed-agents-Lab-75-main/presentations/agent-sdk/lesson01-getting-started';
// Use the compiler installed with the practical app, matching its SDK declarations.
const ts=require(app+'/node_modules/typescript/lib/typescript.js');
const dir=app+'/node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts';
const file='presentations/agent-sdk-course-index-code-and-app-v5/code-examples.ts';
const program=ts.createProgram([file],{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,noEmit:true,skipLibCheck:true,types:['node'],typeRoots:[app+'/node_modules/@types'],baseUrl:process.cwd(),paths:{'@anthropic-ai/claude-agent-sdk':[dir]}});
const errors=ts.getPreEmitDiagnostics(program);
console.log(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:f=>f,getNewLine:()=>"\n"})||'All displayed TypeScript excerpts compile against the installed Agent SDK.');
const sdk=JSON.parse(readFileSync(app+'/node_modules/@anthropic-ai/claude-agent-sdk/package.json','utf8'));
writeFileSync(path.join(path.dirname(file),'code-validation.json'),JSON.stringify({checkedAgainst:dir,sdkVersion:sdk.version,typescriptVersion:ts.version,diagnostics:errors.length,result:errors.length?'failed':'passed'},null,2));
process.exit(errors.length?1:0);
