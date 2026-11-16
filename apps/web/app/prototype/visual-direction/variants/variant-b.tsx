// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant B "Editorial trust" (trust first). SPEC §4.8 "warm, editorial, Artwork-first":
// - off-white paper, generous whitespace, asymmetric 4/8 editorial grid with numbered sections opened by ink rules
// - hero = the homeFeatured Artwork hung like a museum piece (mat, gallery light, wall label with SG-01 fields)
// - impact numbers second on the page, with a transparency breakdown
// - logo colours only as thin rules, 8px tile markers and labels; ink is the primary affordance; solid red = Donate
// - Plus Jakarta Sans, 400 + 600 only (NFR-01), tight type scale; 6px radius; no illustrations
// Tokens: ./b/tokens.ts (exported below). Component styles: ./b/b.css. Only client JS: the sampler's tabs.
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import { home } from "../fixtures";
import { logo } from "../logo";
import "./b/b.css";
import { ArtFrame, Arrow, Badge, btn, cx, keep, Kicker, MenuIcon, ReportConcern } from "./b/parts";
import { Sampler } from "./b/sampler";
import { Adoption, Auction, Competitions, Donate, Footer, Gallery, Impact, Partners } from "./b/sections";
import { tokenCss, tokens as bTokens } from "./b/tokens";

export const name = "Editorial trust";

/** Every colour this variant uses, per theme (lift into packages/brand; contrast notes in ./b/tokens.ts). */
export const tokens = bTokens;

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-b-sans",
});

/* ------------------------------------------------------------------ header */

