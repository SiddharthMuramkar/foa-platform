// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
"use client";

import { useEffect } from "react";
import type { Theme } from "./fixtures";

/**
 * Mirrors a forced ?theme= onto <html data-theme> so the page background and overscroll match.
 * The server-rendered wrapper already carries data-theme, so content is correct on first paint.
 */
export function ThemeSync({ theme }: { theme: Theme | undefined }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);
  return null;
}
