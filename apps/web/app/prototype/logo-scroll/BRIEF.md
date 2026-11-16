<!-- PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9) -->

# Prototype #9: logo scroll interaction

Ticket: [#9](https://github.com/SiddharthMuramkar/foa-platform/issues/9) (wayfinder:prototype, map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2)).
Route: `/prototype/logo-scroll?variant=A|B|C`. Add `&theme=light|dark` to force a theme (the default follows `prefers-color-scheme`). Add `&shot=1` to hide the switcher.
Run with `pnpm logo-scroll` from the repo root (dev server, port 3109).

## Question

How does the logo behave on scroll and on interaction? Candidate behaviours:

- a large hero logo that docks into the sticky header as the page scrolls;
- tile-level motion (the SVG has separate tile groups);
- hover and tap feedback on the paw mark;
- the reduced-motion version of each.

**The logo's design never changes.** Shape, colour, proportions and letterforms stay exactly as they are. Only its position, scale, opacity and motion may change, plus surfaces or plates placed around it.

## Constraints (all variants)

- **Motion stack**: follow `research/lean-motion-stack` (#4). Go CSS-first and add **no animation library**: no Motion, no GSAP. Nothing extra is installed, and builders cannot install packages.
  - Scroll-linked motion: CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`), gated by `@supports (animation-timeline: scroll())`.
    - Declare `animation-timeline` *after* the `animation` shorthand.
    - Use `animation-duration: 1ms` (needed for Firefox).
    - Use `overflow: clip`, never `overflow: hidden`, on ancestors. `hidden` creates a scroller and breaks `scroll(root)`.
  - Fallback for browsers without scroll-driven animations (iOS 16–18, Firefox ≤ 158): a tiny client island. An IntersectionObserver sentinel toggles a `data-*` attribute, and a 150–250 ms CSS transition moves between the two states. That move is time-based, not scroll-linked. Never use a scroll event handler.
  - Micro-interactions: CSS `:hover` / `:active` / `:focus-visible` transitions on `transform` / `opacity`, 150–250 ms, inside `motion-safe:` (or `@media (prefers-reduced-motion: no-preference)`).
  - If a variant shows CSS cannot deliver something (springs, gestures), **say so in the variant notes**. Do not add a library.
- **Performance (NFR-01)**: route JS ≤ 170 KB gzipped. CLS < 0.1, aimed at 0. LCP-friendly hero.
  - Animate `transform` and `opacity` only. Never animate width, height, top, left or colour. Use no scroll handlers and do no layout reads per frame.
  - Reserve the header height (`h-header` = `var(--header-h)`) and the compact logo slot (`HEADER_LOGO_SLOT_STYLE`) so CLS stays 0.
  - Measured route-JS baseline with the stubs: **≈ 138.5 KB gzip** (Next 16.4.6 + React 19.3.1 + switcher ≈ 3.7 KB), excluding the `noModule` polyfill chunk that modern browsers skip. That leaves **≈ 31 KB headroom**, and a variant should need about 1 KB.
  - SVG caveat: CSS transforms on elements *inside* an SVG (`<g>`) may be repainted rather than composited. Check paint flashing in DevTools. For compositor-only tile motion, stack HTML wrappers instead: render several `<InlineLogo>` copies and show one part per copy with `clip-path: inset(...)` from `LOGO_PART_BOXES`. Each wrapper then moves on its own layer.
- **Reduced motion** (NFR-A11Y, WCAG 2.2): under `prefers-reduced-motion: reduce` there is no translate, scale, rotation or wave. A static hero logo plus a static header logo is fine, with an opacity cross-fade at most. Every variant must look finished in this mode, not broken.
- **Accessibility**: WCAG 2.2 AA in light **and** dark. That means 4.5:1 for body text and 3:1 for large text and UI.
  - Keyboard reachable, with visible focus (global `:focus-visible` ring is provided).
  - Paw interactions must not be the only way to do anything. A tap target is ≥ 44×44 px.
  - Use exactly one accessible logo name per instance: `label` on `<InlineLogo>` or `alt` on an image. Mark decorative copies `aria-hidden`.
- **Colour**: solid red fill (`bg-donate`, `#E52421`) is used **only for Donate**. The logo's own tile red is part of the logo, not UI.
- **Dark mode**: the wordmark is black, so in dark mode the logo needs a light plate behind it (`bg-logo-plate`, white in dark and transparent in light). The final dark treatment is #14. Keep the plate simple here.
- **Imagery**: grey placeholder blocks only. No AI-generated imagery (SPEC §4.8).
- **Safeguarding**: SPEC §4.1 SG-01. Gallery captions show only display name, age category label, School and city. The fixtures already follow this, so do not add child names, ages in years or contact details.
- **Viewports**: mobile-first at 390×844, desktop 1440×900. No horizontal scroll.
- Every new file starts with `PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)`.

## What setup provides (shared, READ-ONLY for builders)

Each builder edits **only** its own `variants/variant-<x>.tsx`. It may also add new files named `variants/variant-<x>-*.tsx` / `variants/variant-<x>.css` (or `.module.css`). Do not touch any of these shared files:

| File | What it gives you |
|---|---|
| `page.tsx` | Reads `variant` / `theme` / `shot`, sets `data-theme` on the `#top` wrapper, renders the variant (remounted per key), mounts the switcher |
| `../../components/prototype-switcher.tsx` | Bottom-centre pill. ←/→ buttons and keys cycle with wrap via `router.replace`. Hidden with `shot=1` and in production unless `NEXT_PUBLIC_PROTOTYPE=1` |
| `fixtures.ts` | Neutral content: `NAV_ITEMS`, `HERO`, `COMPETITIONS`, `GALLERY`, `AUCTIONS`, `IMPACT`, `DONATE`, `FOOTER` |
| `fixture-page.tsx` | Server components: `FixtureHeaderBar({ logoSlot, position })` (sticky, `h-header`, reserved logo slot, nav, red Donate, menu button), `FixtureHeroCopy`, `FixtureSections` (Competitions, Gallery, Auctions, Impact, Donate band, Footer: about 5 phone screens), `Block`, `DonateLink`, `HEADER_LOGO_SLOT_STYLE` |
| `logo.ts` | `LOGO_SVG_SRC` (the **one line** to change for the real SVG), `LOGO_PNG_SRC`, `LOGO_PNG_TRANSPARENT_SRC`, `LOGO_WIDTH/HEIGHT/ASPECT` (755×447), `LOGO_ALT`, `LOGO_PARTS`, `LOGO_PART_BOXES` |
| `inline-logo.tsx` | `<InlineLogo idPrefix label? className? />` (server). Inlines the SVG. Ids become `<prefix>-<id>`, and each element gets `data-part="<id>"`. Target parts with `[data-part="tile-red"]`. Use a unique `idPrefix` per copy |
| `app/globals.css` | Tokens and Tailwind colours: `surface`, `surface-2`, `ink`, `ink-muted`, `line`, `block`, `primary`, `on-primary`, `donate`, `on-donate`, `logo-plate`; spacing `header`, `header-logo`; theme switching |
| `public/brand/` | `foa-logo-flat.png` (exact crop, white background), `foa-logo-flat-transparent.png` (lossless colour-to-alpha outside the tiles; tiles stay opaque), `foa-logo-standin.svg` |

**Logo SVG.** The real rebuild (#6, `packages/brand/foa-logo.svg`) did not exist at setup time, so `foa-logo-standin.svg` is used instead. It has the same group ids: `tile-red`, `tile-green`, `tile-blue`, `letter-f`, `letter-o`, `letter-a`, `mark` (`mark-disc`, `mark-paw`, `mark-hands`), `wordmark`.

- Each tile is a solid rect with raster edges. Each letter, the mark and the wordmark is the raster clipped to its region. Every group can move on its own with no ghosting, which has been tested.
- Letters and the mark are **siblings** of the tiles. Move `tile-red` with `letter-f`, `tile-green` with `letter-o` and `mark`, and `tile-blue` with `letter-a`.
- The split between `mark-paw` and `mark-hands` is approximate in the stand-in, so animate `mark` as a whole.
- For CSS on SVG groups, use `transform-box: fill-box; transform-origin: center`.
- To swap to the real SVG, copy it to `public/brand/foa-logo.svg` and change `LOGO_SVG_SRC`.

**Screenshots / checks.** Run `node /private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/protos/logo-scroll/tools/shot.mjs <url> <out.png> [phone|desktop] [light|dark] [reduce|no-preference] [scrollY]`. It uses playwright-core with system Chrome and prints a horizontal-overflow check. Version-matched Next.js docs are in `apps/web/node_modules/next/dist/docs/`.

## Variant briefs

### A: "Dock"

The large hero logo scales and translates continuously into the sticky header's compact logo slot over the first ~40vh of scroll.

- **Mechanism**: scroll-linked, using a CSS scroll-driven animation (`animation-timeline: scroll(root block)`, `animation-range: 0 40vh`) on one element. It is transform-only (translate + scale) and the header slot stays reserved.
- **Fallback**: an IntersectionObserver sentinel toggles `data-docked`, and a 200 ms transform transition moves the logo between hero and docked states.
- **Paw**: a gentle nudge on hover and tap (`:hover` / `:active`, under `motion-safe`).
- **Reduced motion**: no movement. Show the static hero logo and the static header logo, with an opacity cross-fade at most.

### B: "Tile cascade"

Tile-level motion on the SVG groups (`tile-red` / `tile-green` / `tile-blue` plus their letters; stand-in groups while the real SVG is missing).

- **On scroll**: the three tiles drift apart slightly with a staggered offset and the wordmark fades. They then click back together, compact, in the header.
- **Paw**: a small wag on hover and tap.
- **Fallback**: no scroll-driven support means a simple time-based transition between the hero and header states.
- **Reduced motion**: no drift and no wag. Show the hero logo, and the header logo appears with at most an opacity fade.

### C: "Paw lead"

The most conservative option. The hero logo stays put and scrolls away normally.

- **Header logo**: when the hero leaves the viewport, a compact full logo fades and slides into the header. Use an IntersectionObserver or a scroll-driven `view()` timeline.
- **Paw**: the interaction focus is the paw-and-hands mark. It gives a friendly bounce on hover and tap, and does a one-off wave when the page first loads. The wave is skipped for reduced motion and does not loop (WCAG 2.2.2).
- **Reduced motion**: no slide, bounce or wave. The header logo is static or opacity-only.

## Done checklist (per variant)

- [ ] `export const name` unchanged ("Dock" / "Tile cascade" / "Paw lead"). Default export renders the full page (header + hero + `FixtureSections`).
- [ ] Phone 390×844 and desktop 1440×900, light and dark, with no horizontal scroll.
- [ ] `prefers-reduced-motion: reduce` gives a finished static version.
- [ ] Only `transform` / `opacity` animate. No scroll listeners. Header and slot are reserved (CLS 0).
- [ ] Works with JS disabled or before hydration: the hero logo is visible and the header is usable.
- [ ] `pnpm --dir apps/web build` passes. The variant adds ≤ ~5 KB gzip of client JS.
- [ ] The logo artwork is unaltered: same colours, shapes and proportions, only moved, scaled or faded.
