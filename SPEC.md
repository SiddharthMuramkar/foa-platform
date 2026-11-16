# Friends of Animals (FOA) Platform — Specification

> **This file is the single source of truth for what to build.** There is no code on `main` yet.
> Vocabulary: [`GLOSSARY.md`](./GLOSSARY.md). Hard-to-reverse decisions: [`docs/adr/`](./docs/adr/).
> Legacy code (reference only, never copy blindly): git tag `legacy-baseline` (see §14).

---

## 0. How to use this spec (agents read first)

1. **Scope is everything in this file.** All modules ship together in one release. There is no phasing; §12 gives the build order (dependencies only).
2. **Requirement IDs.** Every requirement has an ID: `FR-<MODULE>-nn` (functional), `BR-nn` (business rule), `NFR-nn` (non-functional), `SG-nn` (safeguarding). Cite the IDs in issue titles/bodies, PR descriptions, test names (`it("FR-SUB-04: …")`) and commit messages.
3. **Keywords.** MUST = required for acceptance. SHOULD = expected unless a reason is written in the PR. MAY = optional.
4. **Vocabulary.** Use `GLOSSARY.md` terms in code, UI copy, API names and issues. Do not drift to the synonyms it lists under *Avoid* (e.g. never "entry", "student", "institution" as model names; the client brief's "Entry ID" is our **Submission number**, "Institution ID" is our **School number**).
5. **Open decisions (§13)** are not blockers: build the stated default, keep the seam named in the decision, and do not invent policy text.
6. **Conflicts.** If code, an ADR and this spec disagree, this spec wins; raise the conflict in the PR. If this spec is ambiguous, pick the safest reading for minors' data (§4.1), note it in the PR, and add a line to §13.
7. **Changing the spec.** Spec changes land in their own PR (`docs:` prefix) before or with the code that depends on them.

### 0.1 Engineering workflow

- Issues: GitHub `SiddharthMuramkar/foa-platform` (see `docs/agents/issue-tracker.md`); triage labels per `docs/agents/triage-labels.md`. One issue per vertical slice ticket (§12), sub-issues per FR group when a slice is large.
- Branches `<type>/<issue#>-<slug>`; worktrees `../foa-platform-wt-<slug>`; land through PRs to `main` only.
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- A PR is mergeable only when §11 Definition of Done holds.

---

## 1. Product summary

A web platform (mobile-first) for Friends of Animals (`foaglobal.org`) that runs creative Competitions (drawing, painting, art/craft, essay, photography, videography) for children and young adults, individually or through their School; judges and recognises the work; shows it in a public gallery; auctions consented physical Artwork; takes donations and Enrolment fees online; publishes its finances; and connects people to animal-welfare organisations, adoption, volunteering, events and a long-term community.

Primary market India (INR, Indian schools, Asia/Kolkata); data model and UI MUST work for any country.

---

## 2. Actors, roles and permissions

### 2.1 Role model

Two layers. Authorisation is always decided by the API from the database; Clerk metadata is only a UI hint.

**A. Staff role** — `User.staffRole`, nullable, at most one per user. Only `SUPER_ADMIN` can assign or remove staff roles.

| Staff role | Who (client stakeholder) | Scope |
|---|---|---|
| `SUPER_ADMIN` | Platform owner, technology team lead | Everything, incl. staff roles, settings, safeguarding lead, data requests |
| `FOA_ADMIN` | FOA administrators, technical support | All operational modules; approves Competition results; no staff-role changes |
| `COMPETITION_MANAGER` | Program & competition coordinators | Competitions, registrations, Enrolments, Submission verification, physical Artwork, judging setup, draft results, certificates, prize fulfilment |
| `CONTENT_MANAGER` | Social media & content team (lead) | Content, legal pages, events, campaigns, gallery curation, social planner, media library, social kits; publishes |
| `CONTENT_CONTRIBUTOR` | Content/social volunteers | Draft content and social posts; cannot publish |
| `COMMUNITY_MANAGER` | Community managers | Members, clubs, ambassadors, volunteers, Welfare Partner verification, contact inbox, broadcasts to community |
| `FINANCE_MANAGER` | Finance / accounts team | Payments, refunds, donations, funds, sponsors, ledger, budgets, transparency publishing, exports |
| `AUCTION_MANAGER` | Auction administrators | Auction listings, bids oversight, payment follow-up, fulfilment & logistics |
| `ADOPTION_COORDINATOR` | Adoption coordinators | Adoption listing moderation, applications oversight, rehoming requests |

**B. Relationship roles** — derived from records; a user can hold many at once.

| Relationship role | Derived from | Can |
|---|---|---|
| Member | Any signed-in `User` (default for every sign-up) | Manage own profile, join community, donate, register for events, apply to volunteer, adopt (if 18+) |
| Participant | A `ParticipantProfile` with `userId` = the user | Enter Competitions, manage own Submissions & consents, download own certificates |
| Guardian | `ParticipantProfile.guardianUserId` = the user | Everything a Participant can, on behalf of each linked minor; give/withdraw consent |
| School Coordinator | `SchoolMembership(role=COORDINATOR)` on a `VERIFIED` School | School profile, members, registrations, roster, fees, conduct certification, school results & shortlist, uploads, dispatch, certificate downloads, club |
| Teacher | `SchoolMembership(role=TEACHER)` on a `VERIFIED` School | Same as Coordinator except: members, fee payment, locking school results, conduct certification |
| Judge | `JudgeAssignment` on an `OPEN` Judging Round | Score assigned Submissions (blind) |
| Welfare Partner rep | `WelfarePartnerMembership` on a `VERIFIED` Welfare Partner | Edit the partner's directory listing, post Adoption Listings, review applications for own listings |
| Volunteer | `VolunteerProfile(status=ACTIVE)` | Sign up for opportunities, log hours |
| Ambassador | `AmbassadorProfile(status=ACTIVE)` | Ambassador badge/page; ambassador opportunities |
| Bidder | `BidderProfile` complete (18+ declaration, phone, accepted auction terms) | Bid in auctions |
| Adopter | Has an `AdoptionApplication` | Track own applications |
| Donor | Has a `Donation` (guests can donate without an account) | View receipts, manage recurring donations |
| Public | Signed out | Browse public pages, verify certificates, donate, contact, pledge, register for public events |

**Changed from the previous spec:** sign-up no longer makes someone a Participant; every sign-up is a **Member**, and a `ParticipantProfile` is created when someone (or their Guardian, or their School) enrols them in a Competition.

### 2.2 Bootstrap and assignment

- FR-AUTH-01: The first `SUPER_ADMIN`(s) come from env `BOOTSTRAP_ADMIN_EMAILS`; on first sign-in with a verified matching email the user gets `staffRole=SUPER_ADMIN`.
- FR-AUTH-02: `SUPER_ADMIN` assigns/removes staff roles in `/admin/users`; each change is audited and mirrored to Clerk `publicMetadata.staffRole`.
- FR-AUTH-03: A School applicant becomes `COORDINATOR` only when an admin verifies the School. Coordinators invite Teachers by email; invite acceptance requires sign-in with that email.
- FR-AUTH-04: Judges are invited per Competition by `COMPETITION_MANAGER` (email invite → sign-in → `JudgePanelMember`), then assigned to rounds.
- FR-AUTH-05: Welfare Partner reps: the registering user becomes the first rep; reps invite further reps.
- FR-AUTH-06: Staff must accept the current Safeguarding Policy version before any `/admin` page or staff endpoint works (SG-10).

### 2.3 Permission matrix (summary)

`A` = full, `R` = read, `O` = own records only, `—` = none. Staff roles not listed have `—`. `SUPER_ADMIN` = `A` everywhere.

| Area | FOA_ADMIN | COMP_MGR | CONTENT | COMMUNITY | FINANCE | AUCTION | ADOPTION | Coordinator | Judge | Participant/Guardian | Public |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Competitions | A | A (no results approval) | R | R | R | R | — | R | R (assigned) | R | R (published) |
| Schools | A | A | — | R | R | — | — | O | — | — | R (opt-in list) |
| Enrolments / roster | A | A | — | R | R (fees) | — | — | O | — | O | — |
| Submissions (private) | A | A | R (gallery-eligible) | — | — | R (auction-eligible) | — | O | R (assigned, blind) | O | — |
| Judging & results | A | A (draft) | — | — | — | — | — | R (own school, after publish) | O (own scores) | R (after publish) | R (after publish) |
| Certificates | A | A | R | R | — | — | — | O (download) | — | O | verify only |
| Physical Artwork | A | A | — | — | — | R | — | O (dispatch) | — | R (status) | — |
| Gallery curation | A | R | A | — | — | — | — | — | — | — | R (public) |
| Auctions | A | R | R | — | R | A | — | — | — | Bidder: O | R |
| Payments / refunds | R | R (fees) | — | — | A | R (auction) | — | O | — | O | — |
| Donations / funds / sponsors | R | — | R | — | A | — | — | — | — | O | R (public) |
| Ledger / budgets / transparency | R | — | — | — | A | — | — | — | — | — | R (published) |
| Welfare Partners | A | — | R | A | — | — | R | — | — | — | R (verified) |
| Adoption | A | — | R | — | — | — | A | — | — | O | R (available) |
| Volunteers | A | R | R | A | — | — | — | — | — | O | R (opportunities) |
| Community / clubs / ambassadors | A | R | R | A | — | — | — | O (club) | — | O | R (public pages) |
| Events / campaigns | A | R | A | A | R | — | R | R | — | O | R |
| Content / social planner | A | R | A (contributor: draft) | R | — | — | — | — | — | — | R (published) |
| Contact inbox | A | R (topic) | R (topic) | A | R (topic) | R (topic) | R (topic) | — | — | — | create |
| Broadcasts | A | A (competition audiences) | A (newsletter) | A (community) | — | A (bidders) | — | O (own school's participants) | — | — | — |
| Reports & analytics | A | R | R | R | R | R | R | O (own school) | — | — | R (impact page) |
| Users & staff roles | R (no role change) | — | — | R | — | — | — | — | — | — | — |
| Audit log | R | — | — | — | — | — | — | — | — | — | — |
| Settings | R | — | — | — | — | — | — | — | — | — | — |

---

## 3. Architecture (fixed decisions)

### 3.1 Stack

| Layer | Choice | Notes / rejected alternative |
|---|---|---|
| Frontend | **Next.js 16 App Router**, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui, TanStack Query (client mutations + polling), `next/image`, `next/font`, next-intl (i18n-ready), React Hook Form + Zod | Vite SPA rejected: no SSR, weak SEO/link previews |
| Web hosting | **Vercel** | — |
| Auth | **Clerk**: Google + email sign-in, email verification required. `clerkMiddleware()` in `apps/web/proxy.ts`; **authorisation checks live next to the resource** (layouts, server components, server actions, API) — do not use the deprecated `createRouteMatcher()` | In-house JWT rejected |
| Bot protection | Clerk Protect: challenge suspicious sign-ups (Turnstile), device-intelligence checks, block disposable emails and subaddresses. Cloudflare Turnstile on public forms (contact, guest donate, pledge, guest event registration, newsletter) | — |
| API | **Node.js 24 LTS, TypeScript, Express 5, Zod** (shared schemas), `@clerk/express` for token verification, pino logging, helmet, cors allowlist, `rate-limiter-flexible` (Postgres store) | Hono/NestJS rejected: Express ports legacy rules directly |
| ORM / DB | **Prisma ORM 7** (`prisma-client` generator with explicit `output`, `@prisma/adapter-pg` driver adapter, `prisma.config.ts`) on **PostgreSQL 17**. Neon in production (pooled URL for app, direct URL for migrations); Postgres in docker compose locally. `prisma migrate deploy` only; never `db push` against shared DBs | SQLite rejected |
| Background jobs | **pg-boss** (Postgres-backed; `createQueue` with `retryLimit`, `retryBackoff`, `deadLetter`; `schedule` with `tz: 'Asia/Kolkata'`) in a separate **worker** process | BullMQ rejected: needs Redis |
| Media processing | `sharp` (images: EXIF/GPS strip, re-encode, resize, watermark, logo stamp), `ffmpeg` (video preview transcode + poster) in the worker image | Third-party video service rejected for now |
| PDFs / QR | `@react-pdf/renderer` (certificates, receipts), `qrcode` | Headless-browser PDF rejected: heavy image |
| File storage | **Cloudflare R2** (S3 API). Two buckets: `foa-private` (originals, consent and finance documents, receipts) and `foa-public` (only derivatives cleared for public view) behind `media.foaglobal.org`. Browser uploads go straight to `foa-private` via short-lived presigned URLs (multipart for video). MinIO locally | Vercel Blob / local disk rejected |
| Email | **Resend** + React Email templates (`packages/emails`); Mailpit locally. Clerk sends its own auth emails | — |
| SMS / WhatsApp | Channel adapter interface only; no provider wired (OD-02) | — |
| Payments | **Razorpay** (INR): Orders API + Standard Checkout; signature check with `validatePaymentVerification`; webhooks verified with `validateWebhookSignature` over the **raw body**; Subscriptions for recurring donations; Refunds API | — |
| API hosting | **Docker** image deployed to **Railway** from GitHub; one image, two services: `api` (HTTP) and `worker` (pg-boss consumers + schedules) | VPS rejected |
| Monorepo | **pnpm workspaces + Turborepo**; `turbo prune` for the API image | — |
| Observability | Sentry (web, api, worker), pino JSON logs, uptime checks on `/health` | — |
| Analytics | DB-derived KPIs (§7.12) + Vercel Web Analytics (cookieless) on public pages only. No ad or tracking pixels anywhere | — |
| Maps (directory) | Leaflet + OpenStreetMap tiles, lazy-loaded (SHOULD) | — |

ADRs to write in slice S0: `0001-nextjs-frontend`, `0002-clerk-auth`, `0003-hosting-vercel-railway-neon-r2`, `0004-razorpay-payments`, `0005-pg-boss-jobs`, `0006-two-bucket-media-privacy`.

### 3.2 Repository layout

```
apps/
  web/            Next.js 16 — public site + all dashboards (/me, /school, /judge, /partner, /admin)
  api/            Express 5 REST API (src/modules/<module>/{routes,service,policy}.ts) + worker entry (src/worker.ts)
packages/
  shared/         Zod schemas, enums, DTO types, permission policy map, ID formats, money/date helpers
  db/             Prisma schema, migrations, generated client, seed (imported only by apps/api)
  emails/         React Email templates
  brand/          Logo files (SVG/PNG), watermark + stamp assets, design tokens
  config/         tsconfig, eslint, prettier presets
docker-compose.yml   postgres:17, minio, mailpit
docs/adr/            ADRs
```

- API modules own their routes, service and policy files; cross-module calls go through services, never another module's routes.
- `packages/shared` is the contract: request/response Zod schemas are defined once and imported by both apps.

### 3.3 Data flow

- **Public pages** (home, competitions, gallery, auctions list, directory, adoption, content, events, transparency, impact) render on the server, fetch from the API without a token, and cache with Next Cache Components (`'use cache'` + `cacheTag`/`cacheLife`). The API calls the web app's `POST /api/revalidate` (shared secret) with tags after any mutation that changes public data.
- **Signed-in pages** fetch on the server with the Clerk session token (`auth().getToken()`) passed as `Authorization: Bearer` to the API.
- **Mutations** go from the browser via TanStack Query straight to the API with the bearer token (CORS allowlist: web origins only). Server Actions are not used for API mutations (one path for auth and validation).
- **Live data**: auction lots poll every 5 s while visible (TanStack Query `refetchInterval`); countdowns use the server time from each response.

### 3.4 Identity flow

1. User signs in with Clerk on the web app.
2. First authenticated API request: API verifies the token (`@clerk/express`), finds `User` by `clerkUserId`, creates it if missing (just-in-time), applies the bootstrap rule (FR-AUTH-01).
3. Clerk webhooks (`user.created`, `user.updated`, `user.deleted`; Svix-verified) keep email/name in sync and soft-delete on deletion.
4. `publicMetadata.staffRole` is mirrored from the DB for UI gating; every API call re-checks the DB.

### 3.5 Upload and media pipeline

1. Client `POST /uploads` with `{purpose, fileName, mimeType, sizeBytes}` → API validates against the purpose's rules (§4.7) and returns a presigned PUT (or multipart part URLs) for `foa-private/uploads/<uuid>` with 10-minute TTL.
2. Client uploads directly, then `POST /uploads/:id/complete`.
3. API HEADs the object, creates an `Asset(status=PENDING_PROCESSING)`, enqueues `asset.process`.
4. Worker checks magic bytes, re-encodes images with `sharp` (strip all metadata incl. GPS, auto-orient), writes private derivatives: `judging` (2560 px long edge, subtle "FOA JUDGING" mark), `preview` (1600 px, FOA watermark), `thumb` (480 px), `og` (1200×630 with FOA logo stamp). Video: H.264/AAC MP4 ≤ 720p preview with watermark + poster frame. Then `Asset(status=READY)`; failures → `REJECTED` with a reason shown to the uploader.
5. **Publishing** copies `preview`/`thumb`/`og` derivatives to `foa-public` only when the owning record becomes public (gallery, auction, content). Unpublishing or consent withdrawal deletes them from `foa-public` and purges the CDN path (SG-05).
6. Originals are never public. Private reads use presigned GET URLs with 5-minute TTL issued after a policy check.

### 3.6 Payment flow (Razorpay)

1. Client asks the API to start a payment for a purpose (Enrolment fees, donation, auction lot). **The API computes the amount**; the client never sends it.
2. API creates a `Payment(status=CREATED)` and a Razorpay Order (`receipt` = Payment id, `notes` = purpose + ids), returns order id + key id.
3. Web opens Razorpay Checkout. On success the client posts `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` to `POST /payments/:id/verify`; API checks with `validatePaymentVerification` and marks `AUTHORIZED_CLIENT` (shows success UI).
4. **The webhook is the source of truth**: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.failed`, `subscription.*`. Each event is verified with `validateWebhookSignature(rawBody, header, secret)`, stored once in `WebhookEvent` (unique provider event id) and processed idempotently: Payment → `CAPTURED`/`FAILED`, then the purpose is fulfilled (Enrolments `PAID`, Donation `COMPLETED`, auction `PAID`), a ledger entry is written, and the receipt email is sent.
5. Reconciliation job (every 15 min): Payments in `CREATED`/`AUTHORIZED_CLIENT` older than 30 min are re-fetched from Razorpay and synced; older than 24 h with no payment → `EXPIRED`.
6. Refunds: `FINANCE_MANAGER` only, with reason; full or partial; audited; ledger reversal on `refund.processed`.
7. Test mode keys in every non-production environment.

### 3.7 Environments and configuration

| Env | Web | API/worker | DB | Media | Payments |
|---|---|---|---|---|---|
| local | `pnpm dev` | `pnpm dev` (api + worker) | docker Postgres | MinIO | Razorpay test |
| preview (per PR) | Vercel preview | Railway PR environment | Neon branch per PR | R2 `*-preview` buckets | Razorpay test |
| production | Vercel prod | Railway prod | Neon main | R2 prod buckets | Razorpay live |

Env vars (validated at boot with Zod; app refuses to start on missing/invalid):
`DATABASE_URL`, `DIRECT_DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `BOOTSTRAP_ADMIN_EMAILS`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_BUCKET`, `MEDIA_PUBLIC_BASE_URL`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `WEB_BASE_URL`, `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `REVALIDATE_SECRET`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `CORS_ORIGINS`, `APP_TIMEZONE` (default `Asia/Kolkata`).

Admin-editable runtime settings live in the `Setting` table (§5.14), not env.

---

## 4. Cross-cutting requirements

### 4.1 Minor safeguarding (hard requirements)

A **minor** is anyone under 18 on the date their record is created (computed from date of birth; recomputed on each new Enrolment).

- SG-01: A minor's phone, email, street address, pin code, exact date of birth, age in years and Guardian details MUST never appear on public pages, in public API responses, in OG/meta tags, sitemaps or logs. Public views of a minor show only: approved display name, age category label, School name, city/state/country, Competition, award.
- SG-02: Every Submission carries three separate consents — **participation**, **public display** (gallery + FOA social channels), **auction**. **All default to `false`.** Each is a `ConsentRecord` (§5.2); the Submission keeps denormalised booleans `participationConsent`, `publicDisplayConsent`, `auctionConsent` updated in the same transaction.
- SG-03: For a minor, consents are given by the Guardian (or certified by the School Coordinator for roster Participants, `method=COORDINATOR_CERTIFIED`). For an adult Participant, by themselves.
- SG-04: An Artwork appears in the gallery only when: Submission status ∈ {`VERIFIED`, `IN_JUDGING`, `JUDGED`}, participation **and** public-display consent are true, the Competition's results are published, and a staff user has featured it (`GalleryItem`). Auction listing additionally needs auction consent, physical Artwork `VERIFIED` and `AUCTION_MANAGER` approval.
- SG-05: Withdrawing public-display consent removes the item from the gallery, social planner and `foa-public` within 5 minutes (synchronous unpublish + cache revalidation + CDN purge). Withdrawing auction consent cancels any not-yet-sold listing. After a sale is paid, auction consent cannot be withdrawn (stated in the consent text).
- SG-06: Originals stay private. The public sees watermarked previews/thumbnails only.
- SG-07: No user-to-user messaging, comments or forums that involve minors. The only messaging feature is between adult adoption applicants and Welfare Partner reps (§7.9).
- SG-08: Every public user-generated item (gallery feature, adoption listing, directory listing, pledge names, event photos, club activity photos) is staff-approved before it is published. Every public item has a "Report a concern" link (§7.13).
- SG-09: Notifications about a minor go to the Guardian email (if present) and/or the School Coordinator; marketing/community messages are never sent to a minor's own address.
- SG-10: Staff accept the current Safeguarding Policy version before accessing staff surfaces; acceptance is stored with timestamp and version.
- SG-11: Judges see Submissions blind: no name, School, city, contact or display name; only Submission number, category, title, statement and media.
- SG-12: Exports containing minors' data (CSV, ZIP) are audited as sensitive reads, generated as files with 24-hour signed links, and restricted to `FOA_ADMIN`/`SUPER_ADMIN` (`COMPETITION_MANAGER` for their Competitions).
- SG-13: Bidding, adopting, volunteering on-ground, Welfare Partner rep and staff roles require the user to declare they are 18+ (stored with timestamp).

### 4.2 Consent model

- FR-CONSENT-01: `ConsentKind`: `PARTICIPATION`, `PUBLIC_DISPLAY`, `AUCTION`, `COMMUNICATION` (newsletters/community/marketing), `VOLUNTEER_MINOR` (Guardian consent for a minor Volunteer), `DATA_PROCESSING` (privacy notice acceptance).
- FR-CONSENT-02: `ConsentMethod`: `CHECKBOX_SELF` (adult), `CHECKBOX_GUARDIAN` (Guardian ticks on behalf of a minor; records Guardian name, relation, email/phone), `COORDINATOR_CERTIFIED` (Coordinator certifies signed paper forms are held by the School; MAY upload a scan), `VERIFIED_GUARDIAN` (reserved, not built; see OD-11).
- FR-CONSENT-03: Every consent references a `LegalDocumentVersion` (the exact text shown). Legal documents (consent texts, terms, privacy notice, auction terms, bidder terms, refund policy, safeguarding policy) are versioned; publishing a new version never alters existing records.
- FR-CONSENT-04: Consent records are append-only; withdrawal creates a new record with `granted=false`. Current state = latest record per (subject, kind, scope).
- FR-CONSENT-05: The Participant/Guardian sees and changes consents per Submission in `/me`; Coordinators see consent status for their roster.

### 4.3 Audit log

- FR-AUDIT-01: Every staff mutation, every Coordinator lock/certify action, every consent change, every payment/refund action, every role change and every sensitive read (SG-12) writes an `AuditLog` row: actor user id, staff role at the time, action (`<module>.<verb>`, e.g. `competition.publish`), entity type + id, before/after JSON diff with PII fields redacted, IP, user agent, request id, timestamp.
- FR-AUDIT-02: Append-only: a DB trigger rejects `UPDATE`/`DELETE` on `audit_log`.
- FR-AUDIT-03: `/admin/audit` lists, filters (actor, action, entity, date) and exports.

### 4.4 Identifiers

Human-facing numbers are sequential per scope and year, generated inside the creating transaction from an `IdSequence(scope, year)` row (`UPDATE … SET next = next + 1 RETURNING`). Year = calendar year in `APP_TIMEZONE` at creation. Zero-padded to the shown width; may grow beyond it.

| Record | Format | Client term |
|---|---|---|
| School | `FOA-SCH-00001` (no year) | Institution ID |
| ParticipantProfile | `FOA-P-000001` (no year) | FOA Participant ID |
| CompetitionRegistration | `FOA-2027-REG-00001` | Competition registration reference / number |
| Submission | `FOA-2027-SUB-00001` | Entry ID / Submission ID |
| PhysicalArtwork | `FOA-2027-ART-00001` | Artwork ID |
| Certificate | `FOA-CERT-2027-00001` | Certificate number |
| Donation receipt | `FOA-2027-DON-00001` | Receipt number |
| Payment receipt (fees, auction) | `FOA-2027-RCP-00001` | Receipt number |
| AuctionListing | `FOA-2027-LOT-001` | Lot number |
| AdoptionListing | `FOA-ADP-00001` | — |

Internal primary keys are UUIDv7. Public URLs use slugs or the human number, never sequential DB ids.

### 4.5 Money, time, locale

- Money is stored as integer **paise** with a `currency` column (`INR` only for now). No floats anywhere.
- Timestamps stored in UTC (`timestamptz`); shown in the viewer's timezone, default `Asia/Kolkata`. Date windows are `[opensAt, closesAt)`.
- All UI strings go through next-intl message catalogues (`en` only now; OD-03). Content entities are single-language.
- Addresses: country (ISO 3166-1), state/region, city, postal code (India: 6-digit pin code validation; others free text), line 1/2.
- Phone numbers stored E.164, validated with `libphonenumber-js`; default region IN.

### 4.6 Logo stamping and watermarks (module 32)

- FR-STAMP-01: Every image that leaves the platform for public or social use carries the FOA logo: gallery previews (corner watermark), OG images, certificate share images, social-kit images, auction images.
- FR-STAMP-02: Certificates (PDF and share PNG) carry the FOA logo, seal and QR code. A certificate image can only be generated from an `ISSUED`, non-revoked certificate.
- FR-STAMP-03: Stamping runs in the worker with `sharp.composite`, using assets from `packages/brand`; placement and opacity are settings.
- FR-STAMP-04: Social-kit downloads are generated only from stamped derivatives; there is no download of unstamped public images.

### 4.7 File rules per purpose

| Purpose | Types | Max size | Count |
|---|---|---|---|
| Artwork image (drawing, painting, art/craft, photography) | JPEG, PNG, HEIC/HEIF (converted), WebP | 25 MB each | 1–5 (`maxFiles` per Competition, default 3) |
| Essay | Typed text in editor (word limit per Competition) **or** PDF/DOCX | 10 MB | 1 |
| Video | MP4, MOV | 500 MB (multipart) | 1 (`maxDurationSec` per Competition) |
| Consent form scan, conduct evidence | PDF, JPEG, PNG | 10 MB | 1–10 |
| Condition photos (physical receipt) | JPEG, PNG | 15 MB | 1–10 |
| Directory / adoption photos | JPEG, PNG, WebP | 10 MB | 1–10 |
| Finance documents, invoices | PDF, JPEG, PNG | 20 MB | 1–10 |
| Content images | JPEG, PNG, WebP, SVG (staff only, sanitised) | 10 MB | — |

### 4.8 Look and feel

- Warm, editorial, Artwork-first. Off-white background; FOA blue `#0055A5` primary; green `#00A651` success; red `#E52421` only for Donate. Plus Jakarta Sans self-hosted via `next/font`. Follows the device dark-mode setting; tokens defined once in `packages/brand` and mapped to Tailwind v4 theme variables.
- Mobile-first on every page. Dashboards use card lists and bottom-sheet filters instead of wide tables on phones; tables MAY appear from `md` up.
- Imagery: curated free-licence stock (animals, children making art, rescue work) stored in the repo and optimised; no AI-generated imagery.
- Empty, loading (skeleton) and error states designed for every list and form.

### 4.9 Accessibility and SEO

- NFR-A11Y: WCAG 2.2 AA. Keyboard reachable, visible focus, labelled inputs, error text linked to fields, 4.5:1 contrast in both themes, reduced-motion respected. Content images require alt text (CMS enforces); Artwork alt = title + optional "image description" field.
- SEO: per-route metadata, OG images, `sitemap.xml` (competitions, results, gallery, content, events, campaigns, directory, adoption listings), `robots.txt`, JSON-LD (`Organization`/`NGO`, `Event`, `Article`, `BreadcrumbList`). Dashboards and `/verify/*` are `noindex`.

### 4.10 Notifications (module 30)

- FR-NOTIF-01: Channels: `EMAIL` (Resend), `IN_APP` (bell + `/me/notifications`), `SMS` and `WHATSAPP` (adapter interface, disabled; OD-02).
- FR-NOTIF-02: Each event in §7.13 maps to a template per channel; templates live in code (`packages/emails`), copy is reviewed in PRs.
- FR-NOTIF-03: Transactional notifications always send; `COMMUNICATION`-consent-gated notifications (newsletters, invitations, campaigns) send only with current consent; every non-transactional email has one-click unsubscribe (`List-Unsubscribe`).
- FR-NOTIF-04: Sending is asynchronous via the `notify.send` queue with retries; Resend webhooks record delivered/bounced/complained; hard bounces and complaints suppress the address.
- FR-NOTIF-05: SG-09 routing for minors applies to every notification.

---

## 5. Domain model

Field lists are the contract for the Prisma schema; agents add `id` (UUIDv7), `createdAt`, `updatedAt` to every model and choose indexes. `?` = nullable. Enums are real Postgres enums. Relations are named in prose where not obvious.

### 5.1 Identity and Schools

- **User**: `clerkUserId` (unique), `email` (unique), `fullName`, `phone?`, `staffRole?: StaffRole`, `status: ACTIVE | SUSPENDED | DELETED`, `adultDeclaredAt?`, `safeguardingAcceptedVersionId?`, `safeguardingAcceptedAt?`, `deletedAt?`.
- **School**: `number` (`FOA-SCH-…`), `name`, `kind: SCHOOL | COLLEGE | UNIVERSITY | OTHER`, `board?` (free text, e.g. CBSE/ICSE/State/IB), `addressLine1`, `addressLine2?`, `city`, `state`, `postalCode`, `country`, `phone`, `email`, `website?`, `principalName`, `principalEmail`, `principalPhone`, `authorisedPersonName`, `authorisedPersonDesignation`, `authorisedPersonEmail`, `authorisedPersonPhone`, `expectedParticipants`, `status: SchoolStatus`, `verificationNotes?`, `verifiedAt?`, `verifiedById?`, `showOnPublicList` (default false), `createdById`.
- **SchoolMembership**: `userId?`, `schoolId`, `role: COORDINATOR | TEACHER`, `status: INVITED | ACTIVE | REMOVED`, `invitedEmail`, `invitedById?`; unique (`schoolId`, `invitedEmail`).

### 5.2 Participants, Guardians, consent, legal texts

- **ParticipantProfile**: `number` (`FOA-P-…`), `userId?` (own login), `guardianUserId?` (managing Guardian account), `fullName` (legal; printed on certificates), `displayName` (public; default first name + last initial), `dateOfBirth`, `schoolId?` (verified School), `schoolNameText?` (individual route), `grade?`, `city`, `state`, `country`, `postalCode?`, `phone?`, `email?`, `guardianName?`, `guardianRelation?: MOTHER | FATHER | LEGAL_GUARDIAN | OTHER`, `guardianEmail?`, `guardianPhone?`, `createdVia: SELF | GUARDIAN | SCHOOL_ROSTER`, `createdById`, `claimCode?` (hashed; OD-01).
  - A profile with `createdVia=SCHOOL_ROSTER` and no `userId` is valid (supports both answers to OD-01).
  - Duplicate warning (not a block) when `fullName` + `dateOfBirth` + `schoolId` match an existing profile; staff can merge profiles (audited, moves Enrolments).
- **ConsentRecord**: `kind: ConsentKind`, `granted`, `method: ConsentMethod`, `subjectParticipantId?`, `subjectUserId?`, `submissionId?`, `enrolmentId?`, `competitionId?`, `legalDocumentVersionId`, `givenByUserId?`, `givenByName`, `givenByRelation: SELF | GUARDIAN | COORDINATOR`, `guardianEmail?`, `guardianPhone?`, `evidenceAssetIds[]`, `ip`, `userAgent`. Append-only.
- **LegalDocument**: `key: PRIVACY_NOTICE | TERMS | CHILD_SAFEGUARDING_POLICY | CONSENT_PARTICIPATION | CONSENT_PUBLIC_DISPLAY | CONSENT_AUCTION | CONSENT_COMMUNICATION | CONSENT_VOLUNTEER_MINOR | CONDUCT_DECLARATION | AUCTION_TERMS | BIDDER_TERMS | REFUND_POLICY | ADOPTION_TERMS | STAFF_SAFEGUARDING_POLICY`, `title`, `isPublicPage`.
- **LegalDocumentVersion**: `documentId`, `version` (int), `body` (Markdown), `publishedAt?`, `publishedById?`. Immutable once published.

### 5.3 Competitions, registration, Enrolment

- **Competition**: `slug` (unique), `title`, `theme`, `animalWelfareMessage`, `description` (rich text), `type: CompetitionType`, `coverAssetId?`, `eligibilityText`, `ageReferenceDate`, `allowSchoolParticipation`, `allowIndividualParticipation`, `conductModes[]: IN_SCHOOL | ONLINE | INDEPENDENT`, `registrationOpensAt`, `registrationClosesAt`, `submissionOpensAt`, `submissionClosesAt`, `schoolResultsDeadline?`, `physicalDispatchDeadlineDays?` (days after request), `resultsTargetDate?`, `rules` (rich text), `guidelines` (rich text: theme confirmation, permitted materials, duration, submission procedure, help contact), `judgingFrameworkAssetId?` (downloadable for Schools), `prizesText` (rich text), `schoolShortlistLimit?` (default 5; `null` = all Enrolments may be uploaded), `physicalArtworkPolicy: PhysicalArtworkPolicy`, `physicalTopN?`, `individualPhysicalRequired` (default true for `DRAWING`/`PAINTING`/`ART_CRAFT`), `publicDisplayIntended`, `auctionIntended`, `maxFiles` (default 3), `wordLimit?`, `maxDurationSec?`, `individualFeePaise` (0 = free), `schoolFeePerEnrolmentPaise` (0 = free), `additionalTermsVersionId?`, `packagingInstructions` (rich text), `status: CompetitionStatus`, `publishedAt?`, `resultsDraftedById?`, `resultsDraftedAt?`, `resultsApprovedById?`, `resultsApprovedAt?`, `resultsPublishedAt?`, `cancelReason?`.
- **CompetitionCategory**: `competitionId`, `code` (e.g. `A`), `label` (e.g. "Category A, ages 5–8"), `minAge`, `maxAge` (inclusive, age on `ageReferenceDate`), `schoolShortlistLimit?` (overrides Competition), `sortOrder`.
- **JudgingCriterion**: `competitionId`, `name`, `description`, `weightPercent` (all criteria sum to 100), `maxScore` (default 10), `sortOrder`.
- **AwardTier**: `competitionId`, `roundLevel: RoundLevel`, `code`, `label` (e.g. "Gold", "All India 1st", "A Grade", "Special Mention"), `kind: RANK | GRADE | MEDAL | MANUAL`, `rankFrom?`, `rankTo?`, `minScore?`, `maxScore?`, `certificateType`, `perCategory` (default true), `sortOrder`.
- **CompetitionRegistration**: `number` (`FOA-<yyyy>-REG-…`), `competitionId`, `registrantType: SCHOOL | INDIVIDUAL`, `schoolId?`, `participantId?`, `registeredByUserId`, `expectedByCategory` (JSON, School route), `status: RegistrationStatus`, `termsVersionId`; unique (`competitionId`, `schoolId`) and (`competitionId`, `participantId`).
- **Enrolment**: `competitionId`, `categoryId`, `participantId`, `registrationId`, `route: SCHOOL | INDIVIDUAL`, `schoolId?`, `feeStatus: UNPAID | PAID | WAIVED | REFUNDED`, `feeAmountPaise`, `paymentId?`, `waivedById?`, `waiverReason?`, `schoolPosition?` (1 = first at School level), `schoolShortlisted` (default false), `status: ACTIVE | WITHDRAWN | DISQUALIFIED`, `disqualifyReason?`; unique (`competitionId`, `participantId`).
- **ConductCertification**: `registrationId` (unique), `conductedOn`, `mode`, `venue?`, `participantsCount`, `judgingPanel` (JSON `[{name, designation}]`), `declarationVersionId`, `certifiedByUserId`, `certifiedAt`, `evidenceAssetIds[]`.
- **SchoolResultLock**: `registrationId`, `categoryId`, `lockedById`, `lockedAt`, `unlockedById?`, `unlockedAt?`, `unlockReason?`; unique (`registrationId`, `categoryId`).

### 5.4 Submissions and media

- **Submission**: `number` (`FOA-<yyyy>-SUB-…`), `competitionId`, `categoryId`, `enrolmentId` (unique: one Submission per Enrolment), `participantId`, `schoolId?`, `origin: INDIVIDUAL | SCHOOL_SHORTLIST`, `schoolRank?`, `title`, `description?`, `artistStatement?`, `imageDescription?`, `essayText?`, `wordCount?`, `language?`, `status: SubmissionStatus`, `participationConsent`, `publicDisplayConsent`, `auctionConsent` (all default false), `submittedAt?`, `submittedByUserId?`, `verifiedAt?`, `verifiedById?`, `correctionNote?`, `rejectionReason?`, `withdrawnAt?`.
- **SubmissionAsset**: `submissionId`, `assetId`, `role: PRIMARY | DETAIL | POSTER | DOCUMENT`, `sortOrder`.
- **Asset**: `ownerUserId`, `purpose: AssetPurpose`, `originalKey`, `mimeType`, `sizeBytes`, `checksumSha256`, `width?`, `height?`, `durationSec?`, `status: UPLOADING | PENDING_PROCESSING | READY | REJECTED | DELETED`, `rejectionReason?`, `derivatives` (JSON: `judging`, `preview`, `thumb`, `og`, `poster`, `videoPreview` keys in `foa-private`), `publicKeys` (JSON; set only while published), `usageRights?: FOA_OWNED | STOCK_LICENSED | PARTICIPANT_CONSENTED | PARTNER_PROVIDED`, `licenceNote?`.

### 5.5 Judging, results, recognition

- **JudgePanelMember**: `competitionId`, `userId?`, `invitedEmail`, `status: INVITED | ACTIVE | REMOVED`, `conflictSchoolIds[]`, `conflictNote?`.
- **JudgingRound**: `competitionId`, `level: RoundLevel`, `sequence` (1..n), `name`, `mode: DIGITAL | PHYSICAL`, `status: RoundStatus`, `opensAt?`, `closesAt?`, `minJudgesPerSubmission` (default 2), `advanceCountPerCategory?` (`null` on the final round).
- **RoundSubmission**: `roundId`, `submissionId`, `aggregateScore?` (mean of submitted weighted totals, numeric(5,2)), `rank?` (per category), `overrideRank?`, `overrideReason?`, `advanced` (default false); unique (`roundId`, `submissionId`).
- **JudgeAssignment**: `roundId`, `judgeUserId`, `submissionId`, `status: ASSIGNED | DRAFT | SUBMITTED | RECUSED`, `recusalReason?`; unique (`roundId`, `judgeUserId`, `submissionId`).
- **Score**: `assignmentId` (unique), `criterionScores` (JSON `{criterionId: number}`), `weightedTotal` (0–100, numeric(5,2)), `privateComment?` (FOA only), `participantFeedback?` (shown after results if present), `submittedAt?`.
- **Award**: `competitionId`, `submissionId`, `tierId`, `categoryId`, `roundId`, `labelSnapshot`, `rankSnapshot?`, `auctionRecommended` (default false), `note?`, `status: PROPOSED | APPROVED | PUBLISHED | REVOKED`.
- **PrizeFulfilment**: `awardId`, `description` (trophy, medal, prize), `method: COURIER | AT_EVENT | VIA_SCHOOL`, `status: PENDING | DISPATCHED | DELIVERED | COLLECTED`, `courierName?`, `trackingNumber?`, `addressSnapshot?` (private), `notes?`.

### 5.6 Certificates

- **CertificateTemplate**: `type: CertificateType`, `name`, `competitionId?` (override), `backgroundAssetId`, `layout` (JSON field positions), `signatories` (JSON `[{name, title, signatureAssetId}]`), `isDefault`.
- **Certificate**: `number` (`FOA-CERT-<yyyy>-…`), `type: CertificateType`, `recipientParticipantId?`, `recipientUserId?`, `enrolmentId?`, `competitionId?`, `awardId?`, `schoolId?`, `recipientName` (snapshot), `title`, `categoryLabel?`, `schoolNameSnapshot?`, `issuedAt`, `version` (bumps on re-render, number unchanged), `templateId`, `pdfAssetId?`, `shareImageAssetId?`, `status: PENDING_RENDER | ISSUED | REVOKED`, `revokedAt?`, `revokedById?`, `revokedReason?`.

### 5.7 Physical Artwork

- **PhysicalArtwork**: `number` (`FOA-<yyyy>-ART-…`), `submissionId` (unique), `status: PhysicalStatus`, `requestedById`, `requestedAt`, `dispatchDeadline`, `deliveryAddressSnapshot` (FOA facility from settings), `courierName?`, `trackingNumber?`, `trackingUrl?`, `dispatchedAt?`, `dispatchedByUserId?`, `receivedAt?`, `receivedById?`, `condition?: EXCELLENT | GOOD | FAIR | DAMAGED`, `conditionNotes?`, `conditionPhotoAssetIds[]`, `widthCm?`, `heightCm?`, `depthCm?`, `medium?`, `matchesDigital?`, `consentDocumentsVerified?`, `verifiedAt?`, `verifiedById?`, `discrepancyNote?`, `storageLocation?`, `finalDisposition?` (set with terminal status).
- No row = physical Artwork not required for that Submission.

### 5.8 Gallery and auctions

- **GalleryItem**: `submissionId` (unique), `featuredById`, `featuredAt`, `sortOrder`, `homeFeatured` (default false), `hiddenAt?`, `hiddenById?`, `hiddenReason?`.
- **BidderProfile**: `userId` (unique), `phone`, `adultDeclaredAt`, `bidderTermsVersionId`, `acceptedAt`, `shippingAddress?` (JSON), `status: ACTIVE | BLOCKED`, `blockedReason?`.
- **AuctionListing**: `number` (`FOA-<yyyy>-LOT-…`), `submissionId` (unique), `physicalArtworkId`, `title`, `story`, `creatorCredit` (display string), `awardSnapshot?`, `startingPricePaise`, `reservePricePaise?`, `minIncrementPaise`, `currentPricePaise`, `leadingBidId?`, `bidCount`, `startsAt`, `endsAt`, `originalEndsAt`, `antiSnipeWindowSec`, `antiSnipeExtensionSec`, `status: AuctionStatus`, `approvedById?`, `winnerUserId?`, `winningBidId?`, `paymentDueAt?`, `fulfilmentStatus: FulfilmentStatus`, `deliveryMethod?: COURIER | PICKUP`, `shippingAddressSnapshot?`, `courierName?`, `trackingNumber?`, `cancelReason?`, `secondChanceOfferedTo?`.
- **Bid**: `listingId`, `bidderUserId`, `amountPaise`, `status: VALID | OUTBID | WINNING | VOIDED`, `voidReason?`, `ip`.

### 5.9 Payments, donations, sponsors, finance

- **Payment**: `purpose: ENROLMENT_FEES | DONATION | AUCTION_LOT`, `amountPaise`, `currency`, `status: PaymentStatus`, `razorpayOrderId` (unique), `razorpayPaymentId?`, `method?`, `payerUserId?`, `payerName`, `payerEmail`, `payerPhone?`, `receiptNumber?` (`FOA-<yyyy>-RCP-…`, set on capture; donations use the Donation receipt number), `receiptAssetId?`, `capturedAt?`, `failureReason?`, `amountRefundedPaise`.
- **PaymentItem**: `paymentId`, `enrolmentId?`, `donationId?`, `auctionListingId?`, `amountPaise` (sum = Payment amount).
- **Refund**: `paymentId`, `razorpayRefundId?`, `amountPaise`, `reason`, `status: PENDING | PROCESSED | FAILED`, `requestedById`.
- **WebhookEvent**: `provider: RAZORPAY | CLERK | RESEND`, `eventId`, `type`, `payload` (JSON), `receivedAt`, `processedAt?`, `error?`; unique (`provider`, `eventId`).
- **DonationFund**: `slug`, `name`, `description`, `coverAssetId?`, `targetPaise?`, `isGeneral`, `isActive`, `sortOrder`.
- **Donation**: `receiptNumber?` (`FOA-<yyyy>-DON-…`, set on completion), `donorUserId?`, `donorName`, `donorEmail`, `donorPhone?`, `wants80G`, `donorPanEncrypted?`, `donorAddress?` (JSON, required when `wants80G`), `amountPaise`, `fundId`, `frequency: ONE_TIME | MONTHLY`, `subscriptionId?`, `campaignId?`, `sponsorId?`, `isAnonymous` (default false), `showOnDonorWall` (default false), `dedication?`, `status: PENDING | COMPLETED | FAILED | REFUNDED`, `receiptAssetId?`.
- **DonationSubscription**: `razorpaySubscriptionId`, `razorpayPlanId`, `donorUserId`, `amountPaise`, `fundId`, `status: CREATED | AUTHENTICATED | ACTIVE | PAUSED | HALTED | CANCELLED | COMPLETED`, `nextChargeAt?`.
- **Sponsor**: `name`, `kind: CORPORATE | CSR_PARTNER | FOUNDATION | INSTITUTIONAL_DONOR | MAJOR_DONOR`, `logoAssetId?`, `website?`, `contactName`, `contactEmail`, `contactPhone?` (contacts private), `publicDisclosure` (default **false**), `disclosureName?`, `tierLabel?`, `notes?`, `status: ACTIVE | INACTIVE`.
- **SponsorContribution**: `sponsorId`, `amountPaise?`, `inKindDescription?`, `receivedOn`, `competitionId?`, `campaignId?`, `eventId?`, `paymentId?`, `ledgerEntryId?`, `agreementAssetId?` (private), `isPublic`.
- **LedgerEntry**: `entryDate`, `fiscalYear` (India FY, e.g. `2027-28`, derived), `direction: INCOME | EXPENSE`, `category: LedgerCategory`, `amountPaise`, `fundId?`, `competitionId?`, `campaignId?`, `description`, `counterpartyPublicName?`, `reference?` (payment/refund id, invoice no.), `attachmentAssetIds[]` (private), `source: SYSTEM | MANUAL`, `status: DRAFT | APPROVED | VOID`, `createdById?`, `approvedById?`, `voidReason?`.
  - `LedgerCategory` income: `ENROLMENT_FEES`, `DONATIONS`, `RECURRING_DONATIONS`, `AUCTION_PROCEEDS`, `SPONSORSHIP`, `GRANTS`, `OTHER_INCOME`; expense: `ANIMAL_MEDICAL`, `FEEDING`, `RESCUE`, `SHELTER_SUPPORT`, `STERILISATION_VACCINATION`, `PROGRAMS_COMPETITIONS`, `PRIZES_CERTIFICATES`, `LOGISTICS`, `TECHNOLOGY`, `ADMINISTRATION`, `FUNDRAISING_COSTS`, `PAYMENT_GATEWAY_FEES`, `REFUNDS`, `OTHER_EXPENSE`.
- **Budget**: `fiscalYear`, `name`, `status: DRAFT | APPROVED`; **BudgetLine**: `budgetId`, `category`, `fundId?`, `competitionId?`, `plannedPaise`, `note?`.
- **TransparencyPeriod**: `fiscalYear`, `period: Q1 | Q2 | Q3 | Q4 | FULL_YEAR`, `status: DRAFT | PUBLISHED`, `narrative?`, `snapshot?` (JSON figures frozen at publish, BR-57), `publishedById?`, `publishedAt?`.
- **PublicDocument**: `kind: ANNUAL_REPORT | AUDITED_STATEMENT | REGISTRATION_CERTIFICATE | TAX_EXEMPTION | UTILISATION_REPORT | POLICY | OTHER`, `title`, `fiscalYear?`, `assetId`, `status: DRAFT | PUBLISHED`, `publishedAt?`.

### 5.10 Welfare network and adoption

- **WelfarePartner**: `slug`, `kind: NGO | RESCUE_ORGANISATION | SHELTER | VETERINARY_CLINIC | INDEPENDENT_RESCUER | FOSTER_CAREGIVER`, `name`, `registrationType?: TRUST | SOCIETY | SECTION_8_COMPANY | OTHER`, `registrationNumber?`, `registrationNumberPublic` (default false), `foundedYear?`, `description`, `services[]: RESCUE | SHELTER | MEDICAL | AMBULANCE | FEEDING | ADOPTION | FOSTER | STERILISATION | VACCINATION | AWARENESS | WILDLIFE | OTHER`, `species[]: DOG | CAT | BIRD | CATTLE | WILDLIFE | SMALL_ANIMAL | OTHER`, `areasServedCities[]`, `areasServedPostalCodes[]`, `address` (JSON), `lat?`, `lng?` (organisations only), `contacts` (JSON: phone, email, website, social links, each with `isPublic`), `emergencyHelpline?`, `operatingHours?`, `logoAssetId?`, `photoAssetIds[]`, `documentAssetIds[]` (private), `status: PENDING | VERIFIED | REJECTED | SUSPENDED`, `verifiedById?`, `verifiedAt?`, `verificationNotes?`, `lastConfirmedAt?`.
  - Individuals (`INDEPENDENT_RESCUER`, `FOSTER_CAREGIVER`): public view shows city/state only, never street address or coordinates; contact fields public only if the individual sets them public.
- **WelfarePartnerMembership**: `partnerId`, `userId?`, `invitedEmail`, `role: OWNER | REP`, `status: INVITED | ACTIVE | REMOVED`.
- **AdoptionListing**: `number` (`FOA-ADP-…`), `partnerId`, `name`, `species`, `breed?`, `sex: MALE | FEMALE | UNKNOWN`, `ageEstimateMonths?`, `size: SMALL | MEDIUM | LARGE`, `colour?`, `vaccinated`, `sterilised`, `dewormed`, `healthNotes?`, `specialNeeds?`, `temperamentTags[]: GOOD_WITH_KIDS | GOOD_WITH_DOGS | GOOD_WITH_CATS | CALM | ENERGETIC | NEEDS_EXPERIENCED_HOME | TRAINED`, `photoAssetIds[]` (1–10), `vetRecordAssetIds[]` (private), `city`, `state`, `postalCode`, `adoptionTerms` (text from the partner), `status: AdoptionListingStatus`, `moderatedById?`, `moderationNote?`, `adoptedAt?`.
- **AdoptionApplication**: `listingId`, `applicantUserId`, `answers` (JSON per §7.9 questionnaire), `status: AdoptionApplicationStatus`, `assignedToUserId?`, `homeCheckAt?`, `decisionNote?`, `decidedById?`, `termsVersionId`.
- **AdoptionMessage**: `applicationId`, `senderUserId`, `body`, `readAt?`.
- **AdoptionFollowUp**: `applicationId`, `dueAt`, `completedAt?`, `responses?` (JSON), `wellbeingConcern` (default false).
- **RehomingRequest**: `requesterUserId`, `animal` (JSON), `reason`, `urgency: LOW | MEDIUM | HIGH`, `status: SUBMITTED | UNDER_REVIEW | ASSIGNED_TO_PARTNER | LISTED | CLOSED`, `assignedPartnerId?`, `listingId?`, `note?`.

### 5.11 Volunteers, community, engagement

- **VolunteerProfile**: `userId` (unique), `skills[]: VolunteerTeam`, `availabilityHoursPerWeek`, `availableDays[]`, `mode: REMOTE | ON_GROUND | BOTH`, `city`, `languages[]`, `experience?`, `motivation`, `isMinor`, `guardianConsentRecordId?`, `status: APPLIED | ACTIVE | REJECTED | INACTIVE`, `reviewedById?`, `approvedMinutesTotal`.
  - `VolunteerTeam`: `TECHNOLOGY`, `CONTENT_CREATION`, `DESIGN`, `SOCIAL_MEDIA`, `OUTREACH`, `COMPETITION_MANAGEMENT`, `COMMUNITY_BUILDING`, `EVENTS`, `ANIMAL_CARE`, `FUNDRAISING`, `TRANSLATION`.
- **VolunteerOpportunity**: `title`, `team: VolunteerTeam`, `description`, `mode`, `location?`, `slots`, `startsAt?`, `endsAt?`, `minAge` (default 18 for `ON_GROUND`, 13 for `REMOTE`), `status: DRAFT | OPEN | FILLED | CLOSED`.
- **VolunteerAssignment**: `opportunityId`, `volunteerUserId`, `status: APPLIED | ASSIGNED | COMPLETED | WITHDRAWN | DECLINED`.
- **VolunteerHours**: `volunteerUserId`, `assignmentId?`, `workDate`, `minutes`, `description`, `status: SUBMITTED | APPROVED | REJECTED`, `reviewedById?`.
- **CommunityMembership**: `userId` (unique), `interests[]`, `joinedAt`, `status: ACTIVE | LEFT`.
- **NewsletterSubscriber**: `email` (unique), `userId?`, `status: PENDING_CONFIRMATION | SUBSCRIBED | UNSUBSCRIBED`, `confirmTokenHash?`, `source`.
- **Club**: `schoolId`, `name`, `slug`, `description`, `coordinatorUserId`, `status: PROPOSED | ACTIVE | INACTIVE`, `approvedById?`.
- **ClubMember**: `clubId`, `participantId`, `joinedOn`.
- **ClubActivity**: `clubId`, `title`, `activityDate`, `description`, `photoAssetIds[]`, `status: DRAFT | PENDING_REVIEW | PUBLISHED | HIDDEN`.
- **AmbassadorProfile**: `userId`, `statement`, `eligibilityBasis: FOA_FINALIST | AWARD_WINNER | VOLUNTEER_HOURS | CLUB_LEAD | NOMINATED`, `status: APPLIED | ACTIVE | REJECTED | ALUMNI`, `approvedById?`, `publicBio?`, `city`.
- **EngagementMilestone**: `participantId?`, `userId?`, `kind: PARTICIPANT | SCHOOL_WINNER | FOA_FINALIST | AWARD_WINNER | COMMUNITY_MEMBER | VOLUNTEER | CLUB_MEMBER | AMBASSADOR | DONOR | ADOPTER`, `sourceType`, `sourceId`, `achievedAt`; unique (subject, `kind`, `sourceId`).
- **FeedbackSurvey**: `competitionId?`, `eventId?`, `title`, `questions` (JSON: rating 1–5, single choice, free text), `audience: PARTICIPANTS_AND_GUARDIANS | COORDINATORS | EVENT_ATTENDEES`, `opensAt`, `closesAt`; **FeedbackResponse**: `surveyId`, `respondentUserId?`, `answers` (JSON). Reports show aggregates only.

### 5.12 Content, events, campaigns, social

- **ContentItem**: `type: STORY | NEWS | BLOG_POST | WELFARE_ARTICLE | PAGE | FAQ`, `slug` (unique per type), `title`, `excerpt`, `body` (ProseMirror JSON), `bodyHtml` (sanitised render cache), `coverAssetId?`, `tags[]`, `welfareTopic?: PET_CARE | STRAY_WELFARE | WILDLIFE | FIRST_AID | LAWS_AND_RIGHTS | ADOPTION | KINDNESS_FOR_KIDS | SCHOOL_ACTIVITIES`, `readingLevel: KIDS | GENERAL`, `authorUserId`, `status: DRAFT | IN_REVIEW | SCHEDULED | PUBLISHED | ARCHIVED`, `publishAt?`, `seoTitle?`, `seoDescription?`, `ogAssetId?`, `competitionId?`, `campaignId?`, `eventId?`.
- **TeamMember**: `name`, `role`, `bio`, `photoAssetId?`, `group: TEAM | BOARD | ADVISOR | JURY`, `sortOrder`, `isPublic`.
- **ImpactMetric**: `key: ANIMALS_RESCUED | ANIMALS_TREATED | MEALS_SERVED | ANIMALS_ADOPTED | ANIMALS_STERILISED | ANIMALS_VACCINATED | AWARENESS_SESSIONS | CUSTOM`, `customLabel?`, `periodStart`, `periodEnd`, `value`, `sourceNote`, `status: DRAFT | PUBLISHED`, `enteredById`.
- **Event**: `slug`, `title`, `type: WORKSHOP | AWARENESS_DRIVE | EXHIBITION | ADOPTION_CAMP | VACCINATION_DRIVE | WEBINAR | FUNDRAISER | PRIZE_CEREMONY | OTHER`, `description`, `startsAt`, `endsAt`, `timezone`, `venue?` (JSON address), `onlineUrl?` (shown to registrants only), `capacity?`, `registrationRequired`, `audience: ALL | SCHOOLS | ADULTS_ONLY`, `coverAssetId?`, `galleryAssetIds[]`, `campaignId?`, `competitionId?`, `status: DRAFT | PUBLISHED | CANCELLED | COMPLETED`.
- **EventRegistration**: `eventId`, `userId?`, `guestName?`, `guestEmail?`, `guestPhone?`, `attendees` (default 1), `status: REGISTERED | WAITLISTED | CANCELLED | ATTENDED`, `checkInCode` (unique, QR), `checkedInAt?`.
- **Campaign**: `slug`, `title`, `goalType: AWARENESS | FUNDRAISING | PLEDGE | VOLUNTEER_DRIVE`, `story` (rich text), `startsAt`, `endsAt?`, `fundId?`, `pledgeText?`, `pledgeTarget?`, `hashtag?`, `coverAssetId?`, `status: DRAFT | ACTIVE | ENDED | ARCHIVED`.
- **Pledge**: `campaignId`, `name`, `city?`, `email?`, `showName`, `status: PENDING_REVIEW | PUBLISHED | HIDDEN`.
- **SocialPost**: `channel: INSTAGRAM | FACEBOOK | X | LINKEDIN | YOUTUBE | WHATSAPP_CHANNEL`, `caption`, `hashtags[]`, `mediaAssetIds[]` (stamped derivatives only), `linkUrl?`, `plannedAt?`, `status: IDEA | DRAFT | IN_REVIEW | APPROVED | POSTED | CANCELLED`, `postedAt?`, `postedUrl?`, `metrics?` (JSON: impressions, reach, likes, comments, shares, saves, views), `metricsUpdatedAt?`, `sourceType?`, `sourceId?`, `createdById`, `approvedById?`.
- **SocialChannelStat**: `channel`, `periodStart`, `periodEnd`, `followers`, `reach`, `impressions`, `engagements` (manually entered).

### 5.13 Communications and support

- **Notification**: `userId`, `kind`, `title`, `body`, `link?`, `readAt?`.
- **NotificationDelivery**: `notificationId?`, `broadcastId?`, `channel`, `recipientHash`, `providerMessageId?`, `status: QUEUED | SENT | DELIVERED | BOUNCED | COMPLAINED | FAILED`, `error?`.
- **Broadcast**: `audience` (JSON: segment + filters, §7.13), `subject`, `body` (Markdown into a branded template), `channels[]`, `scheduledAt?`, `status: DRAFT | SCHEDULED | SENDING | SENT | CANCELLED`, `recipientCount?`, `createdById`, `sentAt?`.
- **EmailSuppression**: `email` (unique), `reason: HARD_BOUNCE | COMPLAINT | MANUAL`.
- **ContactMessage**: `name`, `email`, `phone?`, `topic: GENERAL | SCHOOLS | COMPETITIONS | PAYMENTS | DONATIONS | AUCTIONS | ADOPTION | VOLUNTEERING | MEDIA | PARTNERSHIP | REPORT_CONCERN`, `message`, `entityType?`, `entityId?`, `status: NEW | IN_PROGRESS | RESOLVED | SPAM`, `priority: NORMAL | HIGH`, `assignedToUserId?`, `internalNotes?`, `resolvedAt?`.
- **DataRequest**: `userId`, `kind: EXPORT | DELETION | CORRECTION`, `details?`, `status: REQUESTED | IN_PROGRESS | COMPLETED | REJECTED`, `resultAssetId?`, `handledById?`, `note?`.

### 5.14 System

- **Setting**: `key` (unique), `value` (JSON), `updatedById`. Keys: `org.legalName`, `org.registrationDetails`, `org.address`, `org.80g` (registration no., validity; empty = 80G off), `physical.facilityAddress`, `physical.defaultPackagingInstructions`, `auction.defaultMinIncrementPercent`, `auction.antiSnipeWindowSec` (default 120), `auction.antiSnipeExtensionSec` (default 120), `auction.paymentWindowHours` (default 48), `stamp.position`, `stamp.opacity`, `social.handles`, `safeguarding.leadUserId`, `retention.*` (OD-12), `features.smsEnabled` (false), `features.whatsappEnabled` (false).
- **AuditLog**: per FR-AUDIT-01. **IdSequence**: `scope`, `year`, `next`; unique (`scope`, `year`). **MetricSnapshot**: `snapshotDate`, `key`, `dimensions` (JSON), `value`.

### 5.15 Shared enums

| Enum | Values |
|---|---|
| `StaffRole` | `SUPER_ADMIN`, `FOA_ADMIN`, `COMPETITION_MANAGER`, `CONTENT_MANAGER`, `CONTENT_CONTRIBUTOR`, `COMMUNITY_MANAGER`, `FINANCE_MANAGER`, `AUCTION_MANAGER`, `ADOPTION_COORDINATOR` |
| `CompetitionType` | `DRAWING`, `PAINTING`, `ART_CRAFT`, `ESSAY`, `PHOTOGRAPHY`, `VIDEOGRAPHY` |
| `CompetitionStatus` | `DRAFT`, `UPCOMING`, `REGISTRATION_OPEN`, `ACTIVE`, `SUBMISSIONS_CLOSED`, `JUDGING`, `COMPLETED`, `ARCHIVED`, `CANCELLED` |
| `PhysicalArtworkPolicy` | `NOT_REQUIRED`, `OPTIONAL`, `TOP_SHORTLISTED_ONLY`, `ALL_WINNERS` |
| `SchoolStatus` | `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` |
| `RegistrationStatus` | `PENDING_PAYMENT`, `CONFIRMED`, `WITHDRAWN`, `CANCELLED` |
| `SubmissionStatus` | `DRAFT`, `SUBMITTED`, `CORRECTION_REQUESTED`, `VERIFIED`, `REJECTED`, `IN_JUDGING`, `JUDGED`, `WITHDRAWN` |
| `RoundLevel` | `SCHOOL`, `CITY_DISTRICT`, `STATE`, `NATIONAL`, `GLOBAL` (`SCHOOL` is used only by `AwardTier`; the School round runs outside the platform and is recorded on `Enrolment`) |
| `RoundStatus` | `DRAFT`, `OPEN`, `CLOSED`, `FINALISED` |
| `PhysicalStatus` | `REQUESTED`, `DISPATCHED`, `RECEIVED_BY_FOA`, `VERIFICATION_IN_PROGRESS`, `VERIFIED`, `DISCREPANCY`, `NOT_RECEIVED`, `DELIVERED_TO_BUYER`, `RETURNED_TO_CREATOR`, `RETAINED_BY_FOA` |
| `CertificateType` | `PARTICIPATION`, `SCHOOL_MERIT`, `FINALIST`, `WINNER`, `RUNNER_UP`, `MERIT_GRADE`, `SPECIAL_MENTION`, `TEACHER_COORDINATOR`, `JUDGE_APPRECIATION`, `VOLUNTEER`, `AUCTION_CONTRIBUTOR` |
| `AuctionStatus` | `DRAFT`, `UPCOMING`, `ACTIVE`, `EXTENDED`, `CLOSED_SOLD`, `CLOSED_UNSOLD`, `CANCELLED` |
| `FulfilmentStatus` | `NONE`, `AWAITING_PAYMENT`, `PAID`, `PACKED`, `SHIPPED`, `DELIVERED`, `PAYMENT_DEFAULTED` |
| `PaymentStatus` | `CREATED`, `AUTHORIZED_CLIENT`, `CAPTURED`, `FAILED`, `EXPIRED`, `PARTIALLY_REFUNDED`, `REFUNDED` |
| `AdoptionListingStatus` | `DRAFT`, `PENDING_REVIEW`, `AVAILABLE`, `ON_HOLD`, `ADOPTED`, `WITHDRAWN` |
| `AdoptionApplicationStatus` | `SUBMITTED`, `UNDER_REVIEW`, `HOME_CHECK_SCHEDULED`, `APPROVED`, `ADOPTED`, `REJECTED`, `WITHDRAWN` |
| `ConsentKind` / `ConsentMethod` | see §4.2 |

### 5.16 State machines

Any transition not listed is rejected with `409 INVALID_TRANSITION`. Every listed transition is audited.

**Competition**

| From → To | Trigger | Actor | Guards / effects |
|---|---|---|---|
| `DRAFT` → `UPCOMING` | publish | COMP_MGR, FOA_ADMIN | BR-01 date rules; ≥1 category; criteria weights = 100; ≥1 Judging Round; ≥1 award tier; cover + rules + guidelines present. Public page appears. |
| `UPCOMING` → `REGISTRATION_OPEN` | `registrationOpensAt` reached | scheduler | notify subscribers (Schools that opted in, community) |
| `REGISTRATION_OPEN` → `ACTIVE` | `registrationClosesAt` reached | scheduler | new registrations blocked; roster edits blocked except by staff |
| `ACTIVE` → `SUBMISSIONS_CLOSED` | `submissionClosesAt` reached | scheduler | new Submissions blocked; correction resubmissions still allowed until each correction's own deadline |
| `SUBMISSIONS_CLOSED` → `JUDGING` | open first round | COMP_MGR | ≥1 judge assigned per BR-30 |
| `JUDGING` → `COMPLETED` | publish results | FOA_ADMIN | results approved (§6.9); triggers certificates, notifications, milestones, results page |
| `COMPLETED` → `ARCHIVED` | archive | FOA_ADMIN | read-only; still public |
| any before `COMPLETED` → `CANCELLED` | cancel (reason) | FOA_ADMIN | notify all registrants; creates refund tasks for paid fees (FINANCE) |

Scheduler transitions run every minute (pg-boss schedule) and are idempotent; a Competition can skip states if dates already passed at publish.

**School**: `PENDING` → `VERIFIED` (verify; applicant membership → `ACTIVE COORDINATOR`) · `PENDING` → `REJECTED` (notes required) · `REJECTED` → `PENDING` (applicant edits and resubmits) · `VERIFIED` → `SUSPENDED` (reason; memberships lose access) · `SUSPENDED` → `VERIFIED`. Actor: FOA_ADMIN, COMP_MGR.

**CompetitionRegistration**: School route created `CONFIRMED` (fees are per Enrolment). Individual: `PENDING_PAYMENT` → `CONFIRMED` on payment capture (or directly `CONFIRMED` when fee is 0 or waived) · `PENDING_PAYMENT` → `CANCELLED` after 24 h unpaid (job) · `CONFIRMED` → `WITHDRAWN` (registrant, before `submissionClosesAt`; refund per OD-05) · any → `CANCELLED` (Competition cancelled).

**Submission**

| From → To | Trigger | Actor | Guards / effects |
|---|---|---|---|
| (none) → `DRAFT` | create | Participant/Guardian (individual), Coordinator/Teacher (shortlist) | Enrolment `ACTIVE`, fee `PAID`/`WAIVED`; window open; School route: Enrolment `schoolShortlisted` |
| `DRAFT` → `SUBMITTED` | submit | same | required fields + ≥1 `READY` primary asset + participation consent true; assigns number; confirmation notification |
| `SUBMITTED` → `CORRECTION_REQUESTED` | request correction (note, deadline) | COMP_MGR | notify submitter |
| `CORRECTION_REQUESTED` → `SUBMITTED` | resubmit | submitter | before correction deadline |
| `SUBMITTED` → `VERIFIED` | verify | COMP_MGR | BR-12 checks; may create PhysicalArtwork request (BR-20) |
| `SUBMITTED`/`CORRECTION_REQUESTED` → `REJECTED` | reject (reason) | COMP_MGR | notify; Enrolment stays (participation certificate still issued) |
| `VERIFIED` → `IN_JUDGING` | added to an `OPEN` round | system | — |
| `IN_JUDGING` → `JUDGED` | final round `FINALISED` | system | — |
| `DRAFT`/`SUBMITTED`/`CORRECTION_REQUESTED`/`VERIFIED` → `WITHDRAWN` | withdraw | submitter, FOA_ADMIN | before judging starts |

**PhysicalArtwork**: `REQUESTED` → `DISPATCHED` (Coordinator/Participant enters courier + tracking) · `REQUESTED` → `NOT_RECEIVED` (deadline + grace passed, job; staff can reopen) · `DISPATCHED` → `RECEIVED_BY_FOA` (staff, acknowledgement notification) · `RECEIVED_BY_FOA` → `VERIFICATION_IN_PROGRESS` → `VERIFIED` | `DISCREPANCY` (staff; condition, dimensions, medium, match, consent documents) · `DISCREPANCY` → `VERIFIED` (resolved, note) · `VERIFIED` → `DELIVERED_TO_BUYER` (auction delivered) | `RETURNED_TO_CREATOR` | `RETAINED_BY_FOA`.

**JudgingRound**: `DRAFT` → `OPEN` (assignments exist; PHYSICAL mode: only Submissions whose PhysicalArtwork is `VERIFIED` are scoreable) · `OPEN` → `CLOSED` (all assignments `SUBMITTED`/`RECUSED`, or forced with reason) · `CLOSED` → `OPEN` (reopen, reason) · `CLOSED` → `FINALISED` (ranks computed, advancement applied; next round's Submissions added).

**Award**: `PROPOSED` → `APPROVED` (FOA_ADMIN approves the results set) → `PUBLISHED` (results published) · any → `REVOKED` (FOA_ADMIN, reason; revokes linked certificate).

**Certificate**: `PENDING_RENDER` → `ISSUED` (worker rendered PDF + share image) · `ISSUED` → `REVOKED` (reason; verify page shows invalid) · `ISSUED` → `PENDING_RENDER` (re-render after name correction; `version`+1).

**AuctionListing**: `DRAFT` → `UPCOMING` (approve; guards SG-04) · `UPCOMING` → `ACTIVE` (`startsAt`, scheduler) · `ACTIVE` → `EXTENDED` (bid inside anti-snipe window) · `ACTIVE`/`EXTENDED` → `CLOSED_SOLD` (`endsAt`, highest bid ≥ reserve) | `CLOSED_UNSOLD` (no bids or below reserve) · `DRAFT`/`UPCOMING`/`ACTIVE`/`EXTENDED` → `CANCELLED` (AUCTION_MANAGER, reason; consent withdrawal; voids bids, notifies bidders). Fulfilment: `AWAITING_PAYMENT` → `PAID` (webhook) → `PACKED` → `SHIPPED` → `DELIVERED`; `AWAITING_PAYMENT` → `PAYMENT_DEFAULTED` (window passed) → second-chance offer or relist (BR-45).

**Payment**: `CREATED` → `AUTHORIZED_CLIENT` (client signature verified) → `CAPTURED` (webhook) · `CREATED`/`AUTHORIZED_CLIENT` → `FAILED` (webhook) | `EXPIRED` (job) · `CAPTURED` → `PARTIALLY_REFUNDED` | `REFUNDED` (refund processed).

**AdoptionListing**: `DRAFT` → `PENDING_REVIEW` (rep submits) → `AVAILABLE` (ADOPTION_COORDINATOR approves) | `DRAFT` (sent back with note) · `AVAILABLE` ↔ `ON_HOLD` (rep/coordinator) · `AVAILABLE`/`ON_HOLD` → `ADOPTED` (application marked adopted) | `WITHDRAWN`.

**AdoptionApplication**: `SUBMITTED` → `UNDER_REVIEW` → `HOME_CHECK_SCHEDULED` → `APPROVED` → `ADOPTED`; any open state → `REJECTED` (reason) | `WITHDRAWN` (applicant). Only one application per listing can be `APPROVED` at a time.

**WelfarePartner**: `PENDING` → `VERIFIED` | `REJECTED` (notes) · `REJECTED` → `PENDING` (resubmit) · `VERIFIED` ↔ `SUSPENDED`. Actor: COMMUNITY_MANAGER, FOA_ADMIN.

**ContentItem**: `DRAFT` → `IN_REVIEW` (contributor) → `PUBLISHED` | `SCHEDULED` (CONTENT_MANAGER; scheduled publishes at `publishAt`) · `PUBLISHED` → `ARCHIVED` · any → `DRAFT` (unpublish).

---

## 6. Competition workflow (end to end)

The client's phases are regrouped into separate processes so each can be built and tested alone: **judging** (Stages 5–11), **public showcase** (12), **physical Artwork** (8–9), **fundraising** (13) and **long-term engagement** (14).

```
School route      School verified ─► Competition registration ─► Roster + fees ─► School conducts ─► Conduct certification
                  ─► School results + shortlist (≤ limit) ─► Shortlisted Submissions uploaded ──┐
Individual route  Member ─► Participant profile (self or Guardian) ─► Registration + fee ─► Digital Submission ──┤
                                                                                                             ▼
                  FOA verification ─► Physical Artwork requested ─► dispatched ─► received ─► physically verified
                  ─► FOA judging round(s) ─► results approved ─► results published ─► certificates + prizes
                  ─► gallery + social ─► auction (consented, verified Artwork) ─► continued engagement
```

Client phase → stage map: P1→1 · P2→2 · P3→3 · P4→6 (individual) · P5/P8→8 · P6→5 · P7→6 (School) · P9→10 · P10→11 · P11→12 · P14→9 · P15→13 · P16→14 · "verification of shortlisted entries"→7.

### Stage 1 — Competition setup and announcement
- Input: Competition configured by COMP_MGR (§7.3.1). Output: published Competition page, share kit, optional announcement broadcast to verified Schools and community subscribers.
- The public page always includes: theme and welfare message, type, categories/age groups, participation routes, dates, rules, guidelines, judging criteria (names + weights), prizes, physical Artwork policy, whether Submissions may be displayed publicly or auctioned, fees, terms and consent texts, FAQ, "How to enter" for each route, and the recommendation to participate through a School.

### Stage 2 — Registration
**Route A (School).** A verified School's Coordinator registers the School for the Competition (categories + expected participants per category, accepts terms) → `CompetitionRegistration(SCHOOL, CONFIRMED)` with number shown and emailed together with the School number and dashboard link. The Coordinator then builds the **roster**: one Enrolment per student (form or CSV import), each linked to a `ParticipantProfile(createdVia=SCHOOL_ROSTER)` (new or found by FOA Participant ID) and pays fees for selected unpaid Enrolments in one Razorpay checkout. The Coordinator certifies participation consent per Enrolment (`COORDINATOR_CERTIFIED`, MAY upload signed forms).

**Route B (individual).** "Participate as an individual" on the Competition page (with the "we encourage you to participate through your School" note) → sign in → choose "for myself" or "for my child" (Guardian) → profile form (name, date of birth → category auto-derived, phone, email, city/state/country, pin code, School/college name optional, Guardian details if minor, communication consent, participation consent) → pay fee → `CompetitionRegistration(INDIVIDUAL, CONFIRMED)` + Enrolment → FOA Participant ID + registration number shown and emailed.

### Stage 3 — Preparation
- When registration closes (or on demand), each registrant gets the **Competition briefing**: date/time, theme confirmation, permitted materials, duration, submission procedure, physical Artwork requirements, deadlines, help contact. Generated from Competition fields; also shown on the dashboards and downloadable as PDF.
- COMP_MGR can send further broadcasts to the Competition audience (§7.13).

### Stage 4 — Conduct
- Modes per Competition: `IN_SCHOOL` (run physically by the School), `ONLINE` (e.g. essay, videography made and uploaded online), `INDEPENDENT` (individual Participants create on their own).
- School route: the Coordinator submits a **conduct certification** (date, mode, venue, participant count, judging panel names, declaration text version, optional evidence). Required before the School can lock results.

### Stage 5 — School-level judging and shortlist
- FOA provides the judging framework document and criteria. The School's panel judges offline.
- In `/school`, per category the Coordinator records School positions (1st, 2nd, 3rd … up to top 5) and marks the shortlist (max `schoolShortlistLimit`, BR-10; `null` = no limit) among paid/waived Enrolments, then **locks** the category (Coordinator only; staff can unlock with reason).
- Locking makes the School results final for that category and triggers: participation certificates for every Enrolment in the category, School merit certificates for positions 1–3 (§7.6), and a "shortlisted for FOA judging" notification for shortlisted Participants (SG-09 routing).

### Stage 6 — Digital Submission
- **School route:** for each shortlisted Enrolment the Coordinator/Teacher uploads a high-quality photo/scan (or the essay/video), title, short description/message, School position, and the public-display/auction consents (certified) → `Submission(origin=SCHOOL_SHORTLIST)`. Status line shown to the School: *School shortlisted → Digital Submission sent to FOA*. Physical Artwork stays with the School/student at this point.
- **Individual route:** the Participant/Guardian uploads file(s), title, short description, optional statement, consents → `Submission(origin=INDIVIDUAL)`.
- On submit: Submission number generated, confirmation shown and emailed. The system records Participant, route, Competition, category, timestamp, files, status.

### Stage 7 — FOA verification
- COMP_MGR reviews each `SUBMITTED` Submission (BR-12): eligibility (age vs category, Enrolment fee settled, route allowed), file quality, matches the registration, consents present. Actions: verify, request correction (note + deadline), reject (reason).

### Stage 8 — Physical Artwork request, dispatch and receipt
- Requests are created per policy (BR-20): automatically on verification for `TOP_SHORTLISTED_ONLY` (School rank ≤ `physicalTopN`) and for individual Submissions when `individualPhysicalRequired`; after results for `ALL_WINNERS`; manually for `OPTIONAL`.
- The School/Participant receives the Artwork number, packaging instructions, FOA delivery address, dispatch deadline and the consent/declaration to include; they enter courier name + tracking number on dispatch. FOA marks receipt and the sender is notified.
- Status line: *Shortlisted → Verified → Physical Artwork requested → Dispatched → Received by FOA*.

### Stage 9 — Physical verification
- On receipt FOA records: Artwork number check, creator, match with the digital Submission, condition (+ photos), dimensions, medium/material, consent documents. Result `VERIFIED` or `DISCREPANCY` (resolved later). Only `VERIFIED` Artwork can be scored in a `PHYSICAL` round, exhibited or auctioned.

### Stage 10 — FOA judging
- Rounds are configured per Competition (levels `CITY_DISTRICT`, `STATE`, `NATIONAL`, `GLOBAL`; default a single `NATIONAL` round). Each round is `DIGITAL` or `PHYSICAL` (judges score after physical inspection; scores still entered in the platform).
- Judges score blind against the weighted criteria; ranks per category come from mean weighted totals (BR-31..34). Top `advanceCountPerCategory` advance to the next round.
- Output of the final round: proposed Awards per the award scheme (rank, grade bands A/B, medals Gold/Silver/Bronze, All-India 1/2/3), finalists, special mentions, and `auctionRecommended` flags.

### Stage 11 — Results and recognition
- COMP_MGR drafts results → FOA_ADMIN approves → FOA_ADMIN publishes (Competition `COMPLETED`). Publishing: results page goes live (display name, School, city, category, award — no scores), Award notifications, certificates generated (FINALIST, WINNER, RUNNER_UP, MERIT_GRADE, SPECIAL_MENTION; TEACHER_COORDINATOR for School Coordinators; JUDGE_APPRECIATION for judges), prize fulfilment records created, engagement milestones written, social kit produced for approved items.
- Schools download all their Participants' certificates (ZIP); Participants/Guardians download from `/me`.

### Stage 12 — Gallery and social showcase
- CONTENT_MANAGER features consented Artwork (SG-04) in the gallery and plans social posts from stamped images (§7.18). Flow the client wants visible: *Student creativity → public awareness → compassion for animals*.

### Stage 13 — Fundraising auction
- AUCTION_MANAGER lists `VERIFIED`, auction-consented Artwork (`auctionRecommended` pre-filters the queue): listing → bidding → winning bid → payment → confirmation → delivery. The original artist (via Guardian/School) receives an acknowledgement and thank-you plus an `AUCTION_CONTRIBUTOR` certificate when payment completes. Every listing credits the creator by approved display name. Proceeds are recorded in the ledger.

### Stage 14 — Continued engagement
- After results, Participants/Guardians with communication consent receive invitations: future Competitions, community, volunteering, starting/joining an FOA School/college club, campaigns, events/workshops, Ambassador programme (when eligible).
- The engagement journey is kept per Participant: *Participant → School winner → FOA finalist → Community member → Volunteer → Ambassador* (`EngagementMilestone`).

---

## 7. Module specifications

Client module → section: Home 7.1 · About 7.1 · Competitions 7.3 · Art Gallery/Showcase 7.7 · Auctions 7.8 · Animal Adoption 7.9 · Animal Welfare & Awareness 7.1 · Community 7.14 · Volunteer 7.11 · Animal-Welfare NGO Directory 7.10 · Donate 7.16 · Financial Transparency 7.17 · Impact/Our Work 7.1 · Schools & Institutions 7.1 + 7.4 · Events & Campaigns 7.15 · News/Stories/Blog 7.1 + 7.18 · Contact Us 7.13 · User Registration/Login 7.2 · User Dashboard 7.2 · School/Institution Dashboard 7.4 · Judge/Jury Dashboard 7.5 · FOA Admin Dashboard 7.20 · Auction & Payment Management 7.8 · Donation Management 7.16 · Adoption Management 7.9 · Volunteer Management 7.11 · Content/Social Media Management 7.18 · Reports & Analytics 7.12 · Finance/Budget Management 7.17 · Notifications & Communications 7.13 · Certificates, Awards & Recognition 7.6 · Logo stamping on certificates 4.6 + 7.6 · Privacy, Consent & Safeguarding 4.1 + 4.2 + 7.19.

### 7.1 Public site and content pages

Routes: `/`, `/about`, `/animal-welfare`, `/animal-welfare/[slug]`, `/impact`, `/schools`, `/stories`, `/stories/[slug]`, `/news`, `/news/[slug]`, `/blog`, `/blog/[slug]`, `/faq`, `/legal/[key]` (privacy, terms, child safeguarding, auction terms, refund policy), plus the module routes listed in later sections. Header: logo, main nav (Competitions, Gallery, Auctions, Adopt, Get involved ▸ Volunteer/Community/Events/Directory, About ▸ About/Impact/Transparency/Stories), Donate button (red), sign-in/avatar, notifications bell when signed in. Footer: contact, social links, legal links, newsletter sign-up.

- FR-PUB-01 Home: mission hero with primary CTAs (Enter a Competition, Donate), open/upcoming Competitions, featured gallery Artwork (`homeFeatured`), live impact counters (§7.12 public metrics), active auctions, adoption highlights, latest stories, upcoming events, disclosed sponsors' logos, newsletter sign-up.
- FR-PUB-02 About: CMS `PAGE` content (mission, vision, approach), team/board/jury (`TeamMember`), partners, FAQ excerpt.
- FR-PUB-03 Animal Welfare & Awareness: `WELFARE_ARTICLE` list with topic and reading-level filters (KIDS / GENERAL), article pages with related campaigns, events and Competitions; downloadable resources (PDF assets).
- FR-PUB-04 Impact / Our Work: published `ImpactMetric`s by period, platform metrics, programme stories, map of partner cities (from verified Welfare Partners), links to transparency and annual reports.
- FR-PUB-05 Schools & Institutions: benefits, how the School route works (Stages 2–6), judging framework download, "Register your School" CTA, list of participating Schools that opted in (`showOnPublicList`), clubs information.
- FR-PUB-06 News / Stories / Blog: lists with tag filter, search, pagination; article pages with share links, related items, JSON-LD `Article`.
- FR-PUB-07 Legal pages render the latest published `LegalDocumentVersion` with version number and date.
- AC: home LCP image is the hero and is priority-loaded; every list page has empty/loading/error states; all pages pass axe with no serious violations; draft content is never reachable by URL.

### 7.2 Accounts and the User dashboard

Routes: `/sign-in`, `/sign-up` (Clerk), `/onboarding`, `/me`, `/me/profile`, `/me/participants`, `/me/participants/[id]`, `/me/competitions`, `/me/submissions/[id]`, `/me/certificates`, `/me/payments`, `/me/donations`, `/me/bids`, `/me/adoption`, `/me/volunteer`, `/me/events`, `/me/journey`, `/me/notifications`, `/me/preferences`, `/me/privacy`.

- FR-ACC-01 Sign-up/sign-in via Clerk (Google + email with verification); bot protections per §3.1.
- FR-ACC-02 First sign-in → `/onboarding`: full name, phone (optional), country/city, accept privacy notice (`DATA_PROCESSING` consent), optional communication consent, optional interests (community). Creates/updates the `User`.
- FR-ACC-03 Account deletion request and data export from `/me/privacy` (§7.19).
- FR-ME-01 Dashboard home shows action cards in priority order: pending payments, correction requests, physical dispatch due, new certificates, auction wins awaiting payment, upcoming events, applications needing response.
- FR-ME-02 Participant profiles: "Me" (if the user is a Participant) and each minor managed as Guardian; add child (Guardian flow); edit display name; see FOA Participant ID.
- FR-ME-03 Competitions: Enrolments with registration number, category, route, fee status, Submission status timeline (stage-by-stage, including physical status), results and awards.
- FR-ME-04 Submission detail: files, metadata, consents with change/withdraw controls (§4.2), correction note and resubmit, physical dispatch form when requested.
- FR-ME-05 Certificates: list, download PDF, share image download (stamped), copy verification link.
- FR-ME-06 Payments & receipts; Donations (receipts, recurring management: cancel); Bids (active, outbid, won with pay-now); Adoption applications with message thread; Volunteer status, opportunities, hours log; Event registrations with QR ticket and `.ics`.
- FR-ME-07 Journey: engagement milestones timeline per Participant profile (Stage 14).
- FR-ME-08 Notifications inbox (mark read/all read); Preferences: channel toggles for non-transactional messages, newsletter, communication consent.
- AC: a Guardian sees and acts for each linked minor but not for unrelated profiles (policy test); an adult Participant without a Guardian sees only own data; every dashboard page works at 360 px width with no horizontal scroll.

### 7.3 Competitions, registration, Submissions, physical Artwork

Public routes: `/competitions` (filters: status open/upcoming/past, type, category age, participation route), `/competitions/[slug]`, `/competitions/[slug]/register` (individual), `/competitions/[slug]/results`.
Admin routes: `/admin/competitions`, `/admin/competitions/new`, `/admin/competitions/[id]` (tabs: Details, Categories, Criteria & framework, Rounds & awards, Fees & terms, Registrations, Enrolments, Submissions, Physical, Judging, Results, Certificates, Communications).

#### 7.3.1 Competition management
- FR-COMP-01 Create in `DRAFT` with all fields of §5.3; rich-text editors for description, rules, guidelines, prizes, packaging instructions; cover upload.
- FR-COMP-02 Categories (age groups) CRUD with overlap/gap warning; criteria CRUD with live weight total (must equal 100 to publish); judging framework document upload.
- FR-COMP-03 Rounds & award scheme editor: ordered rounds (level, mode, min judges, advance count); award tiers per level (rank ranges, grade score bands, medals, manual tiers) mapped to certificate types. Presets: "All-India 1/2/3 + Special Mention", "A/B Grade", "Gold/Silver/Bronze".
- FR-COMP-04 Preview the public page in draft; publish with guard check list (§5.16) showing each failing guard.
- FR-COMP-05 Edit after publish: dates and texts editable (audited, registrants notified when dates change); type, categories with Enrolments, fees after first payment and criteria after judging opens are locked.
- FR-COMP-06 Archive, cancel (reason; triggers refunds task list for FINANCE), duplicate as new draft.
- FR-COMP-07 Public list/detail per Stage 1; detail shows the route CTAs only while registration is open and the route is allowed; Schools see "Register your School" (or "Manage registration" if registered).
- AC: publish is impossible with weights ≠ 100 or invalid dates (API test); changing `registrationClosesAt` after publish notifies confirmed registrants; draft Competitions return 404 publicly.

#### 7.3.2 Registration and Enrolment
- FR-REG-01 School registration (Route A) per Stage 2; one registration per School per Competition; withdraw before registration closes if no paid Enrolments (else staff).
- FR-REG-02 Roster: add Enrolment by form (full name, date of birth, grade, optional Guardian name/email/phone, display name override) or **CSV import** (downloadable template; validates every row; shows a row-level error report; imports valid rows only on confirmation; matches existing Participants by FOA Participant ID column). Category is derived from date of birth on `ageReferenceDate`; out-of-range ages are rejected with the category list.
- FR-REG-03 Roster fee checkout: select unpaid Enrolments → one Razorpay payment (`ENROLMENT_FEES`, one `PaymentItem` per Enrolment); receipt emailed to the Coordinator.
- FR-REG-04 Participation consent per Enrolment: Coordinator certification (bulk action per category; optional scan upload) or, where a Guardian email is present, an optional email link letting the Guardian give consent themselves (`CHECKBOX_GUARDIAN`).
- FR-REG-05 Individual registration (Route B) per Stage 2, including the Guardian "for my child" path; existing profiles can be reused; one registration per Participant per Competition.
- FR-REG-06 Fee waivers: COMP_MGR/FOA_ADMIN waive per Enrolment with reason (audited).
- FR-REG-07 Admin views: registrations and Enrolments with filters (route, School, category, state, fee status, consent status), CSV export (SG-12).
- AC: School cannot exceed the deadline (`registrationClosesAt`) for adding Enrolments; CSV with 500 rows imports in < 10 s; a Participant already enrolled via a School cannot also register individually for the same Competition (unique constraint + friendly error).

#### 7.3.3 Submissions
- FR-SUB-01 Create/edit/submit per §5.16 and Stage 6 for both routes; upload via §3.5 with per-type rules (§4.7): image types, essay editor with live word count (or document upload), video multipart with progress and resume.
- FR-SUB-02 School shortlist upload screen lists only shortlisted Enrolments of locked categories with School position prefilled.
- FR-SUB-03 Consents captured on the Submission form: participation (required), public display (optional), auction (optional, shown only when `auctionIntended`), each with its legal text version and method per SG-03.
- FR-SUB-04 Confirmation screen and email with Submission number and next steps.
- FR-SUB-05 Verification queue (COMP_MGR): filters (route, category, School, state, status), side-by-side media viewer (judging derivative), checks panel (age vs category, fee, consents, duplicate image hash warning), actions verify / request correction / reject; bulk verify.
- FR-SUB-06 Withdrawal by submitter before judging (§5.16).
- AC: a School cannot upload more Submissions per category than the limit (BR-10, concurrency-safe); submit fails without a `READY` primary asset; the judging derivative never exposes the participant's name in file name or metadata.

#### 7.3.4 Physical Artwork tracking
Routes: `/admin/physical` (board by status), `/school/physical`, `/me/submissions/[id]` (dispatch form).
- FR-PHYS-01 Requests created per BR-20 (auto) or manually in bulk from a filtered Submission list; each request generates the Artwork number, dispatch deadline, instruction sheet (PDF: packaging instructions, FOA address, Artwork number label to attach, declaration form) and notification.
- FR-PHYS-02 Dispatch form: courier name (list + other), tracking number, optional tracking URL, dispatch date; editable until received.
- FR-PHYS-03 Receipt: staff scan/enter Artwork number → mark received (timestamp, staff) → acknowledgement notification.
- FR-PHYS-04 Verification form per Stage 9 with condition photos; `DISCREPANCY` requires a note and notifies COMP_MGR.
- FR-PHYS-05 Overdue view: `REQUESTED` past deadline → reminder notifications at deadline −3 days and on the deadline; `NOT_RECEIVED` after a 7-day grace (job).
- FR-PHYS-06 Final disposition: returned (courier details), retained, delivered to buyer (from auction fulfilment).
- AC: the public never sees physical status; the School sees status for its Submissions only; a `PHYSICAL` round cannot score a Submission whose Artwork is not `VERIFIED`.

### 7.4 School dashboard

Routes: `/schools/apply`, `/school` (select School if member of several), `/school/profile`, `/school/members`, `/school/competitions`, `/school/competitions/[registrationId]` (tabs: Roster, Fees, Conduct, Results & shortlist, Submissions, Physical, Certificates, Messages), `/school/club`.

- FR-SCH-01 Apply: all School fields (§5.1) incl. principal and authorised person; duplicate warning on same name + postal code; status page while `PENDING`; resubmit after `REJECTED` with admin notes shown.
- FR-SCH-02 Admin verification queue (`/admin/schools`): details, duplicate candidates, verify / reject (notes) / suspend; merge duplicates (moves memberships and registrations; audited).
- FR-SCH-03 Profile edit (Coordinator); changing name/address after verification puts changes into a pending review (School stays `VERIFIED`).
- FR-SCH-04 Members: invite Teacher by email, resend, remove; transfer Coordinator role to another member (Coordinator or staff).
- FR-SCH-05 Competition workspace per Stages 2–6 and 8, each tab showing counts and blocking issues (e.g. "12 Enrolments unpaid", "Conduct certification missing").
- FR-SCH-06 Results & shortlist per Stage 5 with live limit counter per category; lock with confirmation dialog summarising effects.
- FR-SCH-07 Certificates: per Competition, download ZIP of all certificates for the School's Enrolments (background job, emailed link) and individual PDFs; printable participation list.
- FR-SCH-08 Messages: Competition briefings and broadcasts received; contact FOA (prefilled contact form with registration reference).
- FR-SCH-09 Club (§7.14).
- AC: a Teacher cannot lock results or pay; a Coordinator of School A gets 403 on School B's resources (policy tests for every School endpoint); ZIP of 1,000 certificates completes and emails a link.

### 7.5 Judging (Judge dashboard)

Routes: `/judge`, `/judge/rounds/[roundId]`, `/judge/rounds/[roundId]/submissions/[submissionId]`; admin `/admin/competitions/[id]/judging`.

- FR-JUDGE-01 Panel: invite judges by email (FR-AUTH-04); judges declare conflicts (Schools they are linked to) on first visit per Competition.
- FR-JUDGE-02 Assignments: auto-distribute the round's Submissions so each one gets `minJudgesPerSubmission` judges, balancing load per judge and skipping conflicts; manual add/remove; reassign on recusal.
- FR-JUDGE-03 Judge queue: assigned Submissions with progress (scored / total), deadline, filter by category; blind per SG-11.
- FR-JUDGE-04 Scoring screen: zoomable media viewer (judging derivative; essays rendered as text; video player), criteria with descriptions and 0–`maxScore` inputs (step 0.5), computed weighted total, private comment, optional participant feedback; autosave draft; submit locks the score (staff can unlock with reason); "recuse" with reason.
- FR-JUDGE-05 Round control (COMP_MGR): open, monitor completion per judge, send reminders, close, reopen, finalise; finalisation computes ranks (BR-31..34), shows ties for manual ordering with reason, applies advancement.
- FR-JUDGE-06 Results drafting: proposed Awards from the scheme; edit (add special mentions, move tiers, flag `auctionRecommended`) with reasons; submit for approval; FOA_ADMIN approve or send back with comments; publish (Stage 11).
- AC: a judge cannot see scores of other judges or any participant identity (API test asserting response fields); a submitted score cannot be changed by the judge; ranks are reproducible from stored scores (unit tests incl. ties and recusals).

### 7.6 Certificates, awards and recognition

Routes: `/verify` (form), `/verify/[certificateNumber]`, `/admin/certificates` (issued list, templates, batches), `/admin/prizes`.

- FR-CERT-01 Templates per type with background, field layout, signatories; preview with sample data; one default per type; per-Competition override.
- FR-CERT-02 Issuance: automatic on triggers (School lock → PARTICIPATION + SCHOOL_MERIT; results publish → award types, TEACHER_COORDINATOR, JUDGE_APPRECIATION; auction paid → AUCTION_CONTRIBUTOR; volunteer threshold/manual → VOLUNTEER) and manual batch issue by COMP_MGR (select recipients + type). Individual-route Participants whose Submission was verified or rejected get PARTICIPATION at results publish.
- FR-CERT-03 Rendering in worker: PDF (A4 landscape) + share PNG (1080×1350) with FOA logo stamp, seal, certificate number and QR to `/verify/<number>` (FR-STAMP-02).
- FR-CERT-04 Name corrections: Participant/Guardian/Coordinator requests → staff approves → re-render (`version`+1, same number).
- FR-CERT-05 Revoke with reason (FOA_ADMIN); revoked certificates verify as invalid.
- FR-CERT-06 Public verification shows only: valid/invalid, recipient name, certificate type/title, Competition, category, issue date. Rate-limited; `noindex`.
- FR-CERT-07 Prize fulfilment board (`PrizeFulfilment`): method, address (private), dispatch, delivery/collection.
- FR-CERT-08 Featured recognition: results page and Competition page list winners/finalists with display name, School, city and stamped thumbnail (consented Artwork only).
- AC: verify page for a revoked number shows "invalid" and no recipient data; certificate numbers are unique and sequential per year under concurrent issuance (test); QR in the PDF resolves to the correct verify URL.

### 7.7 Gallery and showcase

Routes: `/gallery` (filters: Competition, type, category, award, year; search title/display name; infinite scroll), `/gallery/[id]`; admin `/admin/gallery`.

- FR-GAL-01 Curation queue: gallery-eligible Submissions (SG-04 guards pre-checked), feature/unfeature, order, home-feature, hide with reason.
- FR-GAL-02 Item page: watermarked image (zoom), title, display name, category label, School, city/country, Competition, award, statement; share buttons (OG image stamped); "Report a concern"; link to auction if listed.
- FR-GAL-03 Featuring publishes derivatives to `foa-public` and revalidates `gallery` tags; unfeature/hide/consent withdrawal reverses it (SG-05).
- AC: an item whose public-display consent is withdrawn disappears from `/gallery`, the item URL (404) and `media.foaglobal.org` within 5 minutes (e2e test with a mocked purge); no minor PII appears in page HTML or OG tags (test scans rendered HTML for DOB/phone/email patterns).

### 7.8 Auctions and auction management

Routes: `/auctions` (active, upcoming, past results), `/auctions/[id]`, `/me/bids`, `/auctions/[id]/checkout`; admin `/admin/auctions`.

- FR-AUC-01 Listing creation from the eligible queue (SG-04; `auctionRecommended` first): title, story (prefilled from statement), images (stamped), creator credit (approved display name + category + School if consented), award, starting price, optional reserve, min increment (default from settings), start/end, anti-snipe settings; approve → `UPCOMING`.
- FR-AUC-02 Lot page: images, story, creator credit, award, current price, bid count, time left (server-synced), reserve met/not met (never the reserve amount), bid history (masked bidder handles, e.g. "Bidder 4F2A"), bid form for eligible Bidders, polling per §3.3.
- FR-AUC-03 Bidder onboarding: signed-in Member completes BidderProfile (phone, 18+ declaration, bidder terms) before first bid.
- FR-AUC-04 Bidding per BR-40..44 (atomic, anti-sniping); outbid notification (email + in-app) to the previous leader.
- FR-AUC-05 Close (scheduler at `endsAt`, re-scheduled on extension, plus a sweeper every minute): `CLOSED_SOLD` → winner notified with payment link, `paymentDueAt` = close + `auction.paymentWindowHours`; `CLOSED_UNSOLD` → AUCTION_MANAGER chooses relist or return.
- FR-AUC-06 Winner checkout: shipping address or pickup choice, Razorpay payment (`AUCTION_LOT`); on capture → `PAID`, receipt, ledger entry (`AUCTION_PROCEEDS`), thank-you to artist + `AUCTION_CONTRIBUTOR` certificate.
- FR-AUC-07 Default handling per BR-45.
- FR-AUC-08 Fulfilment board: packed, shipped (courier + tracking), delivered; PhysicalArtwork disposition updated to `DELIVERED_TO_BUYER`.
- FR-AUC-09 Admin oversight: live lot monitor, void a bid with reason (recomputes current price from remaining valid bids), block a bidder, cancel listing.
- AC: 50 concurrent bids on one lot produce a single consistent winner and strictly increasing accepted amounts (load test in CI); a bid at `endsAt − 30 s` extends `endsAt` by the extension; a user without BidderProfile gets `403 BIDDER_PROFILE_REQUIRED`.

### 7.9 Animal adoption and adoption management

FOA facilitates adoption; it does not operate shelters. Animals are listed by verified Welfare Partners (shelters, NGOs, independent rescuers, foster caregivers).

Routes: `/adopt` (filters: species, size, age band, sex, city/state, good-with tags), `/adopt/[number]`, `/adopt/[number]/apply`, `/adopt/rehome` (rehoming request); partner `/partner/adoption`, `/partner/adoption/[id]`, `/partner/applications/[id]`; admin `/admin/adoption` (listings moderation, applications, rehoming requests, follow-ups).

- FR-ADOPT-01 Partner reps create listings (§5.10) → `PENDING_REVIEW` → ADOPTION_COORDINATOR approves or sends back. Photos follow §4.7 and are stamped.
- FR-ADOPT-02 Listing page: photos, name, species/breed, sex, age estimate, size, health status (vaccinated, sterilised, dewormed), temperament tags, special needs, city/state, partner name and verified badge, adoption terms, "Apply to adopt" (18+, SG-13), share, report a concern.
- FR-ADOPT-03 Application questionnaire (stored in `answers`): applicant contact (from profile), home type (apartment/independent house/farm), own or rent (+ landlord permission), household members incl. children, other pets (species, sterilised/vaccinated), prior experience, hours the animal would be alone, where the animal will sleep, vet reference (optional), reason for adopting, agreement to home check and follow-ups, adoption terms acceptance.
- FR-ADOPT-04 Review: partner reps (own listings) and ADOPTION_COORDINATOR move applications through §5.16 states; schedule home check (date/time); approve one; mark adopted (listing → `ADOPTED`, other open applications auto-rejected with a kind message).
- FR-ADOPT-05 Messaging thread per application between the applicant and the partner reps/coordinator (adults only; SG-07); email notification on new message; staff can read all threads for safeguarding.
- FR-ADOPT-06 Follow-ups: on adoption, `AdoptionFollowUp` rows due at +7 days, +30 days and +90 days; adopter receives a short check-in form; a reported concern alerts the partner and coordinator.
- FR-ADOPT-07 Rehoming requests from pet owners: form (animal details, photos, reason, urgency) → ADOPTION_COORDINATOR reviews → assigns to a Welfare Partner → partner may create a listing from it.
- FR-ADOPT-08 Veterinarians appear as `VETERINARY_CLINIC` partners in the directory; listings MAY reference a partner vet.
- AC: an applicant under 18 cannot apply (`403 ADULT_REQUIRED`); listing pages never show street address or partner private contacts; a partner rep cannot see applications for another partner's listings.

### 7.10 Animal-welfare network directory

Routes: `/organizations` (directory: search by name; filters kind, service, species, state, city, postal code; list + optional map), `/organizations/[slug]`, `/organizations/register`; partner `/partner` (profile, members, listings); admin `/admin/partners`.

- FR-DIR-01 Registration by NGOs, rescue organisations, shelters, vet clinics, independent rescuers and foster caregivers (§5.10 fields; documents private) → `PENDING` → COMMUNITY_MANAGER verifies (checks documents, contacts) / rejects with notes.
- FR-DIR-02 Public listing only when `VERIFIED`; individuals shown at city level (§5.10 rule); per-field public toggles respected; emergency helpline prominent; "Report outdated information" (contact message with entity reference).
- FR-DIR-03 Partner self-service: edit profile (material changes — name, kind, registration number — return to review), manage reps, see their adoption listings and applications.
- FR-DIR-04 Annual confirmation: reminder to reps 12 months after `lastConfirmedAt`; unconfirmed after 30 more days → hidden from the public directory until confirmed (flag, not suspension).
- FR-DIR-05 Admin: search, filters, CSV export of the network (organisation contacts only, no individual home addresses), suspend with reason.
- AC: search by postal code returns partners whose `areasServedPostalCodes` contains it or whose address postal code matches; map loads only on user action ("Show map") to protect performance.

### 7.11 Volunteers and volunteer management

Routes: `/volunteer` (why volunteer, open opportunities, apply), `/volunteer/opportunities/[id]`, `/me/volunteer`; admin `/admin/volunteers` (applications, volunteers, opportunities, hours).

- FR-VOL-01 Application form (§5.11): skills/teams (technology, content creation, design, social media, outreach, competition management, community building, events, animal care, fundraising, translation), availability, mode, city, languages, experience, motivation. Minors: Guardian consent (`VOLUNTEER_MINOR`) required; minors limited to `REMOTE` opportunities with `minAge` ≤ their age.
- FR-VOL-02 Review by COMMUNITY_MANAGER: approve → `ACTIVE` (welcome email, milestone `VOLUNTEER`), reject with message.
- FR-VOL-03 Opportunities CRUD (team, description, mode, location, slots, dates, min age); volunteers apply; manager assigns/declines; `FILLED` when slots are taken.
- FR-VOL-04 Hours: volunteers log hours (date, minutes, description, optional assignment); manager approves/rejects; totals on profile.
- FR-VOL-05 Volunteer certificates (`VOLUNTEER` type) issued manually or when approved hours cross a configurable threshold.
- FR-VOL-06 Volunteer directory for staff with filters (team, city, mode, availability, active) and broadcast to selected volunteers.
- AC: a minor cannot be assigned an `ON_GROUND` opportunity; hours totals only include `APPROVED` entries.

### 7.12 Reports and analytics

Routes: `/admin/reports` (dashboards), `/admin/reports/[report]`, School-scoped `/school/reports`; public metrics feed the home and impact pages.

- FR-RPT-01 KPI dashboard with date range, Competition and state filters:
  - **Participation**: registrations and Enrolments by route/category/state/type; Submissions; funnel Enrolment → Submission → verified → shortlisted/advanced → finalist → award.
  - **Institutions**: Schools by status/state/kind, active Schools per Competition, clubs.
  - **Engagement**: returning Participants (enrolled in ≥2 Competitions), community joins, milestone conversion along the journey, newsletter growth, event attendance.
  - **Volunteers**: applications, active volunteers by team, approved hours.
  - **Social reach**: per channel from `SocialPost.metrics` and `SocialChannelStat` (followers, reach, impressions, engagement).
  - **Feedback**: survey response rates and score distributions per Competition/event.
  - **Fundraising**: fees, donations (one-time/recurring), auction proceeds, sponsorship — from APPROVED ledger entries.
  - **Adoption & network**: listings, applications, adoptions, time-to-adoption, verified partners by kind/state.
- FR-RPT-02 Every report table exports to CSV; exports with personal data follow SG-12.
- FR-RPT-03 Daily job writes `MetricSnapshot` rows for trend charts; live counts come from SQL aggregates with indexes.
- FR-RPT-04 School report: their Enrolments, Submissions, results, certificates issued.
- FR-RPT-05 Public metrics endpoint (cached): Participants, Schools, Competitions, Submissions, certificates issued, verified partners, adoptions facilitated, volunteer hours, published funds raised.
- AC: dashboard loads in < 2 s for 100k Enrolments (seeded perf test); numbers on the public impact page equal the report figures for the same period.

### 7.13 Notifications, communications and contact

Routes: `/contact`, `/admin/inbox`, `/admin/communications` (broadcasts, templates preview, delivery log, suppressions).

- FR-NOTIF-06 Event catalogue (each with email + in-app; recipients per SG-09):
  School applied/verified/rejected/suspended · Teacher invited · Competition published (opted-in audience) · registration confirmed · payment received/failed/refunded · roster CSV import finished · consent link sent to Guardian · Competition briefing · submission window opening/closing reminders · Submission received · correction requested · Submission verified/rejected · School results locked · shortlisted for FOA judging · physical Artwork requested / reminder / overdue / received / verified / discrepancy · judge invited / round opened / reminder · results published / award won · certificate issued · prize dispatched · gallery featured · auction lot live (watchers) · outbid · auction won / payment due / payment received / defaulted · thank-you to artist · donation receipt · recurring charge success/failure · adoption application status / new message / follow-up due · partner verified/rejected / confirmation reminder · volunteer approved / assignment / hours reviewed · event registration / reminder 24 h / cancelled · newsletter confirmation · data request completed · contact acknowledgement.
- FR-NOTIF-07 Broadcasts: audience segments — all verified School Coordinators; Coordinators of a Competition; Enrolments of a Competition (filters: category, route, status; delivered to Guardians/Coordinators per SG-09); Bidders; active volunteers (filters); community members/newsletter subscribers (consented); event registrants; Welfare Partner reps. Compose (Markdown, merge fields), preview with a sample recipient, test-send to self, recipient count, schedule, send through the queue (throttled), delivery stats.
- FR-NOTIF-08 Contact form (Turnstile): name, email, phone (optional), topic, message → `ContactMessage`, auto-acknowledgement; inbox with topic routing to roles (§2.3), assignment, status, internal notes, reply by email from the inbox (logged).
- FR-NOTIF-09 "Report a concern" (on gallery items, listings, directory pages, events, content, and a general link in the footer): creates `ContactMessage(topic=REPORT_CONCERN, priority=HIGH, entityType, entityId)`, notifies the safeguarding lead immediately; staff can hide the entity from the inbox in one action.
- AC: a broadcast to a Competition audience never emails a minor's own address; unsubscribing stops all non-transactional email within one send cycle; concern reports reach the safeguarding lead by email within 1 minute.

### 7.14 Community and engagement

Routes: `/community` (what the community is, join, clubs, ambassadors, campaigns), `/community/clubs`, `/community/clubs/[slug]`, `/community/ambassadors`, `/community/ambassadors/apply`, `/school/club`; admin `/admin/community` (members, clubs, ambassadors, surveys).

- FR-COMM-01 Join the community (signed-in Member): interests, communication consent → `CommunityMembership`, milestone `COMMUNITY_MEMBER`. Newsletter sign-up for anyone (double opt-in).
- FR-COMM-02 Clubs: a verified School's Coordinator/Teacher proposes an FOA club → COMMUNITY_MANAGER approves → club page (name, School, description, published activities). Members are added from the School's Participants (names visible to the School only). Activities with photos go through review (SG-08) before publishing.
- FR-COMM-03 Ambassadors: eligible Members apply (eligibility basis shown; FOA finalists/award winners, volunteers above an hours threshold, club leads, or nominated by staff) → approve → ambassador page (first name, city, bio; adults only on the public page).
- FR-COMM-04 Engagement journey: milestones written automatically on events (Enrolment, School position 1–3, finalist, award, community join, volunteer active, club member, ambassador active, donation, adoption); shown on `/me/journey`; aggregate conversion in reports.
- FR-COMM-05 Post-competition invitations (Stage 14): job after results publish sends the invitation sequence (consented recipients) with tracked links (UTM-style query parameters only; no third-party tracking).
- FR-COMM-06 Feedback surveys per Competition/event: builder (rating, choice, free text), distribution with the invitation email or event follow-up, anonymous option, aggregate results.
- AC: no public page lists minor club members; milestone creation is idempotent (re-running the job creates no duplicates).

### 7.15 Events and campaigns

Routes: `/events` (upcoming/past, type filter), `/events/[slug]`, `/campaigns`, `/campaigns/[slug]`; admin `/admin/events`, `/admin/events/[id]/registrations`, `/admin/campaigns`.

- FR-EVT-01 Events CRUD (§5.12) with cover, venue map link or online link (revealed after registration), capacity with waitlist, audience restriction, cancellation (notifies registrants).
- FR-EVT-02 Registration: signed-in or guest (Turnstile); confirmation with QR check-in code and `.ics`; cancel; waitlist auto-promotion when a seat frees.
- FR-EVT-03 Reminders 24 h before; check-in screen for staff/volunteers (scan QR or search name) marking `ATTENDED`; post-event survey and photo gallery (reviewed).
- FR-EVT-04 Campaigns CRUD: story, dates, goal type, linked fund (progress bar from completed donations), linked content/events/Competitions, hashtag, share kit.
- FR-EVT-05 Pledges: name, city, optional email, show-name toggle (Turnstile) → `PENDING_REVIEW`; published pledges count and wall (first name + city).
- AC: capacity is never exceeded under concurrent registrations (transactional check); online links are absent from public HTML.

### 7.16 Donations, funds and sponsors

Routes: `/donate`, `/donate/thank-you`, `/donate/[fundSlug]`, `/supporters` (donor wall + disclosed sponsors); admin `/admin/donations`, `/admin/funds`, `/admin/sponsors`.

- FR-DON-01 Donate page: purpose (fund) cards with description and optional target progress, amount presets + custom amount, one-time or monthly, donor details (name, email, phone), optional 80G section (PAN, address) shown only when `org.80g` is configured, anonymous toggle, show-on-donor-wall toggle, optional dedication, campaign attribution from query/referrer page; guest checkout with Turnstile; Razorpay checkout.
- FR-DON-02 One-time: `Donation(PENDING)` → capture → `COMPLETED`, receipt number, receipt PDF (80G fields when applicable) emailed, ledger entry, milestone `DONOR` for signed-in donors.
- FR-DON-03 Monthly: Razorpay Subscription (plan per amount, created on demand and reused) → each `subscription.charged` creates a completed `Donation` + receipt; donor cancels from `/me/donations`; failure/halted notifications.
- FR-DON-04 Admin: donations list/filters/export (receipt register, 80G register), resend receipt, mark refund (FINANCE, via §3.6), funds CRUD and ordering.
- FR-DON-05 Sponsors (corporate sponsors, CSR partners, foundations, institutional donors): CRUD, contributions (monetary via ledger or Razorpay payment link sent from admin; in-kind description), agreement documents (private), linked Competitions/campaigns/events ("Supported by"). **Public display only when `publicDisclosure` is true** (FR-DON-06).
- FR-DON-06 Supporters page: disclosed sponsors (logo, name, tier label) and donor wall (only donors with `showOnDonorWall` and not anonymous: name + fund + month/year; no amounts).
- AC: PAN is stored encrypted at rest (application-level, key from env) and masked in all UIs except the receipt; a sponsor with `publicDisclosure=false` appears on no public page or API; receipt numbers are sequential without gaps from failed payments (assigned on completion only).

### 7.17 Finance, budgets and transparency

Routes: `/transparency` (public), `/transparency/[fiscalYear]`; admin `/admin/finance` (ledger, budgets, periods, documents, exports, reconciliation).

- FR-FIN-01 Ledger: system entries from captured payments, refunds and gateway fees (from Razorpay payment `fee`/`tax`) are created `APPROVED`; manual entries (expenses, grants, offline income) are created `DRAFT` with attachments and approved by a different FINANCE_MANAGER or FOA_ADMIN (maker-checker); void with reason (never delete).
- FR-FIN-02 Budgets per fiscal year (India FY April–March) with lines by category/fund/Competition; budget vs actual report.
- FR-FIN-03 Reconciliation view: Razorpay payments vs ledger vs fulfilled purposes; mismatches listed (captured without fulfilment, fulfilled without capture).
- FR-FIN-04 Transparency publishing: FINANCE_MANAGER publishes a period (quarter or full year) → public page shows income by source, expenses by category, fund utilisation per donation fund, auction proceeds, number of donors (count only), and published documents (annual reports, audited statements, registration and tax-exemption certificates, utilisation reports). Unpublished periods are never public.
- FR-FIN-05 Exports (CSV/XLSX): ledger, fee income, donations with receipt numbers, 80G register, auction sales, sponsor contributions — for accounts and regulatory filings.
- FR-FIN-06 Public charts use accessible colours in both themes and always have a data-table fallback.
- AC: transparency totals equal the sum of APPROVED ledger entries for the published period (test); a manual entry cannot be approved by its creator.

### 7.18 Content and social media management

Routes: `/admin/content` (all types), `/admin/content/[id]`, `/admin/media`, `/admin/social` (calendar + board), `/admin/social-kits`, `/admin/legal` (legal document versions), `/admin/team`, `/admin/impact`.

- FR-CONTENT-01 Rich-text editor (Tiptap) with headings, lists, links, images (from media library with required alt text), embeds (YouTube only, privacy-enhanced domain), callouts; autosave; revision history (last 20); preview; workflow per §5.16; scheduled publishing (job every minute).
- FR-CONTENT-02 SEO panel (title, description, OG image auto-generated with logo stamp or uploaded), slug editing with redirect from the old slug.
- FR-CONTENT-03 Media library: upload, tag, usage rights and licence note, where-used list; participant Artwork appears only via gallery-eligible derivatives.
- FR-SOCIAL-01 Social planner: calendar and board of `SocialPost`s by channel; create from a source (gallery item, award, certificate share image, content, campaign, event) which pre-fills caption template, credit line ("Artwork by <display name>, <category>, <School>"), hashtags and stamped media in channel sizes; approval by CONTENT_MANAGER; after manual posting, record posted URL; enter metrics later.
- FR-SOCIAL-02 Social kits: one-click ZIP for a Competition's results (winners' stamped images in 1080×1080, 1080×1350, 1080×1920, 1200×630 + captions text file), only for consented items.
- FR-SOCIAL-03 Channel stats entry per period for reports.
- FR-CONTENT-04 Legal documents: draft new version, diff against current, publish (SUPER_ADMIN or FOA_ADMIN); consent forms always use the latest published version.
- FR-CONTENT-05 Team members, impact metrics (draft/publish), FAQ items.
- AC: a social post cannot attach an asset that is not a stamped, consented derivative (validation); withdrawing consent cancels planned posts using that Artwork and alerts the content team.

### 7.19 Privacy, consent and safeguarding tools

Routes: `/me/privacy`, `/admin/safeguarding` (concerns queue, consent search, data requests, staff policy acceptance status), `/legal/child-safeguarding`.

- FR-PRIV-01 Data export: user requests → job builds a ZIP (JSON per entity + their files) for the user and managed minors → emailed signed link (24 h).
- FR-PRIV-02 Deletion: user requests → SUPER_ADMIN/FOA_ADMIN processes: anonymise profile fields, delete private media not required by law, keep financial records and certificates' public verifiability (recipient name kept on issued certificates unless revoked) — rules listed in the job; Clerk user deleted; audited.
- FR-PRIV-03 Correction requests (e.g. name on certificate) routed to the right queue.
- FR-PRIV-04 Consent search: by Participant/Submission; full consent history with legal text versions and methods.
- FR-PRIV-05 Safeguarding dashboard: open concerns, hidden items, staff without current policy acceptance, recent sensitive exports.
- FR-PRIV-06 Privacy notice and child safeguarding policy are public legal pages; consent texts link to them.
- AC: a deletion request leaves no PII in `User`/`ParticipantProfile` rows except retained-by-rule fields (test enumerates columns); export ZIP includes consent history.

### 7.20 FOA Admin dashboard and platform administration

Routes: `/admin` (overview), `/admin/users`, `/admin/users/[id]`, `/admin/settings`, `/admin/audit`, plus every admin route named in earlier sections. Admin navigation is grouped: Competitions (competitions, Schools, physical, judging, certificates, prizes) · Showcase (gallery, auctions) · Money (payments, donations, funds, sponsors, finance) · Network (partners, adoption, volunteers, community, events, campaigns) · Content (content, social, media, legal) · Operations (inbox, communications, reports, safeguarding) · System (users, settings, audit). Items are shown only for roles that can use them (§2.3).

- FR-ADMIN-01 Overview: KPI tiles (open Competitions, Enrolments, pending School verifications, Submissions awaiting verification, physical overdue, rounds open, certificates pending render, active auctions, payments today, donations this period, pending partner verifications, open concerns, contact inbox new) each linking to its queue; "My queues" list for the signed-in staff role.
- FR-ADMIN-02 Users: search by name/email/participant number; user detail (roles, memberships, profiles, activity summary); suspend/reactivate (audited); staff role change (SUPER_ADMIN only).
- FR-ADMIN-03 Settings editor for §5.14 keys with validation and audit.
- FR-ADMIN-04 Audit log per FR-AUDIT-03.
- FR-ADMIN-05 Every admin list: server-side pagination, filters as URL query params, CSV export where allowed, bulk actions with confirmation, phone layout per §4.8.
- AC: a staff role sees no navigation items or routes outside its permissions (UI test per role) and the API rejects them (policy test per endpoint).

---

## 8. API

### 8.1 Conventions

- Base path `/api/v1`, JSON only, UTF-8. Breaking changes go to `/api/v2`.
- Success: `{ "success": true, "data": …, "meta"?: { "nextCursor"?, "total"? } }`. Failure: `{ "success": false, "error": { "code", "message", "details"? } }`.
- Error codes: `VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `INVALID_TRANSITION` 409 · `RATE_LIMITED` 429 · `INTERNAL` 500; domain codes (409/403 unless noted): `WINDOW_CLOSED`, `SHORTLIST_LIMIT_REACHED`, `FEE_UNPAID`, `CONSENT_REQUIRED`, `ADULT_REQUIRED`, `BIDDER_PROFILE_REQUIRED`, `AUCTION_NOT_ACTIVE`, `BID_TOO_LOW`, `CAPACITY_FULL`, `DUPLICATE_ENROLMENT`, `SAFEGUARDING_ACCEPTANCE_REQUIRED`, `PAYMENT_VERIFICATION_FAILED` (400).
- Validation with the shared Zod schemas; unknown body fields are rejected (`.strict()`).
- Pagination: cursor (`?cursor=&limit=`, default 20, max 100); admin lists also return `meta.total`. Sorting `?sort=-createdAt`; filters as plain query params.
- `Idempotency-Key` header required on: payment creation, bid placement, Submission submit, registration create, broadcast send. Keys are stored 24 h per user; a replay returns the first response.
- Auth: `Authorization: Bearer <Clerk session token>`. Public endpoints need none. Webhooks are verified by signature only and live under `/api/v1/webhooks/*` (raw body parsing for those routes only).
- Policy: every handler calls a policy function from its module (`can(user, action, resource)`), backed by the matrix in §2.3; tests cover allow and deny for each endpoint.
- Rate limits (per IP for public, per user when signed in): public forms 5/min · certificate verify 30/min · bids 10/min · uploads 30/h · general 300/min.
- OpenAPI 3.1 generated from Zod at `/api/v1/openapi.json`; Swagger UI at `/docs` outside production.
- `GET /health` (DB + queue reachable) and `GET /health/live` for uptime checks.

### 8.2 Endpoint catalogue

Actor legend: P = public, M = member (signed in), G = Participant/Guardian (owner), SC = School Coordinator, T = Teacher, J = Judge, WP = Welfare Partner rep, S:<ROLE> = staff role (FOA_ADMIN and SUPER_ADMIN implied unless stated).

**Public and webhooks**
```
GET  /competitions                     P   list (status, type, route, q)
GET  /competitions/:slug               P   detail
GET  /competitions/:slug/results       P   published results
GET  /gallery  ·  /gallery/:id         P
GET  /auctions ·  /auctions/:id        P   includes serverTime
GET  /partners ·  /partners/:slug      P   verified directory
GET  /adoption/listings · /:number     P   available listings
GET  /content?type= · /content/:type/:slug   P
GET  /events · /events/:slug · /campaigns · /campaigns/:slug   P
GET  /funds · /supporters · /impact · /metrics/public           P
GET  /transparency · /transparency/:fiscalYear                  P   published periods + documents
GET  /schools/public                   P   opted-in participating Schools
GET  /legal/:key                       P   latest published version
GET  /certificates/verify/:number      P
POST /contact                          P   Turnstile
POST /newsletter/subscribe · GET /newsletter/confirm            P
POST /donations                        P/M Turnstile for guests → payment order
POST /campaigns/:slug/pledges          P   Turnstile
POST /events/:slug/registrations       P/M Turnstile for guests
POST /webhooks/razorpay · /webhooks/clerk · /webhooks/resend    signature
```

**Member and Participant/Guardian**
```
GET/PATCH /me · POST /me/onboarding · GET /me/dashboard
GET /me/notifications · POST /me/notifications/:id/read · POST /me/notifications/read-all
GET/PATCH /me/preferences · POST /me/consents (communication) 
GET/POST /me/participants · GET/PATCH /me/participants/:id          G
POST /competitions/:id/registrations/individual                    G   → registration + payment order
POST /registrations/:id/withdraw                                    G/SC
GET  /me/enrolments · GET /me/submissions                           G
POST /submissions · PATCH /submissions/:id                          G/SC/T
POST /submissions/:id/submit · /resubmit · /withdraw                G/SC/T
POST /submissions/:id/consents · POST /consents/:id/withdraw        G (SC certified for roster)
POST /uploads · POST /uploads/:id/complete · GET /assets/:id/url    M (policy-checked)
GET  /me/certificates · GET /certificates/:id/download · POST /certificates/:id/correction-request   G/SC
PATCH /physical/:id/dispatch                                        G/SC/T
POST /payments/:id/verify · GET /me/payments                        M
GET  /me/donations · POST /me/donation-subscriptions/:id/cancel     M
PUT  /me/bidder-profile · POST /auctions/:id/bids · GET /me/bids    M (Bidder)
POST /auctions/:id/checkout                                         M (winner) → payment order
POST /schools (apply) · PATCH /schools/:id/application              M
POST /partners (register)                                           M
POST /adoption/listings/:id/applications · GET /me/adoption-applications   M (18+)
GET/POST /adoption/applications/:id/messages                        M (applicant) / WP / S:ADOPTION_COORDINATOR
POST /adoption/follow-ups/:id · POST /adoption/rehoming-requests    M
POST /volunteer/application · GET /volunteer/opportunities · POST /volunteer/opportunities/:id/apply · POST /volunteer/hours   M
POST /community/join · POST /ambassadors/applications               M
POST /surveys/:id/responses                                         M/P (anonymous surveys)
GET  /me/event-registrations · POST /event-registrations/:id/cancel M
POST /me/data-requests                                              M
POST /me/safeguarding-acceptance                                    staff
```

**School**
```
GET/PATCH /schools/:id · GET/POST/DELETE /schools/:id/members · POST /schools/:id/members/transfer-coordinator   SC
POST /schools/:id/registrations · GET /schools/:id/registrations                    SC
GET/POST /registrations/:id/enrolments · PATCH/DELETE /enrolments/:id               SC/T
POST /registrations/:id/enrolments/import (CSV, async) · GET /imports/:id           SC/T
POST /registrations/:id/consents/certify · POST /enrolments/:id/guardian-consent-link   SC/T
POST /registrations/:id/fee-payments                                                SC  → payment order
PUT  /registrations/:id/conduct-certification                                       SC
PUT  /registrations/:id/school-results/:categoryId · POST …/lock                    SC/T (lock: SC)
GET  /registrations/:id/certificates.zip (async job) · GET /jobs/:id                SC/T
GET  /schools/:id/physical · GET /schools/:id/reports                               SC/T
POST /schools/:id/clubs · PATCH /clubs/:id · POST /clubs/:id/members · POST /clubs/:id/activities   SC/T
```

**Judge**
```
GET  /judge/competitions · POST /judge/competitions/:id/conflicts   J
GET  /judge/rounds · GET /judge/rounds/:id/queue                    J
GET  /judge/assignments/:id                                         J   blind payload
PUT  /judge/assignments/:id/score · POST …/submit · POST …/recuse   J
```

**Welfare Partner**
```
GET/PATCH /partner/:id · GET/POST/DELETE /partner/:id/members · POST /partner/:id/confirm   WP
GET/POST /partner/:id/adoption-listings · PATCH /adoption-listings/:id · POST …/submit-review · POST …/status   WP
GET  /partner/:id/applications · POST /adoption/applications/:id/status                       WP
```

**Admin** (all under `/admin`, role per §2.3)
```
competitions:  CRUD · /:id/publish · /archive · /cancel · /duplicate · categories · criteria · rounds · award-tiers
schools:       list · /:id/verify · /reject · /suspend · /reinstate · /merge · pending-changes approve
registrations: list · enrolments list/export · /enrolments/:id/waive · /enrolments/:id/disqualify · profile merge
submissions:   queue · /:id/verify · /request-correction · /reject · bulk-verify
physical:      list · request (bulk) · /:id/receive · /verify · /discrepancy · /resolve · /dispose
judging:       panel invite/remove · rounds open/close/reopen/finalise · assignments auto/manual · reminders · tie-break
results:       /competitions/:id/results/draft · /submit · /approve · /send-back · /publish · awards edit/revoke
certificates:  templates CRUD/preview · issue batch · /:id/revoke · /:id/rerender · correction requests · prizes
gallery:       eligible queue · feature · unfeature · order · hide
auctions:      listings CRUD · /approve · /cancel · /close · bids/:id/void · bidders/:id/block · /second-chance · fulfilment updates
payments:      list · /:id · /:id/refunds · reconciliation
donations:     list · export · /:id/resend-receipt · funds CRUD · subscriptions list
sponsors:      CRUD · contributions CRUD · /:id/payment-link
finance:       ledger CRUD · /approve · /void · budgets CRUD · periods /publish · public-documents CRUD/publish · exports
partners:      queue · /verify · /reject · /suspend · export
adoption:      listings moderation · applications · rehoming requests · follow-ups
volunteers:    applications approve/reject · opportunities CRUD · assignments · hours approve/reject · export
community:     members · clubs approve · club activities review · ambassadors approve · surveys CRUD/results · pledges review
events:        CRUD · registrations · check-in · cancel   |   campaigns: CRUD
content:       CRUD · workflow · media library · legal documents versions/publish · team · impact metrics · FAQ
social:        posts CRUD/approve/posted/metrics · channel stats · social kits generate
communications: broadcasts CRUD/test/schedule/send/cancel · delivery log · suppressions
inbox:         contact messages list/assign/status/reply · concerns hide-entity
reports:       /reports/:key (JSON + CSV)
safeguarding:  dashboard · consent search · data requests process
users:         list · /:id · /suspend · /reactivate · /staff-role (SUPER_ADMIN)
settings · audit
```

---

## 9. Business rules

**Competitions and registration**
- BR-01: `registrationOpensAt < registrationClosesAt`, `submissionOpensAt < submissionClosesAt`, `registrationOpensAt ≤ submissionOpensAt`, `registrationClosesAt ≤ submissionClosesAt`; `ageReferenceDate` set. Slugs: unique, lowercase kebab-case, immutable after publish.
- BR-02: Category = the one whose `[minAge, maxAge]` contains the Participant's age on `ageReferenceDate`; categories of a Competition must not overlap.
- BR-03: One Enrolment per Participant per Competition (across routes).
- BR-04: A route can be used only when its `allow…Participation` flag is true. A School must be `VERIFIED` to register.
- BR-05: Registrations and roster additions only while `REGISTRATION_OPEN`; staff can add later (audited).
- BR-06: Fee amounts are computed by the server from the Competition when the payment is created; later fee edits do not touch existing Enrolments. Submitting, shortlisting and receiving certificates require fee `PAID` or `WAIVED`.

**School round and Submissions**
- BR-10: Shortlisted Enrolments per (registration, category) ≤ effective limit (category override, else Competition `schoolShortlistLimit`; `null` = no limit). Enforced in the same transaction with a row lock on the registration.
- BR-11: Locking School results needs a conduct certification; School positions are unique per category; School-route Submissions exist only for shortlisted Enrolments in locked categories.
- BR-12: Verification checks: Enrolment `ACTIVE` with fee settled; age matches category; participation consent true; primary asset `READY`; file count/size, word count or duration within Competition limits; School route also: category locked, Enrolment shortlisted, School position recorded.
- BR-13: Correction deadline defaults to 7 days from the request (editable per request, never after judging opens).
- BR-14: One Submission per Enrolment.
- BR-15: Human numbers (§4.4) are assigned on the transition that creates the business fact (Submission number on submit, receipt number on completion, certificate number on issue) and are never reused.

**Physical Artwork**
- BR-20: Requests: `TOP_SHORTLISTED_ONLY` → on verification of a School-route Submission with School position ≤ `physicalTopN` (or all shortlisted if `physicalTopN` is null); individual route → on verification when `individualPhysicalRequired`; `ALL_WINNERS` → on results publish for Submissions with an Award; `OPTIONAL` → manual only; `NOT_REQUIRED` → never.
- BR-21: Dispatch deadline = request time + `physicalDispatchDeadlineDays` (default 14).
- BR-22: In a `PHYSICAL` round only Submissions with PhysicalArtwork `VERIFIED` can be scored; others show "awaiting physical verification".

**Judging and results**
- BR-30: A round opens only when every Submission in it has ≥ `minJudgesPerSubmission` non-conflicted assignments. A judge with a declared conflict on a School is never assigned that School's Submissions.
- BR-31: Weighted total = Σ over criteria of (score ÷ `maxScore` × `weightPercent`), range 0–100, 2 decimals.
- BR-32: Aggregate = mean of `SUBMITTED` weighted totals (recused excluded). Submissions with fewer than `minJudgesPerSubmission` submitted scores block finalisation unless forced with a reason.
- BR-33: Rank per category by aggregate, descending. Ties: higher median score first, then a manual order with a reason.
- BR-34: The top `advanceCountPerCategory` ranks advance; ties at the cut-off all advance unless manually resolved.
- BR-35: Award proposals: `RANK`/`MEDAL` tiers by final rank range; `GRADE` tiers by aggregate score band; `MANUAL` by staff. At most one Award per Submission per round level.
- BR-36: Results are approved by an `FOA_ADMIN` who is not the drafter (a `SUPER_ADMIN` may approve own drafts, audited).
- BR-37: Scores and private comments are never shown outside staff and the scoring judge; `participantFeedback` is visible to the Participant/Guardian after publish.

**Gallery and certificates**
- BR-38: Certificate verification exposes only the fields in FR-CERT-06.
- BR-39: Gallery eligibility is exactly SG-04.

**Auctions**
- BR-40: Bids are accepted only when the listing is `ACTIVE`/`EXTENDED`, now < `endsAt`, the bidder has an `ACTIVE` BidderProfile, and the bidder is not the creator, the creator's Guardian, or an `AUCTION_MANAGER`.
- BR-41: First bid ≥ `startingPricePaise`; later bids ≥ `currentPricePaise + minIncrementPaise`; amounts in whole rupees; the leading bidder cannot raise their own bid. Default `minIncrementPaise` = `auction.defaultMinIncrementPercent` of the current price, rounded up to the nearest 10 rupees.
- BR-42: Placing a bid is one transaction: lock the listing row (`SELECT … FOR UPDATE`), validate, insert the bid, mark the previous leading bid `OUTBID`, update `currentPricePaise`, `leadingBidId`, `bidCount`, apply anti-sniping, commit; then enqueue notifications.
- BR-43: Anti-sniping: if `endsAt − now < antiSnipeWindowSec`, set `endsAt = max(endsAt, now + antiSnipeExtensionSec)`, status `EXTENDED`, reschedule the close job.
- BR-44: At close the leading bid wins if ≥ reserve (or no reserve); otherwise `CLOSED_UNSOLD`.
- BR-45: Unpaid by `paymentDueAt` → `PAYMENT_DEFAULTED`; the bidder's profile records a default (2 defaults → `BLOCKED`). AUCTION_MANAGER may offer the lot to the next-highest valid bidder at their bid (own payment window) or relist.

**Payments, donations, finance**
- BR-50: Amounts are server-computed; the Razorpay order amount equals the sum of `PaymentItem`s; purposes are fulfilled only on `CAPTURED` (webhook); webhook processing is idempotent.
- BR-51: A fee payment covers only Enrolments that are `UNPAID` when the order is created (rows locked); an Enrolment cannot be in two open fee payments.
- BR-52: Refund total ≤ captured amount; a full refund reverses fulfilment (Enrolment → `REFUNDED`, Donation → `REFUNDED`); auction refunds return the lot to AUCTION_MANAGER for a decision.
- BR-53: 80G receipt fields only when `org.80g` is configured and the donor gave PAN and address.
- BR-54: Anonymous donors are never named publicly; the donor wall never shows amounts; sponsors appear publicly only with `publicDisclosure`.
- BR-55: Manual ledger entries need approval by a different user (maker-checker); approved entries are never edited, only voided and replaced.
- BR-56: Fiscal year = 1 April – 31 March, `Asia/Kolkata`.
- BR-57: Publishing a transparency period stores a snapshot of its figures; entries approved later for that period appear publicly only after re-publishing.

**Adoption, volunteers, community**
- BR-60: Adoption applicants are 18+; one open application per applicant per listing; max 5 open applications per applicant.
- BR-61: Only one application per listing can be `APPROVED`.
- BR-62: Minor volunteers: Guardian consent, `REMOTE` only, opportunity `minAge` ≤ their age.
- BR-63: Public names of minors (gallery, results, clubs, pledges) use the approved display name only.

**General**
- BR-70: User-facing records are soft-deleted; hard deletes only by retention or data-deletion jobs.
- BR-71: Every state transition and staff mutation is audited (FR-AUDIT-01).
- BR-72: Changing a published slug creates a permanent redirect from the old slug.

---

## 10. Non-functional requirements

- NFR-01 Performance: Lighthouse mobile performance ≥ 90 on `/`, `/competitions`, `/competitions/[slug]`, `/gallery`, `/auctions/[id]`; LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on a mid-range phone over 4G; route JS budget 170 KB gzipped for public pages; images via `next/image` with explicit sizes, AVIF/WebP, lazy below the fold; fonts self-hosted, two weights max.
- NFR-02 API latency: p95 < 300 ms for reads, < 600 ms for writes (excluding uploads and payment provider calls) at 50 requests/s.
- NFR-03 Capacity targets: 100k Participants, 10k Schools, 200k Submissions, 1,000 concurrent viewers on one auction lot.
- NFR-04 Availability: 99.5% monthly for web and API; background jobs retried with backoff and dead-lettered; dead-letter queue visible in admin (SUPER_ADMIN).
- NFR-05 Security: OWASP ASVS level 2 as the checklist; HTTPS only, HSTS; CSP (no inline scripts except Next nonces), `frame-ancestors 'none'`; helmet defaults; CORS allowlist; input validation everywhere; rich text sanitised server-side (`sanitize-html` allowlist); SVG uploads staff-only and sanitised; magic-byte file checks; presigned URL TTLs per §3.5; secrets only in platform env stores; Dependabot + `pnpm audit` in CI; CodeQL on PRs.
- NFR-06 Privacy: SG rules; PAN and other secrets encrypted at application level (AES-256-GCM, key from env); logs never contain PII (pino redaction paths for email, phone, address, DOB, PAN, tokens); Sentry scrubbing on.
- NFR-07 Data integrity: all multi-row business changes in DB transactions; unique constraints back every "one per" rule; money as integers; optimistic concurrency (`updatedAt` check) on admin edit forms.
- NFR-08 Backups and recovery: Neon point-in-time restore; R2 versioning on `foa-private`; a documented restore drill in `docs/runbooks/restore.md`.
- NFR-09 Observability: Sentry errors + performance on web/api/worker with release tags; structured logs with request id propagated web → API → jobs; uptime checks on `/health` every minute with alerting; queue depth and dead-letter alerts.
- NFR-10 Accessibility: §4.9 (WCAG 2.2 AA).
- NFR-11 Browser support: last 2 versions of Chrome, Safari (iOS ≥ 16), Firefox, Edge, Samsung Internet.
- NFR-12 Maintainability: TypeScript strict everywhere; no `any` without a comment; module boundaries per §3.2; shared Zod schemas as the only contract; each module has a README of its policies and state machine.

---

## 11. Quality gates and Definition of Done

**CI (GitHub Actions, every PR):** install with frozen lockfile → typecheck → lint → unit tests → API integration tests against a Postgres 17 service (migrations applied from scratch) → build web and API → Playwright smoke tests at 390×844 (phone) and 1440×900 (desktop) against the built app with seeded data and Razorpay test mode/mocks → Lighthouse CI on key routes (NFR-01 budgets) → `prisma migrate diff` check (schema and migrations in sync).

**Test expectations:**
- Unit tests for every business rule (BR-*) and pure helper (ID formats, scoring, category derivation, money).
- API integration tests for every endpoint: happy path, validation error, allow/deny per role (policy matrix), and invalid transitions.
- Concurrency tests: shortlist limit (BR-10), bidding (BR-42), sequential numbers (§4.4), event capacity.
- Safeguarding tests: public endpoints and rendered public HTML never contain minors' PII (SG-01); judge payloads are blind (SG-11); consent withdrawal unpublishes (SG-05).
- Webhook tests with recorded Razorpay/Clerk/Resend payloads, incl. duplicates and bad signatures.
- Auth in tests: the token verifier is an injectable port; tests use a fake verifier that maps test tokens to seeded users. Playwright uses Clerk testing tokens.

**Definition of Done (per PR):**
1. Cites the FR/BR/SG/NFR IDs it implements; acceptance criteria for those IDs pass as automated tests.
2. Migration added (never edited after merge); seed updated when new entities need demo data.
3. API: Zod schemas in `packages/shared`, policy checks, audit entries, OpenAPI updated.
4. UI: phone-first layout verified at 360/390 px and desktop; empty/loading/error states; a11y check (axe) clean.
5. Notifications for new events added to the catalogue (FR-NOTIF-06) with templates.
6. No PII in logs; new public fields checked against SG-01.
7. CI green; preview deployment works end to end for the changed flow.
8. Docs: module README updated; ADR added if a hard-to-reverse decision was made; this spec updated if behaviour changed.

**Seed data:** realistic demo set (Schools in several states, Competitions in each status, rosters, Submissions across statuses, rounds with scores, certificates, gallery items, auction lots in each state, donations, ledger entries, partners, adoption listings, volunteers, events, content) generated deterministically; never real people's data.

---

## 12. Build order (dependency graph)

Each slice is a vertical, shippable ticket set (schema → API → UI → tests). Slices on the same line can run in parallel once their dependencies are merged.

| Slice | Contents | Depends on |
|---|---|---|
| S0 Foundation | Monorepo, CI, docker compose, env validation, Prisma base (User, Setting, AuditLog, IdSequence, WebhookEvent, Asset), Clerk auth + JIT users + webhooks + staff roles + bootstrap, policy framework, audit middleware, pg-boss worker, upload/media pipeline (§3.5), notification core (email + in-app), revalidation hook, design system (tokens, layout shell, nav, dark mode), Sentry, health checks, ADRs 0001–0006 | — |
| S1 Legal and consent core | LegalDocument versions, ConsentRecord, onboarding, safeguarding acceptance gate | S0 |
| S2 Content and public shell | ContentItem + editor, media library, home skeleton, about, welfare, stories/news/blog, FAQ, legal pages, team, impact metrics, contact + inbox, newsletter, SEO plumbing | S0, S1 |
| S3 Payments core | Payment, PaymentItem, Refund, Razorpay orders/checkout/verify/webhooks/reconciliation, receipts, system ledger entries | S0 |
| S4 Schools | Apply, verify, memberships, profile, admin queue, merge | S0, S1 |
| S5 Competitions | Competition CRUD/publish/scheduler, categories, criteria, rounds, award tiers, public list/detail | S0, S1 |
| S6 Registration and Enrolment | Participant profiles (self/Guardian/roster), both routes, roster CSV, fee checkout, waivers, consent certification, briefing | S3, S4, S5 |
| S7 Submissions | Submission create/submit/consents, School conduct certification, School results + lock + shortlist upload, verification queue, corrections | S6 |
| S8 Physical Artwork | Requests, dispatch, receipt, verification, overdue jobs, dispositions | S7 |
| S9 Judging and results | Panel, conflicts, rounds, assignments, scoring, ranking, advancement, results draft/approve/publish, Awards, prize fulfilment | S7 (S8 for `PHYSICAL` rounds) |
| S10 Certificates | Templates, issuance triggers, rendering, verification page, ZIP downloads, corrections, revocation | S9 (participation part after S7) |
| S11 Gallery | Curation, public gallery, publish/unpublish pipeline, consent withdrawal | S9 |
| S12 Auctions | Bidder profile, listings, bidding, anti-sniping, close, checkout, defaults, fulfilment | S3, S8, S11 |
| S13 Donations and sponsors | Funds, one-time + recurring donations, receipts, 80G, donor wall, sponsors | S3 |
| S14 Finance and transparency | Ledger (manual + approvals), budgets, reconciliation view, periods + snapshots, public documents, exports, transparency pages | S3, S13 |
| S15 Welfare Partner directory | Registration, verification, partner dashboard, public directory + map, annual confirmation | S0, S1 |
| S16 Adoption | Listings, moderation, applications, messaging, follow-ups, rehoming requests | S15 |
| S17 Volunteers | Applications, opportunities, assignments, hours, volunteer certificates | S1 (S10 for certificates) |
| S18 Community and engagement | Community membership, clubs, ambassadors, milestones, invitations, surveys | S10, S17 |
| S19 Events and campaigns | Events, registrations, check-in, reminders, campaigns, pledges | S2 (S13 for fund progress) |
| S20 Social planner | Social posts, kits, channel stats | S10, S11 |
| S21 Communications | Broadcasts, segments, delivery log, suppressions, full event catalogue wiring | S6 (extends as modules land) |
| S22 Reports and analytics | KPI dashboards, exports, snapshots, public metrics, School reports | S9, S13, S16, S17 |
| S23 Privacy tooling and hardening | Data export/deletion/correction, safeguarding dashboard, CSP tightening, perf pass, load tests, restore drill | all |

Safeguarding rules (§4.1) apply from S0; S23 adds tooling, not the rules.

---

## 13. Open decisions (client input needed; build the default)

| # | Question | Default built now | Seam kept |
|---|---|---|---|
| OD-01 | Do School-route students get their own logins? | No: roster profiles without login; Guardians/Participants can be invited later | `ParticipantProfile.userId` nullable, `claimCode`, invite flow stub |
| OD-02 | SMS / WhatsApp provider (India needs DLT template registration) | Email + in-app only | `NotificationChannel` adapter, `features.smsEnabled` |
| OD-03 | Languages beyond English (Hindi, regional) | English only | next-intl catalogues; content single-language |
| OD-04 | Auction policy text: ownership transfer, use of proceeds, artist acknowledgement for minors, return of unsold Artwork | Placeholder legal versions marked DRAFT; auctions can't open until `AUCTION_TERMS` and `CONSENT_AUCTION` are published | `LegalDocument` versions |
| OD-05 | Fee refund policy (withdrawal, cancellation) | Refunds only by FINANCE_MANAGER on request; Competition cancellation creates refund tasks | Refund flow (§3.6) |
| OD-06 | 80G receipt details | 80G section hidden until `org.80g` is set | `Setting org.80g` |
| OD-07 | Donations from abroad / foreign currency | INR only; Razorpay international payments off | `currency` column, Razorpay config |
| OD-08 | Community forums or comments | None (SG-07) | — |
| OD-09 | Courier API integration for tracking | Manual courier name + tracking number/URL | `trackingUrl` field, courier list setting |
| OD-10 | Posting to social networks via their APIs | Planner + stamped kits, manual posting | `SocialPost.postedUrl`, channel enum |
| OD-11 | Verifiable Guardian consent (DPDP Rules, Rule 10, in force 13 May 2027) | Checkbox (`CHECKBOX_GUARDIAN`) and Coordinator certification | `ConsentMethod.VERIFIED_GUARDIAN` reserved |
| OD-12 | Data retention periods (non-awarded originals, rosters, contact messages) | Keep until a retention rule is configured | `retention.*` settings + retention job stub |
| OD-13 | Malware scanning for document uploads (essays PDF/DOCX, finance docs) | Magic-byte checks + image re-encoding; documents served only as downloads with `Content-Disposition: attachment` | Scan step slot in `asset.process` |

---

## 14. Legacy reference

The previous codebase (React 18 + Vite SPA, Express + Prisma + SQLite API, mock Vercel API) is at tag `legacy-baseline`. Useful for seed ideas and business-rule intent only; its consent defaults (`true`), random identifiers and non-atomic bidding are known bugs this spec fixes.

```bash
git show legacy-baseline:apps/api/prisma/schema.prisma        # old schema
git show legacy-baseline:docs/DATABASE_SCHEMA.md              # old field notes
git show legacy-baseline:apps/api/prisma/seed.ts              # sample data ideas
git ls-tree -r --name-only legacy-baseline                    # list files
git worktree add ../foa-platform-wt-legacy legacy-baseline    # browse it all
```

---

Friends of Animals (FOA) Platform. All rights reserved.
