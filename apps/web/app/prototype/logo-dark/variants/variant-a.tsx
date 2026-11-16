// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant A "Plate" — the page is fully dark (no light bands, no light islands). The unchanged logo sits on a
// white rounded plate wherever it appears, with ONE geometry at every size (a/logo-plate.tsx: pad 0.2h, radius 0.18h).
// Structure: dark sticky header (56/72px logo plate) → "cover + badge" hero: photo with the 88/160px plate overlapping
// its edge like a seal, headline beside it → dark Competition cards → surface-2 footer (64px logo plate).
// Fix stage: header/footer logo raised to LOGO_MIN_HEIGHT (wordmark readable); html scroll-padding reserves the sticky
// header (SC 2.4.11); phone hero plate 128→88px and a 16:9 phone crop so the H1 and both CTAs sit in the first viewport.
// Light theme: the plate STAYS as the same badge (not merged into the ground): one lockup in both themes, the
// logo's footprint never changes with the device setting, and no theme-dependent geometry to get wrong (§4.8).
// Server component only: adds no client JS (NFR-01). SG-01: no child data is rendered.
import { competitions, competitionsSection, hero, type CompetitionCard, type VariantProps } from "../fixtures";
import { FooterA } from "./a/footer";
import { HeaderA } from "./a/header";
import { LogoPlate, PLATE_RATIOS } from "./a/logo-plate";

export const name = "Plate";

/**
 * Every colour variant A uses, per theme (hex; 8-digit = with alpha). Shared tokens resolve from globals.css;
 * plate* are new and live only on the plate surface. Contrast (WCAG 2.2, measured):
 *   light: ink/canvas 16.2, inkMuted/canvas 7.2, inkMuted/surface2 6.6, accent/surface2 5.9, onAccent/accent 6.9,
 *          success dot/surface 5.6, lineStrong/surface 4.5, lineStrong/surface2 3.9 (input border), onDonate/donate 5.5
 *   dark:  ink/canvas 16.4, inkMuted/canvas 8.5, inkMuted/surface2 6.8, accent/surface2 6.6, onAccent/accent 8.4,
 *          success dot/surface 9.3, lineStrong/surface 3.9, lineStrong/surface2 3.4 (input border), onDonate/donate 5.5
 *   plate: wordmark #000 on plate 21:1; plate vs ground: light canvas 1.06 (edge carried by rim + shadow),
 *          dark canvas 18.5 (softened by halo + lift shadow).
 */
export const tokens = {
  light: {
    canvas: "#faf8f4",
    surface: "#ffffff",
    surface2: "#f1eee8",
    ink: "#1b1b1f",
    inkMuted: "#55534e",
    line: "#e2ded6",
    lineStrong: "#7a766f",
    accent: "#263ff1",
    onAccent: "#ffffff",
    success: "#017a01",
    donate: "#cb2322",
    onDonate: "#ffffff",
    focus: "#263ff1",
    plate: "#ffffff",
    plateRim: "#00000012",
    plateShadow: "#1b1b1f59",
    plateShadowNear: "#1b1b1f14",
    menuShadow: "#00000080",
  },
  dark: {
    canvas: "#121417",
    surface: "#1b1e23",
    surface2: "#252930",
    ink: "#f3f1ec",
    inkMuted: "#b4b0a8",
    line: "#30343b",
    lineStrong: "#757a84",
    accent: "#9da9ff",
    onAccent: "#121417",
    success: "#6fd86f",
    donate: "#cb2322",
    onDonate: "#ffffff",
    focus: "#9da9ff",
    plate: "#ffffff",
    plateRim: "#0000001a",
    plateHalo: "#ffffff24",
    plateHaloOuter: "#ffffff0d",
    plateShadow: "#000000e6",
    menuShadow: "#00000080",
  },
} as const;

export default function VariantA({ theme, shot }: VariantProps) {
  return (
    // scroll-padding = sticky header (96px phone / 120px lg) + margin, so a focused control is never scrolled under
    // the opaque header (WCAG 2.2 SC 2.4.11 Focus Not Obscured, review blocker).
    <div id="top" className="flex min-h-dvh flex-col [html:has(&)]:scroll-pt-28 lg:[html:has(&)]:scroll-pt-36">
      <a
        href="#a-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
      >
        Skip to content
      </a>
      <HeaderA />
      <main id="a-main" className="flex-1">
        <Hero />
        <Competitions />
        {!shot && <PrototypeNote theme={theme} />}
      </main>
      <FooterA shot={shot} />
    </div>
  );
}

