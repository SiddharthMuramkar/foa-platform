// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Mark tier, part 1: favicons and app icons. Every <Image> here is `unoptimized` so the page shows the
// exact generated pixels (BRIEF: icons ≤ 512 px).
import Image from "next/image";
import { competition } from "../../fixtures";
import { bFile, R } from "./kit";
import { Figure, Section } from "./ui";
import { s } from "./cls";

const i16 = bFile("icon-16.png");
const i32 = bFile("icon-32.png");
const i48 = bFile("icon-48.png");
const i180 = bFile("icon-180.png");
const i512 = bFile("icon-maskable-512.png");
const iRing = bFile("icon-180-ring-rejected.png");
const ICON_ALT = "FOA paw-and-hands mark on a white disc";

function TabStrip({ mode, hiDpi = false }: { mode: "light" | "dark"; hiDpi?: boolean }) {
  const icon = hiDpi ? i32 : i16;
  return (
    <div className={`${mode === "dark" ? s.tabsDark : s.tabsLight} ${s.tabBar} overflow-hidden rounded-lg`}>
      <div className="flex items-end gap-1 px-2 pt-2">
        <div className={`${s.tabActive} flex min-w-0 max-w-[15rem] flex-1 items-center gap-2 rounded-t-lg px-3 py-2`}>
          <Image src={icon.src} width={icon.width} height={icon.height} alt="" unoptimized className="size-4 shrink-0" />
          <span className="truncate text-[13px]">{competition.title} · Friends of Animals</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          <span aria-hidden className="size-4 shrink-0 rounded-sm bg-current opacity-25" />
          <span className="truncate text-[13px]">New tab</span>
        </div>
      </div>
      <div className={`${s.tabActive} px-3 py-1.5 text-[12px]`}>foaglobal.org/gallery</div>
    </div>
  );
}

function Magnified({ file, mag, mode }: { file: typeof i16; mag: number; mode: "light" | "dark" }) {
  const px = file.width * mag;
  return (
    <Figure caption={`${file.width} px ×${mag}, ${mode} tab colour`}>
      <div className={`${mode === "dark" ? s.tabsDark : s.tabsLight} ${s.tabBar} grid place-items-center rounded-lg p-3`}>
        <Image
          src={file.src}
          width={file.width}
          height={file.height}
          alt={`${ICON_ALT}, ${file.width} px, magnified ${mag} times`}
          unoptimized
          className={s.pixelated}
          style={{ width: px, height: px }}
        />
      </div>
    </Figure>
  );
}

export function FaviconSection() {
  return (
    <Section
      id="b-favicons"
      tier="mark"
      title="Favicons: 16, 32, 48 px"
      lede="The mark alone, on a white disc with transparent corners. On dark tab bars the disc gives the green a clean edge; on light bars it melts away and the green dot carries the icon."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Figure caption="Light browser, icon-16 at real size (CSS px)">
          <TabStrip mode="light" />
        </Figure>
        <Figure caption="Dark browser, icon-16 at real size">
          <TabStrip mode="dark" />
        </Figure>
        <Figure caption="Light browser on a 2× screen: the browser picks icon-32 for the same 16 px slot">
          <TabStrip mode="light" hiDpi />
        </Figure>
        <Figure caption="Dark browser on a 2× screen (icon-32)">
          <TabStrip mode="dark" hiDpi />
        </Figure>
      </div>
      {[
        [i16, 8],
        [i32, 8],
        [i48, 4],
      ].map(([f, mag]) => (
        <div key={(f as typeof i16).src} className="flex flex-wrap items-end gap-4">
          <Magnified file={f as typeof i16} mag={mag as number} mode="light" />
          <Magnified file={f as typeof i16} mag={mag as number} mode="dark" />
        </div>
      ))}
      <p className="max-w-prose text-sm leading-relaxed text-bk-muted">
        Honest read at 16 px: the four toes merge into one white blob and the hands become a one-pixel smile. It is
        recognisable as &ldquo;green dot with a white paw&rdquo;, not as the drawing. At 32 px the toes separate.
      </p>
    </Section>
  );
}

