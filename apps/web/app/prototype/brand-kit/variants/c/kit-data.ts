// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant C "Tile trio": data for the page (tokens, kit manifest, FR-STAMP-03 defaults). Numbers quoted on the
// page come from ./report.json, which ./build.mjs writes from the generated files.
import { KIT_PUBLIC_DIR, type StampSettings } from "../../fixtures";
import report from "./report.json";

export { report };

/** Public URL of a file in this variant's kit folder. */
export const cAsset = (file: string) => `${KIT_PUBLIC_DIR}/c/${file}`;

/**
 * Every colour this variant uses, per theme. Injected once as CSS custom properties (`--c-*`) by
 * <CTokens/>; Tailwind classes read them (`bg-(--c-flag-bg)`). `bk*` mirror the shared, pre-checked tokens
 * in globals.css. `img*` are baked into the generated images (same in both themes). Mock colours for the
 * light and dark browser tab bars are shown side by side in both themes, so they repeat unchanged.
 *
 * Contrast (WCAG 2.2, checked with the relative-luminance formula):
 *   light  flag text 15.9:1 on flag-bg · flag border 5.1:1 · badge text 14.3:1 · chat fg 17.5:1 · chat muted 6.1:1
 *          · chat link 7.4:1 · wall label 12.9:1 · safe-zone ring 5.9:1 on the white icon
 *   dark   flag text 12.5:1 · flag border 6.5:1 · badge text 9.6:1 · chat fg 12.1:1 · chat muted 7.2:1
 *          · chat link 6.6:1 · wall label 16.3:1
 *   mocks  tab text 16.5:1 (light) / 10.0:1 (dark) · inactive tab 7.1:1 / 8.9:1
 *   images muted 7.3:1 and primary 7.4:1 on white
 */
const shared = {
  // Logo tile colours (measured, logo-geometry.json). Used ONLY for the tri-colour rule, never to repaint the logo.
  tileRed: "#cb2322",
  tileGreen: "#01ad01",
  tileBlue: "#263ff1",
  // Maskable safe-zone ring, always drawn over the white icon.
  safeZone: "#c2007a",
  // Browser tab bar mocks (both shown in every theme).
  tabStripLight: "#dee1e6",
  tabActiveLight: "#ffffff",
  tabTextLight: "#1f1f1f",
  tabInactiveLight: "#45474a",
  tabStripDark: "#202124",
  tabActiveDark: "#35363a",
  tabTextDark: "#e8eaed",
  tabInactiveDark: "#bdc1c6",
  // Phone wallpapers (light phone + dark phone, both shown).
  wallLight: "#cfe0ee",
  wallLightFg: "#1a1a1a",
  wallLightIcon: "#9fb3c6",
  wallDark: "#17212b",
  wallDarkFg: "#ffffff",
  wallDarkIcon: "#3b4b5c",
  // Baked into the generated images.
  imgPaper: "#ffffff",
  imgInk: "#1a1a1a",
  imgMuted: "#5a5650",
  imgRule: "#d9d4ca",
  imgPrimary: "#0055a5",
} as const;

export const C_TOKENS = {
  light: {
    bkBg: "#faf8f4",
    bkSurface: "#ffffff",
    bkFg: "#1a1a1a",
    bkMuted: "#5a5650",
    bkBorder: "#d9d4ca",
    bkBorderStrong: "#8c857a",
    bkPrimary: "#0055a5",
    bkPlate: "#ffffff",
    flagBg: "#fff4d6",
    flagBorder: "#8a6100",
    badgeBg: "#ffe7a3",
    chatBg: "#efeae2",
    chatBubble: "#ffffff",
    chatFg: "#111b21",
    chatMuted: "#54656f",
    chatLink: "#0055a5",
    ...shared,
  },
  dark: {
    bkBg: "#121417",
    bkSurface: "#1c1f24",
    bkFg: "#f2efe9",
    bkMuted: "#b4afa6",
    bkBorder: "#3a3f47",
    bkBorderStrong: "#6f7782",
    bkPrimary: "#7db4f5",
    bkPlate: "#ffffff",
    flagBg: "#33290f",
    flagBorder: "#d9a72b",
    badgeBg: "#4a3a0e",
    chatBg: "#0b141a",
    chatBubble: "#1f2c34",
    chatFg: "#e9edef",
    chatMuted: "#aebac1",
    chatLink: "#7db4f5",
    ...shared,
  },
} as const;

export type CTokenName = keyof (typeof C_TOKENS)["light"];

/** FR-STAMP-03 defaults this variant proposes (placement and opacity are settings). */
export const STAMP_DEFAULTS = {
  previewWatermark: { placement: "bottom-left", opacity: 1, scale: 0.1 },
  previewRule: { placement: "bottom-edge", opacity: 1, scale: 0.00625 },
  judgingMark: { placement: "tiled-diagonal", opacity: report.judging.opacity, scale: 0.0375 },
  ogStamp: { placement: "top-right", opacity: 1, scale: 0.275 },
} satisfies Record<string, StampSettings>;

export type ManifestRow = {
  files: string[];
  px: string;
  element: string;
  part: boolean;
  plate: string;
  use: string;
  thumb: { src: string; width: number; height: number; unoptimized: boolean };
};

const r = report;

