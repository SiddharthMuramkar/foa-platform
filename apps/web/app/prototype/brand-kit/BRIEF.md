<!-- PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13) -->

# Brand kit prototype: brief

Ticket: [#13 Brand kit: icons, OG card, watermark and stamp](https://github.com/SiddharthMuramkar/foa-platform/issues/13) (wayfinder:prototype).
Route: `/prototype/brand-kit?variant=A|B|C` (`&theme=light|dark` forces a theme, `&shot=1` hides the switcher). Run: `pnpm brand-kit` (port 3113).

## The question

Which brand assets does `packages/brand` ship, and how do they look, given the logo never changes (SPEC §3.2, §4.6 FR-STAMP-01..04, §3.5 step 4)? Decide:

1. **Favicon and app icons** (16, 32, 180, maskable 512): the full logo, one part of it (the tiles or the paw mark), or the logo on a plate.
2. **OG card** (1200×630): layout with the logo stamp.
3. **Gallery preview watermark** (1600 px long edge) and the **"FOA JUDGING" mark** (2560 px judging derivative): which logo element, where, default opacity. Placement and opacity are settings (FR-STAMP-03).
4. **Certificate share image** (PNG 1080×1350, FR-CERT-03): where the logo goes next to the seal, number and QR (FR-STAMP-02).

> **Product-owner decision, not settled:** Variants B and C use only a PART of the logo (the paw mark, or the three tiles without the wordmark) at small sizes. Whether a part of the logo may stand alone is the product owner's call. Every variant page must say so plainly and must never present it as agreed.

## The logo rule

The logo is never altered: no change to shape, colour, proportions or letterforms. Allowed: position, scale, opacity, motion, and plates or surfaces placed around it.

- Use the **flat** variant only (top half of the client raster). The glossy variant is out.
- Tiles: red `#CB2322`, green `#01AD01`, blue `#263FF1` (measured), white F, O, A, and the paw-and-hands mark inside the O. Wordmark "Friends of Animals" in black. White background.
- "Exact pixels" means a crop of `foa-logo-flat.png` resampled (scaled) only: no recolouring, no redrawing, no outline or shadow on the logo itself. A plate or backing behind it is fine.
- No transparent-background PNG ships: the source is a JPEG on white, so cutting the logo out would be an estimate, not a lossless copy. On dark or busy surfaces, put the logo on a **white plate**.

## Hard constraints

- Solid red fill only for Donate (none needed here).
- WCAG 2.2 AA in light AND dark: 4.5:1 body text, 3:1 large text and UI. Tokens in `app/globals.css` are pre-checked; use them (`bg-bk-bg`, `text-bk-fg`, `text-bk-muted`, `border-bk-border`, `text-bk-primary`, `bg-bk-plate`, ...).
- `prefers-reduced-motion` honoured (a global rule in `globals.css` already kills animation; don't fight it).
- NFR-01: public route JS ≤ 170 KB gzipped; fonts self-hosted via next/font, ≤ 2 weights (Plus Jakarta Sans 400 and 700 are already loaded; add no fonts); CLS < 0.1 (give every image width and height); LCP-friendly images (`next/image`, `sizes`, `priority` only on the first visible image). **Variants are server components; add no client JS** unless a control truly needs it.
  - Measured at setup: an empty page on Next 16.4.6 + React 19.3 already loads ≈ 178 KB gzip (≈ 154 KB brotli) of framework JS; this route adds ≈ 3.5 KB (switcher, theme sync). The framework baseline alone is near or over the 170 KB budget, so report it rather than "fixing" it here.
- No AI-generated imagery (§4.8). The sample Artwork is procedural (`scripts/build-kit.mjs`).
- Minor safeguarding (§4.1 SG-01, BR-63): public views show ONLY display name, age category label, School, city/state/country, Competition, award. Never a full name, age in years, date of birth, contact or Guardian detail, in pixels or in alt text. Judging views are blind (SG-11): Submission number, category, title only. Use `fixtures.ts`; don't invent new child data.
- Mobile-first at 390×844; check desktop at 1440×900.

## Shared setup (read-only for builders)

| Path | What |
|---|---|
| `public/brand/foa-logo-flat.png` | Exact crop of the flat logo, 737×429, white background, pixel-identical to the raster |
| `public/brand/parts/foa-{tiles,mark,wordmark}-flat.png` | Exact rectangular crops of that PNG (no masking) |
| `public/brand/foa-logo-standin.svg` | Stand-in for the real SVG (#6): same group ids (`tile-red`, `tile-green`, `tile-blue`, `letter-f`, `letter-o`, `letter-a`, `mark` > `mark-disc`/`mark-paw`/`mark-hands`, `wordmark`), raster pixels clipped per group |
| `app/prototype/brand-kit/logo.ts` | Logo paths, part crops, group boxes, measured colours. Swapping to the real SVG is one line (`LOGO_SVG`) |
| `app/prototype/brand-kit/logo-geometry.json` | Same boxes for node generators (`{x,y,w,h}` in flat-PNG px; `source.flatCrop` maps to the raster) |
| `app/prototype/brand-kit/fixtures.ts` | Artwork, Competition, child display line, certificate-share mock, QR placeholder, `KIT_FILES`, `kitAsset()`, `VariantProps`, `StampSettings` |
| `public/prototype/brand-kit/fixtures/artwork-2400x1800.jpg` | Sample Artwork (procedural crayon drawing) |
| `public/prototype/brand-kit/fixtures/qr-placeholder.svg` | QR-shaped placeholder, not scannable |
| `scripts/build-kit.mjs` | Generates all of the above plus grey placeholders (never overwrites existing variant files unless `--force-placeholders`) |
| `scripts/shoot.mjs` | `node apps/web/scripts/shoot.mjs --variant A --out <abs dir>`: 390×844 and 1440×900, light and dark, `shot=1`, reduced motion, system Chrome |
| `components/prototype-switcher.tsx`, `page.tsx`, `theme-sync.tsx`, `globals.css`, `layout.tsx` | Shared. Don't edit |

**Parallel builders share one worktree:** if `http://localhost:3113` already answers, reuse that dev server (it hot-reloads your files); start `pnpm brand-kit` only when nothing is listening, and don't run `next build` yourself (it would fight the others over `.next/`). Type-check with `pnpm --dir apps/web exec tsc --noEmit`.

Installed and pinned: `next` 16.4.6, `react` 19.3.0, `tailwindcss` 4.3.3, `sharp` 0.35.5, `playwright-core` 1.65.1. **Builders install nothing.**

### What each builder owns

- `app/prototype/brand-kit/variants/variant-<x>.tsx`: keep `export const name` and a default component taking `VariantProps`.
- `app/prototype/brand-kit/variants/<x>/**`: sub-components and **`build.mjs`**, your generator. Run it with `node apps/web/app/prototype/brand-kit/variants/<x>/build.mjs`. Use `sharp` (`composite`, `extract`, `resize`) from `foa-logo-flat.png` or the part crops, so every pixel of logo comes from the raster.
- `public/prototype/brand-kit/<x>/**`: your generated assets. Overwrite these placeholder names (see `KIT_FILES`):

| File | Size | Derivative |
|---|---|---|
| `icon-16.png`, `icon-32.png` | 16, 32 | favicon |
| `icon-180.png` | 180 | apple-touch-icon |
| `icon-maskable-512.png` | 512 | PWA maskable; keep the logo inside the centre circle of 80% diameter (409.6 px) |
| `og-card.png` | 1200×630 | OG image with logo stamp (§3.5 step 4) |
| `preview-watermarked.jpg` | 1600×1200 | gallery preview with FOA watermark |
| `judging-marked.jpg` | 2560×1920 | judging derivative with a subtle "FOA JUDGING" mark |
| `certificate-share.png` | 1080×1350 | certificate share image: logo, seal, number, QR (FR-STAMP-02) |

You may add more files in your folder (for example, a watermark at 30% and 10% opacity to compare).

**Stale images:** `next/image` caches optimised copies by URL. After re-running your generator, delete only your own entries or the whole cache (`rm -rf apps/web/.next/cache/images`), or the page keeps showing the old pixels. Show icons (≤ 512 px) with `unoptimized` so the page displays the exact generated pixels; keep the optimiser for the large JPEGs.

### What every variant page shows

1. The PO-decision banner if the variant uses part of the logo (B, C), or a note that A is the "no decision needed" baseline.
2. Icons at real size AND enlarged with `image-rendering: pixelated`, in a light and a dark browser-tab mock, plus a home-screen mock showing the maskable crop (circle and squircle).
3. The OG card inside a link-preview mock (chat app and social card), at 390 px wide.
4. The gallery preview (watermarked) with the public child line from `fixtures.ts`, and the blind judging view.
5. The certificate share image.
6. A FR-STAMP-03 settings table: element, placement, default opacity, scale, minimum size, and the rule when the artwork behind is busy or dark.
7. Honest notes: what breaks at 16 px, contrast of the mark against light and dark artwork.

## Variant briefs

### A: "Whole logo"

Every asset uses the complete, unchanged logo (tiles + mark + wordmark), on white plates where needed. Favicons show the honest result of the full logo at 16 and 32 px (the wordmark will not survive; show that, don't hide it). Watermark: the full logo bottom-right at a default 18% opacity on a soft white backing. OG card: logo top-left on a white band, Artwork on the right. Judging mark and certificate also use the full logo. This is the baseline that needs no product-owner decision.

### B: "Paw mark"

Small sizes use only the paw-and-hands mark (exact pixels from the logo) on a white disc. App icon: the mark on white, with the three tile colours as a thin ring segment ONLY if that adds no new artwork; otherwise plain. (A ring in the tile colours is arguably new artwork: flag it and show the plain version as the default.) Watermark: small mark + "FOA" corner badge, with no wordmark. OG card and certificates use the full logo. **Using only part of the logo is a product-owner decision: flag it.**

### C: "Tile trio"

Small sizes use the three FOA tiles with their letters (exact pixels, cropped together without the wordmark) as a compact square lockup (scale only; never squash the tiles to make a square, pad on a plate instead). Watermark: a thin tri-colour strip along the bottom edge with the full logo small at one end. (The strip is a surface placed around the logo; say whether it reads as new artwork.) OG card: a tile-rhythm frame around the Artwork. Judging mark repeats diagonally at low opacity. **Using only part of the logo is a product-owner decision: flag it.**
