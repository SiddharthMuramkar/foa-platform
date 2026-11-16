// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Variant B "Tile cascade" (brief: ../BRIEF.md). Motion stack: research/lean-motion-stack (#4), CSS-first,
// no animation library. Details and motion map: ./b/tile-cascade.module.css.
//
// Structure (how B differs from A "Dock" and C "Paw lead"):
//  - Layout/hierarchy: logo-first centred stage. The full logo is the hero's centrepiece with the copy
//    centred beneath it. C also uses one centred column (its logo never moves; only the paw leads); A is
//    left-aligned because its dock rises straight up into the header slot, not as a separate layout choice.
//    So at rest B and C look alike: they differ between ≈ 20 px and ≈ 200 px of scroll.
//  - The logo is handled as its three tiles (+ wordmark), never as one picture: in the hero they part
//    sideways, scroll-linked, in a red → green → blue cascade over the first ≈ 35 % of the logo's height of
//    scroll, while it is still (almost) fully visible; the wordmark stays fully opaque. Then a compact
//    copy's tiles click together in the header (time-based, triggered once ≥ 35 % of the hero logo is
//    covered, DOCK_RATIO 0.65), so a whole logo is always on screen and the header logo is always whole.
//  - Paw: small wag about the disc centre on hover, home-link focus, and tap/click.
//
// Notes for the decision (#9):
//  - CSS limit: the "click" is a cubic-bezier overshoot, not a real spring; a multi-bounce spring or
//    velocity-aware snap would need Motion (escalation path in #4). The overshoot reads as a click; no gap.
//  - Scroll-linked drift means a reader who stops in the first ≈ 70 px (phone) sees the hero tiles slightly
//    apart. Kept small (±5 % sideways, ≤ 4 % up) and the wordmark never fades.
//  - Each logo instance inlines the SVG 5× (one copy per layer, ~2.5 KB raw each with the stand-in). For
//    production, emit the parts once as <symbol>s and <use> them.
//  - Without JS (scripting: none) the header logo sits assembled and static; the hero drift still runs
//    (pure CSS). Without scroll-driven animations (iOS 16–18, Firefox ≤ 158) the hero drift is a 220 ms
//    transition on the same IO toggle as the header.
//  - Logo artwork untouched: only position, opacity and (paw) rotation of whole groups; the dark-mode
//    plate is a surface behind it.
import { preload } from "react-dom";
import { FixtureHeaderBar, FixtureHeroCopy, FixtureSections } from "../fixture-page";
import { LOGO_ALT, LOGO_PNG_TRANSPARENT_SRC, LOGO_SVG_SRC } from "../logo";
import { SplitLogo } from "./b/split-logo";
import { TileCascadeRoot } from "./b/tile-cascade-root";
import styles from "./b/tile-cascade.module.css";

export const name = "Tile cascade";

/**
 * Every colour this variant renders (all come from globals.css tokens or the logo itself; B adds none).
 * Transparent is written as #00000000. Logo colours are fixed artwork, listed for contrast checks.
 */
export const tokens = {
  light: {
    surface: "#FAF8F4",
    surface2: "#FFFFFF",
    ink: "#1C1A17",
    inkMuted: "#57534E",
    line: "#E4DFD6",
    block: "#D9D4CB",
    primary: "#0055A5",
    onPrimary: "#FFFFFF",
    donate: "#E52421",
    onDonate: "#FFFFFF",
    logoPlate: "#00000000",
    logoTileRed: "#CB2322",
    logoTileGreen: "#01AD01",
    logoTileBlue: "#263FF1",
    logoLetters: "#FFFFFF",
    logoWordmark: "#000000",
  },
  dark: {
    surface: "#121110",
    surface2: "#1C1B19",
    ink: "#F3F1EC",
    inkMuted: "#B5AFA6",
    line: "#2E2C29",
    block: "#3A3733",
    primary: "#8AB8F2",
    onPrimary: "#0B1A2C",
    donate: "#E52421",
    onDonate: "#FFFFFF",
    logoPlate: "#FFFFFF",
    logoTileRed: "#CB2322",
    logoTileGreen: "#01AD01",
    logoTileBlue: "#263FF1",
    logoLetters: "#FFFFFF",
    logoWordmark: "#000000",
  },
} as const;

export default function VariantB() {
  // Stand-in SVG only: its letters/mark/wordmark are a raster, fetched early for LCP. The real SVG (#6)
  // is pure vector, so this does nothing once LOGO_SVG_SRC changes.
  if (LOGO_SVG_SRC.includes("standin")) preload(LOGO_PNG_TRANSPARENT_SRC, { as: "image", fetchPriority: "high" });

  return (
    <TileCascadeRoot>
      <FixtureHeaderBar
        logoSlot={
          <span className={styles.headerLogo} data-b-wag="">
            <span aria-hidden="true" className={styles.headerPlate} />
            <SplitLogo idPrefix="b-head" />
          </span>
        }
      />
      <main>
        <section className={`${styles.hero} w-full`}>
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-6 pb-12 text-center md:px-8 md:pt-12 md:pb-20">
            <div
              className={`${styles.heroLogo} w-[calc(100%-1.5rem)] max-w-[22rem] md:max-w-[34rem]`}
              role="img"
              aria-label={LOGO_ALT}
              data-b-hero-logo=""
              data-b-wag=""
            >
              <span aria-hidden="true" className={styles.heroPlate} />
              <SplitLogo idPrefix="b-hero" />
            </div>
            <FixtureHeroCopy className="mt-10 w-full max-w-2xl [&_.flex]:justify-center [&_p]:mx-auto" />
          </div>
        </section>
        <FixtureSections />
      </main>
    </TileCascadeRoot>
  );
}
