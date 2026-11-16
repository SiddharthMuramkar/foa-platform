// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant C "Colour-block mosaic" colour tokens: the single source of truth. The CSS custom properties
// (--c-<kebab-name>) are generated from these objects, so what `tokens` lists is exactly what the page paints.
//
// Rule of the direction: the three logo colours are used VERBATIM as tile surfaces in both themes, each with a
// fixed on-colour (white on red and blue, near-black on green: white on logo green is only 3.0:1). Ladder shades
// are only for text and tints. Solid red (`red`) is painted ONLY on Donate.

export const tokens = {
  light: {
    canvas: "#FFFFFF", // page background = the white gaps between the logo's tiles
    paper: "#F1F2F4", // neutral tile
    paper2: "#E5E7EB", // neutral tile hover / inset cells
    mat: "#FFFFFF", // mat behind Artworks (never cropped)
    plate: "#FFFFFF", // logo plate (wordmark is black: always a light plate), photo chips
    plateInk: "#0E1116", // text on plates, both themes
    plateMuted: "#4A5162",
    ink: "#0E1116", // body text 18.9:1 on canvas
    muted: "#4A5162", // secondary text 7.9:1 on canvas, ≥ 6:1 on every tint
    field: "#6E7584", // input / placeholder borders, ≥ 3:1 on canvas and paper
    focus: "#0E1116", // focus ring outside tiles
    inverseMuted: "#B8BFCC", // secondary text on the inverse (ink) tile

    blue: "#263FF1", // logo blue, surface; white text 6.9:1
    bluePress: "#1A2DC9",
    onBlue: "#FFFFFF",
    onBlueMuted: "#DDE3FF", // 5.4:1 on blue
    blueTint: "#E8ECFF",
    blueTint2: "#D9E0FF",
    blueText: "#2338E0", // blue text on canvas/paper/tint ≥ 5.9:1

    green: "#01AD01", // logo green, surface; near-black text 6.3:1
    greenPress: "#2BCB2B", // hover goes LIGHTER so dark text gains contrast
    onGreen: "#06140A",
    greenTint: "#E2F5DE",
    greenTint2: "#CFEDC9",
    greenText: "#006100", // green text ≥ 6.1:1 on canvas/paper/tint

    red: "#CB2322", // logo red, Donate ONLY; white text 5.5:1
    redPress: "#A81A19",
    onRed: "#FFFFFF",
    redTint: "#FFEAE6", // tint allowed anywhere (donate band, errors)
    redText: "#AE151A", // red text/rules ≥ 6.2:1
  },
  dark: {
    canvas: "#0B0D11",
    paper: "#161920",
    paper2: "#20242D",
    mat: "#1E222A",
    plate: "#FFFFFF",
    plateInk: "#0E1116",
    plateMuted: "#4A5162",
    ink: "#F2F4F7",
    muted: "#A7AEBC",
    field: "#7D8696",
    focus: "#F2F4F7",
    inverseMuted: "#4A5162",

    blue: "#263FF1", // same logo blue; white text 6.9:1
    bluePress: "#1A2DC9",
    onBlue: "#FFFFFF",
    onBlueMuted: "#DDE3FF",
    blueTint: "#151C47",
    blueTint2: "#1C2560",
    blueText: "#93A9FF",

    green: "#01AD01", // same logo green; near-black text 6.3:1 works in dark too
    greenPress: "#2BCB2B",
    onGreen: "#06140A",
    greenTint: "#0F2A16",
    greenTint2: "#163A1F",
    greenText: "#4FD34C",

    red: "#CB2322",
    redPress: "#A81A19",
    onRed: "#FFFFFF",
    redTint: "#2E1515",
    redText: "#FF8A7D",
  },
} as const satisfies Record<"light" | "dark", Record<string, `#${string}`>>;

export type TokenName = keyof (typeof tokens)["light"];

const kebab = (s: string) => s.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase();
const vars = (set: Record<string, string>) =>
  Object.entries(set)
    .map(([k, v]) => `--c-${kebab(k)}:${v};`)
    .join("");

/** Scoped custom properties for the three theme states (forced light, forced dark, system). */
export const tokensCss =
  `[data-variant="c"]{${vars(tokens.light)}}` +
  `[data-variant="c"][data-theme="dark"]{${vars(tokens.dark)}}` +
  `@media (prefers-color-scheme: dark){[data-variant="c"][data-theme="system"]{${vars(tokens.dark)}}}`;
