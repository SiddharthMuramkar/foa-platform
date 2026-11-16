// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant B building blocks: the "Editorial trust" component language.
// Rules: 6px radius on UI, square frames on Artworks, no drop shadows on UI (only on framed objects),
// logo colours as thin wayfinding rules + 8px tile markers (green = Competitions/open, blue = gallery/info,
// red = Donate, as a rule or outline only), ink as the primary affordance, solid red fill only on Donate.
import Image from "next/image";
import type { ReactNode } from "react";
import type { ArtworkImage, StockPhoto } from "../../fixtures";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ buttons and links */

const btnBase =
  "b-ease inline-flex items-center justify-center gap-2 rounded-[6px] leading-none font-semibold whitespace-nowrap";

const BTN_KIND = {
  /** Primary affordance: ink, not colour. */
  primary: "bg-(--b-ink) text-(--b-on-ink) hover:bg-(--b-ink-hover)",
  /** Hairline outline in ink. */
  secondary: "border border-(--b-ink) bg-transparent text-(--b-ink) hover:bg-(--b-paper-2)",
  /** The ONLY solid-red element type on the page. */
  donate: "bg-(--b-donate) text-(--b-on-donate) hover:bg-(--b-donate-hover)",
  disabled: "cursor-not-allowed border border-dashed border-(--b-control) bg-transparent text-(--b-ink-2)",
} as const;

const BTN_SIZE = {
  sm: "min-h-9 px-3.5 text-[14px]",
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-12 px-6 text-[16px]",
  /** Caller supplies min-height, padding and text size (avoids conflicting utilities in one class list). */
  none: "",
} as const;

/** Button / button-styled link classes. Sizes never conflict: one size string per call. */
export function btn(kind: keyof typeof BTN_KIND, size: keyof typeof BTN_SIZE = "md") {
  return cx(btnBase, BTN_KIND[kind], BTN_SIZE[size]);
}

/** Tertiary: blue underlined text link with a nudging arrow. */
export const linkCls =
  "b-ease inline-flex min-h-6 items-center gap-1 font-semibold text-(--b-blue) underline decoration-1 underline-offset-[5px] hover:decoration-2";

export function Arrow() {
  return (
    <span aria-hidden="true" className="b-arrow">
      →
    </span>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={cx(linkCls, "text-[15px]", className)}>
      {children}
      <Arrow />
    </a>
  );
}

export function ReportConcern({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="b-ease inline-flex min-h-6 items-center text-[13px] text-(--b-ink-2) underline decoration-(--b-control) decoration-1 underline-offset-[4px] hover:text-(--b-ink) hover:decoration-(--b-ink)"
    >
      Report a concern
      {label ? <span className="sr-only"> about {label}</span> : null}
    </a>
  );
}

/* ------------------------------------------------------------------ markers and badges */

export type Tone = "green" | "blue" | "red" | "ink";

/** 8px square echoing the logo tiles. Red is outline-only (solid red is reserved for Donate). */
export function Marker({ tone, className }: { tone: Tone; className?: string }) {
  const fill = {
    green: "bg-(--b-tile-green)",
    blue: "bg-(--b-tile-blue)",
    ink: "bg-(--b-ink)",
    red: "border-[1.5px] border-(--b-tile-red)",
  }[tone];
  return <span aria-hidden="true" className={cx("inline-block size-2 shrink-0", fill, className)} />;
}

/** Small-caps label with a tile marker. Text stays ink so meaning never rests on colour alone. */
export function Badge({ tone = "ink", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-(--b-line) bg-(--b-surface) px-2 py-[3px] text-[11.5px] leading-4 font-semibold tracking-[0.07em] text-(--b-ink) uppercase">
      <Marker tone={tone} />
      {children}
    </span>
  );
}

