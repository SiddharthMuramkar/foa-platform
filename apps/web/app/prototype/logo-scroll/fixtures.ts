// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
// Shared, READ-ONLY fixture content for all variants: a long, neutral home-like page
// (visual direction #8 not chosen yet). Rendered by fixture-page.tsx.
// Safeguarding (SPEC §4.1 SG-01): gallery captions show only display name, age category label,
// School and city — never a child's real name, age in years or contact details. All placeholders.

export type NavItem = { label: string; href: string; donate?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { label: "Competitions", href: "#competitions" },
  { label: "Gallery", href: "#gallery" },
  { label: "Auctions", href: "#auctions" },
  { label: "Adopt", href: "#adopt" },
  { label: "About", href: "#about" },
  { label: "Donate", href: "#donate", donate: true },
];

export const HERO = {
  eyebrow: "Friends of Animals · India",
  title: "Children's art for animal welfare",
  body: "Every Artwork entered in an FOA Competition helps fund rescue, care and adoption for animals across India.",
  primaryCta: { label: "Enter a Competition", href: "#competitions" },
  secondaryCta: { label: "Donate", href: "#donate" },
};

export const COMPETITIONS = {
  id: "competitions",
  title: "Competitions",
  intro: "Open to schools and young artists. Pick a theme, make your Artwork, and help animals.",
  items: [
    { title: "Competition title one", meta: "Junior · Senior · Closes 15 Jan" },
    { title: "Competition title two", meta: "All age categories · Closes 28 Feb" },
    { title: "Competition title three", meta: "Senior · Opens soon" },
  ],
};

export const GALLERY = {
  id: "gallery",
  title: "Gallery",
  intro: "Featured Artworks from published Competition results.",
  items: [
    { title: "Artwork title", byline: "Display name · Junior (8–11)", place: "School name, City" },
    { title: "Artwork title", byline: "Display name · Sub-junior (5–7)", place: "School name, City" },
    { title: "Artwork title", byline: "Display name · Senior (12–15)", place: "School name, City" },
    { title: "Artwork title", byline: "Display name · Junior (8–11)", place: "School name, City" },
    { title: "Artwork title", byline: "Display name · Senior (12–15)", place: "School name, City" },
    { title: "Artwork title", byline: "Display name · Youth (16–17)", place: "School name, City" },
  ],
};

export const AUCTIONS = {
  id: "auctions",
  title: "Auctions",
  intro: "Bid on original Artworks. Proceeds go to animal welfare partners.",
  items: [
    { title: "Lot title one", meta: "Current bid ₹ —  · Ends in 2 days" },
    { title: "Lot title two", meta: "Current bid ₹ —  · Ends in 5 days" },
    { title: "Lot title three", meta: "Opening bid ₹ —  · Starts soon" },
  ],
};

export const IMPACT = {
  id: "about",
  title: "Impact",
  intro: "Placeholder figures for layout only.",
  stats: [
    { value: "0,000", label: "Artworks entered" },
    { value: "000", label: "Schools taking part" },
    { value: "₹0.0L", label: "Raised for animals" },
    { value: "000", label: "Animals adopted" },
  ],
};

export const DONATE = {
  id: "donate",
  title: "Help an animal today",
  body: "Your donation funds food, treatment and shelter through FOA's welfare partners.",
  cta: { label: "Donate", href: "#donate" },
};

export const FOOTER = {
  id: "adopt",
  columns: [
    { title: "Take part", links: ["Competitions", "Gallery", "Auctions"] },
    { title: "Help", links: ["Adopt", "Volunteer", "Donate"] },
    { title: "FOA", links: ["About", "Contact", "Report a concern"] },
  ],
  note: "© Friends of Animals. Prototype content.",
};
