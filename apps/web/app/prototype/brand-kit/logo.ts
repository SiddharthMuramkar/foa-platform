// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Single place that says where the logo lives. The logo is NEVER altered (shape, colour, proportions,
// letterforms): only position, scale, opacity, motion, or plates/surfaces placed around it.
//
// Real SVG (issue #6, packages/brand/foa-logo.svg) did not exist at setup time, so LOGO_SVG points
// at a stand-in with the SAME group ids (raster pixels clipped per group). When #6 lands, copy it to
// public/brand/foa-logo.svg and change the ONE line below.
import geometry from "./logo-geometry.json";

export const LOGO_SVG = "/brand/foa-logo-standin.svg"; // ← swap to "/brand/foa-logo.svg" when #6 lands
export const LOGO_SVG_IS_STANDIN = LOGO_SVG.includes("standin");

/** Exact crop of the FLAT variant from the client raster. White background, untouched pixels. */
export const LOGO_FLAT_PNG = {
  src: "/brand/foa-logo-flat.png",
  width: geometry.flat.width,
  height: geometry.flat.height,
} as const;

/**
 * No transparent-background PNG ships: the source is a JPEG on white, so separating the logo from
 * the white (antialiased tile edges, JPEG ringing, the white gaps between tiles) would be an
 * estimate, not a lossless copy. On dark or busy surfaces put the logo on a white plate instead.
 */
export const LOGO_TRANSPARENT_PNG = null;

/** Exact rectangular crops of foa-logo-flat.png (no masking, no recolouring). */
export const LOGO_PARTS = {
  tiles: { src: "/brand/parts/foa-tiles-flat.png", width: geometry.lockups.tiles.w, height: geometry.lockups.tiles.h },
  mark: { src: "/brand/parts/foa-mark-flat.png", width: geometry.lockups.mark.w, height: geometry.lockups.mark.h },
  wordmark: {
    src: "/brand/parts/foa-wordmark-flat.png",
    width: geometry.lockups.wordmark.w,
    height: geometry.lockups.wordmark.h,
  },
} as const;

/** SVG group ids shared by the stand-in and the real rebuild. */
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
export type LogoGroupId = (typeof LOGO_GROUP_IDS)[number];

/** Bounding boxes {x,y,w,h} in foa-logo-flat.png pixels (= stand-in SVG viewBox units). */
export const LOGO_GROUPS: Record<LogoGroupId, { x: number; y: number; w: number; h: number }> = geometry.groups;

/** Measured logo colours, for reference only (plates, contrast checks). Never repaint the logo with them. */
export const LOGO_COLOURS = geometry.colours;

export const LOGO_ALT = "Friends of Animals";

/** Absolute path of the source raster for node generators (sharp). */
export const LOGO_SOURCE_RASTER = "scripts/source/foa-logo-source.jpg";
export const LOGO_GEOMETRY = geometry;
