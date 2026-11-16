// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant A "Sunlit storybook" (joy first). Brief: ../BRIEF.md. Home page per FR-PUB-01 + a component sampler.
//
// What makes A structurally different from B (editorial grid, Artwork-as-hero) and C (bento tiles):
//  - Centred, single-column storybook flow: every section heading is centred with a doodle; no side-by-side grid
//    in the hero. The hero is a cover illustration: headline → CTAs → a "family portrait" of animal photos in
//    organic blob masks.
//  - Primary affordance = chunky pill buttons with a 3D lip (press-down feel), not flat buttons or tiles.
//  - Gallery is a "fridge door": taped, tilted frames (horizontal strip on phones, pinned wall on desktop).
//  - Impact numbers sit inside soft tinted blobs; Competitions are tinted "book pages" with an inset photo.
//  - Logo colours appear as soft tints + one deep green footer "meadow"; red is a tint/stroke, solid only on Donate.
//
// Server component except two tiny client islands (tabs, arrow-key scope). Fonts: 2 weights total (./a/fonts.ts).
import Image from "next/image";
import type { CSSProperties } from "react";
import { home, type StockPhoto } from "../fixtures";
import { logo } from "../logo";
import ArrowKeyScope from "./a/arrow-key-scope";
import {
  Arrow,
  Curl,
  Heart,
  IconBrush,
  IconHome,
  IconTreated,
  Paw,
  PawTrail,
  Rosette,
  Sparkle,
  Squiggle,
  WaveEdge,
} from "./a/doodles";
import { body, display } from "./a/fonts";
import SamplerTabs from "./a/sampler-tabs";
import { contrast, contrastPairs, tokenCss, tokens as aTokens } from "./a/tokens";
import "./a/variant-a.css";

export const name = "Sunlit storybook";

/** Every colour variant A paints, light and dark (hex). Source of truth: ./a/tokens.ts. */
export const tokens = aTokens;

type Tone = "green" | "blue" | "red";
const TONES: Tone[] = ["green", "blue", "red"];

const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

/* ------------------------------------------------------------------ small pieces */

function DonateButton({
  size,
  label = home.nav.donate.label,
  href = home.nav.donate.href,
}: {
  size?: "sm" | "lg";
  label?: string;
  href?: string;
}) {
  return (
    <a href={href} className={`a-btn a-btn--donate${size ? ` a-btn--${size}` : ""}`}>
      <Heart />
      {label}
    </a>
  );
}

function SectionHeading({
  id,
  kicker,
  tone = "green",
  title,
  intro,
}: {
  id: string;
  kicker: string;
  tone?: Tone;
  title: string;
  intro?: string;
}) {
  return (
    <div className="a-heading">
      <span className={`a-chip a-chip--${tone}`}>
        <Paw />
        {kicker}
      </span>
      <h2 id={id} className="a-display a-h2">
        {title}
      </h2>
      <Curl className="a-heading-curl" style={{ color: `var(--a-doodle-${tone})` }} />
      {intro ? <p className="a-lede">{intro}</p> : null}
    </div>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <p className="mt-10 text-center">
      <a href={href} className="a-btn a-btn--secondary">
        {label}
        <Arrow />
      </a>
    </p>
  );
}

function ConcernLink({ href, about }: { href: string; about: string }) {
  return (
    <a href={href} className="a-concern">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <path
          d="M3 14V2.5M3 3h8.5l-1.8 3 1.8 3H3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Report a concern<span className="sr-only"> about {about}</span>
    </a>
  );
}

function licenceLabel(p: StockPhoto) {
  return p.licence === "cc0" ? "CC0" : p.licence === "pexels" ? "Pexels licence" : "Unsplash licence";
}

/** "Illustrative photo" wherever stock could read as FOA's own work (fixtures `caption`). */
function photoCaption(p: StockPhoto): string | undefined {
  return p.caption;
}

function splitHeadline(headline: string, accent: string): [string, string] {
  const at = headline.indexOf(accent);
  return at < 0 ? [headline, ""] : [headline.slice(0, at), accent];
}

/* ------------------------------------------------------------------ header */

