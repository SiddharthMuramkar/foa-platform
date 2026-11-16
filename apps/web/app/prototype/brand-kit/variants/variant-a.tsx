// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant A "Whole logo": every derivative uses the complete, unchanged logo (tiles + paw mark + wordmark),
// on white where it needs a ground. Baseline that needs no product-owner decision. Brief: ../BRIEF.md.
// Layout: a scale-ladder hero (the real icons, largest to smallest) followed by a numbered ledger of
// derivatives, each with its mock, a 100% view and a stamp-spec card. Server components only.
//
// Assets: node apps/web/app/prototype/brand-kit/variants/a/build.mjs → public/prototype/brand-kit/a/*
// (+ a/report.json, the measurements shown on this page). Settings: a/stamp-settings.json.
import type { VariantProps } from "../fixtures";
import { IconsSection, ScaleLadder } from "./a/icons";
import { NotesSection, SettingsSection } from "./a/settings";
import { CertificateSection, JudgingSection, OgSection, WatermarkSection } from "./a/stamps";
import { Callout } from "./a/ui";

export const name = "Whole logo";

/**
 * Every colour this variant uses, so tokens can be lifted into packages/brand and contrast-checked.
 * Shared chrome mirrors globals.css (bk-*). `tab*`, `wallpaper*` and `appPlaceholder*` mock both OS themes on
 * purpose and are the same in light and dark. `asset*` are baked into the generated PNG/JPEG files.
 * Logo colours are not tokens: the logo is only ever the unchanged raster.
 */
export const tokens = {
  light: {
    bg: "#FAF8F4",
    surface: "#FFFFFF",
    fg: "#1A1A1A",
    muted: "#5A5650",
    border: "#D9D4CA",
    borderStrong: "#8C857A",
    primary: "#0055A5",
    plate: "#FFFFFF",
    sunken: "#F1EDE5",
    okSoft: "#E6F3EA",
    okText: "#00652F",
    okBorder: "#9CCBAA",
    warnSoft: "#FBF1DD",
    warnText: "#7A4A00",
    warnBorder: "#E2C48A",
    checkerA: "#ECE8E0",
    checkerB: "#D8D2C6",
    safeZone: "#A21CAF",
    chatBg: "#ECE5DA",
    chatBubble: "#FFFFFF",
    chatLinkCard: "#F4F1EC",
    chatText: "#1A1A1A",
    chatMuted: "#5A5650",
    tabStripLight: "#DFE1E5",
    tabActiveLight: "#FFFFFF",
    tabTextLight: "#1F1F1F",
    tabTextLightInactive: "#474747",
    tabStripDark: "#202124",
    tabActiveDark: "#35363A",
    tabTextDark: "#E8EAED",
    tabTextDarkInactive: "#BDC1C6",
    wallpaperLight: "#E6DFD1",
    wallpaperLightLabel: "#1A1A1A",
    wallpaperDark: "#1D2833",
    wallpaperDarkLabel: "#F2EFE9",
    appPlaceholderLight: "#C9C1B2",
    appPlaceholderDark: "#3A4652",
    assetPlate: "#FFFFFF",
    assetInk: "#1A1A1A",
    assetInkMuted: "#5A5650",
    assetAccent: "#0055A5",
    assetSeal: "#8A6116",
    assetSealFill: "#FBF5E6",
    assetFrame: "#CFC7B8",
    assetDivider: "#D9D4CA",
    assetMat: "#F3EFE7",
  },
  dark: {
    bg: "#121417",
    surface: "#1C1F24",
    fg: "#F2EFE9",
    muted: "#B4AFA6",
    border: "#3A3F47",
    borderStrong: "#6F7782",
    primary: "#7DB4F5",
    plate: "#FFFFFF",
    sunken: "#171A1E",
    okSoft: "#12261A",
    okText: "#6FD596",
    okBorder: "#2F6B45",
    warnSoft: "#2A2112",
    warnText: "#F2C46D",
    warnBorder: "#6B5326",
    checkerA: "#2A2E35",
    checkerB: "#3A3F47",
    safeZone: "#A21CAF",
    chatBg: "#0B141A",
    chatBubble: "#1F2C34",
    chatLinkCard: "#182229",
    chatText: "#E9EDEF",
    chatMuted: "#A9B5BC",
    tabStripLight: "#DFE1E5",
    tabActiveLight: "#FFFFFF",
    tabTextLight: "#1F1F1F",
    tabTextLightInactive: "#474747",
    tabStripDark: "#202124",
    tabActiveDark: "#35363A",
    tabTextDark: "#E8EAED",
    tabTextDarkInactive: "#BDC1C6",
    wallpaperLight: "#E6DFD1",
    wallpaperLightLabel: "#1A1A1A",
    wallpaperDark: "#1D2833",
    wallpaperDarkLabel: "#F2EFE9",
    appPlaceholderLight: "#C9C1B2",
    appPlaceholderDark: "#3A4652",
    assetPlate: "#FFFFFF",
    assetInk: "#1A1A1A",
    assetInkMuted: "#5A5650",
    assetAccent: "#0055A5",
    assetSeal: "#8A6116",
    assetSealFill: "#FBF5E6",
    assetFrame: "#CFC7B8",
    assetDivider: "#D9D4CA",
    assetMat: "#F3EFE7",
  },
} as const satisfies Record<"light" | "dark", Record<string, `#${string}`>>;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const vars = (t: Record<string, string>) =>
  Object.entries(t)
    .map(([k, v]) => `--va-${kebab(k)}:${v}`)
    .join(";");
