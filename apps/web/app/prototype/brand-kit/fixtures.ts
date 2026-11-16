// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Shared, READ-ONLY fixtures for the three variants. Fictional people and places.
// Minor safeguarding (SPEC §4.1 SG-01, BR-63): public views of a minor show ONLY the approved display
// name, age category label, School name, city/state/country, Competition and award. Never a full
// name, age in years, date of birth, contact or Guardian detail. Judging views are blind (SG-11).

export type VariantKey = "a" | "b" | "c";
export type Theme = "light" | "dark";

/** Props every variant component receives from page.tsx. */
export type VariantProps = {
  /** Forced theme from ?theme=, or undefined = follow prefers-color-scheme. */
  theme: Theme | undefined;
  /** ?shot=1: screenshot mode (switcher hidden; hide any other prototype-only chrome too). */
  shot: boolean;
};

/** Every variant ships these files under public/prototype/brand-kit/<key>/ (placeholders until built). */
export const KIT_FILES = {
  icon16: { file: "icon-16.png", width: 16, height: 16 },
  icon32: { file: "icon-32.png", width: 32, height: 32 },
  icon180: { file: "icon-180.png", width: 180, height: 180 },
  iconMaskable512: { file: "icon-maskable-512.png", width: 512, height: 512 },
  ogCard: { file: "og-card.png", width: 1200, height: 630 },
  previewWatermarked: { file: "preview-watermarked.jpg", width: 1600, height: 1200 },
  judgingMarked: { file: "judging-marked.jpg", width: 2560, height: 1920 },
  certificateShare: { file: "certificate-share.png", width: 1080, height: 1350 },
} as const;
export type KitFileKey = keyof typeof KIT_FILES;

export const KIT_PUBLIC_DIR = "/prototype/brand-kit";

export function kitAsset(variant: VariantKey, key: KitFileKey) {
  const f = KIT_FILES[key];
  return { src: `${KIT_PUBLIC_DIR}/${variant}/${f.file}`, width: f.width, height: f.height };
}

/** Procedurally drawn crayon-style sample Artwork (scripts/build-kit.mjs). Not AI-generated. */
export const artwork = {
  src: "/prototype/brand-kit/fixtures/artwork-2400x1800.jpg",
  width: 2400,
  height: 1800,
  title: "Sunny Hills for Every Paw",
  alt: "Sunny Hills for Every Paw: crayon drawing of a yellow sun over green hills, with pink and blue scribbles and red spirals",
  submissionNumber: "FOA-2027-SUB-04512",
  type: "DRAWING",
} as const;

export const competition = {
  title: "Paws & Pencils 2027",
  slug: "paws-and-pencils-2027",
} as const;

/** Public display fields for the young artist (SG-01 allow-list only). */
export const child = {
  displayName: "Aarav S.", // default = first name + last initial (SPEC §5.2)
  categoryLabel: "Drawing, ages 6–10",
  school: "Sunrise Public School",
  city: "Pune",
  state: "Maharashtra",
  country: "India",
} as const;

/** Public child line, e.g. under a gallery preview or on an OG card. */
export const childDisplayLine = `${child.displayName} · ${child.categoryLabel} · ${child.school} · ${child.city}, ${child.state}, ${child.country}`;
/** Short form for tight layouts (OG card, social). */
export const childDisplayLineShort = `${child.displayName} · ${child.categoryLabel} · ${child.city}`;
/** Credit line format from FR-SOCIAL-01. */
export const creditLine = `Artwork by ${child.displayName}, ${child.categoryLabel}, ${child.school}`;

/** Judging view: blind (SG-11). Submission number, category, title only. */
export const judgingView = {
  submissionNumber: artwork.submissionNumber,
  category: child.categoryLabel,
  title: artwork.title,
  markText: "FOA JUDGING",
} as const;

/**
 * Certificate share image (FR-CERT-03: PNG 1080x1350, logo stamp, seal, number, QR to /verify).
 * The share image is public, so it shows the approved display name (SG-01/BR-63); the PDF prints the
 * legal name and is not part of this prototype.
 */
export const certificateShare = {
  number: "FOA-CERT-2027-00123",
  type: "WINNER",
  title: "Certificate of Achievement",
  recipientDisplayName: child.displayName,
  award: "Gold — Drawing, ages 6–10",
  competition: competition.title,
  school: child.school,
  issuedOn: "2027-03-15",
  issuedOnLabel: "15 March 2027",
  verifyUrl: "https://foaglobal.org/verify/FOA-CERT-2027-00123",
  verifyUrlLabel: "foaglobal.org/verify/FOA-CERT-2027-00123",
  qr: {
    src: "/prototype/brand-kit/fixtures/qr-placeholder.svg",
    width: 296,
    height: 296,
    alt: "QR code placeholder (the real code opens the verify page)",
  },
  width: 1080,
  height: 1350,
} as const;

/** FR-STAMP-03: placement and opacity are settings. Variants pick their own defaults. */
export type StampPlacement = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-edge" | "centre" | "tiled-diagonal";
export type StampSettings = { placement: StampPlacement; opacity: number; scale: number };
