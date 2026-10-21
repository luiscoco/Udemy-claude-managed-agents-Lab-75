# Accessible TypeScript code reading controls

Font size, wrapping and full-screen reading. Also included in P21.

COPY PROMPT START

````text
Improve the existing narrated TypeScript source reader shared by all 75 labs. Build on P20 and preserve one narrated main concept file per lab, the black source background, source selection/copy, readable transcripts, exact source/media identity checks and no-key local MP3 playback. Do not alter lesson execution or introduce provider requests.

Add a labeled Code font size selector offering 14, 16, 18, 20 and 24px, default 18px. Add a Wrap code toggle with aria-pressed, enabled by default. Wrapped code fits the source panel; unwrapped code scrolls horizontally inside that panel without widening the page. Line numbers, syntax and copying retain their meaning. Recalculate the timed red rectangle from actual rendered source-line geometry after font changes, wrapping, scrolling and resizing; do not approximate line height from the font size.

Add Enter full-screen code and Exit full-screen code controls. The expanded reader fills the app viewport as an accessible named modal dialog, retains code font/wrapping controls and provides Play or Pause/Resume plus Previous/Next explanation and Follow controls. Lock background scrolling while open, keep keyboard focus inside the reader, support Escape to exit and restore focus to the opener. Restore background scroll behavior on exit, view change and unmount. Keep controls and source reachable on 320px phones and short landscape windows. Full-screen reading must not restart or duplicate audio. Keep red rectangles aligned while playing or paused and after seeking. When Follow is enabled, reveal the current code in the active reader, accounting for its controls; when disabled, cue changes preserve manual page and code scroll positions. Fit available height even with Follow disabled.

Test actual local MP3 playback through a cue boundary after changing font and wrap, red overlay bounds, horizontal scrolling with wrap disabled, no page overflow, full-screen focus containment, Escape/focus restoration, source-view switching and short/mobile layouts. Verify both themes, typecheck, production build and relevant code/guide regressions. Record only observed results. Update this copyable prompt, P21, workbook, parity checklist and prompt ZIP; keep matching media reference JSON current. This prompt does not authorize billed generation, live lab execution, external messages or publication.
````

COPY PROMPT END
