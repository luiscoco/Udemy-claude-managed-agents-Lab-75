import express from 'express';
import {managedReadiness} from './managed-runtime.mjs';
import {localRequests} from './local-requests.mjs';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {models,preparedAnswer,runAgent,validModel} from './agent.mjs';
import {draftDocument,draftInfographic,preserveSourceCode} from './src/document-spec.mjs';
import {createArtifact} from './artifacts.mjs';
import {pythonExecutable,pythonFailure} from './python-runtime.mjs';

const app=express();app.use(localRequests);app.disable('x-powered-by');
app.use((req,res,next)=>{const controller=new AbortController();req.managedSignal=controller.signal;res.once('close',()=>{if(!res.writableEnded)controller.abort();});next();});
app.use(express.json({limit:'8mb'}));
const mode=process.env.PROJECT_MODE==='reference'?'reference':'learner';
const uploads=new Map(),answers=new Map(),artifacts=new Map();
const PNG='image/png';
const accepted=new Set(['text/plain','text/markdown','text/csv','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',PNG]);
const budget=z.union([z.literal(0.2),z.literal(0.5),z.literal(1),z.literal(2)]).default(0.2);
const answerInput=z.object({prompt:z.string().trim().min(3).max(2000),model:z.string(),runMode:z.enum(['prepared','live']),sourceMode:z.enum(['none','docs']).default('none'),uploadIds:z.array(z.string()).max(3).default([]),consent:z.boolean().default(false),mcpConsent:z.boolean().default(false),maxBudgetUsd:budget});
const artifactInput=z.object({answerId:z.string().uuid(),kind:z.enum(['document','infographic']),request:z.string().trim().min(3).max(500),runMode:z.enum(['prepared','live']),consent:z.boolean().default(false),styleUploadId:z.string().uuid().nullable().optional(),focusX:z.number().min(0).max(100).default(78),focusY:z.number().min(0).max(100).default(35),maxBudgetUsd:budget});
const summary=row=>({id:row.id,prompt:row.prompt,answer:row.answer,model:row.model,runMode:row.runMode,sourceMode:row.sourceMode,sourceFiles:row.sourceFiles,createdAt:row.createdAt,subtype:row.subtype,costUsd:row.costUsd,modelCalls:row.modelCalls,mcpToolCalls:row.mcpToolCalls,sessionId:row.sessionId,cleanup:row.cleanup,usage:row.usage});
const publicUpload=row=>({id:row.id,name:row.name,mime:row.mime,characters:row.text.length,preview:row.text.slice(0,220),width:row.width??null,height:row.height??null,style:row.style??null});
const fail=(res,error,status=400)=>res.status(status).json({message:error instanceof Error?error.message:String(error),...(error?.receipt?{receipt:error.receipt}:{})});
const trimMap=(map,max)=>{while(map.size>max)map.delete(map.keys().next().value);};
const pythonScript=(name,bytes)=>spawnSync(pythonExecutable(),[fileURLToPath(new URL(name,import.meta.url))],{input:bytes,encoding:'utf8',timeout:10000,maxBuffer:200000,windowsHide:true});

app.get('/api/health',(_req,res)=>res.json({project:'agent-publishing-studio',mode,liveAvailable:managedReadiness().liveAvailable,models}));
app.get('/api/uploads',(_req,res)=>res.json({uploads:[...uploads.values()].reverse().map(publicUpload)}));
app.get('/api/answers',(_req,res)=>res.json({answers:[...answers.values()].reverse().map(summary)}));
app.get('/api/artifacts',(_req,res)=>res.json({artifacts:[...artifacts.values()].reverse().map(({data,...row})=>row)}));
app.get('/api/uploads/:id/preview',(req,res)=>{const row=uploads.get(req.params.id);if(!row||row.mime!==PNG)return fail(res,'PNG preview unavailable.',404);res.setHeader('content-type',PNG);res.setHeader('cache-control','private, max-age=60');res.send(row.bytes);});

app.post('/api/uploads',(req,res)=>{
 try{
  const {name,mime,base64}=req.body??{};
  if(typeof name!=='string'||!name.trim()||name.length>120||/[\\/\x00-\x1f]/.test(name)||!accepted.has(mime)||typeof base64!=='string'||base64.length>6_800_000||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))return fail(res,'Choose a supported file under 5 MB.');
  const bytes=Buffer.from(base64,'base64');if(bytes.length>5_000_000||!bytes.length)return fail(res,'File must be under 5 MB.');
  let row={id:randomUUID(),name,mime};
  if(mime===PNG){
   const child=pythonScript('./inspect_png.py',bytes);
   if(child.status!==0)return fail(res,pythonFailure(child,'PNG upload'));
   const {width,height,style}=JSON.parse(child.stdout);
   row={...row,width,height,style,bytes,text:`PNG ${name}: ${width} × ${height} pixels. Proposed infographic palette: background ${style.background}, text ${style.ink}, accent ${style.accent}, secondary ${style.secondary}. The image content has not been visually analyzed.`};
  }else{
   const child=spawnSync(pythonExecutable(),[fileURLToPath(new URL('./extract.py',import.meta.url)),mime],{input:bytes,encoding:'utf8',timeout:10000,maxBuffer:100000});
   if(child.status!==0)return fail(res,pythonFailure(child,'File upload'));
   const extracted=child.stdout.trim();if(!extracted)return fail(res,'No readable text was extracted from this file.');
   row={...row,text:extracted};
  }
  uploads.set(row.id,row);trimMap(uploads,24);res.status(201).json(publicUpload(row));
 }catch(e){fail(res,e);}
});

