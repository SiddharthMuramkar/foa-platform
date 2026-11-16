# Friends of Animals (FOA) — API Reference (v1)

Base URL: `/api/v1`
Authentication: Bearer Token in `Authorization` header OR HttpOnly Cookie `foa_token`.

All responses follow standard JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```
Errors return:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error description",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication (`/auth`)
- `POST /api/v1/auth/register` — Register a new user (Participant, School Coordinator, Judge, Donor)
- `POST /api/v1/auth/login` — Login with email & password, sets HttpOnly cookie & returns user object
- `POST /api/v1/auth/logout` — Invalidate session and clear cookie
- `GET /api/v1/auth/me` — Return currently authenticated user profile & active role permissions

---

## 2. Competitions (`/competitions`)
- `GET /api/v1/competitions` — Public list of published competitions (supports filters: `status`, `type`)
- `GET /api/v1/competitions/:slugOrId` — Public details of a competition
- `POST /api/v1/competitions` — [Admin] Create competition (Draft)
- `PATCH /api/v1/competitions/:id` — [Admin] Edit competition fields
- `POST /api/v1/competitions/:id/publish` — [Admin] Validate dates & publish to public website
- `POST /api/v1/competitions/:id/archive` — [Admin] Archive competition
- `GET /api/v1/competitions/:id/submissions` — [Admin/Coordinator] List submissions under this competition

---

## 3. Schools (`/schools`)
- `POST /api/v1/schools` — Register a new school/institution
- `GET /api/v1/schools` — [Admin] List schools with status filter (`PENDING`, `VERIFIED`, etc.)
- `GET /api/v1/schools/:id` — Get school profile details
- `POST /api/v1/schools/:id/approve` — [Admin] Verify and approve school registration
- `POST /api/v1/schools/:id/reject` — [Admin] Reject school registration with reason notes
- `GET /api/v1/schools/:id/submissions` — [Coordinator/Admin] Submissions associated with this school

---

## 4. Submissions & Artwork (`/submissions`)
- `POST /api/v1/submissions` — Create digital artwork entry (school-level shortlisted or individual)
- `GET /api/v1/submissions/:id` — Get submission details (access-controlled)
- `POST /api/v1/submissions/:id/review` — [Admin/Judge] Submit review, score, feedback
- `POST /api/v1/submissions/:id/approve` — [Admin] Approve submission
- `POST /api/v1/submissions/:id/shortlist` — [Admin/Coordinator] Shortlist submission
- `GET /api/v1/gallery` — Public gallery of approved artworks with guardian consent

---

## 5. Physical Artwork Tracking (`/physical-tracking`)
- `GET /api/v1/physical-tracking` — [Admin] List tracking entries
- `PATCH /api/v1/physical-tracking/:id/dispatch` — [Coordinator] Update courier name & tracking reference
- `PATCH /api/v1/physical-tracking/:id/receive` — [Admin] Acknowledge receipt at FOA facility
- `PATCH /api/v1/physical-tracking/:id/verify` — [Admin] Record physical condition inspection & verification

---

## 6. Certificates (`/certificates`)
- `GET /api/v1/certificates/my-certificates` — Get certificates for current logged-in participant
- `GET /api/v1/certificates/verify/:certificateNumber` — Public endpoint to verify certificate authenticity
- `POST /api/v1/certificates/issue` — [Admin] Batch issue certificates for competition finalists/participants

---

## 7. Auctions & Donations (`/auctions`, `/donations`)
- `GET /api/v1/auctions` — Public list of active artwork auctions
- `GET /api/v1/auctions/:id` — Detail of an auction listing
- `POST /api/v1/auctions/:id/bid` — [Authenticated Buyer] Place validated bid
- `POST /api/v1/donations` — Initiate donation record (integrated with payment adapter)
- `GET /api/v1/donations/transparency` — Public summary of funds raised & deployed

---

## 8. Admin Overview & Audit (`/admin`)
- `GET /api/v1/admin/overview` — Dashboard KPI counts (real DB aggregations)
- `GET /api/v1/admin/users` — List and filter platform users
- `PATCH /api/v1/admin/users/:id/role` — Update user role or status
- `GET /api/v1/admin/audit-logs` — Chronological security audit logs
