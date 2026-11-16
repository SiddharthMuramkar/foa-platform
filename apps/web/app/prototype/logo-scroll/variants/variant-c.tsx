// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Variant C "Paw lead" (brief: ../BRIEF.md). The most conservative option.
//
// Layout / hierarchy: the logo IS the masthead. One centred column: a large logo plate, then the
// hero copy centred beneath it. The header starts with an empty (reserved) logo slot.
// Scroll: the hero logo never moves; it scrolls away with the page. When less than 20 % of it is
// still visible below the header, a compact full logo rises 22 % and fades into the header slot
// (IntersectionObserver -> data attribute -> 160–240 ms CSS transition). Discrete, not scroll-linked:
// the header logo is never left half-faded, and every browser (incl. iOS 16–18) gets the same thing.
// Primary affordance: the paw-and-hands mark. It waves once on load (teaching that it is alive),
// bounces on hover / tap, nods once when the compact logo first lands, and bounces when the header
// home link gets keyboard focus. The paw only ever moves INSIDE the O: a static porthole clip keeps
// the ring and tile untouched. Paw layers are HTML wrappers, so motion is compositor-only.
// Reduced motion: no slide, wave, bounce or nod. Header logo = 150 ms opacity fade only.
// No JS: hero logo visible, header shows the compact logo statically (@media (scripting: none)).
// Client JS: one island (paw-lead-root.tsx), < 1 KB gzip. No animation library (research/lean-motion-stack).
//
// CSS limits found (no library added): the bounce is a hand-tuned keyframe curve, not a spring; there
// is no velocity-aware "flick" on tap. Motion (`m` + LazyMotion) would be the escalation if wanted.
import { preload } from "react-dom";
import { FixtureHeaderBar, FixtureHeroCopy, FixtureSections } from "../fixture-page";
import { LOGO_ALT, LOGO_PNG_TRANSPARENT_SRC, LOGO_SVG_SRC } from "../logo";
import { PawLeadRoot } from "./c/paw-lead-root";
import { PawLogo } from "./c/paw-logo";
import styles from "./c/paw-lead.module.css";

export const name = "Paw lead";

/** Every colour this variant renders (shared tokens from app/globals.css; no variant-specific colours). */
export const tokens = {
  light: {
    surface: "#faf8f4",
    surface2: "#ffffff",
    ink: "#1c1a17",
    inkMuted: "#57534e",
    line: "#e4dfd6",
    block: "#d9d4cb",
    primary: "#0055a5", // primary CTA fill + focus ring
    onPrimary: "#ffffff",
    donate: "#e52421", // solid red fill: Donate only
    onDonate: "#ffffff",
    logoPlate: "#faf8f4", // transparent in light: the logo sits on surface
  },
  dark: {
    surface: "#121110",
    surface2: "#1c1b19",
    ink: "#f3f1ec",
    inkMuted: "#b5afa6",
    line: "#2e2c29",
    block: "#3a3733",
    primary: "#8ab8f2",
    onPrimary: "#0b1a2c",
    donate: "#e52421",
    onDonate: "#ffffff",
    logoPlate: "#ffffff", // the black wordmark needs a light plate (final dark treatment: #14)
  },
} as const;

function HeaderLogo() {
  return (
    <span className={`${styles.compact} absolute inset-0 flex items-center rounded-md bg-logo-plate`}>
      <PawLogo id="c-hdr" nod className="w-full" />
    </span>
  );
}

export default function VariantC() {
  // Stand-in only: its groups draw from this PNG. Drop once the real vector SVG (#6) is in.
  if (LOGO_SVG_SRC.includes("standin")) preload(LOGO_PNG_TRANSPARENT_SRC, { as: "image", fetchPriority: "high" });

  return (
    <PawLeadRoot className={styles.root}>
      <FixtureHeaderBar logoSlot={<HeaderLogo />} />
      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pt-8 pb-12 md:px-8 md:pt-14 md:pb-20">
          <div data-c-hero-logo="" className="mx-auto w-full max-w-[34rem] rounded-3xl bg-logo-plate p-3 md:p-5">
            <PawLogo id="c-hero" label={LOGO_ALT} hit wave />
          </div>
          <FixtureHeroCopy className="mx-auto mt-10 max-w-2xl text-center [&>div]:justify-center [&>p]:mx-auto" />
          <p className="mx-auto mt-8 max-w-prose text-center text-sm text-ink-muted">
            Prototype note: hover or tap the paw; scroll past the logo to see it reappear in the header.
          </p>
        </section>
        <FixtureSections />
      </main>
    </PawLeadRoot>
  );
}
