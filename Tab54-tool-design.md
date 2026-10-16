# Lab 54: Designing tools the model uses well

## Prerequisites

Complete the Acme Support Desk custom-tool and approval labs. This workshop calls the actual `propose_refund` host handler with fictional data. No API key, Managed session, billing or external write is needed. The installed `@anthropic-ai/sdk` 0.133.0 custom-tool type has a name, description and input schema; risk/effect annotations shown here are host metadata, not unsupported fields sent to the API.

## Controls

Switch between the vague and explicit contract and inspect the generated JSON Schema. Select invalid input, domain rejection, missing prerequisite or correct idempotent action and press **Call scripted tool**. **Run all four cases** displays the authored choice/recovery traces together. The vague variant needs a recovery step that names integer USD cents and the trusted review boundary; the explicit variant expresses those in its contract.

## Evidence to inspect

Both schemas come from Zod and are closed. The workshop linter checks the name/description, integer-cent unit, order ID pattern and closed object. The handler revalidates every `agent.custom_tool_use` input and returns one `user.custom_tool_result` keyed by its `sevt_` ID. The server's selected customer and conversation are not model arguments. Errors provide a safe recovery direction and leave the refund ledger unchanged.

In the correct action, the first proposal creates a pending approval. A repeated proposal returns the same stable business action key and pending approval, despite a different `sevt_` event ID. Trusted host approval issues one refund. A later replay is rejected because the action was already applied. The sandbox cannot change this local ledger through tool wording alone. Unused built-in tools, MCP and skills are outside the authored toolset.

## Troubleshooting

If the vague `amount` field seems to mean dollars, inspect the rejected input and recovery text; the handler accepts only `amountCents` as a positive integer. An undamaged order fails domain policy even with a perfect schema. A missing owned conversation fails before approval. A descriptive tool is guidance for model choice, never an authorization to bypass the host gate.

## Limitations

The displayed choices and recoveries are scripted examples. The workshop gives no synthetic model success score. A live comparison would require actual, separately opted-in model runs and report observed choices and provider usage. The installed Managed custom-tool type has no native annotation property; the risk and effect notes belong to this host workshop.

## Challenge

Rename the vague `amount` field to `amountCents` and make its description explicit about USD cents, prerequisites and approval. Predict which linter findings disappear and verify that the host still denies an undamaged order or duplicate effect.

## Run locally

```powershell
node --import tsx --test tests/lab54-tool-design.test.ts
npm run typecheck
npm run audit:lesson-guides
npm run test:lesson-guides
npm run build
node scripts/lab54-browser-demonstration.mjs
```
