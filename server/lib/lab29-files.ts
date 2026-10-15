import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BetaManagedAgentsUserMessageEventParams } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import type { BetaManagedAgentsFileResourceParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { lab29Names, lab29ResultSchema } from '../../shared/lab29-images-files.js';
import type { Lab29Request } from '../../shared/lab29-images-files.js';

const root = fileURLToPath(new URL('../../fixtures/lab29/', import.meta.url));
const mime: Record<(typeof lab29Names)[number], string> = { 'aurora-finch.png': 'image/png', 'field-note.pdf': 'application/pdf', 'observation.txt': 'text/plain' };
const maxBytes: Record<(typeof lab29Names)[number], number> = { 'aurora-finch.png': 80_000, 'field-note.pdf': 80_000, 'observation.txt': 2_000 };
export class Lab29Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
export async function readLab29Fixture(name: (typeof lab29Names)[number]) {
  if (!lab29Names.includes(name) || basename(name) !== name) throw new Lab29Error(400, 'Unknown fixture filename.');
  const path = join(root, name), base = await realpath(root), target = await realpath(path);
  if (relative(base, target).startsWith('..') || (await lstat(path)).isSymbolicLink()) throw new Lab29Error(400, 'Fixture path is not a regular allowlisted file.');
  const bytes = await readFile(target); if (bytes.length > maxBytes[name] || bytes.length === 0) throw new Lab29Error(413, 'Fixture exceeds its size bound.');
  if (name.endsWith('.png') && !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ||
      name.endsWith('.pdf') && bytes.subarray(0, 5).toString('ascii') !== '%PDF-' ||
      name.endsWith('.txt') && bytes.toString('utf8').includes('\ufffd')) throw new Lab29Error(400, 'Fixture MIME signature mismatch.');
  return { name, mime: mime[name], bytes, sha256: sha(bytes), path };
}
function checkedBase64(data: string, name: (typeof lab29Names)[number]) {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) throw new Lab29Error(400, 'Malformed base64 payload.');
  const bytes = Buffer.from(data, 'base64'); if (bytes.toString('base64') !== data) throw new Lab29Error(400, 'Noncanonical base64 payload.');
  if (bytes.length === 0 || bytes.length > maxBytes[name]) throw new Lab29Error(413, 'Decoded payload exceeds its size bound.');
  if (name.endsWith('.png') && !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ||
      name.endsWith('.pdf') && bytes.subarray(0, 5).toString('ascii') !== '%PDF-' ||
      name.endsWith('.txt') && bytes.toString('utf8').includes('\ufffd')) throw new Lab29Error(400, 'Payload MIME signature mismatch.');
  return bytes;
}
export function buildInlineMessage(name: (typeof lab29Names)[number], question: string, bytes: Buffer): BetaManagedAgentsUserMessageEventParams {
  const block: BetaManagedAgentsUserMessageEventParams['content'][number] = name === 'aurora-finch.png' ?
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: bytes.toString('base64') } } :
    name === 'field-note.pdf' ?
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytes.toString('base64') }, title: name } :
      { type: 'document', source: { type: 'text', media_type: 'text/plain', data: bytes.toString('utf8') }, title: name };
  // The installed SDK's user.message block union is the compile-time authority.
  return { type: 'user.message', content: [{ type: 'text', text: question }, block] };
}
export function mountFor(name: (typeof lab29Names)[number], fileId: string): BetaManagedAgentsFileResourceParams {
  return { type: 'file', file_id: fileId, mount_path: `/lab29/${name}` };
}
export async function runLab29(route: 'inline' | 'upload' | 'disk', input: Lab29Request) {
  if (input.mode !== 'scripted') throw new Lab29Error(422, 'Live upload requires a separately configured explicit Files API adapter.');
  if (route !== 'inline' && input.data !== undefined) throw new Lab29Error(400, 'File-resource routes accept only selected authored fixture bytes.');
  const fixture = await readLab29Fixture(input.name);
  const bytes = input.data === undefined ? fixture.bytes : checkedBase64(input.data, input.name);
  const digest = sha(bytes), fileId = route === 'inline' ? null : `file_fixture_${digest.slice(0, 12)}`;
  const message = route === 'inline' ? buildInlineMessage(input.name, input.question, bytes) :
    { type: 'user.message' as const, content: [{ type: 'text' as const, text: `${input.question} Read the selected mounted file.` }] };
  const redacted = message.content.map(block => block.type === 'text' ? { type: 'text', characters: block.text.length } :
    { type: block.type, source: 'source' in block ? block.source.type : 'unknown', mediaType: mime[input.name], bytes: bytes.length });
  const resource = fileId ? mountFor(input.name, fileId) : null;
  const output = route === 'disk' ? (await readFile(join(root, 'downloaded-output.txt'), 'utf8')).trim() : null;
  return lab29ResultSchema.parse({ source: 'authored-fixture', route, name: input.name, mime: mime[input.name], bytes: bytes.length, sha256: digest,
    sentBlocks: redacted, mountPath: resource ? `/mnt/session/uploads${resource.mount_path}` : null, uploadedFileId: fileId,
    agentText: 'Authored fixture answer: the selected document or image represents a fictional Aurora Finch note.', downloadedOutput: output,
    providerCalls: 0, usage: null, note: 'No file was uploaded. The sent block/resource metadata is a redacted preview of the pinned SDK shape.' });
}
