// Read-only diagnostic: omit prompt/reply content, secrets and complete resource IDs.
import Anthropic from '@anthropic-ai/sdk';
const id = process.argv[2];
if (!/^sesn_[A-Za-z0-9]+$/.test(id ?? '')) throw Error('Supply one session ID');
const client = new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,maxRetries:0,timeout:15000});
const session = await client.beta.sessions.retrieve(id);
const page = await client.beta.sessions.events.list(id,{order:'asc',limit:100});
if (page.next_page) throw Error('Diagnostic event bound exceeded');
console.log(JSON.stringify({
  source:'read-only-provider-inspection',
  sessionPreview:id.slice(0,10)+'…'+id.slice(-4),
  status:session.status,
  archived:Boolean(session.archived_at),
  budget:session.budget,
  usage:session.usage,
  stopReasons:page.data.filter(e=>e.type==='session.status_idle').map(e=>e.stop_reason),
  eventTypes:page.data.map(e=>e.type),
},null,2));
