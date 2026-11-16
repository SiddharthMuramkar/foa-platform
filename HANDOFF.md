# HANDOFF: Logo as an identical vector (SVG) ([#6](https://github.com/SiddharthMuramkar/foa-platform/issues/6))

Paused by the product owner on 2026-11-16. Work in progress, NOT signed off.

## State
- The product owner confirmed no original vector exists, so the logo was rebuilt from the flat half of `legacy-baseline:apps/web/public/foa-logo.jpg`.
- Three part builders finished (`packages/brand/_wip-rebuild/parts/`):
  - tiles + letters: fitted geometry
  - paw-and-hands mark: traced
  - wordmark: fitted to font outlines
- Per-part metrics are in `_wip-rebuild/workflow-results.md`. IoU ≥ 0.99, p95 boundary deviation 0.125 px for the reported parts.
- `packages/brand/foa-logo.svg` is assembled but **not yet measured or verified**: the assemble+measure stage was interrupted by the pause.
  - viewBox is tight bounds in raster px.
  - Groups: `tile-red`, `tile-green`, `tile-blue`, `letter-f`, `letter-o`, `letter-a`, `mark` (`mark-paw`, `mark-hands`), `wordmark`.
- Fallback wordmark: `_wip-rebuild/fallback/wordmark_traced.svg` (potrace, 16 glyphs `wm-<i>-<char>`; the wordmark is mixed case "Friends of Animals").
  - At 4×: IoU 0.990, mean 0.032 px, p95 0.25 px.
  - At 1×: IoU 0.985, mean 0.05 px, p95 1.0 px (pixel quantisation).
  - Use it if the font-fitted wordmark fails.
- Acceptance targets per part: IoU ≥ 0.98, mean ≤ 0.35 px, p95 ≤ 0.75 px.
- Not committed:
  - system font files (`work/fonts`, licence)
  - Chrome profile
  - `work/mark` intermediates (52 MB of candidate renders)

## Next
1. Assemble and measure the full SVG against the raster at 1× and 4×: resvg and Chrome renders, per-group metrics, overlays. Scripts are in `_wip-rebuild/scripts/`.
2. Run two independent checks: geometry, and type-and-mark.
3. Build a side-by-side sheet (original | SVG | diff, at 100% and 400%), then get the product owner's sign-off.
4. Resolution comment on #6 with the SVG path, this branch, and the group ids; close #6. Note the SVG in SPEC §4.8 via the #8 → #14 → #9 → #13 stack, not §3.2.
5. Remove `_wip-rebuild/` before the feat PR merges (keep it on a research or prototype branch if wanted).
