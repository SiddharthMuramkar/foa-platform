// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Variant B ("Light masthead") shared class strings and layout constants.
// Editorial personality: square-ish corners (rounded-lg), hairline rules, heavy section rules, no pills.

/** Page container: mobile-first 16px gutter (390×844), 32px from md, capped at 1280px (1440×900 desktop). */
export const container = "mx-auto w-full max-w-[80rem] px-4 md:px-8";

/**
 * Donate: SOLID red fill only (bg-donate text-on-donate, white on #CB2322 = 5.5:1) in both themes.
 * Hover never changes the fill (no tint, no darker red): it underlines the label instead.
 * Placement contrast vs ground: white masthead 5.5:1, dark canvas 3.3:1 (UI ≥ 3:1). Never on dark surface-2 (2.6:1).
 */
export const donateButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-donate px-5 text-sm font-bold text-on-donate underline-offset-4 hover:underline";

/** Primary CTA (non-Donate): logo blue accent. Light #263FF1/white 6.9:1; dark #9DA9FF/#121417 8.4:1. */
export const primaryButton =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 text-base font-bold text-on-accent underline-offset-4 hover:underline";

/** Plain text link (nav, footer). */
export const textLink = "underline-offset-4 decoration-2 hover:underline";

/**
 * Height of the fixed compact bar: 72px phone / 88px from md (fits the 56/72px logo, LOGO_MIN_HEIGHT). The bar is
 * fixed to the viewport top UNDER the masthead (which stays in normal flow), so it is hidden at the top of the page
 * and uncovered — with zero JS — as the masthead's bottom edge scrolls past it.
 * Keep in sync: bar height, --b-bar-h (variant-b.tsx, used by the reveal timeline) and the html scroll-padding.
 */
export const BAR_HEIGHT_CLASS = "h-18 md:h-22";

/**
 * Logo heights (CSS px). Fix stage: bar 40→56/72 and footer 32→64 (LOGO_MIN_HEIGHT: wordmark readable);
 * nameplate 112/160→80/112 (wordmark still 10.4/14.6px) so the light band takes ~30% less of a dark-mode first view.
 */
export const LOGO_HEIGHTS = {
  barMobile: 56,
  bar: 72,
  nameplateMobile: 80,
  nameplateDesktop: 112,
  footer: 64,
} as const;
