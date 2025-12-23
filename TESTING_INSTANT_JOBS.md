# Testing Instant Jobs - Multiple Methods

## Method 1: Use Network IP Address (Easiest) ✅

Your local IP: **192.168.0.40**

### Steps:
1. **On your computer (employer side):**
   - Open: `http://localhost:3000/employer/instant-job`
   - Login as employer

2. **On your phone/another device (student side):**
   - Connect to same WiFi network
   - Open: `http://192.168.0.40:3000/student/dashboard`
   - Login as student
   - Turn ON "Available for instant jobs" toggle

3. **Test flow:**
   - Employer creates instant job
   - Student receives ping notification
   - Student accepts
   - Employer confirms

---

## Method 2: Different Browser Profiles (Same Computer)

### Steps:
1. **Chrome Profile 1 (Employer):**
   - Open Chrome
   - Go to `chrome://settings/manageProfile`
   - Create new profile "Employer"
   - Open: `http://localhost:3000/employer/instant-job`
   - Login as employer

2. **Chrome Profile 2 (Student):**
   - Open Chrome
   - Switch to another profile or use Incognito
   - Open: `http://localhost:3000/student/dashboard`
   - Login as student
   - Turn ON toggle

---

## Method 3: Different Browsers (Same Computer)

### Steps:
1. **Chrome (Employer):**
   - `http://localhost:3000/employer/instant-job`

2. **Firefox/Edge (Student):**
   - `http://localhost:3000/student/dashboard`

---

## Method 4: Use ngrok (External Access)

### Install ngrok:
```bash
# Download from https://ngrok.com/download
# Or use: choco install ngrok (if you have Chocolatey)
```

### Steps:
1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Expose frontend with ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Use ngrok URLs:**
   - Employer: `https://xxxx-xxxx-xxxx.ngrok.io/employer/instant-job`
   - Student: `https://xxxx-xxxx-xxxx.ngrok.io/student/dashboard`
   - (Use same URL, just different routes)

---

## Method 5: Two Different Ports (Advanced)

### Modify frontend to run on different port:

1. **Terminal 1 (Port 3000 - Employer):**
   ```bash
   cd frontend
   PORT=3000 npm run dev
   ```

2. **Terminal 2 (Port 3001 - Student):**
   ```bash
   cd frontend
   PORT=3001 npm run dev
   ```

3. **Access:**
   - Employer: `http://localhost:3000/employer/instant-job`
   - Student: `http://localhost:3001/student/dashboard`

---

## Recommended: Method 1 (Network IP) 🎯

**Why?**
- ✅ Easiest setup
- ✅ Works with real devices
- ✅ Tests Socket.IO properly
- ✅ No extra tools needed

**Quick Setup:**
1. Make sure both devices on same WiFi
2. Employer: `http://localhost:3000`
3. Student: `http://192.168.0.40:3000`

---

## Troubleshooting

### If Socket.IO doesn't connect:
- Check firewall settings
- Make sure backend allows connections from network IP
- Check CORS settings in backend

### If API calls fail:
- Backend should be accessible at `http://192.168.0.40:5000`
- Check `.env` file has correct API URL

