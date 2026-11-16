# Friends of Animals (FOA) — Database Schema & Data Models

## 1. Relational Entity Overview
The database layer is managed through Prisma ORM with support for PostgreSQL (production) and SQLite (zero-config local development).

```
   [User] ──< [SchoolMembership] >── [School]
     │                                    │
     ├──< [ParticipantProfile]            └──< [CompetitionRegistration]
     │          │                                      │
     │          └──< [Submission] >────────────────────┘
     │                    │
     │                    ├──< [SubmissionAsset]
     │                    ├──< [Review] >── [User(Judge)]
     │                    ├──< [PhysicalArtworkTracking]
     │                    ├──< [Certificate]
     │                    └──< [AuctionListing] >── [Bid]
     │
     └──< [AuditLog]
```

## 2. Core Entities & Attributes

### `User`
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `passwordHash`: String (Argon2 / bcrypt)
- `fullName`: String
- `phone`: String? (Nullable, private)
- `role`: Enum (`SUPER_ADMIN`, `FOA_ADMIN`, `COMPETITION_MANAGER`, `JUDGE`, `SCHOOL_COORDINATOR`, `TEACHER`, `PARTICIPANT`, `DONOR`, `PUBLIC`)
- `status`: Enum (`ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`)
- `createdAt`, `updatedAt`: Timestamps

### `School`
- `id`: UUID (Primary Key)
- `code`: String (Unique, e.g. `SCH-DEL-2026-001`)
- `name`: String
- `addressLine1`, `city`, `state`, `postalCode`, `country`: Strings
- `principalName`, `principalEmail`, `principalPhone`: Strings
- `authorizedPersonName`, `authorizedPersonEmail`, `authorizedPersonPhone`: Strings
- `verificationStatus`: Enum (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`)
- `verificationNotes`: String?
- `verifiedAt`: DateTime?
- `createdAt`, `updatedAt`: Timestamps

### `Competition`
- `id`: UUID (Primary Key)
- `slug`: String (Unique)
- `title`: String
- `description`: Text
- `animalWelfareTheme`: String
- `competitionType`: Enum (`DRAWING`, `PAINTING`, `ART_CRAFT`, `ESSAY`, `PHOTOGRAPHY`, `VIDEOGRAPHY`)
- `coverImageUrl`: String?
- `eligibilityRules`: Text?
- `rules`: Text?
- `judgingCriteria`: Json (Scoring weights)
- `status`: Enum (`DRAFT`, `UPCOMING`, `REGISTRATION_OPEN`, `ACTIVE`, `SUBMISSIONS_CLOSED`, `JUDGING`, `COMPLETED`, `ARCHIVED`)
- `allowIndividualParticipation`: Boolean (Default: true)
- `allowSchoolParticipation`: Boolean (Default: true)
- `schoolShortlistLimit`: Int (Default: 5)
- `physicalArtworkRequired`: Enum (`NOT_REQUIRED`, `OPTIONAL`, `TOP_SHORTLISTED_ONLY`, `ALL_WINNERS`)
- `prizes`: Text?
- `regStartDate`, `regEndDate`: DateTime
- `submissionStartDate`, `submissionEndDate`: DateTime
- `resultsAnnouncedDate`: DateTime?
- `createdAt`, `updatedAt`: Timestamps

### `Submission`
- `id`: UUID (Primary Key)
- `submissionNumber`: String (Unique, e.g. `FOA-2026-SUB-0142`)
- `competitionId`: UUID (FK -> Competition)
- `participantId`: UUID (FK -> User)
- `schoolId`: UUID? (FK -> School, nullable for independent entrants)
- `category`: String (e.g. `Group A (Grades 1-4)`)
- `title`: String
- `description`: Text?
- `artistStatement`: Text? (The message/story of animal compassion)
- `status`: Enum (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED_BY_SCHOOL`, `FOA_SHORTLISTED`, `CORRECTION_REQUESTED`, `APPROVED`, `REJECTED`)
- `schoolRank`: Int? (e.g. 1st, 2nd, 3rd within school)
- `finalRank`: String? (e.g. `National 1st`, `State Gold`, `Merit`)
- `parentConsentOnRecord`: Boolean (Default: false)
- `publicDisplayAllowed`: Boolean (Default: false)
- `auctionAllowed`: Boolean (Default: false)
- `reviewNotes`: Text?
- `createdAt`, `updatedAt`: Timestamps

