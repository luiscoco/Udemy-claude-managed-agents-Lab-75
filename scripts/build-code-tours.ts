import { parseAst } from 'rolldown/parseAst';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { content } from '../shared/learning-content.js';
import { codeCatalogSchema, codeTourText, normalizedCode, type CodeTour } from '../shared/code-tours.js';

type Node = { type: string; start: number; end: number; [key: string]: unknown };
const nodes = (value: unknown): Node[] => Array.isArray(value) ? value as Node[] : [];
const child = (value: unknown) => value as Node | undefined;
function walk(node: Node, visit: (node: Node) => void) {
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) for (const item of value) { if (item && typeof item === 'object' && typeof item.type === 'string') walk(item as Node, visit); }
    else if (value && typeof value === 'object' && 'type' in value) walk(value as Node, visit);
  }
}
const spoken = (text: string) => text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/lab0?(\d+)/gi, 'lab $1').replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim();
function name(node: Node | undefined): string {
  if (!node) return '';
  if (node.type === 'Identifier') return String(node.name);
  if (node.type === 'MemberExpression') return [name(child(node.object)), name(child(node.property))].filter(Boolean).join('.');
  if (['CallExpression', 'NewExpression'].includes(node.type)) return name(child(node.callee));
  if (['AwaitExpression', 'TSAsExpression', 'ChainExpression', 'TSNonNullExpression'].includes(node.type)) return name(child(node.argument ?? node.expression));
  return '';
}
function calls(node: Node) { const result: string[] = []; walk(node, item => { if (item.type === 'CallExpression') result.push(name(child(item.callee))); }); return [...new Set(result.filter(Boolean))]; }
function variables(node: Node) { const result: string[] = []; walk(node, item => { if (item.type === 'VariableDeclarator' && child(item.id)?.type === 'Identifier') result.push(name(child(item.id))); }); return [...new Set(result)]; }
function routePath(node: Node) {
  const argument = nodes(node.arguments)[0];
  if (typeof argument?.value === 'string') return argument.value;
  if (argument?.type === 'TemplateLiteral') {
    const quasis = nodes(argument.quasis), expressions = nodes(argument.expressions);
    return quasis.map((part, index) => `${String((part.value as { cooked: string }).cooked)}${expressions[index] ? `{${name(expressions[index])}}` : ''}`).join('');
  }
  return '';
}
function condition(node: Node | undefined): string {
  if (!node) return 'the guard';
  if (node.type === 'UnaryExpression' && node.operator === '!') return `${condition(child(node.argument))} is false`;
  if (['Identifier', 'MemberExpression'].includes(node.type)) return spoken(name(node));
  if (node.type === 'Literal') return String(node.value);
  if (['BinaryExpression', 'LogicalExpression'].includes(node.type)) {
    const operators: Record<string, string> = { '===': 'equals', '!==': 'differs from', '>=': 'is at least', '>': 'exceeds', '<=': 'is at most', '<': 'is below', '||': 'or', '&&': 'and' };
    return `${condition(child(node.left))} ${operators[String(node.operator)] ?? String(node.operator)} ${condition(child(node.right))}`;
  }
  return spoken(name(node)) || 'the checked value';
}
function routeText(node: Node, path: string) {
  const invoked = calls(node), vars = variables(node);
  const parse = invoked.find(value => /\.(safeParse|parse)$/.test(value));
  const delegated = invoked.filter(value => !/^(router|response|request|z|JSON|Object|Array|Date|Math|Promise|Number|String|Buffer|console)\./.test(value) && !/^(apiError|reply|next|owner|ownerOf|fail|managedSettings|Number|String|Boolean|Object|Array|Date|Map|Set|RegExp)$/.test(value) && !/\.(parse|safeParse|catch|then|includes|test|join|map|find|filter|push|set|delete|add|removeListener|on)$/i.test(value)).slice(0, 3);
  const status: number[] = []; walk(node, item => { if (item.type === 'CallExpression' && name(child(item.callee)) === 'response.status') { const value = nodes(item.arguments)[0]?.value; if (typeof value === 'number') status.push(value); } });
  const input = parse ? `${spoken(vars.find(value => /parsed|input/.test(value)) ?? vars[0] ?? 'input')} holds the result of ${spoken(parse)}.` : vars.length ? `The local ${vars.slice(0, 2).map(spoken).join(' and ')} values carry this operation's state.` : 'Trace the request arguments into the handler.';
  const execution = delegated.length ? `Execution calls ${delegated.map(spoken).join(', ')}.` : 'Follow how the validated input reaches the response.';
  const output = status.includes(202) ? 'Status 202 acknowledges accepted work; read its later result separately.' : status.length ? `The explicit HTTP ${[...new Set(status)].slice(0, 3).join(', ')} branches are observable outcomes of this handler.` : invoked.some(value => /response.*json$/.test(value)) ? 'The JSON response is the returned evidence; distinguish it from the request input.' : 'Inspect the returned value or streamed frames as the observable result.';
  return `For ${path.replaceAll('/', ' slash ').replace(/[{}:]/g, '').trim()}, ${input} ${execution} ${output}`;
}

