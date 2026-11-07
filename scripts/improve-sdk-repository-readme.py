"""Make the independent student repository's entry point usable for new learners."""
from pathlib import Path
import json,re,subprocess

R=Path(__file__).resolve().parents[1]
S=R/'presentations/agent-sdk-platform-architecture/github-repo'
old=(S/'README.md').read_text(encoding='utf-8')
history=S/'DEVELOPMENT_HISTORY.md'
if not history.exists():
    history.write_text('# Development history and lesson-specific notes\n\n'
        '> Archived README from commit `0465f1d`. These dated checkpoints preserve implementation history and specialized lab instructions. '
        'For current onboarding and release scope, start with [README.md](README.md). Earlier “next checkpoint” and “continue with” statements are historical.\n\n'+old,encoding='utf-8')
readme='''# Claude Agent SDK Student Learning Platform

Learn how agents work by running exercises, inspecting TypeScript, and checking observable results. This repository contains a **local learning platform with 75 implemented lesson runtimes**, guided learning materials, an AI Tutor, and **three runnable milestone starters**.

It is the independent student-guide rebuild of the Claude Agent SDK learning experience. Use the completed platform to explore the lessons, or follow the supplied specifications and prompts to build your own version incrementally.

![Claude Agent SDK learning platform course artwork](public/claude-agent-sdk-learning-hero.png)

## Start here

| Your goal | Where to go |
| --- | --- |
| Run the supplied application | [Quick start](#quick-start) |
| Complete your first exercise | [Run your first lesson](#run-your-first-lesson) |
| Explore the learning features | [What you can do](#what-you-can-do) |
| Rebuild the platform yourself | [Student build materials](#student-build-materials) |
| Find the implementation | [Repository map](#repository-map) |
| Check your changes | [Verification](#verification) |
| Understand release scope and older checkpoints | [Scope and implementation history](#scope-and-implementation-history) |

## Quick start

Install **Node.js 24.x** and Git. The project engine requires `>=24 <25`. These commands work in PowerShell; use your normal shell's equivalent on other supported environments.

```powershell
node --version
npm --version
git clone https://github.com/luiscoco/Udemy-Claude-Agent-SDK-Student-Rebuild.git
cd Udemy-Claude-Agent-SDK-Student-Rebuild
npm ci --include=optional
npm run dev
```

Open **http://localhost:5180/** after the terminal reports that the development frontend is ready. No API key is needed to start the platform or use prepared exercises.

| Process | Default address | Configuration |
| --- | --- | --- |
| Student frontend | `http://localhost:5180/` | `STUDENT_WEB_PORT` |
| Local Express host | `http://127.0.0.1:3077/` | `STUDENT_API_PORT` |

`npm run dev` starts both processes. The frontend first builds complete bundles, watches for changes, and serves them through Vite preview. It reloads after a completed rebuild. Use `npm run dev:hmr` if you specifically want the alternative Vite HMR workflow.

Vite proxies `/api` to the local host. Both processes read the student port settings from `.env`; configure them together if the defaults are occupied. Ports are strict, and legacy `PORT` is ignored. Stop your own development terminal with **Ctrl+C** before restarting.

## Run your first lesson

1. Open the course home and choose **Start with lesson 1**, or select Lesson 1 from the course navigation.
2. Read the learning guide and inspect the concept map or lab walkthrough.
3. Open **Run the exercise** and keep the prepared scenario selected for your first attempt.
4. Run the exercise. Inspect the streamed observations, final result, and the lesson's evidence check.
5. Open **TypeScript source** to connect the displayed behavior to its implementation. Record your notes and review any manual assessment separately.

Prepared fixtures emit explicitly scripted observations and may perform real, owned local host actions. They are **not live model responses**. A passing prepared check does not prove that a paid Claude call or an external integration succeeded.

### Optional Live Claude exercise

Prepared learning is available without credentials. For a live exercise:

1. Copy `.env.example` to an ignored `.env` file in the repository root.
2. Configure your own `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` on the backend, then restart the host.
3. Choose **Live Claude**, review the selected lesson's tools and limits, and explicitly authorize one request.
4. Inspect the returned evidence and outcome. Review errors, cancellations, and incomplete results as distinct outcomes.

Keep credentials out of browser code, screenshots, Git commits, and support messages. The first query uses `maxTurns: 1` and `maxBudgetUsd: 0.05`; these are SDK controls, not a promise of exact billing. Other lessons use different policies. The core query route has a 45-second deadline; do not assume this policy applies to every specialized runtime.

## What you can do

| Feature | Student experience |
| --- | --- |
| 75 lesson runtimes | Explore agent queries, messages, tools, permissions, sessions, hooks, MCP integrations, and advanced execution surfaces. |
| Guided lesson workspace | Move between learning material, concept maps, walkthroughs, exercises, and TypeScript source. |
| Source and visual learning | Read code excerpts, narrated source tours, infographics, and supplied media. Image views support zoom, Fit, scrolling, and pan. |
| Evidence-based exercises | Compare observations with lesson-specific criteria. Automatic checks and manual self-assessment remain separate. |
| AI Tutor | Use prepared guidance, or select an available model and authorize an optional paid answer grounded in the current lesson. |
| Saved learning | Keep supported notes, attempts, quizzes, preferences, and check summaries locally. |
| Appearance controls | Switch Light/Dark appearance and adjust text size for readability. |
| Milestone starters | Launch a Study Coach, Agent Evaluation Studio, and Agent Publishing Studio, then follow their staged implementation prompts. |

The three milestone starters are runnable starting points. **M01–M22 are stages of student work, not 22 completed project submissions.** Their current scope is described in the release documents linked below.

### Where your data lives

- Browser storage holds supported learning records and preferences. They do not automatically synchronize between devices.
- The local host owns ignored lab data under `.data/lab/`. Session persistence differs by lesson; some registries reset when the host restarts.
- Completed live AI Tutor answers can be explicitly saved to `.data/lab/ai-tutor.sqlite`. Their access is scoped by a browser-held identifier; clearing browser storage loses access to those saved answers.

This is a loopback-only teaching application for a trusted local student. Account authentication, secure multi-user hosting, cross-device synchronization, and managed backups are outside its scope.

## Student build materials

Use the current Markdown contracts and implementation sequence when rebuilding:

1. [Materials-only build order and UI alignment](docs/Student_UI_Alignment.md).
2. [Student experience prompt sequence](docs/prompts/student-experience-sequence.md).
3. [Implementation prompt library](docs/prompts/): individually numbered lesson prompts, shared platform features, AI Tutor, milestone stages, and guided steps.
4. [Product specification](specs/product.md) and [requirements-to-evidence traceability](docs/validation/traceability.md).
5. [Guide gaps and implementation decisions](docs/validation/guide-errata.md).

The [supplied teaching guide](docs/student-materials/Specifications_First_Platform_Teaching_Guide.docx) and [its provenance](docs/student-materials/provenance.json) document the source material. The [Word implementation-order guide](docs/Student_Prompt_Implementation_Order.docx) is a historical companion; the current Markdown prompts and UI contract govern the latest navigation and behavior.

The runtime source was independently implemented for this rebuild. Prior familiarity with the reference platform means this exercise does not replace a fresh student trial.

## Repository map

| Location | Responsibility |
| --- | --- |
| `src/` | React interface, lesson workspaces, source views, and browser learning state. |
| `server/` | Express routes, Agent SDK runtime adapters, permissions, local stores, AI Tutor, and project launchers. |
| `shared/` | Shared request contracts, lesson definitions, and evidence criteria. |
| `public/` | Course images, audio, infographics, and visual learning assets. |
| `docs/prompts/` | Copyable student build and lesson implementation prompts. |
| `docs/validation/` | Dated validation evidence, limitations, and release scope. |
| `specs/` | Product and lesson behavior specifications. |
| `tests/` and `scripts/` | Automated checks, browser checks, development tools, and explicit live runners. |
| `mini-projects/` | Three runnable milestone starters and their supporting material. |
| `python-sdk/` and `ide-extension/` | Specialized Python and editor-integration learning surfaces. |
| `fixtures/` | Authored inputs and local test fixtures. |
| `.github/workflows/` | Continuous-integration workflows. |

### Technology baseline

Install the committed lockfiles instead of independently upgrading dependencies while following a lesson.

| Dependency | Pinned version |
| --- | --- |
| Primary `@anthropic-ai/claude-agent-sdk` | `0.3.310` |
| React and React DOM | `19.3.0` |
| Vite | `8.3.0` |
| Express | `5.2.1` |
| TypeScript | `7.0.2` |
| Zod | `4.6.5` |
| Playwright | `1.61.1` |

The separate direct API client `@anthropic-ai/sdk` is `0.135.0`. Lesson 41 retains the historical `claude-agent-sdk-v2` alias at `0.2.141`; Lesson 70 separately pins Python `claude-agent-sdk==0.2.173`. These packages have different roles and version lines. See [package.json](package.json), [package-lock.json](package-lock.json), and the specialized lesson instructions before changing them.

The Agent SDK operates the agent runtime in a process run by this application. The remote model service supplies reasoning; local host/tool execution and evidence remain distinct responsibilities. This repository teaches the **Claude Agent SDK**, rather than the separate Claude Managed Agents hosted-session API.

## Verification

Run checks appropriate to your changes:

```powershell
npm run typecheck
npm test
npm run build
npx playwright install chromium --only-shell
npm run test:home-startup
npm run test:ui
```

The browser checks start their own test hosts; a development server is not required. They use controlled local fixtures and do not authorize paid model calls. On Linux/WSL2, browser libraries may require `npx playwright install --with-deps chromium --only-shell`.

For a focused interface change, consult the matching scripts in [package.json](package.json), such as `test:ui:themes`, `test:ui:home-polish`, or `test:ui:ai-tutor`. Live validation uses separate, explicitly opted-in runners. Read the selected runner's instructions and budget before invoking it; do not treat an offline pass as live acceptance.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Node/npm does not resolve or engine mismatch | Select an installed Node 24.x with your version manager, then open a fresh terminal. |
| Port is already in use | Stop your own earlier course process, or set both student ports in `.env`. Do not terminate unrelated applications. |
| Initial page is not ready | Wait for the initial complete build and backend-ready message. Check both server and frontend terminal output. |
| Browser shows stale content | Restart after configuration changes and refresh the printed URL in Chrome or Edge. Keep `.env` and saved progress intact. |
| Live exercise is unavailable | Check backend configuration, restart the host, and supply fresh UI consent. Do not paste keys into the browser. |
| A scenario needs manual review | Read that lesson's evidence rule; some discovery, first-run, and limit demonstrations intentionally do not meet a narrow automatic success criterion. |
| Browser tests cannot launch | Install Playwright Chromium and any required Linux browser libraries. |

For deeper startup repairs, see the [copyable repair prompt](docs/prompts/startup-repair.md) and [startup validation notes](docs/validation/startup-fix.md).

## Scope and implementation history

- [Current course release scope](docs/validation/release-scope-2026-10-26.md).
- [Udemy publication items still requiring sign-off](docs/validation/udemy-release-pending-2026-10-26.md).
- [Dated development history and lesson-specific instructions](DEVELOPMENT_HISTORY.md), including specialized live runners, platform boundaries, and checkpoint reports.

Release records describe their recorded environment and date. Their presence does not establish that every live integration has just been retested on your machine. Student project stages, course publication, and runtime validation remain separate forms of evidence.
'''
(S/'README.md').write_text(readme,encoding='utf-8')
tree=set(subprocess.check_output(['git','-C',str(S),'ls-tree','-r','--name-only','HEAD'],text=True).splitlines())|{'DEVELOPMENT_HISTORY.md'}
links=re.findall(r'\]\(([^)]+)\)',readme)
missing=[p for p in links if not p.startswith(('http','#')) and p not in tree and not any(t.startswith(p.rstrip('/')+'/') for t in tree)]
assert not missing,missing
pkg=json.loads((S/'package.json').read_text(encoding='utf-8'))
for command in re.findall(r'npm run ([a-z0-9:-]+)',readme):assert command in pkg['scripts'],command
assert all(v in readme for v in ['0.3.310','5180','3077','M01–M22','dev:hmr'])
print(f'Updated README: {len(readme.splitlines())} lines; {len(links)} links and all documented npm run commands checked. Original README preserved in DEVELOPMENT_HISTORY.md.')