### `SubmissionAsset`
- `id`: UUID (Primary Key)
- `submissionId`: UUID (FK -> Submission)
- `assetType`: Enum (`ORIGINAL_PRIVATE`, `WATERMARKED_PREVIEW`, `THUMBNAIL`)
- `fileKey`: String
- `fileUrl`: String
- `mimeType`: String
- `fileSizeBytes`: Int
- `createdAt`: DateTime

### `PhysicalArtworkTracking`
- `id`: UUID (Primary Key)
- `submissionId`: UUID (Unique FK -> Submission)
- `status`: Enum (`NOT_REQUIRED`, `AWAITING_SELECTION`, `REQUESTED`, `AWAITING_DISPATCH`, `DISPATCHED`, `RECEIVED_BY_FOA`, `VERIFICATION_IN_PROGRESS`, `VERIFIED`, `RETURNED`)
- `courierService`: String?
- `trackingNumber`: String?
- `dispatchedAt`: DateTime?
- `receivedAt`: DateTime?
- `verifiedAt`: DateTime?
- `physicalCondition`: String?
- `verificationNotes`: Text?
- `createdAt`, `updatedAt`: Timestamps

### `Certificate`
- `id`: UUID (Primary Key)
- `certificateNumber`: String (Unique, e.g. `FOA-CERT-2026-78901`)
- `submissionId`: UUID? (FK -> Submission)
- `userId`: UUID (FK -> User)
- `competitionId`: UUID (FK -> Competition)
- `recipientName`: String
- `type`: Enum (`PARTICIPATION`, `SCHOOL_MERIT`, `FINALIST`, `WINNER`, `RUNNER_UP`, `SPECIAL_MENTION`, `TEACHER_COORDINATOR`)
- `category`: String?
- `awardTitle`: String
- `issueDate`: DateTime
- `verificationQrCode`: String
- `isRevoked`: Boolean (Default: false)
- `createdAt`: DateTime

### `AuctionListing`
- `id`: UUID (Primary Key)
- `submissionId`: UUID (Unique FK -> Submission)
- `title`: String
- `story`: Text
- `startingPrice`: Decimal
- `currentPrice`: Decimal
- `reservePrice`: Decimal?
- `status`: Enum (`UPCOMING`, `ACTIVE`, `EXTENDED`, `CLOSED_SOLD`, `CLOSED_UNSOLD`, `CANCELLED`)
- `startsAt`: DateTime
- `endsAt`: DateTime
- `winningBidderId`: UUID? (FK -> User)
- `winningBidAmount`: Decimal?
- `createdAt`, `updatedAt`: Timestamps

### `Bid`
- `id`: UUID (Primary Key)
- `auctionId`: UUID (FK -> AuctionListing)
- `bidderId`: UUID (FK -> User)
- `amount`: Decimal
- `isWinning`: Boolean (Default: false)
- `createdAt`: DateTime

### `Donation`
- `id`: UUID (Primary Key)
- `transactionReference`: String (Unique)
- `donorId`: UUID? (FK -> User, nullable for guest)
- `donorName`: String
- `donorEmail`: String
- `donorPhone`: String?
- `amount`: Decimal
- `currency`: String (Default: `INR`)
- `purpose`: String (e.g. `Animal Medical Rescue Fund`, `School Outreach`)
- `status`: Enum (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`)
- `isAnonymous`: Boolean (Default: false)
- `createdAt`: DateTime

### `AuditLog`
- `id`: UUID (Primary Key)
- `userId`: UUID? (FK -> User)
- `action`: String (e.g. `COMPETITION_PUBLISHED`, `SCHOOL_VERIFIED`, `SUBMISSION_APPROVED`)
- `entityType`: String
- `entityId`: String
- `details`: Json
- `ipAddress`: String?
- `createdAt`: DateTime
