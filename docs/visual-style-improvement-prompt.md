# Independent visual style improvement prompt

Use this standalone prompt to redesign the existing Claude Managed Agents learning platform. It describes the supplied screenshot so the task remains usable without the image. If the reference image is available, use it alongside these instructions. This prompt adds a separate presentation task; it does not create or renumber a lesson.

COPY PROMPT START

## Objective and current application

Improve the visual style of the existing application in `C:\claude-managed-agents` using the supplied learning-platform screenshot as visual direction. Implement a polished, readable guided learning workspace across all registered lessons. Preserve Labs 01 through 11 and apply the shared design consistently to future lessons. Keep React, Vite, strict TypeScript, Express, Zod and the installed official Anthropic SDK. Read project instructions, README, package and lock files, lesson registries, shared components, current styles and the latest checkpoint before editing. Work on a dedicated visual-style branch in the current repository and preserve unrelated changes.

## Reference direction

The reference shows a near-black application canvas, a dark persistent sidebar, a compact breadcrumb bar, a lesson title and numbered lab navigation. That numbered grid is superseded by the 21 October 2026 navigation revision below. Its main workspace has a narrow pale-blue learning column beside a wider exercise column. The exercise is framed in orange, with a red prompt panel, a blue response panel and a row of numbered colored learning steps. Small badges indicate readiness and activity. Additional explanation and code cards sit below the exercise.

Recreate this hierarchy, panel structure and accent language with a contemporary finish. Keep the product name Claude Managed Agents Learning and the existing Anthropic execution stack. The reference's OpenAI branding, provider examples, lesson count and URL are examples from another application; use this application's real data and routes. Adapt the screenshot's spacing and proportions for readable text. Avoid reproducing its tiny fonts or large unused black margins.

## Typography and design tokens

Preserve the 20px root font size. Use approximately 20px body text, at least 16px essential navigation and secondary text, and approximately 18px code. Use relative rem or em sizing, clear heading levels and comfortable line spacing. Prefer an existing or system font stack; do not add an external font download unless needed and authorized. Make the main lesson title visually dominant without overwhelming the controls.

Define shared CSS tokens for background, sidebar, surfaces, text, muted text, borders, focus, blue, orange, red and success states, plus spacing, radius and shadow scales. Use blue for learning and responses, orange for the exercise frame, and red for the prompt-panel identity. Reserve error messages for actual failures; the red prompt header must not falsely imply an error. Use a quiet near-black backdrop with distinct panel surfaces in dark mode, and a coherent light theme. Maintain readable contrast in both themes and communicate state with text or icons as well as color.

## Course shell and navigation

Create a persistent desktop sidebar around 300-340px wide, with product identity, Home or Start here, lesson search, accessible topic groups, numbered lesson links and a clear selected state. Preserve the existing topic and lesson-order navigation, keyboard behavior and search. On small screens, use the existing accessible drawer pattern with focus return and Escape handling.

Use a compact top bar for breadcrumbs, theme controls and an accurately labeled lab status. Use the searchable desktop sidebar or mobile menu and previous/next links below the lesson to change lessons. Do not render a duplicate Lab 01-75 button grid or numbered lesson strip above the main workspace. Keep the lesson heading, guide shortcuts and all lesson workspace tabs, including infographic views. The page itself must not overflow. Preserve routes such as `/?lesson=11` and browser Back/Forward navigation. Do not copy the reference's `#lab1` routing or hardcoded course categories.

## Guided lesson workspace

Keep Learn, Run the exercise and TypeScript source available with their current accessible tab behavior. When Run the exercise is selected on a wide screen, show a left learning panel around 320-380px wide and the actual exercise in a wider right panel. Give both numbered headers: Understand the lab and Do the exercise. Use a fluid content width around 1200-1440px and sensible gaps rather than a tiny centered workspace.

The learning panel should show the registered objective, prerequisites, authored steps, guide and student challenge. Include a clear current step and Previous/Next step controls only when they navigate actual authored guidance. Advancing guidance must not execute a model, approve a tool or mark a lab completed. A Show me where control may focus or scroll to a real related control; include it only when a reliable mapping exists. Keep guide text selectable and long explanations expandable. On tablet and phone widths, stack the panels in reading order and keep the exercise controls easy to reach.

## Exercise and answer panels

Place the real controls inside a clearly titled exercise card. Group prompt input, scenario selection, examples, primary action and cancellation controls according to each lesson's existing functionality. Add numbered colored panel headers, clear field labels, generous input padding, visible validation and distinct disabled states. Examples must populate the input without executing it. Use the red prompt treatment and blue answer treatment when a lesson actually has those sections; do not force every tool, permission, session or skills exercise into a chatbot form.

Create useful empty, loading, streaming, completed, paused, cancelled and failed states using actual host state. Render ordinary assistant Markdown safely as readable paragraphs, headings, bold text, lists and code blocks, including the Lab 11 Observation, Conditions and Follow-up answer. Reuse a suitable existing renderer where possible, with escaped raw HTML, safe link protocols and no script execution. Preserve the exact authoritative text for copying and inspection. Keep streaming previews separate from final messages and avoid reparsing that changes lifecycle evidence.

