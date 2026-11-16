// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant C home sections. Every section is a cluster of tiles on one shared grid (2 cols on phones, 12 on
// desktop) with the logo-gap gutter. Section colour = meaning: green = take part, blue = trust/impact,
// ink = Artworks (neutral, let the art carry colour), red = give (solid only on Donate).
//
// Safeguarding (SPEC §4.1): children appear only as Display Name, age category label, School, city/state,
// Competition and award (SG-01); Artworks are labelled placeholders on mats (SG-06 previews); every public
// item carries "Report a concern" (SG-08). Stock photos that could read as FOA's own work carry
// "Illustrative photo".
import Image from "next/image";
import type { CSSProperties } from "react";
import { home, type Competition, type GalleryArtwork } from "../../fixtures";
import {
  ArrowCell,
  Badge,
  Eyebrow,
  PawIcon,
  PhotoFill,
  ReportConcern,
  SplitButton,
  TickIcon,
  TriMarker,
  tile,
} from "./parts";

const h2 = "text-[1.875rem] leading-[1.05] font-extrabold tracking-[-0.02em] lg:text-[2.75rem] lg:leading-none";

/* ------------------------------------------------------------------ hero */

export function Hero() {
  const { hero, competitions } = home;
  return (
    <section aria-labelledby="c-hero-h" className="grid grid-cols-2 gap-(--c-gap) lg:grid-cols-12">
      {/* Headline tile: the logo's blue, white type anchored bottom-left like the logo's letters. */}
      <div
        className={`${tile("blue")} col-span-2 flex flex-col justify-between gap-10 p-5 sm:p-8 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-[548px] lg:p-12`}
      >
        <Eyebrow marker={<TriMarker animate />}>{hero.eyebrow}</Eyebrow>
        <div>
          <h1
            id="c-hero-h"
            className="text-[2.625rem] leading-none font-extrabold tracking-[-0.03em] text-balance sm:text-6xl lg:text-[5.25rem] lg:leading-[0.94]"
          >
            {hero.headline}
          </h1>
          <p className="c-muted mt-5 max-w-[34rem] text-base leading-relaxed lg:mt-7 lg:text-lg">{hero.subline}</p>
        </div>
      </div>

      {/* Action row: three tiles, the primary affordance. Whole tile is the link. */}
      <a
        href={hero.primaryCta.href}
        className={`${tile("green")} c-link-tile c-rise col-span-2 flex min-h-32 flex-col justify-between gap-4 p-5 lg:col-span-6 lg:col-start-1 lg:row-start-3 lg:min-h-[156px] lg:p-6`}
        style={{ "--i": 0 } as CSSProperties}
      >
        <span className="flex items-start justify-between gap-4">
          <span className="text-[0.8125rem] font-extrabold tracking-[0.08em] uppercase">
            {competitions.items.length} open now · Take part
          </span>
          <ArrowCell large />
        </span>
        <span className="text-[1.75rem] leading-none font-extrabold tracking-[-0.02em] lg:text-[2.375rem]">
          {hero.primaryCta.label}
        </span>
      </a>
      <a
        href={hero.secondaryCta.href}
        className={`${tile("red")} c-link-tile c-rise flex min-h-28 flex-col justify-between gap-3 p-4 lg:col-span-3 lg:col-start-7 lg:row-start-3 lg:min-h-[156px] lg:p-6`}
        style={{ "--i": 1 } as CSSProperties}
      >
        <span className="c-arrow" aria-hidden="true">
          <PawIcon />
        </span>
        <span>
          <span className="block text-[1.5rem] leading-none font-extrabold lg:text-[2rem]">{hero.secondaryCta.label}</span>
          <span className="mt-1.5 block text-sm">Help an animal today</span>
        </span>
      </a>
      <a
        href={home.gallery.viewAll.href}
        className={`${tile("blue-tint")} c-link-tile c-rise flex min-h-28 flex-col justify-between gap-3 p-4 lg:col-span-3 lg:col-start-10 lg:row-start-3 lg:min-h-[156px] lg:p-6`}
        style={{ "--i": 2 } as CSSProperties}
      >
        <ArrowCell />
        <span>
          <span className="block text-[1.375rem] leading-[1.05] font-extrabold lg:text-[1.75rem]">Explore the gallery</span>
          <span className="c-muted mt-1.5 block text-sm">Award-winning Artworks</span>
        </span>
      </a>

      {/* Photo tile, cropped square (LCP candidate: preloaded). */}
      <div className="c-photo col-span-2 aspect-square lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:aspect-auto">
        <PhotoFill photo={hero.image} preload position="50% 22%" sizes="(min-width: 1400px) 560px, (min-width: 1024px) 40vw, 100vw" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ competitions */

const coverPosition: Record<string, string> = {
  "paws-and-pencils-2027": "28% 50%",
  "colours-of-compassion-2027": "62% 62%",
  "through-their-eyes-2027": "68% 60%",
};

export function CompetitionCard({ c, className = "lg:col-span-3" }: { c: Competition; className?: string }) {
  return (
    <article className={`${tile("paper")} grid grid-cols-[7.5rem_1fr] sm:grid-cols-[10rem_1fr] lg:grid-cols-1 lg:grid-rows-[auto_1fr] ${className}`}>
      <div className="c-photo aspect-square self-start">
        <PhotoFill photo={c.cover} position={coverPosition[c.slug]} sizes="(min-width: 1024px) 25vw, 160px" />
      </div>
      <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 lg:p-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="blue">{c.artForm}</Badge>
          <Badge tone="green">Registration open</Badge>
        </div>
        <h3 className="text-lg leading-tight font-extrabold lg:text-[1.375rem]">
          <a className="c-stretch" href={c.href}>
            {c.title}
          </a>
        </h3>
        <p className="c-muted text-[0.9375rem] leading-snug">Theme: {c.theme}</p>
        <dl className="mt-auto grid grid-cols-2 gap-[3px] pt-1 text-sm leading-tight">
          <div className="col-span-2 bg-(--c-canvas) px-2.5 py-2">
            <dt className="c-muted text-xs">Category</dt>
            <dd className="font-extrabold">{c.categoryLabel}</dd>
          </div>
          <div className="bg-(--c-canvas) px-2.5 py-2">
            <dt className="c-muted text-xs">Closes</dt>
            <dd className="font-extrabold">{c.closesLabel.replace("Closes ", "")}</dd>
          </div>
          <div className="bg-(--c-canvas) px-2.5 py-2">
            <dt className="c-muted text-xs">Entry fee</dt>
            <dd className="font-extrabold">{c.feeLabel}</dd>
          </div>
        </dl>
        <span className="flex items-center justify-between gap-3 pt-0.5 text-[0.9375rem] font-extrabold" aria-hidden="true">
          Enter
          <ArrowCell />
        </span>
      </div>
    </article>
  );
}

export function Competitions() {
  const { competitions } = home;
  return (
    <section id="competitions" aria-labelledby="c-comp-h" className="grid grid-cols-1 gap-(--c-gap) lg:grid-cols-12">
      <div className={`${tile("green-tint")} flex flex-col justify-between gap-6 p-5 sm:p-6 lg:col-span-3 lg:p-7`}>
        <div>
          <Eyebrow>Take part</Eyebrow>
          <h2 id="c-comp-h" className={`${h2} mt-3`}>
            {competitions.heading}
          </h2>
          <p className="c-muted mt-3 text-base leading-relaxed">{competitions.intro}</p>
        </div>
        <SplitButton tone="secondary" href={competitions.viewAll.href} small className="self-start">
          {competitions.viewAll.label}
        </SplitButton>
      </div>
      {competitions.items.map((c) => (
        <CompetitionCard key={c.slug} c={c} />
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ gallery */

/** Artwork on a mat, framed by the tile's own paper (never cropped, never edge-to-edge like a photo). */
function ArtworkMat({ a, sizes, frame }: { a: GalleryArtwork; sizes: string; frame: string }) {
  return (
    <div className={frame}>
      <div className="c-mat">
        <div className="c-mat__inner">
          <Image src={a.image.src} alt={a.alt} fill sizes={sizes} unoptimized />
        </div>
      </div>
    </div>
  );
}

function Credit({ a }: { a: GalleryArtwork }) {
  // SG-01 fields only.
  return (
    <>
      <p className="text-sm leading-snug">
        <strong>{a.displayName}</strong> · {a.categoryLabel}
      </p>
      <p className="c-muted text-sm leading-snug">
        {a.school}, {a.city}, {a.state}
      </p>
    </>
  );
}

export function Gallery() {
  const { gallery, auction } = home;
  const [featured, ...rest] = gallery.items;
  const small = rest.slice(0, 4);
  const lot = auction.item;
  return (
    <section id="gallery" aria-labelledby="c-gallery-h" className="grid grid-cols-2 gap-(--c-gap) lg:grid-cols-12">
      <div className={`${tile("ink")} col-span-2 flex flex-col justify-between gap-6 p-5 sm:p-6 lg:col-span-4 lg:p-7`}>
        <div>
          <Eyebrow>Gallery</Eyebrow>
          <h2 id="c-gallery-h" className={`${h2} mt-3`}>
            {gallery.heading}
          </h2>
          <p className="c-muted mt-3 text-base leading-relaxed">{gallery.intro}</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <SplitButton tone="secondary" href={gallery.viewAll.href} small>
            {gallery.viewAll.label}
          </SplitButton>
          <p className="c-muted text-xs">Images below are labelled placeholders, not real children’s Artworks.</p>
        </div>
      </div>

      {/* Featured Artwork (homeFeatured): mat + museum-style caption, side by side on desktop. */}
      <article className={`${tile("paper")} col-span-2 grid lg:col-span-8 lg:grid-cols-2`}>
        <ArtworkMat a={featured} sizes="(min-width: 1024px) 34vw, 100vw" frame="p-3 pb-0 sm:p-4 sm:pb-0 lg:p-5 lg:pr-0" />
        <div className="flex flex-col gap-3 p-5 lg:p-7">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="award">{featured.award}</Badge>
            <Badge tone="blue">{featured.artForm}</Badge>
          </div>
          <p className="c-muted text-[0.8125rem] font-extrabold tracking-[0.08em] uppercase">Featured Artwork</p>
          <h3 className="text-[1.625rem] leading-[1.05] font-extrabold tracking-[-0.015em] lg:text-[2.125rem]">
            <a className="c-stretch" href={featured.href}>
              {featured.title}
            </a>
          </h3>
          <Credit a={featured} />
          <p className="c-muted text-sm">{featured.competition}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <ReportConcern href={featured.reportConcernHref} what={featured.title} />
            <ArrowCell />
          </div>
        </div>
      </article>

      {small.map((a) => (
        <article key={a.id} className={`${tile("paper")} flex flex-col lg:col-span-3`}>
          <ArtworkMat a={a} sizes="(min-width: 1024px) 25vw, 50vw" frame="p-2 pb-0 sm:p-3 sm:pb-0" />
          <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
            <div>
              <Badge tone="award">{a.award}</Badge>
            </div>
            <h3 className="mt-1 text-base leading-tight font-extrabold lg:text-lg">
              <a className="c-stretch" href={a.href}>
                {a.title}
              </a>
            </h3>
            <Credit a={a} />
            <p className="c-muted text-xs leading-snug">{a.competition}</p>
            <div className="mt-auto pt-1">
              <ReportConcern href={a.reportConcernHref} what={a.title} />
            </div>
          </div>
        </article>
      ))}

      {/* Live auction lot strip. */}
      <article
        id="auctions"
        className={`${tile("blue-tint")} col-span-2 grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-4 p-3 sm:grid-cols-[8rem_1fr] lg:col-span-12 lg:grid-cols-[10rem_1fr_auto_auto] lg:items-center lg:gap-x-8 lg:p-4`}
      >
        <div className="c-mat self-start" style={{ "--mat-pad": "7%" } as CSSProperties}>
          <div className="c-mat__inner">
            <Image src={lot.image.src} alt={lot.alt} fill sizes="160px" unoptimized />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Eyebrow>{auction.heading}</Eyebrow>
          <h3 className="text-lg leading-tight font-extrabold lg:text-[1.375rem]">{lot.title}</h3>
          <p className="c-muted text-sm leading-snug">
            {lot.creatorCredit} · {lot.award}
          </p>
          <div>
            <ReportConcern href={lot.reportConcernHref} what={`the auction lot ${lot.title}`} />
          </div>
        </div>
        <div className="col-span-2 flex items-end justify-between gap-4 lg:col-span-1 lg:block">
          <div>
            <p className="c-muted text-xs">Current bid</p>
            <p className="c-accent text-[2rem] leading-none font-extrabold tracking-[-0.02em] lg:text-[2.5rem]">{lot.currentBidLabel}</p>
            <p className="c-muted mt-1 text-sm">
              {lot.bidCount} bids · {lot.endsLabel}
            </p>
          </div>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <SplitButton tone="primary" href={lot.href}>
            Place a bid
          </SplitButton>
        </div>
      </article>
    </section>
  );
}

/* ------------------------------------------------------------------ impact */

export function Impact() {
  const { impact } = home;
  return (
    <section id="impact" aria-labelledby="c-impact-h" className="grid grid-cols-1 gap-(--c-gap) sm:grid-cols-3 lg:grid-cols-12">
      <div className={`${tile("blue")} flex flex-col justify-between gap-6 p-5 sm:col-span-3 sm:p-6 lg:col-span-3 lg:p-7`}>
        <div>
          <Eyebrow>Impact · {impact.period}</Eyebrow>
          <h2 id="c-impact-h" className={`${h2} mt-3`}>
            {impact.heading}
          </h2>
        </div>
        <a className="c-link c-above text-base" href={impact.transparency.href}>
          {impact.transparency.label}
        </a>
      </div>
      {impact.items.map((m) => (
        <div key={m.metricKey} className={`${tile("blue")} flex flex-col justify-between gap-6 p-5 sm:min-h-44 lg:col-span-3 lg:min-h-[260px] lg:p-7`}>
          <p className="text-lg leading-tight font-extrabold lg:text-xl">{m.label}</p>
          <div>
            <p className="text-[3.5rem] leading-[0.9] font-extrabold tracking-[-0.04em] lg:text-[4.75rem]">{m.valueLabel}</p>
            <p className="c-muted mt-3 text-sm leading-snug">
              {m.period}. {m.sourceNote}.
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ donate band */

export function DonateBand() {
  const { donate } = home;
  return (
    <section id="donate" aria-labelledby="c-donate-h" className="grid grid-cols-2 gap-(--c-gap) lg:grid-cols-12">
      <div
        className={`${tile("red-tint")} col-span-2 flex flex-col gap-6 border-t-4 border-(--c-red-text) p-5 sm:p-8 lg:col-span-9 lg:row-span-2 lg:justify-between lg:p-10`}
      >
        <div>
          <Eyebrow marker={<span className="c-sq c-sq--red-rule" aria-hidden="true" />}>Give</Eyebrow>
          <h2 id="c-donate-h" className={`${h2} mt-3`}>
            {donate.heading}
          </h2>
          <p className="c-muted mt-3 max-w-[36rem] text-base leading-relaxed lg:text-lg">{donate.body}</p>
        </div>
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="c-label mb-2.5">Choose an amount</legend>
            <div className="grid grid-cols-3 gap-[3px] sm:max-w-md">
              {donate.presetLabels.map((label, i) => (
                <label key={label} className="c-amount">
                  <input type="radio" name="c-amount" value={donate.presetsInr[i]} defaultChecked={i === 1} />
                  <TickIcon className="c-amount__tick" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <SplitButton tone="donate" href={donate.cta.href}>
              {donate.cta.label}
            </SplitButton>
          </div>
        </div>
      </div>
      <div className="c-photo aspect-square lg:col-span-3">
        <PhotoFill photo={donate.photo} position="50% 40%" sizes="(min-width: 1024px) 25vw, 50vw" />
      </div>
      <div className={`${tile("paper")} flex flex-col justify-end gap-2 p-4 lg:col-span-3 lg:p-5`}>
        <span className="size-6" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="10" width="16" height="11" />
            <path d="M7 10V7a5 5 0 0 1 10 0v3h-3V7a2 2 0 0 0-4 0v3H7Z" />
          </svg>
        </span>
        <p className="text-sm leading-snug lg:text-[0.9375rem]">{donate.note}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ adoption */

const animalPosition: Record<string, string> = { Bholu: "45% 60%", Rani: "45% 70%", Chhotu: "50% 55%" };

export function Adoption() {
  const { adoption } = home;
  return (
    <section id="adopt" aria-labelledby="c-adopt-h" className="grid grid-cols-1 gap-(--c-gap) lg:grid-cols-12">
      <div className={`${tile("green-tint")} flex flex-col justify-between gap-6 p-5 sm:p-6 lg:col-span-3 lg:p-7`}>
        <div>
          <Eyebrow>Adopt</Eyebrow>
          <h2 id="c-adopt-h" className={`${h2} mt-3`}>
            {adoption.heading}
          </h2>
          <p className="c-muted mt-3 text-sm">Listed by verified Welfare Partners. Photos here are illustrative.</p>
        </div>
        <SplitButton tone="secondary" href={adoption.viewAll.href} small className="self-start">
          {adoption.viewAll.label}
        </SplitButton>
      </div>
      {adoption.items.map((a) => (
        <article key={a.name} className={`${tile("paper")} grid grid-cols-[7.5rem_1fr] sm:grid-cols-[10rem_1fr] lg:col-span-3 lg:grid-cols-1`}>
          <div className="c-photo aspect-square">
            <PhotoFill photo={a.photo} caption="Illustrative photo" position={animalPosition[a.name]} sizes="(min-width: 1024px) 25vw, 160px" />
          </div>
          <div className="flex flex-col gap-1 p-3.5 sm:p-4 lg:p-5">
            <h3 className="text-[1.375rem] leading-tight font-extrabold">
              <a className="c-stretch" href={a.href}>
                {a.name}
              </a>
            </h3>
            <p className="text-[0.9375rem]">
              {a.species} · {a.ageBand} · {a.sex}
            </p>
            <p className="c-muted text-sm">{a.city}</p>
            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
              <ReportConcern href={a.reportConcernHref} what={a.name} />
              <ArrowCell />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ partners + newsletter */

export function PartnersAndNewsletter() {
  const { partners, newsletter } = home;
  return (
    <section aria-label="Partners and newsletter" className="grid grid-cols-1 gap-(--c-gap) lg:grid-cols-12">
      <div className={`${tile("paper")} flex flex-col gap-4 p-5 sm:p-6 lg:col-span-8 lg:p-7`} aria-labelledby="c-partners-h" role="region">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="c-partners-h" className="text-[1.375rem] leading-tight font-extrabold lg:text-2xl">
            {partners.heading}
          </h2>
          <p className="c-muted text-sm">Disclosed sponsors and partners (placeholders)</p>
        </div>
        <ul className="grid grid-cols-2 gap-[3px] sm:grid-cols-4">
          {partners.items.map((p) => (
            <li
              key={p.name}
              className="flex min-h-24 flex-col justify-between gap-2 bg-(--c-canvas) p-3 shadow-[inset_0_0_0_1.5px_var(--c-field)] [background-image:repeating-linear-gradient(135deg,transparent_0_10px,var(--c-paper)_10px_11px)]"
            >
              <span className="c-muted text-xs font-extrabold tracking-[0.06em] uppercase">{p.kind}</span>
              <span className="text-sm leading-tight font-extrabold">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`${tile("green-tint")} flex flex-col gap-4 p-5 sm:p-6 lg:col-span-4 lg:p-7`} role="region" aria-labelledby="c-news-h">
        <h2 id="c-news-h" className="text-[1.375rem] leading-tight font-extrabold lg:text-2xl">
          {newsletter.heading}
        </h2>
        <form action="/prototype/visual-direction" method="get" className="flex flex-col gap-2">
          <input type="hidden" name="variant" value="C" />
          <label htmlFor="c-news-email" className="c-label">
            Email address
          </label>
          <div className="flex flex-col gap-[3px] sm:flex-row">
            <input id="c-news-email" className="c-field" type="email" name="email" autoComplete="email" placeholder="name@example.com" required />
            <SplitButton tone="primary" type="submit" className="shrink-0">
              {newsletter.cta}
            </SplitButton>
          </div>
          <p className="c-hint">Monthly. Unsubscribe any time.</p>
        </form>
      </div>
    </section>
  );
}
