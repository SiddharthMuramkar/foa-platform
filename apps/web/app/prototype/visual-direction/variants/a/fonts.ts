// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
//
// Variant A fonts: exactly 2 weights in total (NFR-01), self-hosted by next/font.
//  - Display: Baloo 2 700 (rounded, bouncy) for headings, buttons, chips, numbers. Never used for body copy:
//    research/typeface (#12) rejects it as a body face.
//  - Body: Plus Jakarta Sans 400 (SPEC §4.8 face, research/typeface pick for body).
// Rule: body text is never bold. Emphasis goes to the display face, and `font-synthesis: none` on the root
// stops the browser faking a third weight.
import { Baloo_2, Plus_Jakarta_Sans } from "next/font/google";

export const display = Baloo_2({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
  variable: "--a-font-display",
});

export const body = Plus_Jakarta_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--a-font-body",
});
