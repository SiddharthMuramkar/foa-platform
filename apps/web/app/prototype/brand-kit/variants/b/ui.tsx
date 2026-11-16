// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant B layout pieces: the PO-decision banner, the size ladder (this variant's primary affordance:
// every stamp ordered by the size it is shown at, split by one switch rule), sections and figures.
// Server components only; no client JS.
import Image from "next/image";
import type { ReactNode } from "react";
import { LOGO_FLAT_PNG } from "../../logo";
import { bFile, R, type BFile } from "./kit";
import { s } from "./cls";

export type Tier = "mark" | "logo";

export function TierChip({ tier }: { tier: Tier }) {
  return (
    <span
      className={`${tier === "mark" ? s.chipMark : s.chipLogo} inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold`}
    >
      {tier === "mark" ? "Mark" : "Full logo"}
    </span>
  );
}

export function PoBanner() {
  return (
    <section aria-labelledby="b-po-h" className={`${s.po} rounded-xl p-4 sm:p-5`}>
      <h2 id="b-po-h" className="text-base font-bold">
        Product-owner decision · not settled
      </h2>
      <p className="mt-2 text-sm leading-relaxed">
        This variant uses only <strong>part</strong> of the logo, the paw-and-hands mark, wherever the stamp is shown
        under {R.switchPx} px: favicons, app icons, the watermark badge and the judging badge. Whether the mark may stand
        alone, without the F·O·A tiles and the name, is the product owner&rsquo;s call. Nothing on this page means it has
        been agreed.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        <li>
          Also open: the word &ldquo;FOA&rdquo; in the badge is typed in Plus Jakarta Sans, not cut from the logo. Does a
          typed label next to the mark read as a second logo?
        </li>
        <li>Also open: the seal (every certificate needs one, FR-STAMP-02; any seal is new artwork).</li>
        <li>Ruled out here: a tri-colour ring around the app icon. It draws new shapes in the logo colours.</li>
      </ul>
    </section>
  );
}

/** `crop`: long badges show only their left end (mark + start of the label) in the 64 px thumb slot. */
type Rung = { href: string; px: number; label: string; tier: Tier; file?: BFile; logo?: boolean; crop?: boolean };

const RUNGS: Rung[] = [
  { href: "#b-favicons", px: 16, label: "Browser tab favicon (shown at real size)", tier: "mark", file: "icon-16.png" },
  { href: "#b-favicons", px: 32, label: "Same tab on a 2× screen", tier: "mark", file: "icon-32.png" },
  { href: "#b-favicons", px: 48, label: "Bookmarks, Windows tiles", tier: "mark", file: "icon-48.png" },
  { href: "#b-app-icons", px: 60, label: "Home-screen icon (180 and 512 px files)", tier: "mark", file: "icon-180.png" },
  { href: "#b-badges", px: R.badges.judging.h, label: "Judging badge height, 2560 px copy", tier: "mark", file: "badge-judging.png", crop: true },
  { href: "#b-badges", px: R.badges.preview.h, label: "Watermark badge height, 1600 px preview", tier: "mark", file: "badge-preview.png" },
  { href: "#b-og", px: R.settings.ogStamp.widthPx, label: "OG card sign-off (logo width)", tier: "logo", logo: true },
  { href: "#b-certificate", px: R.settings.certLogo.widthPx, label: "Certificate header (logo width)", tier: "logo", logo: true },
];

/** The size ladder: every stamp by the size it is shown at, with the one rule that picks the element. */
export function SizeLadder() {
  const markRungs = RUNGS.filter((r) => r.tier === "mark");
  const logoRungs = RUNGS.filter((r) => r.tier === "logo");
  const row = (r: Rung) => {
    const thumb = r.logo
      ? { src: LOGO_FLAT_PNG.src, width: LOGO_FLAT_PNG.width, height: LOGO_FLAT_PNG.height }
      : bFile(r.file as BFile);
    // Icons ≤ 32 px at true size; everything else fitted into a 64×32 slot.
    const real = !r.logo && thumb.width <= 32;
    return (
      <li key={`${r.px}-${r.label}`}>
        <a
          href={r.href}
          className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bk-bg focus-visible:bg-bk-bg"
        >
          <span className="flex h-8 w-16 shrink-0 items-center justify-center">
            <Image
              src={thumb.src}
              width={thumb.width}
              height={thumb.height}
              alt=""
              unoptimized
              className={
                real
                  ? ""
                  : r.crop
                    ? "h-6 w-16 object-cover object-left"
                    : "h-8 w-16 object-contain"
              }
              style={real ? { width: thumb.width === 32 ? 16 : thumb.width, height: thumb.width === 32 ? 16 : thumb.height } : undefined}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold tabular-nums">{r.px} px</span>
            <span className="block text-xs leading-snug text-bk-muted">{r.label}</span>
          </span>
          <TierChip tier={r.tier} />
        </a>
      </li>
    );
  };
  return (
    <nav aria-labelledby="b-ladder-h" className="rounded-xl border border-bk-border bg-bk-surface p-3">
      <h2 id="b-ladder-h" className="px-2 text-sm font-bold">
        Size ladder
      </h2>
      <p className="px-2 pt-1 text-xs leading-snug text-bk-muted">Shown size of each stamp. Jump to its section.</p>
      <ol className="mt-2 space-y-0.5">{markRungs.map(row)}</ol>
      <div className={`${s.switchRule} mx-2 my-2 pt-2`} role="separator" aria-label={`Switch point ${R.switchPx} px`}>
        <p className="text-xs font-bold">Switch at {R.switchPx} px</p>
        <p className="text-xs leading-snug text-bk-muted">
          At {R.switchPx} px wide the full logo&rsquo;s name is {R.wordmark.capAtSwitchPx} px tall. Smaller than that the
          name stops reading, so B shows the mark. From {R.switchPx} px up: the full logo, unchanged.
        </p>
      </div>
      <ol className="space-y-0.5">{logoRungs.map(row)}</ol>
    </nav>
  );
}

/** Divider between the two tiers of the ladder: the page's structure follows the switch rule. */
export function TierBand({ tier, title, children }: { tier: Tier; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-bk-border bg-bk-surface p-4">
      <TierChip tier={tier} />
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-bk-muted">{children}</p>
      </div>
    </div>
  );
}

export function Section({
  id,
  tier,
  title,
  lede,
  children,
}: {
  id: string;
  tier?: Tier;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`${id}-h`} className="text-xl font-bold sm:text-2xl">
          {title}
        </h2>
        {tier ? <TierChip tier={tier} /> : null}
      </div>
      {lede ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-bk-muted sm:text-base">{lede}</p> : null}
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}

export function Figure({ caption, children, className = "" }: { caption: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure className={`min-w-0 ${className}`}>
      {children}
      <figcaption className="mt-2 text-xs leading-snug text-bk-muted sm:text-sm">{caption}</figcaption>
    </figure>
  );
}

/** Wide content (100% views) scrolls inside its own box, never the page. */
export function ScrollBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-w-full overflow-x-auto rounded-lg border border-bk-border bg-bk-surface p-2"
    >
      {children}
    </div>
  );
}
