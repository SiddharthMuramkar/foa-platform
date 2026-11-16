<!-- PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14) -->

# Brief: logo on dark backgrounds (issue #14)

## Question

The site follows the device dark-mode setting (SPEC §4.8). How does the unchanged logo sit on dark backgrounds? The logo is white letters on red, green and blue tiles over a **black** wordmark ("Friends of Animals") on white. Compare treatments in the **header**, **hero** and **footer**, then decide which one ships.

On a dark surface the black wordmark disappears (see `public/brand/foa-logo-standin.svg`, which has a transparent ground). The tiles also lose their white separation.

## The logo never changes

- No change to shape, colour, proportions or letterforms. No recolouring the wordmark, no inverting, no CSS `filter`, no `mix-blend-mode`, no white text-shadow or glow on the artwork.
- Allowed: position, scale, opacity, motion, and surfaces, plates, bands or islands placed **around** it.
- Use `FoaLogo` (`foa-logo.tsx`) or the paths in `logo.ts`. Do not reference files directly. When issue #6 lands, the real SVG replaces the stand-in by changing one line in `logo.ts`.

## Hard constraints

- **Donate**: solid red fill only (`bg-donate text-on-donate`, #CB2322 with white text, 5.5:1), in both themes. No outline, tint or other colour. Red appears nowhere else as a UI colour. (The red tile inside the logo is fine.)
- **WCAG 2.2 AA in light AND dark**: 4.5:1 for body text, 3:1 for large text and UI parts, visible focus, keyboard reachable. Tokens in `globals.css` are pre-measured; check any new pairs you add.
- **Reduced motion**: honour `prefers-reduced-motion`. Gate motion with `motion-safe:`. `globals.css` also has a global safety net.
- **NFR-01**: public route JS ≤ 170 KB gzipped (prefer server components; add no client JS without a reason). Fonts are Plus Jakarta Sans 400/700 via next/font (already loaded; do not add weights or fonts). CLS < 0.1 (reserve image and logo boxes; `FoaLogo` sets width and height). The LCP-friendly hero uses `preload` on one image only.
- **No AI-generated imagery** (§4.8). The hero photo is a placeholder box for curated free-licence stock.
- **Minor safeguarding** (§4.1, SG-01): show no child names, ages, schools, contact details or artworks. Fixtures contain competition data only. If you add a showcase, it may show only: approved display name, age category label, School name, city/state/country, Competition, award. Prefer not to add one.
- **Mobile-first**: 390×844 first, then desktop at 1440×900. No horizontal scroll at 390.
- **Accents come from the logo only**: blue (`accent`), green (`success`), red (Donate only). Neutral type.

## Shared files (read-only for variant builders)

| File | What it gives you |
|---|---|
| `page.tsx` | Reads `?variant=A\|B\|C`, `?theme=light\|dark` (forced; default `system` follows `prefers-color-scheme`) and `?shot=1` (hides the switcher). Renders `<div class="proto-root" data-theme=…>` around your component and mounts the switcher. |
| `fixtures.ts` | `site`, `nav` (Competitions, Gallery, Auctions, Adopt, About, Sign in, Donate), `hero`, `competitions` (3 cards), `competitionsSection`, `footer`. Types: `VariantProps { theme, shot }`. |
| `logo.ts` | `LOGO_SVG`, `LOGO_PNG`, `LOGO_ASPECT` (≈1.728), `LOGO_GEOMETRY` (tile and wordmark bands as fractions of height), `LOGO_GROUP_IDS`. |
| `foa-logo.tsx` | `<FoaLogo height={48} className="h-10 w-auto md:h-12" preload? decorative? />` renders the artwork untouched. |
| `app/globals.css` | Theme tokens → Tailwind colours: `canvas`, `surface`, `surface-2`, `ink`, `ink-muted`, `line`, `line-strong`, `accent`, `on-accent`, `success`, `donate`, `on-donate`, `focus`, `logo-ground` (#fff in both themes), plus fixed `foa-red`, `foa-green` and `foa-blue`. |
| `components/prototype-switcher.tsx` | Bottom-centre pill. ←/→ buttons and keys cycle through the variants. |

**Theme scoping.** Tokens are CSS variables keyed on `data-theme`. Any element can re-scope its own subtree, for example `<header data-theme="light" class="bg-surface text-ink">`: inside it, every token resolves to the light value even when the page is dark. This suits B's light band and C's light islands. The `dark:` variant follows the page's dark or system scope and switches off inside any `[data-theme="light"]` subtree. Prefer token utilities over `dark:`.

**Builders** each own exactly one file, `variants/variant-<x>.tsx`, and may add files under `variants/<x>/`. Keep `export const name = '…'` and a default export taking `VariantProps`. Do not edit shared files or install packages.

## Variant briefs

### A: "Plate"

The page is dark. Wherever the logo appears on a dark surface, it sits on a **white rounded plate**. Padding and radius are proportional to the logo's height, so the plate stays consistent at every size (header, hero and footer use the same ratios). A subtle shadow or inner border softens the plate edge so it reads as a deliberate badge, not a sticker. In light mode the plate either merges into the white or off-white ground or stays as the same badge (pick one and say why).

### B: "Light masthead"

The page is dark, but the **header is a light band in dark mode too**, so the logo sits on its native white. The **footer has a light logo strip**. The hero below is fully dark and does **not** repeat the logo large; it leads with a big headline instead. Structurally: a light top band over a dark body. Watch the seam between the light band and the dark hero, and the Donate button sitting on the light band.

### C: "Light islands"

The dark page is built from **floating light cards**. The header logo lives in a light pill or chip. The hero is a large light card on the dark canvas that holds the big logo and the headline. The cards below alternate dark and light. The logo only ever appears **inside a light island**, never on a plate glued around it: the island is a content surface in its own right, not a frame for the logo.

## Compare and decide

For each variant, check light and dark themes at 390×844 and 1440×900:

1. The header logo is legible at its smallest size (wordmark readable, tiles separated).
2. The hero has a clear focal point, and the logo does not compete with the headline.
3. The footer logo treatment is consistent with the header.
4. Donate stays the only red UI element and stays solid.
5. Contrast passes, focus is visible and reduced motion is honoured.
6. The JS budget and CLS hold.

Record the decision on issue #14.
