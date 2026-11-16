// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant C "Light islands" (SPEC §4.8 dark mode; FR-PUB-01 home; §7.1 header/footer; NFR-A11Y; NFR-01; SG-01).
//
// Structure: the page is a bento of floating islands with the canvas as the grout between them.
//   - Header: a sticky, inset light PILL = the navigation island (logo + nav + Sign in + Donate).
//   - Hero:   a large light card whose masthead is the big logo, beside a page-tone photo island.
//   - Cards:  Competitions alternate light / page / light.
//   - Footer: a light brand island (small logo + blurb + contact + social) beside links on the canvas.
// Rule: the logo ONLY ever renders inside a light island (data-island="light", which re-scopes to light tokens), and
// every such island carries content of its own. The artwork is untouched: no filter, blend, recolour or glow.
// Server components only: zero client JS added (the phone menu is a native <details>).
import type { VariantProps } from "../fixtures";
import { IslandCompetitions } from "./c/competitions";
import { IslandFooter } from "./c/footer";
import { IslandHeader } from "./c/header";
import { IslandHero } from "./c/hero";

export const name = "Light islands";

/**
 * Every colour this variant uses, per page theme (liftable into packages/brand).
 * "island*" = inside a light island: identical in both page themes (the subtree is re-scoped to light tokens).
 * Contrast (WCAG 2.2, measured):
 *   light page: ink/canvas 16.2, inkMuted/canvas 7.2, accent/canvas 6.5; page card (surface2): ink 14.8, inkMuted 6.6,
 *               accent 5.9, success 4.8, lineStrong 3.9
 *   dark page:  ink/canvas 16.4, inkMuted/canvas 8.5, accent/canvas 8.4; page card (surface2): ink 12.9, inkMuted 6.8,
 *               accent 6.6, success 8.2, lineStrong 3.4; placeholder surface: inkMuted 7.7
 *   island:     ink 17.2, inkMuted 7.7, accent 6.9, success 5.6, onAccent/accent 6.9, lineStrong 4.5, focus 6.9;
 *               island vs dark canvas 18.5
 *   donate:     onDonate/donate 5.5 (both); donate vs white pill 5.5
 */
export const tokens = {
  light: {
    canvas: "#faf8f4",
    surface: "#ffffff",
    surface2: "#f1eee8",
    ink: "#1b1b1f",
    inkMuted: "#55534e",
    line: "#e2ded6",
    lineStrong: "#7a766f",
    accent: "#263ff1",
    onAccent: "#ffffff",
    success: "#017a01",
    focus: "#263ff1",
    donate: "#cb2322",
    onDonate: "#ffffff",
    island: "#ffffff",
    islandInk: "#1b1b1f",
    islandInkMuted: "#55534e",
    islandLine: "#e2ded6",
    islandLineStrong: "#7a766f",
    islandHover: "#f1eee8",
    islandAccent: "#263ff1",
    islandOnAccent: "#ffffff",
    islandSuccess: "#017a01",
    islandFocus: "#263ff1",
    /** Island drop shadow colour (used at 6–45% alpha). */
    shadow: "#000000",
  },
  dark: {
    canvas: "#121417",
    surface: "#1b1e23",
    surface2: "#252930",
    ink: "#f3f1ec",
    inkMuted: "#b4b0a8",
    line: "#30343b",
    lineStrong: "#757a84",
    accent: "#9da9ff",
    onAccent: "#121417",
    success: "#6fd86f",
    focus: "#9da9ff",
    donate: "#cb2322",
    onDonate: "#ffffff",
    island: "#ffffff",
    islandInk: "#1b1b1f",
    islandInkMuted: "#55534e",
    islandLine: "#e2ded6",
    islandLineStrong: "#7a766f",
    islandHover: "#f1eee8",
    islandAccent: "#263ff1",
    islandOnAccent: "#ffffff",
    islandSuccess: "#017a01",
    islandFocus: "#263ff1",
    shadow: "#000000",
  },
} as const;

export default function VariantC({ shot }: VariantProps) {
  return (
    // Bottom padding clears the fixed prototype switcher unless ?shot=1.
    // scroll-padding = sticky header (96px phone / 116px lg incl. the canvas fade) + margin: a focused control is never
    // scrolled under the opaque pill (WCAG 2.2 SC 2.4.11, review blocker); it also covers anchor jumps.
    // c-scope + --c-header-h feed the pill-logo reveal timeline (globals.css): pill bottom edge = 84px / 104px.
    <div
      id="c-top"
      className={`c-scope [--c-header-h:5.25rem] lg:[--c-header-h:6.5rem] [html:has(&)]:scroll-pt-28 lg:[html:has(&)]:scroll-pt-32 ${shot ? "pb-6" : "pb-28"}`}
    >
      <IslandHeader />
      {/* No top padding on phones: the header's 12px canvas fade already spaces the pill from the hero. */}
      <div className="mx-auto max-w-6xl px-3 sm:px-4 md:pt-1 lg:px-6">
        <main id="c-main" tabIndex={-1} className="outline-none">
          <IslandHero />
          <IslandCompetitions />
        </main>
        <IslandFooter />
      </div>
    </div>
  );
}
