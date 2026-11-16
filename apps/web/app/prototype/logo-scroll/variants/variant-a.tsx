// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Variant A "Dock" (brief: ../BRIEF.md).
//
// Layout / hierarchy: the hero logo is the header's logo slot, enlarged. It sits flush-left on the
// header's own content edge, directly under the (empty, reserved) slot, with the hero copy stacked
// beneath it. Not centred (C) and not a two-column hero: the page reads "this is where the logo lives".
// Scroll: ONE element rises and shrinks straight up into the slot, scroll-linked over the first
// ≈ 28vh (phone) / ≈ 48vh (desktop). Its bottom edge moves 1:1 with the page, so content never slides
// under it. Transform only (translateY + scale), position: sticky, compositor-driven CSS
// scroll-driven animation; no JS on the main path.
// Primary affordance: the logo itself becomes the home link's face. Hovering or focusing the header
// home link nudges the docked paw; hovering/tapping the paw in the hero nudges it there.
// Fallback (no scroll-driven animations: iOS 16–18, Firefox ≤ 158): the hero logo is NOT sticky; it
// scrolls away with the page like any content, and dock-fallback.tsx (< 1 KB, IntersectionObserver)
// rises + fades the compact header logo in (200 ms) once ≈ 80 % of the hero logo is under the header,
// the same pattern as C. Discrete, not scroll-linked; no blank band (review fix: the sticky logo used
// to leave its 200 px box empty after 8 px of scroll).
// Reduced motion (every browser): no translate, scale or tilt. Static hero logo; the compact header
// logo fades in with a timed 200 ms opacity transition switched by the same observer, so it is never
// left half-faded mid-scroll (review fix: it used to be scrubbed by scroll position).
// No JS: hero logo visible; where scroll-driven animations are missing, or under reduced motion, a
// <noscript> rule shows the compact header logo statically.
//
// CSS limits found (no library added): the paw "nudge" is a bezier with overshoot, not a spring;
// the fallback cannot be scroll-linked without a scroll handler (Motion `useScroll` would be the
// escalation if iOS 16–18 must get the identical dock).
//
// Real SVG swap (#6): nothing here changes. Every logo copy (hero, paw layer, header) is the inlined
// LOGO_SVG_SRC; the PNG preload below is guarded like B and C, so it stops once the stand-in is gone.
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import { FixtureHeaderBar, FixtureHeroCopy, FixtureSections } from "../fixture-page";
import { InlineLogo } from "../inline-logo";
import { LOGO_ALT, LOGO_ASPECT, LOGO_PART_BOXES, LOGO_PNG_TRANSPARENT_SRC, LOGO_SVG_SRC } from "../logo";
import { DockFallback } from "./a/dock-fallback";
import styles from "./a/dock.module.css";

export const name = "Dock";

/** Every colour this variant renders (globals.css tokens; the logo's own colours are artwork, not UI). */
export const tokens = {
  light: {
    surface: "#FAF8F4",
    "surface-2": "#FFFFFF",
    ink: "#1C1A17",
    "ink-muted": "#57534E",
    line: "#E4DFD6",
    block: "#D9D4CB",
    primary: "#0055A5",
    "on-primary": "#FFFFFF",
    donate: "#E52421",
    "on-donate": "#FFFFFF",
    "logo-plate": "#FFFFFF00",
  },
  dark: {
    surface: "#121110",
    "surface-2": "#1C1B19",
    ink: "#F3F1EC",
    "ink-muted": "#B5AFA6",
    line: "#2E2C29",
    block: "#3A3733",
    primary: "#8AB8F2",
    "on-primary": "#0B1A2C",
    donate: "#E52421",
    "on-donate": "#FFFFFF",
    "logo-plate": "#FFFFFF",
  },
} as const satisfies { light: Record<string, string>; dark: Record<string, string> };

const MARK = LOGO_PART_BOXES.mark;

/** Geometry inputs for dock.module.css, from logo.ts (single source). */
const ROOT_STYLE = {
  "--logo-aspect": LOGO_ASPECT.toFixed(4), // same rounding as HEADER_LOGO_SLOT_STYLE
  "--mark-cx": (MARK.x + MARK.w / 2).toFixed(4),
  "--mark-cy": (MARK.y + MARK.h / 2).toFixed(4),
  "--mark-w": MARK.w.toFixed(4),
  "--mark-h": MARK.h.toFixed(4),
} as CSSProperties;

const NOSCRIPT_CSS = `<style>@supports not (animation-timeline: scroll()){.${styles.headerLogo}{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.${styles.headerLogo}{opacity:1}}</style>`;

export default function VariantA() {
  // Stand-in SVG only: it draws from this PNG; fetch it before the SVG is parsed (hero = LCP candidate).
  // The real SVG (#6) is pure vector, so this does nothing once LOGO_SVG_SRC changes.
  if (LOGO_SVG_SRC.includes("standin")) preload(LOGO_PNG_TRANSPARENT_SRC, { as: "image", fetchPriority: "high" });

  return (
    <div className={styles.root} style={ROOT_STYLE} data-dock-root="">
      <DockFallback />
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_CSS }} />
      <FixtureHeaderBar
        logoSlot={
          // Compact header logo (fallback, reduced motion, no JS). Decorative: the home link carries the
          // name. Same inlined SVG as the hero (no extra request), with its own paw layer so the header
          // nudge works here too.
          <span className={styles.headerLogo} aria-hidden="true">
            <InlineLogo idPrefix="a-head" className={styles.logoArt} />
            <InlineLogo idPrefix="a-head-paw" className={styles.paw} />
          </span>
        }
      />
      <main className={styles.main}>
        <span className={styles.pawAnchor} aria-hidden="true" />
        <div className={styles.fly} data-dock-fly="">
          <InlineLogo idPrefix="a-hero" label={LOGO_ALT} className={styles.logoArt} />
          {/* Decorative copy drawing only the paw-and-hands mark, so it can tilt on its own layer. */}
          <InlineLogo idPrefix="a-paw" className={styles.paw} />
        </div>
        <div className={`mx-auto w-full max-w-6xl px-4 md:px-8 ${styles.heroCopy}`}>
          <FixtureHeroCopy />
          <p className={styles.hint}>Prototype A: scroll and the logo docks into the header. Hover or tap the paw.</p>
        </div>
        <FixtureSections />
      </main>
    </div>
  );
}
