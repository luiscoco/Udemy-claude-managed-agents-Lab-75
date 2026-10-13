import { catalogFromGlob, loadText, mainSources } from './catalog';
import { selectGuide } from '../lib/presentation';

export const guides = catalogFromGlob(import.meta.glob<string>('/Tab*.md', { query: '?raw', import: 'default' }));
// Public teaching code only. Deliberately shallow scopes: no runtime directories,
// tests, credentials, private config, logs or browser/live-check scripts.
export const sources = catalogFromGlob(import.meta.glob<string>([
  '/server/index.ts', '/server/sse.ts', '/server/concepts/*.ts', '/server/concepts/*.mjs',
  '/server/lib/*.ts', '/server/routes/*.ts',
  '/src/concepts/*.tsx', '/src/concepts/*.ts', '/src/components/*.tsx', '/src/lib/*.ts',
  '/shared/contracts.ts', '/shared/health.ts', '/shared/lessons.ts', '/shared/lab[0-9][0-9]-*.ts',
  '/mcp-servers/*.ts', '/mcp-servers/*.mjs',
  '!/**/*.test.*', '!/**/*.spec.*', '!/**/*live-check*', '!/**/*browser*',
  '!/**/*credential*', '!/**/*secret*', '!/**/*private*', '!/**/*config*',
], { query: '?raw', import: 'default' }));
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
