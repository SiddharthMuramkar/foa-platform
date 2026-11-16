// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant C "Tile trio" (BRIEF.md). Square icons use the three F·O·A tiles without the wordmark; every
// rectangular surface carries the whole logo; a thin rule in the tile colours ties the surfaces together.
// Page shape: decision first (what packages/brand ships), then a sticky jump bar into the evidence.
// Server component, no client JS. Assets: ./c/build.mjs → public/prototype/brand-kit/c/. Numbers: ./c/report.json.
import Image from "next/image";
import {
  artwork,
  certificateShare,
  childDisplayLine,
  childDisplayLineShort,
  competition,
  judgingView,
  kitAsset,
  type VariantProps,
} from "../fixtures";
import { C_TOKENS, MANIFEST, SETTINGS, STAMP_DEFAULTS, cAsset, report } from "./c/kit-data";
import {
  CTokens,
  Crop,
  Figure,
  MaskShape,
  PartBadge,
  Phone,
  Pixels,
  Scroller,
  Section,
  TabStrip,
  TriRule,
} from "./c/parts";

export const name = "Tile trio";

/** Every colour this variant uses (page chrome, mocks, and colours baked into the images), per theme. */
export const tokens = C_TOKENS;

const og = kitAsset("c", "ogCard");
const preview = kitAsset("c", "previewWatermarked");
const judging = kitAsset("c", "judgingMarked");
const cert = kitAsset("c", "certificateShare");
const i16 = report.icons["icon-16.png"];
const i32 = report.icons["icon-32.png"];
const w16 = report.icons["compare-wholelogo-16.png"];
const wm = report.watermark;
const jm = report.judging;
const kb = (n: number) => `${Math.round(n / 1024)} KB`;
const pct = (n: number) => `${Math.round(n * 100)} %`;
/** Share of a square icon outside the trio's rectangle (white plate). */
const plateShare = (f: "icon-180.png" | "icon-maskable-512.png") => {
  const i = report.icons[f];
  return pct(1 - (i.logoPx.w * i.logoPx.h) / (i.size * i.size));
};

const NAV: [string, string][] = [
  ["c-kit", "Kit"],
  ["c-icons", "Favicons"],
  ["c-home", "App icons"],
  ["c-og", "Link previews"],
  ["c-gallery", "Gallery"],
  ["c-judging", "Judging"],
  ["c-certificate", "Certificate"],
  ["c-settings", "Settings"],
  ["c-notes", "Notes"],
];

