# Enhanced Job Posting and Application System

## Overview

This system implements a complete job posting and application workflow with highlighted jobs, real-time notifications, and proper data consistency across MongoDB collections.

## System Architecture

### 1. Job Posting Flow
```
Employer Posts Job → Job Saved in DB → Job Highlighted = true → Student Sees Highlighted Job → Student Applies → Employer Notified → Both Dashboards Update
```

### 2. Application Decision Flow
```
Employer Reviews Application → Approves/Rejects → Student Notified → Application Status Updated → Data Consistency Maintained
```

## Database Models

### Job Model (`backend/src/models/Job.ts`)
```typescript
interface IJob {
  jobId: mongoose.Types.ObjectId;        // Auto-generated ID
  employerId: mongoose.Types.ObjectId;    // Reference to employer
  title: string;                          // Job title
  description: string;                    // Job description
  salary: string;                         // Display salary (e.g., "₹15,000/month")
  status: 'active' | 'paused' | 'closed' | 'expired' | 'pending';
  highlighted: boolean;                   // For first 24 hours or until student sees it
  createdAt: Date;                       // When job was posted
  
  // Additional fields for enhanced functionality
  company: string;
  businessType: string;
  location: string;
  // ... more fields
}
```

### Application Model (`backend/src/models/Application.ts`)
```typescript
interface IApplication {
  applicationId: mongoose.Types.ObjectId; // Auto-generated ID
  jobId: mongoose.Types.ObjectId;         // Reference to job
  studentId: mongoose.Types.ObjectId;     // Reference to student
  status: 'applied' | 'accepted' | 'rejected'; // Simplified status
  appliedAt: Date;                        // When student applied
  
  // Additional fields for enhanced functionality
  coverLetter?: string;
  expectedPay?: number;
  availability?: string;
  // ... more fields
}
```

## API Endpoints

### Enhanced Job Routes (`/api/enhanced-jobs`)

#### 1. Employer Posts Job
```http
POST /api/enhanced-jobs
Authorization: Bearer <employer_token>
Content-Type: application/json

{
  "title": "Frontend Developer Intern",
  "description": "We are looking for a talented frontend developer...",
  "salary": "₹15,000/month",
  "company": "Tech Corp",
  "location": "Bangalore",
  "businessType": "Tech Company",
  "jobType": "Tech Support",
  "pay": 15000,
  "payType": "monthly",
  "timing": "Flexible",
  "positions": 2,
  "requirements": "Knowledge of React, JavaScript...",
  "benefits": "Flexible working hours...",
  "contactEmail": "employer@techcorp.com",
  "skills": ["React", "JavaScript", "HTML", "CSS"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "job_id",
      "jobId": "job_id",
      "employerId": "employer_id",
      "title": "Frontend Developer Intern",
      "description": "We are looking for...",
      "salary": "₹15,000/month",
      "status": "active",
      "highlighted": true,
      "createdAt": "2025-01-12T10:00:00.000Z",
      "company": "Tech Corp",
      "location": "Bangalore"
    }
  },
  "message": "Job posted successfully"
}
```

#### 2. Student Dashboard (Highlighted Jobs)
```http
GET /api/enhanced-jobs/student-dashboard?showHighlighted=true
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "job_id",
        "title": "Frontend Developer Intern",
        "company": "Tech Corp",
        "location": "Bangalore",
        "salary": "₹15,000/month",
        "highlighted": true,
        "createdAt": "2025-01-12T10:00:00.000Z",
        "employerId": {
          "name": "Tech Corp",
          "email": "employer@techcorp.com",
          "companyName": "Tech Corp"
        }
      }
    ],
    "appliedJobs": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  },
  "message": "Student dashboard jobs retrieved successfully"
}
```

#### 3. Student Applies for Job
```http
POST /api/enhanced-jobs/:jobId/apply
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "coverLetter": "I am very interested in this position...",
  "expectedPay": 15000,
  "availability": "flexible"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "application_id",
      "applicationId": "application_id",
      "jobId": "job_id",
      "studentId": "student_id",
      "status": "applied",
      "appliedAt": "2025-01-12T10:30:00.000Z",
      "coverLetter": "I am very interested...",
      "expectedPay": 15000,
      "availability": "flexible"
    }
  },
  "message": "Application submitted successfully"
}
```

#### 4. Employer Dashboard (Applications)
```http
GET /api/enhanced-jobs/employer-dashboard
Authorization: Bearer <employer_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "job_id",
        "title": "Frontend Developer Intern",
        "company": "Tech Corp",
        "status": "active",
        "highlighted": false,
        "applications": 1
      }
    ],
    "applications": [
      {
        "_id": "application_id",
        "jobId": "job_id",
        "studentId": {
          "name": "John Student",
          "email": "john@student.com",
          "phone": "9876543211",
          "college": "IIT Bangalore",
          "skills": ["JavaScript", "React", "Node.js"]
        },
        "status": "applied",
        "appliedAt": "2025-01-12T10:30:00.000Z",
        "coverLetter": "I am very interested..."
      }
    ]
  },
  "message": "Employer dashboard data retrieved successfully"
}
```

