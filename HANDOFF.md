# HANDOFF: Brand kit: icons, OG card, watermark and stamp ([#13](https://github.com/SiddharthMuramkar/foa-platform/issues/13))

PROTOTYPE, throwaway, never merge. Paused by the product owner on 2026-11-16; work pushed so nothing lives only on a laptop.

## State
- Three variants on one route: A Whole logo, B Paw mark, C Tile trio (assets generated with sharp scripts at real pixel sizes).
- `next build` passes (checked at pause).
- Two review lenses (brief fit, hard constraints) ran. The fix stage was **interrupted by the pause**, so review findings are recorded but not applied.
- Logo: uses the stand-in `apps/web/public/brand/foa-logo-standin.svg` (same group ids as the real one). Swap the path in `apps/web/app/prototype/brand-kit/logo.ts` to the signed-off SVG from branch `feat/6-logo-svg` (`packages/brand/foa-logo.svg`).
- Blocked by #6 and by #15 (Next.js on Workers: next/image, next/og). Using only part of the logo at small sizes is a product-owner decision. See also the logo minimum-height finding in #14.
## Run
`pnpm install && pnpm brand-kit`, then open http://localhost:3113/prototype/brand-kit?variant=A (`&theme=dark|light`, `&shot=1` hides the switcher; ←/→ cycles variants).

## Review assets
- `handoff/overview.png`, `handoff/sheet-*.png`: contact sheets per variant
- `handoff/shots/`: every screenshot (390×844 and 1440×900, light and dark)
- `handoff/review/`: reviewer crops
- `handoff/workflow-results.md`: every agent's return value (variant summaries, review findings with evidence and fixes)

## Next
1. Apply any remaining blocker/major findings from `handoff/workflow-results.md`, then re-shoot.
2. Product owner picks a variant, or mixes them.
3. Resolution comment on #13, with build specifics for slice S0e (token names, component and asset paths, CSS).
4. `docs:` PR to SPEC §4.8 in stack order #8 → #14 → #9 → #13. #8 also folds in the #12 typeface wording (Plus Jakarta Sans 400/700).

Hosting is Cloudflare Workers (OpenNext); preview deploys are on hold by the product owner.
