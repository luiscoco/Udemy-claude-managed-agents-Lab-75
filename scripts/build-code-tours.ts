import { parseAst } from 'rolldown/parseAst';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { content } from '../shared/learning-content.js';
import { codeCatalogSchema, codeTourText, normalizedCode, type CodeTour } from '../shared/code-tours.js';

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
  add(first, 'Concept and dependencies', `This is the main TypeScript concept module for Lab ${lessonId}. ${content[lessonId]!.objective} The highlighted imports show the boundaries used by this module. Follow this file only; imported implementations remain separate reading material.`, imports.at(-1)?.end ?? first.end);
  const declarations = tree.body.map(node => node.type === 'ExportNamedDeclaration' ? node.declaration : node);
  const factory = declarations.find(node => node?.type === 'FunctionDeclaration' && /Router$/.test(node.id?.name ?? ''));
  if (!factory || factory.type !== 'FunctionDeclaration' || !factory.body) throw new Error(`Missing main router in ${path}`);
  const body = [...factory.body.body];
  const candidates = body.filter(node => /\.post\s*\(/.test(source.slice(node.start, node.end)));
  const chosen = [body[0]!, ...candidates.slice(0, 3), body.at(-1)!].filter((node, index, all) => all.indexOf(node) === index);
  for (const node of chosen) {
    const code = source.slice(node.start, node.end);
    const routes = [...code.matchAll(/\.post\s*\(\s*['"]([^'"]+)['"]/g)].map(match => match[1]!);
    let title: string, text: string;
    if (routes.length) {
      title = `POST ${routes[0]}`;
      const parse = /\.safeParse\(|\.parse\(/.test(code);
      const hasCatch = /catch|next\(error\)/.test(code);
      const live = /live/.test(code);
      text = `This highlighted block registers the ${routes[0]!.replaceAll('/', ' slash ')} POST operation. ${parse ? 'Notice where the incoming data is parsed before the request continues.' : 'Trace the request arguments passed into the operation.'} ${live ? 'Identify the explicit live branch and distinguish it from the local teaching path.' : 'Follow the delegated operation and the values passed back to the response.'} ${hasCatch ? 'The error path is part of the contract; inspect it alongside the successful response.' : 'Read the response boundary before moving to the next block.'}`;
    } else if (node === body[0]) {
      title = 'Create the concept router';
      text = `Here the main concept factory begins. Read the highlighted initialization and its dependencies. The router connects this lab to the local application; importing or reading this TypeScript file does not run a lab request. Keep the factory setup separate from the later request handlers.`;
    } else {
      title = 'Return the module contract';
      text = `This final highlighted statement completes the main concept factory. Inspect the object or router it returns and any cleanup or error handling visible here. Connect that boundary back to this lab's objective. Reading the source or listening to this recording is study activity, not evidence of a successful exercise run.`;
    }
    add(node, title, text);
  }
  const tour: CodeTour = { lessonId, path, sourceSha256: createHash('sha256').update(source).digest('hex'), sections };
  if (codeTourText(tour).length > 2000) throw new Error(`Recording text exceeds provider limit: ${lessonId}`);
  tours.push(tour);
}
const catalog = codeCatalogSchema.parse({ version: 1, tours });
await mkdir('public/code-tours', { recursive: true });
await writeFile('public/code-tours/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(JSON.stringify({ tours: tours.length, filesPerLab: 1, sections: tours.reduce((n, t) => n + t.sections.length, 0), characters: tours.reduce((n, t) => n + codeTourText(t).length, 0), providerRequests: 0 }));
