// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Logo asset paths. The artwork itself is NEVER altered: no recolouring, inverting, filters or blend modes.
// Only position, scale, opacity, motion, or surfaces/plates placed around it.

/** Swap to the real file when issue #6 lands (copy packages/brand/foa-logo.svg to public/brand/foa-logo.svg): */
export const LOGO_SVG = "/brand/foa-logo-standin.svg";

/** Exact crop of the flat logo from the source raster (white background, no resampling). */
export const LOGO_PNG = "/brand/foa-logo-flat.png";

export const LOGO_IS_STANDIN = LOGO_SVG.includes("standin");

export const LOGO_ALT = "Friends of Animals";

/** Intrinsic size of both files (px of the flat-logo crop). */
export const LOGO_WIDTH = 731;
export const LOGO_HEIGHT = 423;
export const LOGO_ASPECT = LOGO_WIDTH / LOGO_HEIGHT; // ≈ 1.728

/**
 * Measured layout, as fractions of LOGO_HEIGHT (approximate; re-check against the real SVG).
 * The three tiles fill the top ~82%; the BLACK wordmark sits in the bottom band on (transparent → page) ground.
 * On any dark surface the wordmark disappears unless a light ground sits behind it — the question of issue #14.
 */
export const LOGO_GEOMETRY = {
  tilesBottom: 348 / LOGO_HEIGHT,
  wordmarkTop: 367 / LOGO_HEIGHT,
  wordmarkBottom: 422 / LOGO_HEIGHT,
  /** Gap between tiles, as a fraction of LOGO_WIDTH. */
  tileGap: 8 / LOGO_WIDTH,
} as const;

/**
 * MINIMUM DISPLAY HEIGHT (fix stage, review finding "wordmark unreadable at header/footer sizes").
 * The artwork never changes, so scale is the only lever for wordmark legibility. The wordmark band is
 * (wordmarkBottom − wordmarkTop) ≈ 55/423 ≈ 13% of the logo height:
 *   40px → 5.2px (smear, fails) · 56px → 7.3px · 64px → 8.3px · 72px → 9.4px · 112px → 14.6px
 * Rule for packages/brand: never render the full lockup below 56px tall; header 56px phone / 72px desktop;
 * footer 64px. Below 56px the wordmark only reads as a grey bar, so a smaller use would need a separate,
 * approved tiles-only mark (not part of this prototype).
 */
export const LOGO_MIN_HEIGHT = {
  headerMobile: 56,
  headerDesktop: 72,
  footer: 64,
} as const;

/** Group ids shared by the stand-in and the real SVG (packages/brand/foa-logo.svg). */
export const LOGO_GROUP_IDS = [
  "tile-red",
  "tile-green",
  "tile-blue",
  "letter-f",
  "letter-o",
  "letter-a",
  "mark",
  "mark-disc",
  "mark-paw",
  "mark-hands",
  "wordmark",
] as const;
