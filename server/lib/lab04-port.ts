import type Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import { lab04RequestSchema, lab04Toolset } from '../../shared/lab04-permissions.js';
import type { Lab04Request } from '../../shared/lab04-permissions.js';
import type { Lab03Toolset } from '../../shared/lab03-tools.js';
import { createLab04Fixture } from './lab04-fixtures.js';
import type { Sandbox } from './lab03-sandbox.js';
import { createFixtureToolSessionPort, createLiveToolSessionPort, toolSessionParams } from './tool-session-port.js';
import type { MountedFile, ToolSessionPort, ToolSessionSpec } from './tool-session-port.js';

/** Lab 04 uses the shared tool-session boundary; only the toolset and labels differ from Lab 03. */
export type Lab04Port = ToolSessionPort;

function lab04Spec(input: Lab04Request): ToolSessionSpec {
  const request = lab04RequestSchema.parse(input);
  return { label: 'Lab 04', title: 'Lab 04 permissions', toolset: lab04Toolset,
    deadlineSeconds: request.deadlineSeconds, budgetCents: request.budgetCents };
}

/** Exactly what session creation sends: read/glob always_allow, write/edit always_ask, nothing else. */
export function lab04SessionParams(input: Lab04Request, fileIds: Record<MountedFile, string>, env = process.env): SessionCreateParams {
  return toolSessionParams(lab04Spec(input), fileIds, env);
}

export function createLiveLab04Port(input: Lab04Request, sandbox: Sandbox, sdk?: Anthropic, env = process.env): Lab04Port {
  return createLiveToolSessionPort(lab04Spec(input), sandbox, sdk, env);
}

/** Offline port: no network, credentials or charges. `calls` records the call order for tests. */
export function createFixtureLab04Port(input: Lab04Request, sandbox: Sandbox, stepMs = 80): Lab04Port & { calls: string[]; toolset: Lab03Toolset } {
  const request = lab04RequestSchema.parse(input);
  return createFixtureToolSessionPort({ toolset: lab04Toolset, budgetCents: request.budgetCents, idPrefix: 'sesn_fixture_lab04' },
    createLab04Fixture(request, sandbox, stepMs));
}
