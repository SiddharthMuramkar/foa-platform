// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
"use client";
// The only client JS in variant C (well under 1 KB gzip). No scroll handlers, no per-frame layout reads.
//  - IntersectionObserver on the hero logo -> data-c-hero="in" | "out" on the root. CSS does the
//    rest (a 160–240 ms opacity/transform transition, or opacity only under reduced motion).
//    The same path runs in every browser, including iOS 16–18 without scroll-driven animations.
//  - First "out" also sets data-c-nod (never removed) so the header paw nods exactly once.
//  - Touch/pen tap on the hero paw flips data-bounce 1 <-> 2 on its logo (iOS has no :hover, and
//    :active alone is unreliable there). Mouse uses CSS :hover only.
// Server-rendered children pass straight through; nothing here re-renders.
import { useEffect, useRef, type ReactNode } from "react";

/** Header logo appears once less than this share of the hero logo is still visible below the header. */
const VISIBLE_SHARE = 0.2;

export function PawLeadRoot({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const hero = root.querySelector<HTMLElement>("[data-c-hero-logo]");
    const header = root.querySelector<HTMLElement>("#site-header");
    let io: IntersectionObserver | undefined;

    const observe = () => {
      io?.disconnect();
      if (!hero || typeof IntersectionObserver === "undefined") {
        root.dataset.cHero = "out"; // safest default: header logo always shown
        return;
      }
      // One layout read per (re)build, never per frame. Header height changes at the md breakpoint.
      const top = header?.offsetHeight ?? 0;
      io = new IntersectionObserver(
        ([entry]) => {
          const out = entry.intersectionRatio < VISIBLE_SHARE && entry.boundingClientRect.top < top;
          root.dataset.cHero = out ? "out" : "in";
          if (out) root.dataset.cNod = "";
        },
        { rootMargin: `-${top}px 0px 0px 0px`, threshold: [0, VISIBLE_SHARE] },
      );
      io.observe(hero);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const target = e.target instanceof Element ? e.target : null;
      const logo = target?.closest("[data-c-paw-hit]")?.closest<HTMLElement>("[data-c-logo]");
      if (logo) logo.dataset.bounce = logo.dataset.bounce === "1" ? "2" : "1";
    };

    observe();
    const mq = window.matchMedia("(min-width: 48rem)");
    mq.addEventListener("change", observe);
    root.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      io?.disconnect();
      mq.removeEventListener("change", observe);
      root.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
