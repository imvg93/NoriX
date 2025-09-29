# Production API Fix Guide

## Issues Fixed

### 1. Backend Route Conflict
**Problem**: The `/api/jobs/employer` route was conflicting with `/api/jobs/:id` route, causing "employer" to be treated as an ObjectId.

**Solution**: Changed the route from `/employer` to `/employer/jobs` to avoid conflicts.

**Files Changed**:
- `backend/src/routes/jobs.ts`: Updated route from `router.get('/employer', ...)` to `router.get('/employer/jobs', ...)`
- `frontend/src/services/api.ts`: Updated API call from `/jobs/employer` to `/jobs/employer/jobs`

### 2. Frontend API Configuration
**Problem**: Frontend was correctly configured to use Railway URL for production, but the route conflict was causing 404 errors.

**Solution**: The API service was already properly configured with environment-based URL switching.

## Environment Configuration

### For Vercel Deployment (Frontend)

You need to set the following environment variable in your Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://studentjobs-backend-production.up.railway.app/api
```

**Steps to set in Vercel**:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add new variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://studentjobs-backend-production.up.railway.app/api`
   - Environment: Production (and Preview if needed)

### For Railway Deployment (Backend)

The backend should already be deployed and running. Make sure your Railway service is accessible at:
`https://studentjobs-backend-production.up.railway.app`

## How the API URL Resolution Works

The frontend automatically detects the environment and uses the appropriate API URL:

1. **Development (localhost)**: Uses `http://localhost:5000/api`
2. **Production (Vercel)**: Uses Railway backend URL `https://studentjobs-backend-production.up.railway.app/api`
3. **Fallback**: If `NEXT_PUBLIC_API_URL` is not set, falls back to localhost

## Testing the Fix

### 1. Test KYC Endpoints
```bash
# These should now work correctly
GET /api/kyc/employer/{employerId}/status
POST /api/kyc/employer
```

### 2. Test Jobs Endpoints
```bash
# This should now work correctly (no more ObjectId error)
GET /api/jobs/employer/jobs
```

## Deployment Steps

1. **Backend**: The changes are already made and should work when deployed to Railway
2. **Frontend**: 
   - Set the environment variable in Vercel
   - Redeploy the frontend
   - The API calls should now work correctly

## Verification

After deployment, check:
1. ✅ KYC status API calls work
2. ✅ KYC submission API calls work  
3. ✅ Jobs API calls work (no more "employer" ObjectId error)
4. ✅ All API calls go to Railway backend in production

## Summary of Changes

1. **Backend**: Fixed route conflict by changing `/employer` to `/employer/jobs`
2. **Frontend**: Updated API service to use the new endpoint
3. **Environment**: Documented the required environment variable setup

The API calls should now work correctly in production! 🎉
