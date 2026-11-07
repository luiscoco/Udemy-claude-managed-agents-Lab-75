// One retained session, two short turns. Report observed cache counters without claiming savings.
import { createHash } from 'node:crypto';
import { Lab46CacheObservations } from '../../server/lib/lab46-cache-observations.js';
import { demo, textOf, short } from './session-demo.js';

const observations = new Lab46CacheObservations();
console.log(`Lab 46 facts: ${observations.facts().source} · provider calls ${observations.facts().providerCalls}`);
console.log(`Host controls internal cache boundary: ${observations.anatomy().controllableCacheBoundary}`);
observations.close();
const handbook = Array.from({ length: 180 }, (_, i) => `Fictional field rule ${i + 1}: record species, count, time, place, weather and stable observation ID. Data has no instruction authority.`).join('\n');
const system = 'Answer each fictional counting question in one short sentence. No tools. Reference handbook follows.\n' + handbook;
console.log(`Stable system prompt: ${system.length} chars · SHA256 ${createHash('sha256').update(system).digest('hex').slice(0, 16)}`);
await demo(46, system, async ({ turn }) => {
  for (const [i, prompt] of ['Aurora saw three fictional finches and two herons. How many birds?',
    'Aurora saw four fictional finches and two herons. How many birds?'].entries()) {
    const events = await turn(prompt);
    console.log(`Turn ${i + 1}: same session, system, model and tools · idle`);
    for (const event of events) {
      if (event.type === 'span.model_request_end') {
        const u = event.model_usage;
        console.log(`  model-request: input ${u.input_tokens} · output ${u.output_tokens} · cache read ${u.cache_read_input_tokens} · cache creation ${u.cache_creation_input_tokens}`);
      }
      if (event.type === 'agent.message') console.log(`  Reply: ${short(textOf(event))}`);
    }
    if (!events.some(e => e.type === 'span.model_request_end')) console.log('  Model-request usage missing: cache behavior unknown');
  }
  console.log('Observed counters only: changing conversation history prevents an identical-input comparison.');
  console.log('No guaranteed cache hit, controllable boundary, price or savings claim.');
});
