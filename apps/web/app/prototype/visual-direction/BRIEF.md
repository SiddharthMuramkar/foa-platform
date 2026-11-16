<!-- PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8) -->

# Visual direction prototype: "joyful but trustworthy"

Ticket: [#8](https://github.com/SiddharthMuramkar/foa-platform/issues/8) (wayfinder:prototype). SPEC.md is the source of truth; cite its IDs.

## The question

What does "joyful but trustworthy" look like for FOA (Friends of Animals, India: children's art Competitions for animal welfare, public gallery, auctions, donations, adoption)? We react to three rough home-page takes that use the logo unchanged and the imagery shortlist, then decide:

1. **Colour tokens derived from the logo** (`#CB2322` red, `#01AD01` green, `#263FF1` blue), with shades that pass WCAG 2.2 AA in light and dark.
2. **How much of the red/green/blue tile motif** to use. Solid red is for Donate only.
3. **Typography.** SPEC §4.8 names Plus Jakarta Sans: confirm or change. At most 2 weights (NFR-01).
4. **Shape language** (radius, shadow), **photo treatment**, **illustration use**.
5. **How components get a distinct FOA look** instead of default shadcn/ui.

SPEC §4.8 currently lists navy `#0055A5`, green `#00A651` and red `#E52421`. These are **not** the logo colours. This prototype tests logo-derived tokens instead.

Route: `/prototype/visual-direction?variant=A|B|C`. Add `&theme=light|dark` to force a theme for screenshots (the default follows `prefers-color-scheme`) and `&shot=1` to hide the switcher. Run it with `pnpm visual-direction` from the worktree root (port 3108). The switcher pill at the bottom, or the ←/→ keys, cycles through the variants.

## Hard constraints (every variant)

- **Logo never altered**: no change to shape, colour, proportions or letterforms. Only position, scale, opacity, motion, or surfaces/plates placed around it. Import it from `./logo.ts` (`logo.svg`, `logo.width`, `logo.height`, `logo.alt`). The wordmark is black, so on dark surfaces put the logo on a light plate. Never recolour it, invert it or put it on a busy photo without a plate. (Logotypes are exempt from WCAG contrast, but they must still be legible.)
- **Solid red fill only for Donate** (nav Donate, donate band CTA, hero secondary CTA). Red may appear elsewhere as a tint, a thin rule or text, but never as a solid fill.
- **WCAG 2.2 AA in light AND dark**: 4.5:1 for body text, 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold) and for UI boundaries, focus rings and icons. Visible focus on every interactive element, targets ≥ 24×24 px (aim for 44), never colour alone.
- **`prefers-reduced-motion` honoured.** CSS only, no motion library. `globals.css` has a blunt safety net, but design the reduced state yourself.
- **NFR-01**: public route JS ≤ 170 KB gzipped (prefer server components; client islands only when needed). Fonts self-hosted via `next/font` with **≤ 2 weights in total per variant** (one family × 2 weights, or a display face × 1 + body face × 1). CLS < 0.1. LCP-friendly images: `next/image` with explicit `sizes`, static imports from `fixtures.ts` (automatic width/height, `placeholder="blur"`). Preload the hero only (`preload`; `priority` is deprecated in Next 16). Everything below the fold lazy-loads.
- **No AI-generated imagery** (§4.8). Use the stock photos in `fixtures.ts` (licence-checked, research/animal-imagery #5) and hand-coded SVG accents only.
- **Minors' safeguarding** (§4.1, SG-01/04/06/08). Show a child only as: Display Name, age category label, School, city/state/country, Competition, award. **Never** show age in years, date of birth, contact details or Guardian details. Artwork images are the labelled placeholders in `fixtures.ts`: never real children's art, never stock in place of an Artwork. Every public item shows a "Report a concern" link (`reportConcernHref`). Show "Illustrative photo" wherever stock could read as FOA's own rescue or adoption work (`photo.caption`).
- **Mobile-first**: design at 390×844 first, then 1440×900. No horizontal scroll, 16 px minimum side gutter on phones.
- Every file you create starts with the comment `PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)`.

## Builder contract (variants are built in parallel)

- **You own** `variants/variant-<x>.tsx` (keep `export const name` and the default export) plus anything you create under `variants/<x>/` (sub-components, a CSS file, SVG accents, `"use client"` islands).
- **Read-only (shared)**: `page.tsx`, `fixtures.ts`, `logo.ts`, `BRIEF.md`, `app/layout.tsx`, `app/globals.css`, `components/`, `public/`, `package.json`, `next.config.ts`. **Do not install packages.** Only `next`, `react`, `tailwindcss` v4 and `next/font` are available.
- **Tokens and theming.** `page.tsx` wraps your component in `<div data-theme="light|dark|system" data-variant="<x>">`. Tailwind `dark:` works for both forced and system dark. For tokens, import a plain CSS file from your variant with every selector scoped to your variant:

  ```css
  /* variants/a/tokens.css */
  [data-variant="a"] { --a-canvas: #FFF8EC; --a-ink: #2B1D12; }
  [data-variant="a"][data-theme="dark"] { --a-canvas: #17120E; --a-ink: #F6EDE2; }
  @media (prefers-color-scheme: dark) {
    [data-variant="a"][data-theme="system"] { --a-canvas: #17120E; --a-ink: #F6EDE2; }
  }
  ```

  Then use Tailwind's variable shorthand: `bg-(--a-canvas) text-(--a-ink)`. All three variants' CSS is loaded on every URL, so **never write unscoped selectors**. Don't put `@theme` or `@import "tailwindcss"` in variant CSS.
- **Your root element** must fill the viewport (`min-h-dvh`), paint its own background, and set its font CSS variables (`className={font.variable}`).
- **Fonts**: call `next/font/google` at module scope in your own files with `subsets: ["latin"]`, `display: "swap"`, explicit `weight`s and a `variable`. Every variant's fonts are preloaded on every URL, which is a known artefact of this single-route prototype. Judge font weight by each variant's own declared files.
- **Verify** without touching shared state. Typecheck with `pnpm --dir apps/web exec tsc --noEmit`. **Don't run `next build`** (other builders share `.next`). If something is already listening on 3108 (`lsof -nP -iTCP:3108 -sTCP:LISTEN`), reuse it; otherwise start `pnpm visual-direction` in the background. Take screenshots with the helper below (phone widths need device emulation, because headless Chrome's window has a ~500 px minimum width):

  ```sh
  node /private/tmp/claude-501/-Users-siddharth-Developer-foa-platform/bb023209-0394-49cb-8b5c-40cbb0b8328c/scratchpad/protos/visual-direction/scripts/shoot.mjs \
    "http://localhost:3108/prototype/visual-direction?variant=A&theme=dark&shot=1" out.png 390 844 --full [--reduced-motion]
  ```

  Contrast helper: `scripts/contrast.py` in the same folder (`cr(hex_a, hex_b)`). Python venv: `…/scratchpad/venv/bin/python`.

## Content and assets

- `fixtures.ts` → `home`, which has nav (Competitions, Gallery, Auctions, Adopt, About, Sign in, Donate), the hero (headline, subline, CTAs, hero photo plus alternates), 3 open Competitions, 6 gallery Artworks (the first is `homeFeatured`), 3 impact numbers with period and source note, the donate band, optional adoption highlights and a live auction, 4 partner placeholders, newsletter copy and the footer. `photos` holds 9 stock photos, each with author, source, licence and placement notes. Use what serves your take. You don't have to use everything, but keep the nav, hero, Competitions, gallery, impact, donate band, partners and footer.
- Logo: `public/brand/foa-logo-standin.svg` (vector stand-in, transparent outside the tiles and letters, with the same group ids as the coming exact rebuild from #6) and `public/brand/foa-logo-flat.png` (exact 738×426 crop, white background). Use `logo.svg` from `logo.ts`; swapping to the real file is a one-line change there.

## Colour reference (computed, not a decision)

Logo colours as-is:

| Logo colour | White text on it | It on white | It on dark `#121417` |
|---|---|---|---|
| red `#CB2322` | **5.5:1** (passes AA) | 5.5:1 | 3.3:1 (large text/UI only) |
| green `#01AD01` | **3.0:1** (fails for text; large text at best) | 3.0:1 | 6.1:1 |
| blue `#263FF1` | **6.9:1** (passes AA) | 6.9:1 | 2.7:1 (fails) |

Thresholds at the logo's hue (OKLCH, chroma clamped to sRGB):

- White text on green needs green ≤ `#008A00` (4.5:1).
- Text on dark surfaces needs red ≥ `#E54139`, green ≥ `#009300` and blue ≥ `#4972FF` (4.5:1).
- For 3:1 UI on white: red ≤ `#FF5E53`, green ≤ `#02AD02` (the logo green itself, barely) and blue ≤ `#688FFF`.

Starting ladder (contrast vs white / vs `#121417`). Steps 800–950 of blue drift toward violet, so tune them by eye:

| step | red | green | blue |
|---|---|---|---|
| 50 | `#FFF2F0` 1.1 / 16.9 | `#E1FFDE` 1.1 / 17.2 | `#F1F5FF` 1.1 / 16.9 |
| 100 | `#FFE4E0` 1.2 / 15.3 | `#BFFFB9` 1.2 / 16.0 | `#E3EBFF` 1.2 / 15.5 |
| 200 | `#FFC8C1` 1.5 / 12.5 | `#73FA6B` 1.3 / 13.7 | `#C6D7FF` 1.4 / 12.8 |
| 300 | `#FFA195` 1.9 / 9.5 | `#55DF4F` 1.7 / 10.6 | `#A1BCFF` 1.9 / 9.8 |
| 400 | `#FF7265` 2.7 / 6.9 | `#35C530` 2.3 / 8.1 | `#7CA0FF` 2.5 / 7.3 |
| 500 | `#EE4A41` 3.7 / 5.0 | `#00AA00` 3.1 / 5.9 | `#5981FF` 3.5 / 5.3 |
| 600 | `#D12B27` 5.1 / 3.6 | `#008E00` 4.3 / 4.3 | `#385EFF` 5.0 / 3.7 |
| 700 | `#B2000E` 7.2 / 2.5 | `#007300` 6.1 / 3.0 | `#243AED` 7.2 / 2.6 |
| 800 | `#8B0008` 10.0 / 1.8 | `#005800` 8.8 / 2.1 | `#190ED0` 10.4 / 1.8 |
| 900 | `#660004` 13.4 / 1.4 | `#003F00` 12.3 / 1.5 | `#10009E` 13.9 / 1.3 |
| 950 | `#470002` 16.6 / 1.1 | `#002B00` 15.6 / 1.2 | `#080070` 16.9 / 1.1 |

## Variant briefs

### A: "Sunlit storybook" (joy first)

- A warm cream canvas, oversized rounded shapes, and the logo colours used as soft tints.
- A rounded, friendly display face (e.g. Baloo 2 or Nunito) with a readable body face, staying within the 2-weight budget.
- A big animal photo in an organic blob mask, plus a few hand-drawn SVG accents (squiggles, paw prints).
- A centred single-column hero, and chunky pill buttons with soft shadows.

### B: "Editorial trust" (trust first)

- SPEC's "warm, editorial, Artwork-first": off-white canvas, generous whitespace and an asymmetric editorial grid.
- The hero is a featured child Artwork presented like a museum piece, with a caption label (the `homeFeatured` placeholder and its SG-01 caption fields).
- Restrained colour: logo colours appear only as thin rules, labels and small accents.
- A humanist sans (Plus Jakarta Sans) with a tight type scale.
- Impact and transparency numbers are prominent.
- Square-ish 6 px radius and no illustrations.

### C: "Colour-block mosaic" (driven by the logo tiles)

- A bento/mosaic layout where the sections ARE tiles echoing the logo's three squares.
- Green and blue appear as deep AA-passing shades and as light tints. Red appears only as a tint, except for the solid Donate tile.
- A bold geometric sans (e.g. Figtree).
- Strong grid gutters that match the logo's tile gaps (7.4 px between ~230 px tiles, so about 3% of a tile's width).
- High energy, with photos cropped square inside tiles.

## What reviewers compare

For each variant, look at:

- the token set (light and dark), and where the tile motif and red appear;
- the type pairing and weights, radius and shadow, photo treatment and illustration;
- one distinctive component treatment (button, card, chip) that isn't default shadcn;
- AA results, reduced motion, JS and font weight, and CLS.

Screenshots: phone 390×844 and desktop 1440×900, each in light and dark.
