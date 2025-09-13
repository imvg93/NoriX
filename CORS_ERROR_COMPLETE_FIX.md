# CORS Error Fix - Complete Solution

## 🚨 **CRITICAL ISSUE: You're Still Using loca.lt!**

The CORS error is happening because you're still using `https://dry-chicken-cough.loca.lt` instead of your Railway backend.

## ✅ **IMMEDIATE FIX REQUIRED**

### **Step 1: Deploy Backend to Railway**

1. **Go to Railway**: [railway.app](https://railway.app)
2. **Connect GitHub**: Connect your repository
3. **Deploy**: Railway will auto-detect Node.js
4. **Get URL**: Copy your Railway URL (e.g., `https://studentjobs-backend-production-xxxx.up.railway.app`)

### **Step 2: Set Environment Variables in Vercel**

1. **Go to Vercel Dashboard**: [vercel.com](https://vercel.com)
2. **Select Project**: `me-work`
3. **Settings** → **Environment Variables**
4. **Add Variable**:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-railway-url.up.railway.app/api
   ```
5. **Redeploy**: Trigger a new deployment

### **Step 3: Verify Railway Backend**

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

## 🔧 **CORS Configuration (Already Fixed)**

Your backend already has proper CORS configuration:

```typescript
// ✅ Already configured in backend/src/index.ts
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow all Vercel subdomains
    if (origin.includes('.vercel.app')) {
      console.log('✅ CORS: Allowing Vercel origin:', origin);
      return callback(null, true);
    }
    // ... other origins
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};
```

## 🧪 **Testing After Fix**

### **Test 1: Check API URL**
Open browser console on `https://me-work.vercel.app`:
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
// Should show: https://your-railway-url.up.railway.app/api
```

### **Test 2: Test CORS**
```javascript
fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('✅ CORS Success:', data))
.catch(error => console.error('❌ CORS Error:', error));
```

### **Test 3: Test Login**
```javascript
fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
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
  console.log('CORS headers:', response.headers.get('Access-Control-Allow-Origin'));
  return response.json();
})
.then(data => console.log('Login response:', data))
.catch(error => console.error('Login error:', error));
```

## 🚫 **Why loca.lt Doesn't Work**

- **Temporary**: `loca.lt` is only for local testing
- **Unreliable**: Can go down anytime
- **No CORS**: Doesn't have proper CORS configuration
- **Not Production**: Not meant for production use

## ✅ **Expected Results After Fix**

- ✅ No more CORS errors
- ✅ Login requests reach Railway backend
- ✅ Console shows Railway URL instead of loca.lt
- ✅ All API calls work properly
- ✅ Production-ready setup

## 🔍 **Debug Commands**

```bash
# Test Railway backend
curl https://your-railway-url.up.railway.app/health

# Test CORS preflight
curl -H "Origin: https://me-work.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-railway-url.up.railway.app/api/auth/login

# Test login endpoint
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Origin: https://me-work.vercel.app" \
     -d '{"email":"test@example.com","password":"password123","userType":"student"}' \
     https://your-railway-url.up.railway.app/api/auth/login
```

## 📋 **Checklist**

- [ ] Railway backend deployed and running
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Frontend redeployed after env var change
- [ ] Console shows Railway URL (not loca.lt)
- [ ] CORS headers present in responses
- [ ] Login works without CORS errors

## 🎯 **The Key Fix**

**Stop using `loca.lt` and use Railway backend!**

1. Deploy to Railway
2. Set `NEXT_PUBLIC_API_URL` in Vercel
3. Redeploy frontend
4. Test login

That's it! The CORS error will be completely resolved.
