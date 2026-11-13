---
name: ui-ux-review
description: Use when creating, changing, or auditing the To-Do List HTML/CSS interface, typography, spacing, contrast, responsive behavior, or accessibility.
---

# UI / UX Review

Use for UI implementation and visual/accessibility review. This skill supplements, but does not replace, the agreed rules in `PROJECT_BRIEF.md`.

## Workflow

1. Read the relevant parts of `PROJECT_BRIEF.md` (especially UI/UX, reference, composition, and accessibility sections). Read `docs/design-system.md` if it exists and is relevant.
2. Inspect the actual markup and affected ITCSS layers before editing. Do not assume the current implementation matches the documentation.
3. Preserve the ITCSS layer order and BEM naming. Put design tokens in the single token source; do not scatter duplicate color, spacing, typography, or radius values across components. When typography or other tokens change, update `css/settings/tokens.css` and `docs/design-system.md` in the same iteration, and record externally sourced decisions in `docs/typography-uprock-review.md`.
4. Apply typography and composition rules contextually:
   - default body text is around 16 CSS px;
   - longer text blocks should aim for a readable measure near 60–75 characters per line where the content/layout allows it;
   - body copy uses roughly 1.4–1.5 line-height; display headings may be tighter;
   - keep the type family count at or below three and use left alignment for long text;
   - use the approved 8px spacing rhythm (8 / 16 / 32 / 64) while allowing justified intermediate values for compact controls;
   - preserve whitespace and one clear visual dominant element; do not add UI simply to fill space.
5. Use the project's type contract (`docs/design-system.md`):
   - the project font is Inter, self-hosted in `fonts/` (SIL OFL 1.1, license text next to the files); no CDN, no font-loader script, no third-party font request;
   - type scale 12 / 14 / 16 / 28 px (the interface has a single heading level, `h1`), weights 400 / 500 / 600; weight 700 is not used in this interface;
   - the set of shipped font weights must match the weight tokens: a missing weight is silently replaced by the nearest available one and the design changes unnoticed;
   - negative letter-spacing only on the large heading (about −0.02em); keep normal tracking for 16 px body text and for Cyrillic uppercase labels, where negative tracking reduces legibility;
   - short micro-labels (e.g. the input label) are uppercase 12 px / 600 via `text-transform`, so the DOM text and the accessible name stay unchanged;
   - do not add other type families, display-scale headings (30 px and above), or a font CDN without an explicit licensing and scope decision.
6. Check foreground/background contrast for actual pairings, not color names. Meet WCAG 2.2 AA text contrast: 4.5:1 for normal text and 3:1 for large text. Treat the 44×44 CSS px touch target as this project's design target, not as the WCAG AA minimum. Maintain adequate separation between adjacent controls.
7. Ensure controls have accessible names, visible keyboard focus, logical tab order, and native semantics. Prefer buttons/checkboxes/labels over clickable generic containers.
8. Check narrow mobile widths and desktop layout. Long user-entered task text must remain readable and must not break the layout or be silently truncated.
9. Use F/Z/Gutenberg as contextual scanning heuristics only; select hierarchy based on the actual content, not as rigid templates.
10. Do not implement dark mode, carousel, navigation, filters, statistics, or other features outside the approved brief.
11. If browser screenshots/rendering tools are available, inspect the rendered page. Do not claim visual verification when only source code was read.

## Report

Report each criterion as PASS / FAIL / NOT CHECKED. Separate measured facts (e.g. contrast ratio, viewport width) from visual judgments. Name the affected files and give concrete corrections for failures.
