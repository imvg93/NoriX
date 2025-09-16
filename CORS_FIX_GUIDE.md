# CORS Fix & Railway Deployment Guide

## ✅ What I Fixed

### 1. **Backend CORS Configuration** (`backend/src/index.ts`)
- ✅ Added proper CORS logging to debug origin issues
- ✅ Enhanced CORS headers with `Accept`, `Origin`, and `exposedHeaders`
- ✅ Added explicit OPTIONS preflight handler
- ✅ Set `optionsSuccessStatus: 200` for legacy browser compatibility
- ✅ Added comprehensive origin logging for debugging

### 2. **Frontend API Configuration** (`frontend/src/services/api.ts`)
- ✅ Updated to use Railway backend URL for Vercel deployments
- ✅ Added proper environment variable handling
- ✅ Enhanced logging for API URL detection
- ✅ Removed hardcoded loca.lt references

### 3. **Railway Deployment Files**
- ✅ Created `railway.json` with proper configuration
- ✅ Created `backend/railway-start.js` for Railway-optimized startup
- ✅ Added Railway-specific npm script

## 🚀 Deployment Steps

### Backend (Railway)
1. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway will auto-detect Node.js project

2. **Set Environment Variables**:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   FRONTEND_URL=https://me-work.vercel.app
   EMAIL_USER=your_gmail (optional)
   EMAIL_PASS=your_app_password (optional)
   ```

3. **Get Railway URL**: After deployment, copy your Railway URL (e.g., `https://studentjobs-backend.up.railway.app`)

### Frontend (Vercel)
1. **Set Environment Variable**:
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-railway-url.up.railway.app/api`

2. **Redeploy**: Trigger a new deployment to pick up the environment variable

## 🧪 Testing CORS

### 1. **Test Health Endpoint**
```bash
curl -H "Origin: https://me-work.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-railway-url.up.railway.app/health
```

### 2. **Test API Endpoint**
```bash
curl -H "Origin: https://me-work.vercel.app" \
     https://your-railway-url.up.railway.app/api/test
```

### 3. **Browser Test**
Open browser console on `https://me-work.vercel.app` and run:
```javascript
fetch('https://your-railway-url.up.railway.app/api/test', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('✅ CORS Success:', data))
.catch(error => console.error('❌ CORS Error:', error));
```

## 🔧 CORS Configuration Details

### Allowed Origins:
- ✅ `http://localhost:3000` (development)
- ✅ `https://me-work.vercel.app` (production)
- ✅ `*.vercel.app` (all Vercel subdomains)
- ✅ `*.railway.app` (all Railway subdomains)
- ✅ `*.onrender.com` (all Render subdomains)

### CORS Headers:
- ✅ `Access-Control-Allow-Origin`: Dynamic based on request origin
- ✅ `Access-Control-Allow-Credentials`: `true`
- ✅ `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- ✅ `Access-Control-Allow-Headers`: `Content-Type, Authorization, X-Requested-With, Accept, Origin`

## 🐛 Troubleshooting

### If CORS still fails:
1. **Check Railway logs** for CORS origin messages
2. **Verify environment variable** is set correctly in Vercel
3. **Clear browser cache** and hard refresh
4. **Check Network tab** in browser dev tools for preflight requests

### Common Issues:
- **Environment variable not set**: Make sure `NEXT_PUBLIC_API_URL` is set in Vercel
- **Wrong Railway URL**: Verify the Railway URL is correct and includes `/api`
- **Cache issues**: Clear browser cache and redeploy frontend

## 📝 Environment Variables Summary

### Frontend (.env.local or Vercel Environment Variables):
```
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api
```

### Backend (Railway Environment Variables):
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
FRONTEND_URL=https://me-work.vercel.app
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
```

## ✅ Expected Results

After deployment:
- ✅ Development: `http://localhost:3000` → `http://localhost:5000/api`
- ✅ Production: `https://me-work.vercel.app` → `https://your-railway-url.up.railway.app/api`
- ✅ OTP requests work without CORS errors
- ✅ Login requests work without CORS errors
- ✅ All API calls include proper CORS headers