function Header() {
  const { nav } = home;
  // No display utility in the shared part: `hidden` + `inline-flex` in one class list would race on CSS order.
  const navLinkLook =
    "b-ease min-h-11 items-center text-[15px] text-(--b-ink) decoration-(--b-tile-blue) decoration-2 underline-offset-[8px] hover:underline";
  return (
    <header className="border-b border-(--b-line)">
      {/* The logo's three tiles, reduced to a 3px rule with tile-like gaps. */}
      <div aria-hidden="true" className="flex h-[3px] gap-[3px]">
        <span className="flex-1 bg-(--b-tile-red)" />
        <span className="flex-1 bg-(--b-tile-green)" />
        <span className="flex-1 bg-(--b-tile-blue)" />
      </div>
      <div className="mx-auto flex max-w-[76rem] items-center gap-6 px-5 py-3 lg:box-content lg:px-10">
        <a href="#top" className="shrink-0 rounded-[6px] bg-(--b-logo-plate) p-1.5">
          <Image
            src={logo.svg}
            width={logo.width}
            height={logo.height}
            alt={logo.alt}
            className="h-11 w-auto lg:h-14"
          />
        </a>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {nav.items.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={cx(navLinkLook, "inline-flex")}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <a href={nav.signIn.href} className={cx(navLinkLook, "hidden px-1 sm:inline-flex")}>
            {nav.signIn.label}
          </a>
          <a href={nav.donate.href} className={btn("donate")}>
            {nav.donate.label}
          </a>
          <details className="b-menu relative lg:hidden">
            <summary className={cx(btn("secondary", "none"), "min-h-11 cursor-pointer px-3 text-[15px]")}>
              <MenuIcon />
              Menu
            </summary>
            <nav
              aria-label="Primary"
              className="absolute top-[calc(100%+8px)] right-0 z-20 w-64 rounded-[6px] border border-(--b-line) bg-(--b-surface) p-2 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.4)]"
            >
              <ul>
                {[...nav.items, nav.signIn].map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="b-ease flex min-h-11 items-center rounded-[4px] px-3 text-[16px] text-(--b-ink) hover:bg-(--b-paper-2)"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ hero: the featured Artwork as a museum piece */

function Hero() {
  const { hero, gallery, competitions } = home;
  const art = gallery.items[0]; // homeFeatured (§5.8)
  return (
    <section
      aria-labelledby="b-hero-h"
      className="lg:grid lg:min-h-[580px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="flex flex-col justify-center px-5 pt-10 pb-12 lg:py-12 lg:pr-12 lg:pl-[max(2.5rem,calc((100vw-76rem)/2))]">
        <p className="flex items-center gap-3 text-[12px] leading-4 font-semibold tracking-[0.1em] text-(--b-ink-2) uppercase">
          <span aria-hidden="true" className="h-0.5 w-6 bg-(--b-tile-blue)" />
          {hero.eyebrow}
        </p>
        <h1
          id="b-hero-h"
          className="mt-5 text-[40px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-[52px] lg:text-[50px] xl:text-[66px]"
        >
          {hero.headline}
        </h1>
        <p className="mt-5 max-w-[44ch] text-[17px] leading-[1.6] text-(--b-ink-2) lg:text-[18px]">{hero.subline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={hero.primaryCta.href} className={cx(btn("primary", "none"), "min-h-12 px-5 text-[15px] sm:px-6 sm:text-[16px] lg:px-5 lg:text-[15px] xl:px-6 xl:text-[16px]")}>
            {hero.primaryCta.label}
            <Arrow />
          </a>
          <a href={hero.secondaryCta.href} className={cx(btn("donate", "none"), "min-h-12 px-6 text-[15px] sm:px-8 sm:text-[16px] lg:px-6 lg:text-[15px] xl:px-8 xl:text-[16px]")}>
            {hero.secondaryCta.label}
          </a>
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-2 border-t border-(--b-line) pt-4 text-[14px] text-(--b-ink-2)">
          <span className="b-num font-semibold text-(--b-ink)">{competitions.items.length} Competitions open</span>
          <span aria-hidden="true">·</span>
          <span>{competitions.items[0].closesLabel.replace("Closes", "First closes")}</span>
        </p>
      </div>

      <div className="bg-(--b-wall) px-5 py-12 sm:py-14 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-12 xl:px-12">
        <figure className="mx-auto flex max-w-[44rem] flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center lg:gap-8">
          <ArtFrame
            image={art.image}
            alt={art.alt}
            preload
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 300px, 76vw"
            mat="p-4 lg:p-6"
            className="b-hang w-[min(76vw,340px)] shrink-0 sm:w-[300px] lg:w-[min(24vw,380px)]"
          />
          <figcaption className="b-label-in w-full max-w-[20rem] rounded-[4px] bg-(--b-surface) p-4 shadow-[0_0_0_1px_var(--b-line)] sm:w-[15.5rem] lg:w-[13.5rem] xl:w-[15.5rem]">
            <Kicker tone="blue">Featured Artwork</Kicker>
            <p className="mt-3 text-[18px] leading-[1.25] font-semibold tracking-[-0.01em]">
              <a href={art.href} className="underline-offset-4 hover:underline">
                {art.title}
              </a>
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.45]">{art.displayName}</p>
            <p className="text-[14px] leading-[1.45] text-(--b-ink-2)">{keep(art.categoryLabel)}</p>
            <p className="mt-2 text-[14px] leading-[1.45] text-(--b-ink-2)">
              {art.school}
              <br />
              {art.city}, {art.state}, {art.country}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="blue">{art.award}</Badge>
              <span className="text-[13px] text-(--b-ink-2)">
                {art.artForm} · {art.competition}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 border-t border-(--b-line) pt-2">
              <span className="text-[12px] text-(--b-ink-2)">Shown with consent</span>
              <ReportConcern href={art.reportConcernHref} label={art.title} />
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function VariantB() {
  return (
    <div id="top" className={cx(jakarta.variable, "b-root min-h-dvh bg-(--b-paper) text-(--b-ink) antialiased")}>
      <style dangerouslySetInnerHTML={{ __html: tokenCss }} />
      <a
        href="#b-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[6px] focus:bg-(--b-surface) focus:px-4 focus:py-3 focus:text-[15px] focus:font-semibold"
      >
        Skip to content
      </a>
      <Header />
      <main id="b-main">
        <Hero />
        <Impact />
        <Competitions />
        <Gallery />
        <Auction />
        <Adoption />
        <Donate />
        <Partners />
      </main>
      <Footer />
      <Sampler />
    </div>
  );
}
