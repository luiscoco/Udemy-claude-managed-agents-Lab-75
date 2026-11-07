# AI Tutor

Every lab has an **AI Tutor** tab. Its six prompts explain the exercise, connect concepts to source, outline steps, offer a hint, describe expected evidence or show an actual TypeScript excerpt. Prepared guidance works without an API key and makes no model requests. It follows the selected topic rather than answering custom wording.

For a tailored response, choose **Live Claude**, select an available model and authorize one paid question. The backend uses `ANTHROPIC_API_KEY`; no key reaches the browser. Set `AI_TUTOR_LIVE_ENABLED=false` to disable live answers. It defaults to available when a key exists; an explicit value must be `true` to enable it. This setting is independent of `MANAGED_LIVE_ENABLED` and does not enable lab execution.

Live questions use the installed Anthropic SDK's Messages API with no tools, no automatic retry, a 45-second local deadline, at most 4,096 output tokens and at most two concurrent questions. Replies are requested under 500 words, with code examples under 12 lines. If Claude reaches the output limit, its text is shown with a partial-answer warning and cannot be saved as a completed answer. The server also limits admission to twelve live requests per minute. Model discovery is read-only and cached for five minutes. The tutor does not create agents, run exercises, read arbitrary student files or approve effects. Stop and leaving the lab abort the local provider request; a request already accepted may still be billed. Token usage is shown when returned. The Messages API does not return a monetary cost, so the UI does not invent one or claim a dollar spending cap.

The context comes from this course's authored objectives, steps, knowledge-check explanations, experiment evidence and an allowlisted source excerpt. The full source digest is included in the saved context identity. Tutor text uses the application's existing Markdown/code renderer; raw HTML and unsafe links are not executed.

**Save this answer** stores a completed live response in `artifacts/ai-tutor/ai-tutor.sqlite`. A single-use, short-lived server token binds the saved answer to the generated text, lab and browser. Reopening and removing saved answers makes no model requests. The browser retains a random identifier in local storage; clearing it loses access to that browser's saved answers. This is local browser isolation, not production user authentication. Each browser can save up to 100 answers per lab. The UI flags answers when their lesson context has changed. The database stays outside Git.

Reference: [AI Tutor in the Student Rebuild repository](https://github.com/luiscoco/Udemy-Claude-Agent-SDK-Student-Rebuild/blob/main/src/AiTutor.tsx). The suggested prompts, explicit live consent, model selection and durable saved-answer workflow follow that implementation. This course uses its existing Messages API SDK rather than introducing an Agent SDK process or borrowing Managed Agents session credentials.

Validation:

```powershell
npm run typecheck
npm run test:tutor
node scripts/run-browser-tests.mjs ai-tutor.spec.ts
```

API and browser tests use fake provider responses for live flows. They do not spend API credits. Browser tests also exercise real prepared guidance on both capstones.
