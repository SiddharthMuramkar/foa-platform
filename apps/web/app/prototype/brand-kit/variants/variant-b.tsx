// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant B "Paw mark". One rule decides every stamp: shown under 160 px → the paw-and-hands mark alone
// (exact pixels) on a white disc or pill; 160 px and up → the full logo, unchanged. The page is organised
// as a size ladder (smallest stamp first) split at that switch point, not by asset type.
// Assets: ./b/build.mjs → public/prototype/brand-kit/b/*. Server components only; no client JS.
import type { VariantProps } from "../fixtures";
import { BadgeSection } from "./b/badges";
import "./b/b.css";
import { s } from "./b/cls";
import { CertificateSection } from "./b/certificate";
import { AppIconSection, FaviconSection } from "./b/icons";
import { R } from "./b/kit";
import { OgSection } from "./b/og";
import { NotesSection, SettingsSection } from "./b/settings";
import { themeStyle, tokens as bTokens } from "./b/tokens";
import { PoBanner, SizeLadder, TierBand } from "./b/ui";

export const name = "Paw mark";

/** Every colour this variant uses (page + baked into assets), light and dark. */
export const tokens = bTokens;

export default function VariantB({ shot }: VariantProps) {
  return (
    <main className={`${s.root} mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10`} style={themeStyle}>
      <header className="max-w-3xl">
        <p className="text-sm font-bold text-bk-primary">Brand kit · Variant B</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{name}</h1>
        <p className="mt-3 text-base leading-relaxed text-bk-muted sm:text-lg">
          Small things wear the paw. Anything shown under {R.switchPx} px carries only the paw-and-hands mark, cut
          pixel-for-pixel from the logo. From {R.switchPx} px up, the full logo, unchanged.
        </p>
      </header>

      <div className="mt-6">
        <PoBanner />
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="mb-10 lg:sticky lg:top-6 lg:mb-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
          <SizeLadder />
        </aside>
        <div className="min-w-0 space-y-12">
          <TierBand tier="mark" title={`Mark tier · shown under ${R.switchPx} px`}>
            Favicons, app icons, the watermark and the judging badge. The paw-and-hands mark alone, on white.
          </TierBand>
          <FaviconSection />
          <AppIconSection />
          <BadgeSection />
          <TierBand tier="logo" title={`Full-logo tier · ${R.switchPx} px and up`}>
            OG card and certificate. Tiles, mark and name exactly as supplied, on white.
          </TierBand>
          <OgSection />
          <CertificateSection />
          <SettingsSection />
          <NotesSection />
          {shot ? null : (
            <p className="border-t border-bk-border pt-6 text-xs leading-relaxed text-bk-muted">
              Regenerate: <code>node apps/web/app/prototype/brand-kit/variants/b/build.mjs</code>, then{" "}
              <code>rm -rf apps/web/.next/cache/images</code>. Logo pixels come from <code>foa-logo-flat.png</code>{" "}
              (stand-in until #6 lands).
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
