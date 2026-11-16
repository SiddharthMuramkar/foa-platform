// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant C hero: a bento pair. A large LIGHT island holds the logo (96px phone / 112px desktop) as the card's
// masthead, then the headline, body and CTAs; beside it (below on phones) a PAGE-tone island holds the photo. The
// headline leads the page (h1, 40px phone / 60px desktop: the largest element). The logo is never on the dark canvas.
// Fix stage: hero logo 160→96/112px so it no longer outweighs the H1; `.c-hero-logo` names the view timeline that
// keeps the pill logo hidden while this one is on screen (one logo above the fold, globals.css).
import type { CSSProperties } from "react";
import { FoaLogo } from "../../foa-logo";
import { hero } from "../../fixtures";
import { Island } from "./island";

// Neutral hatch for the photo placeholder (no AI imagery, §4.8: curated free-licence stock goes here later).
const hatch: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 14px)",
};

export function IslandHero() {
  return (
    <section aria-labelledby="c-hero-title" className="grid gap-3 md:gap-4 lg:grid-cols-12">
      <Island tone="light" className="rounded-[2rem] p-6 sm:p-8 lg:col-span-7 lg:p-12">
        {/*
          Logo, hero size: 96px tall phone (166px wide) / 112px desktop (194px; wordmark 12.5/14.6px).
          The only preloaded image on the route: with the stock photo still a placeholder, this is the LCP image.
          When the real photo lands it takes `preload` and this one drops it (one preload per route).
        */}
        <FoaLogo height={112} preload className="c-hero-logo block h-24 w-auto lg:h-28" />

        <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-success lg:mt-8">
          <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          {hero.eyebrow}
        </p>
        <h1
          id="c-hero-title"
          className="mt-3 max-w-[20ch] text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-muted lg:text-lg">{hero.body}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href={hero.cta.href}
            className="inline-flex h-12 items-center rounded-full bg-accent px-6 font-bold text-on-accent motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
          >
            {hero.cta.label}
          </a>
          <a
            href={hero.secondaryCta.href}
            className="inline-flex h-12 items-center rounded-full px-6 font-bold text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2 motion-safe:transition-colors"
          >
            {hero.secondaryCta.label}
          </a>
        </div>
      </Island>

      <Island tone="page" className="flex flex-col rounded-[2rem] p-2 lg:col-span-5">
        {/* Box reserved at 4:3 on phones (CLS); on desktop it fills the bento row beside the hero card. */}
        <div
          role="img"
          aria-label={hero.image.alt}
          style={hatch}
          className="flex aspect-4/3 items-end rounded-[1.5rem] bg-surface p-4 lg:aspect-auto lg:flex-1"
        >
          <span className="rounded-xl bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted ring-1 ring-line">
            {hero.image.placeholderLabel}
          </span>
        </div>
      </Island>
    </section>
  );
}
