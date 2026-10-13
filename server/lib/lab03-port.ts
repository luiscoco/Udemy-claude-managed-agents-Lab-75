import type Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { buildToolset, lab03RequestSchema } from '../../shared/lab03-tools.js';
import type { Lab03Request, Lab03Toolset } from '../../shared/lab03-tools.js';
import { createToolFixture } from './lab03-fixtures.js';
import type { Sandbox } from './lab03-sandbox.js';
import { createFixtureToolSessionPort, createLiveToolSessionPort, toolSessionParams } from './tool-session-port.js';
import type { MountedFile, ToolSessionPort, ToolSessionSpec } from './tool-session-port.js';

export { effectiveToolsFrom } from './tool-session-port.js';
export type { EffectiveTool, OutputReport } from './tool-session-port.js';
/** Lab 03 uses the shared tool-session boundary unchanged. */
export type Lab03Port = ToolSessionPort;

function lab03Spec(input: Lab03Request): ToolSessionSpec {
  const request = lab03RequestSchema.parse(input);
  return { label: 'Lab 03', title: `Lab 03 built-in tools (${request.preset})`, toolset: buildToolset(request.preset, request.removeTools),
    deadlineSeconds: request.deadlineSeconds, budgetCents: request.budgetCents };
}

/** Exactly what session creation sends. Tools come only from the lab toolset; nothing else is translated. */
export function lab03SessionParams(input: Lab03Request, fileIds: Record<MountedFile, string>, env = process.env): SessionCreateParams {
  return toolSessionParams(lab03Spec(input), fileIds, env);
}

export function createLiveLab03Port(input: Lab03Request, sandbox: Sandbox, sdk?: Anthropic, env = process.env): Lab03Port {
  return createLiveToolSessionPort(lab03Spec(input), sandbox, sdk, env);
}

/** Offline port: no network, credentials or charges. `calls` records the call order for tests. */
export function createFixtureLab03Port(input: Lab03Request, sandbox: Sandbox, stepMs = 80): Lab03Port & { calls: string[]; toolset: Lab03Toolset } {
  const request = lab03RequestSchema.parse(input);
  const toolset = buildToolset(request.preset, request.removeTools);
  return createFixtureToolSessionPort({ toolset, budgetCents: request.budgetCents, idPrefix: 'sesn_fixture_lab03' },
    createToolFixture(request, toolset, sandbox, stepMs));
}
