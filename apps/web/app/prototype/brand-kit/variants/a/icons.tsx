// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant A, icons: the whole logo at every size, shown honestly (true pixels, then ×8).
import Image from "next/image";
import report from "./report.json";
import settings from "./stamp-settings.json";
import { aFile, Caption, Magnified, OpenFile, Section, SpecCard, Sub } from "./ui";

type IconRow = (typeof report.icons)[number];
type Tone = "ok" | "mid" | "bad";

function verdict(r: IconRow): { tone: Tone; text: string } {
  if (r.wordmarkPx >= 8) return { tone: "ok", text: "Tiles, letters, paw mark and wordmark all read" };
  if (r.letterPx >= 8) return { tone: "mid", text: `Letters read; wordmark is a ${r.wordmarkPx} px grey line` };
  if (r.letterPx >= 5) return { tone: "mid", text: `Letters are ${r.letterPx} px blobs; wordmark a ${r.wordmarkPx} px smear` };
  return { tone: "bad", text: "Three colour bars; letters, paw mark and wordmark are gone" };
}
const toneClass: Record<Tone, string> = {
  ok: "text-(--va-ok-text)",
  mid: "text-bk-fg",
  bad: "text-(--va-warn-text)",
};
const toneMark: Record<Tone, string> = { ok: "Reads", mid: "Partly", bad: "Breaks" };

const byFile = (file: string) => {
  const r = report.icons.find((i) => i.file === file);
  if (!r) throw new Error(`report.json has no icon ${file}; run variants/a/build.mjs`);
  return r;
};

/** Hero: the real generated icons, largest to smallest, at true CSS pixels (512 scaled to fit a phone). */
export function ScaleLadder() {
  const rows = [
    { file: "icon-maskable-512.png" as const, show: 176, note: "maskable 512 · scaled to 176 px or less" },
    { file: "icon-180.png" as const, show: 180, note: "apple-touch 180 · true size from 640 px wide" },
    { file: "icon-48.png" as const, show: 48, note: "favicon 48 · true size" },
    { file: "icon-32.png" as const, show: 32, note: "favicon 32 · true size" },
    { file: "icon-16.png" as const, show: 16, note: "favicon 16 · true size" },
  ];
  return (
    <figure className="rounded-2xl border border-bk-border bg-(--va-sunken) p-4 sm:p-6">
      <ol className="grid grid-cols-2 gap-x-4 gap-y-8 sm:flex sm:flex-wrap sm:items-end sm:gap-x-8">
        {rows.map(({ file, show, note }, i) => {
          const f = aFile(file);
          const r = byFile(file);
          const v = verdict(r);
          return (
            <li key={file} className="flex min-w-0 flex-col gap-2 sm:max-w-[11.5rem]">
              <div className="flex min-h-12 items-end">
                <Image
                  unoptimized
                  preload={i === 0}
                  src={f.src}
                  width={f.width}
                  height={f.height}
                  alt={`Whole FOA logo icon, ${f.width} pixels`}
                  style={{ width: show }}
                  className={`h-auto max-w-full ${show <= 48 ? "[image-rendering:pixelated]" : ""}`}
                />
              </div>
              <p className="text-xs text-bk-muted">{note}</p>
              <p className="text-sm">
                <span className={`font-bold ${toneClass[v.tone]}`}>{toneMark[v.tone]}:</span> {v.text}
              </p>
              <p className="text-xs tabular-nums text-bk-muted">
                logo {r.logoWidth}×{r.logoHeight} px · letters {r.letterPx} · wordmark {r.wordmarkPx} · paw {r.markPx}
              </p>
            </li>
          );
        })}
      </ol>
      <Caption>
        The same unchanged logo, only scaled. Measured from the files <code className="text-bk-fg">build.mjs</code> wrote: letter,
        wordmark and paw-mark heights in output pixels. Under about 48 px the logo stops being a logo and becomes
        three colour bars.
      </Caption>
    </figure>
  );
}

