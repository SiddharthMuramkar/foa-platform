# Research: typeface for a joyful, trustworthy look (#12)

Date: 2026-11-16 · Ticket: [#12](https://github.com/SiddharthMuramkar/foa-platform/issues/12) · Map: [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2) · Feeds: #8 (visual direction)

## Answer

Keep **Plus Jakarta Sans** (SPEC §4.8) at **400 body / 700 headings**, on public pages and dashboards alike. It is OFL and variable, so one Latin file covers every weight. Among the Latin-only candidates it has the tallest x-height, and it has tabular figures and the closest kinship to the logo's grotesque wordmark.
Self-host it with **`next/font/local` from files committed to `packages/brand/fonts`**. The web gets a variable Latin + ₹ woff2 (26.0 kB); the worker (certificate and receipt PDFs, share PNGs) and OG images get static 400/700 TTFs. That way one source feeds every surface, and ₹ no longer triggers a second download.
Type is chosen for trust and legibility. Joy comes from the palette, the animal imagery and motion (map #2). Plus Jakarta Sans only has to be warm, not playful.
Runner-up: **Figtree** (smaller files, friendlier heavy weights). Third: **Hind**, the only top-3 face with its own Devanagari.
For Hindi (OD-03), pair Plus Jakarta Sans with **Poppins' Devanagari**. Its headline (0.740 em) matches Plus Jakarta Sans's cap height (0.745 em). Hind's Devanagari is the calmer alternative. With `preload: false` and `unicode-range`, English pages never download either.

## Method

- Sizes: woff2 bytes served by the Google Fonts CSS2 API, fetched 2026-11-16 with a Chrome UA. `next/font/google` sends a Chrome/104 UA (`fetch-resource.ts` @ v16.4.5). For Plus Jakarta Sans, Figtree and Hind, Google returned identical file URLs to that UA and to Chrome 130. All sizes are **KiB** (1024 bytes) unless marked kB. Lighthouse and DevTools report kB, which is about 2.4% higher.
- Metrics: `OS/2` sxHeight / sCapHeight and `hmtx` advances come from the Google-served Regular TTF. Glyph bounds (Devanagari headline, I/l, O/0) were read with fontTools `BoundsPen`. Font features come from each file's `GSUB` table.
- Custom subsets and static instances were built locally with fontTools `subset` and `varLib.instancer` from google/fonts `PlusJakartaSans[wght].ttf`.
- Tone, pairing and small-size checks: a local CoreText specimen (12/16/30 px, Latin + Hindi) set next to the legacy logo (`apps/web/public/foa-logo.jpg` @ `147358a`). These are visual judgements on a desktop render. They have not been user-tested, and the specimen images are not committed. Sub-question 3 (legibility **on phones**) is therefore **provisional** until the device check in #8.

## 1. Licence, variable fonts, file size

| Family | Licence | Variable | Latin (2 weights) | latin-ext | Devanagari (2 weights) | Tabular figs |
|---|---|---|---|---|---|---|
| **Plus Jakarta Sans** | OFL | wght 200–800 | **26.6 KiB** (1 file, all weights) | 21.2 KiB | — | `tnum` |
| **Figtree** | OFL | wght 300–900 | **19.7 KiB** (1 file) | 10.0 KiB | — | `tnum` |
| Nunito | OFL | wght 200–1000 | 38.2 KiB (1 file) | 34.6 KiB | — | default tabular |
| Baloo 2 | OFL | wght 400–800 | 32.3 KiB (1 file) | 26.9 KiB | 112.6 KiB (1 file) | `tnum` |
| Mukta | OFL | static (7) | 13.2 + 13.7 = 26.9 KiB | 16.2 KiB | 60.5 + 66.6 = 127.1 KiB | `tnum` |
| **Hind** (400/600) | OFL | static (5) | 8.4 + 8.5 = **16.9 KiB** | 8.8 KiB | 37.2 + 36.5 = **73.7 KiB** (400/700: 72.0) | none |
| Poppins (400/600) | OFL | static (18) | 7.7 + 7.8 = 15.5 KiB | 10.9 KiB | 38.6 + 38.5 = 77.1 KiB (400/700: 76.9) | none |
| *Noto Sans Devanagari* (pair only) | OFL | wdth+wght | — | — | 117.4 KiB (1 file) | default tabular |
| *Anek Devanagari* (pair only) | OFL | wdth+wght | — | — | 251.3 KiB (1 file) | `tnum` |

- For a variable family, Google serves the **same file URL** whether you ask for `400;700`, `400..700` or the full range. "Two weights max" (NFR-01) is therefore a design rule, not a byte saving. A static family pays per weight.
- In `next/font/google`, `subsets` is only a **preload list**. Every subset's `@font-face` rule ships, and the browser downloads a subset only when the page uses a character in its range.
- **₹ (U+20B9) lives in Google's `latin-ext`** for every candidate (range U+20AD–20C4), and all of them contain the glyph. On Google's files, any page that shows money also fetches `latin-ext`: 21.2 KiB for Plus Jakarta Sans, 10.0 KiB for Figtree. A self-built subset avoids this. Google's latin range plus U+20B9, cut from the google/fonts variable TTF with `tnum` kept, is **26.0 kB**, smaller than Google's own 27.3 kB latin file, which has no ₹. The ₹ glyph itself costs about 0.1 kB.
- Stylistic sets: the files the Google Fonts API serves, which `next/font/google` self-hosts, drop ss01–ss03 (Lancip/Lurus/Lingkar) and `case`/`sups`/`subs`. The served latin woff2 has only `calt ccmp dnom frac liga locl numr pnum tnum`. The google/fonts repo variable TTF keeps them (`ss01–ss03`, `case`, `sups`, `subs`, `ordn`, `sinf`, `aalt`), and so does upstream tokotype. Using them means `next/font/local` with either file. Keeping ss01–03 and `case` in the Latin + ₹ subset brings it to 30.6 kB.

## 2. Devanagari (OD-03)

- **No Devanagari**: Plus Jakarta Sans (Latin, latin-ext, Vietnamese, Cyrillic-ext; its cmap has no U+0930), Figtree (Latin only) and Nunito (Latin, Cyrillic, Vietnamese).
- **Native Devanagari**: Baloo 2, Mukta, Hind and Poppins.
  - Measured Devanagari headline (top of क/म/न) against Plus Jakarta Sans's cap height of 0.745 em:

    | Face | Headline (em) | vs PJS cap |
    |---|---|---|
    | **Poppins** | **0.740** | ≈ equal |
    | Hind | 0.642 | 14% shorter |
    | Mukta | 0.630 | 15% shorter |
    | Noto Sans Devanagari | 0.622 | 17% shorter |
    | Baloo 2 | 0.610 | 18% shorter |

  - ITF designed both Hind and Poppins as Latin + Devanagari pairs. Hind's Devanagari base is 94% of its own Latin cap height (0.679). Poppins' equals its Latin ascender.
  - Poppins' Latin proportions (x-height 0.548, cap 0.698) are the nearest to Plus Jakarta Sans (0.536 / 0.745) of any Devanagari family here. Its geometric construction also matches. Its Devanagari therefore sits with Plus Jakarta Sans without size adjustment. In a pair only Poppins' `devanagari` subset loads, so its Latin drawbacks (generic look, width, no tabular figures; see Rejected) do not apply.
  - Hind's humanist Devanagari is calmer, but it needs harmonising. Mukta is the heaviest static option at 127 KiB.
- Plan for a Latin-only primary face: list a Devanagari face second in the stack. The browser then takes Latin glyphs from Plus Jakarta Sans and Devanagari glyphs from **Poppins** (default) or **Hind** (if the OD-03 phone check prefers its calmer tone). Use 400/700 in both cases, so bold text stays at two weights. With `preload: false` and `unicode-range`, English pages cost 0 bytes.
- Harmonising sizes (needed for Hind, not Poppins) works in two ways:
  - CSS `font-size-adjust` on Hindi-language containers. It normalises every font in the stack without any `@font-face` descriptor, so it works with any `next/font` loader. The single-number form (x-height, e.g. `0.536`) works in Chrome 127+, Safari 16.4+ and Firefox. `cap-height 0.745` needs Safari 17+. iOS 16.0–16.3 renders unadjusted. Matching x-height lifts Hind's headline from 0.642 to about 0.681 em.
  - Per-face `size-adjust`, which needs `declarations` (`next/font/local` only).

## 3. Small-size legibility, tone, wordmark pairing

| Family | x-height/em | cap/em | lowercase width (em) | Tone (specimen) | With wordmark |
|---|---|---|---|---|---|
| Plus Jakarta Sans | **0.536** | 0.745 | 0.540 | Crisp geometric, confident; bold reads warm | Best match. Its grotesque lineage (Neuzeit, 1930s grotesques) and double-storey a echo the wide neo-grotesque wordmark |
| Figtree | 0.500 | 0.700 | 0.507 | "Clean yet friendly"; "thicker weights have a distinctly friendlier character" (Google Fonts article) | Good. Crisp terminals, similar proportions |
| Nunito | 0.484 | 0.705 | 0.508 | Rounded terminals, soft; drifts childish at bold | Weak. Rounded ends against the sharp wordmark |
| Baloo 2 | 0.460 | 0.602 | 0.489 | Bouncy **display** face (Google category: Display); childish for body | Clashes |
| Mukta | 0.468 | 0.630 | 0.471 | Plain humanist; trustworthy, not joyful | Neutral; narrower |
| Hind | 0.505 | 0.679 | 0.486 | UI-oriented humanist, flat terminals; calm | Neutral; narrower |
| Poppins | **0.548** | 0.698 | 0.561 | Pure geometric, wide; Google's #8 most-used family, so it looks generic | Fair; wider and rounder than the wordmark |

- At 12 px (desktop render), Plus Jakarta Sans and Poppins read largest; Mukta and Baloo 2 read smallest. To match Plus Jakarta Sans's 16 px x-height (8.6 px), set Figtree and Hind body text at 17 px.
- **I / l / 1**: every candidate except Nunito draws I and l as plain bars. Nunito's l has a tail (ink 216 vs 82 units), which actually helps it. In all of them `1` has a flag.
- **O / 0**: Plus Jakarta Sans has no `zero` (slashed-zero) feature. The letter O and the digit 0 are the same height and differ only in width (ink 0.746 vs 0.588 em). FOA's IDs mix both (`FOA-2027-LOT-001`, `-DON-`), and Submission numbers are all a judge sees (SG-11). Two fixes:
  - Set IDs in `tabular-nums`.
  - Have the `packages/shared` ID parsers accept the letter O for the digit 0 in the numeric segment only. Known prefixes stay strict. This covers `/verify`, FR-PHYS-03 and staff search.
- Auction bids, countdowns, scores and finance tables need aligned digits:
  - Plus Jakarta Sans, Figtree, Mukta and Baloo 2 get them through `tabular-nums` (`tnum`).
  - Nunito's and Noto Sans Devanagari's default figures are already tabular.
  - Hind and Poppins have neither, so their digits never align.
- **Phones (provisional)**: Google's Plus Jakarta Sans build is unhinted (no `fpgm`). Only a macOS render was checked. Rendering at 12–14 px on Windows and low-DPR Android is untested, so the device screenshots go to #8.

### Dashboards ("calm dashboards")

- Plus Jakarta Sans is wide: lowercase 0.540 em, against Figtree's 0.507. On mixed dashboard text (School names, IDs, dates) its average advance is 0.481 em, against 0.461 for Figtree and 0.432 for Hind.
- On a 390 px phone with a 16 px gutter and 16 px card padding, that leaves 326 px of text: **48 characters per line at 14 px** (Figtree 51, Hind 54) and **56 at 12 px** (Figtree 59). "Kendriya Vidyalaya No. 2, Visakhapatnam" (40 characters) fits on one 14 px line.
- Rule: dashboards use the same face and the same two weights.
  - 14 px (`text-sm`): names, IDs, amounts and table cells.
  - 12 px (`text-xs`): meta only (dates, counts, badges).
  - `tracking-tight` only for headings of 24 px and up.
  - `tabular-nums` on IDs, scores, bids and amounts.
  - School names wrap to two lines (`line-clamp-2`) rather than truncating.
- Specimens at 14 and 12 px (admin card list, judge queue row, md+ finance table) go into the #8 preview.

## Top 3

Weights reflect that type carries trust and legibility while colour, imagery and motion carry joy. Scores run 1–3 (judgement, from §1–§3), and the total is Σ(weight × score) / 3, out of 100.

| Criterion (weight) | PJS | Figtree | Hind | Mukta | Poppins | Nunito | Baloo 2 |
|---|---|---|---|---|---|---|---|
| Trust: calm, not childish (20) | 3 | 3 | 3 | 3 | 2 | 2 | 1 |
| Brand: wordmark kinship, not generic (20) | 3 | 2 | 2 | 2 | 1 | 1 | 1 |
| Phone legibility: x-height, width (20) | 3 | 2 | 2 | 1 | 3 | 2 | 1 |
| Tabular figures (15) | 3 | 3 | 1 | 3 | 1 | 3 | 3 |
| Joy / warmth (10) | 2 | 3 | 1 | 1 | 2 | 3 | 3 |
| Latin bytes (10) | 2 | 3 | 3 | 2 | 3 | 1 | 1 |
| Native Devanagari (5) | 1 | 1 | 3 | 2 | 3 | 1 | 2 |
| **Total** | **90** | **83** | **70** | **68** | **67** | **63** | **52** |

1. **Plus Jakarta Sans 400 / 700**
   - Heading: 700, 32/38 px on phone, `tracking-tight`: "Every pet deserves a friend".
   - Body: 400, 16/24: "Enter the art Competition by 30 Nov 2026. Ages 6–16."
   - Buttons: 700, 16 px.
2. **Figtree 400 / 700**
   - Heading: 700, 32/38 px: "Every pet deserves a friend".
   - Body: 400, **17**/26 px: "Enter the art Competition by 30 Nov 2026. Ages 6–16."
   - Choose it if prototype #8 finds Plus Jakarta Sans too corporate, or the bytes matter. On Google's files it saves 6.9 KiB of Latin and 11.2 KiB of latin-ext.
3. **Hind 400 / 600**
   - Heading: 600, 30/36 px: "हर जानवर को एक दोस्त चाहिए" / "Every pet deserves a friend".
   - Body: 400, **17**/26 px: "कला प्रतियोगिता में 30 नवंबर 2026 तक भाग लें। आयु 6–16।" / "Enter the art Competition by 30 Nov 2026. Ages 6–16."
   - The only one-family option that covers Hindi. Costs: no tabular figures, static files, a calmer and less joyful tone.

Rejected:
- Nunito: largest file, low x-height, rounded look against the wordmark.
- Baloo 2: display face, childish for body text.
- Mukta: second-smallest x-height (0.468; only Baloo 2 is lower), narrow, heavy Devanagari (127 KiB).
- Poppins as the primary face: generic look, wide, no tabular figures. Its Devanagari is still the recommended Hindi pair (§2).

## Recommendation

Keep SPEC §4.8 = Plus Jakarta Sans 400/700, self-hosted with `next/font/local` from committed files.

**Files** (`packages/brand/fonts`, with `OFL.txt`; record the two build commands next to them):
- `PlusJakartaSans-latin.woff2`: variable wght 200–800, a Latin + ₹ subset of google/fonts `PlusJakartaSans[wght].ttf` (`fontTools subset`, Google's latin range plus `U+20B9`, `--layout-features+=tnum`), 26.0 kB. Rare latin-ext letters (ā, ś in transliterated names) fall back to the system face. Add a latin-ext file only if real data needs it.
- `PlusJakartaSans-Regular.ttf` and `-Bold.ttf`: static 400/700 instances of the same TTF (`fontTools varLib.instancer`), about 96.5 kB each, with the full glyph set including latin-ext and ₹. Two consumers need these:
  - The worker: `@react-pdf/renderer` takes only TTF/WOFF and does not support variable fonts.
  - OG images: `next/og` `ImageResponse` rejects woff2 (next.js#63935).
  - google/fonts ships Plus Jakarta Sans only as a variable TTF.

**Why `next/font/local` rather than `next/font/google`**:
- One source feeds web, worker and OG; §3.2 already puts brand assets in `packages/brand`.
- ₹ sits inside the Latin file, so money pages need no latin-ext fetch and get no ₹ swap.
- The build no longer fetches from Google. The extensionless-URL build flake (next.js#99114) is fixed in 16.4.5, so this is now a minor reason.
- `declarations` (`size-adjust`, `unicode-range`) becomes available.

```ts
// apps/web/app/fonts.ts: variable file, all weights; Turbopack's root is the pnpm workspace root, so the path resolves
import localFont from 'next/font/local'
export const sans = localFont({
  src: '../../../packages/brand/fonts/PlusJakartaSans-latin.woff2',
  weight: '200 800',
  variable: '--font-jakarta',
  display: 'swap',
})
```

```css
@theme inline { --font-sans: var(--font-jakarta), system-ui, sans-serif; }
@theme {
  --font-weight-*: initial;          /* only two weights exist; font-light, font-black etc. generate nothing */
  --font-weight-normal: 400;
  --font-weight-bold: 700;
  --font-weight-medium: 700;         /* shadcn/ui uses font-medium (Button, Label) and font-semibold (titles) */
  --font-weight-semibold: 700;
}
```

- Visual result of the remap: shadcn buttons, labels, card and dialog titles and table heads render at 700, which matches "Buttons: 700". Nothing ever renders at 500 or 600, and newly added shadcn components need no edits.
- Use `tabular-nums` on bids, countdowns, amounts, scores, finance tables and IDs.
- **Worker**: `Font.register({ family: 'Plus Jakarta Sans', fonts: [{ src: <Regular.ttf>, fontWeight: 400 }, { src: <Bold.ttf>, fontWeight: 700 }] })`. Make `packages/brand` a dependency of `apps/api` so `turbo prune` copies the fonts into the image. OG image routes read the same TTFs into `ImageResponse`'s `fonts`.
- **Certificates and receipts**: Plus Jakarta Sans has no Devanagari, and the worker registers no fallback. Until OD-03 adds a tested Devanagari face to the worker, name fields printed on certificates and receipts (`recipientName`, `schoolNameSnapshot`, donor name) accept Latin script only (Latin + Latin Extended letters, marks, space, hyphen, apostrophe, period). Enforce this in the shared Zod schema.
- **Email** (`packages/emails`): `font-family: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`, with no web-font link. Gmail and most Outlook clients ignore `@font-face`, and hosting a public woff2 for email would be another dependency.
- Later, in the PR that implements OD-03 (not before):

```ts
export const deva = localFont({
  src: [
    { path: '../../../packages/brand/fonts/Poppins-devanagari-400.woff2', weight: '400' }, // or Hind 400/700
    { path: '../../../packages/brand/fonts/Poppins-devanagari-700.woff2', weight: '700' },
  ],
  preload: false,
  variable: '--font-deva',
  declarations: [{ prop: 'unicode-range', value: 'U+0900-097F, U+1CD0-1CF4, U+1CF7-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B0A' }],
})
// then: --font-sans: var(--font-jakarta), var(--font-deva), system-ui, sans-serif
```

### SPEC text for the #12 `docs:` PR

- **NFR-01**: replace "fonts self-hosted, two weights max" with "fonts self-hosted from committed files; one variable file per subset or two static weights; two weights used (400/700)".
- **§4.8**: replace "Plus Jakarta Sans self-hosted via `next/font`." with: "Plus Jakarta Sans 400/700, self-hosted with `next/font/local` from `packages/brand/fonts` (with `OFL.txt`): a variable Latin + ₹ woff2 for the web; static 400/700 TTFs for worker PDFs/PNGs and OG images. `tabular-nums` on money, bids, countdowns, scores and IDs. Dashboards use the same face and weights (14 px data, 12 px meta only). Emails use a system stack led by 'Plus Jakarta Sans', with no web-font link. Devanagari (OD-03): Poppins Devanagari 400/700 (or Hind 400/700) second in the stack, `preload: false`, `unicode-range`."
- **§7.6 (FR-CERT-04) and receipt name fields**: "Names printed on certificates and receipts accept Latin script only until a Devanagari face is registered in the worker and tested (conjuncts, the ि matra)."
- **§4.4**: "ID lookups accept the letter O for the digit 0 in the numeric segment; prefixes stay strict."

## Open risks

- **₹ and CLS**: the Latin + ₹ file removes the latin-ext fetch on money pages. If `next/font/google` is kept instead, put a `latin-ext` preload only in the money-route segment layouts, not the root (next/font preloads per layout).
  - #8 acceptance check: CLS < 0.1 on an Android device for `/competitions/[slug]` and `/auctions/[id]`. next/font's metric-adjusted fallback uses `local('Arial')`, which Android may not have.
- **Devanagari harmony**: unverified on a phone, whether the partner is Poppins (headline ≈ PJS cap) or Hind (14% shorter; use `font-size-adjust`).
  - Hindi pages will mix scripts, because content entities stay English (§4.5).
  - next/font puts its Arial-based fallback face into `--font-jakarta`, ahead of `--font-deva`. Check that Devanagari still falls through on Android and iOS.
- **Other scripts in PDFs**: react-pdf's complex-script shaping has open bugs (#3555, Arabic), and Devanagari is untested. The Latin-only name rule covers this until OD-03.
- **Phones and specimens**: tone, pairing and small-size calls come from an uncommitted desktop render. Before the visual direction is final, #8 must capture 12/14/16 px on a mid-range Android (Chrome and Samsung Internet), iOS 16 Safari and Windows Chrome from a Vercel preview, and commit or link the specimens, including the flat logo variant.
- **Drift**: the byte counts come from the Google build on 2026-11-16 (Plus Jakarta Sans is at v12). Google re-versions files without notice, so treat them as approximate. The committed files make the web build independent of this.

## Sources (accessed 2026-11-16 unless noted)

- Google Fonts CSS2 API responses, e.g. https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800 (sizes, subsets, unicode-ranges, file URLs)
- Google Fonts family metadata: https://fonts.google.com/metadata/fonts (axes, subsets, designers, category, popularity)
- google/fonts `METADATA.pb` (licence OFL) and `DESCRIPTION.en_us.html` (plusjakartasans, nunito, baloo2, mukta, hind, poppins, anekdevanagari, notosansdevanagari): https://github.com/google/fonts/tree/main/ofl
- Hind (Devanagari 94% of Latin caps) and Poppins (Devanagari base = Latin ascender): https://github.com/google/fonts/blob/main/ofl/hind/DESCRIPTION.en_us.html · https://github.com/google/fonts/blob/main/ofl/poppins/DESCRIPTION.en_us.html
- Plus Jakarta Sans variable TTF (GSUB ss01–ss03, static instances built from it): https://github.com/google/fonts/blob/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf · upstream README: https://github.com/tokotype/PlusJakartaSans (crawled 2026-11-12)
- Figtree quotes: https://github.com/google/fonts/blob/main/ofl/figtree/article/ARTICLE.en_us.html
- Next.js 16.4.5 `next/font` reference (`weight`, `subsets`, preload per layout, `declarations` local-only): https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/02-components/font.mdx
- `next/font/google` user agent: https://github.com/vercel/next.js/blob/v16.4.5/packages/font/src/google/fetch-resource.ts
- `subsets` is a preload list, not a filter: https://github.com/vercel/next.js/issues/42361
- Google build flake and fix: https://github.com/vercel/next.js/issues/99114 · https://github.com/vercel/next.js/pull/100158
- Turbopack root (auto-detected from `pnpm-lock.yaml`): https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.mdx
- `ImageResponse` fonts and the woff2 rejection: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/04-functions/image-response.mdx · https://github.com/vercel/next.js/issues/63935
- react-pdf fonts (TTF/WOFF only, no variable fonts): https://react-pdf.org/fonts · shaping bug: https://github.com/diegomura/react-pdf/issues/3555
- MDN `unicode-range` (page dated 2026-04-20): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/unicode-range
- MDN `font-size-adjust` and browser-compat-data (Chrome 127, Safari 16.4; two-value form Safari 17): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-size-adjust · https://github.com/mdn/browser-compat-data/blob/main/css/properties/font-size-adjust.json
- Tailwind CSS v4 theme (`--font-weight-*: initial` removes the default weight utilities): https://tailwindcss.com/docs/theme
- shadcn/ui Button (`font-medium`): https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx
- Email `@font-face` support: https://www.caniemail.com/features/css-at-font-face/
- OpenType `OS/2` table (sxHeight, sCapHeight): https://learn.microsoft.com/en-us/typography/opentype/spec/os2