app.post('/api/answers',async(req,res)=>{
 try{
  const input=answerInput.parse(req.body);
  if(!validModel(input.model))return fail(res,'Choose a listed model.');
  if(input.runMode==='live'&&!input.consent)return fail(res,'Authorize this paid call first.');
  if(input.runMode==='live'&&!managedReadiness().liveAvailable)return fail(res,'Configure Managed Agents credentials, agent/environment IDs and MANAGED_LIVE_ENABLED=true.',503);
  if(input.sourceMode==='docs'&&input.runMode==='live'&&!input.mcpConsent)return fail(res,'Authorize external documentation MCP access first.');
  const sources=input.uploadIds.map(id=>{const file=uploads.get(id);if(!file)throw Error('An uploaded file is no longer available.');return file;});
  const result=input.runMode==='live'?await runAgent({prompt:input.prompt,model:input.model,uploads:sources,sourceMode:input.sourceMode,maxBudgetUsd:input.maxBudgetUsd,signal:req.managedSignal}):{answer:preparedAnswer(input.prompt,sources),subtype:'prepared_success',costUsd:0,modelCalls:0,mcpToolCalls:0};
  const row={id:randomUUID(),prompt:input.prompt,answer:result.answer,model:input.model,runMode:input.runMode,sourceMode:input.runMode==='live'?input.sourceMode:'none',sourceFiles:sources.map(x=>x.name),createdAt:new Date().toISOString(),subtype:result.subtype,costUsd:result.costUsd,modelCalls:result.modelCalls,mcpToolCalls:result.mcpToolCalls,sessionId:result.sessionId,cleanup:result.cleanup,usage:result.usage};
  answers.set(row.id,row);trimMap(answers,40);res.status(201).json(summary(row));
 }catch(e){fail(res,e,e instanceof z.ZodError?400:502);}
});

app.post('/api/artifacts',async(req,res)=>{
 try{
  const input=artifactInput.parse(req.body),source=answers.get(input.answerId);
  if(!source)return fail(res,'Select an available response before creating a file.',404);
  if(input.runMode==='live'&&!input.consent)return fail(res,'Authorize this paid artifact-planning call first.');
  if(input.runMode==='live'&&!managedReadiness().liveAvailable)return fail(res,'Configure Managed Agents credentials, agent/environment IDs and MANAGED_LIVE_ENABLED=true.',503);
  const styleReference=input.styleUploadId?uploads.get(input.styleUploadId):null;
  if(input.styleUploadId&&(!styleReference||styleReference.mime!==PNG||input.kind!=='infographic'))return fail(res,'Choose an uploaded PNG for infographic styling.');
  const plan=input.runMode==='live'?await runAgent({prompt:input.request,model:source.model,purpose:styleReference?'visual_spec':'spec',answer:source.answer,kind:input.kind,image:styleReference?{mime:PNG,bytes:styleReference.bytes}:null,maxBudgetUsd:input.maxBudgetUsd,signal:req.managedSignal}):{spec:input.kind==='document'?draftDocument(source.answer,input.request):draftInfographic(source.answer,source.prompt),visual:null,subtype:'prepared_success',costUsd:0,modelCalls:0,mcpToolCalls:0};
  const renderStyle=styleReference?{...styleReference.style,artworkPng:styleReference.bytes.toString('base64'),artworkWidth:styleReference.width,artworkHeight:styleReference.height,focusX:input.focusX,focusY:input.focusY,visual:plan.visual}:null;
  if(input.runMode==='live')plan.spec=preserveSourceCode(plan.spec,source.answer,input.kind);
  const formats=input.kind==='document'?['docx','pdf']:['svg','png'];
  const created=[];let previewImage=null;
  for(const format of formats){
   const built=await createArtifact(input.kind,format,plan.spec,input.kind==='infographic'?renderStyle:null);
   if(input.kind==='infographic'&&format==='png')previewImage=`data:image/png;base64,${built.data.toString('base64')}`;
   const row={id:randomUUID(),answerId:source.id,answerHash:createHash('sha256').update(source.answer).digest('hex'),kind:input.kind,format,request:input.request,title:plan.spec.title,runMode:input.runMode,model:input.runMode==='live'?source.model:null,sourceMode:source.runMode,sourceFiles:source.sourceFiles,styleName:styleReference?.name??null,styleHash:styleReference?createHash('sha256').update(styleReference.bytes).digest('hex'):null,style:styleReference?.style??null,visual:plan.visual??null,createdAt:new Date().toISOString(),subtype:plan.subtype,costUsd:plan.costUsd,mime:built.mime,sha256:built.sha256,bytes:built.data.length,data:built.data};
   created.push(row);
  }
  for(const row of created)artifacts.set(row.id,row);trimMap(artifacts,40);
  res.status(201).json({spec:plan.spec,style:styleReference?.style??null,visual:plan.visual??null,previewImage,artifacts:created.map(({data,...row})=>row)});
 }catch(e){fail(res,e,e instanceof z.ZodError?400:502);}
});

app.get('/api/artifacts/:id/download',(req,res)=>{const row=artifacts.get(req.params.id);if(!row)return fail(res,'Artifact unavailable; create it again.',404);res.setHeader('content-type',row.mime);res.setHeader('content-disposition',`attachment; filename="publishing-${row.id}.${row.format}"`);res.setHeader('content-length',row.data.length);res.send(row.data);});
app.use((error,_req,res,next)=>{if(error?.type==='entity.too.large')return res.status(413).json({message:'Request exceeds the upload limit.'});if(error instanceof SyntaxError&&'body' in error)return res.status(400).json({message:'Request body must be valid JSON.'});next(error);});
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){const port=Number(process.env.PORT??5293);app.listen(port,'127.0.0.1',()=>console.log(`Agent Publishing Studio API http://127.0.0.1:${port}`));}
export {app};