export const MANIFEST: ManifestRow[] = [
  {
    files: ["icon-16.png", "icon-32.png", "icon-48.png"],
    px: "16, 32, 48",
    element: "Tile trio (F, O, A tiles; no wordmark), 94 % of the width",
    part: true,
    plate: "White rounded square, transparent corners",
    use: "Favicon (<link rel=\"icon\">)",
    thumb: { src: cAsset("icon-48.png"), width: 48, height: 48, unoptimized: true },
  },
  {
    files: ["icon-180.png"],
    px: "180",
    element: "Tile trio, 152 px wide",
    part: true,
    plate: "White square (iOS rounds the corners)",
    use: "apple-touch-icon",
    thumb: { src: cAsset("icon-180.png"), width: 180, height: 180, unoptimized: true },
  },
  {
    files: ["icon-maskable-512.png"],
    px: "512",
    element: `Tile trio, ${Math.round(r.icons["icon-maskable-512.png"].logoPx.w)} px wide, inside the 80 % safe circle`,
    part: true,
    plate: "White, full bleed",
    use: "PWA manifest icon (purpose: maskable)",
    thumb: { src: cAsset("icon-maskable-512.png"), width: 512, height: 512, unoptimized: true },
  },
  {
    files: ["og-card.png"],
    px: "1200 × 630",
    element: `Whole logo, ${r.og.logoWidth} px wide, right column`,
    part: false,
    plate: "None needed: the card is white. Tile-rhythm frame around the Artwork",
    use: "OG / social image (§3.5 step 4 og derivative)",
    thumb: { src: cAsset("og-card.png"), width: 1200, height: 630, unoptimized: false },
  },
  {
    files: ["preview-watermarked.jpg"],
    px: "1600 × 1200",
    element: `Whole logo, ${r.watermark.logoWidth} px wide, corner plate + tri-colour rule`,
    part: false,
    plate: "White corner plate, flush bottom-left",
    use: "Gallery preview (§3.5 preview derivative, FR-STAMP-01)",
    thumb: { src: cAsset("preview-watermarked.jpg"), width: 1600, height: 1200, unoptimized: false },
  },
  {
    files: ["judging-marked.jpg"],
    px: "2560 × 1920",
    element: `Tile trio + "FOA JUDGING", repeated at ${Math.round(r.judging.opacity * 100)} %`,
    part: true,
    plate: "None",
    use: "Judging derivative (§3.5 judging, blind per SG-11)",
    thumb: { src: cAsset("judging-marked.jpg"), width: 2560, height: 1920, unoptimized: false },
  },
  {
    files: ["certificate-share.png"],
    px: "1080 × 1350",
    element: `Whole logo header, ${r.certificate.logoWidth} px; tile trio inside the seal`,
    part: true,
    plate: "None needed: the certificate is white",
    use: "Certificate share PNG (FR-CERT-03, FR-STAMP-02)",
    thumb: { src: cAsset("certificate-share.png"), width: 1080, height: 1350, unoptimized: false },
  },
];

export type SettingRow = {
  element: string;
  placement: string;
  opacity: string;
  scale: string;
  minimum: string;
  busyDark: string;
  part: boolean;
};

export const SETTINGS: SettingRow[] = [
  {
    element: "Preview watermark: whole logo on a white plate",
    placement: "bottom-left, flush to both edges (option: bottom-right, mirrored)",
    opacity: "100 % (setting range 60–100 %)",
    scale: `logo width 10 % of the long edge (${r.watermark.logoWidth} px at 1600)`,
    minimum: "logo 120 px wide (wordmark about 9 px tall); below that the wordmark smears",
    busyDark: "Plate always on. It is what keeps the tile colours and the black wordmark true on any Artwork.",
    part: false,
  },
  {
    element: "Tri-colour rule (new device, see notes)",
    placement: "bottom edge, from the plate to the far edge",
    opacity: "100 % (setting: on / off)",
    scale: `${r.watermark.strip} px at 1600 (0.625 % of the long edge)`,
    minimum: "4 px",
    busyDark: "No change. On red, green or blue edges it can blend in; the plate still carries the brand.",
    part: false,
  },
  {
    element: "Judging mark: tile trio + \"FOA JUDGING\"",
    placement: `tiled-diagonal: upright units every ${r.judging.dx} px across and ${r.judging.dy} px down, rows shifted ${r.judging.shift} px`,
    opacity: `${Math.round(r.judging.opacity * 100)} % (setting range 6–14 %)`,
    scale: `trio ${r.judging.trioWidth} px, text ${r.judging.fontSize} px at 2560`,
    minimum: "trio 64 px",
    busyDark: "Two tones at the same opacity: dark ink with a white halo, so it shows on light and on dark Artwork. No plate.",
    part: true,
  },
  {
    element: "OG stamp: whole logo",
    placement: "right column, top (the Artwork never sits behind it)",
    opacity: "100 %",
    scale: `${r.og.logoWidth} px (27.5 % of the card width)`,
    minimum: "240 px",
    busyDark: "Not affected: the logo sits on the white card, beside the Artwork.",
    part: false,
  },
  {
    element: "Certificate: whole logo header + trio seal",
    placement: "logo top centre; seal bottom-left; QR bottom-right",
    opacity: "100 %",
    scale: `logo ${r.certificate.logoWidth} px (37 % of the width); trio ${r.certificate.sealTrioWidth} px in the seal`,
    minimum: "logo 300 px",
    busyDark: "Not affected: white certificate.",
    part: true,
  },
];