## Progress and explanation cards

Use the reference's numbered learning progression as a presentation of each lesson's real steps. Make cards wrap rather than shrink their text. If verified learner-completion tracking already exists, use it. Otherwise label counts as implemented lessons or guidance steps, and avoid fabricated Complete badges or success percentages. Viewing a page, advancing a guide or running a fixture must not silently count as paid live success.

Show code examples, limits, setup notes and student challenges in readable secondary cards below the workspace. Keep code copy buttons, wrapping and scoped horizontal scrolling. Put long technical evidence in labeled expandable sections with concise summaries. Keep essential run, stop, failure and cleanup state visible rather than hiding it inside JSON.

## Preserve lesson evidence and behavior

Preserve all API contracts, strict validation, ownership, concurrency, budgets, deadlines, version pins, cancellation and remote cleanup behavior. Reuse shared components and ports. Do not provision resources or start paid runs from rendering, navigation, examples, screenshots, tests or application startup. Live actions remain deliberate clicks. Keep credentials and resource manifests server-side and excluded from Git and distribution. Keep the actual Vite port fallback and API proxy behavior.

Lab 10 must retain its readable project, summary, risks and next steps, optional exact JSON, corrective-round bounds, retained-session identity and distinction between interrupt, local abort and idle close. An idle retained session must not appear active. Lab 11 must separate configured metadata, raw resolved version, verified canonical pin, observed instruction reads and reference reads. A host preview is not an agent read. Preserve truthful usage scopes, unknown measurements and pending-cleanup states. Existing numbered lessons must remain functional; a shared visual redesign is not a new Lab 12.

## Accessibility and responsive behavior

Use semantic landmarks, headings, labels, buttons, status announcements, accessible tabs and clear keyboard focus. Support keyboard-only operation, reduced motion and browser zoom at 200%. Provide practical touch targets around 44px. Avoid sticky bars covering focused controls or headings. Check widths of 320, 390, 768, 1280 and 1920px. Ensure readable long answers, expanded JSON, code, menus and modal or drawer states without horizontal page overflow. Use restrained motion and no autoplay. Voice guidance shown in the reference is optional: preserve any existing feature, but do not add voice services, audio generation or paid dependencies just to reproduce a button.

## Implementation and validation

Implement the redesign in shared shell, navigation, workspace, form, output and evidence components, with reusable CSS tokens. Add per-lesson adaptations only where the actual exercise structure requires them. Avoid a new UI framework or backend redesign unless the existing code provides a concrete reason. Update README with the implementation sequence and files for this separate visual task.

Run typecheck, the lesson guide audit, relevant offline regressions, existing navigation checks, and focused browser checks for layout, theme, keyboard behavior, safe Markdown, live-action gating and long evidence. Use fixtures or injected local responses for every browser demonstration. Exercise representative text, tool, approval and retained-session lessons plus Labs 10 and 11. Run the production build, then the distribution scan after the build finishes. Inspect desktop and phone screenshots in both themes and fix clipping, crowded controls and unreadable text. A matching screenshot alone is not proof that a lesson's behavior still works.

## Completion and publication

Deliver the working redesign and a concise record of the shared components changed, actual checks run, screenshots reviewed and any remaining limits. Commit and push the validated visual-style branch to the current private repository, preserving historical lesson checkpoints and the updated prompt workbook. Verify the published commit matches the local one. Do not deploy, merge the branch or publish a hosted site unless separately requested. Leave the requested local application running and report the actual localhost URL. Do not claim live provider verification or new learner completion from fixture results.

COPY PROMPT END

## TypeScript source appearance revision - 21 October 2026

Across Labs 01-75, render the TypeScript source code on a pure black (#000000) background in both light and dark themes, with light default text, readable syntax colors and muted but legible line numbers. Scope this styling to the source viewer; retain file selection, copy, supporting imports and existing code wrapping/scrolling. Verify computed background and text colors in both themes and check desktop and phone layouts.


## Six-colour visual style revision - 21 October 2026

Use the complete [copyable six-colour implementation prompt](student-build-prompts/12-six-colour-visual-style.md), also embedded in curriculum step P01 and WORKBOOK.md. It supersedes the earlier blue-primary-only styling guidance with consistent red, orange, yellow, green, blue and purple families, theme-specific contrast tokens and stable section/view identities. Preserve the black TypeScript source panels, navigation, accessible states and all lesson behavior. The generated student prompt ZIP includes this prompt so learners can reproduce the change later.


## Home portal presentation revision - 21 October 2026

Replace the old Home text introduction with the instructor-style portal banner titled **Claude Managed Agents Learning Portal**. Follow the complete [student implementation and artwork prompt](student-build-prompts/13-home-portal-banner.md), also included in P01 and WORKBOOK.md. Use the local instructor asset, preserve accessible and phone-readable HTML text, keep an honest fallback for partial catalogs or missing artwork, retain Start navigation, and include the image in course source packages.
