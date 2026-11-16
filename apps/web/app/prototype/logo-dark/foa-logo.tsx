// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Shared, read-only logo renderer. Renders the artwork untouched; put plates, bands or islands AROUND it.
import Image from "next/image";
import { LOGO_ALT, LOGO_ASPECT, LOGO_SVG } from "./logo";

type Props = {
  /** Rendered height in CSS px (width follows the logo's aspect ratio). Override responsively via className, e.g. "h-10 w-auto md:h-12". */
  height: number;
  className?: string;
  /** true for the hero/LCP logo only. */
  preload?: boolean;
  /** Empty alt when the logo sits inside a link that already says "Friends of Animals — home". */
  decorative?: boolean;
};

export function FoaLogo({ height, className, preload = false, decorative = false }: Props) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <Image
      src={LOGO_SVG}
      width={width}
      height={height}
      alt={decorative ? "" : LOGO_ALT}
      preload={preload}
      unoptimized // SVG: served as-is (next/image does this automatically for .svg)
      draggable={false}
      className={className}
      style={className ? undefined : { width, height }}
    />
  );
}
