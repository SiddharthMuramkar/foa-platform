// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant A "Plate": the unchanged logo on a white rounded plate (a surface AROUND the artwork; the artwork
// itself is rendered untouched by FoaLogo: no recolour, invert, filter, blend mode or glow).
//
// Geometry is a pure function of the logo's rendered height h, read from the inherited CSS custom property
// --logo-h, so header (40px), hero (128/160px) and footer (32px) plates share identical proportions:
//   padding = 0.2h on every side, corner radius = 0.18h  →  plate = (1.728h + 0.4h) × 1.4h
// Set the size on the plate or any ancestor with a literal class, e.g. "[--logo-h:40px] lg:[--logo-h:48px]".
import { FoaLogo } from "../../foa-logo";

/** Plate proportions as multiples of the logo height. Mirrored in the literal classes below (Tailwind needs literals). */
export const PLATE_RATIOS = { pad: 0.2, radius: 0.18 } as const;

/** Same corner radius as the plate, for wrappers (e.g. the home link) so the focus outline follows the plate. */
export const PLATE_RADIUS = "rounded-[calc(var(--logo-h)*0.18)]";

/**
 * Edge treatment that makes the plate read as a deliberate badge, not a pasted white sticker.
 * Light: a hairline inner rim + soft drop shadow (the plate is ~1.06:1 against the off-white canvas).
 * Dark:  inner rim + a 1px and a 4px low-alpha white halo that step the 18:1 white edge down into the
 *        dark ground, plus a deep lift shadow. All of it sits on the plate, never on the artwork.
 * Hex equivalents are listed in `tokens` (variant-a.tsx): plateRim, plateHalo, plateHaloOuter, plateShadow.
 */
const PLATE_EDGE =
  "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(27_27_31/0.08),0_10px_24px_-14px_rgb(27_27_31/0.35)] " +
  "dark:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.10),0_0_0_1px_rgb(255_255_255/0.14),0_0_0_4px_rgb(255_255_255/0.05),0_14px_32px_-12px_rgb(0_0_0/0.9)]";

type Props = {
  /** Largest rendered logo height in px; only sets the intrinsic width/height attributes (aspect box → no CLS). */
  height: number;
  /** Literal size classes setting --logo-h, unless an ancestor already sets it. */
  className?: string;
  /** Hero logo only (the single preloaded image on the page). */
  preload?: boolean;
  /** true inside a link that already carries the accessible name. */
  decorative?: boolean;
};

export function LogoPlate({ height, className = "", preload = false, decorative = false }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 bg-logo-ground p-[calc(var(--logo-h)*0.2)] ${PLATE_RADIUS} ${PLATE_EDGE} ${className}`}
    >
      <FoaLogo
        height={height}
        preload={preload}
        decorative={decorative}
        className="block h-(--logo-h) w-auto max-w-none"
      />
    </span>
  );
}
