# Friends of Animals (FOA) — Setup & Deployment Guide

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node v20 / v22 / v24)
- npm v9+

### Installation & Initialization
1. Navigate to the project root:
   ```bash
   cd foa-platform
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Initialize database and run migrations with seed data:
   ```bash
   npm run db:init
   npm run db:seed
   ```
5. Start both Backend API and Frontend simultaneously:
   ```bash
   npm run dev
   ```
   - Frontend UI: `http://localhost:5173`
   - Backend REST API: `http://localhost:4000/api/v1`
   - Healthcheck: `http://localhost:4000/api/v1/health`

---

## 2. Default Seed Accounts for Testing

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@foaglobal.org` | `Admin@12345` | `/admin` (Full privileges) |
| **Competition Manager** | `competitions@foaglobal.org` | `Admin@12345` | `/admin` (Competitions, reviews) |
| **School Coordinator** | `coordinator@delhipublic.edu` | `School@12345` | `/school-dashboard` |
| **Teacher** | `art.teacher@delhipublic.edu` | `Teacher@12345` | `/school-dashboard` |
| **Participant / Student** | `aarav.sharma@example.com` | `Student@12345` | `/participant-dashboard` |
| **Judge** | `judge.verma@example.org` | `Judge@12345` | `/admin` (Judging module) |

---

## 3. Running Tests
Run the comprehensive Vitest test suite:
```bash
npm run test
```

## 4. Production Deployment on AWS
- **Frontend**: Deploy static Vite build (`dist`) to Amazon S3 + CloudFront CDN.
- **Backend API**: Package as a Docker image and deploy to AWS ECS (Fargate) or App Runner.
- **Database**: Amazon RDS for PostgreSQL.
- **File Storage**: Set `STORAGE_ADAPTER=s3` and configure AWS S3 bucket credentials.
- **Email Service**: Set `EMAIL_ADAPTER=ses` and verify sender identity in AWS SES.