function HomeRow({ label, kind }: { label: string; kind: "ios" | "android" }) {
  const icon = kind === "ios" ? i180 : i512;
  const mask = kind === "ios" ? s.squircle : "rounded-full";
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold opacity-90">{label}</p>
      <ul className="grid grid-cols-4 gap-3">
        <li className="flex flex-col items-center gap-1">
          <Image
            src={icon.src}
            width={icon.width}
            height={icon.height}
            alt={ICON_ALT}
            unoptimized
            className={`${mask} size-[60px] shadow-sm`}
          />
          <span className="text-[11px]">FOA</span>
        </li>
        {["Camera", "Notes", "Maps"].map((n) => (
          <li key={n} className="flex flex-col items-center gap-1" aria-hidden>
            <span className={`${mask} ${s.phoneSlot} block size-[60px]`} />
            <span className="text-[11px] opacity-90">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AppIconSection() {
  const zone = R.icons["icon-maskable-512.png"];
  return (
    <Section
      id="b-app-icons"
      tier="mark"
      title="App icons: 180 and maskable 512"
      lede="Full-bleed white square with the mark centred: iOS shows transparent corners as black, and a maskable icon should fill its whole square. The phone draws the corner shape, not us."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Figure caption={`apple-touch-icon, 180 px at real size. Mark scale ${R.icons["icon-180.png"].scale}× (a reduction: crisp).`}>
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-bk-border bg-bk-bg p-4">
            <Image src={i180.src} width={180} height={180} alt={`${ICON_ALT}, 180 px`} unoptimized className="size-[180px]" />
            <Image src={i180.src} width={180} height={180} alt="" unoptimized className={`${s.squircle} size-[60px]`} />
          </div>
        </Figure>
        <Figure
          caption={
            <>
              Maskable 512 shown at 256 px. <span className={s.safeZoneText}>Dashed circle</span> = safe zone, 80% ({zone.safeZoneDiameter} px of
              512). Mark radius {zone.markRadiusPx} px, well inside. Mark scale {zone.scale}×: an <strong>enlargement</strong> of the
              134 px raster crop, so edges are soft. The real SVG (#6) fixes this.
            </>
          }
        >
          <div className="rounded-lg border border-bk-border bg-bk-bg p-4">
            <div className="relative size-64">
              <Image src={i512.src} width={512} height={512} alt={`${ICON_ALT}, maskable 512 px`} unoptimized className="size-64" />
              <span aria-hidden className={`${s.safeZone} absolute inset-[10%] rounded-full`} />
            </div>
            <ul className="mt-4 flex flex-wrap gap-4" aria-label="The same file under common launcher masks">
              {[
                ["Circle", "rounded-full"],
                ["Squircle", s.squircle],
                ["Rounded square", "rounded-[12%]"],
                ["No mask", ""],
              ].map(([n, cls]) => (
                <li key={n} className="flex flex-col items-center gap-1">
                  <Image src={i512.src} width={512} height={512} alt="" unoptimized className={`${cls} size-[72px] border border-bk-border`} />
                  <span className="text-xs text-bk-muted">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Figure>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Figure caption="Home-screen mock at real phone scale: 60 px icons, labels under them. Grey squares are neutral placeholders, not real apps.">
          <div className={`${s.phone} mx-auto max-w-[360px] space-y-5 rounded-[2rem] p-5`}>
            <p className="text-center text-xs font-bold tabular-nums">9:41</p>
            <HomeRow kind="ios" label="iOS: apple-touch-icon 180" />
            <HomeRow kind="android" label="Android: maskable 512, circle launcher" />
          </div>
        </Figure>
        <Figure caption="The plain icon is the default. The ring was asked for only if it added no new artwork; it does, so it is shown here only as ruled out.">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-bk-border bg-bk-bg p-3">
              <p className="text-sm font-bold">Default: plain</p>
              <Image src={i180.src} width={180} height={180} alt="" unoptimized className={`${s.squircle} mt-2 size-24`} />
            </div>
            <div className={`${s.reject} rounded-lg p-3`}>
              <p className="text-sm font-bold">Ruled out: tri-colour ring</p>
              <Image
                src={iRing.src}
                width={iRing.width}
                height={iRing.height}
                alt="Ruled-out icon: the mark inside a red, green and blue ring"
                unoptimized
                className={`${s.squircle} mt-2 size-24 opacity-80`}
              />
              <p className="mt-2 text-xs leading-snug">New arcs drawn in the tile colours: new artwork, not the logo.</p>
            </div>
          </div>
        </Figure>
      </div>
    </Section>
  );
}
