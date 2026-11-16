# HANDOFF: Logo on dark backgrounds ([#14](https://github.com/SiddharthMuramkar/foa-platform/issues/14))

PROTOTYPE, throwaway, never merge. Paused by the product owner on 2026-11-16; work pushed so nothing lives only on a laptop.

## State
- Three variants on one route: A Plate, B Light masthead, C Light islands.
- `next build` passes (checked at pause).
- Two review lenses (brief fit, hard constraints) ran. The fix stage **completed** (5 blocker/major and 8 minor findings handled).
- Logo: uses the stand-in `apps/web/public/brand/foa-logo-standin.svg` (same group ids as the real one). Swap the path in `apps/web/app/prototype/logo-dark/logo.ts` to the signed-off SVG from branch `feat/6-logo-svg` (`packages/brand/foa-logo.svg`).
- Key finding: the wordmark is unreadable below about 56px logo height, so the rule `LOGO_MIN_HEIGHT` is 56px on phones and 72px on desktop (header), 64px in the footer (`app/prototype/logo-dark/logo.ts`). This applies to S0e and the brand kit.
## Run
`pnpm install && pnpm logo-dark`, then open http://localhost:3114/prototype/logo-dark?variant=A (`&theme=dark|light`, `&shot=1` hides the switcher; ←/→ cycles variants).

## Review assets
- `handoff/overview.png`, `handoff/sheet-*.png`: contact sheets per variant
- `handoff/shots/`: every screenshot (390×844 and 1440×900, light and dark)
- `handoff/review/`: reviewer crops
- `handoff/workflow-results.md`: every agent's return value (variant summaries, review findings with evidence and fixes)

## Next
1. Apply any remaining blocker/major findings from `handoff/workflow-results.md`, then re-shoot.
2. Product owner picks a variant, or mixes them.
3. Resolution comment on #14, with build specifics for slice S0e (token names, component and asset paths, CSS).
4. `docs:` PR to SPEC §4.8 in stack order #8 → #14 → #9 → #13. #8 also folds in the #12 typeface wording (Plus Jakarta Sans 400/700).

Hosting is Cloudflare Workers (OpenNext); preview deploys are on hold by the product owner.