function TabStrip({ mode }: { mode: "light" | "dark" }) {
  const c =
    mode === "light"
      ? {
          strip: "bg-(--va-tab-strip-light)",
          active: "bg-(--va-tab-active-light) text-(--va-tab-text-light)",
          idle: "text-(--va-tab-text-light-inactive)",
          url: "bg-(--va-tab-active-light) text-(--va-tab-text-light-inactive)",
        }
      : {
          strip: "bg-(--va-tab-strip-dark)",
          active: "bg-(--va-tab-active-dark) text-(--va-tab-text-dark)",
          idle: "text-(--va-tab-text-dark-inactive)",
          url: "bg-(--va-tab-active-dark) text-(--va-tab-text-dark-inactive)",
        };
  const i16 = aFile("icon-16.png");
  const i32 = aFile("icon-32.png");
  return (
    <figure>
      <div className={`overflow-hidden rounded-xl ${c.strip}`}>
        <div className="flex items-end gap-1 px-2 pt-2">
          <div className={`flex h-9 min-w-0 flex-1 items-center gap-2 rounded-t-lg px-3 ${c.active}`}>
            <Image unoptimized src={i16.src} width={16} height={16} alt="FOA favicon, 16 pixel file" className="size-4 shrink-0 [image-rendering:pixelated]" />
            <span className="truncate text-xs">Paws &amp; Pencils 2027 · 1× screen</span>
          </div>
          <div className={`flex h-9 min-w-0 flex-1 items-center gap-2 px-3 ${c.idle}`}>
            <Image unoptimized src={i32.src} width={32} height={32} alt="FOA favicon, 32 pixel file drawn at 16 CSS pixels" className="size-4 shrink-0" />
            <span className="truncate text-xs">Gallery · 2× screen</span>
          </div>
          <div className={`hidden h-9 min-w-0 flex-1 items-center gap-2 px-3 sm:flex ${c.idle}`}>
            <span aria-hidden="true" className="size-4 shrink-0 rounded-full bg-current opacity-50" />
            <span className="truncate text-xs">Inbox</span>
          </div>
        </div>
        <div className={`px-3 py-2 ${mode === "light" ? "bg-(--va-tab-active-light)" : "bg-(--va-tab-active-dark)"}`}>
          <p className={`truncate rounded-full px-3 py-1 text-xs ${c.url}`}>foaglobal.org/competitions/paws-and-pencils-2027</p>
        </div>
      </div>
      <Caption>
        {mode === "light" ? "Light" : "Dark"} browser chrome. Tab 1 draws <code>icon-16.png</code> pixel for pixel (a 1× screen); tab 2
        draws <code>icon-32.png</code> at 16 CSS px (what a 2× screen shows).
        {mode === "dark" ? " The white plate makes FOA the brightest tab in a dark strip." : " On light chrome the plate disappears and the logo reads as a thin stripe."}
      </Caption>
    </figure>
  );
}

function HomeRow({ os }: { os: "ios" | "android" }) {
  const ios = os === "ios";
  const icon = ios ? aFile("icon-180.png") : aFile("icon-maskable-512.png");
  const size = ios ? 60 : 52;
  const mask = ios ? "rounded-[22.4%]" : "rounded-full";
  const wall = ios ? "bg-(--va-wallpaper-light) text-(--va-wallpaper-light-label)" : "bg-(--va-wallpaper-dark) text-(--va-wallpaper-dark-label)";
  const ph = ios ? "bg-(--va-app-placeholder-light)" : "bg-(--va-app-placeholder-dark)";
  return (
    <figure>
      <div className={`rounded-2xl px-4 py-5 ${wall}`}>
        <ul className="grid grid-cols-4 justify-items-center gap-y-4">
          <li className="flex flex-col items-center gap-1.5">
            <Image unoptimized src={icon.src} width={icon.width} height={icon.height} alt={`FOA app icon, ${ios ? "iOS rounded square" : "Android circle"} mask`} style={{ width: size, height: size }} className={`${mask} shadow-sm`} />
            <span className="text-[11px] leading-none">FOA</span>
          </li>
          {["Camera", "Notes", "Maps"].map((n) => (
            <li key={n} className="flex flex-col items-center gap-1.5" aria-hidden="true">
              <span className={`block ${mask} ${ph}`} style={{ width: size, height: size }} />
              <span className="text-[11px] leading-none">{n}</span>
            </li>
          ))}
        </ul>
      </div>
      <Caption>
        {ios
          ? "iOS, light wallpaper, 60 pt: icon-180.png in the system rounded-square mask. White plate on a pale wallpaper: the icon has no edge."
          : "Android, dark wallpaper, about 52 dp: icon-maskable-512.png in a circle mask. The logo fills 67.5% of the width, so the wordmark is under 3 dp tall."}
      </Caption>
    </figure>
  );
}

