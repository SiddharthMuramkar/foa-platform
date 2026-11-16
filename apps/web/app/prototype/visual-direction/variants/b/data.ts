// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant-local extra content. Tests how a transparency breakdown would look beside the impact numbers
// (SPEC §7.17 finance transparency). ILLUSTRATIVE ONLY: not FOA's accounts; always rendered with that label.

export const allocation = {
  heading: "How each ₹100 was spent",
  note: "Illustrative split for this prototype, not FOA’s accounts",
  items: [
    { label: "Treatment and rescue", share: 58, swatch: "bg-(--b-chart-1)" },
    { label: "Food and shelter", share: 21, swatch: "bg-(--b-chart-2)" },
    { label: "Competitions and education", share: 13, swatch: "bg-(--b-chart-3)" },
    { label: "Administration", share: 8, swatch: "bg-(--b-chart-4)" },
  ],
} as const;
