// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// FR-STAMP-03 settings (placement and opacity are settings) and the honest notes. Every number is read
// from kit-report.json, written by build.mjs from the same constants that drew the pixels.
import { bFile, kb, pct, R, r2 } from "./kit";
import { Section } from "./ui";

const S = R.settings;
const C = R.contrast;

type Row = { element: string; placement: string; opacity: string; scale: string; min: string; busy: string };

const ROWS: Row[] = [
  {
    element: `Watermark: ${S.previewBadge.element}`,
    placement: `${S.previewBadge.placement}, inset ${S.previewBadge.insetPct}% of long edge`,
    opacity: pct(S.previewBadge.opacity),
    scale: `${S.previewBadge.heightPct}% of long edge (${R.badges.preview.h} px on 1600)`,
    min: `${S.previewBadge.minHeightPx} px tall (thumb 480 px would give 22 px)`,
    busy: `No rule needed: the badge brings its own white pill and 16% hairline. Label ≥ ${r2(Math.min(C["preview-light"].labelOnPill, C["preview-busy"].labelOnPill, C["preview-dark"].labelOnPill))} on light, busy and dark.`,
  },
  {
    element: `Judging: ${S.judgingBadge.element}`,
    placement: `${S.judgingBadge.placement}, inset ${S.judgingBadge.insetPct}%`,
    opacity: pct(S.judgingBadge.opacity),
    scale: `${S.judgingBadge.heightPct}% of long edge (${R.badges.judging.h} px on 2560)`,
    min: `${S.judgingBadge.minHeightPx} px tall`,
    busy: `Stays subtle on purpose: label ${r2(C.judging.labelOnPill)} on pale work, ${r2(C.judging.labelOnPillDarkArtwork)} on dark. Judges only; never public.`,
  },
  {
    element: `OG card: ${S.ogStamp.element}`,
    placement: S.ogStamp.placement,
    opacity: pct(S.ogStamp.opacity),
    scale: `${S.ogStamp.widthPx} px wide (24% of 1200)`,
    min: `${S.ogStamp.minWidthPx} px wide (switch rule)`,
    busy: "Never over the Artwork: sits on the white panel.",
  },
  {
    element: `Certificate: ${S.certLogo.element}`,
    placement: S.certLogo.placement,
    opacity: pct(S.certLogo.opacity),
    scale: `${S.certLogo.widthPx} px wide (41% of 1080)`,
    min: `${S.certLogo.minWidthPx} px wide`,
    busy: "White ground, fixed layout.",
  },
  {
    element: `Seal: ${S.certSeal.element}`,
    placement: S.certSeal.placement,
    opacity: pct(S.certSeal.opacity),
    scale: `${S.certSeal.diameterPx} px across`,
    min: "—",
    busy: "White ground, fixed layout.",
  },
];

const COLS: [keyof Row, string][] = [
  ["element", "Element"],
  ["placement", "Placement"],
  ["opacity", "Default opacity"],
  ["scale", "Scale"],
  ["min", "Minimum size"],
  ["busy", "Busy or dark Artwork"],
];

export function SettingsSection() {
  return (
    <Section
      id="b-settings"
      title="FR-STAMP-03 settings"
      lede="Defaults the worker would read from packages/brand. Placement and opacity are settings; the rest is the kit."
    >
      {/* Phones: cards. md and up: a table (SPEC §4.8). */}
      <ul className="space-y-3 md:hidden">
        {ROWS.map((r) => (
          <li key={r.element} className="rounded-xl border border-bk-border bg-bk-surface p-4">
            <p className="font-bold">{r.element}</p>
            <dl className="mt-2 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              {COLS.slice(1).map(([k, label]) => (
                <div key={k} className="contents">
                  <dt className="text-bk-muted">{label}</dt>
                  <dd>{r[k]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-bk-border bg-bk-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Variant B stamp settings</caption>
          <thead>
            <tr className="border-b border-bk-border">
              {COLS.map(([k, label]) => (
                <th key={k} scope="col" className="px-3 py-2 align-bottom font-bold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.element} className="border-b border-bk-border last:border-0">
                {COLS.map(([k], i) =>
                  i === 0 ? (
                    <th key={k} scope="row" className="px-3 py-2 align-top font-bold">
                      {r[k]}
                    </th>
                  ) : (
                    <td key={k} className="px-3 py-2 align-top text-bk-muted">
                      {r[k]}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function NotesSection() {
  const i16 = R.icons["icon-16.png"];
  const mk = R.icons["icon-maskable-512.png"];
  const notes: [string, string][] = [
    [
      "What breaks at 16 px",
      `The green disc is ${i16.discPx} px; toes merge, the hands are a one-pixel line. It reads as a green dot with a white paw. The name “Friends of Animals” is gone from every small size: recognition rests on the tab title and the app label.`,
    ],
    [
      "Contrast of the mark itself",
      `Green on white inside the logo is ${r2(C.markGreenOnWhite)}, right at the 3:1 line. Logos are exempt from WCAG contrast, but at the badge’s ${pct(S.previewBadge.opacity)} it falls to about ${r2(C["preview-busy"].markGreenOnPill)}. If the PO wants the mark crisper, set the badge to 100%.`,
    ],
    [
      "Light and dark browsers",
      `On a dark tab bar the white disc gives ${r2(C.whitePlateOnDarkTab)}. On a light bar the disc disappears and the green meets the bar at ${r2(C.markGreenOnLightTab)}: still a clear green dot, but no edge.`,
    ],
    [
      "Soft at 512",
      `The mark is a 134×129 px crop of a JPEG. The maskable icon enlarges it ${mk.scale}×, so edges are soft. Everything 180 px and under is a reduction and crisp. The real SVG from #6 fixes 512 with a one-line swap.`,
    ],
    [
      "Nothing of the logo is cut",
      `Round plates clip the square crop only where it is white O-ring: the darkest clipped pixel is ${i16.clippedMinChannel}/255 (badges: ${R.badges.preview.clippedMinChannel}). No ink is removed, no colour changed.`,
    ],
    [
      "Typed label",
      "“FOA” and “FOA JUDGING” are set in Plus Jakarta Sans Bold, the site font. They are labels, not lifted letterforms; flagged above for the PO.",
    ],
    [
      "Weight",
      `og-card.png is ${kb(bFile("og-card.png").bytes)}; as JPEG q82 it is ${kb(bFile("og-card-q82.jpg").bytes)}. Recommend the worker writes OG as JPEG or WebP. This variant adds no client JavaScript (server components only). The framework baseline measured at setup (≈178 KB gzip) is already over the 170 KB route budget (NFR-01): reported, not fixed here.`,
    ],
    [
      "Fonts in the worker",
      "sharp draws text with Pango. On macOS its default backend ignored the bundled font and fell back to Helvetica without an error; build.mjs forces fontconfig. The Linux worker uses fontconfig anyway, but packages/brand must ship the two TTFs.",
    ],
  ];
  return (
    <Section id="b-notes" title="Honest notes">
      <dl className="grid gap-4 md:grid-cols-2">
        {notes.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-bk-border bg-bk-surface p-4">
            <dt className="font-bold">{k}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-bk-muted">{v}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
