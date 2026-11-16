// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant C building blocks. Server components only: no client JS.
import Image from "next/image";
import type { ReactNode } from "react";
import { C_TOKENS, cAsset } from "./kit-data";

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const vars = (t: Record<string, string>) =>
  Object.entries(t)
    .map(([k, v]) => `--c-${kebab(k)}:${v};`)
    .join("");

/**
 * Writes C_TOKENS as --c-* custom properties on .vc, following the same theme rules as globals.css:
 * forced [data-theme] on any ancestor wins, otherwise prefers-color-scheme.
 */
export function CTokens() {
  const css =
    `.vc{${vars(C_TOKENS.light)}}` +
    `@media (prefers-color-scheme: dark){.vc:not([data-theme="light"] *){${vars(C_TOKENS.dark)}}}` +
    `[data-theme="dark"] .vc{${vars(C_TOKENS.dark)}}`;
  return <style>{css}</style>;
}

/** The tri-colour rule in HTML: red | gap | green | gap | blue in the logo's tile proportions (225:8:253:8:235). */
export function TriRule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex ${className}`}>
      <span className="bg-(--c-tile-red)" style={{ flex: "225 0 0" }} />
      <span style={{ flex: "8 0 0" }} />
      <span className="bg-(--c-tile-green)" style={{ flex: "253 0 0" }} />
      <span style={{ flex: "8 0 0" }} />
      <span className="bg-(--c-tile-blue)" style={{ flex: "235 0 0" }} />
    </div>
  );
}

export function PartBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-(color:--c-flag-border) bg-(--c-badge-bg) px-2 py-0.5 text-xs font-bold text-bk-fg">
      Part of logo · PO decision
    </span>
  );
}

export function Section({
  id,
  kicker,
  title,
  lede,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-14 scroll-mt-20 border-t border-bk-border pt-8">
      <p className="text-xs font-bold uppercase tracking-wider text-bk-muted">{kicker}</p>
      <h2 id={`${id}-h`} className="mt-1 text-2xl font-bold sm:text-3xl">
        {title}
      </h2>
      {lede ? <div className="mt-3 max-w-3xl text-bk-muted">{lede}</div> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Figure({ caption, children, className = "" }: { caption: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure className={`min-w-0 ${className}`}>
      {children}
      <figcaption className="mt-2 text-sm text-bk-muted">{caption}</figcaption>
    </figure>
  );
}

/** A small image at its true pixel size (CSS px) and/or magnified with nearest-neighbour scaling. */
export function Pixels({ src, size, scale = 1, alt }: { src: string; size: number; scale?: number; alt: string }) {
  const px = size * scale;
  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt={alt}
      unoptimized
      className="block max-w-none"
      style={{ width: px, height: px, imageRendering: scale > 1 ? "pixelated" : undefined }}
    />
  );
}

/** Favicon as browsers pick it: icon-16 on 1x screens, icon-32 on 2x. */
function TabFavicon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- srcSet 1x/2x mimics the browser's own favicon choice
    <img
      src={cAsset("icon-16.png")}
      srcSet={`${cAsset("icon-16.png")} 1x, ${cAsset("icon-32.png")} 2x`}
      width={16}
      height={16}
      alt=""
      className="size-4 shrink-0"
    />
  );
}

export function TabStrip({ mode }: { mode: "light" | "dark" }) {
  const L = mode === "light";
  return (
    <Figure caption={L ? "Light tab bar" : "Dark tab bar"}>
      <div
        className={`overflow-hidden rounded-xl border border-bk-border ${L ? "bg-(--c-tab-strip-light)" : "bg-(--c-tab-strip-dark)"}`}
      >
        <div className="flex items-end gap-1 px-2 pt-2">
          <div
            className={`flex min-w-0 flex-[3] items-center gap-2 rounded-t-lg px-3 py-2 text-[13px] ${
              L ? "bg-(--c-tab-active-light) text-(color:--c-tab-text-light)" : "bg-(--c-tab-active-dark) text-(color:--c-tab-text-dark)"
            }`}
          >
            <TabFavicon />
            <span className="truncate">Sunny Hills for Every Paw · FOA Gallery</span>
          </div>
          <div
            className={`flex min-w-0 flex-[2] items-center gap-2 px-3 py-2 text-[13px] ${
              L ? "text-(color:--c-tab-inactive-light)" : "text-(color:--c-tab-inactive-dark)"
            }`}
          >
            <TabFavicon />
            <span className="truncate">Paws &amp; Pencils 2027</span>
          </div>
        </div>
        <div className={`h-7 ${L ? "bg-(--c-tab-active-light)" : "bg-(--c-tab-active-dark)"}`} />
      </div>
    </Figure>
  );
}

const APPS = ["Notes", "Photos", "Maps", "Clock", "Mail", "Files", "Music"];

/** Home-screen mock. iOS-like: icon-180 under a 22.5 % rounded mask. Android-like: maskable 512 under a circle. */
export function Phone({ mode }: { mode: "ios-light" | "android-dark" }) {
  const ios = mode === "ios-light";
  return (
    <Figure
      caption={ios ? "iOS-like home screen, light wallpaper: icon-180.png" : "Android-like home screen, dark wallpaper: maskable 512, circle mask"}
    >
      <div
        className={`w-[232px] rounded-[2.25rem] border-4 border-bk-border-strong p-4 pb-8 ${
          ios ? "bg-(--c-wall-light) text-(color:--c-wall-light-fg)" : "bg-(--c-wall-dark) text-(color:--c-wall-dark-fg)"
        }`}
      >
        <p className="text-center text-xs font-bold">9:41</p>
        <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4">
          <li className="flex flex-col items-center gap-1">
            {ios ? (
              <Image
                src={cAsset("icon-180.png")}
                width={180}
                height={180}
                unoptimized
                alt="FOA app icon"
                className="size-11 rounded-[22.5%]"
              />
            ) : (
              <span className="relative block size-11 overflow-hidden rounded-full">
                <Image
                  src={cAsset("icon-maskable-512.png")}
                  width={512}
                  height={512}
                  unoptimized
                  alt="FOA app icon"
                  className="absolute max-w-none"
                  style={{ width: 55, height: 55, left: -5.5, top: -5.5 }}
                />
              </span>
            )}
            <span className="text-[11px]">FOA</span>
          </li>
          {APPS.map((a) => (
            <li key={a} className="flex flex-col items-center gap-1" aria-hidden>
              <span className={`block size-11 ${ios ? "rounded-[22.5%] bg-(--c-wall-light-icon)" : "rounded-full bg-(--c-wall-dark-icon)"}`} />
              <span className="text-[11px]">{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </Figure>
  );
}

/** Masks a maskable icon the way launchers do, assuming the worst case: only the 80 % safe circle survives. */
export function MaskShape({ shape }: { shape: "circle" | "squircle" | "rounded" }) {
  const radius = shape === "circle" ? "rounded-full" : shape === "squircle" ? "rounded-[32%]" : "rounded-[18%]";
  const box = 80;
  const img = box / 0.8;
  return (
    <Figure caption={shape === "circle" ? "Circle" : shape === "squircle" ? "Squircle" : "Rounded square"}>
      <span className={`relative block overflow-hidden ${radius}`} style={{ width: box, height: box }}>
        <Image
          src={cAsset("icon-maskable-512.png")}
          width={512}
          height={512}
          unoptimized
          alt={`Maskable icon under a ${shape} mask`}
          className="absolute max-w-none"
          style={{ width: img, height: img, left: (box - img) / 2, top: (box - img) / 2 }}
        />
      </span>
    </Figure>
  );
}

/**
 * A window onto a large image: exactly 100 % (CSS px) when there is room for viewW, scaled down proportionally
 * on narrower screens so the whole region stays visible.
 */
export function Crop({
  src,
  width,
  height,
  left,
  top,
  viewW,
  viewH,
  alt,
}: {
  src: string;
  width: number;
  height: number;
  left: number;
  top: number;
  viewW: number;
  viewH: number;
  alt: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-bk-border"
      style={{ maxWidth: viewW, aspectRatio: `${viewW} / ${viewH}` }}
    >
      <Image
        src={src}
        width={width}
        height={height}
        unoptimized
        alt={alt}
        className="absolute h-auto max-w-none"
        style={{
          width: `${(width / viewW) * 100}%`,
          left: `${(-left / viewW) * 100}%`,
          top: `${(-top / viewH) * 100}%`,
        }}
      />
    </div>
  );
}

/** Horizontally scrollable, keyboard-focusable frame for images wider than the phone. */
export function Scroller({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto rounded-lg border border-bk-border bg-bk-surface p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bk-primary"
    >
      {children}
    </div>
  );
}
