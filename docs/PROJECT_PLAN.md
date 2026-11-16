# Friends of Animals (FOA) — Master Project Plan

## 1. Overview & Vision
Friends of Animals (FOA) (`foaglobal.org`) is a nationwide and global social-impact initiative committed to nurturing compassion for animals as a lifelong universal human value, especially among children and young adults. 

FOA engages schools, colleges, teachers, students, independent participants, animal-welfare organizations, rescuers, donors, and auction buyers through:
1. **School & Individual Creative Competitions** (Drawing, Painting, Art/Craft, Essay, Photography, Videography).
2. **Two-Stage Judging Process**:
   - Stage 1: School-level shortlisting (Top 5 / Top 10 evaluated against FOA guidelines).
   - Stage 2: FOA Central Jury evaluation with multi-tiered recognition (All India, Regional, Grades A/B, Gold/Silver/Bronze).
3. **Physical Artwork Courier & Verification Tracking**:
   - Shortlisted and winning physical artworks are dispatched to FOA, verified for condition, authenticity, and parental consent.
4. **Fundraising Art Auctions & Public Showcase**:
   - Verified winning artwork is displayed in a public digital gallery and auctioned with explicit guardian consent to raise funds for animal shelters, mobile clinics, rescue operations, feeding drives, and veterinary care.
5. **Transparency, Donations & Animal-Welfare NGO Directory**:
   - Direct transparent donations, verifiable certificates with QR verification, verified impact metrics, and a directory of animal-welfare organizations and rescuer networks.

---

## 2. Milestones & Implementation Checklist

### Phase 1: Planning, Documentation & Architecture Design
- [x] Extract and analyze FOA Vision, PRD, and Brand Assets.
- [x] Create comprehensive architectural, schema, API, and setup documentation in `docs/`.
- [x] Copy and preserve the authentic FOA Logo (Red, Green, Blue brand tri-color) into project assets.

### Phase 2: Monorepo Foundation & Tooling Setup
- [x] Monorepo structure: `apps/api`, `apps/web`, `packages/shared`, `docs/`.
- [x] TypeScript configuration, ESLint/Prettier, `.env.example`, Docker Compose setup.
- [x] Shared data models, Zod validation schemas, and TypeScript interfaces in `@foa/shared`.

### Phase 3: Backend Database & REST API Core (`apps/api`)
- [x] Express + TypeScript server with modular routes (`/api/v1`).
- [x] Prisma ORM configuration with robust SQLite (local dev) and PostgreSQL (production ready) schema.
- [x] Password hashing with bcrypt, JWT authentication, and HttpOnly cookie session management.
- [x] Role-Based Access Control (RBAC) middleware for all 9 stakeholder roles:
  - `SUPER_ADMIN`, `FOA_ADMIN`, `COMPETITION_MANAGER`, `JUDGE`, `SCHOOL_COORDINATOR`, `TEACHER`, `PARTICIPANT`, `DONOR`, `PUBLIC`.
- [x] Secure seed script with initial administrator, demo schools, competitions, submissions, and auction items.
- [x] Replaceable adapters: Local / S3-compatible file storage, Console / SMTP email notification adapter, Payment adapter.

### Phase 4: Frontend Development (`apps/web`)
- [x] React 18 + Vite + Tailwind CSS + Lucide Icons + TanStack Query.
- [x] Brand identity integration with FOA brand colors:
  - Primary Red (`#E52421`), Emerald Green (`#00A651`), Royal Blue (`#0055A5`), neutral backgrounds (`#F8FAFC`).
- [x] 21 Public Website Routes:
  - `/`, `/about`, `/competitions`, `/competitions/:slug`, `/gallery`, `/gallery/:id`, `/auctions`, `/auctions/:id`, `/donate`, `/animal-welfare`, `/community`, `/volunteer`, `/organizations`, `/impact`, `/events`, `/stories`, `/contact`, `/login`, `/register`, `/privacy`, `/terms`.
- [x] Complete Admin Dashboard (`/admin`):
  - Overview, Competitions Management (Full CRUD, draft, publish, date validation), Schools Review & Verification, Submissions Review & Shortlisting, Physical Artwork Tracking, Judging & Results, Certificates, Auctions, Donations, Audit Logs.
- [x] School Coordinator Dashboard (`/school-dashboard`):
  - Institution profile, student roster, school-level judging & digital upload of shortlisted artwork, dispatch tracking.
- [x] Participant Dashboard (`/participant-dashboard`):
  - Individual registration, student submissions, parental consent, certificate viewing & download.
- [x] Public Certificate Verification (`/verify/:certificateNumber`).

### Phase 5: Verification, Testing & Acceptance
- [x] Automated backend API tests with Vitest & Supertest.
- [x] Frontend test suite and build verification (`tsc` & `vite build`).
- [x] End-to-end user journey acceptance verification:
  - Admin competition creation, publishing -> public visibility -> school registration & approval -> student submission -> review -> certificate generation.
