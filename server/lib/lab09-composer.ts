import { lab09RequestSchema } from '../../shared/lab09-system-prompts.js';
import type { Lab09Composition, Lab09Request } from '../../shared/lab09-system-prompts.js';

// This constant is deliberately authored and reviewed with the host code. No disk path, upload or user project text is accepted.
export const lab09ProjectContext = Object.freeze({ id: 'aurora-finch-v1' as const, filename: 'fictional/CLAUDE.md' as const,
  text: '# Aurora Finch\n\nFictional project: a community bird observation notebook.\nNext release priority: offline observation capture and accessible forms.\n',
  provenance: 'authored host allowlist' as const, automaticallyLoaded: false as const, systemMessageEnabled: false as const });
export function composeLab09(input: Lab09Request, baseSystem: string | null): Lab09Composition {
  const request = lab09RequestSchema.parse(input);
  if (baseSystem !== null && baseSystem.length > 5000) throw new Error('Base system exceeds Lab 09 composition bounds.');
  const inherited = request.variant === 'base'; const context = request.variant === 'base-plus-project-context';
  const suffix = context ? `Explicit host-selected project context (${lab09ProjectContext.filename}; ${request.contextId}):\n${lab09ProjectContext.text}` : request.append;
  const configuredSystem = inherited ? baseSystem : request.variant === 'custom' ? request.customSystem : [baseSystem, suffix].filter(Boolean).join('\n\n');
  return { variant: request.variant, overrideIncluded: !inherited, configuredSystem, baseSystem, contextId: context ? request.contextId : null,
    contextSource: context ? 'authored-host-selection' : 'none' };
}
