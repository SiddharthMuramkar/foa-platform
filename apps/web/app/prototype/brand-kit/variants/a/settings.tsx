// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant A, FR-STAMP-03 settings (placement and opacity are settings) and honest notes.
// Phones get a card list, md and up a table (SPEC §4.8).
import report from "./report.json";
import settings from "./stamp-settings.json";
import { Section } from "./ui";

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const S = settings;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const icon = (file: string) => report.icons.find((i) => i.file === file);

type Row = {
  derivative: string;
  element: string;
  placement: string;
  opacity: string;
  scale: string;
  min: string;
  busy: string;
};

const ROWS: Row[] = [
  {
    derivative: "Favicon 16 / 32 / 48",
    element: "Whole logo on a white rounded plate",
    placement: "Centred; logo full width at 16, 1–2 px margin at 32/48",
    opacity: "100%",
    scale: S.icons.favicon.map((f) => `${f.logoWidth} px`).join(" / "),
    min: "16 px icon",
    busy: "n/a (plate)",
  },
  {
    derivative: "Apple touch 180",
    element: "Whole logo on opaque white",
    placement: "Centred, 16 px margin",
    opacity: "100%",
    scale: `${S.icons.appleTouch.logoWidth} px`,
    min: "n/a",
    busy: "n/a",
  },
  {
    derivative: "Maskable 512",
    element: "Whole logo on opaque white",
    placement: `Centred inside the ${S.icons.maskable.safeDiameter} px safe circle`,
    opacity: "100%",
    scale: `${report.safeZone.logoWidthShare}% of the width`,
    min: "n/a",
    busy: "n/a",
  },
  {
    derivative: "OG card 1200×630",
    element: "Whole logo on the white band",
    placement: `Top-left, ${S.og.margin} px`,
    opacity: "100%",
    scale: `${S.og.logoWidth} px`,
    min: "n/a",
    busy: "Artwork never sits behind the logo",
  },
  {
    derivative: "Gallery preview 1600 + social kit",
    element: "Whole logo, multiply, on a soft white backing",
    placement: `${cap(S.preview.placement)}, ${pct(S.preview.margin)} margin`,
    opacity: `${pct(S.preview.opacity)} (backing ${pct(S.preview.backing.opacity)})`,
    scale: `${pct(S.preview.scale)} of the long edge`,
    min: `Logo ${S.preview.minLogoWidth} px wide`,
    busy: `Luma < ${S.preview.busy.lumaBelow} or spread > ${S.preview.busy.stdAbove} → backing ${pct(S.preview.busy.backingOpacity)}`,
  },
  {
    derivative: "Judging 2560",
    element: `Whole logo + “${S.judging.text}” label on a white plate`,
    placement: `${cap(S.judging.placement)}, ${pct(S.judging.margin)} margin`,
    opacity: `${pct(S.judging.opacity)} (whole label)`,
    scale: `${pct(S.judging.scale)} of the long edge`,
    min: "n/a",
    busy: `Plate (${pct(S.judging.plate.opacity)}) keeps it legible; never moves`,
  },
  {
    derivative: "Certificate share 1080×1350",
    element: "Whole logo on the white certificate",
    placement: `Top-centre, y ${S.certificate.logoTop}`,
    opacity: "100%",
    scale: `${S.certificate.logoWidth} px`,
    min: "n/a",
    busy: "n/a (white card)",
  },
];

const COLS: [keyof Row, string][] = [
  ["element", "Element"],
  ["placement", "Placement"],
  ["opacity", "Default opacity"],
  ["scale", "Scale"],
  ["min", "Minimum"],
  ["busy", "Busy or dark Artwork"],
];

