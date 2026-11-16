// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Island for variant A "Dock" (research/lean-motion-stack: IntersectionObserver + CSS transition, no
// library, no scroll handler). It only toggles data attributes on the variant root; all motion lives in
// dock.module.css:
//   data-io        → no scroll-driven animations: this fallback is in charge of the motion-allowed path
//                    (hero logo scrolls away normally; the compact header logo rises + fades in)
//   data-hero-out  → less than VISIBLE_SHARE of the hero logo is still visible below the header. Used by
//                    the fallback AND by reduced motion in every browser (timed opacity fade)
//   data-io-ready  → set after the first observation, so a restored scroll position shows the header logo
//                    without a fly-in
"use client";

import { useEffect, useRef } from "react";

const ATTRS = ["data-io", "data-io-ready", "data-hero-out"] as const;

/** Header logo appears once less than this share of the hero logo is visible below the header (as C). */
const VISIBLE_SHARE = 0.2;

export function DockFallback() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = markerRef.current?.closest<HTMLElement>("[data-dock-root]");
    const fly = root?.querySelector<HTMLElement>("[data-dock-fly]");
    if (!root || !fly) return;
    if (typeof IntersectionObserver === "undefined") {
      root.setAttribute("data-hero-out", ""); // header logo always shown rather than never
      return;
    }

    const toggle = (attr: (typeof ATTRS)[number], on: boolean) => {
      if (on) root.setAttribute(attr, "");
      else root.removeAttribute(attr);
    };
    toggle("data-io", typeof CSS === "undefined" || !CSS.supports("animation-timeline: scroll()"));

    let raf = 0;
    let io: IntersectionObserver | undefined;
    const observe = () => {
      io?.disconnect();
      // One layout read per (re)build (mount + header breakpoint flip), never per frame.
      const headerH = document.getElementById("site-header")?.offsetHeight ?? 64;
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          toggle("data-hero-out", entry.intersectionRatio < VISIBLE_SHARE && entry.boundingClientRect.top < headerH);
          if (!raf) raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => toggle("data-io-ready", true))));
        },
        { rootMargin: `-${headerH}px 0px 0px 0px`, threshold: [0, VISIBLE_SHARE] },
      );
      io.observe(fly);
    };
    observe();
    const mq = window.matchMedia("(min-width: 48rem)"); // --header-h changes here (globals.css)
    mq.addEventListener("change", observe);

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      mq.removeEventListener("change", observe);
      ATTRS.forEach((a) => root.removeAttribute(a));
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