export default function VariantC({ shot }: VariantProps) {
  return (
    <main className="vc mx-auto max-w-6xl px-4 pb-32 sm:px-6 lg:px-8">
      <CTokens />

      {/* ------------------------------------------------------------------ header + decision flag */}
      <header className="pt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-bk-muted">Brand kit · issue #13 · Variant C</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Tile trio</h1>
        <p className="mt-3 max-w-3xl text-bk-muted">
          Square icons (16 to 512 px) use the three F, O, A tiles without the wordmark, padded to a square on a white
          plate. Every rectangular surface (OG card, gallery watermark, certificate) carries the whole logo. A thin rule
          in the tile colours ties the surfaces together.
        </p>
        <TriRule className="mt-5 h-1.5 w-40" />
      </header>

      <aside
        role="note"
        aria-labelledby="c-po-h"
        className="mt-6 rounded-xl border-2 border-(color:--c-flag-border) bg-(--c-flag-bg) p-4 text-bk-fg sm:p-5"
      >
        <p id="c-po-h" className="text-lg font-bold">
          Product-owner decision needed. Not agreed.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            This variant shows only <strong>part</strong> of the logo (the three tiles, without the words &ldquo;Friends of
            Animals&rdquo;) on every square icon, in the judging mark and inside the certificate seal. Whether a part of
            the logo may stand alone is the product owner&rsquo;s call. Nothing on this page is approved.
          </li>
          <li>
            The tri-colour rule is a <strong>new graphic device</strong> built from the logo&rsquo;s colours and tile
            rhythm. It never touches the logo, but it is new artwork and needs the same sign-off.
          </li>
          <li>
            If the answer is no: the icons fall back to Variant A&rsquo;s whole logo, and this variant&rsquo;s OG card,
            watermark and certificate header still work as they are (they already use the whole logo).
          </li>
        </ul>
      </aside>

      {/* ------------------------------------------------------------------ manifest */}
      <Section
        id="c-kit"
        kicker="Decision"
        title="What packages/brand ships"
        lede={
          <p>
            Seven derivatives, all made by <code>sharp</code> from exact pixels of the flat logo (scaled, never recoloured,
            redrawn or rotated). Rows marked <span className="font-bold text-bk-fg">Part of logo</span> depend on the
            product-owner decision above.
          </p>
        }
      >
        <ul className="divide-y divide-bk-border overflow-hidden rounded-xl border border-bk-border bg-bk-surface">
          <li
            aria-hidden
            className="hidden gap-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-bk-muted md:grid md:grid-cols-[72px_1fr_1.3fr_1.1fr_1.1fr]"
          >
            <span />
            <span>File</span>
            <span>Logo element</span>
            <span>Plate</span>
            <span>Used for</span>
          </li>
          {MANIFEST.map((row) => (
            <li
              key={row.files[0]}
              className="grid grid-cols-[56px_1fr] items-start gap-x-3 gap-y-2 p-4 md:grid-cols-[72px_1fr_1.3fr_1.1fr_1.1fr] md:gap-4"
            >
              <div className="row-span-4 flex size-14 items-center justify-center rounded-md border border-bk-border bg-bk-plate md:row-span-1 md:size-[72px]">
                <Image
                  src={row.thumb.src}
                  width={row.thumb.width}
                  height={row.thumb.height}
                  unoptimized={row.thumb.unoptimized}
                  sizes="72px"
                  alt=""
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <dl className="contents text-sm">
                <div>
                  <dt className="sr-only">File</dt>
                  <dd>
                    {row.files.map((f) => (
                      <span key={f} className="block font-bold break-words">
                        {f}
                      </span>
                    ))}
                    <span className="block text-bk-muted">{row.px} px</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-bk-muted md:sr-only">Logo element</dt>
                  <dd>
                    {row.element}
                    {row.part ? (
                      <span className="mt-1 block">
                        <PartBadge />
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-bk-muted md:sr-only">Plate</dt>
                  <dd>{row.plate}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-bk-muted md:sr-only">Used for</dt>
                  <dd>{row.use}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-bk-muted">
          Source files behind them: <code>foa-logo-flat.png</code> (exact crop of the client raster),{" "}
          a trio crop (flat-PNG box x 1–735, y 1–353; the shared <code>parts/foa-tiles-flat.png</code> plus 1 px of
          white), the SVG from #6 once it lands, and the three tile colours as tokens for the rule. No transparent logo PNG: the source is a JPEG on white, so every use
          sits on white.
        </p>
      </Section>

      {/* ------------------------------------------------------------------ jump bar */}
      <nav
        aria-label="Variant C sections"
        className="sticky top-0 z-20 -mx-4 mt-10 border-b border-bk-border bg-bk-bg px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <ul className="flex gap-2 overflow-x-auto py-1">
          {NAV.map(([id, label]) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                className="inline-flex min-h-11 items-center rounded-full border border-bk-border-strong px-4 text-sm font-bold whitespace-nowrap text-bk-fg hover:bg-bk-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ------------------------------------------------------------------ favicons */}
      <Section
        id="c-icons"
        kicker="Small sizes"
        title="Favicons: 16, 32 and 48 px"
        lede={
          <p>
            The trio on a white rounded square. In the tabs below, 1× screens get <code>icon-16.png</code> and 2× screens{" "}
            <code>icon-32.png</code>, as browsers do.
          </p>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <TabStrip mode="light" />
          <TabStrip mode="dark" />
        </div>

        <h3 className="mt-10 text-lg font-bold">True size</h3>
        <div className="mt-3 flex flex-wrap items-end gap-6 rounded-xl border border-bk-border bg-bk-surface p-4">
          {(["icon-16.png", "icon-32.png", "icon-48.png"] as const).map((f) => {
            const size = report.icons[f].size;
            return (
              <Figure key={f} caption={`${size} px`}>
                <Pixels src={cAsset(f)} size={size} alt={`Tile trio favicon, ${size} px`} />
              </Figure>
            );
          })}
        </div>

        <h3 className="mt-10 text-lg font-bold">Magnified ×8 (nearest neighbour)</h3>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-bk-border bg-bk-surface p-4">
            <p className="font-bold">Tile trio (this variant)</p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <Figure caption="16 px ×8">
                <Pixels src={cAsset("icon-16.png")} size={16} scale={8} alt="Tile trio favicon, 16 px, magnified 8 times" />
              </Figure>
              <Figure caption="32 px ×8">
                <Pixels src={cAsset("icon-32.png")} size={32} scale={8} alt="Tile trio favicon, 32 px, magnified 8 times" />
              </Figure>
            </div>
          </div>
          <div className="rounded-xl border border-bk-border bg-bk-surface p-4">
            <p className="font-bold">Whole logo, same plate (comparison only)</p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <Figure caption="16 px ×8">
                <Pixels
                  src={cAsset("compare-wholelogo-16.png")}
                  size={16}
                  scale={8}
                  alt="Whole logo favicon, 16 px, magnified 8 times, for comparison"
                />
              </Figure>
              <Figure caption="32 px ×8">
                <Pixels
                  src={cAsset("compare-wholelogo-32.png")}
                  size={32}
                  scale={8}
                  alt="Whole logo favicon, 32 px, magnified 8 times, for comparison"
                />
              </Figure>
            </div>
          </div>
        </div>
        <ul className="mt-4 max-w-3xl list-disc space-y-1 pl-5 text-sm">
          <li>
            At 16 px the trio is {i16.logoPx.w} × {i16.logoPx.h} px. The letters are {i16.letterPx} px tall, so F, O and A
            are not readable, and the paw mark inside the O is gone. The 8 px white gaps shrink to {i16.gapPx} px: the
            three tiles fuse into one red-green-blue bar. What survives is the colour order.
          </li>
          <li>
            At 32 px the letters are {i32.letterPx} px tall and read as shapes; the paw is a white dot.
          </li>
          <li>
            Dropping the wordmark does <strong>not</strong> make the tiles bigger: the wordmark is as wide as the tiles, so
            in a square both versions are limited by width (tiles {i16.logoPx.h} px tall vs {w16.logoPx.h} px for the whole
            logo, wordmark included). The trio only removes the grey smear under the tiles.
          </li>
        </ul>
      </Section>

      {/* ------------------------------------------------------------------ app icons */}
      <Section
        id="c-home"
        kicker="Small sizes"
        title="App icons: apple-touch 180 and maskable 512"
        lede={
          <p>
            The tiles are scaled, never squashed, so the square is padded with white above and below. Both files are
            opaque: iOS and Android cut their own shape.
          </p>
        }
      >
        <div className="flex flex-wrap items-start gap-8">
          <Figure caption="icon-180.png at true size">
            <Pixels src={cAsset("icon-180.png")} size={180} alt="Apple touch icon, tile trio on white, 180 px" />
          </Figure>
          <Figure
            caption={
              <>
                icon-maskable-512.png at 50 %. Dashed ring: safe zone, 80 % circle ({report.maskable.safeRadius * 2} px).
                Trio corners reach {report.maskable.trioHalfDiagonal} of {report.maskable.safeRadius} px.
              </>
            }
            className="max-w-[256px]"
          >
            <div className="relative size-64 overflow-hidden rounded-md border border-bk-border">
              <Pixels src={cAsset("icon-maskable-512.png")} size={512} scale={0.5} alt="Maskable icon, tile trio on white, 512 px" />
              <svg viewBox="0 0 512 512" className="absolute inset-0 size-full" aria-hidden>
                <circle
                  cx="256"
                  cy="256"
                  r="204.8"
                  fill="none"
                  strokeWidth="4"
                  strokeDasharray="12 10"
                  style={{ stroke: "var(--c-safe-zone)" }}
                />
              </svg>
            </div>
          </Figure>
          <div>
            <p className="text-sm font-bold">Launcher masks (worst case: only the safe circle survives)</p>
            <div className="mt-3 flex flex-wrap gap-4">
              <MaskShape shape="circle" />
              <MaskShape shape="squircle" />
              <MaskShape shape="rounded" />
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-8">
          <Phone mode="ios-light" />
          <Phone mode="android-dark" />
        </div>
        <p className="mt-4 max-w-3xl text-sm">
          On a home screen the trio reads as &ldquo;FOA&rdquo; from arm&rsquo;s length, but it is a wide band in a square:{" "}
          {plateShare("icon-180.png")} of the apple icon and {plateShare("icon-maskable-512.png")} of the maskable icon is
          white plate. Filling the square would mean stacking or stretching the tiles, which changes the logo, so it is
          not offered.
        </p>
      </Section>

      {/* ------------------------------------------------------------------ OG */}
      <Section
        id="c-og"
        kicker="Social"
        title="OG card 1200 × 630"
        lede={
          <p>
            The Artwork sits in a tile-rhythm frame (red, green and blue in the tiles&rsquo; own widths and gaps); the whole
            logo stands beside it on white, so Artwork never runs behind the logo. Text is the public allow-list only
            (SG-01): title, display name, category, city and state, Competition.
          </p>
        }
      >
        <div className="grid gap-8 lg:grid-cols-3">
          <Figure caption="Chat app, large preview (390 px screen)" className="w-full max-w-[390px]">
            <div className="rounded-2xl bg-(--c-chat-bg) p-3">
              <div className="ml-auto max-w-[88%] rounded-xl bg-(--c-chat-bubble) p-1.5 text-(color:--c-chat-fg)">
                <div className="overflow-hidden rounded-lg border border-bk-border">
                  <Image src={og.src} width={og.width} height={og.height} sizes="320px" alt="" className="h-auto w-full" />
                  <div className="p-2">
                    <p className="text-sm font-bold">{artwork.title} · FOA Gallery</p>
                    <p className="mt-0.5 text-xs text-(color:--c-chat-muted)">{childDisplayLineShort}</p>
                    <p className="mt-0.5 text-xs text-(color:--c-chat-muted)">foaglobal.org</p>
                  </div>
                </div>
                <p className="px-1 pt-1.5 text-sm break-all text-(color:--c-chat-link) underline">
                  foaglobal.org/gallery/sunny-hills-for-every-paw
                </p>
              </div>
            </div>
          </Figure>

          <Figure
            caption={
              <>
                Compact preview: the app centre-crops the card to a square, which keeps x 285–915.{" "}
                <strong className="text-bk-fg">
                  The logo sits at x {report.og.logoBox.x}–{report.og.logoBox.x + report.og.logoBox.w}: only a sliver of
                  the red tile survives.
                </strong>
              </>
            }
            className="w-full max-w-[390px]"
          >
            <div className="rounded-2xl bg-(--c-chat-bg) p-3">
              <div className="ml-auto flex max-w-[88%] gap-2 rounded-xl bg-(--c-chat-bubble) p-1.5 text-(color:--c-chat-fg)">
                <Image
                  src={og.src}
                  width={og.width}
                  height={og.height}
                  sizes="140px"
                  alt=""
                  className="size-[72px] shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 py-1">
                  <p className="truncate text-sm font-bold">{artwork.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-(color:--c-chat-muted)">{childDisplayLineShort}</p>
                  <p className="mt-0.5 text-xs text-(color:--c-chat-muted)">foaglobal.org</p>
                </div>
              </div>
            </div>
          </Figure>

          <Figure caption="Social card (390 px screen)" className="w-full max-w-[390px]">
            <div className="rounded-2xl border border-bk-border bg-bk-surface p-3">
              <p className="text-sm">
                <span className="font-bold">FOA</span> <span className="text-bk-muted">· New in the gallery</span>
              </p>
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-bk-border">
                <Image
                  src={og.src}
                  width={og.width}
                  height={og.height}
                  sizes="(min-width: 430px) 360px, calc(100vw - 72px)"
                  alt=""
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-1 text-xs text-bk-muted">From foaglobal.org</p>
            </div>
          </Figure>
        </div>

        <h3 className="mt-10 text-lg font-bold">At 50 %</h3>
        <div className="mt-3">
          <Scroller label="OG card at 50 percent, scrolls sideways">
            <Image
              src={og.src}
              width={og.width}
              height={og.height}
              unoptimized
              alt={`OG card: ${artwork.title} in a tile-rhythm frame, whole FOA logo, ${childDisplayLineShort}`}
              className="block max-w-none"
              style={{ width: og.width / 2, height: og.height / 2 }}
            />
          </Scroller>
        </div>
        <h3 className="mt-8 text-lg font-bold">At 100 %</h3>
        <div className="mt-3">
          <Scroller label="OG card at 100 percent, scrolls sideways">
            <Image
              src={og.src}
              width={og.width}
              height={og.height}
              unoptimized
              alt="OG card at full size"
              className="block max-w-none"
              style={{ width: og.width, height: og.height }}
            />
          </Scroller>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-bk-muted">
          File size: {kb(report.files["og-card.png"])} as lossless PNG because of the crayon texture; the same card as JPEG
          q85 is {kb(report.files["og-card-q85.jpg"])}. Recommend JPEG for the real <code>og</code> derivative.
        </p>
      </Section>

      {/* ------------------------------------------------------------------ gallery */}
      <Section
        id="c-gallery"
        kicker="Watermark"
        title="Gallery preview 1600 px"
        lede={
          <p>
            The whole logo ({wm.logoWidth} px) on a white plate, flush in the bottom-left corner. The tri-colour rule runs
            from the plate to the right edge. Together they cover {wm.areaPct} % of the image, at 100 % opacity.
          </p>
        }
      >
        <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
          <Image
            src={preview.src}
            width={preview.width}
            height={preview.height}
            sizes="(min-width: 1152px) 640px, (min-width: 768px) 56vw, calc(100vw - 32px)"
            alt={artwork.alt}
            className="h-auto w-full rounded-lg border border-bk-border"
          />
          <div>
            <p className="text-xl font-bold">{artwork.title}</p>
            <p className="mt-2">{childDisplayLine}</p>
            <p className="mt-2 text-bk-muted">
              {competition.title} · {certificateShare.award}
            </p>
            <p className="mt-4 text-sm text-bk-muted">
              Public view (SG-01, BR-63): display name, age category, School, city, state, country, Competition and award
              only.
            </p>
          </div>
        </div>

        <h3 className="mt-10 text-lg font-bold">Bottom-left corner at 100 %</h3>
        <p className="mt-1 text-sm text-bk-muted">True size where the screen has room (720 px); scaled to fit on phones.</p>
        <div className="mt-3 grid max-w-[720px] gap-8">
          <Figure
            caption={`The real file. Plate against the Artwork above it: ${wm.plateVsArtFixture}:1 (the plate melts into light paper; the tiles carry it).`}
          >
            <Crop
              src={preview.src}
              width={preview.width}
              height={preview.height}
              left={wm.crop.left}
              top={wm.crop.top}
              viewW={wm.crop.width}
              viewH={wm.crop.height}
              alt="Bottom-left corner of the gallery preview at full size: logo plate and tri-colour rule"
            />
          </Figure>
          <Figure
            caption={`Test surface: the same Artwork darkened to 28 %. Plate: ${wm.plateVsArtDark}:1. The plate is what keeps the logo true here.`}
          >
            <Image
              src={cAsset("wm-crop-dark.jpg")}
              width={wm.crop.width}
              height={wm.crop.height}
              unoptimized
              alt="Watermark corner over a darkened test surface"
              className="h-auto w-full max-w-[720px] rounded-lg border border-bk-border"
            />
          </Figure>
          <Figure caption="Setting: rule off. The plate alone still meets FR-STAMP-01 (corner watermark).">
            <Image
              src={cAsset("wm-crop-nostrip.jpg")}
              width={wm.crop.width}
              height={wm.crop.height}
              unoptimized
              alt="Watermark corner with the tri-colour rule switched off"
              className="h-auto w-full max-w-[720px] rounded-lg border border-bk-border"
            />
          </Figure>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ judging */}
      <Section
        id="c-judging"
        kicker="Watermark"
        title="Judging derivative 2560 px"
        lede={
          <p>
            Upright units of the trio and &ldquo;{judgingView.markText}&rdquo; repeat along diagonals at {pct(jm.opacity)}.
            Units are never rotated: rotation is not on the logo&rsquo;s allowed list.
          </p>
        }
      >
        <div className="rounded-xl border border-bk-border bg-bk-surface p-4">
          <p className="text-sm text-bk-muted">Judge view (blind, SG-11)</p>
          <p className="mt-1 font-bold">
            {judgingView.submissionNumber} · {judgingView.category}
          </p>
          <p>{judgingView.title}</p>
          <Image
            src={judging.src}
            width={judging.width}
            height={judging.height}
            sizes="(min-width: 1152px) 1056px, calc(100vw - 64px)"
            alt={`${judgingView.title}, with a faint repeated ${judgingView.markText} mark`}
            className="mt-4 h-auto w-full rounded-lg"
          />
        </div>
        <h3 className="mt-10 text-lg font-bold">One unit at 100 %</h3>
        <p className="mt-1 text-sm text-bk-muted">True size where the screen has room (720 px); scaled to fit on phones.</p>
        <div className="mt-3 grid max-w-[720px] gap-8">
          <Figure caption={`The real file. Dark ink at ${pct(jm.opacity)} over light paper: ${jm.inkOnLightArt}:1.`}>
            <Crop
              src={judging.src}
              width={judging.width}
              height={judging.height}
              left={jm.crop.left}
              top={jm.crop.top}
              viewW={jm.crop.width}
              viewH={jm.crop.height}
              alt="One unit of the judging mark at full size"
            />
          </Figure>
          <Figure caption={`Test surface darkened to 28 %: the white halo carries it, ${jm.haloOnDarkArt}:1.`}>
            <Image
              src={cAsset("judging-crop-dark.jpg")}
              width={jm.crop.width}
              height={jm.crop.height}
              unoptimized
              alt="The judging mark over a darkened test surface"
              className="h-auto w-full max-w-[720px] rounded-lg border border-bk-border"
            />
          </Figure>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ certificate */}
      <Section
        id="c-certificate"
        kicker="Certificate"
        title="Certificate share image 1080 × 1350"
        lede={
          <p>FR-STAMP-02: logo, seal and QR. The share image is public, so it shows the display name, not the legal name.</p>
        }
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr]">
          <Image
            src={cert.src}
            width={cert.width}
            height={cert.height}
            sizes="(min-width: 768px) 420px, calc(100vw - 32px)"
            alt={`${certificateShare.title} for ${certificateShare.recipientDisplayName}, ${certificateShare.award}, ${certificateShare.competition}, number ${certificateShare.number}`}
            className="h-auto w-full rounded-lg border border-bk-border"
          />
          <div>
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <strong>Whole logo as the header</strong>, top centre, {report.certificate.logoWidth} px wide (37 % of the
                width). The certificate is white, so no plate is needed.
              </li>
              <li>
                <strong>Seal</strong>, bottom-left: the trio ({report.certificate.sealTrioWidth} px) inside a ring in FOA
                blue with &ldquo;FOA · CERTIFICATE OF ACHIEVEMENT · 2027&rdquo;. <PartBadge /> The ring itself is a
                placeholder design.
              </li>
              <li>
                <strong>QR</strong>, bottom-right, {report.certificate.qrSize} px with whole-pixel modules (placeholder; the
                real one opens <code>/verify/{certificateShare.number}</code>).
              </li>
              <li>
                <strong>Number and verify URL</strong> along the bottom, between the tri-colour rules at the top and
                bottom edges.
              </li>
            </ol>
            <p className="mt-4">
              <a
                href={cert.src}
                className="font-bold text-bk-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-bk-primary"
              >
                Open the share image at full size
              </a>
            </p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ settings */}
      <Section
        id="c-settings"
        kicker="FR-STAMP-03"
        title="Stamp settings and defaults"
        lede={<p>Placement and opacity are settings in the worker. These are the defaults Variant C proposes.</p>}
      >
        <ul className="space-y-4 md:hidden">
          {SETTINGS.map((s) => (
            <li key={s.element} className="rounded-xl border border-bk-border bg-bk-surface p-4">
              <p className="font-bold">{s.element}</p>
              {s.part ? (
                <p className="mt-1">
                  <PartBadge />
                </p>
              ) : null}
              <dl className="mt-3 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-bk-muted">Placement</dt>
                <dd>{s.placement}</dd>
                <dt className="text-bk-muted">Opacity</dt>
                <dd>{s.opacity}</dd>
                <dt className="text-bk-muted">Scale</dt>
                <dd>{s.scale}</dd>
                <dt className="text-bk-muted">Minimum</dt>
                <dd>{s.minimum}</dd>
                <dt className="text-bk-muted">Busy or dark Artwork</dt>
                <dd>{s.busyDark}</dd>
              </dl>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-hidden rounded-xl border border-bk-border md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-bk-surface">
              <tr>
                {["Element", "Placement", "Default opacity", "Scale", "Minimum size", "Busy or dark Artwork"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 align-bottom font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bk-border">
              {SETTINGS.map((s) => (
                <tr key={s.element} className="align-top">
                  <th scope="row" className="px-3 py-3 font-bold">
                    {s.element}
                    {s.part ? (
                      <span className="mt-1 block font-normal">
                        <PartBadge />
                      </span>
                    ) : null}
                  </th>
                  <td className="px-3 py-3">{s.placement}</td>
                  <td className="px-3 py-3">{s.opacity}</td>
                  <td className="px-3 py-3">{s.scale}</td>
                  <td className="px-3 py-3">{s.minimum}</td>
                  <td className="px-3 py-3">{s.busyDark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="mt-4 rounded-xl border border-bk-border bg-bk-surface p-4">
          <summary className="cursor-pointer font-bold">As StampSettings (fixtures.ts type)</summary>
          <pre className="mt-3 overflow-x-auto text-xs">{JSON.stringify(STAMP_DEFAULTS, null, 2)}</pre>
        </details>
      </Section>

      {/* ------------------------------------------------------------------ notes */}
      <Section id="c-notes" kicker="Honest notes" title="What works, what breaks">
        <ul className="max-w-3xl list-disc space-y-3 pl-5">
          <li>
            <strong>16 px:</strong> three coloured bars, no letters, no paw. Recognisable only to people who already know
            the logo. 32 px is the first size where F, O and A read.
          </li>
          <li>
            <strong>The trio is not bigger than the whole logo</strong> at the same width. Its only gain at favicon size is
            a cleaner edge; its cost is losing the name everywhere it is used. That trade is the product owner&rsquo;s.
          </li>
          <li>
            <strong>Is the tri-colour rule new artwork?</strong> Yes. It leaves the logo untouched, but it is a new brand
            device made from the logo&rsquo;s colours and tile widths. Without sign-off, ship with the rule off (the plate
            alone already satisfies FR-STAMP-01).
          </li>
          <li>
            <strong>Watermark contrast:</strong> the white plate is {wm.plateVsArtFixture}:1 against the light fixture and{" "}
            {wm.plateVsArtDark}:1 against the darkened test surface. Logos are exempt from WCAG text contrast, but the plate
            is what keeps the tile colours and the black wordmark legible on dark or busy Artwork.
          </li>
          <li>
            <strong>Judging mark contrast</strong> is deliberately low ({jm.inkOnLightArt}:1 on light, {jm.haloOnDarkArt}:1
            on dark): it marks the file, it is not text to read. The trio&rsquo;s white crop shows as a faint box on dark
            Artwork; that is the price of not cutting the logo out of its white background.
          </li>
          <li>
            <strong>OG compact previews</strong> that centre-crop to a square keep only a sliver of the logo&rsquo;s red
            tile. Fixing that means moving the logo into the middle half, which shrinks the Artwork. Open question.
          </li>
          <li>
            <strong>Wordmark:</strong> the client raster reads &ldquo;Friends of Animals&rdquo; in mixed case. At{" "}
            {wm.logoWidth} px (watermark) the wordmark is {wm.wordmarkHeightPx} px tall: legible, just.
          </li>
          <li>
            <strong>Source:</strong> every asset is a raster derivative of the flat PNG; the SVG from #6 is not used yet.
            Text in the images is Plus Jakarta Sans 400/700, the site font.
          </li>
          <li>
            <strong>Performance (NFR-01):</strong> this variant adds no client JS (server components only). Icons are served
            unoptimised so the page shows the exact generated pixels; large JPEGs go through <code>next/image</code>.
          </li>
        </ul>
        {shot ? null : (
          <p className="mt-6 text-sm text-bk-muted">
            Regenerate: <code>node apps/web/app/prototype/brand-kit/variants/c/build.mjs</code>, then clear{" "}
            <code>apps/web/.next/cache/images</code>.
          </p>
        )}
      </Section>
    </main>
  );
}