// Same theme logic as globals.css: OS setting by default, [data-theme] (on <html> or the page wrapper) forces.
const CSS = [
  `.va{${vars(tokens.light)}}`,
  `@media (prefers-color-scheme: dark){.va{${vars(tokens.dark)}}}`,
  `[data-theme="light"] .va{${vars(tokens.light)}}`,
  `[data-theme="dark"] .va{${vars(tokens.dark)}}`,
  `.va-checker{background-color:var(--va-checker-a);background-image:conic-gradient(var(--va-checker-b) 25%,transparent 0 50%,var(--va-checker-b) 0 75%,transparent 0);background-size:12px 12px}`,
  `.va summary::-webkit-details-marker{display:none}`,
].join("\n");

const INDEX = [
  ["a-icons", "Favicons and app icons"],
  ["a-og", "Link preview (OG card)"],
  ["a-watermark", "Gallery watermark"],
  ["a-judging", "“FOA JUDGING” mark"],
  ["a-certificate", "Certificate share image"],
  ["a-settings", "Stamp settings"],
  ["a-notes", "Honest notes"],
] as const;

export default function VariantA({ shot }: VariantProps) {
  return (
    <main className="va mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
      <style href="foa-brand-kit-variant-a" precedence="default">
        {CSS}
      </style>

      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-bk-muted">Brand kit · Variant A</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">The whole logo, at every size</h1>
        <p className="mt-3 text-base leading-relaxed text-bk-muted sm:text-lg">
          Every derivative carries the complete, unchanged FOA logo: three tiles, paw mark and wordmark. Only scale, position
          and opacity change, and the logo always sits on white. Below: the real generated files, largest to smallest, then
          each stamped derivative with its spec.
        </p>
      </header>

      <div className="mt-6 max-w-3xl">
        <Callout tone="ok" title="No product-owner decision needed: this is the baseline">
          Nothing is cut out of the logo, so A needs no ruling on whether part of the logo may stand alone. Variants B and C
          do use a part of the logo at small sizes; that is a product-owner decision and it is <strong>not settled</strong>.
          What A costs is legibility at small sizes, measured on this page.
        </Callout>
      </div>

      <div className="mt-10">
        <h2 className="sr-only">Scale ladder</h2>
        <ScaleLadder />
      </div>

      <div className="mt-12 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Variant A sections" className="mb-10 lg:sticky lg:top-6 lg:mb-0 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-wider text-bk-muted">Derivatives</p>
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-1">
            {INDEX.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="flex gap-2 rounded py-0.5 text-bk-fg hover:text-bk-primary hover:underline">
                  <span aria-hidden="true" className="tabular-nums text-bk-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
          {shot ? null : (
            <p className="mt-6 hidden text-xs leading-relaxed text-bk-muted lg:block">
              Regenerate: <code className="break-all">node apps/web/app/prototype/brand-kit/variants/a/build.mjs</code>, then clear{" "}
              <code className="break-all">apps/web/.next/cache/images</code>.
            </p>
          )}
        </nav>

        <div className="min-w-0 space-y-14">
          <IconsSection />
          <OgSection />
          <WatermarkSection />
          <JudgingSection />
          <CertificateSection />
          <SettingsSection />
          <NotesSection />
        </div>
      </div>
    </main>
  );
}
