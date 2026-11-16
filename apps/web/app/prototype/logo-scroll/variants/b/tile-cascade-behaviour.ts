// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Plain DOM behaviour for variant B (framework-free so it can be tested on its own). No scroll handlers and
// no per-frame layout reads: one IntersectionObserver plus one delegated click listener.
//
//  1. Dock state: root[data-b-docked] = "true" once less than DOCK_RATIO of the hero logo is visible below
//     the sticky header (it left upwards). CSS turns that into the header tiles clicking together, and, in
//     browsers without scroll-driven animations, into the hero tiles' time-based drift.
//  2. Paw wag on tap/click: [data-b-wag] element gets data-b-wag-run = "a" | "b" (alternating, so a second
//     tap restarts the CSS animation without a forced reflow); cleared on animationend.

/**
 * Fraction of the hero logo still visible below the header at which the header logo assembles. 0.65 = once
 * 35 % of it is covered: the hero tiles have just finished parting and most of the hero logo is still on
 * screen, so the whole header logo is there before the hero tiles go under the header (review fix; was
 * 0.35, which left ≈ 50 px of scroll with no whole logo anywhere).
 */
export const DOCK_RATIO = 0.65;

/** Matches the md breakpoint where --header-h changes (globals.css). */
const HEADER_BREAKPOINT = "(min-width: 48rem)";

export function initTileCascade(root: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const heroLogo = root.querySelector<HTMLElement>("[data-b-hero-logo]");
  const header = root.querySelector<HTMLElement>("header");

  if (heroLogo && typeof IntersectionObserver === "function") {
    let io: IntersectionObserver | undefined;
    const build = () => {
      io?.disconnect();
      // One layout read per (re)build (mount + header breakpoint flip), never per frame.
      const headerH = header?.offsetHeight ?? 0;
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          const top = entry.rootBounds ? entry.rootBounds.top : headerH;
          const docked = entry.intersectionRatio < DOCK_RATIO && entry.boundingClientRect.top < top;
          root.dataset.bDocked = docked ? "true" : "false";
        },
        { rootMargin: `${-headerH}px 0px 0px 0px`, threshold: [0, DOCK_RATIO] },
      );
      io.observe(heroLogo);
    };
    build();
    const mq = window.matchMedia(HEADER_BREAKPOINT);
    mq.addEventListener("change", build);
    cleanups.push(() => {
      io?.disconnect();
      mq.removeEventListener("change", build);
    });
  } else {
    // No IntersectionObserver: show the header logo assembled rather than never.
    root.dataset.bDocked = "true";
  }

  // `click`, not `pointerdown`: a swipe that starts on the big hero logo is a scroll, not a tap.
  let flip = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onClick = (e: MouseEvent) => {
    if (reduce.matches) return;
    const target = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-b-wag]") : null;
    if (!target || !root.contains(target)) return;
    flip = !flip;
    target.dataset.bWagRun = flip ? "a" : "b";
  };
  const onAnimationEnd = (e: AnimationEvent) => {
    if (!/wag-[ab]/.test(e.animationName) || !(e.target instanceof Element)) return;
    const host = e.target.closest<HTMLElement>("[data-b-wag-run]");
    if (host) delete host.dataset.bWagRun;
  };
  root.addEventListener("click", onClick);
  root.addEventListener("animationend", onAnimationEnd);
  cleanups.push(() => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("animationend", onAnimationEnd);
  });

  return () => {
    for (const fn of cleanups) fn();
    delete root.dataset.bDocked;
  };
}
