/** Execute only the dedicated local Docker Desktop Kubernetes tutorial. */
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, open } from 'node:fs/promises';
import path from 'node:path';

if (!process.argv.includes('--execute-local-deployment')) throw Error('Pass --execute-local-deployment.');
const out = path.resolve('presentations/kubernetes-desktop-deployment/evidence');
await mkdir(out, { recursive: true });
const resume=process.argv.includes('--resume');
const evidence = resume ? JSON.parse(await readFile(path.join(out,'deployment-evidence.json'),'utf8')) : { capturedAt: new Date().toISOString(), context: 'docker-desktop', namespace: 'learning-platform', origin: 'http://127.0.0.1:8090', commands: [], providerCalls: 0, complete: false };
if(resume){
 await writeFile(path.join(out,'initial-deployment-attempt.json'),JSON.stringify(evidence,null,2));
 evidence.commands=evidence.commands.filter(row=>row.status==='passed'&&row.id!=='07-kind-nodes');
 try{const imported=JSON.parse(await readFile(path.join(out,'image-import-evidence.json'),'utf8'));if(imported.status==='passed'&&!evidence.commands.some(row=>row.id===imported.id))evidence.commands.push(imported);}catch(error){if(error.code!=='ENOENT')throw error;}
 evidence.complete=false;
}
const save = () => writeFile(path.join(out, 'deployment-evidence.json'), JSON.stringify(evidence, null, 2));
const env = { ...process.env };
for (const key of Object.keys(env)) if (/ANTHROPIC|INWORLD|^CLAUDE_|^MANAGED_|^MILESTONE_|^AI_TUTOR_/.test(key)) delete env[key];
async function command(id, tool, args) {
  if(resume){const previous=evidence.commands.find(row=>row.id===id&&row.status==='passed');if(previous){console.log(`Retained verified ${id}`);return previous.output;}}
  const row = { id, command: [tool, ...args].join(' '), startedAt: new Date().toISOString(), status: 'running' };
  evidence.commands.push(row); await save(); console.log(`Running ${id}`);
  let output = '';
  const child = spawn(tool, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { output += b.toString(); });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  Object.assign(row, { output: output.replace(/\x1b\[[0-9;]*m/g, ''), exitCode: code, status: code === 0 ? 'passed' : 'failed', finishedAt: new Date().toISOString() });
  await writeFile(path.join(out, id + '.txt'), `$ ${row.command}\n\n${row.output}\n[exit ${code}]\n`); await save();
  console.log(`${id}: exit ${code}\n${row.output.split(/\r?\n/).slice(-5).join('\n')}`);
  if (code !== 0) throw Error(`${id} failed; inspect recorded output.`);
  return row.output;
}
const k = ['--context', 'docker-desktop'];
const kn = [...k, '-n', 'learning-platform'];
const d = ['--context', 'desktop-linux'];
await command('01-engine', 'docker', [...d, 'version', '--format', 'Client: {{.Client.Version}} | Engine: {{.Server.Version}}']);
await command('02-cluster-status', 'docker', ['desktop', 'kubernetes', 'status']);
const nodes = JSON.parse(await command('03-nodes', 'kubectl', [...k, 'get', 'nodes', '-o', 'json']));
if (nodes.items.length !== 1 || !nodes.items.every(node => node.status.conditions.some(c => c.type === 'Ready' && c.status === 'True'))) throw Error('This tutorial requires one Ready Docker Desktop node.');
await command('04-storage', 'kubectl', [...k, 'get', 'storageclass']);
await command('05-build', 'docker', [...d, 'build', '--builder', 'desktop-linux', '--progress=plain', '-t', 'claude-learning-platform:kubernetes', '.']);
await command('06-image', 'docker', [...d, 'image', 'ls', 'claude-learning-platform:kubernetes']);
const desktopContainers = [];
for(const node of nodes.items){
  if(node.metadata.name!=='desktop-control-plane')continue;
  const cluster=(await command('07-kind-nodes','docker',[...d,'inspect',node.metadata.name,'--format','{{index .Config.Labels "io.x-k8s.kind.cluster"}}'])).trim();
  if(cluster!=='desktop')throw Error('Refuse a node outside the Docker Desktop kind cluster.');
  desktopContainers.push(node.metadata.name);
}
for (const node of nodes.items) {
  if (!desktopContainers.includes(node.metadata.name)) continue; // kubeadm shares Desktop's local store.
  if(resume&&evidence.commands.some(row=>row.id==='08-import-image'&&row.status==='passed'))continue;
  const row = { id: '08-import-image', command: `docker image save claude-learning-platform:kubernetes | docker exec -i ${node.metadata.name} ctr --namespace k8s.io images import -`, startedAt: new Date().toISOString(), status: 'running' };
  evidence.commands.push(row); await save();
  const source = spawn('docker', [...d, 'image', 'save', 'claude-learning-platform:kubernetes'], { env, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  const target = spawn('docker', [...d, 'exec', '-i', node.metadata.name, 'ctr', '--namespace', 'k8s.io', 'images', 'import', '-'], { env, windowsHide: true, stdio: ['pipe','pipe','pipe'] });
  let output = ''; for (const stream of [source.stderr, target.stdout, target.stderr]) stream.on('data', bytes => output += bytes.toString());
  source.stdout.pipe(target.stdin); target.stdin.on('error', () => {});
  const codes = await Promise.all([source,target].map(child => new Promise((resolve,reject) => { child.once('error',reject);child.once('close',resolve); })));
  Object.assign(row,{output,exitCode:codes.every(code=>code===0)?0:1,status:codes.every(code=>code===0)?'passed':'failed',finishedAt:new Date().toISOString()});
  await writeFile(path.join(out,row.id+'.txt'),`$ ${row.command}\n\n${output}\n[exit ${row.exitCode}]\n`);await save();
  if(row.status!=='passed') throw Error('Local kind image import failed.');
}
// Apply only this namespace; do not reset or change cluster-wide settings.
const manifest = await readFile('k8s/platform.yaml','utf8');
const namespaceFile = path.join(out,'namespace.yaml');
await writeFile(namespaceFile,manifest.split(/^---\s*$/m)[0]);
await command('09-namespace', 'kubectl', [...k, 'apply', '-f', namespaceFile]);
await command('10-dry-run', 'kubectl', [...k, 'apply', '--dry-run=server', '-f', 'k8s/platform.yaml']);
await command('11-apply', 'kubectl', [...k, 'apply', '-f', 'k8s/platform.yaml']);
await command('12-rollout', 'kubectl', [...kn, 'rollout', 'status', 'deployment/platform', '--timeout=300s']);
await command('13-resources', 'kubectl', [...kn, 'get', 'deployment,pods,service,pvc']);
await command('14-logs', 'kubectl', [...kn, 'logs', 'deployment/platform', '--tail=20']);
const audit = "const fs=require('node:fs');const assert=require('node:assert/strict');assert.equal(process.getuid(),1000);for(const p of ['/app/.env','/app/.git','/app/videos','/app/presentations'])assert.equal(fs.existsSync(p),false,p);assert.equal(!!process.env.ANTHROPIC_API_KEY?.trim(),false);for(const k of ['AI_TUTOR_LIVE_ENABLED','MANAGED_LIVE_ENABLED','MILESTONE_LIVE_ENABLED'])assert.equal(process.env[k],'false');fs.accessSync('/app/artifacts',fs.constants.W_OK);console.log(JSON.stringify({uid:1000,privateFilesAbsent:true,paidExecutionEnabled:false,artifactsWritable:true}));";
await command('15-runtime-audit','kubectl',[...kn,'exec','deployment/platform','--','node','-e',audit]);
const proof = 'kubernetes-pvc-proof-' + Date.now();
await command('16-volume-write','kubectl',[...kn,'exec','deployment/platform','--','node','-e',`require('node:fs').writeFileSync('/app/artifacts/kubernetes-deployment-proof.txt',${JSON.stringify(proof)});console.log('Wrote a teaching proof to the persistent volume.');`]);
const oldPods = JSON.parse(await command('17-original-pod','kubectl',[...kn,'get','pods','-l','app=learning-platform','-o','json']));
if(oldPods.items.length!==1)throw Error('Refuse to replace more than the dedicated single application pod.');
await command('18-replace-pod','kubectl',[...kn,'delete','pod',oldPods.items[0].metadata.name,'--wait=true','--timeout=90s']);
await command('19-replacement-ready','kubectl',[...kn,'wait','--for=condition=Ready','pod','-l','app=learning-platform','--timeout=300s']);
await command('20-volume-read','kubectl',[...kn,'exec','deployment/platform','--','node','-e',`require('node:assert/strict').equal(require('node:fs').readFileSync('/app/artifacts/kubernetes-deployment-proof.txt','utf8'),${JSON.stringify(proof)});console.log('PASS: persistent-volume proof survived pod replacement.');`]);
await command('21-final-resources','kubectl',[...kn,'get','deployment,pods,service,pvc']);
await command('22-readable-node','kubectl',[...k,'get','nodes']);
await command('23-probes','kubectl',[...kn,'get','deployment','platform','-o','jsonpath={.spec.template.spec.containers[0].startupProbe.httpGet.path} {.spec.template.spec.containers[0].readinessProbe.httpGet.path} {.spec.template.spec.containers[0].livenessProbe.httpGet.path}']);
const portArgs=[...kn,'port-forward','--address','127.0.0.1','service/platform','8090:8080'];
const portLog=await open(path.join(out,'port-forward.txt'),'w');
const forwarding=spawn('kubectl',portArgs,{env,windowsHide:true,detached:true,stdio:['ignore',portLog.fd,portLog.fd]});
forwarding.unref();await portLog.close();
evidence.portForward={pid:forwarding.pid,command:'kubectl '+portArgs.join(' ')};await save();
let ready=false;
for(let i=0;i<60;i++){
 try{const response=await fetch(evidence.origin+'/api/health',{signal:AbortSignal.timeout(3000)});if(response.ok){evidence.health=await response.json();ready=true;break;}}catch{}
 await new Promise(resolve=>setTimeout(resolve,1000));
}
if(!ready)throw Error('Loopback port-forward did not become healthy. Inspect port-forward.txt.');
evidence.tutor=await(await fetch(evidence.origin+'/api/ai-tutor/status')).json();
if(evidence.tutor.liveAvailable)throw Error('The recording must remain offline.');
evidence.starterDownloads=[];
for(const id of ['study-coach','agent-evaluation-studio','agent-publishing-studio']){
 const response=await fetch(evidence.origin+'/api/projects/'+id+'/starter.zip');const bytes=new Uint8Array(await response.arrayBuffer());
 if(!response.ok||bytes[0]!==0x50||bytes[1]!==0x4b)throw Error('Starter ZIP failed: '+id);
 evidence.starterDownloads.push({id,status:response.status,bytes:bytes.length});
}
evidence.persistence={proofRetained:true,originalPod:oldPods.items[0].metadata.name};
evidence.complete=true;await save();console.log('Kubernetes deployment, replacement persistence, loopback access and offline runtime verified.');
