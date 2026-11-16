// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant A header (§7.1): dark bar, logo on a plate (56px logo on phones, 72px from lg: LOGO_MIN_HEIGHT, so the
// wordmark is 7.3/9.4px tall and readable), inline nav from lg, Donate always visible (solid red),
// mobile menu is a native <details> disclosure (no client JS, NFR-01).
// Bar height = plate (1.4 × logo) + ~9px each side: 96px phone / 120px desktop. variant-a.tsx sets html
// scroll-padding to match (WCAG 2.2 SC 2.4.11 Focus Not Obscured).
import { nav, site } from "../../fixtures";
import { LOGO_MIN_HEIGHT } from "../../logo";
import { LogoPlate, PLATE_RADIUS } from "./logo-plate";

// Display is set separately (inline-flex vs. hidden lg:inline-flex) so the two never fight in one class list.
const navLinkBase = "min-h-11 items-center rounded-full px-3 text-sm font-bold text-ink-muted hover:bg-surface hover:text-ink";
const navLink = `inline-flex ${navLinkBase}`;

export function HeaderA() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="mx-auto flex h-24 max-w-6xl items-center gap-3 px-4 lg:h-30 lg:gap-6">
        <a
          href="#top"
          aria-label={site.homeLabel}
          className={`inline-flex shrink-0 [--logo-h:56px] lg:[--logo-h:72px] ${PLATE_RADIUS}`}
        >
          <LogoPlate height={LOGO_MIN_HEIGHT.headerDesktop} decorative />
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.primary.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={navLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a href={nav.signIn.href} className={`hidden lg:inline-flex ${navLinkBase}`}>
            {nav.signIn.label}
          </a>
          {/* Donate: solid red fill only, both themes (white on #CB2322 = 5.5:1). */}
          <a
            href={nav.donate.href}
            className="inline-flex min-h-11 items-center rounded-full bg-donate px-5 text-sm font-bold text-on-donate"
          >
            {nav.donate.label}
          </a>

          <details className="group lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="flex w-4 flex-col gap-1">
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
              </span>
              Menu
            </summary>
            <div className="absolute inset-x-0 top-full border-b border-line bg-canvas px-4 pt-2 pb-6 shadow-[0_16px_32px_-16px_rgb(0_0_0/0.5)]">
              <nav aria-label="Primary">
                <ul className="grid gap-1">
                  {nav.primary.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="flex min-h-12 items-center rounded-xl px-3 text-base font-bold text-ink hover:bg-surface"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <a
                href={nav.signIn.href}
                className="mt-3 flex min-h-12 items-center justify-center rounded-full border border-line-strong text-base font-bold text-ink hover:bg-surface"
              >
                {nav.signIn.label}
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