function MaskCheck() {
  const m = aFile("icon-maskable-512.png");
  const sz = report.safeZone;
  const masks = [
    { label: "Circle", cls: "rounded-full" },
    { label: "Squircle", cls: "rounded-[22.4%]" },
    { label: "Rounded square", cls: "rounded-[12%]" },
    { label: "Teardrop", cls: "rounded-[50%_50%_12%_50%]" },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <figure className="sm:w-52">
        <div className="relative size-44">
          <Image unoptimized src={m.src} width={m.width} height={m.height} alt="Maskable 512 icon, full bleed" className="size-44 rounded-sm ring-1 ring-bk-border" />
          <svg viewBox="0 0 512 512" className="pointer-events-none absolute inset-0 size-44" aria-hidden="true">
            <circle cx="256" cy="256" r={sz.safeRadius} fill="none" stroke="var(--va-safe-zone)" strokeWidth="5" strokeDasharray="14 10" />
          </svg>
        </div>
        <Caption>
          Dashed: the 80% safe circle ({sz.safeRadius * 2} px). Logo corners sit {sz.logoCornerRadius} px from the centre, inside it.
        </Caption>
      </figure>
      <figure>
        <ul className="grid grid-cols-4 gap-3">
          {masks.map((k) => (
            <li key={k.label} className="flex flex-col items-center gap-1.5">
              <Image unoptimized src={m.src} width={m.width} height={m.height} alt={`Maskable icon in a ${k.label.toLowerCase()} mask`} className={`aspect-square h-auto w-full max-w-20 ${k.cls}`} />
              <span className="text-center text-xs text-bk-muted">{k.label}</span>
            </li>
          ))}
        </ul>
        <Caption>Every launcher mask keeps the whole logo, at the cost of a small logo.</Caption>
      </figure>
    </div>
  );
}

export function IconsSection() {
  const fav = settings.icons.favicon;
  return (
    <Section
      id="a-icons"
      n={1}
      title="Favicons and app icons"
      ships={
        <>
          <code>icon-16/32/48.png</code> on a white rounded plate, <code>icon-180.png</code> (apple-touch), <code>icon-maskable-512.png</code>
        </>
      }
      spec={["§3.2 packages/brand", "§4.8", "NFR-01"]}
    >
      <Sub title="×8, nearest neighbour">
        <div className="flex flex-wrap items-end gap-6">
          <Magnified file="icon-16.png" scale={8} label="16, on plate (ships)" />
          <Magnified file="icon-16-bare.png" scale={8} label="16, no plate" />
          <Magnified file="icon-32.png" scale={8} label="32, on plate (ships)" />
        </div>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-bk-muted">
          At 16 px the logo is {byFile("icon-16.png").logoWidth}×{byFile("icon-16.png").logoHeight} px: the F, O and A are{" "}
          {byFile("icon-16.png").letterPx} px tall, the wordmark {byFile("icon-16.png").wordmarkPx} px. What survives is
          red-green-blue. The plate adds no artwork; it is white like the logo&apos;s own background, so the logo reads as one
          piece on any tab colour.
        </p>
      </Sub>

      <Sub title="Browser tabs">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TabStrip mode="light" />
          <TabStrip mode="dark" />
        </div>
      </Sub>

      <Sub title="Home screen, true size">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HomeRow os="ios" />
          <HomeRow os="android" />
        </div>
      </Sub>

      <Sub title="Maskable crop check">
        <MaskCheck />
      </Sub>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SpecCard
          rows={[
            ["Element", "Whole logo, unchanged"],
            ["Plate", "White, rounded (16, 32, 48); opaque square (180, 512)"],
            ["Logo width", `${fav.map((f) => `${f.logoWidth} px in ${f.size}`).join(", ")}; 148 px in 180; ${report.safeZone.logoWidthShare}% of 512`],
            ["Maskable", `Logo diagonal ${settings.icons.maskable.logoDiagonal} px, inside the ${settings.icons.maskable.safeDiameter} px circle`],
          ]}
        />
        <div className="flex flex-col gap-2">
          <OpenFile file="icon-16.png" />
          <OpenFile file="icon-32.png" />
          <OpenFile file="icon-48.png" />
          <OpenFile file="icon-180.png" />
          <OpenFile file="icon-maskable-512.png" />
        </div>
      </div>
    </Section>
  );
}
