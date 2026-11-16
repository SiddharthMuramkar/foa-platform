// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant C footer (§7.1: contact, social links, legal links): a LIGHT brand island (logo 64px + blurb + contact +
// social) beside link groups set straight on the canvas. Same rule as the header and hero: the logo only ever sits
// inside a light island that carries its own content.
import { FoaLogo } from "../../foa-logo";
import { footer, site } from "../../fixtures";
import { LOGO_MIN_HEIGHT } from "../../logo";
import { Island } from "./island";

export function IslandFooter() {
  return (
    <footer className="mt-10 grid gap-3 md:mt-14 md:gap-4 lg:grid-cols-12">
      <Island as="section" tone="light" aria-label={`About ${site.name}`} className="rounded-3xl p-6 lg:col-span-5 lg:p-7">
        {/* Logo, footer size: 64px tall (~111px wide; LOGO_MIN_HEIGHT.footer, wordmark 8.3px). */}
        <FoaLogo height={LOGO_MIN_HEIGHT.footer} className="block h-16 w-auto" />
        <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-ink-muted">{footer.blurb}</p>
        <p className="mt-2 text-sm text-ink-muted">{footer.contact}</p>
        <ul aria-label="Social media" className="mt-5 flex flex-wrap gap-2">
          {footer.social.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="inline-flex h-10 items-center rounded-full px-3.5 text-sm font-bold text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2 motion-safe:transition-colors"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </Island>

      <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 px-2 py-4 sm:grid-cols-3 lg:col-span-7 lg:px-8 lg:py-8">
        {footer.groups.map((g) => (
          <div key={g.heading}>
            <h2 className="text-sm font-bold text-ink">{g.heading}</h2>
            <ul className="mt-3 space-y-1">
              {g.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="inline-flex min-h-8 items-center text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <p className="px-2 text-sm text-ink-muted lg:col-span-12">
        {footer.copyright} · {site.tagline}
      </p>
    </footer>
  );
}
