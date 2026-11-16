// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Shared, READ-ONLY home-page content for variants A/B/C (FR-PUB-01). Builders must not edit this file.
// All names, schools, numbers and amounts are fictional prototype data.
//
// Safeguarding (SPEC §4.1): public views of a minor show ONLY approved display name, age category label,
// School name, city/state/country, Competition and award (SG-01: never age in years, DOB, contact or Guardian).
// Every Artwork shown is assumed gallery-eligible under SG-04, and every public item carries a
// "Report a concern" link (SG-08). Artwork images are abstract labelled PLACEHOLDERS, never real children's art.
// Photos are licence-checked stock from the research/animal-imagery shortlist (#5); no AI imagery (§4.8);
// no identifiable people (children appear as hands only). Stock never stands in for Artwork, Impact or FOA's
// own rescue work: show `caption` ("Illustrative photo") wherever an image could read as FOA's own work.

import type { StaticImageData } from "next/image";
import childHandsDrawing from "./photos/child-hands-drawing.jpg";
import handHoldsPaw from "./photos/hand-holds-paw.jpg";
import indieDogGrin from "./photos/indie-dog-grin.jpg";
import keralaDogSlipper from "./photos/kerala-dog-slipper.jpg";
import kittenLookingUp from "./photos/kitten-looking-up.jpg";
import kittensPark from "./photos/kittens-park.jpg";
import pariahDogPath from "./photos/pariah-dog-path.jpg";
import puppyHeadTilt from "./photos/puppy-head-tilt.jpg";
import whiteDogSmile from "./photos/white-dog-smile.jpg";

/* ------------------------------------------------------------------ types */

export type Link = { label: string; href: string };

/** Mirrors the StockImage manifest proposed in research/animal-imagery (docs/research/animal-imagery.md §2). */
export type StockPhoto = {
  /** Static import: use with next/image for automatic width/height and placeholder="blur" (CLS-safe). */
  file: StaticImageData;
  alt: string;
  author: string;
  /** The photo page, never a CDN URL. */
  sourceUrl: string;
  licence: "unsplash" | "pexels" | "cc0";
  licenceUrl: string;
  /** Shortlist number in docs/research/animal-imagery.md §3. */
  shortlist: number;
  slot: "hero" | "competitions" | "welfare" | "adoption" | "donate" | "empty";
  retrievedOn: string;
  modified: string;
  people: "none" | "hands-only";
  /** Placement rules from the research flags. */
  notes?: string;
  /** Show under the image where it could read as FOA's own work. */
  caption?: "Illustrative photo";
  aiGenerated: false;
};

/** Abstract labelled placeholder (public/prototype/visual-direction/artworks/*.svg). next/image serves SVG unoptimized. */
export type ArtworkImage = { src: string; width: number; height: number; placeholder: true };

export type ArtForm = "Drawing" | "Painting" | "Art & Craft" | "Photography" | "Essay" | "Videography";

export type Competition = {
  slug: string;
  title: string;
  theme: string;
  artForm: ArtForm;
  /** CompetitionCategory.label (§5.3). */
  categoryLabel: string;
  closesOn: string; // ISO date, Asia/Kolkata
  closesLabel: string;
  feeInr: number;
  feeLabel: string;
  status: "REGISTRATION_OPEN";
  href: string;
  cover: StockPhoto;
};

export type GalleryArtwork = {
  id: string;
  title: string;
  artForm: ArtForm;
  /** Approved Display Name: first name + last initial (GLOSSARY). */
  displayName: string;
  /** Age category label only. NEVER age in years (SG-01). */
  categoryLabel: string;
  school: string;
  city: string;
  state: string;
  country: "India";
  competition: string;
  /** AwardTier label (§5.3). */
  award: string;
  image: ArtworkImage;
  /** FR-GAL-02 / NFR-A11Y: Artwork alt = title + optional image description. */
  alt: string;
  href: string;
  reportConcernHref: string;
};

export type ImpactNumber = {
  metricKey: "ANIMALS_TREATED" | "ANIMALS_ADOPTED" | "PLATFORM_YOUNG_ARTISTS";
  value: number;
  valueLabel: string;
  label: string;
  period: string;
  sourceNote: string;
};

