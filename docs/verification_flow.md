## NORIX Verification Center (Student + Admin) — Implementation Guide

This document describes the end‑to‑end Verification Center for students, the Admin Dashboard integration, backend APIs, realtime updates, auto-check worker, data model changes, storage, migrations, and testing. It is designed for a MERN stack using Next.js, Express, MongoDB, and S3 or Supabase Storage.


### TL;DR
- **Flow**: Student uploads ID → records short video → Admin review → optional Trial Shift → Verified/Rejected.
- **UX**: Progressive steps, resumable uploads, optimistic feedback, resume later, friendly microcopy.
- **Admin**: See pending queue, preview ID/video via expiring URLs, run/see auto-checks, approve/reject/require trial, action logs.
- **Realtime**: WebSocket/SSE notifies students instantly of admin actions.
- **Security**: Presigned upload and preview URLs, SHA256 hashing, role checks, logging.


## Architecture Overview
- **Frontend (Next.js, Tailwind)**
  - `pages/verification/index.tsx`: 3-step student UI (+ timeline).
  - `components/VerificationStepper.tsx`: accessible stepper with % progress.
  - `components/FileUploader.tsx`: MIME/size validation, SHA256, resumable uploads (tus/chunked >10MB).
  - `hooks/useVerification.ts`: API wrapper, state machine, realtime (WS/SSE) subscriptions.
- **Backend (Express)**
  - `routes/verification.js`: student endpoints (upload ID, upload video, status, request trial, auto-check hook, trial result).
  - `routes/admin/verification.js`: admin moderation endpoints and pending list.
  - `models/VerificationLog.js`: append-only audit of actions and auto-check results.
  - Storage provider abstraction (S3 or Supabase) with presigned upload/download.
- **DB (MongoDB + Mongoose)**
  - Student schema updated with verification fields and `auto_checks` subdoc.
  - `verification_logs` collection for append-only logs.
- **Worker**
  - `scripts/auto_check_worker.js`: runs OCR, face-match, duplicate checks, stores scores/flags.
- **Notifications**
  - In-app via WS/SSE; optional emails (plug-in provider).


## File/Directory Deliverables
- Frontend
  - `pages/verification/index.tsx`
  - `components/VerificationStepper.tsx`
  - `components/FileUploader.tsx`
  - `hooks/useVerification.ts`
  - `pages/admin/verification/index.tsx`
- Backend
  - `routes/verification.js`
  - `routes/admin/verification.js`
  - `models/VerificationLog.js`
  - `scripts/auto_check_worker.js`
  - `scripts/migrate_students_add_verification_fields.js`
- Tests
  - `tests/verification.*.test.js`
- Docs
  - `docs/verification_flow.md` (this file)


## Environment Variables
Set these in your server/client environments as appropriate.

- **Core**
  - `STORAGE_PROVIDER`: `s3` or `supabase`
  - `STORAGE_BUCKET`: bucket or storage bucket name
  - `SIGNED_URL_EXPIRY`: seconds (e.g., `86400` for 24h)
  - `WS_ENABLED`: `true` or `false`
  - `MAX_ID_SIZE`: bytes (default `10485760` → 10MB)
  - `MAX_VIDEO_SIZE`: bytes (default `52428800` → 50MB)
