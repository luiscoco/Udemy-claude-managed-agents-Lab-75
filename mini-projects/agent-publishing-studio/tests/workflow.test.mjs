import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {app} from '../server.mjs';
import {documentSpec,infographicSpec,draftDocument,draftInfographic,preserveSourceCode} from '../src/document-spec.mjs';
import {htmlDocument,htmlDocumentWithCode,svgInfographic,svgInfographicWithCode,createArtifact} from '../artifacts.mjs';
import {documentParts} from '../lib/build-docx.mjs';
import {runAgent} from '../agent.mjs';
import {samplePng} from './image-fixtures.mjs';
import {pythonFailure} from '../python-runtime.mjs';

test('missing image library reports the active Python setup command without a traceback',()=>{
 const message=pythonFailure({status:1,stderr:Buffer.from("Traceback (most recent call last):\nModuleNotFoundError: No module named 'PIL'\n")},'PNG upload');
 assert.match(message,/PNG upload needs Pillow/);
 assert.match(message,/pip install -r requirements\.txt/);
 assert.doesNotMatch(message,/Traceback|ModuleNotFoundError/);
});

test('prepared publishing creates downloads tied to the chosen answer',async()=>{
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});return{status:r.status,data:await r.json()};};
 try{
  const health=await(await fetch(base+'/api/health')).json();assert.equal(health.project,'agent-publishing-studio');assert.equal(health.models.length,3);
  const upload=await post('/api/uploads',{name:'notes.txt',mime:'text/plain',base64:Buffer.from('Evidence from a student source.').toString('base64')});assert.equal(upload.status,201);assert.equal(upload.data.characters,31);
  const blocked=await post('/api/answers',{prompt:'Explain agent tools',model:health.models[1].id,runMode:'live',consent:false});assert.equal(blocked.status,400);
  const first=await post('/api/answers',{prompt:'Explain agent tools',model:health.models[1].id,runMode:'prepared',uploadIds:[upload.data.id]});assert.equal(first.status,201);assert.equal(first.data.modelCalls,0);assert.match(first.data.answer,/does not analyze/);assert.deepEqual(first.data.sourceFiles,['notes.txt']);
  const second=await post('/api/answers',{prompt:'Explain result messages',model:health.models[0].id,runMode:'prepared'});assert.equal(second.status,201);assert.notEqual(first.data.id,second.data.id);
  const denied=await post('/api/artifacts',{answerId:first.data.id,kind:'document',request:'Make a report',runMode:'live',consent:false});assert.equal(denied.status,400);
  const document=await post('/api/artifacts',{answerId:first.data.id,kind:'document',request:'Make a readable report',runMode:'prepared'});assert.equal(document.status,201);assert.deepEqual(document.data.artifacts.map(x=>x.format),['docx','pdf']);assert.ok(document.data.artifacts.every(x=>x.answerId===first.data.id));
  const graphic=await post('/api/artifacts',{answerId:second.data.id,kind:'infographic',request:'Make a learning map',runMode:'prepared'});assert.equal(graphic.status,201);assert.deepEqual(graphic.data.artifacts.map(x=>x.format),['svg','png']);assert.ok(graphic.data.artifacts.every(x=>x.answerId===second.data.id));
  const invalidBudget=await post('/api/answers',{prompt:'Explain agent tools',model:health.models[1].id,runMode:'prepared',maxBudgetUsd:9});assert.equal(invalidBudget.status,400);
  for(const row of [...document.data.artifacts,...graphic.data.artifacts]){const r=await fetch(`${base}/api/artifacts/${row.id}/download`);assert.equal(r.status,200);assert.match(r.headers.get('content-disposition')??'',/attachment/);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.length,row.bytes);assert.equal(bytes.subarray(0,4).toString('hex'),{docx:'504b0304',pdf:'25504446',svg:'3c737667',png:'89504e47'}[row.format]);}
  const docxBytes=Buffer.from(await(await fetch(`${base}/api/artifacts/${document.data.artifacts[0].id}/download`)).arrayBuffer());
  const reuploaded=await post('/api/uploads',{name:'report.docx',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',base64:docxBytes.toString('base64')});assert.equal(reuploaded.status,201);assert.match(reuploaded.data.preview,/Make a readable report/);
  const unknown=await post('/api/artifacts',{answerId:'00000000-0000-4000-8000-000000000000',kind:'document',request:'Make a report',runMode:'prepared'});assert.equal(unknown.status,404);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('artifact plans reject unsafe markup and malformed tables',()=>{
 assert.throws(()=>documentSpec.parse({kind:'general',title:'Report',author:'Student',date:'2026-10-24',blocks:[{type:'table',columns:['A','B'],rows:[['only one']]}]}));
 const doc={kind:'general',title:'<script>alert(1)</script>',author:'Student',date:'2026-10-24',blocks:[{type:'paragraph',text:'<img src=x onerror=alert(1)>'}]};
 const html=htmlDocument(doc);assert.doesNotMatch(html,/<script>|<img src=x/);assert.match(html,/&lt;script&gt;/);
 const svg=svgInfographic(infographicSpec.parse({title:'<script>',subtitle:'',takeaway:'Safe text',items:[{label:'One',detail:'First idea'},{label:'Two',detail:'Second idea'},{label:'Three',detail:'Third idea'}]}));assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;/);
});

test('PNG style reference creates infographics while PowerPoint routes are unavailable',async()=>{
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data)=>{const response=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});return{status:response.status,data:await response.json()};};
 try{
  const png=samplePng();
  const upload=await post('/api/uploads',{name:'style.png',mime:'image/png',base64:png.toString('base64')});assert.equal(upload.status,201);assert.ok(upload.data.width>100);assert.match(upload.data.style.accent,/^#[A-F0-9]{6}$/);
  const image=await fetch(`${base}/api/uploads/${upload.data.id}/preview`);assert.equal(image.headers.get('content-type'),'image/png');
  const spoof=await post('/api/uploads',{name:'fake.png',mime:'image/png',base64:Buffer.from('not a PNG').toString('base64')});assert.equal(spoof.status,400);
  const answer=await post('/api/answers',{prompt:'Explain SDK tools',model:'claude-sonnet-5-5',runMode:'prepared',uploadIds:[upload.data.id]});assert.equal(answer.status,201);
  const styled=await post('/api/artifacts',{answerId:answer.data.id,kind:'infographic',request:'Make a styled learning map',runMode:'prepared',styleUploadId:upload.data.id,focusX:82,focusY:22});assert.equal(styled.status,201,JSON.stringify(styled.data));assert.match(styled.data.previewImage,/^data:image\/png;base64,/);assert.equal(styled.data.artifacts[0].styleName,'style.png');const styledPng=Buffer.from(await(await fetch(`${base}/api/artifacts/${styled.data.artifacts[1].id}/download`)).arrayBuffer());assert.equal(styledPng.readUInt32BE(16),1100);assert.equal(styledPng.readUInt32BE(20),1140);
  const svg=await(await fetch(`${base}/api/artifacts/${styled.data.artifacts[0].id}/download`)).text();assert.ok(svg.includes(upload.data.style.background));assert.match(svg,/Follow the flow/);assert.match(svg,/<svg x="812" y="30" width="229" height="204" viewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/);assert.ok(svg.includes(png.toString('base64').slice(0,80)),'The single uploaded PNG supplies artwork in the generated SVG.');
  const differentFocus=await post('/api/artifacts',{answerId:answer.data.id,kind:'infographic',request:'Make a styled learning map',runMode:'prepared',styleUploadId:upload.data.id,focusX:15,focusY:75});assert.equal(differentFocus.status,201);assert.notEqual(differentFocus.data.artifacts[0].sha256,styled.data.artifacts[0].sha256,'Moving the focus changes the exported image.');
  const otherPng=samplePng(true);
  const otherUpload=await post('/api/uploads',{name:'another-style.png',mime:'image/png',base64:otherPng.toString('base64')});assert.equal(otherUpload.status,201);assert.equal(otherUpload.data.style.mood,'dark');
  const otherStyled=await post('/api/artifacts',{answerId:answer.data.id,kind:'infographic',request:'Make another learning map',runMode:'prepared',styleUploadId:otherUpload.data.id});assert.equal(otherStyled.status,201,JSON.stringify(otherStyled.data));
  const otherSvg=await(await fetch(`${base}/api/artifacts/${otherStyled.data.artifacts[0].id}/download`)).text();assert.ok(otherSvg.includes(otherPng.toString('base64').slice(0,80)));assert.notEqual(otherStyled.data.artifacts[0].sha256,styled.data.artifacts[0].sha256);
  const deck=await post('/api/artifacts',{answerId:answer.data.id,kind:'presentation',request:'Make a teaching deck',runMode:'prepared',styleUploadId:upload.data.id});assert.equal(deck.status,400);
  const pptx=await post('/api/uploads',{name:'deck.pptx',mime:'application/vnd.openxmlformats-officedocument.presentationml.presentation',base64:png.toString('base64')});assert.equal(pptx.status,400);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('fenced code keeps indentation and syntax colors across previews and exports',async()=>{
 const answer='## Tiny example\n\nThe SDK can call a tool.\n\n```python\nfrom claude_agent_sdk import query\n\nfor item in items:\n    print("safe <text>", item)\n```\n\nCheck the result.';
 const doc=draftDocument(answer,'Code handout','2026-10-24');
 const code=doc.blocks.find(block=>block.type==='code');
 assert.equal(code.language,'python');assert.match(code.code,/\n    print\("safe <text>", item\)/);
 const html=htmlDocumentWithCode(doc);assert.match(html,/hljs-keyword/);assert.match(html,/code-panel/);assert.doesNotMatch(html,/<text>/);
 const wordXml=documentParts(doc,{font:'Calibri',bodySize:22,headingSize:28,titleSize:40,headingColor:'12284A',tableHeader:'173B50',tableStripe:'F2F5F7',border:'D9E1EC'})['word/document.xml'];
 assert.match(wordXml,/w:pStyle w:val="Code"/);assert.match(wordXml,/w:color w:val="D2ADFF"/);assert.match(wordXml,/>    <\/w:t>/);assert.match(wordXml,/>print<\/w:t>/);assert.doesNotMatch(wordXml,/<text>/);
 const imagePlan=draftInfographic(answer,'Tools');assert.equal(imagePlan.codeExample.language,'python');
 const livePlan=preserveSourceCode({kind:'general',title:'Guide',author:'Student',date:'2026-10-24',blocks:[{type:'paragraph',text:'A short summary.'}]},answer,'document');
 assert.equal(livePlan.blocks.at(-1).code,code.code);
 assert.equal(preserveSourceCode({...imagePlan,codeExample:undefined},answer,'infographic').codeExample.code,imagePlan.codeExample.code);
 const svg=svgInfographicWithCode(imagePlan);assert.match(svg,/CODE EXCERPT/);assert.match(svg,/#D2ADFF/);assert.match(svg,/safe &lt;text&gt;/);
 const bounded=svgInfographicWithCode({...imagePlan,codeExample:{language:'python',code:'print("'+ 'very_long_argument_'.repeat(8)+'")'}},{background:'#F8FBFF',ink:'#10234A',accent:'#FC8454',secondary:'#2476D6',artworkPng:'',artworkWidth:1,artworkHeight:1});assert.doesNotMatch(bounded,/very_long_argument_very_long_argument_very_long_argument_very_long_argument_/);
  const colorSource=svgInfographicWithCode({...imagePlan,codeExample:{language:'typescript',code:'const color = "#f8fbff";'}},{background:'#EAF4FF',ink:'#10234A',accent:'#246CCC',secondary:'#3C5484',mood:'light'});assert.match(colorSource,/const/);assert.match(colorSource,/#f8fbff/);assert.match(colorSource,/#EAF4FF/);
 const pdf=await createArtifact('document','pdf',doc);assert.equal(pdf.data.subarray(0,4).toString(),'%PDF');
 const png=await createArtifact('infographic','png',imagePlan);assert.equal(png.data.subarray(1,4).toString(),'PNG');
});

test('Managed content plans are validated locally and failed sessions are not saved',async()=>{
 let seen;
 const run=async input=>{seen=input;return{answer:'Grounded answer.',isError:false,subtype:'end_turn',sessionId:'sesn_fixture',cleanup:'archived',mcpToolCalls:1};};
 const answer=await runAgent({prompt:'Explain Managed events',model:'claude-sonnet-5-5',sourceMode:'docs'},run);
 assert.equal(answer.answer,'Grounded answer.');assert.equal(seen.mcpServers[0].type,'url');assert.equal(seen.tools[0].type,'mcp_toolset');
 const spec={kind:'general',title:'Clear report',author:'Student',date:'2026-10-24',blocks:[{type:'paragraph',text:'One supported point.'}]};
 const plan=await runAgent({prompt:'Make a report',model:'claude-haiku-5-5',purpose:'spec',kind:'document',answer:'One supported point.'},
  async input=>{seen=input;return{answer:JSON.stringify(spec),isError:false,subtype:'end_turn'};});
 assert.equal(plan.spec.title,'Clear report');assert.ok(JSON.parse(seen.prompt).schema);assert.equal('outputFormat' in seen,false);
 await assert.rejects(runAgent({prompt:'Explain Managed events',model:'claude-sonnet-5-5'},async()=>({answer:'Partial',isError:true,subtype:'budget_reached'})),/budget_reached/);
 await assert.rejects(runAgent({prompt:'Make a report',model:'claude-haiku-5-5',purpose:'spec'},async()=>({answer:'not JSON',isError:false})),/valid JSON/);
});