/** Eyebrow label: index number + section name. */
export function Kicker({ index, tone, children, className }: { index?: string; tone: Tone; children: ReactNode; className?: string }) {
  const text = tone === "red" ? "text-(--b-red)" : "text-(--b-ink-2)";
  return (
    <p className={cx("flex items-center gap-2 text-[12px] leading-4 font-semibold tracking-[0.1em] uppercase", text, className)}>
      <Marker tone={tone} />
      {index ? <span className="b-num">{index}</span> : null}
      {index ? <span aria-hidden="true" className="h-px w-4 bg-current opacity-60" /> : null}
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ section head (asymmetric 4/8 grid) */

export function SectionHead({
  id,
  index,
  tone,
  kicker,
  title,
  intro,
  action,
}: {
  id: string;
  index: string;
  tone: Tone;
  kicker: string;
  title: string;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Kicker index={index} tone={tone}>
        {kicker}
      </Kicker>
      <h2 id={id} className="text-[28px] leading-[1.12] font-semibold tracking-[-0.02em] text-balance lg:text-[36px]">
        {title}
      </h2>
      {intro ? <div className="max-w-[34ch] text-[16px] leading-[1.6] text-(--b-ink-2)">{intro}</div> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Full-width ink rule that opens every section, like a printed annual report. */
export function Section({
  labelledBy,
  id,
  className,
  children,
}: {
  labelledBy: string;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cx("scroll-mt-6 px-5 lg:px-10", className)}>
      <div className="mx-auto max-w-[76rem] border-t border-(--b-ink) pt-5 lg:pt-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ Artwork frame */

/** A child's Artwork presented as an object: light mat, hairline, gallery shadow. Placeholder art only. */
export function ArtFrame({
  image,
  alt,
  sizes,
  preload = false,
  mat = "p-3 lg:p-4",
  className,
  imgClassName,
  lift = false,
}: {
  image: ArtworkImage;
  alt: string;
  sizes: string;
  preload?: boolean;
  mat?: string;
  className?: string;
  imgClassName?: string;
  lift?: boolean;
}) {
  return (
    <div className={cx("b-frame", lift && "b-lift", mat, className)}>
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={alt}
        sizes={sizes}
        preload={preload}
        className={cx("b-frame-inner block", imgClassName ?? "h-auto w-full")}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ photos */

const LICENCE: Record<StockPhoto["licence"], string> = { unsplash: "Unsplash", pexels: "Pexels", cc0: "CC0" };

/** Editorial credit line; carries "Illustrative photo" wherever stock could read as FOA's own work. */
export function PhotoCredit({ photo, forceIllustrative = false, className }: { photo: StockPhoto; forceIllustrative?: boolean; className?: string }) {
  const illustrative = forceIllustrative || photo.caption === "Illustrative photo";
  return (
    <p className={cx("text-[12px] leading-4 text-(--b-ink-2)", className)}>
      {illustrative ? <span className="font-semibold">Illustrative photo · </span> : null}
      {photo.author} / {LICENCE[photo.licence]}
    </p>
  );
}

export function Photo({
  photo,
  sizes,
  className,
  imgClassName,
}: {
  photo: StockPhoto;
  sizes: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cx("relative overflow-hidden rounded-[6px] bg-(--b-paper-2)", className)}>
      <Image
        src={photo.file}
        alt={photo.alt}
        placeholder="blur"
        fill
        sizes={sizes}
        className={cx("object-cover", imgClassName)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ icons (UI glyphs, not illustration) */

export function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-[3px] size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v4M8 10.9v.35" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ text */

/** Keep "ages 6–10" together: word joiners stop the line breaking at the en dash. */
export const keep = (s: string) => s.replace(/(\d)–(\d)/g, "$1\u2060–\u2060$2");

/* ------------------------------------------------------------------ dates */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2027-01-31" → { day: "31", month: "Jan", year: "2027" } (date-only, no timezone drift). */
export function splitDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return { day: String(Number(day)), month: MONTHS[Number(month) - 1], year };
}
