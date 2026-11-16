// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Mark tier, part 2: gallery preview watermark and the judging mark (SPEC §3.5 step 4, FR-STAMP-01/03).
// Public view shows only the SG-01 line from fixtures. Judging view is blind (SG-11): Submission number,
// category and title only, and it sits in its own block with no public line near it.
import Image from "next/image";
import { artwork, childDisplayLine, judgingView } from "../../fixtures";
import { bFile, kb, pct, R, r2 } from "./kit";
import { Figure, Section } from "./ui";

const preview = bFile("preview-watermarked.jpg");
const judging = bFile("judging-marked.jpg");
const judgingCrop = bFile("judging-crop.png");
const P = R.settings.previewBadge;
const J = R.settings.judgingBadge;

const PATCHES = [
  { key: "light", file: "badge-on-light.png", label: "Light artwork (cream paper)" },
  { key: "busy", file: "badge-on-busy.png", label: "Busy artwork (hatched hills)" },
  { key: "dark", file: "badge-on-dark.png", label: "Dark artwork (sample darkened)" },
] as const;

export function BadgeSection() {
  const c = R.contrast;
  return (
    <Section
      id="b-badges"
      tier="mark"
      title="Watermark and judging mark"
      lede={`Both are a white pill holding the mark plus a typed label. Public preview: “FOA”, ${P.placement}, ${pct(P.opacity)}. Judging copy: “FOA JUDGING” and the Submission number, ${J.placement}, ${pct(J.opacity)}, so a leaked judging image is never mistaken for a public one.`}
    >
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Figure
          caption={
            <>
              <span className="font-bold text-bk-fg">{artwork.title}</span>
              <br />
              {childDisplayLine}
              <br />
              Gallery preview, 1600×1200 JPEG ({kb(preview.bytes)}), scaled to fit.
            </>
          }
        >
          <Image
            src={preview.src}
            width={preview.width}
            height={preview.height}
            alt={`${artwork.alt}. FOA watermark badge bottom-right.`}
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 90vw, calc(100vw - 2rem)"
            className="h-auto w-full rounded-lg border border-bk-border"
          />
        </Figure>
        <Figure
          caption={`Bottom-right corner at 100% (the shipped JPEG, CSS-cropped). Badge ${R.badges.preview.w}×${R.badges.preview.h} px = ${P.heightPct}% of the long edge, inset ${P.insetPct}%.`}
        >
          <Image
            src={preview.src}
            width={preview.width}
            height={preview.height}
            alt="Close-up of the badge: green paw mark and the word FOA on a white pill"
            unoptimized
            className="h-[240px] w-full max-w-[480px] rounded-lg border border-bk-border object-none object-bottom-right"
          />
        </Figure>
      </div>

      <div>
        <h3 className="text-base font-bold">Same badge, three backgrounds</h3>
        <ul className="mt-3 grid gap-4 sm:grid-cols-3">
          {PATCHES.map((p) => {
            const f = bFile(p.file);
            const m = c[`preview-${p.key}`];
            return (
              <li key={p.key}>
                <Figure
                  caption={
                    <>
                      <span className="font-bold text-bk-fg">{p.label}</span>
                      <br />
                      Label {r2(m.labelOnPill)} · pill edge {r2(m.pillEdgeOnArtwork)} · mark green on pill {r2(m.markGreenOnPill)}
                    </>
                  }
                >
                  <Image
                    src={f.src}
                    width={f.width}
                    height={f.height}
                    alt=""
                    sizes="(min-width: 640px) 30vw, calc(100vw - 2rem)"
                    className="h-auto w-full rounded-lg border border-bk-border"
                  />
                </Figure>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-bk-muted">
          The pill makes the badge independent of the Artwork: the label stays above 11:1 on all three. On pale paper the
          pill&rsquo;s own edge almost vanishes ({r2(c["preview-light"].pillEdgeOnArtwork)}); the 16% hairline carries it.
          At {pct(P.opacity)} the mark&rsquo;s green-on-white drops from {r2(c.markGreenOnWhite)} to about{" "}
          {r2(c["preview-busy"].markGreenOnPill)}.
        </p>
      </div>

      <div className="rounded-xl border border-bk-border bg-bk-surface p-4">
        <h3 className="text-base font-bold">Judging view (blind)</h3>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-bk-muted">Submission</dt>
          <dd className="font-bold tabular-nums">{judgingView.submissionNumber}</dd>
          <dt className="text-bk-muted">Category</dt>
          <dd>{judgingView.category}</dd>
          <dt className="text-bk-muted">Title</dt>
          <dd>{judgingView.title}</dd>
        </dl>
        <div className="mt-4 grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Figure caption={`Judging derivative, 2560×1920 JPEG (${kb(judging.bytes)}), scaled to fit.`}>
            <Image
              src={judging.src}
              width={judging.width}
              height={judging.height}
              alt={`Submission ${judgingView.submissionNumber}, ${judgingView.title}, with a faint FOA JUDGING badge top-left`}
              sizes="(min-width: 1024px) 520px, (min-width: 768px) 85vw, calc(100vw - 4rem)"
              className="h-auto w-full rounded-lg border border-bk-border"
            />
          </Figure>
          <Figure
            caption={`Top-left at 100%. ${R.badges.judging.h} px tall (${J.heightPct}% of 2560) at ${pct(J.opacity)}: label ${r2(c.judging.labelOnPill)} on this pale corner, ${r2(c.judging.labelOnPillDarkArtwork)} on dark work.`}
          >
            <Image
              src={judgingCrop.src}
              width={judgingCrop.width}
              height={judgingCrop.height}
              alt="Close-up: the FOA JUDGING badge with the Submission number"
              unoptimized
              className="h-[160px] w-full max-w-[760px] rounded-lg border border-bk-border object-none object-top-left"
            />
          </Figure>
        </div>
      </div>
    </Section>
  );
}