export function SettingsSection() {
  return (
    <Section
      id="a-settings"
      n={6}
      title="Stamp settings"
      ships={
        <>
          <code>packages/brand</code>: <code>foa-logo-flat.png</code> (+ SVG from #6) and these defaults as worker settings
        </>
      }
      spec={["FR-STAMP-03", "FR-STAMP-01", "FR-STAMP-04"]}
    >
      <ul className="space-y-3 md:hidden">
        {ROWS.map((r) => (
          <li key={r.derivative} className="rounded-xl border border-bk-border bg-bk-surface p-4">
            <p className="font-bold">{r.derivative}</p>
            <dl className="mt-2 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              {COLS.map(([k, label]) => (
                <div key={k} className="contents">
                  <dt className="text-bk-muted">{label}</dt>
                  <dd>{r[k]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border border-bk-border md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Variant A stamp settings per derivative</caption>
          <thead className="bg-(--va-sunken)">
            <tr>
              <th scope="col" className="p-3 font-bold">
                Derivative
              </th>
              {COLS.map(([k, label]) => (
                <th key={k} scope="col" className="p-3 font-bold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.derivative} className="border-t border-bk-border bg-bk-surface align-top">
                <th scope="row" className="p-3 font-bold">
                  {r.derivative}
                </th>
                {COLS.map(([k]) => (
                  <td key={k} className="p-3">
                    {r[k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function NotesSection() {
  const i16 = icon("icon-16.png");
  const i32 = icon("icon-32.png");
  const i48 = icon("icon-48.png");
  const mk = icon("icon-maskable-512.png");
  const w = report.watermark;
  const def = w.ladder.find((l) => l.opacity === S.preview.opacity);
  const half = w.ladder.find((l) => l.opacity === 0.5);
  const launcherWordmark = mk ? Math.round(((52 * mk.wordmarkPx) / 512) * 10) / 10 : 0;
  const notes: { title: string; body: string }[] = [
    {
      title: "16 px is three colour bars",
      body: `The logo is ${i16?.logoWidth}×${i16?.logoHeight} px: letters ${i16?.letterPx} px, wordmark ${i16?.wordmarkPx} px, paw mark ${i16?.markPx} px. Only red-green-blue survives. 32 px gives ${i32?.letterPx} px letter blobs and a ${i32?.wordmarkPx} px grey line; 48 px is the first size where F, O, A read (${i48?.letterPx} px).`,
    },
    {
      title: "The plate changes with the tab colour",
      body: "Dark browser chrome: a bright white square, the loudest tab in the strip. Light chrome: the plate vanishes and only a thin stripe of logo is left.",
    },
    {
      title: "App icons keep everything, small",
      body: `The logo fills ${report.safeZone.logoWidthShare}% of the maskable icon so every launcher mask keeps it whole; on a ~52 dp Android icon the wordmark is about ${launcherWordmark} dp tall. On a pale iOS wallpaper the white icon has no edge.`,
    },
    {
      title: "Square link thumbnails lose the logo",
      body: "Compact previews centre-crop the 1200×630 card to a square, which cuts the top-left logo off. A centred logo would survive, but would sit on the Artwork.",
    },
    {
      title: "18% is a ghost, not a logo",
      body: `Measured on output pixels at ${Math.round(S.preview.opacity * 100)}%: letters vs tiles ${def?.light.lettersVsTiles}:1 on light Artwork and ${def?.dark.lettersVsTiles}:1 on dark; wordmark ${def?.light.wordmark}:1. At 50%: ${half?.light.lettersVsTiles}:1 and ${half?.light.wordmark}:1. FR-STAMP-01 says every public image “carries the FOA logo”; whether a ghost counts is a product-owner call on the default, not a logo change.`,
    },
    {
      title: "Dark Artwork gets a white patch",
      body: `With no transparent logo, the stamp needs white under it. On the dark test surface the rule raises the backing to ${Math.round(w.dark.backingOpacity * 100)}%, and the patch becomes the most visible thing in the corner.`,
    },
    {
      title: "Text in the images",
      body: "Card, label and certificate text use the self-hosted Plus Jakarta Sans 400/700 TTFs. On macOS sharp ignores font files, so this prototype draws text layers in headless Chrome; the Linux worker can render the same TTFs with sharp.",
    },
    {
      title: "NFR-01",
      body: "This variant adds no client JavaScript (server components only). The framework baseline measured at setup (about 178 KB gzip on an empty page) is already over the 170 KB budget; that is not something a brand kit can fix.",
    },
  ];
  return (
    <Section id="a-notes" n={7} title="Honest notes" ships="nothing; this is what the baseline costs" spec={["NFR-A11Y", "NFR-01", "FR-STAMP-01"]}>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {notes.map((n) => (
          <li key={n.title} className="rounded-xl border border-bk-border bg-bk-surface p-4">
            <p className="font-bold">{n.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-bk-muted">{n.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
