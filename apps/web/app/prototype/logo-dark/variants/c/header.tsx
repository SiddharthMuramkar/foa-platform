// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant C header: a floating, sticky light PILL that is the whole navigation island (logo + nav + Sign in + Donate),
// inset from the viewport edges so the dark canvas shows all round it. Not a full-bleed band (that is B) and not a
// plate hugging the logo (that is A): the pill exists because it carries the navigation, the logo just lives in it.
// Server component; the phone menu is a native <details> disclosure (no client JS, NFR-01).
// Fix stage:
//   - Canvas backing: the sticky wrapper paints the canvas from the viewport top to the pill's bottom edge, then fades
//     out over 12px, so scrolled content never shows in the inset gap or gets sliced against the pill edge.
//   - Pill separation over white islands: ring-line-strong (#7a766f, 4.3:1 on white) + a tighter, darker shadow.
//   - Logo 56px phone / 72px desktop (LOGO_MIN_HEIGHT: wordmark 7.3/9.4px, readable; was 40px = 5.2px).
//   - One logo above the fold: `.c-pill-logo` stays visibility:hidden while the hero logo is on screen and appears as
//     the hero logo slides under the pill (CSS scroll-driven animation in globals.css, no JS; instant under
//     prefers-reduced-motion; always visible where scroll-driven animations are unsupported).
import { FoaLogo } from "../../foa-logo";
import { nav, site } from "../../fixtures";
import { LOGO_MIN_HEIGHT } from "../../logo";

// No display utility here: each use sets its own (inline-flex / hidden lg:inline-flex / flex) so they never fight.
const navLink =
  "h-11 items-center rounded-full px-3 text-[0.9375rem] font-bold text-ink hover:bg-surface-2 motion-safe:transition-colors";

export function IslandHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 pb-3 [background:linear-gradient(to_bottom,var(--canvas)_calc(100%_-_0.75rem),transparent)] sm:px-4 lg:px-6 lg:pt-4">
      <a
        href="#c-main"
        className="sr-only rounded-full bg-surface px-4 py-2 font-bold text-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <div
        data-island="light"
        data-theme="light"
        className="mx-auto flex w-full max-w-6xl items-center gap-2 rounded-full bg-surface py-2 pr-2 pl-4 text-ink ring-1 ring-line-strong shadow-[0_1px_2px_rgb(0_0_0/0.16),0_6px_14px_-6px_rgb(0_0_0/0.55)] lg:w-fit lg:gap-4 lg:pl-5"
      >
        {/* Logo, header size: 56px tall phone (97px wide) / 72px desktop (124px). Decorative alt: the link carries the name. */}
        <a href="#c-top" aria-label={site.homeLabel} className="c-pill-logo shrink-0 rounded-lg">
          <FoaLogo height={LOGO_MIN_HEIGHT.headerDesktop} decorative className="block h-14 w-auto lg:h-18" />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center">
            {nav.primary.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={`${navLink} inline-flex`}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <a href={nav.signIn.href} className={`${navLink} hidden lg:inline-flex`}>
            {nav.signIn.label}
          </a>
          {/* Donate: solid red fill only, both themes (white on #CB2322 = 5.5:1; red vs white pill = 5.5:1). */}
          <a
            href={nav.donate.href}
            className="inline-flex h-11 items-center rounded-full bg-donate px-5 font-bold text-on-donate"
          >
            {nav.donate.label}
          </a>

          <details className="group relative lg:hidden">
            <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-full px-4 font-bold text-ink ring-1 ring-line-strong ring-inset select-none [&::-webkit-details-marker]:hidden">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h14M3 10h14M3 14h14" className="group-open:hidden" />
                <path d="M5 5l10 10M15 5L5 15" className="hidden group-open:block" />
              </svg>
              Menu
            </summary>
            {/* The open menu is itself a light island hanging off the pill. */}
            <div
              data-island="light"
              className="absolute top-full right-0 mt-3 w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl bg-surface p-2 ring-1 ring-line shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45)]"
            >
              <nav aria-label="Main">
                <ul>
                  {nav.primary.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className={`${navLink} flex w-full px-4`}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-line pt-1">
                    <a href={nav.signIn.href} className={`${navLink} flex w-full px-4`}>
                      {nav.signIn.label}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
