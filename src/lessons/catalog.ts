export type TextLoader = () => Promise<string>;
export type TextCatalog = Readonly<Record<string, TextLoader>>;

export function catalogFromGlob(modules: Record<string, TextLoader>): TextCatalog {
  return Object.freeze(Object.fromEntries(Object.entries(modules).map(([path, load]) => [path.replace(/^\//, ''), load])));
}
export async function loadText(catalog: TextCatalog, path: string): Promise<string> {
  if (!Object.hasOwn(catalog, path)) throw new Error(`No bundled teaching resource: ${path}`);
  return catalog[path]!();
}
export function mainSources(catalog: TextCatalog, id: number): string[] {
  if (!Number.isInteger(id) || id < 0 || id > 75) return [];
  const padded = String(id).padStart(2, '0');
  return Object.keys(catalog).filter((path) =>
    new RegExp(`^src/concepts/Concept${padded}(?:[A-Z_-]|\\.)`).test(path)
    || new RegExp(`^server/concepts/${padded}(?:[-_.])`).test(path)).sort();
}
export function resolveImport(catalog: TextCatalog, from: string, specifier: string): string | undefined {
  if (!Object.hasOwn(catalog, from) || !specifier.startsWith('.')) return undefined;
  const parts = from.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '..') { if (!parts.length) return undefined; parts.pop(); }
    else if (part !== '.') parts.push(part);
  }
  const path = parts.join('/');
  const candidates = [path, path.replace(/\.js$/, '.ts'), path.replace(/\.js$/, '.tsx'), `${path}.ts`, `${path}.tsx`, `${path}.mjs`, `${path}/index.ts`, `${path}/index.tsx`];
  return candidates.find((candidate) => Object.hasOwn(catalog, candidate));
}
export function supportingImports(catalog: TextCatalog, from: string, source: string): string[] {
  const paths = [...source.matchAll(/\b(?:from\s*|import\s*\(?\s*)['"]([^'"]+)['"]/g)]
    .map((match) => resolveImport(catalog, from, match[1]!)).filter((path): path is string => !!path);
  return [...new Set(paths)];
}
