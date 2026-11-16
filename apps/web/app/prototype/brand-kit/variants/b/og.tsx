// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Logo tier, part 1: OG card 1200×630 (SPEC §3.5 step 4). The Artwork is never cropped (840×630 is exactly
// 4:3); the full logo signs off at the bottom of the white panel, like an artist's stamp.
// Link-preview mocks are generic (no real app's branding).
import Image from "next/image";
import { artwork, child, childDisplayLineShort, competition, creditLine } from "../../fixtures";
import { bFile, kb, R } from "./kit";
import { Figure, ScrollBox, Section } from "./ui";
import { s } from "./cls";

const og = bFile("og-card.png");
const ogJpg = bFile("og-card-q82.jpg");
const OG_ALT = `Link preview image: the drawing “${artwork.title}” on the left; on the right the title, ${childDisplayLineShort}, and the full Friends of Animals logo at the bottom`;
const PAGE_TITLE = `${artwork.title} · ${competition.title}`;

export function OgSection() {
  return (
    <Section
      id="b-og"
      tier="logo"
      title="OG card 1200×630"
      lede={`Artwork left at 840×630, uncropped. White panel right: Competition, title, the public line (${child.displayName}, category, city), and the full logo ${R.og.logoPx.w} px wide at the bottom. The logo signs the card; the Artwork leads.`}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Figure caption="Chat app, 390 px wide, large preview (generic mock, follows the page theme)">
          <div className={`${s.chat} mx-auto max-w-[390px] rounded-xl border border-bk-border p-3`}>
            <div className={`${s.bubble} ml-auto max-w-[320px] overflow-hidden rounded-2xl rounded-br-md shadow-sm`}>
              <Image
                src={og.src}
                width={og.width}
                height={og.height}
                alt={OG_ALT}
                sizes="320px"
                className="h-auto w-full"
              />
              <div className="space-y-0.5 px-3 py-2">
                <p className="text-sm font-bold leading-snug">{PAGE_TITLE}</p>
                <p className={`${s.bubbleMeta} text-xs leading-snug`}>{creditLine}</p>
                <p className={`${s.bubbleMeta} text-xs`}>foaglobal.org</p>
              </div>
              <p className={`${s.bubbleLink} px-3 pb-2 text-sm underline`}>foaglobal.org/gallery/{competition.slug}</p>
            </div>
          </div>
        </Figure>

        <div className="space-y-6">
        <Figure caption="Compact preview: some apps show a square thumbnail, centre-cropped. The Artwork survives; the logo shrinks to a sliver of the red tile at the edge. Production could ship a square og:image too.">
          <div className={`${s.chat} mx-auto max-w-[390px] rounded-xl border border-bk-border p-3`}>
            <div className={`${s.bubble} ml-auto flex max-w-[320px] gap-3 rounded-2xl rounded-br-md p-2 shadow-sm`}>
              <Image
                src={og.src}
                width={og.width}
                height={og.height}
                alt=""
                sizes="72px"
                className="size-[72px] shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-bold leading-snug">{PAGE_TITLE}</p>
                <p className={`${s.bubbleMeta} text-xs`}>foaglobal.org</p>
              </div>
            </div>
          </div>
        </Figure>
        <Figure caption="Social card, 390 px wide (generic)">
          <div className="mx-auto max-w-[390px] overflow-hidden rounded-xl border border-bk-border bg-bk-surface">
            <Image src={og.src} width={og.width} height={og.height} alt="" sizes="390px" className="h-auto w-full" />
            <div className="space-y-0.5 p-3">
              <p className="text-xs text-bk-muted">foaglobal.org</p>
              <p className="text-sm font-bold leading-snug">{PAGE_TITLE}</p>
            </div>
          </div>
        </Figure>
        </div>
      </div>

      <Figure caption={`At 50% (600×315) and 100% (1200×630). Exact pixels. PNG ${kb(og.bytes)}: the crayon texture makes PNG heavy; the same image as JPEG q82 is ${kb(ogJpg.bytes)}.`}>
        <ScrollBox label="OG card at 50% and 100%, scrolls sideways">
          <div className="flex w-max flex-col gap-3">
            <Image src={og.src} width={og.width} height={og.height} alt="" unoptimized className="h-[315px] w-[600px]" />
            <Image src={og.src} width={og.width} height={og.height} alt="" unoptimized className="h-[630px] w-[1200px]" />
          </div>
        </ScrollBox>
      </Figure>
    </Section>
  );
}
