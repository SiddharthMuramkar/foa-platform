// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Server Component: inlines the logo SVG so its groups (tiles, letters, mark, wordmark) can be
// animated with CSS. Works unchanged for the stand-in and the real SVG. Server-only (uses node:fs).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOGO_PNG_TRANSPARENT_SRC, LOGO_SVG_SRC } from "./logo";

const cache = new Map<string, Promise<string>>();

function load(src: string): Promise<string> {
  let p = cache.get(src);
  if (!p) {
    p = readFile(path.join(process.cwd(), "public", src), "utf8");
    cache.set(src, p);
  }
  return p;
}

type InlineLogoProps = {
  /** Unique per instance on the page (e.g. "hero", "header"): avoids duplicate ids. */
  idPrefix: string;
  /** Accessible name. Omit when the logo is decorative (e.g. inside a link that has its own label). */
  label?: string;
  className?: string;
  src?: string;
};

export async function InlineLogo({ idPrefix, label, className, src = LOGO_SVG_SRC }: InlineLogoProps) {
  let svg = await load(src);
  svg = svg.replace(/<\?xml[\s\S]*?\?>/g, "").replace(/<!DOCTYPE[\s\S]*?>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  // Stand-in only: point the embedded raster at the static PNG so the HTML stays small.
  svg = svg.replace(/href="data:image\/png;base64,[^"]+"/g, `href="${LOGO_PNG_TRANSPARENT_SRC}"`);
  // Namespace ids; keep the original id in data-part for CSS targeting.
  svg = svg.replace(/\sid="([^"]+)"/g, (_m, id: string) => ` id="${idPrefix}-${id}" data-part="${id}"`);
  svg = svg.replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${idPrefix}-${id})`);
  svg = svg.replace(/((?:xlink:)?href)="#([^"]+)"/g, (_m, attr: string, id: string) => `${attr}="#${idPrefix}-${id}"`);
  // Root <svg>: fluid width, height from viewBox; accessible name or hidden.
  svg = svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const cleaned = attrs.replace(/\s(width|height|style|class|role|aria-[a-z]+|focusable)="[^"]*"/g, "");
    const a11y = label ? ` role="img" aria-label="${label.replace(/"/g, "&quot;")}"` : ` aria-hidden="true"`;
    return `<svg${cleaned}${a11y} focusable="false" style="display:block;width:100%;height:auto;overflow:visible">`;
  });
  return <span className={className} data-logo={idPrefix} dangerouslySetInnerHTML={{ __html: svg.trim() }} />;
}
