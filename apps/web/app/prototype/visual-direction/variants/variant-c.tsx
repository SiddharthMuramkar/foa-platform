// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant C "Colour-block mosaic" (brief: ../BRIEF.md). Logo-tile-driven: the page is one grid of square-cornered
// tiles separated by the logo's own tile gap; the three logo colours are tile surfaces, used verbatim in both
// themes with fixed on-colours (white on red/blue, near-black on green). Solid red is painted only on Donate.
// Type: Figtree 400 + 800 (2 weights, NFR-01). Server components throughout; one ~1 KB client island (tabs).
import { Figtree } from "next/font/google";
import { tokens as cTokens, tokensCss } from "./c/tokens";
import { Footer } from "./c/footer";
import { Header } from "./c/header";
import { Sampler } from "./c/sampler";
import { Adoption, Competitions, DonateBand, Gallery, Hero, Impact, PartnersAndNewsletter } from "./c/sections";
import "./c/variant-c.css";

export const name = "Colour-block mosaic";

/** Every colour this variant paints, per theme (lift into packages/brand; contrast-checked). */
export const tokens = cTokens;

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "800"],
  display: "swap",
  variable: "--font-c",
});

export default function VariantC() {
  return (
    <div id="c-top" className={`${figtree.variable} c-root min-h-dvh`}>
      {/* Generated from ./c/tokens.ts so the exported tokens and the painted colours cannot drift. */}
      <style dangerouslySetInnerHTML={{ __html: tokensCss }} />
      <a className="c-skip" href="#c-main">
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-(--c-section) px-4 pt-4 pb-28 sm:px-6 lg:px-10 lg:pt-5">
        <div className="flex flex-col gap-(--c-gap)">
          <Header />
          <main id="c-main" className="flex flex-col gap-(--c-section)">
            <Hero />
            <Competitions />
            <Gallery />
            <Impact />
            <DonateBand />
            <Adoption />
            <PartnersAndNewsletter />
          </main>
        </div>
        <Footer />
        <Sampler />
      </div>
    </div>
  );
}