/* ------------------------------------------------------------------ photos */

const RETRIEVED = "2026-11-16";
const PEXELS = "https://www.pexels.com/license/";
const UNSPLASH = "https://unsplash.com/license";
const CC0 = "https://wordpress.org/photos/license";
const RESIZED = "resized, re-encoded JPEG q80, metadata stripped";

export const photos = {
  indieDogGrin: {
    file: indieDogGrin,
    alt: "A reddish-brown mixed-breed dog grinning with its mouth open among green plants",
    author: "Ahsan Khan",
    sourceUrl: "https://wordpress.org/photos/photo/1006740a19/",
    licence: "cc0",
    licenceUrl: CC0,
    shortlist: 4,
    slot: "hero",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    notes: "Leash in frame. Portrait 3:4; crop from the top for wide heroes.",
    aiGenerated: false,
  },
  puppyHeadTilt: {
    file: puppyHeadTilt,
    alt: "A tan puppy with a dark muzzle looking straight at the camera",
    author: "Yogesh Londhe",
    sourceUrl: "https://wordpress.org/photos/photo/526533c545/",
    licence: "cc0",
    licenceUrl: CC0,
    shortlist: 15,
    slot: "adoption",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    caption: "Illustrative photo",
    aiGenerated: false,
  },
  pariahDogPath: {
    file: pariahDogPath,
    alt: "An alert Indian pariah dog with its tail up standing on a grassy path",
    author: "Phenomenal Clicks",
    sourceUrl: "https://www.pexels.com/photo/indian-pariah-dog-on-a-lush-green-path-39052700/",
    licence: "pexels",
    licenceUrl: PEXELS,
    shortlist: 16,
    slot: "adoption",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    notes: "Phone shot: keep it at card size, not full-bleed.",
    caption: "Illustrative photo",
    aiGenerated: false,
  },
  whiteDogSmile: {
    file: whiteDogSmile,
    alt: "A happy white dog sitting on mossy ground and looking up with its mouth open",
    author: "Binod Gurung",
    sourceUrl: "https://wordpress.org/photos/photo/5226a128a3/",
    licence: "cc0",
    licenceUrl: CC0,
    shortlist: 19,
    slot: "donate",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    aiGenerated: false,
  },
  handHoldsPaw: {
    file: handHoldsPaw,
    alt: "A person's hand gently holding a brown dog's paw",
    author: "Ivan Babydov",
    sourceUrl: "https://www.pexels.com/photo/unrecognizable-woman-holding-paw-of-dog-7788657/",
    licence: "pexels",
    licenceUrl: PEXELS,
    shortlist: 18,
    slot: "donate",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "hands-only",
    notes: "No face, so safe beside the red Donate ask.",
    aiGenerated: false,
  },
  kittensPark: {
    file: kittensPark,
    alt: "Two tabby kittens playing on a sunlit park path while a third watches",
    author: "Furkan Aktaş",
    sourceUrl: "https://www.pexels.com/photo/playful-kittens-in-sunlit-park-setting-33135220/",
    licence: "pexels",
    licenceUrl: PEXELS,
    shortlist: 5,
    slot: "hero",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    aiGenerated: false,
  },
  kittenLookingUp: {
    file: kittenLookingUp,
    alt: "A tabby kitten with big eyes looking up at the camera against a pale background",
    author: "Helena Lopes",
    sourceUrl: "https://www.pexels.com/photo/adorable-tabby-kitten-with-big-eyes-portrait-6247958/",
    licence: "pexels",
    licenceUrl: PEXELS,
    shortlist: 21,
    slot: "empty",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    aiGenerated: false,
  },
  childHandsDrawing: {
    file: childHandsDrawing,
    alt: "A young child's hands drawing with coloured pencils on paper",
    author: "Tess h.",
    sourceUrl: "https://www.pexels.com/photo/38033507/",
    licence: "pexels",
    licenceUrl: PEXELS,
    shortlist: 6,
    slot: "competitions",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "hands-only",
    notes: "Child making art, no face. Never present as an Artwork.",
    aiGenerated: false,
  },
  keralaDogSlipper: {
    file: keralaDogSlipper,
    alt: "A brown street dog trotting along a road in Kerala carrying a slipper in its mouth",
    author: "Praswin Prakashan",
    sourceUrl: "https://unsplash.com/photos/earDqniB3tM",
    licence: "unsplash",
    licenceUrl: UNSPLASH,
    shortlist: 12,
    slot: "welfare",
    retrievedOn: RETRIEVED,
    modified: RESIZED,
    people: "none",
    notes: "Small subject: crop in.",
    caption: "Illustrative photo",
    aiGenerated: false,
  },
} satisfies Record<string, StockPhoto>;

