// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant B header: a LIGHT band in both themes (data-theme="light" re-scopes every token inside it), so the
// unchanged logo always sits on its native white (bg-logo-ground #fff). Server components only: no client JS.
//
// Two pieces, one band:
//   1. <CompactBar>  — FIXED to the viewport top, 72px phone / 88px md, logo 56/72px, stacked UNDER the masthead.
//   2. <Masthead>    — editorial nameplate: utility row, logo large (80px mobile / 112px desktop), full nav row.
//                      In normal flow above the bar (higher z-index). As it scrolls away its bottom edge
//                      uncovers the bar: a scroll-linked reveal with zero JS and no autonomous motion, so it
//                      needs no reduced-motion fallback and causes no layout shift (CLS 0).
//   Fixed, not sticky (fix stage): focusing a sticky element makes the browser scroll to its in-flow position (the
//   page top, under the masthead), which hid the focused bar link again; a fixed element is never scrolled to.
// Fix stage (review: visible controls hidden from AT): the bar is a real, exposed "Quick links" nav (no aria-hidden,
// no tabIndex=-1). While the masthead covers it, a CSS scroll-driven animation keeps it visibility:hidden (globals.css
// `.b-bar`), which also takes it out of the tab order and the a11y tree, so keyboard users never land on a covered
// control (WCAG 2.2 SC 2.4.11). It turns visible the moment the masthead's bottom edge uncovers it. Browsers without
// scroll-driven animations keep it hidden (no sticky bar there; the masthead still carries every control).
import { FoaLogo } from "../../foa-logo";
import { nav, site } from "../../fixtures";
import { BAR_HEIGHT_CLASS, LOGO_HEIGHTS, container, donateButton, textLink } from "./ui";

export const MASTHEAD_NAV_ID = "b-nav";

export function CompactBar() {
  return (
    <nav
      aria-label="Quick links"
      data-theme="light"
      className={`b-bar fixed inset-x-0 top-0 z-30 ${BAR_HEIGHT_CLASS} border-b border-line bg-logo-ground text-ink`}
    >
      <div className={`${container} flex h-full items-center gap-6`}>
        <a href="#b-top" aria-label={site.homeLabel} className="shrink-0 rounded-sm">
          <FoaLogo height={LOGO_HEIGHTS.bar} decorative className="h-14 w-auto md:h-18" />
        </a>
        <ul className="hidden items-center gap-6 text-sm lg:flex">
          {nav.primary.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={textLink}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-4">
          {/* Below lg the bar has no room for the nav: "Menu" jumps back up to the masthead's full nav row. */}
          <a href={`#${MASTHEAD_NAV_ID}`} className={`text-sm font-bold lg:hidden ${textLink}`}>
            Menu
          </a>
          <a href={nav.signIn.href} className={`hidden text-sm font-bold lg:inline ${textLink}`}>
            {nav.signIn.label}
          </a>
          <a href={nav.donate.href} className={donateButton}>
            {nav.donate.label}
          </a>
        </div>
      </div>
    </nav>
  );
}

export function Masthead() {
  return (
    <header
      data-theme="light"
      className={`b-masthead relative z-40 border-b border-line bg-logo-ground text-ink`}
    >
      {/* Utility row */}
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <p className="hidden text-sm text-ink-muted md:block">{site.tagline}</p>
        <a href={nav.signIn.href} className={`text-sm font-bold md:hidden ${textLink}`}>
          {nav.signIn.label}
        </a>
        <div className="flex items-center gap-5">
          <a href={nav.signIn.href} className={`hidden text-sm font-bold md:inline ${textLink}`}>
            {nav.signIn.label}
          </a>
          <a href={nav.donate.href} className={donateButton}>
            {nav.donate.label}
          </a>
        </div>
      </div>

      {/* Nameplate: the one place the logo appears large. The dark hero below never repeats it. */}
      <div className={`${container} flex justify-center pt-2 pb-7 md:pb-10`}>
        <a href="#b-top" aria-label={site.homeLabel} className="block rounded-sm">
          <FoaLogo
            height={LOGO_HEIGHTS.nameplateDesktop}
            preload
            decorative
            className="h-20 w-auto md:h-28"
          />
        </a>
      </div>

      {/* Full nav row: always visible, no hamburger. Wraps (never scrolls sideways) below ~360px. */}
      <nav id={MASTHEAD_NAV_ID} aria-label="Main" className="border-t border-line">
        <ul className={`${container} flex flex-wrap items-center justify-center gap-x-4 text-sm sm:gap-x-6 sm:text-[0.9375rem] md:gap-x-10 md:text-base`}>
          {nav.primary.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={`inline-flex min-h-12 items-center ${textLink}`}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