#### 5. Employer Approves Application
```http
PATCH /api/enhanced-jobs/applications/:applicationId/approve
Authorization: Bearer <employer_token>
Content-Type: application/json

{
  "notes": "Great candidate! Looking forward to working with you."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "application_id",
      "status": "accepted",
      "shortlistedDate": "2025-01-12T11:00:00.000Z",
      "employerNotes": "Great candidate! Looking forward to working with you.",
      "studentId": {
        "name": "John Student",
        "email": "john@student.com",
        "college": "IIT Bangalore"
      },
      "jobId": {
        "title": "Frontend Developer Intern",
        "company": "Tech Corp"
      }
    }
  },
  "message": "Application approved successfully"
}
```

#### 6. Employer Rejects Application
```http
PATCH /api/enhanced-jobs/applications/:applicationId/reject
Authorization: Bearer <employer_token>
Content-Type: application/json

{
  "reason": "We are looking for someone with more experience in backend technologies."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "_id": "application_id",
      "status": "rejected",
      "rejectedDate": "2025-01-12T11:00:00.000Z",
      "employerNotes": "We are looking for someone with more experience...",
      "studentId": {
        "name": "John Student",
        "email": "john@student.com"
      },
      "jobId": {
        "title": "Backend Developer Intern",
        "company": "Tech Corp"
      }
    }
  },
  "message": "Application rejected successfully"
}
```

### Notification Routes (`/api/notifications`)

#### 1. Application Submitted Notification
```http
POST /api/notifications/application-submitted
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job_id",
  "studentId": "student_id",
  "applicationId": "application_id"
}
```

#### 2. Application Approved Notification
```http
POST /api/notifications/application-approved
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job_id",
  "studentId": "student_id",
  "applicationId": "application_id",
  "employerId": "employer_id"
}
```

#### 3. Application Rejected Notification
```http
POST /api/notifications/application-rejected
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job_id",
  "studentId": "student_id",
  "applicationId": "application_id",
  "employerId": "employer_id",
  "reason": "Rejection reason"
}
```

## Key Features

### 1. Highlighted Jobs
- New jobs are automatically highlighted (`highlighted: true`)
- Highlighted jobs appear prominently in student dashboard
- Highlighted status is removed when student applies or views the job
- Jobs remain highlighted for 24 hours or until student interaction

### 2. Real-time Notifications
- Employers receive notifications when students apply
- Students receive notifications when applications are approved/rejected
- Notifications include relevant job and user details
- Console logging for debugging (can be extended to email/push notifications)

### 3. Data Consistency
- All collections properly linked by IDs (jobId, studentId, employerId, applicationId)
- Application counts updated in job documents
- Status changes tracked with timestamps
- Unique constraints prevent duplicate applications

### 4. Status Management
- Applications have simplified status: `applied`, `accepted`, `rejected`
- Status changes trigger appropriate notifications
- Timestamps recorded for all status changes
- Employer notes stored with decisions

## Testing

Run the comprehensive test script:
```bash
cd backend
node test-enhanced-job-system.js
```

This test script demonstrates:
1. ✅ Employer posts job with highlighted = true
2. ✅ Student sees highlighted job in dashboard
3. ✅ Student applies for job
4. ✅ Employer receives notification
5. ✅ Employer approves application
6. ✅ Student receives approval notification
7. ✅ Employer rejects another application
8. ✅ Student receives rejection notification
9. ✅ Data consistency maintained across collections
10. ✅ All IDs properly linked

## Database Indexes

### Job Collection
- `{ jobId: 1 }` - Unique index for job ID
- `{ employerId: 1 }` - Index for employer queries
- `{ status: 1, highlighted: 1 }` - Compound index for dashboard queries
- `{ createdAt: -1 }` - Index for sorting by creation date

### Application Collection
- `{ jobId: 1, studentId: 1 }` - Unique compound index (prevents duplicate applications)
- `{ studentId: 1, status: 1 }` - Index for student application queries
- `{ employer: 1, status: 1 }` - Index for employer application queries
- `{ appliedAt: -1 }` - Index for sorting by application date

## Error Handling

The system includes comprehensive error handling:
- Validation errors for required fields
- Authorization checks for all protected routes
- Duplicate application prevention
- Invalid ID validation
- Proper HTTP status codes and error messages

## Security Features

- JWT token authentication for all protected routes
- Role-based access control (employer, student, admin)
- Input validation and sanitization
- Authorization checks for job ownership
- Rate limiting (can be added)

## Future Enhancements

1. **Email Notifications**: Integrate with email service for real notifications
2. **Push Notifications**: Add mobile push notifications
3. **Real-time Updates**: WebSocket integration for live updates
4. **Advanced Filtering**: More sophisticated job search and filtering
5. **Analytics**: Job performance metrics and analytics
6. **Bulk Operations**: Bulk application management for employers
7. **File Uploads**: Resume and document upload functionality
8. **Interview Scheduling**: Built-in interview scheduling system

## Conclusion

This enhanced job posting and application system provides a complete workflow from job posting to application management, with proper data consistency, real-time notifications, and a user-friendly API. The system is designed to be scalable and maintainable, with clear separation of concerns and comprehensive error handling.
