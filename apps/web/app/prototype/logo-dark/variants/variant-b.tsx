// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant B — "Light masthead". Structure: a light top band over a dark body, bookended by a light footer strip.
//   • Masthead (light in BOTH themes): utility row (Sign in, Donate) → logo LARGE as a centred nameplate
//     (80px mobile / 112px desktop) → full nav row, always visible, no hamburger.
//   • Compact bar (light, fixed, logo 56/72px): hidden under the masthead at the top, uncovered by scrolling.
//     Exposed to AT as a "Quick links" nav only while uncovered (CSS scroll-driven visibility, globals.css).
//   • Hero (dark): headline-led; the logo is never repeated on a dark surface.
//   • Competitions (dark): editorial ruled index, not a card grid.
//   • Footer (dark) + light logo strip (logo 64px).
// The logo only ever sits on its native white (bg-logo-ground). Never recoloured, inverted, filtered or blended.
// Server components only (NFR-01: adds no client JS). Mobile-first (390×844), then 1440×900.
import type { VariantProps } from "../fixtures";
import { Competitions } from "./b/competitions";
import { Footer } from "./b/footer";
import { Hero } from "./b/hero";
import { CompactBar, Masthead } from "./b/masthead";

export const name = "Light masthead";

/**
 * Every colour this variant renders, per page theme (hex), for lifting into packages/brand and contrast checks.
 * "masthead*" and "footer-strip*" are the light band and strip: data-theme="light" keeps them light in dark mode.
 * Measured pairs (WCAG 2.2 AA): masthead ink/white 17.4, ink-muted/white 7.7, focus #263FF1/white 6.9, Donate
 * white/red 5.5 and red/white 5.5; dark hero ink/canvas 16.4, ink-muted/canvas 8.5, success/canvas 10.3,
 * accent/canvas 8.4, on-accent/accent 8.4, Donate red/canvas 3.3 (UI ≥ 3); dark footer ink-muted/surface 7.7;
 * light footer ink-muted/surface-2 6.6, ink/surface-2 14.8; light success/canvas 5.2, accent/canvas 6.5.
 */
export const tokens = {
  light: {
    canvas: "#faf8f4",
    surface: "#ffffff",
    "surface-2": "#f1eee8",
    ink: "#1b1b1f",
    "ink-muted": "#55534e",
    line: "#e2ded6",
    accent: "#263ff1",
    "on-accent": "#ffffff",
    success: "#017a01",
    donate: "#cb2322",
    "on-donate": "#ffffff",
    focus: "#263ff1",
    "logo-ground": "#ffffff",
    masthead: "#ffffff",
    "masthead-ink": "#1b1b1f",
    "masthead-ink-muted": "#55534e",
    "masthead-line": "#e2ded6",
    "masthead-focus": "#263ff1",
    "hero-seam-top": "#ffffff",
    footer: "#f1eee8",
    "footer-strip": "#ffffff",
    "footer-strip-ink": "#1b1b1f",
    "footer-strip-ink-muted": "#55534e",
  },
  dark: {
    canvas: "#121417",
    surface: "#1b1e23",
    "surface-2": "#252930",
    ink: "#f3f1ec",
    "ink-muted": "#b4b0a8",
    line: "#30343b",
    accent: "#9da9ff",
    "on-accent": "#121417",
    success: "#6fd86f",
    donate: "#cb2322",
    "on-donate": "#ffffff",
    focus: "#9da9ff",
    "logo-ground": "#ffffff",
    masthead: "#ffffff",
    "masthead-ink": "#1b1b1f",
    "masthead-ink-muted": "#55534e",
    "masthead-line": "#e2ded6",
    "masthead-focus": "#263ff1",
    "hero-seam-top": "#1b1e23",
    footer: "#1b1e23",
    "footer-strip": "#ffffff",
    "footer-strip-ink": "#1b1b1f",
    "footer-strip-ink-muted": "#55534e",
  },
} as const satisfies { light: Record<string, string>; dark: Record<string, string> };

export default function VariantB({ shot }: VariantProps) {
  return (
    // scroll-padding keeps focused/anchored targets clear of the 72/88px fixed bar (WCAG 2.2 SC 2.4.11).
    // b-scope + --b-bar-h feed the bar's scroll-driven reveal (globals.css); --b-bar-h must equal BAR_HEIGHT_CLASS.
    <div
      id="b-top"
      className="b-scope [--b-bar-h:4.5rem] md:[--b-bar-h:5.5rem] [html:has(&)]:scroll-pt-24 md:[html:has(&)]:scroll-pt-28"
    >
      <a
        href="#b-main"
        className="sr-only rounded-lg bg-accent px-4 py-3 font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>
      <CompactBar />
      <Masthead />
      <main id="b-main" tabIndex={-1} className="outline-none">
        <Hero />
        <Competitions />
      </main>
      <Footer shot={shot} />
    </div>
  );
}
