# 405 Method Not Allowed - Complete Fix Guide

## 🔍 **Root Cause Analysis**

The 405 error is **NOT** caused by method mismatch. Both frontend and backend are correctly using POST methods.

### **Real Causes:**
1. **Wrong API URL** - Frontend still using `loca.lt` instead of Railway
2. **CORS preflight failure** - OPTIONS request not handled properly
3. **Environment variable not set** - `NEXT_PUBLIC_API_URL` missing in Vercel

## ✅ **Step-by-Step Fix**

### **Step 1: Set Environment Variable in Vercel**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add/Update:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-railway-url.up.railway.app/api
   ```
3. **Redeploy** your frontend

### **Step 2: Verify Railway Backend is Running**

Test your Railway backend:
```bash
curl https://your-railway-url.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "StudentJobs API is running",
  "cors": "enabled",
  "allowedOrigins": ["*.vercel.app"]
}
```

### **Step 3: Test CORS Preflight**

```bash
curl -H "Origin: https://me-work.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-railway-url.up.railway.app/api/auth/login
```

Expected response: `200 OK` with CORS headers

### **Step 4: Test Login Endpoint**

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Origin: https://me-work.vercel.app" \
     -d '{"email":"test@example.com","password":"password123","userType":"student"}' \
     https://your-railway-url.up.railway.app/api/auth/login
```

## 🧪 **Frontend Testing**

After fixing, open browser console on your Vercel site and run:

```javascript
// Test 1: Check API URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Test 2: Test login endpoint
fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': window.location.origin
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    userType: 'student'
  })
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  return response.json();
})
.then(data => console.log('Response data:', data))
.catch(error => console.error('Error:', error));
```

## 🔧 **Enhanced Debugging**

I've added comprehensive logging to help debug:

### **Frontend Logs:**
- ✅ API URL detection
- ✅ Request configuration
- ✅ Response status and headers
- ✅ Error details

### **Backend Logs:**
- ✅ CORS origin logging
- ✅ Request method logging
- ✅ Route matching

## 🚨 **Common Issues & Solutions**

### **Issue 1: Still getting 405**
- **Cause**: Environment variable not set or wrong URL
- **Solution**: Check Vercel environment variables and redeploy

### **Issue 2: CORS errors**
- **Cause**: Railway backend not allowing Vercel origin
- **Solution**: Check Railway logs for CORS messages

### **Issue 3: Network errors**
- **Cause**: Railway backend not running
- **Solution**: Check Railway deployment status

## 📋 **Checklist**

- [ ] Railway backend deployed and running
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Frontend redeployed after env var change
- [ ] CORS headers present in responses
- [ ] Login endpoint returns 200/400 (not 405)

## 🎯 **Expected Results**

After fix:
- ✅ No more 405 errors
- ✅ Login requests reach backend
- ✅ Proper CORS headers in responses
- ✅ Console shows correct API URL
- ✅ Login works for all user types

## 🔍 **Debug Commands**

```bash
# Check if Railway is running
curl https://your-railway-url.up.railway.app/health

# Test CORS
curl -H "Origin: https://me-work.vercel.app" -X OPTIONS https://your-railway-url.up.railway.app/api/auth/login

# Test login
curl -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test","userType":"student"}' https://your-railway-url.up.railway.app/api/auth/login
```
