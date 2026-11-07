import {z} from 'zod';
const bounded=z.string().trim().min(1).max(4000);
const block=z.discriminatedUnion('type',[
 z.object({type:z.literal('heading'),level:z.union([z.literal(1),z.literal(2)]),text:bounded}),
 z.object({type:z.literal('paragraph'),text:bounded}),
 z.object({type:z.literal('bullets'),items:z.array(bounded).min(1).max(12)}),
 z.object({type:z.literal('table'),columns:z.array(bounded).min(2).max(4),rows:z.array(z.array(bounded)).min(1).max(12)}),
 z.object({type:z.literal('code'),language:z.string().trim().max(24).default('text'),code:z.string().min(1).max(12000)})
]);
export const documentSpec=z.object({kind:z.literal('general'),title:bounded.max(160),author:bounded.max(160),date:z.iso.date(),blocks:z.array(block).min(1).max(60)}).superRefine((value,ctx)=>{for(const [i,item] of value.blocks.entries())if(item.type==='table'&&item.rows.some(row=>row.length!==item.columns.length))ctx.addIssue({code:'custom',path:['blocks',i,'rows'],message:'Every table row must match the column count.'});});
export const infographicSpec=z.object({title:bounded.max(72),subtitle:z.string().max(100).default(''),takeaway:bounded.max(85),items:z.array(z.object({label:bounded.max(30),detail:bounded.max(105)})).min(3).max(6),codeExample:z.object({language:z.string().trim().max(24).default('text'),code:z.string().min(1).max(900)}).optional()});
export const visualStyleSpec=z.object({layout:z.enum(['editorial','cards']),focus:z.object({x:z.number().min(0).max(1000),y:z.number().min(0).max(1000),width:z.number().min(50).max(1000),height:z.number().min(50).max(1000)}),typography:z.enum(['modern','rounded','classic']),motifs:z.array(z.enum(['arcs','clouds','stars','grid'])).max(3),backgroundStrength:z.number().min(0).max(1)});

export function fencedCode(answer){return [...String(answer).matchAll(/^\s*```([\w+-]*)[^\n]*\n([\s\S]*?)\n\s*```\s*$/gm)].map(match=>({language:match[1]||'text',code:match[2].replace(/\r\n?/g,'\n')}));}
export function preserveSourceCode(spec,answer,kind){
 const snippets=fencedCode(answer).filter(item=>item.code.trim()).slice(0,20);
 if(kind==='document'){
  const blocks=spec.blocks.filter(item=>item.type!=='code');
  const codeBlocks=snippets.map(item=>({type:'code',language:item.language.slice(0,24),code:item.code.slice(0,12000)}));
  return documentSpec.parse({...spec,blocks:[...blocks.slice(0,60-codeBlocks.length),...codeBlocks]});
 }
 const first=snippets[0];
 const excerpt=first?.code.split('\n').slice(0,12).map(line=>line.slice(0,85)).join('\n').slice(0,900);
 const {codeExample:ignored,...rest}=spec;
 return infographicSpec.parse({...rest,...(excerpt?{codeExample:{language:first.language.slice(0,24),code:excerpt}}:{})});
}
export function draftDocument(answer,request,date=new Date().toISOString().slice(0,10)){
 const source=String(answer).replace(/\r\n?/g,'\n'),blocks=[];
 const chunks=source.match(/^\s*```[\w+-]*[^\n]*\n[\s\S]*?\n\s*```\s*$|[^\n]+(?:\n(?!\s*```)[^\n]+)*/gm)??[];
 for(const chunk of chunks){
  const match=/^\s*```([\w+-]*)[^\n]*\n([\s\S]*?)\n\s*```\s*$/.exec(chunk);
  if(match){blocks.push({type:'code',language:match[1]||'text',code:match[2].slice(0,12000)});continue;}
  const line=chunk.trim();if(!line)continue;
  const heading=/^#{1,6}\s+(.+)$/.exec(line);
  if(heading){blocks.push({type:'heading',level:1,text:heading[1].replace(/\*\*/g,'').slice(0,4000)});continue;}
  const bulletLines=line.split('\n');
  if(bulletLines.every(x=>/^\s*[-*]\s+/.test(x))){blocks.push({type:'bullets',items:bulletLines.slice(0,12).map(x=>x.replace(/^\s*[-*]\s+/,'').replace(/\*\*/g,'').slice(0,4000))});continue;}
  blocks.push({type:'paragraph',text:line.replace(/\*\*/g,'').slice(0,4000)});
 }
 return documentSpec.parse({kind:'general',title:request.trim().slice(0,100)||'Response report',author:'Agent Publishing Studio',date,blocks:blocks.slice(0,60).length?blocks.slice(0,60):[{type:'paragraph',text:'No response text was available.'}]});
}
export function draftInfographic(answer,title){
 const snippets=fencedCode(answer),prose=String(answer).replace(/^\s*```[\w+-]*[^\n]*\n[\s\S]*?\n\s*```\s*$/gm,'');
 const bullets=prose.split(/\n/).map(line=>line.match(/^\s*[-*]\s+(?:\*\*)?([^:*]+)(?:\*\*)?:\s*(.+)$/)).filter(Boolean).map(match=>({label:match[1].replace(/\*/g,'').trim().slice(0,30),detail:match[2].replace(/\*/g,'').trim().slice(0,105)}));
 const lines=prose.split(/\n\s*\n/).map(x=>x.replace(/^#{1,6}\s*/gm,'').replace(/\*\*/g,'').trim()).filter(x=>x.length>20);
 const items=bullets.length>=3?bullets.slice(0,6):lines.slice(0,6).map((line,i)=>({label:`Key point ${i+1}`,detail:line.slice(0,105)}));
 while(items.length<3)items.push([{label:'Purpose',detail:'Identify the main point.'},{label:'Evidence',detail:'Check the supporting evidence.'},{label:'Next step',detail:'Choose one action to test.'}][items.length]);
 const example=snippets[0];const excerpt=example?.code.split('\n').slice(0,12).map(line=>line.slice(0,85)).join('\n').slice(0,900);
 return infographicSpec.parse({title:title.trim().slice(0,72)||'Key ideas',subtitle:'Key ideas from the selected response',takeaway:items.at(-1).detail.slice(0,85),items,...(excerpt?{codeExample:{language:example.language,code:excerpt}}:{})});
}
