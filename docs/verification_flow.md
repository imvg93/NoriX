## NORIX Verification Flow (Scaffold)

This document summarizes the verification experience for students and the admin review workflow.

### Student Flow
- Step 1: ID Upload (image/PDF ≤10MB). Client pre-validates type/size and computes SHA256.
- Step 2: Short Video (≤50MB, ~30–60 sec). Webcam capture or file upload.
- Step 3: Status & Trial. Shows timeline, auto-check scores, admin notes, rejection code, and trial request.

Key UX:
- Progressive steps; next step unlocks after the previous.
- Optimistic UI with preview.
- Resumable upload TODO (tus or chunked).
- One free resubmission within 14 days (policy to be enforced in backend rules).

### Admin Flow
- Admin dashboard lists pending students with previews and auto-check scores.
- Modal shows ID, video, OCR text (TODO), and duplicate warnings (TODO).
- Actions: Approve, Reject (with code/notes), Require Trial.
- Every action writes to `verification_logs`.

### API Endpoints
- Student:
  - POST `/api/verification/upload-id`
  - POST `/api/verification/upload-video`
  - GET `/api/verification/status`
  - POST `/api/verification/request-trial`
  - POST `/api/verification/trial-result/:studentId` (employer)
  - POST `/api/verification/auto-check/:studentId` (admin/internal)
- Admin:
  - PATCH `/api/admin/verification/:studentId` (approve/reject/require_trial)
  - GET `/api/admin/verification/pending`

All responses follow `{ success, data, message, statusCode }` via shared helpers.

### Data Model Additions
`Student`:
- `id_doc_url`, `id_doc_hash`, `id_submitted_at`
- `video_url`, `video_submitted_at`
- `verified` (boolean, indexed)
- `trial_shift_status` enum
- `rejection_code`, `admin_notes`
- `auto_checks`: `{ ocr_confidence, face_match_score, duplicate_flag, last_checked_at }`
- `last_reviewed_by`, `last_reviewed_at`
- `verification_history[]`

`VerificationLog`:
```json
{ "studentId": ObjectId, "adminId": ObjectId|null, "action": "approve|reject|require_trial|auto_check|upload_id|upload_video|request_trial|trial_result", "code": "string", "details": "any", "timestamp": "Date" }
```

### Real-time Updates
- Socket.IO broadcasts:
  - To admins: `verification:pending`, `verification:updated`, `verification:trial_result`
  - To student: `verification:update`
- Fallback: client polling every 15s (hook can be extended).

### Storage & Security
- `STORAGE_PROVIDER` = `s3|supabase`. Presigned upload/read URLs. Local dev fallback provided.
- Store `SHA256` of uploaded files for duplicate detection.
- Admin previews use expiring signed URLs.
- Encrypt-at-rest is handled by provider (S3/Supabase).

### Auto-check Worker (Thresholds)
- OCR pass: `≥ 0.8`, flag: `0.6–0.79`, reject: `< 0.6`
- Face match pass: `≥ 0.75`, flag: `0.6–0.74`, fail: `< 0.6`
- Worker scaffolding at `scripts/auto_check_worker.js` (connects to DB, updates `auto_checks`, logs).
  - TODO: Integrate OCR and face-match providers.

### Env Vars
- `STORAGE_PROVIDER`, `STORAGE_BUCKET`
- `OCR_PROVIDER` and keys (optional)
- `FACE_MATCH_PROVIDER` and keys (optional)
- `WS_ENABLED=true|false`
- `MAX_ID_SIZE`, `MAX_VIDEO_SIZE`, `SIGNED_URL_EXPIRY`
- Worker: `AUTO_CHECK_INTERVAL_MS`, `AUTO_CHECK_BATCH_SIZE`, `OCR_PASS_THRESHOLD`, `OCR_FLAG_THRESHOLD`, `FACE_PASS_THRESHOLD`, `FACE_FLAG_THRESHOLD`

### Admin Guidelines
- Start with flags; do not auto-reject based on auto-checks until confidence is proven.
- Trial is optional but recommended; admin can override to verify directly.
- Provide clear, constructive notes and reason codes for rejections.


