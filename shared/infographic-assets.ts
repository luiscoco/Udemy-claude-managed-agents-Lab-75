import { z } from 'zod';
const hex = z.string().regex(/^[a-f0-9]{64}$/);
const stem = '(?:1|12|65)-(?:concepts|lab)-[a-f0-9]{16}';
export const infographicAssetSchema = z.strictObject({
  image: z.strictObject({ file: z.string().regex(/^infographics\/lab-(?:01|12|65)-(?:concepts|lab)\.png$/), sha256: hex,
    width: z.number().int().min(640).max(4096), height: z.number().int().min(480).max(4096) }),
  contentSha256: hex, text: z.string().min(1).max(2000),
  recording: z.strictObject({ file: z.string().regex(new RegExp(`^audio/infographics/visual-${stem}\\.mp3$`)),
    timingFile: z.string().regex(new RegExp(`^audio/infographics/visual-${stem}\\.json$`)), sha256: hex,
    durationSeconds: z.number().finite().positive().max(600) }),
});
export const infographicManifestSchema = z.strictObject({ version: z.literal(1), provider: z.literal('inworld'),
  voiceId: z.string().min(1).max(200), modelId: z.string().min(1).max(100),
  assets: z.record(z.string().regex(/^(?:1|12|65):(?:concepts|lab)$/), infographicAssetSchema) });
export type InfographicAsset = z.infer<typeof infographicAssetSchema>;
export type InfographicManifest = z.infer<typeof infographicManifestSchema>;
