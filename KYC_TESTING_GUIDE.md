# KYC Flow Testing Guide

This guide explains how to test the complete, production-grade KYC flow that has been implemented.

## 🚀 Quick Start

### 1. Run Database Migration

First, run the migration script to fix any data inconsistencies and add required indexes:

```bash
# Standard migration
npm run migrate:kyc

# Or with backfill for existing data
npm run migrate:kyc -- --backfill
```

### 2. Start the Servers

```bash
# Backend (with Socket.IO)
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### 3. Test the Flow

1. **Student Registration/Login**: Create or login as a student
2. **KYC Submission**: Complete the KYC form
3. **Admin Review**: Login as admin and approve/reject KYC
4. **Real-time Updates**: Student should see status updates immediately

## 🔧 Manual Testing Checklist

### Student Side Testing

- [ ] **Login Check**: Student sees appropriate KYC status message
- [ ] **Form Display**: KYC form shows for `not_submitted` status
- [ ] **Form Validation**: Required fields are validated
- [ ] **Submission**: KYC submits successfully with `pending` status
- [ ] **Duplicate Prevention**: Cannot submit duplicate KYC
- [ ] **Status Updates**: Real-time status updates via Socket.IO
- [ ] **Resubmission**: Can resubmit after rejection

### Admin Side Testing

- [ ] **Dashboard Access**: Admin can view all KYC submissions
- [ ] **Approval Process**: Can approve KYC with reason
- [ ] **Rejection Process**: Can reject KYC with required reason
- [ ] **Audit Trail**: All actions are logged in audit collection
- [ ] **Real-time Updates**: Admin dashboard updates in real-time

### Security Testing

- [ ] **Authentication**: Only authenticated users can access endpoints
- [ ] **Authorization**: Students cannot access admin endpoints
- [ ] **Data Integrity**: KYC uses authenticated user's email/phone
- [ ] **Atomic Updates**: Database remains consistent during transactions

## 🧪 Automated Testing

### Run Unit Tests

```bash
cd backend
npm test -- --testPathPattern=kyc.test.ts
```

### Run Integration Tests

```bash
cd backend
npm run test:integration
```

### Run End-to-End Tests

```bash
cd backend
npm run test:e2e
```

## 📊 Test Scenarios

### Scenario 1: New Student KYC Flow

1. **Student registers/logs in**
2. **Sees**: "Please complete your KYC details"
3. **Fills KYC form** with all required fields
4. **Submits**: Status becomes `pending`
5. **Admin approves**: Status becomes `approved`, student sees "✅ Your profile is verified"

### Scenario 2: KYC Rejection and Resubmission

1. **Student submits KYC**
2. **Admin rejects** with reason: "Invalid documents"
3. **Student sees**: "❌ Your KYC was rejected. Reason: Invalid documents"
4. **Student can resubmit** with corrected information
5. **Admin approves** the resubmission

### Scenario 3: Real-time Updates

1. **Student submits KYC** (status: `pending`)
2. **Admin approves** in another browser/tab
3. **Student sees immediate update** via Socket.IO
4. **No page refresh required**

### Scenario 4: Data Consistency

1. **Check database** before and after admin actions
2. **Verify**: `users.isVerified` matches `kycDetails.status`
3. **Verify**: Audit entries are created for all actions
4. **Verify**: No partial state updates

## 🔍 Debugging

### Check Database State

```bash
# Connect to MongoDB
mongosh

# Check user KYC status
db.users.findOne({email: "student@example.com"}, {kycStatus: 1, isVerified: 1})

# Check KYC record
db.kycs.findOne({userId: ObjectId("...")}, {verificationStatus: 1, email: 1, phone: 1})

# Check audit trail
db.kycaudits.find({userId: ObjectId("...")}).sort({timestamp: -1})
```

### Check Socket.IO Connection

1. **Open browser dev tools**
2. **Check Network tab** for WebSocket connection
3. **Check Console** for Socket.IO events
4. **Verify authentication** in Socket.IO logs

### Common Issues

1. **"KYC already submitted"**: Check for existing KYC records
2. **"User not found"**: Verify authentication token
3. **Socket not connecting**: Check CORS and authentication
4. **Status not updating**: Check Socket.IO events and cache

## 📈 Performance Testing

### Load Testing

```bash
# Test concurrent KYC submissions
npm run test:load

# Test admin approval under load
npm run test:admin-load
```

### Database Performance

- **Indexes**: Verify unique compound index on `{email: 1, phone: 1}`
- **Queries**: Check query performance with `explain()`
- **Transactions**: Monitor transaction performance

## 🚨 Production Deployment

### Pre-deployment Checklist

- [ ] **Migration script** executed successfully
- [ ] **All tests** passing
- [ ] **Socket.IO** configured for production
- [ ] **Environment variables** set correctly
- [ ] **Database indexes** created
- [ ] **Audit logging** enabled

### Post-deployment Verification

1. **Test complete flow** with real users
2. **Monitor logs** for any errors
3. **Check database** consistency
4. **Verify Socket.IO** connections
5. **Test admin functions**

## 📝 API Endpoints

### Student Endpoints

- `POST /api/kyc` - Submit KYC (atomic transaction)
- `GET /api/kyc/student/profile` - Get canonical profile + status
- `GET /api/kyc/profile` - Get KYC profile details

### Admin Endpoints

- `GET /api/admin/kyc` - List all KYC submissions
- `PUT /api/admin/kyc/:id/approve` - Approve KYC (atomic transaction)
- `PUT /api/admin/kyc/:id/reject` - Reject KYC (atomic transaction)
- `GET /api/admin/kyc/:id` - Get specific KYC details

### Debug Endpoints

- `GET /api/kyc/debug/:email` - Debug user KYC status (admin only)
- `POST /api/kyc/sync-user/:email` - Sync user KYC status (admin only)

## 🔐 Security Features

- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control
- **Data Integrity**: Atomic transactions prevent partial updates
- **Audit Trail**: All actions logged with timestamps and reasons
- **Input Validation**: Server-side validation of all inputs
- **Unique Constraints**: Prevents duplicate KYC submissions

## 📞 Support

If you encounter any issues:

1. **Check logs** for error messages
2. **Verify database** state using debug endpoints
3. **Test with** the provided test suite
4. **Check Socket.IO** connection status
5. **Review** this testing guide

The KYC system is now production-ready with comprehensive testing, real-time updates, and robust error handling!