// Authoring helper: source-derived line anchors and text are persisted for review.
const tours: CodeTour[] = [];
for (let lessonId = 1; lessonId <= 75; lessonId++) {
  const prefix = `${String(lessonId).padStart(2, '0')}-`;
  const files = (await readdir('server/concepts')).filter(file => file.startsWith(prefix) && file.endsWith('.ts'));
  if (files.length !== 1) throw new Error(`Review main concept file for Lab ${lessonId}.`);
  const path = `server/concepts/${files[0]}`, source = normalizedCode(await readFile(path, 'utf8'));
  const tree = parseAst(source, { lang: 'ts' }, path);
  const line = (offset: number) => source.slice(0, offset).split('\n').length;
  const imports = tree.body.filter(node => node.type === 'ImportDeclaration');
  const sections: CodeTour['sections'] = [];
  function add(node: { start: number; end: number }, title: string, text: string, end = node.end) {
    sections.push({ id: `code-${sections.length}`, title, text, startLine: line(node.start), endLine: line(end) });
  }
  const first = imports[0] ?? tree.body[0]!;
  add(first, 'Concept and dependencies', `Lab ${lessonId}. ${content[lessonId]!.objective} The highlighted imports connect this main module to its schemas and delegated implementation.`, imports.at(-1)?.end ?? first.end);
  const declarations = tree.body.map(node => node.type === 'ExportNamedDeclaration' ? node.declaration : node);
  const factory = declarations.find(node => node?.type === 'FunctionDeclaration' && /Router$/.test(node.id?.name ?? ''));
  if (!factory || factory.type !== 'FunctionDeclaration' || !factory.body) throw new Error(`Missing main router in ${path}`);
  const body = [...factory.body.body];
  const candidates: Node[] = [];
  walk(factory as unknown as Node, node => { if (node.type === 'CallExpression' && name(child(node.callee)) === 'router.post' && routePath(node)) candidates.push(node); });
  const focus: Record<number, string[]> = { 43: ['/auth', '/resources', '/host-read', '/live'], 68: ['/webhook', '/schedules', '/worker', '/tick'], 71: ['/sessions', '/sessions/:id/tool', '/sessions/:id/verify', '/sessions/:id/query'], 72: ['/sessions', '/sessions/:id/build', '/sessions/:id/policy', '/sessions/:id/query'], 73: ['/gate', '/sessions/:id/review', '/sessions/:id/fix', '/sessions/:id/run'] };
  const ranked = candidates.map(node => { const path = routePath(node); return { node, score: focus[lessonId]?.includes(path) ? 10 : /\/(query|runs?|chat|execute|turn|session|sessions|send|start|events)$/.test(path) ? 5 : path.includes('{') ? 4 : /cancel|reset|probe|policy/.test(path) ? 0 : 2 }; }).sort((a, b) => b.score - a.score);
  const mainRoutes = ranked.slice(0, 4).map(item => item.node).sort((a, b) => a.start - b.start);
  const chosen = [body[0]!, ...mainRoutes, body.at(-1)!].filter((node, index, all) => all.indexOf(node) === index);
  for (const node of chosen) {
    const code = source.slice(node.start, node.end);
    const routes = (node as Node).type === 'CallExpression' ? [routePath(node as Node)].filter(Boolean) : [];
    let title: string, text: string;
    if (routes.length) {
      title = `POST ${routes[0]}`;
      text = routeText(node as unknown as Node, routes[0]!);
    } else if (node === body[0]) {
      title = 'Create the concept router';
      text = `Router creates the HTTP routing object. The factory's ${factory.params.map(param => spoken(name(param as unknown as Node) || name(child((param as unknown as Node).left)))).filter(Boolean).slice(0, 3).join(', ') || 'local'} inputs configure this module. Request handlers run later, when the browser explicitly submits work.`;
    } else {
      title = 'Return the module contract';
      const closing = calls(node as unknown as Node).filter(value => /(?:^|\.)(?:abort|close|end|allSettled|clear|clearInterval)$/.test(value)).slice(0, 3);
      text = closing.length ? `The returned module exposes its router and cleanup contract. Cleanup calls ${closing.map(spoken).join(', ')}. Track the lifetime of pending work through these calls; returning the router does not itself execute a lab request.` : 'The factory returns the configured router. Its registered request handlers, validation and responses form the module contract. A source visit is not an exercise result.';
    }
    add(node, title, text);
  }
  const primary = ranked[0]?.node;
  if (primary && lessonId !== 1) {
    const guards: Node[] = [];
    walk(primary, node => {
      if (node.type === 'IfStatement' && /response\.status\(\d+\)/.test(source.slice(node.start, node.end)) && source.slice(node.start, node.end).length < 700) guards.push(node);
    });
    for (const guard of guards.slice(0, 2)) {
      const checked = condition(child(guard.test));
      const statuses = [...source.slice(guard.start, guard.end).matchAll(/response\.status\((\d+)\)/g)].map(match => match[1]);
      const text = `This decision checks whether ${checked}. Its highlighted branch handles HTTP ${[...new Set(statuses)].join(' or ')}. Follow the return or throw here before assuming the later operation ran.`;
      if (codeTourText({ lessonId, path, sourceSha256: '0'.repeat(64), sections }).length + text.length < 1980 && checked.length < 100) {
        const index = sections.findIndex(section => section.startLine === line(primary.start));
        sections.splice(index + 1, 0, { id: 'code-99', title: 'Decision and early response', text, startLine: line(guard.start), endLine: line(guard.end) });
      }
    }
    sections.forEach((section, index) => { section.id = `code-${index}`; });
  }
  if (lessonId === 1) {
    sections.length = 0;
    const range = (start: string, until: string | undefined, title: string, text: string) => {
      const offset = source.indexOf(start); if (offset < 0) throw new Error(`Missing reviewed Lab 01 anchor: ${start}`);
      const end = until ? source.indexOf(until, offset + start.length) : source.length;
      if (end < offset) throw new Error('Missing reviewed range end.');
      sections.push({ id: `code-${sections.length}`, title, text, startLine: line(offset), endLine: until ? line(end) - 1 : line(end) });
    };
    range('import ', 'export const scriptedDeadlineMs', 'Schemas, ports and the runner', 'Lab 1 separates request validation, execution ports and the runner. The request schema checks browser input. Fixture and live ports share a boundary; run lab one coordinates a turn and its evidence.');
    range('export function createLab01Router', "  router.post('/query'", 'Router state and origin checks', 'The factory receives a live port and fixture timing. Active maps controllers to unfinished promises; closing blocks new work. The middleware rejects a nonlocal host or mismatched origin with 403 before accepting the query.');
    range("  router.post('/query'", '    const { mode, prompt, scenario }', 'Validate input and reject overload', 'The query accepts strict JSON up to eight kilobytes. Parsed receives the schema result. Invalid input returns 400. Closing or reaching max concurrent returns 429. These branches stop before selecting an execution port.');
    range('    const { mode, prompt, scenario }', '    const deadlineMs', 'Choose the execution port', 'Mode, prompt and scenario come from validated data. Live mode calls the injected live port; configuration failure returns 422. Otherwise create fixture port uses scenario and fixture timing. Offline evidence and live provider observations remain distinct.');
    range('    const deadlineMs', '    const work =', 'Deadlines and the event stream', 'Deadline milliseconds uses server policy for live work and scenario bounds offline. Abort controller carries cancellation. Open SSE receives that controller and a longer host deadline, leaving time for runner cleanup before transport shutdown.');
    range('    const work =', '    active.set(controller, work)', 'Progress, result and error flow', 'Run lab one receives prompt, port, signal and deadlines. Its emit callback sends progress frames. Result is sent only while the controller is not aborted. A caught failure sends an error; finally ends the stream and removes the active controller.');
    range('    active.set(controller, work)', undefined, 'Track work and close cleanly', 'Active retains the work promise before the handler awaits it. The returned close function marks closing, aborts remaining controllers with shutdown, then awaits all settled work. Distinguish progress text from the runner result and confirmed cleanup.');
  }
  if (lessonId === 66) {
    sections.length = 0;
    const locate = (needle: string): Node => { let found: Node | undefined; walk(factory as unknown as Node, node => { if (!found && (node.type === 'VariableDeclarator' && name(child(node.id)) === needle || node.type === 'FunctionDeclaration' && name(child(node.id)) === needle)) found = node; }); if (!found) throw new Error(`Missing WebSocket anchor ${needle}`); return found; };
    add(first, 'Bounded WebSocket teaching bridge', 'Lab 66 uses a local WebSocket bridge around offline or explicitly started Managed work. Command schemas validate messages. Frames, sockets, controllers and acknowledgement maps represent host state; the browser does not receive a provider credential.', imports.at(-1)!.end);
    add(locate('send'), 'Backpressure before sending', 'Send first checks that the socket is open. Slow consumer examines buffered bytes; an excessive buffer closes the connection with 1013. JSON is sent only after those checks, preventing an unbounded slow client queue.');
    add(locate('emit'), 'Sequence and retain frames', 'Emit increments the run sequence and labels each frame with its run and evidence source. It retains at most 64 frames, evicts older entries and updates activity. Closed sockets are removed before broadcasting the new frame.');
    add(locate('replay'), 'Reconnect with a sequence cursor', 'Replay compares after sequence with the oldest retained frame. If the requested history was evicted, it sends an explicit gap. It then sends only newer frames. Reconnecting cannot recover data the bounded buffer no longer holds.');
    add(locate('perform'), 'Offline and live execution paths', 'Perform selects the offline fixture or live port. Offline tool results correlate their custom tool event before streaming words. Live work delegates to run lab one with deadlines and a cancellation signal. The reported outcome determines completed, cancelled or error.');
    add(locate('onUpgrade'), 'Authenticate the local upgrade', 'The upgrade checks the exact WebSocket path, local host and origin, an unexpired cookie token, closing state and the eight-client limit. Rejected upgrades write 403 and destroy the socket; accepted ones enter the WebSocket server.');
    add(body.at(-1)!, 'Close retained work and transport', 'The returned module exposes router, attach and close. Follow close through controller aborts, settled work and WebSocket shutdown. Local transport closure and confirmed provider interruption are separate evidence boundaries.');
  }
  const tour: CodeTour = { lessonId, path, sourceSha256: createHash('sha256').update(source).digest('hex'), sections };
  if (codeTourText(tour).length > 2000) throw new Error(`Recording text exceeds provider limit: ${lessonId}`);
  tours.push(tour);
}
const catalog = codeCatalogSchema.parse({ version: 1, tours });
await mkdir('public/code-tours', { recursive: true });
await writeFile('public/code-tours/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(JSON.stringify({ tours: tours.length, filesPerLab: 1, sections: tours.reduce((n, t) => n + t.sections.length, 0), characters: tours.reduce((n, t) => n + codeTourText(t).length, 0), providerRequests: 0 }));
