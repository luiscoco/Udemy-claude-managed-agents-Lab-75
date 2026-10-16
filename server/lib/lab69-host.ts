import { createHash } from 'node:crypto';
import { realpath } from 'node:fs/promises';
import { extname, relative, sep } from 'node:path';
import { lab69ContextSchema, lab69PatchSchema, type Lab69Context, type Lab69Patch } from '../../shared/lab69-embedding-sdk.js';

export const documentHash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
export function documentSnapshot(documentId: string, version: number, text: string): Lab69Context {
  return lab69ContextSchema.parse({ documentId, version, text, hash: documentHash(text) });
}
export async function allowedDocument(root: string, filename: string) {
  const [realRoot, realFile] = await Promise.all([realpath(root), realpath(filename)]); const rel = relative(realRoot, realFile);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..' || /^(?:[A-Za-z]:|[\\/])/.test(rel) ||
    rel.split(/[\\/]/).some(part => part.startsWith('.') || ['node_modules', 'dist'].includes(part)) ||
    !['.md', '.txt', '.ts'].includes(extname(realFile).toLowerCase())) throw new Error('Document is outside the trusted allowed folder or file types.');
  return realFile;
}
export function checkedPatch(base: Lab69Context, current: Lab69Context, input: unknown, correlationId: string, trusted: boolean) {
  const patch = lab69PatchSchema.parse(input);
  if (!trusted) throw new Error('Trusted workspace required.');
  if (patch.correlationId !== correlationId || patch.documentId !== base.documentId || current.documentId !== base.documentId)
    throw new Error('Stale correlation or document identity.');
  if (patch.baseVersion !== base.version || patch.baseHash !== base.hash || current.version !== base.version ||
    current.hash !== base.hash || documentHash(current.text) !== current.hash || documentHash(base.text) !== base.hash)
    throw new Error('Changed-document version/hash conflict.');
  return patch;
}
export class Lab69HostReview {
  private active: string | null = null; private pending: Lab69Patch | null = null; private disposed = false;
  begin(correlationId: string) { if (this.disposed || this.active) throw new Error('Host disposed or already has an active run.');
    this.active = correlationId; this.pending = null; }
  accepts(correlationId: string) { return !this.disposed && this.active === correlationId; }
  final(correlationId: string, patch: unknown) { if (!this.accepts(correlationId)) return false;
    const parsed = lab69PatchSchema.parse(patch); if (parsed.correlationId !== correlationId) return false;
    this.pending = parsed; this.active = null; return true; }
  cancel(correlationId: string) { if (this.active === correlationId) this.active = null;
    if (this.pending?.correlationId === correlationId) this.pending = null; }
  apply(base: Lab69Context, current: Lab69Context, correlationId: string, trusted: boolean) {
    if (this.disposed || !this.pending) throw new Error('No reviewed patch available.');
    const patch = checkedPatch(base, current, this.pending, correlationId, trusted); this.pending = null; return patch;
  }
  dispose() { this.disposed = true; this.active = null; this.pending = null; }
}
