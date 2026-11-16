// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Server Component. The UNCHANGED logo SVG split into stacked HTML layers by its own groups, so each tile
// can move on its own compositor layer (transform/opacity) without touching the artwork:
//   red   = tile-red + letter-f        green = tile-green + letter-o (+ the mark layer inside it)
//   blue  = tile-blue + letter-a       word  = wordmark
// At rest the layers composite back to the exact logo. Decorative: the caller supplies the one
// accessible name (role="img" + aria-label, or a labelled link).
import type { CSSProperties } from "react";
import { InlineLogo } from "../../inline-logo";
import { LOGO_PART_BOXES } from "../../logo";
import styles from "./tile-cascade.module.css";

const mark = LOGO_PART_BOXES.mark;
/** Pivot for the paw wag: centre of the mark's green disc, so the disc never uncovers the O's ring. */
const MARK_ORIGIN = `${((mark.x + mark.w / 2) * 100).toFixed(2)}% ${((mark.y + mark.h / 2) * 100).toFixed(2)}%`;

const cx = (...c: string[]) => c.join(" ");

export function SplitLogo({ idPrefix }: { idPrefix: string }) {
  return (
    <span className={styles.stack} style={{ "--b-mark-origin": MARK_ORIGIN } as CSSProperties} aria-hidden="true">
      <InlineLogo idPrefix={`${idPrefix}-r`} className={cx(styles.art, styles.flow, styles.showRed, styles.layerRed)} />
      <span className={cx(styles.over, styles.layerGreen)}>
        <InlineLogo idPrefix={`${idPrefix}-g`} className={cx(styles.art, styles.showGreen)} />
        {/* Two wrappers: hover/focus wag on the outer, tap wag on the inner, so they never cancel each other. */}
        <span className={cx(styles.over, styles.markHover)}>
          <InlineLogo idPrefix={`${idPrefix}-m`} className={cx(styles.art, styles.showMark, styles.markTap)} />
        </span>
      </span>
      <InlineLogo idPrefix={`${idPrefix}-b`} className={cx(styles.art, styles.over, styles.showBlue, styles.layerBlue)} />
      <InlineLogo idPrefix={`${idPrefix}-w`} className={cx(styles.art, styles.over, styles.showWord, styles.layerWord)} />
    </span>
  );
}
