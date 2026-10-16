import { catalogFromGlob, loadText, mainSources } from './catalog';
import { selectGuide } from '../lib/presentation';

export const guides = catalogFromGlob(import.meta.glob<string>('/Tab*.md', { query: '?raw', import: 'default' }));
// Public teaching code only. Deliberately shallow scopes: no runtime directories,
// tests, credentials, private config, logs or browser/live-check scripts.
const standardSources = catalogFromGlob(import.meta.glob<string>([
  '/server/index.ts', '/server/sse.ts', '/server/concepts/*.ts', '/server/concepts/*.mjs',
  '/server/lib/*.ts', '/server/routes/*.ts', '/server/capstone/*.ts', '/server/unit-testing/*.ts', '/server/evals/*.ts', '/server/debugging/*.ts', '/server/tool-design/*.ts', '/server/upgrades/*.ts',
  '/server/teams/*.ts',
  '/server/worktrees/*.ts',
  '/server/tool-search/*.ts',
  '/server/routing/*.ts',
  '/server/durable/*.ts',
  '/server/mcp-agent/*.ts',
  '/server/retrieval/*.ts',
  '/server/database/*.ts',
  '/src/concepts/*.tsx', '/src/concepts/*.ts', '/src/components/*.tsx', '/src/lib/*.ts',
  '/shared/contracts.ts', '/shared/health.ts', '/shared/lessons.ts', '/shared/lab[0-9][0-9]-*.ts',
  '/mcp-servers/*.ts', '/mcp-servers/*.mjs',
  '!/**/*.test.*', '!/**/*.spec.*', '!/**/*live-check*', '!/**/*browser*',
  '!/**/*credential*', '!/**/*secret*', '!/**/*private*', '!/**/*config*',
], { query: '?raw', import: 'default' }));
// Lab 39 deliberately teaches configuration authority; include only its authored
// source files while the broad catalog still excludes unrelated config files.
export const sources = { ...standardSources, ...catalogFromGlob(import.meta.glob<string>([
  '/shared/lab39-project-config-root.ts', '/server/lib/lab39-project-config-root.ts',
  '/server/concepts/39-project-config-root.ts', '/src/concepts/Concept39ProjectConfigRoot.tsx',
], { query: '?raw', import: 'default' })), ...catalogFromGlob(import.meta.glob<string>([
  '/shared/lab64-browser-playwright-mcp.ts', '/server/concepts/64-browser-playwright-mcp.ts',
  '/src/concepts/Concept64BrowserPlaywrightMcp.tsx',
  '/extensions/lab69/src/extension.ts', '/extensions/lab69/package.json',
], { query: '?raw', import: 'default' })) };
export { loadText, mainSources };
export async function loadGuide(id: number): Promise<string> {
  // Accepts Tab01.md and descriptive names such as Tab1-query.md; exactly one file may match.
  const pattern = new RegExp(`^Tab0*${id}(?:-[a-z0-9-]+)?\\.md$`);
  const matches = Object.keys(guides).filter((key) => pattern.test(key));
  const name = matches.length === 1 ? matches[0]! : `Tab${String(id).padStart(2, '0')}.md`;
  const markdown = (await loadText(guides, name)).replace(/\r\n?/g, '\n');
  const selected = selectGuide(markdown, id);
  if (!selected || selected.trim() !== markdown.trim()) throw new Error(`Invalid guide boundaries: ${name}`);
  return markdown;
}
