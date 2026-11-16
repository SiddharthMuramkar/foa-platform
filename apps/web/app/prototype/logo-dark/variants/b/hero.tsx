// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant B hero: fully dark (follows the page theme), text-led. The logo is NOT repeated here; the headline is
// the focal point (FR-PUB-01: mission hero with primary CTAs Enter a Competition + Donate).
// Seam: a short surface→canvas gradient under the white masthead steps the luminance down (#fff → #1b1e23 →
// #121417 in dark) instead of a hard white/near-black cliff. It stops above the CTAs, so Donate never sits on it.
import { hero, nav } from "../../fixtures";
import { container, donateButton, primaryButton, textLink } from "./ui";

export function Hero() {
  return (
    <section aria-labelledby="b-hero-title" className="relative bg-canvas text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-surface to-canvas md:h-40" />
      <div className={`${container} relative grid gap-10 pt-10 pb-16 md:grid-cols-12 md:gap-12 md:pt-20 md:pb-24`}>
        <div className="md:col-span-7">
          <p className="flex items-center gap-2 text-sm font-bold text-success">
            <span aria-hidden="true" className="size-2 rounded-full bg-success" />
            {hero.eyebrow}
          </p>
          <h1
            id="b-hero-title"
            className="mt-5 text-[2.75rem] leading-[1.02] font-bold tracking-tight text-balance md:text-7xl lg:text-[5.25rem]"
          >
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-ink-muted md:text-xl">{hero.body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={hero.cta.href} className={primaryButton}>
              {hero.cta.label}
            </a>
            <a href={nav.donate.href} className={`${donateButton} min-h-12 px-6 text-base`}>
              {nav.donate.label}
            </a>
            <a href={hero.secondaryCta.href} className={`ml-1 inline-flex min-h-12 items-center font-bold text-accent ${textLink}`}>
              {hero.secondaryCta.label}
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </a>
          </div>
        </div>
        {/* Placeholder for curated free-licence stock (§4.8: no AI-generated imagery). Box is reserved: CLS 0. */}
        <figure className="md:col-span-5 md:self-end">
          <div
            role="img"
            aria-label={hero.image.alt}
            style={{ aspectRatio: hero.image.aspectRatio }}
            className="grid w-full place-items-center rounded-lg border border-line bg-surface p-6 text-center text-sm text-ink-muted"
          >
            <span aria-hidden="true">{hero.image.placeholderLabel}</span>
          </div>
        </figure>
      </div>
    </section>
  );
}
