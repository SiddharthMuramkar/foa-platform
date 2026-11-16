# Friends of Animals (FOA) Platform

> **Status: rebuilding from scratch.** This README is the spec. There is no code on `main` yet.
> The previous codebase is kept only for reference at git tag **`legacy-baseline`** (see [Legacy reference](#legacy-reference)).
> Domain vocabulary lives in [`GLOSSARY.md`](./GLOSSARY.md); use its terms in code, UI copy and issues.

## 1. What FOA is

Friends of Animals (`foaglobal.org`) builds compassion for animals in children and young adults. Students enter creative Competitions (drawing, painting, art/craft, essay, photography, videography), individually or through their School. Winning Artwork goes on show in a public gallery and is auctioned, with Guardian consent, to raise money for shelters, mobile clinics, rescue, feeding drives and vet care. Donations, verifiable certificates and an NGO directory make the impact visible.

Primary market: India (INR, Indian schools), but the design should work globally.

## 2. Settled decisions (grilling session, 16 Nov 2026)

| Area | Decision | Rejected alternative (why) |
|---|---|---|
| Scope | Rebuild frontend **and** backend from scratch; legacy code is reference only | Incremental refactor (legacy live site was a mock; little worth keeping) |
| Frontend | **Next.js 16 App Router**, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query (client mutations), `next/image`, `next/font`; hosted on **Vercel** | Vite SPA + TanStack Router (no SSR: weak SEO and link previews for gallery, competitions, certificate links; slower first paint on phones) |
| Auth | **Clerk** (free plan): Google sign-in + email, email verification required | Keeping in-house JWT/bcrypt (more to secure, no bot protection) |
| Bot / agent protection | Clerk Protect, all on: *Challenge suspicious sign-ups* (Cloudflare Turnstile), *Require Device Intelligence checks*, *Block disposable email addresses*, *Block email subaddresses*. All included on the free plan. Add Vercel BotID only if abuse appears | Paid bot-protection service up front. Caveat: this stops scripted and headless sign-ups; nothing fully stops an AI agent driving a real browser |
| Roles | App DB `User.role` is the source of truth, mirrored to Clerk `publicMetadata.role` so Next.js can gate `/admin` without an API call. App user created on first signed-in request; Clerk webhook syncs email/name changes and deletions | Clerk Organizations for Schools (splits the School model across two systems; free-plan limits) |
| Role assignment | Every sign-up is a **Participant**. **School Coordinator** only after their School application is verified by an FOA admin. First Super Admin from env allowlist `BOOTSTRAP_ADMIN_EMAILS`; admins promote others in the admin UI | Choosing a role at sign-up (self-assigned privilege) |
| Backend runtime | **Docker** container, deployed to **Railway** from GitHub | VPS + compose (you own patching and backups); AWS ECS / Cloud Run (heavier) |
| Database | **PostgreSQL**: **Neon** in production (backups, branches for migrations), Postgres in `docker compose` locally. Real migrations, never `db push` against production | SQLite; self-run Postgres container in production |
| File storage | **Cloudflare R2** (S3-compatible). Browser uploads straight to the bucket via short-lived presigned URLs. Private bucket; an Artwork becomes publicly readable only once its Submission is approved and allows public display. MinIO container locally | Vercel Blob (ties the backend to Vercel); local disk (wiped on every container redeploy) |
| Email | **Resend** for app emails (Submission received, School verified, etc.). Clerk sends its own sign-in emails | Console-only notifications |
| Look and feel | Warm, editorial, Artwork-first. Off-white background, FOA blue `#0055A5` as primary, green `#00A651` for success, red `#E52421` only for Donate. Plus Jakarta Sans served from our own domain via `next/font`. Follows the phone's dark mode setting | Playful/kids or corporate-minimal |
| Mobile | Designed for phones first, every page. Dashboards use card lists and bottom-sheet filters instead of wide tables | Desktop-first with responsive afterthoughts |
| Images | Curated free-license stock (Unsplash/Pexels: animals, kids making art, rescue work), stored in the repo, optimized, served through `next/image`. Swap for real FOA photos when available | AI-generated imagery (uncanny; hurts trust on a donation site) |
| Quality | GitHub Actions on every PR: typecheck, lint, API tests against a Postgres service, Playwright smoke tests at phone and desktop sizes. Lighthouse mobile performance ≥ 90. Sentry (free) on frontend and backend. Uptime check on `/health` | Shipping without gates |
| Repo | Monorepo. Old code removed from `main`; history kept at `legacy-baseline` | Keeping legacy files beside the new code |

## 3. Open decisions (settle before building)

| # | Question | Recommendation |
|---|---|---|
| D1 | Backend stack, now that it's a from-scratch rebuild (the earlier "harden the existing Express app" plan no longer applies) | TypeScript + Express 5 + Prisma + Zod: the legacy business rules port across directly. Alternatives: Hono, NestJS |
| D2 | Monorepo tooling | pnpm workspaces + Turborepo (`turbo prune` keeps the API Docker image small) |
| D3 | Real payments (donations, auction bids) now, or record pledges labelled "payments coming soon"? | Pledges first; Razorpay (UPI/cards) once FOA settles tax/legal questions such as 80G receipts |
| D4 | Under-13 Participants: a Google account requires age 13+. Today the Participant signs up themselves and ticks a Guardian-consent box | Keep the rule for v1; product owner to decide whether under-13s need a Guardian-held account |
| D5 | v1 feature cut: legacy docs specified judging assignments, competition registration per School, participant profiles, a donations transparency page and NGO directory, but legacy code never built them | Decide per feature in the next session |
| D6 | GitHub home: create **private** `SiddharthMuramkar/foa-platform`, or under the coworker's/org's account? | Private, under your account |
| D7 | API ↔ Next.js data flow | Public pages fetch on the server and cache (fast and indexable); signed-in calls carry the Clerk token; browser calls only for mutations |

## 4. People and roles

| Role | Who | Can do |
|---|---|---|
| `SUPER_ADMIN` | FOA platform owner | Everything, including role management |
| `FOA_ADMIN` | FOA staff | Run Competitions, verify Schools, review Submissions, physical tracking, certificates, auctions |
| `COMPETITION_MANAGER` | FOA staff | Create, edit and publish Competitions |
| `JUDGE` | Central jury member | Score and review assigned Submissions |
| `SCHOOL_COORDINATOR` | Verified School's contact | Manage the School profile, upload its shortlisted Submissions, dispatch physical Artwork |
| `TEACHER` | School staff | Assist the Coordinator (lesser School role) |
| `PARTICIPANT` | Student, often a minor | Enter Competitions, manage Submissions and consent, download certificates |
| `DONOR` | Supporter | Donate, bid in auctions |
| `PUBLIC` | Anyone signed out | Browse Competitions, gallery, auctions; verify certificates |

## 5. End-to-end flow

1. **Competition setup**: an admin creates a Competition as `DRAFT` (title, theme, type, categories, rules, judging criteria, dates, prizes), then publishes it (`UPCOMING` / `REGISTRATION_OPEN`).
2. **School onboarding**: a signed-in user applies for a School (address, principal, authorised person). It starts `PENDING`; an admin verifies (`VERIFIED`) or rejects with notes. On verification the applicant becomes School Coordinator.
3. **School-level round**: the School runs the competition on campus, its jury picks its top entries per category (limit: `schoolShortlistLimit`, default 5), and the Coordinator uploads them as Submissions (`SHORTLISTED_BY_SCHOOL`). Individual Participants submit directly when the Competition allows it.
4. **Central judging and physical check**: admins assign Judges; Judges score against the criteria. For shortlisted work, FOA requests the physical Artwork; the School dispatches it (courier, tracking number); FOA receives it, inspects condition and verifies consent.
5. **Results and certificates**: admins publish results (winners, runners-up, finalists, merit); certificates are issued with a unique number and a QR code linking to public verification.
6. **Gallery and auction**: approved Artwork with consent appears in the public gallery; Artwork whose Submission allows auction is listed; signed-in buyers bid; proceeds fund animal welfare.

## 6. Minor safeguarding (hard requirements)

- A minor's phone number, address, exact date of birth and Guardian contact are **never** shown on public pages or returned by public API endpoints.
- Three separate consents on each Submission: **participation** (`parentConsentOnRecord`), **public display** (`publicDisplayAllowed`), **auction** (`auctionAllowed`). **All default to `false`.** The legacy code defaulted them to `true`; that was a bug.
- An Artwork appears in the gallery only when the Submission is `APPROVED` **and** participation consent **and** public-display consent are on record. Auction listing additionally needs auction consent and an admin's approval.
- Originals stay private. The public sees a watermarked preview or thumbnail only.
- Every admin action is written to the audit log (who, what, which record, when, IP).

## 7. Public site and dashboards

**Public routes (21):** `/`, `/about`, `/competitions`, `/competitions/[slug]`, `/gallery`, `/gallery/[id]`, `/auctions`, `/auctions/[id]`, `/donate`, `/animal-welfare`, `/community`, `/volunteer`, `/organizations`, `/impact`, `/events`, `/stories`, `/contact`, `/privacy`, `/terms`, `/verify/[certificateNumber]`, plus Clerk sign-in / sign-up.

- **Home**: mission hero, open Competitions, Artwork showcase, impact numbers.
- **Competition detail**: theme, rules, eligibility, dates, prizes, how to enter.
- **Gallery**: approved Artwork with the artist's statement; filter by category; search.
- **Auctions**: listings with story, current bid, countdown; bid when signed in.
- **Donate**: purpose-allocated giving (medical kits, food drives, outreach).
- **Verify certificate**: anyone can check a certificate number; revoked = invalid.

**Admin (`/admin`):** KPI overview (Competitions, Submissions, Schools, donations); Competition CRUD with date validation and publish/archive; School verification queue; Submission review, scoring and shortlisting; physical Artwork tracking; judging and results; certificates; auctions; donations; users and roles; audit log.

**School Coordinator (`/school`):** School profile, its Participants' Submissions, school-level shortlisting (respecting the limit), uploads, dispatch tracking.

**Participant (`/me`):** Submissions and their status, consent records, certificates (view and download).

## 8. Domain model (target)

Field-level detail for every entity is in the legacy `docs/DATABASE_SCHEMA.md` (`git show legacy-baseline:docs/DATABASE_SCHEMA.md`). Treat it as a starting point, not a contract.

```
User ──< SchoolMembership >── School
 │                              │
 ├──< Submission >──────────────┘        Competition ──< Submission
 │      ├──< SubmissionAsset (ORIGINAL_PRIVATE | WATERMARKED_PREVIEW | THUMBNAIL)
 │      ├──< Review (by a Judge)
 │      ├──── PhysicalArtworkTracking (0..1)
 │      ├──< Certificate
 │      └──── AuctionListing (0..1) ──< Bid
 ├──< Donation (donor optional: guests can give)
 └──< AuditLog
```

**Status lifecycles**

| Entity | Statuses |
|---|---|
| Competition | `DRAFT` → `UPCOMING` → `REGISTRATION_OPEN` → `ACTIVE` → `SUBMISSIONS_CLOSED` → `JUDGING` → `COMPLETED` → `ARCHIVED` |
| Competition type | `DRAWING`, `PAINTING`, `ART_CRAFT`, `ESSAY`, `PHOTOGRAPHY`, `VIDEOGRAPHY` |
| Physical Artwork required | `NOT_REQUIRED`, `OPTIONAL`, `TOP_SHORTLISTED_ONLY`, `ALL_WINNERS` |
| School | `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` |
| Submission | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED_BY_SCHOOL`, `FOA_SHORTLISTED`, `CORRECTION_REQUESTED`, `APPROVED`, `REJECTED` |
| Physical tracking | `NOT_REQUIRED`, `AWAITING_SELECTION`, `REQUESTED`, `AWAITING_DISPATCH`, `DISPATCHED`, `RECEIVED_BY_FOA`, `VERIFICATION_IN_PROGRESS`, `VERIFIED`, `RETURNED` |
| Certificate type | `PARTICIPATION`, `SCHOOL_MERIT`, `FINALIST`, `WINNER`, `RUNNER_UP`, `SPECIAL_MENTION`, `TEACHER_COORDINATOR` |
| Auction | `UPCOMING`, `ACTIVE`, `EXTENDED`, `CLOSED_SOLD`, `CLOSED_UNSOLD`, `CANCELLED` |
| Donation | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` (currency default `INR`) |
| User | `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED` |

Use real enums in the schema; the legacy SQLite schema stored all of these as free-text strings.

## 9. Business rules

- **Competition dates:** registration close is after registration open; submission close is after submission open. Slugs are unique.
- **School shortlist limit:** a School cannot have more than `schoolShortlistLimit` Submissions shortlisted per Competition and category. *(The legacy code never enforced this.)*
- **Identifiers:** Submission numbers `FOA-<year>-SUB-<seq>`, certificate numbers `FOA-CERT-<year>-<seq>`. Unique and sequential per year. *(The legacy code used random numbers and a hard-coded year, so collisions were possible.)*
- **Bids:** only on `ACTIVE` auctions; each bid must exceed the current price; checking and recording a bid must be one atomic step. *(The legacy code checked outside the transaction, so two simultaneous bids could both win.)* Amounts in INR.
- **Private Submissions:** only the owning Participant, their School's Coordinator, and admins/Judges can view a non-public Submission.
- **Certificates:** public verification returns recipient name, award, Competition and issue date only; revoked certificates verify as invalid.
- **Audit:** every admin action (publish, verify, approve, role change, etc.) is logged.

## 10. API surface (reference)

Legacy base path `/api/v1`. JSON envelope: `{ success, data, message? }` on success; `{ success: false, error: { code, message, details? } }` on failure. Full endpoint list: `git show legacy-baseline:docs/API_REFERENCE.md`.

Resource groups: competitions (public list/detail; admin create, edit, publish, archive), schools (apply; admin list, approve, reject), submissions (create, view, review, approve, shortlist), gallery (public), physical tracking (dispatch, receive, verify), certificates (mine, public verify, admin issue), auctions (public list/detail, bid), donations (create, transparency summary), admin (overview, users, role change, audit log). Auth endpoints (`/auth/login`, `/auth/register`) go away: Clerk owns sign-in.

## 11. Rebuild plan

1. Settle the open decisions in section 3 (`/grill-with-docs`).
2. Write ADRs in `docs/adr/` for the hard-to-reverse choices (Next.js frontend, Clerk auth, hosting).
3. Create the GitHub repo (D6), then work in a worktree `../foa-platform-wt-<name>` and land changes through PRs.
4. Scaffold the monorepo: `apps/web` (Next.js), `apps/api` (Docker), `packages/shared` (Zod schemas and types shared by both); `docker compose` for local Postgres and MinIO.
5. Build in vertical slices, each shippable: auth and roles → Competitions (public + admin) → Schools → Submissions and uploads → gallery → judging and results → certificates and verification → physical tracking → auctions → donations → content pages.
6. CI, Sentry and the performance budget from day one, not at the end.

## Legacy reference

The old code (React 18 + Vite SPA, Express + Prisma + SQLite API, and a mock Vercel serverless API with hard-coded logins that powered the old demo URL) is at tag `legacy-baseline`.

```bash
git show legacy-baseline:apps/api/src/routes/submissions.ts   # read one file
git ls-tree -r --name-only legacy-baseline                     # list files
git worktree add ../foa-platform-wt-legacy legacy-baseline     # browse it all
```

Why it was slow: every page loaded up front (no code splitting); images unsized and not lazy-loaded; render-blocking Google Fonts with six weights; every protected page waited on `/auth/me` before showing anything.

Other legacy material worth mining: `apps/api/prisma/seed.ts` (sample Competitions, Schools, Submissions, auction items), `docs/ARCHITECTURE.md` (Mermaid diagrams), `packages/shared/src/index.ts` (Zod schemas).

---

Friends of Animals (FOA) Platform. All rights reserved.
