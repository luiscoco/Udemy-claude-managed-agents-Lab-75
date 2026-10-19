import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, writeFile, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import { narrationTimelineSchema, type NarrationTimeline } from '../../shared/learning-narration.js';

export type NarrationRecording = { audio: Buffer; timeline: NarrationTimeline };
const maximumAudioBytes = 4 * 1024 * 1024, maximumCacheBytes = 256 * 1024 * 1024;
const metadataSchema = z.strictObject({ version: z.literal(1), key: z.string().regex(/^[a-f0-9]{64}$/),
  audioSha256: z.string().regex(/^[a-f0-9]{64}$/), timeline: narrationTimelineSchema });
export const isNarrationMp3 = (audio: Buffer) => audio.length > 0 && audio.length <= maximumAudioBytes &&
  (audio.subarray(0, 3).toString() === 'ID3' || audio[0] === 0xff && ((audio[1] ?? 0) & 0xe0) === 0xe0);
function paths(directory: string, key: string) {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid recording key.');
  const root = resolve(directory), audio = resolve(root, `${key}.mp3`), metadata = resolve(root, `${key}.json`);
  if (![audio, metadata].every(path => path.startsWith(`${root}${sep}`))) throw new Error('Recording outside cache.');
  return { root, audio, metadata };
}
export async function readNarrationRecording(directory: string, key: string): Promise<NarrationRecording | undefined> {
  const files = paths(directory, key);
  try {
    const [audioStat, metadataStat] = await Promise.all([lstat(files.audio), lstat(files.metadata)]);
    if (!audioStat.isFile() || !metadataStat.isFile() || audioStat.isSymbolicLink() || metadataStat.isSymbolicLink() ||
      audioStat.size > maximumAudioBytes || metadataStat.size > 128 * 1024) return undefined;
    const [audio, raw] = await Promise.all([readFile(files.audio), readFile(files.metadata, 'utf8')]);
    const metadata = metadataSchema.safeParse(JSON.parse(raw));
    if (!isNarrationMp3(audio) || !metadata.success || metadata.data.key !== key ||
      metadata.data.audioSha256 !== createHash('sha256').update(audio).digest('hex')) return undefined;
    return { audio, timeline: metadata.data.timeline };
  } catch { return undefined; }
}
/** Cache only authored recordings. Stop writing at the cap rather than deleting files. */
export async function writeNarrationRecording(directory: string, key: string, recording: NarrationRecording) {
  const files = paths(directory, key);
  if (!isNarrationMp3(recording.audio)) throw new Error('Invalid recording.');
  const metadata = metadataSchema.parse({ version: 1, key, audioSha256: createHash('sha256').update(recording.audio).digest('hex'), timeline: recording.timeline });
  await mkdir(files.root, { recursive: true });
  let size = 0;
  for (const entry of await readdir(files.root, { withFileTypes: true })) {
    if (entry.isFile() && /^[a-f0-9]{64}\.(mp3|json)$/.test(entry.name)) size += (await lstat(resolve(files.root, entry.name))).size;
  }
  const serialized = JSON.stringify(metadata);
  if (size + recording.audio.length + Buffer.byteLength(serialized) > maximumCacheBytes) return;
  const suffix = `.${randomUUID()}.tmp`, audioTemp = files.audio + suffix, metadataTemp = files.metadata + suffix;
  try {
    await writeFile(audioTemp, recording.audio, { flag: 'wx' });
    await writeFile(metadataTemp, serialized, { flag: 'wx' });
    await rename(audioTemp, files.audio);
    await rename(metadataTemp, files.metadata);
  } finally {
    for (const temporary of [audioTemp, metadataTemp]) {
      if (temporary.startsWith(`${files.root}${sep}`)) await rm(temporary, { force: true }).catch(() => {});
    }
  }
}
