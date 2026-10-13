import { lab04Toolset } from '../../shared/lab04-permissions.js';
import type { Lab04ParsedRequest } from '../../shared/lab04-permissions.js';
import { createPlanFixture } from './lab03-fixtures.js';
import type { PlannedCall } from './lab03-fixtures.js';
import { fixtureFiles } from './lab03-sandbox.js';
import type { Sandbox } from './lab03-sandbox.js';

/**
 * Authored offline plans. The simulator pauses at every always_ask call and waits for a real host
 * decision; it never adapts its plan, so a denial is acknowledged but not worked around.
 */
const notes: PlannedCall = { tool: 'read', input: { file_path: '/mnt/session/uploads/notes.md' } };
export const lab04Plans: Readonly<Record<Lab04ParsedRequest['scenario'], readonly PlannedCall[]>> = Object.freeze({
  'review': [
    notes,
    { tool: 'write', input: { file_path: '/mnt/session/outputs/draft.md', content: fixtureFiles['draft.md'] } },
    { tool: 'edit', input: { file_path: '/mnt/session/outputs/draft.md', old_string: 'Status: draft', new_string: 'Status: reviewed' } },
    { tool: 'edit', input: { file_path: '/mnt/session/outputs/draft.md', old_string: 'Reviewer notes are in notes.md.', new_string: 'Approved by the reviewer.' } },
    // The host's "only draft.md" rule means a reviewer cannot allow this one; it can only be denied or expire.
    { tool: 'write', input: { file_path: '/mnt/session/outputs/summary.md', content: '# Summary\n\nThe draft was reviewed.\n' } },
  ],
  'preallowed-only': [notes, { tool: 'glob', input: { pattern: '*.md', path: '/mnt/session/uploads' } }],
});

export function createLab04Fixture(request: Lab04ParsedRequest, sandbox: Sandbox, stepMs = 80) {
  return createPlanFixture(lab04Plans[request.scenario], lab04Toolset, sandbox, stepMs, { acknowledgeDenials: true });
}
