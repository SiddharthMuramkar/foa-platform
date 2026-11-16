// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant C building blocks: the split-tile button, the arrow cell, square markers, badges and photo tiles.
// Server components only (no client JS).
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { StockPhoto } from "../../fixtures";

export type TileKind =
  | "paper"
  | "canvas"
  | "plate"
  | "ink"
  | "blue"
  | "green"
  | "red"
  | "blue-tint"
  | "green-tint"
  | "red-tint";

export const tile = (kind: TileKind) => `c-tile c-t-${kind}`;

/* ------------------------------------------------------------------ icons (hand-coded, 24px grid) */

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 5.5 19.5 12 13 18.5" />
    </svg>
  );
}

/** Paw: four toe squares and a pad, drawn with the same square geometry as the mosaic. */
export function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="3" y="8" width="4" height="5" />
      <rect x="7.5" y="3" width="4" height="5.5" />
      <rect x="12.5" y="3" width="4" height="5.5" />
      <rect x="17" y="8" width="4" height="5" />
      <path d="M12 11c3.6 0 6.5 3.4 6.5 6.6 0 2.1-1.5 3.4-3.4 3.4-1.3 0-2.1-.6-3.1-.6s-1.8.6-3.1.6c-1.9 0-3.4-1.3-3.4-3.4C5.5 14.4 8.4 11 12 11Z" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="3" />
      <rect x="3" y="10.5" width="18" height="3" />
      <rect x="3" y="16" width="18" height="3" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </svg>
  );
}

export function TickIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

/* ------------------------------------------------------------------ small pieces */

/** The arrow cell: a square inside the tile, painted in the tile's accent colour. Decorative. */
export function ArrowCell({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? "c-arrow c-arrow--lg" : "c-arrow"} aria-hidden="true">
      <ArrowIcon />
    </span>
  );
}

/** Three-square marker echoing the logo tiles (red only as an outline rule, never a solid fill). */
export function TriMarker({ animate = false }: { animate?: boolean }) {
  const cls = animate ? "c-sq c-pop" : "c-sq";
  // Sits on a small white plate (like the logo) so the three colours read on any tile, in either theme.
  return (
    <span className="c-tri" aria-hidden="true">
      <span className={`${cls} c-sq--red-rule`} style={{ "--i": 0 } as CSSProperties} />
      <span className={cls} style={{ "--sq": "var(--c-green)", "--i": 1 } as CSSProperties} />
      <span className={cls} style={{ "--sq": "var(--c-blue)", "--i": 2 } as CSSProperties} />
    </span>
  );
}

export function Eyebrow({ children, marker }: { children: ReactNode; marker?: ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-[0.8125rem] leading-tight font-extrabold tracking-[0.08em] uppercase">
      {marker ?? <span className="c-sq" style={{ "--sq": "var(--tile-accent)" } as CSSProperties} aria-hidden="true" />}
      {children}
    </p>
  );
}

type BadgeTone = "green" | "blue" | "neutral" | "award" | "placeholder";
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`c-badge c-badge--${tone}`}>{children}</span>;
}

type ButtonTone = "primary" | "secondary" | "donate";
/** Split-tile button: label cell + 3px gap + icon cell. Renders an <a> (navigation) or a <button>. */
export function SplitButton({
  tone,
  href,
  children,
  icon,
  small = false,
  className = "",
  type,
}: {
  tone: ButtonTone;
  href?: string;
  children: ReactNode;
  icon?: ReactNode;
  small?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const cls = `c-btn c-btn--${tone}${small ? " c-btn--sm" : ""} ${className}`;
  const inner = (
    <>
      <span className="c-btn__label">{children}</span>
      <span className="c-btn__icon" aria-hidden="true">
        {icon ?? (tone === "donate" ? <PawIcon /> : <ArrowIcon />)}
      </span>
    </>
  );
  if (href) {
    return (
      <a className={cls} href={href}>
        {inner}
      </a>
    );
  }
  return (
    <button className={cls} type={type ?? "button"}>
      {inner}
    </button>
  );
}

/** Square-cropped stock photo filling its cell (photos crop square; Artworks never do). */
export function PhotoFill({
  photo,
  sizes,
  position = "50% 50%",
  preload = false,
  caption,
}: {
  photo: StockPhoto;
  sizes: string;
  position?: string;
  preload?: boolean;
  /** Force the "Illustrative photo" chip even when the fixture does not set it (e.g. adoption cards). */
  caption?: StockPhoto["caption"];
}) {
  const chip = caption ?? photo.caption;
  return (
    <>
      <Image
        src={photo.file}
        alt={photo.alt}
        fill
        sizes={sizes}
        placeholder="blur"
        preload={preload}
        style={{ objectPosition: position }}
      />
      {chip ? <span className="c-chip-photo">{chip}</span> : null}
    </>
  );
}

export function ReportConcern({ href, what }: { href: string; what: string }) {
  return (
    <a className="c-report c-above" href={href}>
      Report a concern<span className="sr-only"> about {what}</span>
    </a>
  );
}
