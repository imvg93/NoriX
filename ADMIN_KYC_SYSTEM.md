# Admin KYC Management System

## Overview

This system provides a comprehensive admin dashboard for managing student KYC (Know Your Customer) submissions with secure authentication and modern UI/UX.

## Features Implemented

### 🔐 Admin Email Authentication

- **Restricted Access**: Only `admin@studentjobs.com` can log in as admin
- **Secure Login**: Password-based authentication with JWT tokens
- **Access Control**: All other email addresses are denied admin access
- **Session Management**: Automatic token validation and session handling

### 📊 Student KYC Management Dashboard

- **Real-time Data**: Live KYC submissions from MongoDB
- **Status Tracking**: Pending, Approved, Rejected status management
- **Document Review**: View uploaded Aadhaar cards and College ID cards
- **Student Details**: Complete student information display

### 🎯 Action Buttons

- **Accept**: Approve KYC submissions with admin tracking
- **Reject**: Reject submissions with reason tracking
- **Pending**: View submissions awaiting review
- **View Details**: Comprehensive student information modal

### 🎨 Modern UI/UX

- **Smooth Animations**: Framer Motion animations throughout
- **Professional Design**: Clean, modern interface
- **Responsive Layout**: Works on all device sizes
- **Interactive Elements**: Hover effects and transitions

## Admin Login Credentials

```
Email: admin@studentjobs.com
Password: admin123456
```

## Setup Instructions

### 1. Create Admin User

Run the admin user creation script:

```bash
cd backend
node create-admin-user.js
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

### 4. Access Admin Dashboard

Navigate to: `http://localhost:3000/admin-login`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login (restricted to admin@studentjobs.com)
- `GET /api/auth/profile` - Get admin profile

### KYC Management
- `GET /api/admin/kyc` - Get all KYC submissions
- `GET /api/admin/kyc/:id` - Get specific KYC details
- `PUT /api/admin/kyc/:id/approve` - Approve KYC submission
- `PUT /api/admin/kyc/:id/reject` - Reject KYC submission
- `GET /api/admin/kyc/stats` - Get KYC statistics

## Database Schema

### KYC Document Structure
```javascript
{
  userId: ObjectId,
  fullName: String,
  email: String,
  phone: String,
  college: String,
  courseYear: String,
  address: String,
  emergencyContact: {
    name: String,
    phone: String
  },
  aadharCard: String, // Cloudinary URL
  collegeIdCard: String, // Cloudinary URL
  verificationStatus: 'pending' | 'approved' | 'rejected',
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String
}
```

## Security Features

1. **Email Restriction**: Only specific admin email allowed
2. **JWT Authentication**: Secure token-based authentication
3. **Password Hashing**: bcrypt encryption for passwords
4. **Input Validation**: Comprehensive request validation
5. **Error Handling**: Secure error responses

## UI Components

### Admin Login Page
- Modern gradient background with animated blobs
- Secure password input with show/hide toggle
- Real-time form validation
- Loading states and error handling

### Admin Dashboard
- Tabbed interface for different sections
- Real-time statistics cards
- Interactive data tables
- Modal dialogs for detailed views
- Action buttons with confirmation dialogs

### KYC Management
- Status-based filtering
- Document preview links
- Bulk action capabilities
- Detailed student information display
- Approval/rejection workflow

## File Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts (updated with admin restrictions)
│   │   └── admin.ts (KYC management endpoints)
│   ├── models/
│   │   ├── User.ts (admin user model)
│   │   └── KYC.ts (KYC document model)
│   └── middleware/
│       └── auth.ts (authentication middleware)
├── create-admin-user.js (admin user creation script)
└── package.json

frontend/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx (admin dashboard)
│   │   └── admin-login/
│   │       └── page.tsx (admin login page)
│   └── services/
│       └── api.ts (API service with admin endpoints)
└── package.json
```

## Testing

### Test Admin Login
1. Navigate to `/admin-login`
2. Use credentials: `admin@studentjobs.com` / `admin123456`
3. Verify successful login and redirect to dashboard

### Test KYC Management
1. Submit a student KYC form
2. Check admin dashboard for new submission
3. Test approve/reject functionality
4. Verify status updates

## Troubleshooting

### Common Issues

1. **Admin Login Fails**
   - Verify admin user exists in database
   - Check email is exactly `admin@studentjobs.com`
   - Ensure password is `admin123456`

2. **KYC Not Showing**
   - Check MongoDB connection
   - Verify KYC documents are being saved
   - Check API endpoints are working

3. **Permission Denied**
   - Verify JWT token is valid
   - Check user has admin role
   - Ensure proper authentication headers

## Future Enhancements

- [ ] Email notifications for KYC status changes
- [ ] Bulk approval/rejection actions
- [ ] Advanced filtering and search
- [ ] Export functionality for reports
- [ ] Audit trail for admin actions
- [ ] Multi-admin support with role-based permissions

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test API endpoints with tools like Postman
5. Check browser developer tools for frontend errors
