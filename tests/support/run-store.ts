import { RunStore as HostRunStore } from '../../server/lib/run-store.js';
import { scriptedPolicy } from '../../server/lib/policy.js';
import { fixtureWait } from '../../server/lib/scripted-adapter.js';
import type { FixtureWait } from '../../server/lib/scripted-adapter.js';
import type { QueryPort } from '../../server/lib/query-port.js';
import { fixtureResponse } from './lesson.js';
export class RunStore extends HostRunStore {
  constructor(port: QueryPort, now = Date.now, policy = scriptedPolicy, wait: FixtureWait = fixtureWait) {
    super(port, now, policy, wait, {
      verify: (input, output) => output === fixtureResponse(input.learnerName, input.prompt),
      result: (input, output) => ({ fixture: 'test-run', prompt: input.prompt, response: output, modelCalls: 0 }),
    });
  }
}
