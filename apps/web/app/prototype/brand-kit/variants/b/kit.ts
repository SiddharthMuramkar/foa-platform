// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
//
// Variant B's generated files and the measurements build.mjs wrote next to them. The page renders the
// numbers from kit-report.json, so the settings table and notes can't drift from the pixels.
import report from "./kit-report.json";

export const R = report;
export type BFile = keyof typeof report.files;

const DIR = "/prototype/brand-kit/b";

/** Path + intrinsic size of a generated Variant B file (public/prototype/brand-kit/b/<file>). */
export function bFile(file: BFile) {
  const f = report.files[file];
  return { src: `${DIR}/${file}`, width: f.w, height: f.h, bytes: f.bytes };
}

export const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const r2 = (n: number) => `${n.toFixed(2)}:1`;
