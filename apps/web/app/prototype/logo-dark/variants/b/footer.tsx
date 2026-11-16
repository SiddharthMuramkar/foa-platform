// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant B footer: dark link area (follows the page theme), then a LIGHT logo strip (data-theme="light",
// bg-logo-ground #fff) that bookends the page with the same white the masthead uses, so the logo sits on its
// native ground at 64px exactly as it does at 56/72px and 80/112px up top (§7.1 footer: contact, social, legal links).
import { FoaLogo } from "../../foa-logo";
import { footer, site } from "../../fixtures";
import { LOGO_HEIGHTS, container, textLink } from "./ui";

export function Footer({ shot }: { shot: boolean }) {
  return (
    <footer className="bg-surface-2 text-ink dark:bg-surface">
      <div className={`${container} grid gap-10 py-14 md:grid-cols-12 md:gap-12 md:py-16`}>
        <div className="md:col-span-4">
          <p className="max-w-[36ch] leading-relaxed text-ink-muted">{footer.blurb}</p>
          <p className="mt-4 text-sm text-ink-muted">{footer.contact}</p>
          <ul aria-label="Social" className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
            {footer.social.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={`inline-flex min-h-8 items-center ${textLink}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
          {footer.groups.map((group) => (
            <div key={group.heading}>
              <h2 className="text-sm font-bold">{group.heading}</h2>
              <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className={`inline-flex min-h-8 items-center hover:text-ink ${textLink}`}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Light logo strip: the bottom bookend of the light masthead. */}
      <div data-theme="light" className="border-t border-line bg-logo-ground text-ink">
        <div className={`${container} flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between`}>
          <a href="#b-top" aria-label={site.homeLabel} className="block w-fit rounded-sm">
            <FoaLogo height={LOGO_HEIGHTS.footer} decorative className="h-16 w-auto" />
          </a>
          <p className="text-sm text-ink-muted">
            {site.tagline} · {footer.copyright}
          </p>
        </div>
        {/* Keeps the strip's content clear of the floating prototype switcher (absent when ?shot=1). */}
        {shot ? null : <div aria-hidden="true" className="h-20" />}
      </div>
    </footer>
  );
}
