/** Load only a verified Docker Desktop kind node; preserve binary bytes on Windows. */
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const folder='presentations/kubernetes-desktop-deployment/evidence/';
function run(args){return new Promise((resolve,reject)=>{const child=spawn('docker',['--context','desktop-linux',...args],{windowsHide:true});let output='';for(const stream of [child.stdout,child.stderr])stream.on('data',b=>output+=b);child.on('error',reject);child.on('close',code=>code===0?resolve(output.trim()):reject(Error(output)));});}
if(process.argv.includes('--wait-for-build')){
  for(;;){const evidence=JSON.parse(await readFile(folder+'deployment-evidence.json','utf8'));const build=evidence.commands.find(r=>r.id==='05-build');if(build?.status==='passed')break;if(build?.status==='failed')throw Error('Build failed.');await new Promise(r=>setTimeout(r,1500));}
}
const node='desktop-control-plane';
const cluster=await run(['inspect',node,'--format','{{index .Config.Labels "io.x-k8s.kind.cluster"}}']);
if(cluster!=='desktop')throw Error('Refuse a node outside the Docker Desktop kind cluster.');
const row={id:'08-import-image',command:`docker --context desktop-linux image save claude-learning-platform:kubernetes | docker --context desktop-linux exec -i ${node} ctr --namespace k8s.io images import -`,startedAt:new Date().toISOString()};
console.log('Loading the image into the verified Docker Desktop node.');
const source=spawn('docker',['--context','desktop-linux','image','save','claude-learning-platform:kubernetes'],{windowsHide:true});
const target=spawn('docker',['--context','desktop-linux','exec','-i',node,'ctr','--namespace','k8s.io','images','import','-'],{windowsHide:true});
let output='';for(const stream of [source.stderr,target.stdout,target.stderr])stream.on('data',b=>output+=b);
source.stdout.pipe(target.stdin);target.stdin.on('error',()=>{});
const codes=await Promise.all([source,target].map(c=>new Promise((resolve,reject)=>{c.once('error',reject);c.once('close',resolve);})));
Object.assign(row,{output,exitCode:codes.every(c=>c===0)?0:1,status:codes.every(c=>c===0)?'passed':'failed',finishedAt:new Date().toISOString()});
await writeFile(folder+'08-import-image.txt',`$ ${row.command}\n\n${output}\n[exit ${row.exitCode}]\n`);
await writeFile(folder+'image-import-evidence.json',JSON.stringify(row,null,2));
if(row.status!=='passed')throw Error('Image import failed.');console.log('Docker Desktop kind image imported.');
