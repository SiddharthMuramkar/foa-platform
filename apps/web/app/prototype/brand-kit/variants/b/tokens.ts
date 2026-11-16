// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Every colour Variant B uses, page and generated assets, in one place so it can be lifted into
// packages/brand and contrast-checked. Logo colours are NOT here: the logo is only ever the raster.
//
// Contrast (WCAG 2.2, measured with the relative-luminance formula):
//   light  poFg/poBg 10.97 · poBorder/poBg 4.32 · markChipFg 7.05 · logoChipFg 9.13 · bubbleMeta 7.29
//          bubbleLink 7.39 · safeZone/white 5.66 · rejectBorder/rejectBg 3.15 · phoneLabel/phoneWall 12.9
//          safeZoneText on bg 5.33 (light) / 7.73 (dark); the overlay colour itself is too dark to read on dark
//   dark   poFg/poBg 11.45 · poBorder/poBg 5.56 · markChipFg 8.80 · logoChipFg 8.95 · bubbleMeta 6.98
//          bubbleLink 7.09 · rejectBorder/rejectBg 3.31 · switchLine/bg 4.07
//   Base bk* values mirror app/globals.css (pre-checked there).
import type { CSSProperties } from "react";

const constant = {
  // Mocks that look the same in both page themes (a light AND a dark browser are shown side by side).
  tabBarLight: "#DEE1E6",
  tabActiveLight: "#FFFFFF",
  tabTextLight: "#1F1F1F",
  tabBarDark: "#202124",
  tabActiveDark: "#35363A",
  tabTextDark: "#E8EAED",
  phoneWall: "#23324A",
  phoneLabel: "#FFFFFF",
  phoneSlot: "#4A5870",
  safeZone: "#C2255C",
  // Baked into the PNG/JPEG assets by ./build.mjs (identical in both themes).
  assetPlate: "#FFFFFF",
  assetInk: "#1A1A1A",
  assetMuted: "#5A5650",
  assetPrimary: "#0055A5",
  assetRule: "#D9D4CA",
  assetHairline: "#00000029", // badge pill outline, black at 16%
  assetSealGold: "#B98A2E",
  assetSealGoldDeep: "#7A5A14",
} as const;

export const tokens = {
  light: {
    bkBg: "#FAF8F4",
    bkSurface: "#FFFFFF",
    bkFg: "#1A1A1A",
    bkMuted: "#5A5650",
    bkBorder: "#D9D4CA",
    bkBorderStrong: "#8C857A",
    bkPrimary: "#0055A5",
    bkPlate: "#FFFFFF",
    poBg: "#FFF4D6",
    poFg: "#4A3200",
    poBorder: "#9A6A00",
    markChipBg: "#E3F1E6",
    markChipFg: "#1D5A2C",
    logoChipBg: "#E3ECF7",
    logoChipFg: "#0B3D73",
    chatBg: "#E7E2D9",
    bubbleBg: "#FFFFFF",
    bubbleFg: "#1A1A1A",
    bubbleMeta: "#5A5650",
    bubbleLink: "#0055A5",
    rejectBg: "#F1EEE8",
    rejectFg: "#1A1A1A",
    rejectBorder: "#8C857A",
    switchLine: "#8C857A",
    safeZoneText: "#C2255C",
    ...constant,
  },
  dark: {
    bkBg: "#121417",
    bkSurface: "#1C1F24",
    bkFg: "#F2EFE9",
    bkMuted: "#B4AFA6",
    bkBorder: "#3A3F47",
    bkBorderStrong: "#6F7782",
    bkPrimary: "#7DB4F5",
    bkPlate: "#FFFFFF",
    poBg: "#33290F",
    poFg: "#FFE3A3",
    poBorder: "#C99A2E",
    markChipBg: "#173222",
    markChipFg: "#9FDCB0",
    logoChipBg: "#15263D",
    logoChipFg: "#A9C9F2",
    chatBg: "#0F1316",
    bubbleBg: "#1F262B",
    bubbleFg: "#EDEFF0",
    bubbleMeta: "#A9B0B5",
    bubbleLink: "#7DB4F5",
    rejectBg: "#24272C",
    rejectFg: "#F2EFE9",
    rejectBorder: "#6F7782",
    switchLine: "#6F7782",
    safeZoneText: "#F783AC",
    ...constant,
  },
} as const;

/** Tokens b.module.css switches between (the bk* ones come from globals.css via Tailwind). */
const SWITCHED = [
  "poBg", "poFg", "poBorder", "markChipBg", "markChipFg", "logoChipBg", "logoChipFg", "chatBg", "bubbleBg",
  "bubbleFg", "bubbleMeta", "bubbleLink", "rejectBg", "rejectFg", "rejectBorder", "switchLine",
  "tabBarLight", "tabActiveLight", "tabTextLight", "tabBarDark", "tabActiveDark", "tabTextDark",
  "phoneWall", "phoneLabel", "phoneSlot", "safeZone", "safeZoneText",
] as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Inline custom properties: --bl-* (light) and --bd-* (dark) for every switched token. Values live only
 * here; b.module.css maps --b-* to one set or the other with the same selectors as globals.css.
 */
export const themeStyle = Object.fromEntries(
  SWITCHED.flatMap((k) => [
    [`--bl-${kebab(k)}`, tokens.light[k]],
    [`--bd-${kebab(k)}`, tokens.dark[k]],
  ]),
) as CSSProperties;