- **AWS S3 (if STORAGE_PROVIDER=s3)**
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_ENDPOINT` (optional, for S3-compatible)
- **Supabase (if STORAGE_PROVIDER=supabase)**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Auto-check Providers (optional)**
  - `OCR_PROVIDER` and keys (e.g., `GOOGLE_APPLICATION_CREDENTIALS`, or Rekognition keys)
  - `FACE_MATCH_PROVIDER` and keys
- **App/Auth (existing)**
  - JWT/session secrets, DB URL, etc. (assumed already present)

Example `.env` snippet (server):

```bash
STORAGE_PROVIDER=s3
STORAGE_BUCKET=norix-uploads
SIGNED_URL_EXPIRY=86400
WS_ENABLED=true
MAX_ID_SIZE=10485760
MAX_VIDEO_SIZE=52428800
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
OCR_PROVIDER=disabled
FACE_MATCH_PROVIDER=disabled
```


## Data Model Changes
Extend the existing Student schema with:
- **Verification media**
  - `id_doc_url` (string), `id_doc_hash` (string), `id_submitted_at` (Date)
  - `video_url` (string), `video_submitted_at` (Date)
- **Status & review**
  - `verified` (boolean, default `false`)
  - `trial_shift_status` (enum: `none|pending|assigned|passed|failed`, default `none`)
  - `rejection_code` (string), `admin_notes` (string)
  - `auto_checks`: `{ ocr_confidence, face_match_score, duplicate_flag, last_checked_at }`
  - `last_reviewed_by` (ObjectId), `last_reviewed_at` (Date)
  - `verification_history` (array of events for timeline)
  - `auto_flag` (boolean, default `false`)
- **Performance**
  - `reliability_score` (number, default `0`)
  - `total_shifts` (number, default `0`)
  - `no_shows` (number, default `0`)

Indexes:
- `{ verified: 1 }`
- `{ reliability_score: -1 }`
- `{ id_doc_hash: 1 }` (consider `unique` if business permits — set after backfill)
- Optional text index on `admin_notes` for search.

`models/VerificationLog.js`:
- `{ studentId, adminId, action, code, details, timestamp }`
- Actions include: `upload_id`, `upload_video`, `auto_check`, `admin_approve`, `admin_reject`, `require_trial`, `trial_result`, etc.


## Storage & Uploads
- **Presigned upload URLs** for both ID and video.
- **SHA256 hashes** computed client-side for duplicate detection.
- **Resumable uploads** for files > 10MB using tus/chunked strategy.
- **Expiring preview URLs** (24h default) returned for Admin UI thumbnails/players.
- **Encrypt-at-rest** via provider defaults; do not store PII in logs; mask/redact where needed.


## API Contracts (JSON: `{ success, data, error }`)
All endpoints require auth unless noted. Admin endpoints require `admin` role.

- **POST** `/api/verification/upload-id`
  - Body: presigned flow or direct multipart (depending on provider integration)
  - Validates MIME (`image/*`, `application/pdf`), size ≤ `MAX_ID_SIZE`
  - Stores file and `id_doc_hash`, sets `id_doc_url`, `id_submitted_at`
  - Response: `{ status: 'uploaded', id_doc_url, id_doc_hash }`

- **POST** `/api/verification/upload-video`
  - Body: video (webm/mp4); client enforces length and size ≤ `MAX_VIDEO_SIZE`
  - Stores `video_url`, `video_submitted_at`
  - Optionally enqueues auto-check task
  - Response: `{ status: 'uploaded', video_url }`

- **GET** `/api/verification/status`
  - Returns student verification object:
    - `verified, trial_shift_status, auto_checks, last_reviewed_by, last_reviewed_at, rejection_code, admin_notes, verification_history`

- **POST** `/api/verification/request-trial`
  - Creates trial record (implementation-specific), sets `trial_shift_status='pending'`
  - Notifies admins/employers

- **POST** `/api/verification/auto-check/:studentId` (internal/admin)
  - Runs OCR/face-match, updates `auto_checks` and `auto_flag`
  - Logs to `verification_logs`

- **PATCH** `/api/admin/verification/:studentId` (admin-only)
  - Body: `{ action: 'approve'|'reject'|'require_trial', rejection_code?, admin_notes? }`
  - Transitions state accordingly, logs action

- **GET** `/api/admin/verification/pending` (admin-only)
  - Paginated list of pending with presigned preview URLs, auto-check scores, student basics

- **POST** `/api/verification/trial-result/:studentId`
  - Body: `{ rating, attended, notes? }`
  - Recalculates `reliability_score`, updates `trial_shift_status` and `verified` if passed
  - Logs result

Error shape: `{ success: false, error: { code, message, details? } }`


## Realtime Updates
- Use **WebSocket (Socket.io)** or **Server-Sent Events (SSE)**.
- Events to students (names tentative):
  - `verification:status` → `{ status, trial_shift_status, rejection_code, admin_notes }`
  - `verification:autoChecks` → `{ ocr_confidence, face_match_score, duplicate_flag }`
  - `verification:trial` → `{ trial_shift_status }`
- Fallback polling every 15s if WS disabled or unavailable.


## Frontend UX (Student)
- **Step 1: ID Upload**
  - Accepts image/PDF, validates MIME/size, preview, optimistic “processing” state.
  - Computes SHA256; uses presigned upload; saves progress to `localStorage` and server.
- **Step 2: Video Capture**
  - Uses `MediaRecorder` (webm) with file upload fallback; client-side duration limit.
  - Resumable upload if > 10MB; optimistic UI and retry options.
- **Step 3: Status & Trial**
  - Timeline: `Not Started → Pending → Admin Review → Trial Assigned → Verified / Rejected`.
  - Shows admin notes, rejection code, estimated review time (“Usually <24h”).
  - “Request Trial Shift” CTA when eligible.
- **Accessibility**: keyboard friendly, ARIA labels, high-contrast states, micro-animations.


## Admin Dashboard
- Page: `pages/admin/verification/index.tsx`
- Features:
  - Table: Name, Phone, College, ID Preview (thumbnail), Video Preview (play), OCR Conf, Face Score, Submitted At, Actions.
  - Modal: Large ID viewer, video player, OCR extracted text, duplicate warnings, quick actions with reason presets.
  - Filters by status/rejection code/date, pagination, search.
  - Only accessible to users with `admin` role.


## Auto-check Worker
- File: `scripts/auto_check_worker.js`
- Queue: Bull or simple DB queue (swappable).
- For each student:
  - OCR on ID → `ocr_confidence` and extracted text.
  - Extract ID photo and match with video thumbnail → `face_match_score`.
  - Duplicate detection on `id_doc_hash` (and optionally `face_hash`) across students.
  - Set `auto_flag` if any thresholds fail.
- Threshold defaults:
  - OCR: `≥0.8` pass, `0.6–0.79` flag, `<0.6` reject candidate (do not auto-reject; flag).
  - Face: `≥0.75` pass, `0.6–0.74` flag, `<0.6` fail candidate (flag).


## Notifications
- On student uploads → in-dashboard notification + optional email to admins.
- On admin decision → WS/SSE to student + optional email.
- On trial result → notify student with outcome and next steps.


## State Machine (High-level)
- Student status transitions:
  - `not_started` → `pending_uploads` → `pending_review` → (`require_trial` → `trial_pending|trial_assigned|trial_passed|trial_failed`) → `verified|rejected`
- Always log transitions to `verification_logs`.


## Security
- All admin routes gated by role middleware.
- Use presigned URLs for uploads and previews; short expiries.
- Store and compare SHA256 hashes for duplicates.
- Redact/mask sensitive fields from logs when not essential.
- Encrypt at rest via provider defaults; use TLS in transit.


## Migration
- Script: `scripts/migrate_students_add_verification_fields.js`
- Adds new fields with defaults:
  - `verified=false, reliability_score=0, total_shifts=0, no_shows=0`
- Creates indexes (`verified`, `reliability_score`, `id_doc_hash`).
- Optional: backfill `id_doc_hash` if historical files are accessible (otherwise leave null).

Run (example):

```bash
node scripts/migrate_students_add_verification_fields.js
```


## Testing
- Unit (Jest):
  - Model validations, reliability score computation.
- Integration (Jest + Supertest):
  - Upload endpoints (ID/video), status, admin approve/reject/require_trial.
- E2E (Playwright/Cypress or Supertest orchestration):
  - Full flow: upload ID → upload video → admin approve/require_trial → trial result → verified.
- Accessibility:
  - Keyboard navigation, labels, focus order for `pages/verification/index.tsx`.

Example commands:

```bash
# Backend tests
npm run test:server

# Frontend tests (if configured)
npm run test:client
```


## Local Development
1) Setup env vars (see above).
2) Start services:

```bash
# Backend
npm run dev:server

# Frontend (Next.js)
npm run dev:client

# Worker
npm run worker:auto-check
```

3) Sign in as a student, visit `/verification` and complete steps.
4) Sign in as admin, visit `/admin/verification` to review.


## Acceptance Criteria Checklist
- Student completes ID upload and video without page reloads.
- Admin sees new pending student immediately and can approve/reject/require trial.
- Student sees admin actions in realtime (WS/SSE or 15s polling fallback).
- Trial result updates `reliability_score`; state moves to `verified` if pass.
- Uploads validated for MIME/size; large files use resumable upload.
- All actions recorded in `verification_logs` collection.


## Operational Notes
- Start auto-checks in “flag-only” mode until false-positive rates are known.
- Allow one free resubmission within 14 days; store `rejection_code` and copy hints.
- Trial shift is optional but recommended; admin override allowed.
- Keep admin notes concise and non-sensitive where possible.


## Troubleshooting
- “Uploads fail over 10MB”: ensure tus/chunked enabled and CORS set on storage.
- “No previews in Admin”: check `SIGNED_URL_EXPIRY` and correct bucket/object keys.
- “Realtime not working”: verify `WS_ENABLED=true`; fallback polling should still update.
- “Duplicate hash collisions”: extremely rare; consider adding `face_hash` heuristic.
- “403 on admin routes”: confirm role middleware and JWT/session propagation from frontend.


## TODOs / Integration Points
- Plug in actual OCR and face-match providers; set provider keys and map scores.
- Implement queue (Bull/Redis recommended) for auto-check worker at scale.
- Email provider integration for notifications (e.g., SES, SendGrid, Postmark).
- Video processing/transcoding (optional) for consistent playback in Admin UI.


## Appendix: Suggested Rejection/Flag Codes
- `IMG_BLURRY`, `IMG_CROPPED`, `ID_EXPIRED`, `MISMATCH_FACE`, `LOW_OCR_CONF`, `DUPLICATE_FLAG`, `VIDEO_TOO_SHORT`, `UNSUPPORTED_FORMAT`.


---

Maintainers: Update this document as providers or policies change. Keep thresholds and reason codes versioned to enable consistent moderation outcomes.


