// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant A, stamped derivatives: OG card, gallery watermark, judging mark, certificate share image.
// Child data: only the SG-01 allow-list from fixtures.ts (display name, category label, School, city/state/
// country, Competition, award). Judging view is blind (SG-11).
import Image from "next/image";
import {
  artwork,
  certificateShare,
  childDisplayLine,
  competition,
  creditLine,
  judgingView,
} from "../../fixtures";
import report from "./report.json";
import settings from "./stamp-settings.json";
import { aFile, Caption, OpenFile, Section, SpecCard, Sub, TrueSize, type FileKey } from "./ui";

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const ogTitle = `${artwork.title} · ${competition.title}`;

// -------------------------------------------------------------------------------------------------------
// 2. OG card
// -------------------------------------------------------------------------------------------------------
export function OgSection() {
  const og = aFile("og-card.png");
  const o = settings.og;
  return (
    <Section
      id="a-og"
      n={2}
      title="Link preview (OG card)"
      ships={
        <>
          <code>og-card.png</code> 1200×630: white band with the logo top-left, Artwork right
        </>
      }
      spec={["§3.5 step 4", "FR-STAMP-01", "SG-01"]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Sub title="Chat app">
          <figure>
            <div className="w-full max-w-[390px] rounded-2xl bg-(--va-chat-bg) p-3">
              <div className="ml-auto w-[88%] rounded-xl bg-(--va-chat-bubble) p-1.5 text-(--va-chat-text) shadow-sm">
                <div className="overflow-hidden rounded-lg bg-(--va-chat-link-card)">
                  <Image src={og.src} width={og.width} height={og.height} sizes="(min-width: 640px) 330px, 78vw" alt="FOA link preview card: the whole logo on a white band beside the crayon Artwork" className="h-auto w-full" />
                  <div className="space-y-0.5 p-2.5">
                    <p className="text-sm font-bold leading-snug">{ogTitle}</p>
                    <p className="text-xs leading-snug text-(--va-chat-muted)">{creditLine}</p>
                    <p className="text-xs text-(--va-chat-muted)">foaglobal.org</p>
                  </div>
                </div>
                <p className="px-1.5 pb-0.5 pt-1.5 text-sm">Our class entry is in the gallery!</p>
              </div>
              <div className="mt-3 flex w-[88%] items-center gap-3 rounded-xl bg-(--va-chat-bubble) p-1.5 text-(--va-chat-text) shadow-sm">
                <Image src={og.src} width={og.width} height={og.height} sizes="72px" alt="The same card in a square thumbnail: centre crop" className="size-[72px] shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 py-1 pr-1">
                  <p className="truncate text-sm font-bold">{ogTitle}</p>
                  <p className="truncate text-xs text-(--va-chat-muted)">foaglobal.org</p>
                </div>
              </div>
            </div>
            <Caption>
              Large preview at phone width: the logo is about 80 px wide and the wordmark about 6 px tall, legible on a sharp screen
              but only just. Compact square thumbnails
              (second bubble) take the centre: <strong className="text-bk-fg">the logo falls outside the crop.</strong>
            </Caption>
          </figure>
        </Sub>
        <Sub title="Social card">
          <figure>
            <div className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-bk-border bg-bk-surface">
              <Image src={og.src} width={og.width} height={og.height} sizes="(min-width: 640px) 390px, calc(100vw - 32px)" alt="FOA social card preview" className="aspect-[1.91/1] h-auto w-full object-cover" />
              <div className="space-y-0.5 border-t border-bk-border p-3">
                <p className="text-xs text-bk-muted">foaglobal.org</p>
                <p className="text-sm font-bold leading-snug">{ogTitle}</p>
                <p className="text-xs leading-snug text-bk-muted">{creditLine}</p>
              </div>
            </div>
            <Caption>
              The card carries no per-Artwork text: title and credit line live in <code>og:title</code>/<code>og:description</code>. The
              image is made at upload (§3.5 step 4), before the title or display name are final, so baked-in text would go
              stale; it also keeps a minor&apos;s name out of the pixels.
            </Caption>
          </figure>
        </Sub>
      </div>

      <Sub title="At 50%" aside={<OpenFile file="og-card.png" label="Open the card at 100%" />}>
        <figure>
          <Image unoptimized src={og.src} width={og.width} height={og.height} alt="OG card at half size" style={{ width: 600 }} className="h-auto max-w-full rounded-lg ring-1 ring-bk-border" />
          <Caption>
            Logo {report.og.logoWidth}×{report.og.logoHeight} px at {o.margin} px from the corner; band {o.bandWidth} px. The Artwork is
            contained in the {o.width - o.bandWidth}×{o.height} slot, never cropped; other aspect ratios get a {o.mat} mat.
          </Caption>
        </figure>
      </Sub>

      <details className="group rounded-xl border border-bk-border bg-bk-surface">
        <summary className="cursor-pointer list-none p-4 text-sm font-bold">
          <span aria-hidden="true" className="mr-2 inline-block motion-safe:transition-transform group-open:rotate-90">›</span>
          Show the card at 100% (1200×630)
        </summary>
        <div className="px-4 pb-4">
          <TrueSize label="OG card at 100 percent, scroll sideways">
            <Image unoptimized src={og.src} width={og.width} height={og.height} alt="OG card at full size" className="max-w-none" />
          </TrueSize>
        </div>
      </details>

      <SpecCard
        rows={[
          ["Element", "Whole logo on the white band (its own white background, no plate edge)"],
          ["Placement", `Top-left, ${o.margin} px margin, ${o.logoWidth} px wide`],
          ["Opacity", "100%"],
          ["Text", `Static only: “${o.tagline}”, “${o.footer}”`],
          ["Artwork", "Never cropped, never under the logo"],
        ]}
      />
    </Section>
  );
}

// -------------------------------------------------------------------------------------------------------
// 3. Gallery preview watermark
// -------------------------------------------------------------------------------------------------------
export function WatermarkSection() {
  const p = settings.preview;
  const w = report.watermark;
  const prev = aFile("preview-watermarked.jpg");
  const dark = aFile("preview-watermarked-dark.jpg");
  const def = w.ladder.find((l) => l.opacity === p.opacity);
  return (
    <Section
      id="a-watermark"
      n={3}
      title="Gallery preview watermark"
      ships={
        <>
          <code>preview-watermarked.jpg</code> 1600×1200: whole logo bottom-right at {pct(p.opacity)} on a soft white backing
        </>
      }
      spec={["FR-STAMP-01", "FR-STAMP-03", "FR-STAMP-04", "FR-SOCIAL-02", "SG-01"]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Sub title="Public gallery card">
          <article className="overflow-hidden rounded-2xl border border-bk-border bg-bk-surface">
            <Image src={prev.src} width={prev.width} height={prev.height} sizes="(min-width: 1024px) 560px, calc(100vw - 32px)" alt={artwork.alt} className="h-auto w-full" />
            <div className="space-y-1 p-4">
              <h4 className="font-bold">{artwork.title}</h4>
              <p className="text-sm text-bk-muted">{childDisplayLine}</p>
              <p className="text-sm text-bk-muted">{competition.title}</p>
            </div>
          </article>
        </Sub>
        <Sub title="Corner at 100%">
          <figure>
            <TrueSize label="Watermark corner at 100 percent, scroll sideways">
              <Image unoptimized src={aFile("wm-crop-light-op18.png").src} width={440} height={300} alt={`Bottom-right corner at 100%: the logo at ${pct(p.opacity)} on a white backing`} className="max-w-none rounded" />
            </TrueSize>
            <Caption>
              Logo {w.box.logoW} px wide ({pct(p.scale)} of the long edge), {pct(p.margin)} margin. Multiply blend, so the logo&apos;s
              white JPEG ground drops out and no pale rectangle prints; on white the colours are exact.
            </Caption>
          </figure>
        </Sub>
      </div>

      <Sub title="Opacity ladder, measured" aside={<span className="text-xs text-bk-muted">contrast on output pixels · unstamped logo: letters {w.reference.lettersVsTiles}:1, wordmark {w.reference.wordmark}:1</span>}>
        <div className="space-y-4">
          {(["light", "dark"] as const).map((surface) => (
            <div key={surface}>
              <p className="mb-2 text-sm font-bold">{surface === "light" ? "Light Artwork (the fixture)" : "Dark Artwork (the fixture, inverted; test surface only)"}</p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {w.ladder.map((l) => {
                  const tag = Math.round(l.opacity * 100);
                  const f = aFile(`wm-crop-${surface}-op${tag}.png` as FileKey);
                  const m = l[surface];
                  const isDefault = l.opacity === p.opacity;
                  return (
                    <li key={tag} className={`rounded-lg border p-1.5 ${isDefault ? "border-bk-border-strong bg-bk-surface" : "border-bk-border"}`}>
                      <Image unoptimized src={f.src} width={f.width} height={f.height} alt={`Watermark at ${tag}% on ${surface} Artwork`} className="h-auto w-full rounded" />
                      <p className="mt-1.5 text-sm font-bold">
                        {tag}%{isDefault ? <span className="ml-1.5 rounded bg-bk-fg px-1.5 py-0.5 text-[11px] text-bk-bg">default</span> : null}
                      </p>
                      <p className="text-xs tabular-nums text-bk-muted">
                        letters {m.lettersVsTiles}:1 · wordmark {m.wordmark}:1
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-bk-muted">
          At the {pct(p.opacity)} default the logo is a ghost: letters against tiles {def?.light.lettersVsTiles}:1, wordmark {def?.light.wordmark}:1.
          It says &ldquo;FOA stamped this&rdquo; without being readable. 50% is the first step where the wordmark passes 3:1.
        </p>
      </Sub>

      <Sub title="Busy or dark corner rule">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-start">
          <figure>
            <Image src={dark.src} width={dark.width} height={dark.height} sizes="(min-width: 768px) 320px, calc(100vw - 32px)" alt="Dark test surface with the watermark: the backing is raised so the stamp stays visible" className="h-auto w-full rounded-lg" />
            <Caption>Dark test surface. Corner luminance {w.dark.luma} is under {p.busy.lumaBelow}, so the backing rises to {pct(w.dark.backingOpacity)}.</Caption>
          </figure>
          <SpecCard
            title="Rule (runs in the worker)"
            rows={[
              ["Measure", "Greyscale mean and spread of the Artwork under the stamp box"],
              ["Normal", `Backing ${pct(p.backing.opacity)} (light fixture: luma ${w.light.luma}, spread ${w.light.std})`],
              ["Busy or dark", `Luma < ${p.busy.lumaBelow} or spread > ${p.busy.stdAbove} → backing ${pct(p.busy.backingOpacity)}`],
              ["Never", "Move the stamp onto the Artwork's subject, recolour or outline the logo"],
              ["Override", "Staff can set placement per asset (FR-STAMP-03 setting)"],
            ]}
          />
        </div>
      </Sub>

      <div className="flex flex-col gap-2">
        <OpenFile file="preview-watermarked.jpg" />
        <OpenFile file="preview-watermarked-dark.jpg" />
      </div>
    </Section>
  );
}

// -------------------------------------------------------------------------------------------------------
// 4. Judging derivative
// -------------------------------------------------------------------------------------------------------
export function JudgingSection() {
  const j = settings.judging;
  const img = aFile("judging-marked.jpg");
  const crop = aFile("judging-crop.png");
  return (
    <Section
      id="a-judging"
      n={4}
      title="“FOA JUDGING” mark"
      ships={
        <>
          <code>judging-marked.jpg</code> 2560×1920: label top-left (whole logo + text), {pct(j.opacity)}
        </>
      }
      spec={["§3.5 step 4", "SG-11", "FR-JUDGE-03", "FR-STAMP-03"]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Sub title="Blind judging view">
          <article className="overflow-hidden rounded-2xl border border-bk-border bg-bk-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-bk-border px-4 py-3">
              <p className="text-sm font-bold tabular-nums">{judgingView.submissionNumber}</p>
              <p className="text-xs text-bk-muted">{judgingView.category}</p>
            </div>
            <Image src={img.src} width={img.width} height={img.height} sizes="(min-width: 1024px) 560px, calc(100vw - 32px)" alt={`${judgingView.title}, judging copy with the FOA JUDGING label`} className="h-auto w-full" />
            <p className="px-4 py-3 font-bold">{judgingView.title}</p>
          </article>
          <p className="mt-2 text-sm text-bk-muted">Submission number, category and title only (SG-11).</p>
        </Sub>
        <SpecCard
          rows={[
            ["Element", `Whole logo + “${j.text}” / “${j.subtext}” on a ${pct(j.plate.opacity)} white plate`],
            ["Placement", `Top-left, ${pct(j.margin)} margin; opposite the public watermark`],
            ["Opacity", `${pct(j.opacity)} for the whole label`],
            ["Scale", `Logo ${report.judging.logoWidth} px (${pct(j.scale)} of the long edge)`],
            ["Why", "A leaked judging copy is never mistaken for a public preview, and a public preview never says JUDGING"],
          ]}
        />
      </div>
      <Sub title="Label at 100%" aside={<OpenFile file="judging-marked.jpg" />}>
        <TrueSize label="Judging label at 100 percent, scroll sideways">
          <Image unoptimized src={crop.src} width={crop.width} height={crop.height} alt="Top-left corner of the judging copy at 100%: the FOA JUDGING label" className="max-w-none rounded" />
        </TrueSize>
      </Sub>
    </Section>
  );
}

// -------------------------------------------------------------------------------------------------------
// 5. Certificate share image
// -------------------------------------------------------------------------------------------------------
export function CertificateSection() {
  const c = settings.certificate;
  const img = aFile("certificate-share.png");
  const r = report.certificate;
  return (
    <Section
      id="a-certificate"
      n={5}
      title="Certificate share image"
      ships={
        <>
          <code>certificate-share.png</code> 1080×1350: whole logo top-centre, seal bottom-left, number + QR bottom-right
        </>
      }
      spec={["FR-CERT-03", "FR-STAMP-02", "§4.4", "SG-01", "BR-63"]}
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] md:items-start">
        <figure>
          <Image src={img.src} width={img.width} height={img.height} sizes="(min-width: 768px) 360px, calc(100vw - 32px)" alt={`Certificate share image: FOA logo, ${certificateShare.title} awarded to ${certificateShare.recipientDisplayName}, ${certificateShare.award}, gold seal, number ${certificateShare.number} and QR code`} className="h-auto w-full rounded-xl shadow-md ring-1 ring-bk-border" />
          <Caption>Shown at one third. The QR is a placeholder and does not scan.</Caption>
        </figure>
        <div className="space-y-4">
          <SpecCard
            rows={[
              ["Logo", `Whole logo, ${r.logo.w}×${r.logo.h} px, top-centre at y ${r.logo.y}; the white card is its plate`],
              ["Seal", `Typographic rosette in ${c.sealColour}, no logo part (so no PO decision)`],
              ["Number", `${certificateShare.number} (§4.4) under the QR`],
              ["QR", `${r.qr.size} px, to ${certificateShare.verifyUrlLabel}`],
              ["Name", `${certificateShare.recipientDisplayName}: approved display name, because the image is public`],
              ["Gate", "Rendered only from an ISSUED, non-revoked certificate"],
            ]}
          />
          <OpenFile file="certificate-share.png" />
        </div>
      </div>
    </Section>
  );
}
