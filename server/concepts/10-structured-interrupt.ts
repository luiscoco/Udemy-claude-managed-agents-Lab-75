import { Router, json } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { apiError, apiErrorHandler } from '../lib/errors.js';
import { managedSettings, managedErrorMessage } from '../lib/managed-config.js';
import { LabError } from '../lib/lab01-run.js';
import { openSse } from '../sse.js';
import { Lab10Error, Lab10Runs } from '../lib/lab10-run.js';
import { createFixtureLab10Port, createLiveLab10Port } from '../lib/lab10-port.js';
import type { Lab10Port } from '../lib/lab10-port.js';
import { lab10ControlSchema, lab10JsonSchema, lab10RequestSchema, lab10SendSchema } from '../../shared/lab10-structured-interrupt.js';
import type { Lab10ParsedRequest } from '../../shared/lab10-structured-interrupt.js';

export function createLab10Router(options:{runs?:Lab10Runs;live?:(input:Lab10ParsedRequest)=>Lab10Port;fixture?:(input:Lab10ParsedRequest)=>Lab10Port}={}){
  const router=Router(); const runs=options.runs ?? new Lab10Runs(Math.min(2,managedSettings().maxConcurrent));
  const live=options.live ?? createLiveLab10Port; const fixture=options.fixture ?? createFixtureLab10Port;
  const sweep=setInterval(()=>void runs.sweep(),60_000);sweep.unref(); let closing=false;
  router.use((request,response,next)=>{response.set('Cache-Control','no-store');const host=request.headers.host ?? '';const origin=request.headers.origin;
    if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (origin && origin !== `http://${host}`)){response.status(403).json(apiError('INVALID_REQUEST','Use the local application origin.'));return;}next();});
  const owner=(request:import('express').Request)=>{const value=request.headers['x-lab-owner'];if(typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new Lab10Error(400,'Send a valid X-Lab-Owner exercise identifier.');return value;};
  const fail=(response:import('express').Response,error:unknown)=>{const status=error instanceof Lab10Error ? error.status : 500;
    response.status(status).json(apiError(status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : status === 429 ? 'CAPACITY' : status === 422 ? 'UNSUPPORTED_MODE' : status === 500 ? 'INTERNAL' : 'INVALID_REQUEST',error instanceof Lab10Error ? error.message : 'The request could not be completed.'));};
  router.get('/schemas',(_request,response)=>response.json({report:lab10JsonSchema,validation:'application schema validation',correctiveRounds:1,maxQueueDepth:2,nativeStructuredOutput:false}));
  router.get('/run',(request,response)=>{try{const parsed=lab10ControlSchema.parse(request.query);response.json(runs.snapshot(runs.read(parsed.runId,owner(request))));}catch(error){fail(response,error instanceof Lab10Error ? error : new Lab10Error(400,'Send a valid runId and owner.'));}});
  for(const action of ['interrupt','abort','end'] as const) router.post(`/${action}`,json({limit:'2kb',strict:true}),async(request,response)=>{try{
    const parsed=lab10ControlSchema.safeParse(request.body);if(!parsed.success) throw new Lab10Error(400,'Send only the local runId.');const e=runs.read(parsed.data.runId,owner(request));
    response.json(action === 'end' ? await runs.end(e) : await runs.stop(e,action === 'abort'));
  }catch(error){fail(response,error);}});
  for(const action of ['run','structured','send'] as const) router.post(`/${action}`,json({limit:'8kb',strict:true}),async(request,response)=>{
    let e:Awaited<ReturnType<Lab10Runs['create']>>|undefined; let stream:ReturnType<typeof openSse>|undefined;
    const controller=new AbortController();
    try{const exerciseOwner=owner(request);const parsed=(action === 'send' ? lab10SendSchema : lab10RequestSchema).safeParse(request.body);
      if(!parsed.success) throw new Lab10Error(400,'Check prompt, scenario, limits and run ID. outputFormat and structured_output are unsupported; the host validates final JSON.');
      const input=lab10RequestSchema.parse(action === 'send' ? (({runId:_runId,...rest})=>rest)(parsed.data as import('zod').infer<typeof lab10SendSchema>) : parsed.data);
      if(closing) throw new Lab10Error(429,'Server is closing.');if(input.deadlineSeconds*1000 > managedSettings().deadlineMs) throw new Lab10Error(400,'Deadline exceeds server policy.');
      if(action === 'send') e=runs.read(lab10SendSchema.parse(request.body).runId,exerciseOwner);
      else {let port:Lab10Port;try{port=input.mode === 'live' ? live(input) : fixture(input);}catch{throw new Lab10Error(422,'Configure Managed live mode first.');}
        // Reserve/create before streaming. A dropped socket while creation finishes is cleaned up below.
        const disconnected=()=>controller.abort('disconnect');response.on('close',disconnected);
        try{e=await runs.create(exerciseOwner,input,port);}
        catch(error){
          if(input.mode === 'live' && !(error instanceof Lab10Error)) {
            if(error instanceof Anthropic.APIConnectionError) throw new Lab10Error(503,'The server could not reach Anthropic. Check server network access and connectivity, then retry explicitly. No report was started.');
            throw new Lab10Error(422,error instanceof LabError ? error.message : managedErrorMessage(error));
          }
          throw error;
        }finally{response.removeListener('close',disconnected);}
        if(controller.signal.aborted){await runs.stop(e,true);return;}
      }
      // Reject queue conflicts before SSE headers.
      if(e.closing || e.control || e.state === 'closed' || e.state === 'cleanup-pending') throw new Lab10Error(409,'Run is stopping, closed or awaiting cleanup.');
      if(e.jobs.size >= 3) throw new Lab10Error(429,'The per-session send queue is full.');
      stream=openSse(request,response,{controller,heartbeatMs:5000,idleMs:20_000,deadlineMs:input.deadlineSeconds*1000*3+15_000,quiet:true});
      const queued=runs.enqueue(e,input,controller.signal,(frame)=>stream!.send('progress',frame));await queued.work;
      if(!controller.signal.aborted) stream.send('result',runs.snapshot(e));
    }catch(error){if(stream){if(!controller.signal.aborted)stream.send('error',{message:error instanceof Lab10Error ? error.message : 'The turn could not be completed.'});}
      else if(!response.destroyed)fail(response,error);
    }finally{await stream?.end();}
  });
  router.use(apiErrorHandler);return{router,runs,async close(){closing=true;clearInterval(sweep);await runs.close();}};
}
