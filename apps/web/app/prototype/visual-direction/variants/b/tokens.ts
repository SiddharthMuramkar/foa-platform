// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant B "Editorial trust" colour tokens: the single source for both themes.
// `tokenCss` is generated from this object, so the exported `tokens` can never drift from what renders.
// Contrast (WCAG 2.2, computed with scripts/contrast.py; worst case across paper / paper2 / wall / surface):
//   light: ink ≥14.1, ink2 ≥6.3, blue ≥6.5, green ≥5.5, red ≥5.7, control (input borders) ≥3.2, focus ≥6.5
//   dark:  ink ≥14.0, ink2 ≥7.4, blue ≥7.2, green ≥7.7, red ≥6.7, control ≥4.2, focus ≥7.2
//   white on donate #CB2322 = 5.5 (both themes), white on donateHover ≥6.9, onInk on ink ≥16
// tileRed/Green/Blue are decorative wayfinding rules and markers (always paired with text), never text or fills.
// Red appears as a solid fill ONLY via `donate` (Donate buttons).

export const tokens = {
  light: {
    paper: "#FAF8F4", // page canvas (off-white, SPEC §4.8)
    paper2: "#F2EEE6", // alternate band (donate, sampler panels)
    wall: "#ECE7DD", // gallery wall behind the featured Artwork
    surface: "#FFFFFF", // wall labels, menus, inputs
    mat: "#FFFFFF", // passe-partout around Artworks
    ink: "#1B1A17", // body text, primary button fill, section rules
    ink2: "#56524A", // secondary text
    inkHover: "#3A3832", // primary button hover
    onInk: "#FAF8F4", // text on primary button
    line: "#DCD6CB", // decorative hairlines
    control: "#857F73", // input / chip borders (≥3:1)
    blue: "#2337D9", // links, info labels (logo blue, deepened)
    green: "#006B00", // "open" / success text (logo green, deepened)
    red: "#B0161A", // error text, Donate section label (logo red, deepened)
    donate: "#CB2322", // exact logo red: solid fill for Donate only
    donateHover: "#A8191A",
    onDonate: "#FFFFFF",
    focus: "#2337D9",
    logoPlate: "#FAF8F4", // = paper: invisible in light
    tileRed: "#CB2322", // exact logo colours as thin rules / markers
    tileGreen: "#01AD01",
    tileBlue: "#263FF1",
    chart1: "#1B1A17",
    chart2: "#2337D9",
    chart3: "#006B00",
    chart4: "#B8B1A4",
    footerBg: "#1B1A17",
    footerInk: "#F2EEE6",
    footerInk2: "#B5AEA1",
    footerLine: "#3A3731",
    footerLink: "#A9BCFF",
    footerControl: "#8A8477",
    footerBtnHover: "#D9D3C7",
    shadow: "#000000",
  },
  dark: {
    paper: "#131210",
    paper2: "#1B1A17",
    wall: "#1E1C19",
    surface: "#22201C",
    mat: "#EFEAE0", // Artworks keep a light mat in the dark, like a lit gallery
    ink: "#F2EEE6",
    ink2: "#B5AEA1",
    inkHover: "#D9D3C7",
    onInk: "#131210",
    line: "#38352F",
    control: "#878074",
    blue: "#8FA9FF",
    green: "#4FCB4A",
    red: "#FF8174",
    donate: "#CB2322",
    donateHover: "#B01E1D",
    onDonate: "#FFFFFF",
    focus: "#8FA9FF",
    logoPlate: "#FFFFFF", // black wordmark needs a light plate on dark surfaces
    tileRed: "#E54139",
    tileGreen: "#01AD01",
    tileBlue: "#4972FF",
    chart1: "#F2EEE6",
    chart2: "#8FA9FF",
    chart3: "#4FCB4A",
    chart4: "#6B655B",
    footerBg: "#0C0B0A",
    footerInk: "#F2EEE6",
    footerInk2: "#ABA497",
    footerLine: "#2E2B27",
    footerLink: "#A9BCFF",
    footerControl: "#7A7468",
    footerBtnHover: "#D9D3C7",
    shadow: "#000000",
  },
} as const satisfies Record<"light" | "dark", Record<string, `#${string}`>>;

export type TokenName = keyof typeof tokens.light;

const kebab = (s: string) => s.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`);
const decls = (t: Record<string, string>) =>
  Object.entries(t)
    .map(([k, v]) => `--b-${kebab(k)}:${v};`)
    .join("");

/** Scoped custom properties: `[data-variant="b"]` only (all variants' CSS loads on every URL). */
export const tokenCss =
  `[data-variant="b"]{${decls(tokens.light)}}` +
  `[data-variant="b"][data-theme="dark"]{${decls(tokens.dark)}}` +
  `@media (prefers-color-scheme: dark){[data-variant="b"][data-theme="system"]{${decls(tokens.dark)}}}`;
