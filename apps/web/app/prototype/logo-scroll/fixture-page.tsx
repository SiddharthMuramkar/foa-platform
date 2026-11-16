// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Shared, READ-ONLY building blocks so the three variants differ only in logo/header/hero behaviour.
// Server Components (no JS). Compose: <FixtureHeaderBar logoSlot={…}/> + your hero (use <FixtureHeroCopy/>)
// + <FixtureSections/>.
import type { ReactNode } from "react";
import { AUCTIONS, COMPETITIONS, DONATE, FOOTER, GALLERY, HERO, IMPACT, NAV_ITEMS } from "./fixtures";
import { LOGO_ASPECT } from "./logo";

const container = "mx-auto w-full max-w-6xl px-4 md:px-8";

/** Grey placeholder image block (no imagery yet; SPEC §4.8 forbids AI-generated images). */
export function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-xl bg-block ${className}`} />;
}

export function DonateLink({ className = "", label = "Donate", href = "#donate" }: { className?: string; label?: string; href?: string }) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-donate px-5 font-bold text-on-donate ${className}`}
    >
      {label}
    </a>
  );
}

/**
 * Size of the compact logo slot in the header: height var(--header-logo-h), width from the logo aspect.
 * Reserve it even while the slot is visually empty (CLS 0).
 */
export const HEADER_LOGO_SLOT_STYLE = {
  height: "var(--header-logo-h)",
  width: `calc(var(--header-logo-h) * ${LOGO_ASPECT.toFixed(4)})`,
} as const;

type FixtureHeaderBarProps = {
  /** Rendered inside a box of exactly HEADER_LOGO_SLOT_STYLE size, wrapped in a home link. */
  logoSlot?: ReactNode;
  /** Accessible name for the home link around the slot. */
  homeLabel?: string;
  /** Extra classes on the <header> (e.g. data-attr driven styles). */
  className?: string;
  /** "sticky" (default) keeps layout flow; "fixed" overlays the page (add your own top spacer). */
  position?: "sticky" | "fixed";
  children?: ReactNode;
};

export function FixtureHeaderBar({ logoSlot, homeLabel = "Friends of Animals home", className = "", position = "sticky", children }: FixtureHeaderBarProps) {
  return (
    <header
      id="site-header"
      className={`${position === "fixed" ? "fixed inset-x-0" : "sticky"} top-0 z-40 h-header border-b border-line bg-surface ${className}`}
    >
      <div className={`${container} flex h-full items-center gap-4`}>
        <a href="#top" aria-label={homeLabel} className="relative shrink-0 rounded-md" style={HEADER_LOGO_SLOT_STYLE} data-header-logo-slot="">
          {logoSlot}
        </a>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.filter((n) => !n.donate).map((n) => (
              <li key={n.label}>
                <a href={n.href} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-ink hover:bg-block/50">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <DonateLink className="ml-1 text-sm" />
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-block/50 md:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </nav>
        {children}
      </div>
    </header>
  );
}

export function FixtureHeroCopy({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-bold tracking-wide text-ink-muted uppercase">{HERO.eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-tight font-bold text-balance md:text-5xl">{HERO.title}</h1>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{HERO.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={HERO.primaryCta.href}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 font-bold text-on-primary"
        >
          {HERO.primaryCta.label}
        </a>
        <DonateLink label={HERO.secondaryCta.label} href={HERO.secondaryCta.href} />
      </div>
    </div>
  );
}

function SectionHead({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-ink-muted">{intro}</p>
    </div>
  );
}

/** Everything below the hero: ~5 phone screens of neutral content. */
export function FixtureSections() {
  return (
    <>
      <section id={COMPETITIONS.id} className={`${container} py-16`}>
        <SectionHead title={COMPETITIONS.title} intro={COMPETITIONS.intro} />
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {COMPETITIONS.items.map((c) => (
            <li key={c.title} className="rounded-2xl border border-line bg-surface-2 p-4">
              <Block className="aspect-[4/3]" />
              <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{c.meta}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id={GALLERY.id} className={`${container} py-16`}>
        <SectionHead title={GALLERY.title} intro={GALLERY.intro} />
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {GALLERY.items.map((g, i) => (
            <li key={i}>
              <Block className={i % 3 === 1 ? "aspect-[3/4]" : "aspect-square"} />
              <p className="mt-2 font-bold">{g.title}</p>
              <p className="text-sm text-ink-muted">{g.byline}</p>
              <p className="text-sm text-ink-muted">{g.place}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id={AUCTIONS.id} className={`${container} py-16`}>
        <SectionHead title={AUCTIONS.title} intro={AUCTIONS.intro} />
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {AUCTIONS.items.map((a) => (
            <li key={a.title} className="flex gap-4 rounded-2xl border border-line bg-surface-2 p-4 md:flex-col">
              <Block className="aspect-square w-28 shrink-0 md:w-full" />
              <div>
                <h3 className="text-lg font-bold">{a.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{a.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id={IMPACT.id} className={`${container} py-16`}>
        <SectionHead title={IMPACT.title} intro={IMPACT.intro} />
        <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {IMPACT.stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface-2 p-5">
              <dt className="text-sm text-ink-muted">{s.label}</dt>
              <dd className="mt-1 text-3xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>
        <Block className="mt-8 aspect-[16/7]" />
      </section>

      <section id={DONATE.id} className="border-y border-line bg-surface-2">
        <div className={`${container} flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between`}>
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold">{DONATE.title}</h2>
            <p className="mt-2 text-ink-muted">{DONATE.body}</p>
          </div>
          <DonateLink label={DONATE.cta.label} href={DONATE.cta.href} className="px-8 text-lg" />
        </div>
      </section>

      <footer id={FOOTER.id} className={`${container} py-12`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {FOOTER.columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-bold">{col.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#top" className="underline-offset-4 hover:underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 pb-20 text-sm text-ink-muted">{FOOTER.note}</p>
      </footer>
    </>
  );
}
