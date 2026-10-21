# Professional learning portal refinements

The shared `src/learning-polish.css` layer follows the six-colour palette in the app and framework browser harness. It preserves the black shell, source backgrounds and coloured destination identities.

- Typography: 20px body, 18px labels/buttons, 28px section headings, 22.4px subsection/disclosure headings; heading weight 750. The floating guide retains compact controls.
- Reading: explanatory paragraphs and prose lists are limited to 70ch. Code, tables, inputs, artwork and the overall workspace retain their available width.
- Cards: 12px radius, responsive 16?24px main padding, 16px inner padding, 24px section spacing and 12px action gaps.
- Actions: primary work stays solid; supporting Copy, Cancel, guide navigation and lesson shortcuts are outlined using an explicit class. The five Course progress controls retain their distinct fills. Shell shortcuts use light text colours in both themes.

The copyable [professional style prompt](student-build-prompts/14-professional-learning-style.md) is embedded in [P01](student-build-prompts/steps/P01.md), the workbook and the regenerated student prompt ZIP. Ordinary inline links remain underlined, focus indicators remain visible and touch targets remain at least 44px high.

## Verification on 21 October 2026

Typecheck and production build passed. All 20 selected existing browser checks passed: visual layout, workspace keyboard/copy/lazy-loading behavior, Start here, backup, guide scrolling and recorded narration playback. After the final phone guide-label adjustment, all seven guide checks passed again against the production build.

Production layout checks passed at 320, 390, 768, 1280 and 1920px in both themes, covering Home, Exercise, Source and the floating guide, with a separate 200% text-enlargement check. Checked reading widths, representative primary/secondary text contrast, 44px guide controls, local icon loading, black source backgrounds, no page overflow and zero automatic exercise POSTs. Screenshots were inspected for desktop and phone layouts. This is scoped regression evidence, not a full accessibility certification or a new live-provider acceptance run.
