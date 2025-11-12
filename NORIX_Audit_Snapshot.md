# 🔍 Overview
- **Tech Stack:** [TBD: MERN / Supabase specifics]
- **Hosting:** [TBD]
- **Authentication:** [TBD: JWT / Supabase Auth / OAuth]
- **User Roles:** Student, Recruiter, Admin
- **Current Version Tag:** [TBD]

## 🧭 Frontend Pages / Routes
| Route / Path | Description | Role Access | Status |
| --- | --- | --- | --- |
| `/` | [TBD: Landing/Home] | Public | ✅ Verified |
| `/jobs` | [TBD: Job listings] | Student, Recruiter | [TBD] |
| `/jobs/:id` | [TBD: Job details] | Student | [TBD] |
| `/dashboard` | [TBD: Recruiter dashboard] | Recruiter | [TBD] |
| `/admin` | [TBD: Admin overview] | Admin | [TBD] |
| `/profile` | [TBD: User profile] | Student, Recruiter | [TBD] |

## ⚙️ API Endpoints
| Method | Endpoint | Purpose | Auth Required | Status |
| --- | --- | --- | --- | --- |
| GET | `/api/jobs` | Fetch all jobs | ✅ | ✅ Verified |
| POST | `/api/jobs` | Create job post | Recruiter | [TBD] |
| GET | `/api/jobs/:id` | Job detail | ✅ | [TBD] |
| POST | `/api/applications` | Submit application | Student | [TBD] |
| GET | `/api/applications` | List applications | Recruiter, Admin | [TBD] |
| POST | `/api/verify` | Trigger verification | Admin | [TBD] |

## 🗃️ Database Tables / Collections
| Table / Collection | Key Fields | Indexes | Notes |
| --- | --- | --- | --- |
| `users` | `role`, `status`, `email` | [TBD] | [TBD] |
| `jobs` | `title`, `employerId`, `status` | [TBD] | [TBD] |
| `applications` | `jobId`, `studentId`, `state` | [TBD] | [TBD] |
| `verifications` | `targetId`, `type`, `result` | [TBD] | [TBD] |
| [TBD] | [TBD] | [TBD] | [TBD] |

## 🚀 Job Flow Summary
- [ ] Student browses jobs (`GET /api/jobs`)
- [ ] Student views detailed listing (`GET /api/jobs/:id`)
- [ ] Student submits application (`POST /api/applications`)
- [ ] Recruiter reviews applications (`GET /api/applications`)
- [ ] Recruiter updates status (`PATCH /api/applications/:id`) [TBD]
- [ ] Notifications dispatched [TBD]

## 🛡️ Verification Flow
1. [TBD: Trigger event]
2. [TBD: Data collection]
3. [TBD: Admin review]
4. [TBD: Outcome logging]
5. ✅ Current checkpoint stored in `verifications`

## 💾 Backups Taken
| Date | Scope | Location | Integrity Check |
| --- | --- | --- | --- |
| [TBD] | Database | [TBD] | [ ] Pending |
| [TBD] | Backend | [TBD] | [ ] Pending |
| [TBD] | Frontend | [TBD] | [ ] Pending |
| [TBD] | Assets | [TBD] | [ ] Pending |

## 🔄 Next Steps
- [ ] Confirm environment parity (dev/staging/prod)
- [ ] Document auth providers and secrets rotation plan
- [ ] Validate API contracts with integration tests
- [ ] Capture UX screenshots for mobile & desktop baselines
- [ ] Schedule verification workflow dry run

## ⚠️ Notes & Risks
- **Dependency drift:** [TBD]
- **Role-based access gaps:** [TBD]
- **Data retention policies:** [TBD]
- **Monitoring / alerting coverage:** [TBD]
