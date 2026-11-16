// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/14)
// Shared, READ-ONLY fixtures for the three variants: a short home-like page (FR-PUB-01, §7.1 header/footer).
// Safeguarding (SG-01): no child names, ages, schools or artworks appear here; competition cards carry only
// competition data. Imagery is a placeholder for curated free-licence stock (§4.8: no AI-generated imagery).

export type ThemeSetting = "light" | "dark" | "system";

/** Props every variant's default export receives from page.tsx. */
export type VariantProps = {
  /** Theme set on the page root via data-theme; "system" = follows prefers-color-scheme. */
  theme: ThemeSetting;
  /** true when ?shot=1 (screenshot mode: switcher hidden). */
  shot: boolean;
};

export type Link = { label: string; href: string };

export const site = {
  name: "Friends of Animals",
  shortName: "FOA",
  homeLabel: "Friends of Animals — home",
  tagline: "Children's art for animal welfare",
} as const;

export const nav: { primary: readonly Link[]; signIn: Link; donate: Link } = {
  primary: [
    { label: "Competitions", href: "#competitions" },
    { label: "Gallery", href: "#gallery" },
    { label: "Auctions", href: "#auctions" },
    { label: "Adopt", href: "#adopt" },
    { label: "About", href: "#about" },
  ],
  signIn: { label: "Sign in", href: "#sign-in" },
  /** Solid red fill ONLY (bg-donate text-on-donate). Never outline, never tint, never another colour. */
  donate: { label: "Donate", href: "#donate" },
};

export const hero = {
  eyebrow: "Competitions 2027 are open",
  headline: "Every drawing helps an animal find a home",
  body: "Children across India paint for animal welfare. Their art fills our public gallery, raises funds at auction and supports rescue and adoption.",
  cta: { label: "Enter a Competition", href: "#competitions" } satisfies Link,
  secondaryCta: { label: "Visit the gallery", href: "#gallery" } satisfies Link,
  image: {
    /** No file yet: render a neutral placeholder box at this ratio (reserve space: CLS < 0.1). */
    src: null,
    alt: "A rescued street dog resting in the shade",
    aspectRatio: "4 / 3",
    placeholderLabel: "Animal photo — curated free-licence stock (placeholder)",
  },
} as const;

export type CompetitionCard = {
  slug: string;
  title: string;
  theme: string;
  /** Display label for CompetitionStatus (§5.15). */
  statusLabel: string;
  status: "REGISTRATION_OPEN" | "UPCOMING";
  /** Pre-formatted, Asia/Kolkata (§4.5). */
  dateLabel: string;
  ageCategoryLabels: readonly string[];
  /** Integer paise (§4.5); 0 = free. */
  feePaise: number;
  feeLabel: string;
  /** Logo tile colour this card may use as a small accent (bar/dot/eyebrow), never as text on white. */
  accent: "red" | "green" | "blue";
  href: string;
};

export const competitions: readonly CompetitionCard[] = [
  {
    slug: "paws-and-brushes-2027",
    title: "Paws & Brushes 2027",
    theme: "The street animals of my city",
    statusLabel: "Registration open",
    status: "REGISTRATION_OPEN",
    dateLabel: "Closes 31 Jan 2027",
    ageCategoryLabels: ["Sub-junior", "Junior", "Senior"],
    feePaise: 0,
    feeLabel: "Free entry",
    accent: "red",
    href: "#competitions/paws-and-brushes-2027",
  },
  {
    slug: "wings-over-india",
    title: "Wings over India",
    theme: "Birds we share our skies with",
    statusLabel: "Registration open",
    status: "REGISTRATION_OPEN",
    dateLabel: "Closes 28 Feb 2027",
    ageCategoryLabels: ["Junior", "Senior"],
    feePaise: 10000,
    feeLabel: "₹100 per entry",
    accent: "green",
    href: "#competitions/wings-over-india",
  },
  {
    slug: "gentle-giants",
    title: "Gentle Giants",
    theme: "Elephants, cattle and working animals",
    statusLabel: "Upcoming",
    status: "UPCOMING",
    dateLabel: "Opens 1 Feb 2027",
    ageCategoryLabels: ["Sub-junior", "Junior", "Senior", "Open"],
    feePaise: 0,
    feeLabel: "Free entry",
    accent: "blue",
    href: "#competitions/gentle-giants",
  },
];

export const competitionsSection = {
  heading: "Open and upcoming Competitions",
  more: { label: "All Competitions", href: "#competitions" } satisfies Link,
} as const;

export const footer = {
  blurb: "Friends of Animals runs children's art Competitions for animal welfare across India.",
  groups: [
    {
      heading: "Explore",
      links: [
        { label: "Competitions", href: "#competitions" },
        { label: "Gallery", href: "#gallery" },
        { label: "Auctions", href: "#auctions" },
        { label: "Adopt", href: "#adopt" },
      ],
    },
    {
      heading: "Organisation",
      links: [
        { label: "About", href: "#about" },
        { label: "Impact", href: "#impact" },
        { label: "Transparency", href: "#transparency" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy", href: "#legal/privacy" },
        { label: "Terms", href: "#legal/terms" },
        { label: "Child safeguarding", href: "#legal/child-safeguarding" },
        { label: "Auction terms", href: "#legal/auction-terms" },
        { label: "Refund policy", href: "#legal/refund-policy" },
      ],
    },
  ] as const satisfies readonly { heading: string; links: readonly Link[] }[],
  /** Placeholders: text labels only, no third-party brand icons. */
  social: [
    { label: "Instagram", href: "#social/instagram" },
    { label: "Facebook", href: "#social/facebook" },
    { label: "YouTube", href: "#social/youtube" },
    { label: "LinkedIn", href: "#social/linkedin" },
  ] as const satisfies readonly Link[],
  contact: "Contact details placeholder",
  copyright: "© 2026 Friends of Animals",
} as const;
