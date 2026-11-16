// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant C "Light islands": the one surface primitive. Every block on the page is an island floating on the canvas.
//   tone="light" — re-scopes its subtree to light tokens (data-theme="light"), so it is white in BOTH page themes.
//                  This is the ONLY place the logo is ever rendered (header pill, hero card, footer brand card).
//   tone="page"  — follows the page theme: a dark card on the dark canvas, a warm tinted card on the light canvas.
// An island is a content surface in its own right (it always carries content besides the logo), never a plate.
import type { HTMLAttributes, ReactNode } from "react";

type Tag = "div" | "section" | "article" | "aside";

type IslandProps = HTMLAttributes<HTMLElement> & {
  tone: "light" | "page";
  as?: Tag;
  children: ReactNode;
};

const TONE = {
  // White island. Hairline + soft drop shadow: the shadow defines the edge on the off-white light canvas; on the
  // dark canvas the white itself does (18.5:1 vs canvas) and the shadow is invisible, which is fine.
  light:
    "bg-surface text-ink ring-1 ring-line shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-20px_rgb(0_0_0/0.28)]",
  // Page-theme island: surface-2 (#252930 dark / #f1eee8 light) so it alternates with the white islands in both themes.
  page: "bg-surface-2 text-ink ring-1 ring-line",
} as const;

export function Island({ tone, as: Component = "div", className = "", children, ...rest }: IslandProps) {
  return (
    <Component
      {...rest}
      data-island={tone}
      data-theme={tone === "light" ? "light" : undefined}
      className={`${TONE[tone]} ${className}`}
    >
      {children}
    </Component>
  );
}
