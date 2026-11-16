// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant A footer (§7.1: contact, social, legal, newsletter): surface-2 ground (one step lighter than the canvas in
// dark, one step darker in light) so the plate reads as the same badge as the header in BOTH themes.
// Logo 64px (LOGO_MIN_HEIGHT.footer: wordmark 8.3px; was 32px = 4.2px, unreadable).
import { footer, site } from "../../fixtures";
import { LOGO_MIN_HEIGHT } from "../../logo";
import { LogoPlate, PLATE_RADIUS } from "./logo-plate";

const footLink = "inline-flex min-h-8 items-center text-sm text-ink-muted hover:text-ink hover:underline";

export function FooterA({ shot }: { shot: boolean }) {
  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-12 lg:gap-8 lg:py-16">
        <div className="lg:col-span-4">
          <a href="#top" aria-label={site.homeLabel} className={`inline-flex [--logo-h:64px] ${PLATE_RADIUS}`}>
            <LogoPlate height={LOGO_MIN_HEIGHT.footer} decorative />
          </a>
          <p className="mt-5 max-w-sm text-sm text-ink-muted">{footer.blurb}</p>
          <p className="mt-2 text-sm text-ink-muted">{footer.contact}</p>

          <form className="mt-6 max-w-sm" aria-labelledby="a-newsletter-label">
            <label id="a-newsletter-label" htmlFor="a-newsletter-email" className="block text-sm font-bold text-ink">
              Newsletter
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="a-newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                aria-describedby="a-newsletter-hint"
                className="min-h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm text-ink"
              />
              {/* Prototype: not wired (type=button keeps ?variant=&theme= in the URL). */}
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-full bg-accent px-5 text-sm font-bold text-on-accent"
              >
                Subscribe
              </button>
            </div>
            <p id="a-newsletter-hint" className="mt-2 text-xs text-ink-muted">
              Your email address. One email a month.
            </p>
          </form>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          {footer.groups.map((group) => (
            <div key={group.heading}>
              <h2 className="text-sm font-bold text-ink">{group.heading}</h2>
              <ul className="mt-3 grid gap-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className={footLink}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-line">
        <div
          className={`mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between ${shot ? "pb-6" : "pb-24"}`}
        >
          <ul aria-label="Social links" className="flex flex-wrap gap-x-5 gap-y-1">
            {footer.social.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={footLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-muted">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
