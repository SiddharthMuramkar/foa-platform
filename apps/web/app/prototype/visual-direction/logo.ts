// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// FOA logo assets. The logo is NEVER altered: no change to shape, colour, proportions or letterforms.
// Allowed: position, scale, opacity, motion, and surfaces/plates placed around it.
// The wordmark is black, so on dark surfaces put the logo on a light plate (e.g. white, radius + padding).

type LogoAsset = { svg: string; width: number; height: number };

/** Stand-in built from the raster (public/brand/foa-logo-standin.svg): same group ids as the real rebuild. */
const STANDIN: LogoAsset = { svg: "/brand/foa-logo-standin.svg", width: 738, height: 426 };

/**
 * Exact SVG rebuild from issue #6 (packages/brand/foa-logo.svg in the foa-platform-wt-6-logo-svg worktree).
 * When it lands: copy it to public/brand/foa-logo.svg, set its viewBox size here, flip ACTIVE below.
 */
const REAL: LogoAsset = { svg: "/brand/foa-logo.svg", width: 738, height: 426 };

const ACTIVE: LogoAsset = STANDIN; // ← the one-line swap: STANDIN → REAL
export const logoRealPending = REAL;

export const logo = {
  /** Vector logo (transparent outside the tiles and letters). Group ids: tile-red, tile-green, tile-blue,
   *  letter-f, letter-o, letter-a, mark (mark-disc, mark-paw, mark-hands), wordmark. */
  svg: ACTIVE.svg,
  /** Exact lossless crop of the flat variant from the source raster, white background (738×426). */
  png: "/brand/foa-logo-flat.png",
  width: ACTIVE.width,
  height: ACTIVE.height,
  alt: "Friends of Animals",
} as const;

/** Colours sampled from the flat logo tiles (interior medians). Brand constants, not UI tokens. */
export const logoColours = {
  red: "#CB2322",
  green: "#01AD01",
  blue: "#263FF1",
  wordmark: "#000000",
} as const;
