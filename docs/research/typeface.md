# Research: typeface for a joyful, trustworthy look (#12)

Date: 2026-11-16 · Ticket: [#12](https://github.com/SiddharthMuramkar/foa-platform/issues/12) · Map: [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2) · Feeds: #8 (visual direction)

## Answer

Keep **Plus Jakarta Sans** (SPEC §4.8) at **400 body / 700 headings**. It is OFL, variable, and one 26.6 KB Latin file covers every weight. It has the tallest x-height of the Latin-only candidates, tabular figures, and the closest kinship to the logo's grotesque wordmark.
Runner-up: **Figtree** (lighter, 19.7 KB, friendlier heavy weights). Third: **Hind**, the only top-3 face with its own Devanagari.
None of the top two covers Devanagari. For Hindi (OD-03), add Hind's `devanagari` subset with `preload: false`. Because of `unicode-range`, English pages never download it.

## Method

- Sizes: woff2 bytes served by the Google Fonts CSS2 API (Chrome 130 UA), which is what `next/font/google` downloads and self-hosts at build time. Fetched 2026-11-16.
- Metrics: `OS/2` sxHeight / sCapHeight and `hmtx` advances, read from the Google-served Regular TTF. Font features come from the served file's `GSUB` table.
- Tone, pairing and small-size checks: a local CoreText specimen (12/16/30 px, Latin + Hindi) set next to the legacy logo (`apps/web/public/foa-logo.jpg` @ `147358a`). These are visual judgements and have not been user-tested.

## 1. Licence, variable fonts, file size

| Family | Licence | Variable | Latin (2 weights) | latin-ext | Devanagari (2 weights) | Tabular figs |
|---|---|---|---|---|---|---|
| **Plus Jakarta Sans** | OFL | wght 200–800 | **26.6 KB** (1 file, all weights) | 21.2 KB | — | `tnum` |
| **Figtree** | OFL | wght 300–900 | **19.7 KB** (1 file) | 10.0 KB | — | `tnum` |
| Nunito | OFL | wght 200–1000 | 38.2 KB (1 file) | 34.6 KB | — | default tabular |
| Baloo 2 | OFL | wght 400–800 | 32.3 KB (1 file) | 26.9 KB | 112.6 KB (1 file) | `tnum` |
| Mukta | OFL | static (7) | 13.2 + 13.7 = 26.9 KB | 16.2 KB | 60.5 + 66.6 = 127.1 KB | `tnum` |
| **Hind** (400/600) | OFL | static (5) | 8.4 + 8.5 = **16.9 KB** | 8.8 KB | 37.2 + 36.5 = **73.7 KB** | none |
| Poppins (400/600) | OFL | static (18) | 7.7 + 7.8 = 15.5 KB | 10.9 KB | 38.6 + 38.5 = 77.1 KB | none |
| *Noto Sans Devanagari* (pair only) | OFL | wdth+wght | — | — | 117.4 KB (1 file) | none |
| *Anek Devanagari* (pair only) | OFL | wdth+wght | — | — | 251.3 KB (1 file) | `tnum` |

- For a variable family, Google serves the **same file URL** whether you ask for `400;700`, `400..700` or the full range. "Two weights max" (NFR-01) is therefore a design rule, not a byte saving. A static family pays per weight.
- `subsets` in `next/font` is only a **preload list**. All subsets' `@font-face` rules ship, and the browser downloads a subset only when the page uses a character in its range.
- **₹ (U+20B9) lives in `latin-ext`** for every candidate; all of them contain the glyph. Any page that shows money also fetches `latin-ext`, which costs 21.2 KB for Plus Jakarta Sans and 10.0 KB for Figtree.
- Google's builds drop Plus Jakarta Sans's stylistic sets (Lancip/Lurus/Lingkar). Using them would need `next/font/local` with the upstream files.

## 2. Devanagari (OD-03)

- **No Devanagari**: Plus Jakarta Sans (Latin, latin-ext, Vietnamese, Cyrillic-ext), Figtree (Latin only) and Nunito (Latin, Cyrillic, Vietnamese).
- **Native Devanagari**: Baloo 2, Mukta, Hind and Poppins.
  - Hind and Poppins were designed by ITF as Latin + Devanagari pairs. Hind's Devanagari base sits at 94% of the Latin cap height. Poppins' matches the Latin ascender.
  - Mukta (Ek Type) is the heaviest static option at 127 KB.
- Plan for a Latin-only primary face: list a Devanagari face second in the stack. The browser then takes Latin glyphs from Plus Jakarta Sans and Devanagari glyphs from Hind, with Poppins' Devanagari as the geometric alternative. With `preload: false` and `unicode-range`, English pages cost 0 bytes.
- Harmonising sizes would need `size-adjust`, which needs `declarations`. `declarations` exists only in `next/font/local`.

## 3. Small-size legibility, tone, wordmark pairing

| Family | x-height/em | cap/em | lowercase width (em) | Tone (specimen) | With wordmark |
|---|---|---|---|---|---|
| Plus Jakarta Sans | **0.536** | 0.745 | 0.540 | Crisp geometric, confident; bold reads warm | Best match. Its grotesque lineage (Neuzeit, 1930s grotesques) and double-storey a echo the wide neo-grotesque wordmark |
| Figtree | 0.500 | 0.700 | 0.507 | "Clean yet friendly"; heavier weights friendlier (designer) | Good. Crisp terminals, similar proportions |
| Nunito | 0.484 | 0.705 | 0.508 | Rounded terminals, soft; drifts childish at bold | Weak. Rounded ends against the sharp wordmark |
| Baloo 2 | 0.460 | 0.602 | 0.489 | Bouncy **display** face (Google category: Display); childish for body | Clashes |
| Mukta | 0.468 | 0.630 | 0.471 | Plain humanist; trustworthy, not joyful | Neutral; narrower |
| Hind | 0.505 | 0.679 | 0.486 | UI-oriented humanist, flat terminals; calm | Neutral; narrower |
| Poppins | **0.548** | 0.698 | 0.561 | Pure geometric, wide; Google's #8 most-used family, so it looks generic | Fair; wider and rounder than the wordmark |

- At 12 px, Plus Jakarta Sans and Poppins read largest. Mukta and Baloo 2 read smallest. To match Plus Jakarta Sans's 16 px x-height (8.6 px), set Figtree and Hind body text at 17 px.
- Every candidate draws I and l as plain bars. In all of them `1` has a flag, so FOA's digit-and-uppercase IDs (`FOA-2027-LOT-001`) stay unambiguous.
- Auction bids, countdowns and finance tables need aligned digits:
  - Plus Jakarta Sans, Figtree, Mukta and Baloo 2 get them through `tabular-nums` (`tnum`).
  - Nunito's default figures are already tabular.
  - Hind and Poppins have neither, so their digits never align.

## Top 3

1. **Plus Jakarta Sans 400 / 700**
   - Heading: 700, 32/38 px on phone, `tracking-tight`: "Every pet deserves a friend".
   - Body: 400, 16/24: "Enter the art Competition by 30 Nov 2026. Ages 6–16."
   - Buttons: 700, 16 px.
2. **Figtree 400 / 700**
   - Heading: 700, 32/38 px: "Every pet deserves a friend".
   - Body: 400, **17**/26 px.
   - Choose it if prototype #8 finds Plus Jakarta Sans too corporate, or the bytes matter: it saves 7 KB of Latin and 11 KB of latin-ext.
3. **Hind 400 / 600**
   - Heading: 600, 30/36 px: "हर जानवर को एक दोस्त चाहिए" / "Every pet deserves a friend".
   - Body: 400, **17**/26 px.
   - The only one-family option that covers Hindi. Costs: no tabular figures, static files, a calmer and less joyful tone.

Rejected:
- Nunito: largest file, low x-height, rounded look against the wordmark.
- Baloo 2: display face, childish for body text.
- Mukta: smallest x-height, heavy Devanagari.
- Poppins: generic look, wide, no tabular figures.

## Recommendation

Keep SPEC §4.8 = Plus Jakarta Sans. Pin the details:

```ts
// app/fonts.ts: variable font, so omit `weight` (one file either way)
export const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })
// later, OD-03: zero bytes on English pages
export const deva = Hind({ weight: ['400', '600'], subsets: ['devanagari'], preload: false, variable: '--font-deva' })
```

```css
@theme inline { --font-sans: var(--font-jakarta), var(--font-deva, sans-serif), system-ui, sans-serif; }
@theme { --font-weight-*: initial; --font-weight-normal: 400; --font-weight-bold: 700; } /* enforce two weights */
```

- Use `tabular-nums` on bids, countdowns, amounts and finance tables.
- When SPEC is next edited, reword NFR-01 from "two weights max" to "one variable file per subset, or two static weights; two weights used".

## Open risks

- **₹ swap**: money pages fetch `latin-ext` lazily, so ₹ briefly renders in the fallback font. The fix is to preload `latin-ext`, which adds 21.2 KB on every page. Decide in prototype #8 with Lighthouse.
- **Devanagari harmony**: Hind's Devanagari next to Plus Jakarta Sans's taller caps (0.745 vs 0.679 em) is unverified on a phone. `size-adjust` would mean switching to `next/font/local`. Hindi pages will also mix scripts, because content entities stay English (§4.5). `next/font` puts its own Arial-based fallback face into `--font-jakarta`, ahead of `--font-deva`. Check that Devanagari still falls through to Hind on Android and iOS.
- **Drift**: the byte counts come from the Google build on 2026-11-16 (Plus Jakarta Sans is at v12). Google re-versions files without notice, so treat the numbers as approximate.
- **Judgement**: tone and pairing calls come from a desktop render, not user testing. Confirm them in the #8 prototype on a Vercel preview, on a phone.

## Sources (accessed 2026-11-16 unless noted)

- Google Fonts CSS2 API responses, e.g. https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800 (sizes, subsets, unicode-ranges, file URLs)
- Google Fonts family metadata: https://fonts.google.com/metadata/fonts (axes, subsets, designers, category, popularity)
- google/fonts `METADATA.pb` (licence OFL) and `DESCRIPTION.en_us.html` for each family: https://github.com/google/fonts/tree/main/ofl (plusjakartasans, figtree, nunito, baloo2, mukta, hind, poppins, anekdevanagari, notosansdevanagari)
- Plus Jakarta Sans upstream README: https://github.com/tokotype/PlusJakartaSans (crawled 2026-11-12) · https://tokotype.com/custom-fonts/plusjakarta
- Figtree description (upstream text, mirrored): https://github.com/erikdkennedy/figtree · https://fontsource.org/fonts/figtree/about (crawled 2026-09-19)
- Next.js 16.4.5 `next/font` reference (weight, subsets, preload per layout, `declarations` local-only, self-hosting): https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/02-components/font.mdx · https://nextjs.org/docs/app/api-reference/components/font
- `subsets` is a preload list, not a filter: https://github.com/vercel/next.js/issues/42361 · https://github.com/vercel/next.js/blob/canary/packages/font/src/google/find-font-files-in-css.ts
- MDN `unicode-range` (fonts download only when a character in the range is used; page dated 2026-04-20): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/unicode-range
- Tailwind CSS v4 theme (`@theme inline`, `--font-weight-*: initial`): https://tailwindcss.com/docs/theme
- OpenType `OS/2` table (sxHeight, sCapHeight): https://learn.microsoft.com/en-us/typography/opentype/spec/os2
