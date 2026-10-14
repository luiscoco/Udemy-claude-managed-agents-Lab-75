import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type Anthropic from '@anthropic-ai/sdk';
import { createLiveLab09Port } from './lab09-port.js';
import type { Lab01Port } from './lab01-port.js';
import { fixtureSession } from './lab01-port.js';
import type { StreamEvent } from './session-events.js';
import { lab10JsonSchema } from '../../shared/lab10-structured-interrupt.js';
import type { Lab10ParsedRequest } from '../../shared/lab10-structured-interrupt.js';

export type Lab10Port = Lab01Port & { prepare?(input:Lab10ParsedRequest):void };
export function createLiveLab10Port(input: Lab10ParsedRequest, sdk?:Anthropic, env=process.env):Lab10Port {
  return createLiveLab09Port({mode:'live',variant:'custom',prompt:input.prompt,deadlineSeconds:input.deadlineSeconds,budgetCents:input.budgetCents,
    customSystem:`Return only one JSON object matching this report schema. Do not add Markdown fences or commentary. Schema: ${JSON.stringify(lab10JsonSchema)}`},sdk,env);
}
export const fixtureLab10Report = {project:'Aurora Finch',summary:'A fictional community observation notebook.',risks:['Offline synchronization conflicts.'],nextSteps:['Implement offline capture.']};
export function createFixtureLab10Port(input:Lab10ParsedRequest, stepMs=15):Lab10Port & {calls:string[]} {
  let status='idle'; let pending=false; let sends=0; let scenario=input.scenario; const calls:string[]=[];
  return {source:'authored-fixture',calls,
    prepare(next){scenario=next.scenario; sends=0; pending=false;},
    async create(){calls.push('create'); return {...fixtureSession,id:`sesn_fixture_lab10_${randomUUID()}`};},
    async open(_id,signal){calls.push('open'); return (async function*():AsyncGenerator<StreamEvent>{
      while(!pending) await delay(2,undefined,{signal}); pending=false;
      const at=new Date().toISOString(); yield {type:'session.status_running',id:`sevt_running_${sends}`,processed_at:at};
      if(scenario === 'hang' || scenario === 'interrupt-unconfirmed') await delay(3_600_000,undefined,{signal});
      if(stepMs) await delay(stepMs,undefined,{signal});
      const invalid=scenario === 'invalid' || scenario === 'exhausted' || (scenario === 'corrected' && sends === 1);
      yield {type:'agent.message',id:`sevt_report_${sends}`,processed_at:at,content:[{type:'text',text:JSON.stringify(invalid ? {project:'Aurora Finch',summary:5,risks:[],nextSteps:[],unexpected:true} : fixtureLab10Report)}]};
      status='idle'; yield {type:'session.status_idle',id:`sevt_idle_${sends}`,processed_at:at,stop_details:null,stop_reason:{type:'end_turn'}};
    })();},
    async send(){calls.push('send'); if(status === 'archived') throw new Error('Closed'); sends++; pending=true; status='running';},
    async interrupt(){calls.push('interrupt'); if(scenario !== 'interrupt-unconfirmed') status='idle';},
    async status(){calls.push('status'); return status;},
    async archive(){calls.push('archive'); if(status !== 'idle') throw new Error('Not idle'); status='archived';}
  };
}