function Header() {
  const { nav } = home;
  return (
    <header className="a-header">
      <div className="a-wrap a-header-row">
        <a href="#a-top" className="a-logo-link" aria-label={`${logo.alt}, home`}>
          {/* Logo unaltered; cream plate keeps the black wordmark legible in dark (invisible on cream). */}
          <span className="a-logo-plate">
            <Image src={logo.svg} width={logo.width} height={logo.height} alt="" unoptimized />
          </span>
        </a>

        <nav aria-label="Main" className="a-navtray">
          {nav.items.map((item) => (
            <a key={item.href} href={item.href} className="a-navlink a-display">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="a-header-actions">
          <a href={nav.signIn.href} className="a-signin a-btn a-btn--ghost a-btn--sm">
            {nav.signIn.label}
          </a>
          <DonateButton size="sm" />
          {/* Phone menu: native <details>, zero JS. */}
          <details className="a-menu">
            <summary className="a-display">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4 7c5-1.2 11-1.2 16 0M4 12.5c5-.8 11 .8 16 0M4 18c5 1 11-1 16 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              Menu
            </summary>
            <nav aria-label="Main (phone)" className="a-menu-panel a-display">
              {nav.items.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
              <a href={nav.signIn.href}>{nav.signIn.label}</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  const { hero, competitions } = home;
  const [lead, accent] = splitHeadline(hero.headline, "helps animals");
  const [kittens, puppy] = hero.alternates;
  const minFee = competitions.items.reduce((m, c) => (c.feeInr < m.feeInr ? c : m)).feeLabel;

  return (
    <section className="a-hero" aria-labelledby="a-hero-title">
      <div className="a-wrap">
        <div className="mx-auto max-w-[46rem]">
          <span className="a-chip a-chip--plain">
            <Paw style={{ color: "var(--a-doodle-green)" }} />
            {hero.eyebrow}
          </span>
          <h1 id="a-hero-title" className="a-display a-h1 mt-5">
            {lead}
            {accent ? (
              <span className="a-accent">
                {accent}
                <Squiggle />
              </span>
            ) : null}
          </h1>
          <p className="a-lede mx-auto mt-5 max-w-[36rem]">{hero.subline}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <a href={hero.primaryCta.href} className="a-btn a-btn--lg">
              {hero.primaryCta.label}
            </a>
            <DonateButton size="lg" label={hero.secondaryCta.label} href={hero.secondaryCta.href} />
          </div>
          <p className="a-soft a-small mt-3">
            {competitions.items.length} Competitions open now · entries from{" "}
            <span className="a-tnum">{minFee}</span>
          </p>
        </div>

        {/* "Family portrait": main photo in an organic blob, two friends in smaller blobs, tint blobs behind. */}
        <div className="a-hero-art">
          <span className="a-tintblob a-tintblob--green a-pop" style={cssVars({ "--a-delay": "80ms" })} aria-hidden="true" />
          <span className="a-tintblob a-tintblob--blue a-pop" style={cssVars({ "--a-delay": "160ms" })} aria-hidden="true" />
          {/* LCP image: preloaded, transform-only entrance (no opacity), explicit sizes (NFR-01, FR-PUB-01 AC). */}
          <div className="a-blob-photo a-blob-photo--main a-settle">
            <Image
              src={hero.image.file}
              alt={hero.image.alt}
              fill
              preload
              placeholder="blur"
              sizes="(min-width: 768px) 380px, 74vw"
              style={{ objectPosition: "50% 22%" }}
            />
          </div>
          <div className="a-blob-photo a-blob-photo--right a-pop" style={cssVars({ "--a-delay": "300ms" })}>
            <Image src={kittens.file} alt={kittens.alt} fill placeholder="blur" sizes="(min-width: 768px) 180px, 31vw" />
          </div>
          <div className="a-blob-photo a-blob-photo--left a-pop" style={cssVars({ "--a-delay": "420ms" })}>
            <Image src={puppy.file} alt={puppy.alt} fill placeholder="blur" sizes="(min-width: 768px) 165px, 29vw" />
          </div>
          <Sparkle
            className="a-hero-doodle a-twinkle"
            style={{ left: "5%", top: "-3%", width: "2.25rem", color: "var(--a-doodle-blue)" }}
          />
          <Sparkle
            className="a-hero-doodle a-twinkle"
            style={{ right: "36%", top: "-7%", width: "1.25rem", color: "var(--a-doodle-green)" }}
          />
          <PawTrail
            className="a-hero-doodle"
            style={{ right: "1%", bottom: "-5%", width: "5.5rem", color: "var(--a-doodle-green)" }}
          />
        </div>
        <p className="a-hero-credit">
          Illustrative photos:{" "}
          {[hero.image, kittens, puppy].map((p, i) => (
            <span key={p.sourceUrl}>
              {i > 0 ? ", " : ""}
              <a className="a-link" href={p.sourceUrl}>
                {p.author}
              </a>{" "}
              ({licenceLabel(p)})
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ competitions: tinted book pages */

function Competitions() {
  const { competitions } = home;
  return (
    <section id="competitions" className="a-section" aria-labelledby="a-comp-title">
      <div className="a-wrap">
        <SectionHeading id="a-comp-title" kicker="Registration open" title={competitions.heading} intro={competitions.intro} />
        <ul className="grid gap-6 md:grid-cols-3 md:gap-7">
          {competitions.items.map((c, i) => (
            <li key={c.slug}>
              <article className={`a-page a-page--${TONES[i % 3]}`} aria-labelledby={`a-comp-${c.slug}`}>
                <div className="a-page-photo">
                  <Image src={c.cover.file} alt={c.cover.alt} fill placeholder="blur" sizes="(min-width: 768px) 360px, 92vw" />
                  <span className="a-chip a-chip--plain">{c.artForm}</span>
                </div>
                <div className="a-page-body">
                  <h3 id={`a-comp-${c.slug}`} className="a-display a-h3">
                    {c.title}
                  </h3>
                  <p className="a-page-theme">“{c.theme}”</p>
                  <dl className="a-facts">
                    <dt>Who</dt>
                    <dd>{c.categoryLabel}</dd>
                    <dt>Closes</dt>
                    <dd className="a-tnum">{c.closesLabel.replace(/^Closes /, "")}</dd>
                    <dt>Entry</dt>
                    <dd className="a-tnum">{c.feeLabel}</dd>
                  </dl>
                  <div className="a-page-foot">
                    <a href={c.href} className="a-btn a-btn--secondary a-btn--sm">
                      Enter<span className="sr-only"> {c.title}</span>
                      <Arrow />
                    </a>
                    {photoCaption(c.cover) ? <span className="a-caption">{photoCaption(c.cover)}</span> : null}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <SeeAll href={competitions.viewAll.href} label={competitions.viewAll.label} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ gallery: the fridge door */

const TILTS = ["-1.6deg", "1.2deg", "-0.8deg", "1.6deg", "-1.2deg", "0.9deg"];

function Gallery() {
  const { gallery } = home;
  return (
    <section id="gallery" className="a-band a-section" aria-labelledby="a-gal-title">
      <WaveEdge className="a-band-edge a-band-edge--top" />
      <div className="a-wrap">
        <SectionHeading id="a-gal-title" kicker="Young artists" tone="blue" title={gallery.heading} intro={gallery.intro} />
        <ArrowKeyScope>
          {/* Scrolls sideways on phones; focusable so keyboard users can scroll it. */}
          <ul className="a-fridge" tabIndex={0} aria-label="Gallery Artworks (scrolls sideways on small screens)">
            {gallery.items.map((art, i) => (
              <li key={art.id}>
                <figure>
                  <div className={`a-frame a-frame--${TONES[i % 3]}`} style={cssVars({ "--tilt": TILTS[i % TILTS.length] })}>
                    {/* Labelled placeholder, never real children's art (SG-06: the public sees previews only). */}
                    <Image src={art.image.src} width={art.image.width} height={art.image.height} alt={art.alt} unoptimized />
                    <span className="a-chip a-chip--blue">
                      <Rosette />
                      {art.award}
                    </span>
                  </div>
                  <figcaption className="a-artcap">
                    {i === 0 ? <span className="a-chip a-chip--plain mb-2">Featured</span> : null}
                    <h3 className="a-display">
                      <a href={art.href} className="hover:underline">
                        {art.title}
                      </a>
                    </h3>
                    {/* SG-01: display name, age category label, School, city/state, Competition, award. Nothing else. */}
                    <p className="a-artist">
                      {art.displayName} · {art.categoryLabel}
                    </p>
                    <p>
                      {art.school}, {art.city}, {art.state}
                    </p>
                    <p>
                      {art.artForm} · {art.competition}
                    </p>
                    <ConcernLink href={art.reportConcernHref} about={art.title} />
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </ArrowKeyScope>
        <SeeAll href={gallery.viewAll.href} label={gallery.viewAll.label} />
      </div>
      <WaveEdge className="a-band-edge a-band-edge--bottom" />
    </section>
  );
}

/* ------------------------------------------------------------------ impact: numbers in blobs */

const IMPACT_ICON = {
  ANIMALS_TREATED: IconTreated,
  ANIMALS_ADOPTED: IconHome,
  PLATFORM_YOUNG_ARTISTS: IconBrush,
} as const;

function Impact() {
  const { impact } = home;
  return (
    <section id="impact" className="a-section" aria-labelledby="a-imp-title">
      <div className="a-wrap">
        <SectionHeading id="a-imp-title" kicker={impact.period} tone="red" title={impact.heading} />
        <ul className="mx-auto grid max-w-[60rem] gap-5 sm:grid-cols-3">
          {impact.items.map((m, i) => {
            const Icon = IMPACT_ICON[m.metricKey];
            return (
              <li key={m.metricKey} className={`a-stat a-stat--${TONES[i % 3]}`}>
                <Icon />
                <p className="a-display a-stat-num a-tnum">{m.valueLabel}</p>
                <p className="a-stat-label">{m.label}</p>
                <p className="a-stat-note">
                  {m.period}. {m.sourceNote}.
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-center">
          <a href={impact.transparency.href} className="a-link">
            {impact.transparency.label}
          </a>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ adoption highlights (FR-PUB-01 optional extra) */

function Adoption() {
  const { adoption } = home;
  return (
    <section id="adopt" className="a-section a-section--flush-top" aria-labelledby="a-adopt-title">
      <div className="a-wrap">
        <SectionHeading id="a-adopt-title" kicker="Adopt" tone="blue" title={adoption.heading} />
        <ul className="mx-auto grid max-w-[60rem] gap-4 md:grid-cols-3 md:gap-6">
          {adoption.items.map((pet, i) => (
            <li key={pet.name}>
              <article className="a-pet" aria-labelledby={`a-pet-${pet.name}`}>
                <div className="a-pet-photo" style={cssVars({ "--pet-ring": `var(--a-${TONES[i % 3]}-tint)` })}>
                  <Image src={pet.photo.file} alt={pet.photo.alt} fill placeholder="blur" sizes="(min-width: 768px) 160px, 104px" />
                </div>
                <div>
                  <h3 id={`a-pet-${pet.name}`} className="a-display">
                    {pet.name}
                  </h3>
                  <p className="a-pet-meta">
                    {pet.species} · {pet.ageBand} · {pet.sex} · {pet.city}
                  </p>
                  {photoCaption(pet.photo) ? <p className="a-caption">{photoCaption(pet.photo)}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:justify-center">
                    <a href={pet.href} className="a-link a-display">
                      Meet {pet.name}
                    </a>
                    <ConcernLink href={pet.reportConcernHref} about={pet.name} />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <SeeAll href={adoption.viewAll.href} label={adoption.viewAll.label} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ donate band */

function DonateBand() {
  const { donate } = home;
  return (
    <section id="donate" className="a-section a-section--flush-top" aria-labelledby="a-donate-title">
      <div className="a-wrap">
        <div className="a-donate">
          <div className="a-donate-photo">
            <Image src={donate.photo.file} alt={donate.photo.alt} fill placeholder="blur" sizes="(min-width: 900px) 460px, 90vw" />
          </div>
          <div>
            <span className="a-chip a-chip--red">
              <Heart />
              Every rupee helps
            </span>
            <h2 id="a-donate-title" className="a-display a-h2 mt-4">
              {donate.heading}
            </h2>
            <p className="a-lede mt-3">{donate.body}</p>
            <ArrowKeyScope>
              <fieldset className="a-amounts">
                <legend className="sr-only">Choose an amount</legend>
                {donate.presetLabels.map((label, i) => (
                  <label key={label} className="a-amount a-tnum">
                    <input type="radio" name="a-amount" value={donate.presetsInr[i]} defaultChecked={i === 1} />
                    <svg className="a-amount-tick" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path
                        d="M4 10.5l4 4 8-9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {label}
                  </label>
                ))}
              </fieldset>
            </ArrowKeyScope>
            <DonateButton size="lg" label={donate.cta.label} href={donate.cta.href} />
            <p className="a-soft a-small mt-3">{donate.note}</p>
            <p className="a-caption mt-1">
              Photo:{" "}
              <a className="a-link" href={donate.photo.sourceUrl}>
                {donate.photo.author}
              </a>{" "}
              ({licenceLabel(donate.photo)})
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ partners */

function Partners() {
  const { partners } = home;
  return (
    <section className="a-section a-section--flush-top" aria-labelledby="a-partners-title">
      <div className="a-wrap text-center">
        <h2 id="a-partners-title" className="a-display text-2xl">
          {partners.heading}
        </h2>
        <ul className="mt-6 flex flex-wrap justify-center gap-3">
          {partners.items.map((p) => (
            <li key={p.name} className="a-partner">
              <span className="a-partner-name">{p.name}</span>
              <span className="a-partner-kind">{p.kind}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer (+ newsletter) */

function Footer() {
  const { footer, newsletter } = home;
  return (
    <footer className="a-footer">
      <WaveEdge className="a-footer-edge" />
      <div className="a-wrap pt-10 pb-16 lg:pt-14">
        <div className="a-note mx-auto max-w-[44rem]">
          <h2 className="a-display text-2xl leading-tight">{newsletter.heading}</h2>
          <div className="a-field mt-4">
            <label htmlFor="a-newsletter-email" className="a-label">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input id="a-newsletter-email" type="email" autoComplete="email" placeholder="name@example.com" className="a-input" />
              <button type="button" className="a-btn shrink-0">
                {newsletter.cta}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <span className="a-logo-plate">
              <Image src={logo.svg} width={logo.width} height={logo.height} alt={logo.alt} unoptimized />
            </span>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2" aria-label="Social">
              {footer.social.map((s) => (
                <li key={s}>
                  <a href={`#${s.toLowerCase()}`}>{s}</a>
                </li>
              ))}
            </ul>
          </div>
          {footer.groups.map((g) => (
            <nav key={g.heading} aria-labelledby={`a-foot-${g.heading.replace(/\W+/g, "-")}`}>
              <h2 id={`a-foot-${g.heading.replace(/\W+/g, "-")}`} className="a-display text-xl">
                {g.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="a-footer-rule mt-12 flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {footer.utility.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
          <p className="a-small">{footer.legalLine}</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ component sampler (prototype only) */

const TAB_DEMO = [
  { label: "Drawing", body: "Pencil, crayon or ink on paper. Category A, ages 6–10. Closes 31 Jan 2027." },
  { label: "Painting", body: "Watercolour, acrylic or poster colour. Category B, ages 11–14. Closes 14 Feb 2027." },
  { label: "Photos", body: "A day in the life of a community animal. Category C, ages 15–18. Closes 28 Feb 2027." },
];

function Sampler() {
  return (
    <section className="a-sampler a-section" aria-labelledby="a-sampler-title">
      <div className="a-wrap">
        <div className="a-heading">
          <span className="a-chip a-chip--outline">Prototype only · not part of the home page</span>
          <h2 id="a-sampler-title" className="a-display a-h2">
            Component sampler
          </h2>
          <p className="a-lede">
            shadcn/ui structure and accessibility, FOA skin: rounded display face for labels, pill shapes with a pressable lip,
            tinted surfaces, warm soft shadows and a 3px focus ring.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="a-sampler-card">
            <h3 className="a-display a-h3">Buttons</h3>
            <div className="a-btn-stage">
              <button type="button" className="a-btn">
                Primary
              </button>
              <button type="button" className="a-btn a-btn--secondary">
                Secondary
              </button>
              <button type="button" className="a-btn a-btn--donate">
                <Heart />
                Donate
              </button>
              <button type="button" className="a-btn a-btn--ghost">
                Ghost
              </button>
              <button type="button" className="a-btn a-btn--sm">
                Small
              </button>
              <button type="button" className="a-btn" disabled>
                Disabled
              </button>
            </div>
            <p className="a-soft a-small mt-3">
              Hover lifts the pill and press sinks it into its lip; with reduced motion only the colour changes. Solid red is
              reserved for Donate.
            </p>
          </div>

          <div className="a-sampler-card">
            <h3 className="a-display a-h3">Text input</h3>
            <div className="a-field">
              <label htmlFor="a-s-school" className="a-label">
                School name
              </label>
              <p id="a-s-school-hint" className="a-hint">
                As it appears on your School ID card.
              </p>
              <input
                id="a-s-school"
                className="a-input"
                aria-describedby="a-s-school-hint"
                placeholder="e.g. Sunrise Public School"
              />
            </div>
            <div className="a-field">
              <label htmlFor="a-s-email" className="a-label">
                Guardian email
              </label>
              <input
                id="a-s-email"
                type="email"
                className="a-input"
                defaultValue="parent@example"
                aria-invalid="true"
                aria-describedby="a-s-email-error"
              />
              <p id="a-s-email-error" className="a-error">
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 5.5v5.5M10 14v.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                Enter an email address like name@example.com
              </p>
            </div>
          </div>

          <div className="a-sampler-card">
            <h3 className="a-display a-h3">Card and badges</h3>
            <article className="a-page a-page--blue" aria-labelledby="a-s-card">
              <div className="a-page-body a-page-body--solo">
                <h4 id="a-s-card" className="a-display a-h3">
                  Paws &amp; Pencils 2027
                </h4>
                <p className="a-page-theme">“My street’s best friend”</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="a-chip">
                    <span className="a-dot" aria-hidden="true" />
                    Registration open
                  </span>
                  <span className="a-chip a-chip--red">Closes in 3 days</span>
                  <span className="a-chip a-chip--blue">
                    <Rosette />
                    Gold
                  </span>
                  <span className="a-chip a-chip--plain">Drawing</span>
                  <span className="a-chip a-chip--outline">Illustrative photo</span>
                </div>
              </div>
            </article>
          </div>

          <div className="a-sampler-card">
            <h3 className="a-display a-h3">Tabs</h3>
            <SamplerTabs tabs={TAB_DEMO} label="Art forms" />
            <p className="a-soft a-small mt-3">
              The selected tab is a raised pill with an outline and lip, so state never relies on colour alone.
            </p>
          </div>

          <div className="a-sampler-card lg:col-span-2">
            <h3 className="a-display a-h3">Token contrast (computed from a/tokens.ts)</h3>
            <div className="overflow-x-auto">
              <table className="a-ctable">
                <caption className="sr-only">WCAG 2.2 contrast of the token pairs variant A uses, light and dark</caption>
                <thead>
                  <tr>
                    <th scope="col">Pair (min)</th>
                    <th scope="col">Light</th>
                    <th scope="col">Dark</th>
                  </tr>
                </thead>
                <tbody>
                  {contrastPairs.map(([fg, bg, min]) => (
                    <tr key={`${fg}-${bg}`}>
                      <th scope="row" className="a-soft">
                        <span className="a-swatch-chip" style={{ background: tokens.light[fg] }} />
                        <span className="a-swatch-chip" style={{ background: tokens.light[bg] }} /> {fg} on {bg}{" "}
                        <span className="a-tnum">({min}:1)</span>
                      </th>
                      {(["light", "dark"] as const).map((theme) => {
                        const ratio = contrast(tokens[theme][fg], tokens[theme][bg]);
                        const pass = ratio >= min;
                        return (
                          <td key={theme} className="a-tnum">
                            {ratio.toFixed(1)}:1{" "}
                            <span className={pass ? "a-chip" : "a-chip a-chip--red"}>{pass ? "AA" : "fail"}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="a-soft a-small mt-4">
              Logo colours stay exact where they pass: blue {tokens.light.primary} (white text 6.9:1) is the light-theme primary and
              red {tokens.light.donate} (white text 5.5:1) is Donate in both themes. Logo green #01AD01 only reaches 3.0:1 with
              white, so green is a tint, deep text ({tokens.light.greenInk}) and the footer field ({tokens.light.footer}). The logo
              itself always sits on a cream plate ({tokens.dark.logoPlate}) in dark.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function VariantA() {
  return (
    <div id="a-top" className={`a-root ${display.variable} ${body.variable}`}>
      {/* Colour tokens rendered from a/tokens.ts (light, forced dark, system dark), scoped to [data-variant=a]. */}
      <style href="foa-proto-variant-a-tokens" precedence="default">
        {tokenCss}
      </style>
      <a href="#a-main" className="a-skip a-display">
        Skip to content
      </a>
      <Header />
      <main id="a-main">
        <Hero />
        <Competitions />
        <Gallery />
        <Impact />
        <Adoption />
        <DonateBand />
        <Partners />
      </main>
      <Footer />
      <Sampler />
    </div>
  );
}
