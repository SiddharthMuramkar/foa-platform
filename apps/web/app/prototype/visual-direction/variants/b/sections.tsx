// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant B "Editorial trust" home-page sections (FR-PUB-01). Server components only.
// Safeguarding: children appear only as display name, age category label, School, city/state(/country),
// Competition and award (SG-01). Every public item carries "Report a concern" (SG-08).
import Image from "next/image";
import type { CSSProperties } from "react";
import { home, photos, type GalleryArtwork, type StockPhoto } from "../../fixtures";
import { logo } from "../../logo";
import { allocation } from "./data";
import {
  ArtFrame,
  Arrow,
  Badge,
  btn,
  cx,
  keep,
  Kicker,
  LockIcon,
  Photo,
  PhotoCredit,
  ReportConcern,
  Section,
  SectionHead,
  splitDate,
  TextLink,
} from "./parts";

const SECTION_PAD = "py-14 lg:py-20";

/* ================================================================== 01 Impact (trust first) */

const IMPACT_RULE = [
  "before:bg-(--b-tile-red)",
  "before:bg-(--b-tile-green)",
  "before:bg-(--b-tile-blue)",
] as const;

export function Impact() {
  const { impact } = home;
  return (
    <Section labelledBy="b-impact-h" id="impact" className="pt-10 pb-14 lg:pt-10 lg:pb-20">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <SectionHead
            id="b-impact-h"
            index="01"
            tone="blue"
            kicker="Impact"
            title={impact.heading}
            intro={<>Reported each financial year, with the source beside every figure. This year: {impact.period}.</>}
          />
        </div>
        <div className="lg:col-span-8">
          <dl className="grid divide-y divide-(--b-line) border-b border-(--b-line) sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {impact.items.map((item, i) => (
              <div
                key={item.metricKey}
                className={cx(
                  "flex flex-col gap-2 py-6 before:block before:h-[3px] before:w-8 sm:px-6 sm:first:pl-0 sm:last:pr-0",
                  IMPACT_RULE[i],
                )}
              >
                <dt className="order-2 text-[16px] leading-snug">{item.label}</dt>
                <dd className="b-num order-1 mt-2 text-[52px] leading-none font-semibold tracking-[-0.035em] lg:text-[64px]">
                  {item.valueLabel}
                </dd>
                <dd className="order-3 text-[12px] leading-4 text-(--b-ink-2)">
                  {item.period} · {item.sourceNote}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[16px] font-semibold">{allocation.heading}</h3>
              <p className="text-[12px] text-(--b-ink-2)">{allocation.note}</p>
            </div>
            {/* 3px gaps echo the gaps between the logo's tiles. The legend below carries the data. */}
            <div aria-hidden="true" className="mt-3 flex h-3 gap-[3px] overflow-hidden rounded-[3px]">
              {allocation.items.map((a) => (
                <span key={a.label} className={cx("basis-0", a.swatch)} style={{ flexGrow: a.share }} />
              ))}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] leading-snug sm:grid-cols-4">
              {allocation.items.map((a) => (
                <li key={a.label} className="flex items-start gap-2">
                  <span aria-hidden="true" className={cx("mt-[5px] size-2 shrink-0", a.swatch)} />
                  <span>
                    <span className="b-num font-semibold">₹{a.share}</span>{" "}
                    <span className="text-(--b-ink-2)">{a.label}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <TextLink href={impact.transparency.href}>{impact.transparency.label}</TextLink>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== 02 Competitions (exhibition listing) */

export function Competitions() {
  const { competitions } = home;
  return (
    <Section labelledBy="b-comp-h" id="competitions" className={SECTION_PAD}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead
            id="b-comp-h"
            index="02"
            tone="green"
            kicker="Competitions"
            title={competitions.heading}
            intro={competitions.intro}
            action={<TextLink href={competitions.viewAll.href}>{competitions.viewAll.label}</TextLink>}
          />
        </div>
        <ol className="divide-y divide-(--b-line) border-y border-(--b-line) lg:col-span-8">
          {competitions.items.map((c) => {
            const d = splitDate(c.closesOn);
            const cover: StockPhoto = c.cover;
            return (
              <li
                key={c.slug}
                className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[148px_84px_minmax(0,1fr)_auto] lg:gap-x-6"
              >
                <div className="row-span-2 sm:row-span-1">
                  <Photo
                    photo={cover}
                    sizes="(min-width: 1024px) 148px, (min-width: 640px) 120px, 88px"
                    className="aspect-square sm:aspect-[4/3]"
                  />
                  {cover.caption ? (
                    <p className="mt-1 text-[11px] leading-4 text-(--b-ink-2)">{cover.caption}</p>
                  ) : null}
                </div>
                <div className="b-num hidden border-l border-(--b-line) pl-4 lg:block">
                  <p className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-(--b-ink-2) uppercase">Closes</p>
                  <p className="mt-1 text-[30px] leading-none font-semibold tracking-[-0.03em]">{d.day}</p>
                  <p className="mt-1 text-[13px] text-(--b-ink-2)">
                    {d.month} {d.year}
                  </p>
                </div>
                <div className="min-w-0">
                  <Badge tone="green">Registration open</Badge>
                  <h3 className="mt-2 text-[19px] leading-snug font-semibold tracking-[-0.01em]">
                    <a href={c.href} className="underline-offset-4 hover:underline">
                      {c.title}
                    </a>
                  </h3>
                  <p className="mt-1 text-[15px] leading-snug text-(--b-ink-2)">Theme: “{c.theme}”</p>
                  <p className="mt-2 text-[14px] leading-snug text-(--b-ink-2)">
                    {c.artForm} · {keep(c.categoryLabel)} · Entry {c.feeLabel}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold lg:hidden">{c.closesLabel}</p>
                </div>
                <div className="col-start-2 sm:col-start-auto">
                  <a href={c.href} className={btn("secondary", "sm")}>
                    Enter<span className="sr-only"> {c.title}</span>
                    <Arrow />
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}

/* ================================================================== 03 Gallery (salon hang) */

/** Desktop: asymmetric 12-col hang. Phone: a scroll-snap strip of frames at one height (no page scroll). */
const HANG = [
  "lg:col-span-5",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-3 lg:col-start-2",
  "lg:col-span-4",
] as const;
const STRIP_FRAME_H = 220;
const STRIP_MAT = 12;

function GalleryItem({ a, hang }: { a: GalleryArtwork; hang: string }) {
  const frameW = Math.round((STRIP_FRAME_H * a.image.width) / a.image.height) + STRIP_MAT * 2;
  const style = { "--w": `${Math.max(frameW, 220)}px` } as CSSProperties;
  return (
    <li className={cx("w-(--w) shrink-0 snap-start lg:w-auto", hang)} style={style}>
      <article aria-labelledby={`b-art-${a.id}`}>
        <a href={a.href} tabIndex={-1} aria-hidden="true" className="block w-fit lg:w-full">
          <ArtFrame
            image={a.image}
            alt=""
            lift
            mat="p-3 lg:p-4"
            sizes="(min-width: 1024px) 34vw, 330px"
            imgClassName="h-[220px] w-auto lg:h-auto lg:w-full"
          />
        </a>
        <div className="mt-4 flex flex-col gap-0.5">
          <h3 id={`b-art-${a.id}`} className="text-[16px] leading-snug font-semibold">
            <a href={a.href} className="underline-offset-4 hover:underline">
              {a.title}
            </a>
          </h3>
          <p className="text-[14px] leading-[1.45]">
            {a.displayName} <span className="text-(--b-ink-2)">· {keep(a.categoryLabel)}</span>
          </p>
          <p className="text-[14px] leading-[1.45] text-(--b-ink-2)">
            {a.school}, {a.city}, {a.state}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge tone="blue">{a.award}</Badge>
            <span className="text-[13px] text-(--b-ink-2)">
              {a.artForm} · {a.competition}
            </span>
          </div>
          <div className="mt-1">
            <ReportConcern href={a.reportConcernHref} label={a.title} />
          </div>
        </div>
      </article>
    </li>
  );
}

export function Gallery() {
  const { gallery } = home;
  const rest = gallery.items.slice(1); // items[0] is homeFeatured, already hung in the hero
  return (
    <Section labelledBy="b-gal-h" id="gallery" className={SECTION_PAD}>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <SectionHead id="b-gal-h" index="03" tone="blue" kicker="Gallery" title={gallery.heading} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-6 lg:pt-9">
          <p className="max-w-[52ch] text-[16px] leading-[1.6] text-(--b-ink-2)">
            {gallery.intro} Every Artwork is staff-reviewed before it appears. We show a first name and initial,
            never an exact age or contact details.
          </p>
          <TextLink href={gallery.viewAll.href}>{gallery.viewAll.label}</TextLink>
        </div>
      </div>
      {/* `relative` keeps sr-only (absolute) text inside the scroller; otherwise it widens the page on phones. */}
      <ul
        aria-label="Award-winning Artworks"
        className="b-strip relative -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 items-start gap-6 overflow-x-auto px-5 pt-1 pb-6 lg:mx-0 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-14 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {rest.map((a, i) => (
          <GalleryItem key={a.id} a={a} hang={HANG[i] ?? "lg:col-span-4"} />
        ))}
        <li className="hidden lg:col-span-4 lg:flex lg:h-full lg:flex-col lg:justify-end lg:border-l lg:border-(--b-line) lg:pl-8">
          <p className="text-[22px] leading-[1.3] font-semibold tracking-[-0.01em] text-balance">
            Judged blind, then featured by our curators.
          </p>
          <p className="mt-3 text-[15px] leading-[1.6] text-(--b-ink-2)">
            Original files stay private: the gallery shows watermarked previews only.
          </p>
          <div className="mt-4">
            <TextLink href={gallery.viewAll.href}>{gallery.viewAll.label}</TextLink>
          </div>
        </li>
      </ul>
    </Section>
  );
}

/* ================================================================== 04 Auction (catalogue lot) */

export function Auction() {
  const { auction } = home;
  const lot = auction.item;
  return (
    <Section labelledBy="b-auc-h" id="auctions" className={SECTION_PAD}>
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <SectionHead
            id="b-auc-h"
            index="04"
            tone="blue"
            kicker="Auctions"
            title={auction.heading}
            intro="Physical Artworks, listed only with auction consent. Proceeds fund rescue, treatment and adoption."
          />
        </div>
        <article
          aria-labelledby="b-lot-h"
          className="grid gap-6 rounded-[6px] bg-(--b-wall) p-5 sm:grid-cols-2 sm:items-center lg:col-span-8 lg:gap-10 lg:p-10"
        >
          <a href={lot.href} tabIndex={-1} aria-hidden="true" className="block">
            <ArtFrame image={lot.image} alt="" lift mat="p-3 lg:p-5" sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 90vw" />
          </a>
          <div>
            <Kicker tone="blue">Lot 01 · {lot.endsLabel}</Kicker>
            <h3 id="b-lot-h" className="mt-3 text-[24px] leading-[1.2] font-semibold tracking-[-0.015em]">
              <a href={lot.href} className="underline-offset-4 hover:underline">
                {lot.title}
              </a>
            </h3>
            <p className="mt-1 text-[15px] text-(--b-ink-2)">{keep(lot.creatorCredit)}</p>
            <div className="mt-3">
              <Badge tone="blue">{lot.award}</Badge>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-(--b-line) pt-4">
              <div>
                <dt className="text-[12px] font-semibold tracking-[0.08em] text-(--b-ink-2) uppercase">Current bid</dt>
                <dd className="b-num mt-1 text-[32px] leading-none font-semibold tracking-[-0.03em]">{lot.currentBidLabel}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-semibold tracking-[0.08em] text-(--b-ink-2) uppercase">Bids</dt>
                <dd className="b-num mt-1 text-[32px] leading-none font-semibold tracking-[-0.03em]">{lot.bidCount}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={lot.href} className={btn("primary")}>
                View lot and bid
                <Arrow />
              </a>
              <ReportConcern href={lot.reportConcernHref} label={lot.title} />
            </div>
            <p className="mt-3 text-[13px] text-(--b-ink-2)">Bidding is open to adults (18+) only.</p>
          </div>
        </article>
      </div>
    </Section>
  );
}

/* ================================================================== 05 Adoption */

export function Adoption() {
  const { adoption } = home;
  return (
    <Section labelledBy="b-adopt-h" id="adopt" className={SECTION_PAD}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead
            id="b-adopt-h"
            index="05"
            tone="green"
            kicker="Adopt"
            title={adoption.heading}
            intro="Listed by verified Welfare Partners. Adopters must be 18 or over."
            action={<TextLink href={adoption.viewAll.href}>{adoption.viewAll.label}</TextLink>}
          />
        </div>
        <ul className="grid gap-6 lg:col-span-8 lg:grid-cols-3 lg:gap-8">
          {adoption.items.map((pet) => (
            <li key={pet.name} className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-4 lg:grid-cols-1">
              <Photo
                photo={pet.photo}
                sizes="(min-width: 1024px) 240px, 104px"
                className="aspect-square lg:aspect-[4/5]"
              />
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[19px] leading-snug font-semibold">
                  <a href={pet.href} className="underline-offset-4 hover:underline">
                    Meet {pet.name}
                  </a>
                </h3>
                <p className="text-[14px] text-(--b-ink-2)">
                  {pet.species} · {pet.ageBand} · {pet.sex}
                </p>
                <p className="text-[14px] text-(--b-ink-2)">{pet.city}</p>
                <PhotoCredit photo={pet.photo} forceIllustrative className="mt-2" />
                <div>
                  <ReportConcern href={pet.reportConcernHref} label={pet.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ================================================================== 06 Donate */

export function Donate() {
  const { donate } = home;
  return (
    <section id="donate" aria-labelledby="b-donate-h" className="scroll-mt-6 bg-(--b-paper-2) px-5 py-14 lg:px-10 lg:py-20">
      {/* Red appears here only as the 2px rule, the label text and the Donate button fill. */}
      <div className="mx-auto grid max-w-[76rem] gap-8 border-t-2 border-(--b-tile-red) pt-6 lg:grid-cols-12 lg:gap-8 lg:pt-8">
        <figure className="lg:col-span-5">
          <Photo
            photo={donate.photo}
            sizes="(min-width: 1024px) 460px, 100vw"
            className="aspect-[3/2] lg:aspect-[4/5]"
          />
          <figcaption className="mt-2">
            <PhotoCredit photo={donate.photo} />
          </figcaption>
        </figure>
        <div className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
          <Kicker index="06" tone="red">
            Donate
          </Kicker>
          <h2 id="b-donate-h" className="mt-3 text-[32px] leading-[1.08] font-semibold tracking-[-0.025em] text-balance lg:text-[48px]">
            {donate.heading}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.6] text-(--b-ink-2)">{donate.body}</p>
          <fieldset className="mt-7">
            <legend className="text-[14px] font-semibold">Choose an amount</legend>
            <div className="mt-3 grid max-w-md grid-cols-3 gap-2">
              {donate.presetLabels.map((label, i) => (
                <label
                  key={label}
                  className="b-ease b-num flex min-h-12 cursor-pointer items-center justify-center rounded-[6px] border border-(--b-control) bg-(--b-surface) text-[17px] font-semibold hover:border-(--b-ink) has-[:checked]:border-(--b-ink) has-[:checked]:bg-(--b-ink) has-[:checked]:text-(--b-on-ink) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--b-focus)"
                >
                  <input
                    type="radio"
                    name="b-donate-amount"
                    value={donate.presetsInr[i]}
                    defaultChecked={i === 1}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={donate.cta.href} className={cx(btn("donate", "none"), "min-h-12 px-10 text-[16px]")}>
              {donate.cta.label}
            </a>
            <p className="flex max-w-[34ch] items-start gap-2 text-[13px] leading-snug text-(--b-ink-2)">
              <LockIcon />
              {donate.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== 07 Partners */

export function Partners() {
  const { partners, impact } = home;
  return (
    <Section labelledBy="b-partners-h" id="partners" className={SECTION_PAD}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead
            id="b-partners-h"
            index="07"
            tone="ink"
            kicker="Partners"
            title={partners.heading}
            intro="Sponsors and partners are disclosed in our transparency report."
            action={<TextLink href={impact.transparency.href}>Sponsor disclosures</TextLink>}
          />
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:col-span-8 lg:grid-cols-4">
          {partners.items.map((p) => (
            <li
              key={p.name}
              className="flex min-h-28 flex-col justify-between gap-3 rounded-[6px] border border-(--b-line) p-4"
            >
              <span className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-(--b-ink-2) uppercase">{p.kind}</span>
              <span className="text-[15px] leading-snug font-semibold text-(--b-ink-2)">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ================================================================== Footer (+ newsletter, image credits) */

const USED_PHOTOS: StockPhoto[] = [
  photos.childHandsDrawing,
  photos.kittensPark,
  photos.keralaDogSlipper,
  photos.puppyHeadTilt,
  photos.pariahDogPath,
  photos.kittenLookingUp,
  photos.handHoldsPaw,
];
const LICENCE_NAME: Record<StockPhoto["licence"], string> = {
  unsplash: "Unsplash Licence",
  pexels: "Pexels Licence",
  cc0: "CC0",
};

export function Footer() {
  const { footer, newsletter } = home;
  const footLinkBase = "b-ease inline-flex min-h-8 items-center underline-offset-4 hover:underline";
  const footLink = cx(footLinkBase, "text-[15px] text-(--b-footer-ink)");
  return (
    <footer className="b-footer bg-(--b-footer-bg) px-5 pt-14 pb-10 text-(--b-footer-ink) lg:px-10 lg:pt-20">
      <div className="mx-auto max-w-[76rem]">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <p className="text-[24px] leading-[1.2] font-semibold tracking-[-0.02em] text-balance lg:col-span-6 lg:text-[30px]">
            {newsletter.heading}
          </p>
          <div className="lg:col-span-5 lg:col-start-8">
            <label htmlFor="b-newsletter" className="text-[14px] font-semibold">
              {newsletter.placeholder}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="b-newsletter"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-describedby="b-newsletter-hint"
                className="b-ease min-h-11 min-w-0 flex-1 rounded-[6px] border border-(--b-footer-control) bg-transparent px-3 text-[16px] text-(--b-footer-ink) placeholder:text-(--b-footer-ink-2) hover:border-(--b-footer-ink)"
              />
              <button
                type="button"
                className="b-ease min-h-11 shrink-0 rounded-[6px] bg-(--b-footer-ink) px-5 text-[15px] font-semibold text-(--b-footer-bg) hover:bg-(--b-footer-btn-hover)"
              >
                {newsletter.cta}
              </button>
            </div>
            <p id="b-newsletter-hint" className="mt-2 text-[12px] text-(--b-footer-ink-2)">
              For adults. One email a month; unsubscribe any time.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-10 border-t border-(--b-footer-line) pt-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <a href="#top" className="w-fit rounded-[6px] bg-white p-2.5">
              <Image src={logo.svg} width={logo.width} height={logo.height} alt={logo.alt} className="h-16 w-auto" />
            </a>
            <p className="max-w-[30ch] text-[14px] leading-[1.6] text-(--b-footer-ink-2)">
              Children’s art that helps animals, across India.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Social media">
              {footer.social.map((s) => (
                <li key={s}>
                  <a href={`#${s.toLowerCase()}`} className={cx(footLinkBase, "text-[14px] text-(--b-footer-ink-2) hover:text-(--b-footer-ink)")}>
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {footer.groups.map((g) => (
              <nav key={g.heading} aria-label={g.heading}>
                <p className="text-[12px] font-semibold tracking-[0.1em] text-(--b-footer-ink-2) uppercase">{g.heading}</p>
                <ul className="mt-3 flex flex-col">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className={footLink}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-(--b-footer-line) pt-6 lg:flex-row lg:items-start lg:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {footer.utility.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="b-ease inline-flex min-h-8 items-center text-[14px] font-semibold text-(--b-footer-link) underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-(--b-footer-ink-2)">{footer.legalLine}</p>
        </div>

        <details id="credits" className="mt-6 text-[13px] text-(--b-footer-ink-2)">
          <summary className="inline-flex min-h-8 cursor-pointer items-center font-semibold text-(--b-footer-ink)">
            Image credits ({USED_PHOTOS.length} photos, no AI imagery)
          </summary>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {USED_PHOTOS.map((p) => (
              <li key={p.sourceUrl}>
                <a href={p.sourceUrl} rel="noreferrer" className="underline underline-offset-4 hover:text-(--b-footer-ink)">
                  {p.author}
                </a>{" "}
                · {LICENCE_NAME[p.licence]} · {p.modified}
              </li>
            ))}
            <li>Artworks: labelled placeholders, not real children’s art.</li>
          </ul>
        </details>
      </div>
    </footer>
  );
}
