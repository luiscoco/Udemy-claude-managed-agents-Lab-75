# Artwork provenance

Six original illustrated PNGs were created for the Managed Agents implementation using the **built-in image generation tool**, not the CLI fallback. This pilot adapts the visual-tab pattern from `luiscoco/Udemy-Claude-Agent-SDK-Learning-Platform-v2`; its Agent SDK images were not copied into these Managed Agents lessons.

Final assets: `lab-01-concepts.png`, `lab-01-lab.png`, `lab-12-concepts.png`, `lab-12-lab.png`, `lab-65-concepts.png`, `lab-65-lab.png`. Each image is 1672 × 941. The current revision follows the user's attached teaching-poster references: navy/orange headings, pastel panels, diagram-led explanations, wide process flows and a takeaway strip. The six generation/edit prompt histories and targeted corrections are in `prompts/`. All six final images were visually reviewed for their numbered regions, readable copy and alignment with the local teaching implementation. This is editorial review, not a claim of OCR or semantic certification.

Each image has a distinct content-specific astronaut pose: presenting a stream, operating the fixture, arranging messages, managing a queue, checking a proposal with a stop gesture, and inspecting a ledger with a magnifier. All astronauts use the same white spacesuit, blue accents and dark visor design.

The concept artwork was checked against session-event reconciliation and lifecycle outcomes, the Lab 12 queue and port contract, and the Lab 65 immutable proposal/reviewer/SQLite ledger boundary. Targeted edits corrected Managed Agents event names and lifecycle ordering, removed a provider event ID from the initial browser message, and aligned fictional approval examples with `CASE-2042` and the owner/case business key. The Agent SDK API and architecture claims in the style references were not imported.

The final measured region boxes live in `shared/learning-infographics.ts`; the differently sized panels replace the original uniform grid. `pilot-manifest.json` binds each final image hash and dimensions to the catalog content hash and its matching Inworld MP3/timing files. The six existing MP3 recordings and their actual WORD timings are preserved byte-for-byte; this image revision makes no Inworld requests. Audio narration uses authored explanatory text, not OCR of the image. Full text remains available in the app.

All images are illustrated teaching summaries. They do not prove a model call, remote session, external notification, human decision or effect took place. Actual exercise evidence is separate.

## Full-course expansion

The completed collection covers all 75 lessons: 150 original PNGs, 150 prerecorded Inworld MP3s and 900 timed regions. Published pairs are listed in `shared/infographic-published.ts`. Each additional pair uses the lesson's implemented objective, experiment steps, concept check, challenge and source paths. Detailed `Tab*.md` teaching references constrain diagram semantics. Generation prompts and any targeted corrections are saved alongside each final image in `prompts/`. The additional measured region boxes live in `shared/infographic-panel-bounds.ts`; native image dimensions are retained in the manifest.

Additional images use the same built-in image tool and varied content-specific astronaut poses. Every candidate is visually reviewed, corrected where needed and assigned measured panel bounds before its pair is published. The author-only narration command generates new Inworld MP3s with real WORD timings, verifies their hashes and FFmpeg decoding, and reuses completed recordings on resume. This expansion does make authorized author synthesis requests; students still make none. The original six pilot recordings remain unchanged.
