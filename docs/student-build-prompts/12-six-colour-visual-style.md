# Six-colour visual style improvement - 21 October 2026

Use this standalone prompt to upgrade an existing student app, or apply it with P01.

COPY PROMPT START

````text
Implement the six-colour visual style in the existing React learning app, preserving its routes, lessons, controls, API contracts, provider gates and saved student data. Read the existing styles and shared components first. Use red, orange, yellow, green, blue and purple as six consistent semantic families, not arbitrary colours by lesson number or DOM position.

Create src/colour-system.css and import it after the existing styles, visual-style and learning-guide styles in the main app; load the same palette in the framework browser harness. Define ink, tint and solid-fill tokens for each family. Use these light-theme ink/tint/fill values: red #b42335/#fff0f1/#b42335; orange #9a4209/#fff2e5/#a6470b; yellow #785600/#fff9db/#f2c94c; green #17623e/#eef9ef/#17623e; blue #185abc/#edf5ff/#185abc; purple #7139a6/#f7f0ff/#7139a6. Dark-theme ink/tint values are red #ffb0bb/#3d202b; orange #ffc08c/#3b291f; yellow #f6d76c/#342f1a; green #a1dfb8/#173329; blue #a6caff/#192d48; purple #d6b2ff/#30243e. Retain the solid fills in dark mode. Filled buttons use white text except yellow, which uses #352500. Check real computed text/background contrast; target at least 4.5:1 for ordinary text and 3:1 for controls and focus against adjacent surfaces.

Map blue to learning/guidance/responses/backups; orange to exercises/setup; yellow to walkthroughs/knowledge checks/review queues; green to progress/checklists/review/validation; purple to source/concept maps/learning paths/notebooks; red to milestones, the Home runtime boundary, worked experiment plans, prompt-input accents and explicitly labelled attention/errors. Red identity alone must not mean failure. Keep actual errors explicitly labelled and preserve role=alert. Add stable data-tone attributes when necessary. Tint cards lightly, use visible accent borders and match button/shortcut accents to destinations. Keep long text neutral and readable, a pure black app canvas, header, sidebar, drawer and workspace tab strip (--shell and --shell-panel #000000), neutral charcoal dark surfaces (#171717), black dark input backgrounds and neutral grey borders, and the existing 20px root font.

Give the five Course progress controls distinct fills: Learning paths purple, Review queue yellow, Milestone projects red, Open learning backup blue and Validation results green. Match milestone and backup card/shortcut accents to their destinations.

Colour the five workspace tabs by meaning: Learn blue, Run the exercise orange, TypeScript source purple, Concept map purple and Lab walkthrough yellow. Preserve tab roles, labels, aria-selected, roving focus and keyboard navigation. Selected options also need a thick underline/inset border and bold text. Preserve disabled, hover and focus states; colour cannot be the only state cue. Keep all 75 TypeScript source viewers pure black (#000000) with light text and readable syntax in both themes. Do not recolour infographic artwork, audio highlight rectangles, or fabricate completion/provider success.

Use existing shared classes for cards, guidance, review, source, notes, backup and paths; avoid 75 separate lesson edits or a new UI framework. Preserve responsive layouts at 320, 390, 768, 1280 and 1920px, 44px touch targets, 200% zoom and reduced motion. Check desktop and mobile, light and dark themes, keyboard focus, tab selection, notes/checklists and black source panels. Inspect screenshots, verify contrast from computed styles, run typecheck and production build, and run relevant existing browser regressions with offline data. Opening pages/tabs must not submit exercise POSTs, start audio, contact providers or alter completion. Record actual checks and limits. Do not provision, run billed scenarios, commit/push, merge, deploy or publish solely because this student prompt was copied.
````

COPY PROMPT END
