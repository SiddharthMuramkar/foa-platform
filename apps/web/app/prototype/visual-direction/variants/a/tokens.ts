// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant A "Sunlit storybook" colour tokens: the single source of truth. variant-a.tsx renders them as
// `--a-<kebab-name>` custom properties (light, forced dark, system dark), so what is exported here is exactly
// what the page paints. Every colour used by variant A is listed (decorative ones are marked).
//
// Logo-derived: blue #263FF1 and red #CB2322 are used AS-IS in light (white text passes: 6.9:1 and 5.5:1).
// Logo green #01AD01 fails with white text (3.0:1), so green appears as a tint, as deep text (greenInk) and as
// the deep footer field. Solid red fill is Donate only (donate / donateHover / donateLip).
// Contrast targets (WCAG 2.2 AA): text 4.5:1, large text/UI/focus 3:1. `contrastPairs` below is computed and shown in the sampler.

export type TokenSet = Record<string, `#${string}`>;

export const tokens = {
  light: {
    canvas: "#FFF8EC", // warm cream page
    canvasAlt: "#FCEEDA", // banded sections, tab tray
    sunGlow: "#FFE6BF", // decorative: hero radial glow
    surface: "#FFFFFF", // cards, fields
    ink: "#2B1D12", // body text (warm brown-black)
    inkSoft: "#65503D", // secondary text, captions, placeholders
    line: "#EADBC4", // decorative hairlines only
    fieldBorder: "#8C7560", // input / dashed placeholder boundaries (UI 3:1)
    primary: "#263FF1", // = logo blue. Primary pill fill
    primaryHover: "#1F33D1",
    primaryLip: "#1A2BB0", // the chunky 3D "lip" under pills
    onPrimary: "#FFFFFF",
    link: "#263FF1",
    blueTint: "#E6EDFF",
    blueInk: "#1F33C9", // secondary button text/outline, selected tab, chips on blueTint
    greenTint: "#E0F4D7",
    greenInk: "#0B6B16", // chips/numbers on greenTint (logo green darkened for AA)
    redTint: "#FFE6E1", // red as tint only (never a solid fill outside Donate)
    redInk: "#B2000E", // error text, "closes soon", numbers on redTint
    donate: "#CB2322", // = logo red. Solid fill for Donate ONLY
    donateHover: "#B31D1C",
    donateLip: "#8E1514",
    onDonate: "#FFFFFF",
    focus: "#263FF1",
    footer: "#0F4D1A", // deep "meadow" green footer field
    onFooter: "#FFF8EC",
    footerLink: "#C9F2BE",
    doodleGreen: "#35C530", // decorative: paw prints, sparkles (never text)
    doodleBlue: "#7CA0FF", // decorative
    doodleRed: "#FF7265", // decorative strokes only (squiggle), never a fill
    logoPlate: "#FFF8EC", // plate behind the unaltered logo (invisible on cream; needed in dark)
    shadow: "#8A5A2B29", // decorative: warm soft shadow (8-digit hex, 16% alpha)
    edge: "#00000000", // decorative: surface hairline (none in light: the warm shadow carries the edge)
  },
  dark: {
    canvas: "#17120E", // "bedtime story" warm night
    canvasAlt: "#1F1812",
    sunGlow: "#2B2116", // decorative: lamp glow
    surface: "#231B15",
    ink: "#F6EDE2",
    inkSoft: "#CDBBA8",
    line: "#3A2F26",
    fieldBorder: "#9B8670",
    primary: "#8FAAFF", // logo blue lifted for dark: a "night-light" pill with dark text
    primaryHover: "#A9BEFF",
    primaryLip: "#4F6BDB",
    onPrimary: "#0A1440",
    link: "#A1BCFF",
    blueTint: "#1C2342",
    blueInk: "#A9C1FF",
    greenTint: "#16301B",
    greenInk: "#7FD873",
    redTint: "#2A1411",
    redInk: "#FF8B7F",
    donate: "#CB2322", // logo red unchanged in dark: white text 5.5:1, 3.4:1 against canvas
    donateHover: "#B31D1C",
    donateLip: "#7A1110",
    onDonate: "#FFFFFF",
    focus: "#A1BCFF",
    footer: "#0E2412",
    onFooter: "#F6EDE2",
    footerLink: "#A8E89C",
    doodleGreen: "#55DF4F",
    doodleBlue: "#7CA0FF",
    doodleRed: "#FF8A7E",
    logoPlate: "#FFF8EC", // wordmark is black: the logo always sits on a cream plate in dark
    shadow: "#00000073",
    edge: "#3A2F26", // decorative: hairline so dark surfaces separate (shadows vanish on dark)
  },
} as const satisfies { light: TokenSet; dark: TokenSet };

export type TokenName = keyof typeof tokens.light;

/** Pairs the page actually uses: [foreground, background, minimum ratio]. Rendered in the sampler. */
export const contrastPairs: readonly [TokenName, TokenName, number][] = [
  ["ink", "canvas", 4.5],
  ["inkSoft", "canvas", 4.5],
  ["inkSoft", "canvasAlt", 4.5],
  ["inkSoft", "surface", 4.5],
  ["inkSoft", "redTint", 4.5],
  ["link", "canvas", 4.5],
  ["link", "canvasAlt", 4.5],
  ["onPrimary", "primary", 4.5],
  ["onPrimary", "primaryHover", 4.5],
  ["blueInk", "surface", 4.5],
  ["blueInk", "blueTint", 4.5],
  ["greenInk", "greenTint", 4.5],
  ["greenInk", "surface", 4.5],
  ["redInk", "redTint", 4.5],
  ["redInk", "surface", 4.5],
  ["onDonate", "donate", 4.5],
  ["onDonate", "donateHover", 4.5],
  ["donate", "canvas", 3],
  ["donate", "redTint", 3],
  ["fieldBorder", "surface", 3],
  ["fieldBorder", "canvas", 3],
  ["focus", "canvas", 3],
  ["focus", "canvasAlt", 3],
  ["focus", "surface", 3],
  ["onFooter", "footer", 4.5],
  ["footerLink", "footer", 4.5],
];

/* ------------------------------------------------------------------ WCAG 2.x contrast */

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "").slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function declarations(set: TokenSet): string {
  return Object.entries(set)
    .map(([k, v]) => `--a-${kebab(k)}:${v};`)
    .join("");
}

/** Scoped CSS for the tokens: light by default, dark when forced or when the system theme is dark. */
export const tokenCss =
  `[data-variant=a]{${declarations(tokens.light)}}` +
  `[data-variant=a][data-theme=dark]{${declarations(tokens.dark)}}` +
  `@media (prefers-color-scheme:dark){[data-variant=a][data-theme=system]{${declarations(tokens.dark)}}}`;