function Hero() {
  return (
    // --logo-h drives the plate AND the overhang spacing below it, so both scale together.
    // Phone 88px (was 128px): the plate no longer outshines the H1, which now starts above ~420px. Desktop unchanged.
    <section aria-labelledby="a-hero-title" className="[--logo-h:88px] lg:[--logo-h:160px]">
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-14 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-12 lg:pt-14 lg:pb-24">
        {/* Cover + badge: the plate overlaps the photo edge, half on the photo, half on the dark canvas. */}
        <div className="relative lg:order-2 lg:col-span-7">
          {/* 16:9 crop on phones (art direction for the same stock photo), the fixture's 4:3 from lg. Box reserved: CLS 0. */}
          <div
            role="img"
            aria-label={hero.image.alt}
            className="relative aspect-video w-full overflow-hidden rounded-3xl border lg:aspect-4/3 border-line bg-surface-2 bg-[image:repeating-linear-gradient(135deg,transparent_0_14px,var(--line)_14px_15px)]"
          >
            <span
              aria-hidden="true"
              className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full bg-surface px-3 py-1 text-xs text-ink-muted"
            >
              {hero.image.placeholderLabel}
            </span>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 lg:left-0 lg:-translate-x-[6%] lg:translate-y-[28%]">
            <LogoPlate height={160} preload />
          </div>
        </div>

        {/* Overhang = half the plate height (1.4h / 2 = 0.7h) + breathing room; desktop sits beside the photo. */}
        <div className="mt-[calc(var(--logo-h)*0.7+0.75rem)] text-center lg:order-1 lg:col-span-5 lg:mt-0 lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm font-bold text-ink">
            <span aria-hidden="true" className="size-2 rounded-full bg-success" />
            {hero.eyebrow}
          </p>
          <h1
            id="a-hero-title"
            className="mt-3 text-4xl/[1.1] lg:mt-4 font-bold tracking-tight text-balance text-ink lg:text-6xl/[1.04]"
          >
            {hero.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted lg:mx-0">{hero.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href={hero.cta.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-bold text-on-accent"
            >
              {hero.cta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-line-strong px-6 font-bold text-ink hover:bg-surface"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Competitions() {
  return (
    <section id="competitions" aria-labelledby="a-comp-title" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="a-comp-title" className="text-2xl font-bold tracking-tight text-ink lg:text-3xl">
            {competitionsSection.heading}
          </h2>
          <a
            href={competitionsSection.more.href}
            className="inline-flex min-h-11 items-center text-sm font-bold text-accent underline-offset-4 hover:underline"
          >
            {competitionsSection.more.label} <span aria-hidden="true">&nbsp;→</span>
          </a>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitions.map((c) => (
            <CompetitionItem key={c.slug} c={c} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// Status colour comes from the logo's blue/green only; card.accent is ignored so red stays Donate-only.
function CompetitionItem({ c }: { c: CompetitionCard }) {
  const open = c.status === "REGISTRATION_OPEN";
  return (
    <li className="relative flex flex-col rounded-2xl border border-line bg-surface p-5 hover:border-line-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <span aria-hidden="true" className={`size-2 rounded-full ${open ? "bg-success" : "bg-accent"}`} />
        {c.statusLabel}
      </p>
      <h3 className="mt-3 text-xl font-bold text-ink">
        <a href={c.href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {c.title}
        </a>
      </h3>
      <p className="mt-1 text-ink-muted">{c.theme}</p>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-muted">Dates</dt>
        <dd className="text-ink">{c.dateLabel}</dd>
        <dt className="text-ink-muted">Fee</dt>
        <dd className="text-ink">{c.feeLabel}</dd>
        <dt className="text-ink-muted">Ages</dt>
        <dd>
          <ul className="flex flex-wrap gap-1.5">
            {c.ageCategoryLabels.map((label) => (
              <li key={label} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink">
                {label}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    </li>
  );
}

/** Prototype-only annotation (hidden with ?shot=1). */
function PrototypeNote({ theme }: { theme: VariantProps["theme"] }) {
  return (
    <aside aria-label="Prototype note" className="mx-auto max-w-6xl px-4 pb-14">
      <div className="rounded-2xl border border-dashed border-line-strong p-5 text-sm text-ink-muted">
        <p className="font-bold text-ink">
          Variant A — {name} · theme: {theme}
        </p>
        <ul className="mt-2 grid list-disc gap-1 pl-5">
          <li>
            One plate geometry at every size: padding {PLATE_RATIOS.pad} × logo height, radius {PLATE_RATIOS.radius} ×
            logo height. Header 56px (phone) / 72px (desktop), hero 88px (phone) / 160px (desktop), footer 64px.
          </li>
          <li>Light theme keeps the same badge (rim + soft shadow) instead of merging into the off-white ground.</li>
          <li>
            The wordmark is ~13% of logo height: 7.3px (phone) / 9.4px (desktop) in the header, 8.3px in the footer
            (LOGO_MIN_HEIGHT). At the old 40/32px it was 5.2/4.2px and only read as a grey bar.
          </li>
        </ul>
      </div>
    </aside>
  );
}
