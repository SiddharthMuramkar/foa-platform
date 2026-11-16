// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Logo asset paths (public URLs). The logo design never changes: only position, scale, opacity,
// motion, or plates/surfaces around it.
//
// SWAP TO THE REAL SVG (#6): copy packages/brand/foa-logo.svg to public/brand/foa-logo.svg and
// change the one line below to "/brand/foa-logo.svg". Same group ids, so nothing else changes.
export const LOGO_SVG_SRC = "/brand/foa-logo-standin.svg";

/** Exact crop of the FLAT variant from the source raster, white background (755×447). */
export const LOGO_PNG_SRC = "/brand/foa-logo-flat.png";
/**
 * Same crop with the white OUTSIDE the tiles made transparent (colour-to-alpha). Lossless:
 * composited on white it reproduces foa-logo-flat.png exactly. Tiles stay opaque.
 */
export const LOGO_PNG_TRANSPARENT_SRC = "/brand/foa-logo-flat-transparent.png";

/** Intrinsic size of the PNGs and the stand-in SVG viewBox (raster px). Use for width/height to keep CLS 0. */
export const LOGO_WIDTH = 755;
export const LOGO_HEIGHT = 447;
export const LOGO_ASPECT = LOGO_WIDTH / LOGO_HEIGHT; // ≈ 1.689

export const LOGO_ALT = "Friends of Animals";

/**
 * Group ids in the SVG (stand-in and real). When inlined via <InlineLogo idPrefix="x">, each element
 * gets id="x-<id>" plus data-part="<id>", so target parts with CSS like [data-part="tile-red"].
 * Letters and the mark are SIBLINGS of the tiles: move a tile together with its letter
 * (tile-red+letter-f, tile-green+letter-o+mark, tile-blue+letter-a).
 */
export const LOGO_PARTS = [
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
export type LogoPart = (typeof LOGO_PARTS)[number];

/**
 * Stand-in viewBox (raster px). The real SVG may use different units: do not hard-code part positions;
 * for CSS transforms on SVG groups use `transform-box: fill-box; transform-origin: center`.
 */
export const LOGO_VIEWBOX = { x: 62, y: 37, width: 755, height: 447 } as const;

/**
 * Part bounding boxes as FRACTIONS of the logo box (stand-in geometry, measured from the raster; the
 * real SVG is an exact rebuild of the same artwork). Useful for HTML-wrapper techniques, e.g. stacking
 * copies of the logo and showing one tile per copy with
 *   clip-path: inset(${y*100}% ${(1-x-w)*100}% ${(1-y-h)*100}% ${x*100}%)
 * so each tile moves on its own compositor layer, or for placing a hit area over the paw mark.
 */
export const LOGO_PART_BOXES = {
  "tile-red": { x: 0.0185, y: 0.0291, w: 0.298, h: 0.774 },
  "tile-green": { x: 0.3272, y: 0.0313, w: 0.3351, h: 0.774 },
  "tile-blue": { x: 0.6728, y: 0.0291, w: 0.3113, h: 0.774 },
  "letter-f": { x: 0.0914, y: 0.3893, w: 0.1709, h: 0.3579 },
  "letter-o": { x: 0.355, y: 0.3826, w: 0.2781, h: 0.3714 },
  "letter-a": { x: 0.6967, y: 0.3893, w: 0.2583, h: 0.3579 },
  mark: { x: 0.4066, y: 0.4273, w: 0.1735, h: 0.2819 },
  wordmark: { x: 0.0199, y: 0.8479, w: 0.9589, h: 0.1253 },
} as const satisfies Partial<Record<LogoPart, { x: number; y: number; w: number; h: number }>>;
