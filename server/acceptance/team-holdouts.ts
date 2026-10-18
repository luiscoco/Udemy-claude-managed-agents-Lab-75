// Host-only acceptance code. Never included in public facts, the source catalog or worker tools.
import { runProcess } from '../lib/lab73-prbot.js';
export async function teamHoldouts(root: string, signal: AbortSignal) {
  const probes = [
    ['tag length boundary', "const {normalizeTag}=await import('./src/tags.mjs'); if(normalizeTag('a'.repeat(20)).length!==20)throw Error(); for(const tag of ['a'.repeat(21),'\\u0130'.repeat(21)]){let rejected=false;try{normalizeTag(tag)}catch{rejected=true}if(!rejected)throw Error();} const expanded='\\u0130'.repeat(20);if(normalizeTag('  '+expanded+'  ')!==expanded.toLowerCase())throw Error('Validate trimmed length before case expansion');"],
    ['normalization and order', "const {parseTags}=await import('./src/tags.mjs');if(JSON.stringify(parseTags([' B ','a','B']))!==JSON.stringify(['b','a']))throw Error();for(const x of ['',null,4]){let r=false;try{parseTags([x])}catch{r=true}if(!r)throw Error()}"],
    ['search semantics', "const {findByTag}=await import('./src/search.mjs');const n=[{id:2,tags:[' WORK ']},{id:3,tags:['other']}];if(findByTag(n,'work')[0]!==n[0]||findByTag(n,'missing').length)throw Error();for(const bad of [{},{tags:null},{tags:['']}]){let rejected=false;try{findByTag([bad],'work')}catch{rejected=true}if(!rejected)throw Error('Malformed note tags must throw');}"],
    ['count and tie semantics', "const {tagCounts}=await import('./src/report.mjs');if(JSON.stringify(tagCounts([{tags:['b','a','B']},{tags:['c']}]))!==JSON.stringify([{tag:'a',count:1},{tag:'b',count:1},{tag:'c',count:1}]))throw Error();const values=['😀x','\\uE000','😀','aa','a'];const expected=['a','aa','\\uE000','😀','😀x'].map(tag=>({tag,count:1}));if(JSON.stringify(tagCounts([{tags:values}]))!==JSON.stringify(expected))throw Error('Unicode codepoint tie order');"],
  ];
  const results = []; for (const [label, code] of probes) { const run = await runProcess(process.execPath, ['--input-type=module', '-e', code!], root, 5000, signal); results.push({ label: label!, pass: run.code === 0 && !run.timedOut }); } return results;
}
