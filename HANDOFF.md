# HANDOFF: Logo scroll interaction ([#9](https://github.com/SiddharthMuramkar/foa-platform/issues/9))

PROTOTYPE, throwaway, never merge. Paused by the product owner on 2026-11-16; work pushed so nothing lives only on a laptop.

## State
- Three variants on one route: A Dock, B Tile cascade, C Paw lead (CSS-first per #4: scroll-driven animation-timeline plus IntersectionObserver fallback; no animation library).
- `next build` passes (checked at pause).
- Two review lenses (brief fit, hard constraints) ran. The fix stage was **interrupted by the pause**, so review findings are recorded but not applied.
- Logo: uses the stand-in `apps/web/public/brand/foa-logo-standin.svg` (same group ids as the real one). Swap the path in `apps/web/app/prototype/logo-scroll/logo.ts` to the signed-off SVG from branch `feat/6-logo-svg` (`packages/brand/foa-logo.svg`).
- Includes reduced-motion paths. Scroll-position and reduced-motion shots, plus webm captures, are in handoff/shots.
## Run
`pnpm install && pnpm logo-scroll`, then open http://localhost:3109/prototype/logo-scroll?variant=A (`&theme=dark|light`, `&shot=1` hides the switcher; ←/→ cycles variants).

## Review assets
- `handoff/overview.png`, `handoff/sheet-*.png`: contact sheets per variant
- `handoff/shots/`: every screenshot (390×844 and 1440×900, light and dark)
- `handoff/review/`: reviewer crops
- `handoff/workflow-results.md`: every agent's return value (variant summaries, review findings with evidence and fixes)

## Next
1. Apply any remaining blocker/major findings from `handoff/workflow-results.md`, then re-shoot.
2. Product owner picks a variant, or mixes them.
3. Resolution comment on #9, with build specifics for slice S0e (token names, component and asset paths, CSS).
4. `docs:` PR to SPEC §4.8 in stack order #8 → #14 → #9 → #13. #8 also folds in the #12 typeface wording (Plus Jakarta Sans 400/700).

Hosting is Cloudflare Workers (OpenNext); preview deploys are on hold by the product owner.