/* ------------------------------------------------------------------ artwork placeholders */

const art = (n: number, width: number, height: number): ArtworkImage => ({
  src: `/prototype/visual-direction/artworks/art-${n}.svg`,
  width,
  height,
  placeholder: true,
});

/* ------------------------------------------------------------------ home page */

const CONCERN = "/contact?topic=concern";

export const home = {
  nav: {
    items: [
      { label: "Competitions", href: "#competitions" },
      { label: "Gallery", href: "#gallery" },
      { label: "Auctions", href: "#auctions" },
      { label: "Adopt", href: "#adopt" },
      { label: "About", href: "#about" },
    ] satisfies Link[],
    signIn: { label: "Sign in", href: "#sign-in" } satisfies Link,
    /** The ONLY solid-red element on the page. */
    donate: { label: "Donate", href: "#donate" } satisfies Link,
  },

  hero: {
    eyebrow: "Friends of Animals · India",
    headline: "Children’s art that helps animals",
    subline:
      "Young artists across India draw, paint and photograph the animals around them. Every entry, auction sale and donation funds rescue, treatment and adoption.",
    primaryCta: { label: "Enter a Competition", href: "#competitions" } satisfies Link,
    /** FR-PUB-01 lists Donate as the second hero CTA; solid red is reserved for Donate. */
    secondaryCta: { label: "Donate", href: "#donate" } satisfies Link,
    image: photos.indieDogGrin,
    /** LCP image (FR-PUB-01 AC): render with next/image `preload` / priority and explicit `sizes`. */
    alternates: [photos.kittensPark, photos.puppyHeadTilt],
  },

  competitions: {
    heading: "Open Competitions",
    intro: "Individual entries and School registrations are open now.",
    viewAll: { label: "All Competitions", href: "#competitions-all" } satisfies Link,
    items: [
      {
        slug: "paws-and-pencils-2027",
        title: "Paws & Pencils 2027",
        theme: "My street’s best friend",
        artForm: "Drawing",
        categoryLabel: "Category A, ages 6–10",
        closesOn: "2027-01-31",
        closesLabel: "Closes 31 Jan 2027",
        feeInr: 150,
        feeLabel: "₹150",
        status: "REGISTRATION_OPEN",
        href: "#paws-and-pencils-2027",
        cover: photos.childHandsDrawing,
      },
      {
        slug: "colours-of-compassion-2027",
        title: "Colours of Compassion 2027",
        theme: "Kindness on four legs",
        artForm: "Painting",
        categoryLabel: "Category B, ages 11–14",
        closesOn: "2027-02-14",
        closesLabel: "Closes 14 Feb 2027",
        feeInr: 200,
        feeLabel: "₹200",
        status: "REGISTRATION_OPEN",
        href: "#colours-of-compassion-2027",
        cover: photos.kittensPark,
      },
      {
        slug: "through-their-eyes-2027",
        title: "Through Their Eyes 2027",
        theme: "A day in the life of a community animal",
        artForm: "Photography",
        categoryLabel: "Category C, ages 15–18",
        closesOn: "2027-02-28",
        closesLabel: "Closes 28 Feb 2027",
        feeInr: 250,
        feeLabel: "₹250",
        status: "REGISTRATION_OPEN",
        href: "#through-their-eyes-2027",
        cover: photos.keralaDogSlipper,
      },
    ] satisfies Competition[],
  },

  gallery: {
    heading: "From the gallery",
    intro: "Award-winning Artworks from last season, shown with each young artist’s consent.",
    viewAll: { label: "Visit the gallery", href: "#gallery-all" } satisfies Link,
    /** First item is `homeFeatured` (§5.8): the featured Artwork. */
    items: [
      {
        id: "g1",
        title: "Bruno Waits by the Gate",
        artForm: "Drawing",
        displayName: "Aarav S.",
        categoryLabel: "Category A, ages 6–10",
        school: "Sunrise Public School",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        competition: "Paws & Pencils 2026",
        award: "Gold",
        image: art(1, 800, 1000),
        alt: "Bruno Waits by the Gate (artwork placeholder)",
        href: "#g1",
        reportConcernHref: `${CONCERN}&item=g1`,
      },
      {
        id: "g2",
        title: "Mother and Pups Under the Banyan",
        artForm: "Painting",
        displayName: "Meera K.",
        categoryLabel: "Category B, ages 11–14",
        school: "Green Valley High School",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        competition: "Colours of Compassion 2026",
        award: "All India 1st",
        image: art(2, 1000, 750),
        alt: "Mother and Pups Under the Banyan (artwork placeholder)",
        href: "#g2",
        reportConcernHref: `${CONCERN}&item=g2`,
      },
      {
        id: "g3",
        title: "The Kitten Who Owned the Rooftop",
        artForm: "Drawing",
        displayName: "Ishaan R.",
        categoryLabel: "Category A, ages 6–10",
        school: "Lotus International School",
        city: "Jaipur",
        state: "Rajasthan",
        country: "India",
        competition: "Paws & Pencils 2026",
        award: "Special Mention",
        image: art(3, 900, 900),
        alt: "The Kitten Who Owned the Rooftop (artwork placeholder)",
        href: "#g3",
        reportConcernHref: `${CONCERN}&item=g3`,
      },
      {
        id: "g4",
        title: "Street Dogs of Fort Kochi",
        artForm: "Photography",
        displayName: "Anaya P.",
        categoryLabel: "Category C, ages 15–18",
        school: "Riverside Academy",
        city: "Kochi",
        state: "Kerala",
        country: "India",
        competition: "Through Their Eyes 2026",
        award: "Silver",
        image: art(4, 1050, 700),
        alt: "Street Dogs of Fort Kochi (artwork placeholder)",
        href: "#g4",
        reportConcernHref: `${CONCERN}&item=g4`,
      },
      {
        id: "g5",
        title: "Feeding Time",
        artForm: "Art & Craft",
        displayName: "Kabir M.",
        categoryLabel: "Category B, ages 11–14",
        school: "Vidya Niketan School",
        city: "Lucknow",
        state: "Uttar Pradesh",
        country: "India",
        competition: "Colours of Compassion 2026",
        award: "A Grade",
        image: art(5, 750, 1000),
        alt: "Feeding Time (artwork placeholder)",
        href: "#g5",
        reportConcernHref: `${CONCERN}&item=g5`,
      },
      {
        id: "g6",
        title: "Friends on the Ghat",
        artForm: "Painting",
        displayName: "Zoya F.",
        categoryLabel: "Category C, ages 15–18",
        school: "St. Agnes Convent School",
        city: "Varanasi",
        state: "Uttar Pradesh",
        country: "India",
        competition: "Colours of Compassion 2026",
        award: "Bronze",
        image: art(6, 1000, 800),
        alt: "Friends on the Ghat (artwork placeholder)",
        href: "#g6",
        reportConcernHref: `${CONCERN}&item=g6`,
      },
    ] satisfies GalleryArtwork[],
  },

  impact: {
    heading: "Where your support goes",
    period: "April 2025 – March 2026",
    items: [
      {
        metricKey: "ANIMALS_TREATED",
        value: 1240,
        valueLabel: "1,240",
        label: "animals treated",
        period: "Apr 2025 – Mar 2026",
        sourceNote: "Illustrative prototype figure, not real data",
      },
      {
        metricKey: "ANIMALS_ADOPTED",
        value: 312,
        valueLabel: "312",
        label: "animals adopted into homes",
        period: "Apr 2025 – Mar 2026",
        sourceNote: "Illustrative prototype figure, not real data",
      },
      {
        metricKey: "PLATFORM_YOUNG_ARTISTS",
        value: 9800,
        valueLabel: "9,800",
        label: "young artists took part",
        period: "Apr 2025 – Mar 2026",
        sourceNote: "Illustrative prototype figure, not real data",
      },
    ] satisfies ImpactNumber[],
    transparency: { label: "See our financial transparency report", href: "#transparency" } satisfies Link,
  },

  donate: {
    heading: "Help an animal today",
    body: "Your gift pays for rescue, treatment, food and safe homes for street animals across India.",
    presetsInr: [500, 1000, 2500],
    presetLabels: ["₹500", "₹1,000", "₹2,500"],
    cta: { label: "Donate", href: "#donate" } satisfies Link,
    note: "Secure payment by Razorpay. Receipt by email; 80G receipts on request.",
    photo: photos.handHoldsPaw,
    altPhoto: photos.whiteDogSmile,
  },

  /** Optional extras for FR-PUB-01 (adoption highlights, active auction). Use or ignore. */
  adoption: {
    heading: "Ready for a home",
    viewAll: { label: "Meet more animals", href: "#adopt-all" } satisfies Link,
    items: [
      { name: "Bholu", species: "Dog", ageBand: "Puppy", sex: "Male", city: "Bengaluru", photo: photos.puppyHeadTilt, href: "#bholu", reportConcernHref: `${CONCERN}&item=bholu` },
      { name: "Rani", species: "Dog", ageBand: "Young adult", sex: "Female", city: "Nashik", photo: photos.pariahDogPath, href: "#rani", reportConcernHref: `${CONCERN}&item=rani` },
      { name: "Chhotu", species: "Cat", ageBand: "Kitten", sex: "Male", city: "Kolkata", photo: photos.kittenLookingUp, href: "#chhotu", reportConcernHref: `${CONCERN}&item=chhotu` },
    ],
  },
  auction: {
    heading: "Live charity auction",
    item: {
      title: "Mother and Pups Under the Banyan",
      creatorCredit: "Meera K., Category B, ages 11–14",
      award: "All India 1st",
      currentBidLabel: "₹4,200",
      bidCount: 7,
      endsLabel: "Ends in 2 days",
      image: art(2, 1000, 750),
      alt: "Mother and Pups Under the Banyan (artwork placeholder)",
      href: "#auction-lot",
      reportConcernHref: `${CONCERN}&item=lot1`,
    },
  },

  partners: {
    heading: "Supported by",
    /** Disclosed sponsors (FR-PUB-01). Placeholders only: never use real organisations' logos. */
    items: [
      { name: "Sponsor placeholder 1", kind: "Sponsor" },
      { name: "Sponsor placeholder 2", kind: "Sponsor" },
      { name: "Partner placeholder 3", kind: "Welfare Partner" },
      { name: "Partner placeholder 4", kind: "School partner" },
    ],
  },

  newsletter: {
    heading: "Stories of rescue and young artists, once a month",
    placeholder: "Email address",
    cta: "Subscribe",
  },

  footer: {
    groups: [
      {
        heading: "About",
        links: [
          { label: "About FOA", href: "#about" },
          { label: "Impact", href: "#impact" },
          { label: "Financial transparency", href: "#transparency" },
          { label: "Stories", href: "#stories" },
        ],
      },
      {
        heading: "Get involved",
        links: [
          { label: "Volunteer", href: "#volunteer" },
          { label: "Community", href: "#community" },
          { label: "Events", href: "#events" },
          { label: "Welfare directory", href: "#directory" },
        ],
      },
      {
        heading: "Legal",
        links: [
          { label: "Privacy", href: "#privacy" },
          { label: "Terms", href: "#terms" },
          { label: "Child safeguarding", href: "#safeguarding" },
          { label: "Auction terms", href: "#auction-terms" },
          { label: "Refund policy", href: "#refunds" },
        ],
      },
    ] satisfies { heading: string; links: Link[] }[],
    utility: [
      { label: "Contact us", href: "#contact" },
      { label: "Report a concern", href: CONCERN },
      { label: "Image credits", href: "#credits" },
    ] satisfies Link[],
    social: ["Instagram", "YouTube", "Facebook", "LinkedIn"],
    legalLine: "© 2026 Friends of Animals. Prototype content.",
  },
};

export type Home = typeof home;
