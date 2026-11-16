// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Server Component. The unchanged logo with its paw-and-hands mark lifted onto its own HTML layers.
//
//   .logo
//     InlineLogo (base)           every group except `mark`
//     .hit                        optional pointer target over the paw (≥ 44×44 px, decorative)
//     .window                     static clip = the hole of the O (ring is never overdrawn)
//       .wave > .bounce           compositor layers (transform only)
//         InlineLogo (.paw)       only `mark`, trimmed just inside the hole
//
// At rest the two copies sit exactly on top of each other (same box, same viewBox), so the artwork
// is unchanged: only the mark's position moves, and only inside the O.
import type { CSSProperties } from "react";
import { InlineLogo } from "../../inline-logo";
import { LOGO_PART_BOXES } from "../../logo";
import styles from "./paw-lead.module.css";

const M = LOGO_PART_BOXES.mark;
/**
 * The mark box (logo fractions) is the stand-in's raster clip, a hair larger than the O's hole.
 * Hole of the O ≈ 0.953 × the box half-size; the moving paw is trimmed to ≈ 0.935 so the ring's inner
 * edge never travels with it. With the real SVG (#6) only LOGO_PART_BOXES.mark needs updating.
 */
const HOLE = 0.953;
const PAW = 0.935;
const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

const GEOMETRY = {
  "--c-cx": pct(M.x + M.w / 2),
  "--c-cy": pct(M.y + M.h / 2),
  "--c-bottom": pct(M.y + M.h / 2 + (M.h / 2) * HOLE),
  "--c-win-rx": pct((M.w / 2) * HOLE),
  "--c-win-ry": pct((M.h / 2) * HOLE),
  "--c-paw-rx": pct((M.w / 2) * PAW),
  "--c-paw-ry": pct((M.h / 2) * PAW),
} as CSSProperties;

type PawLogoProps = {
  /** Unique id prefix per instance (the paw copy uses `${id}-paw`). */
  id: string;
  /** Accessible name. Omit when the logo sits inside a labelled link. */
  label?: string;
  /** Render the pointer hit area over the paw (hover + tap bounce). */
  hit?: boolean;
  /** One-off wave on first load. */
  wave?: boolean;
  /** One nod the first time the island marks the root with data-c-nod. */
  nod?: boolean;
  className?: string;
};

export function PawLogo({ id, label, hit = false, wave = false, nod = false, className = "" }: PawLogoProps) {
  const cls = [styles.logo, wave ? styles.waveOnLoad : "", nod ? styles.nodOnArrival : "", className].filter(Boolean).join(" ");
  return (
    <span data-c-logo="" className={cls} style={GEOMETRY}>
      <InlineLogo idPrefix={id} label={label} className={styles.base} />
      {hit && <span aria-hidden="true" data-c-paw-hit="" className={styles.hit} />}
      <span aria-hidden="true" className={styles.window}>
        <span className={styles.wave}>
          <span className={styles.bounce}>
            <InlineLogo idPrefix={`${id}-paw`} className={styles.paw} />
          </span>
        </span>
      </span>
    </span>
  );
}
