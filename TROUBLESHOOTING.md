# Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Email/OTP Issues

#### 1. "Invalid credentials" error
**Symptoms:** Email sending fails with authentication error
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions:**
1. **Use App Password, not regular password**
   - Go to Google Account Settings → Security → App passwords
   - Generate a new App Password for "Mail"
   - Use the 16-character password in your `.env` file

2. **Enable 2-Factor Authentication**
   - Go to Google Account Settings → Security
   - Enable "2-Step Verification"
   - Then generate App Password

3. **Check Gmail account status**
   - Ensure your Gmail account is not locked
   - Check for any security alerts in your Gmail

#### 2. "Connection timeout" error
**Symptoms:** Email sending times out
```
Error: Connection timeout
```

**Solutions:**
1. **Check internet connection**
2. **Try different ports:**
   ```env
   # Try port 587 (STARTTLS)
   EMAIL_PORT=587
   EMAIL_SECURE=false
   
   # Or try port 465 (SSL)
   EMAIL_PORT=465
   EMAIL_SECURE=true
   ```

3. **Check firewall settings**
4. **Try from different network**

#### 3. "Authentication failed" error
**Symptoms:** Authentication fails even with correct credentials
```
Error: Authentication failed
```

**Solutions:**
1. **Regenerate App Password**
   - Delete existing App Password
   - Create new one specifically for "Mail"
   - Use "Other" as device type

2. **Check account security**
   - Ensure 2-Factor Authentication is enabled
   - Check for any security blocks

3. **Try "Less secure app access"** (not recommended for production)
   - Go to Google Account Settings → Security
   - Enable "Less secure app access"

### Database Issues

#### 1. MongoDB connection failed
**Symptoms:** Server can't connect to database
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. **Start MongoDB service**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

2. **Check MongoDB installation**
   ```bash
   mongod --version
   ```

3. **Use MongoDB Atlas**
   - Create free account at cloud.mongodb.com
   - Get connection string
   - Update `MONGODB_URI` in `.env`

#### 2. Database authentication failed
**Symptoms:** Wrong username/password
```
Error: Authentication failed
```

**Solutions:**
1. **Check connection string format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database
   ```

2. **Verify credentials**
   - Check username/password in MongoDB Atlas
   - Ensure user has proper permissions

### Frontend Issues

#### 1. "Cannot connect to API" error
**Symptoms:** Frontend can't reach backend
```
Error: Failed to fetch
```

**Solutions:**
1. **Check backend is running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check API URL**
   - Ensure `NEXT_PUBLIC_API_URL` is set correctly
   - Default: `http://localhost:5000/api`

3. **Check CORS settings**
   - Backend should allow `http://localhost:3000`
   - Check browser console for CORS errors

#### 2. OTP form not working
**Symptoms:** OTP verification fails
```
Error: Invalid or expired OTP
```

**Solutions:**
1. **Check email configuration**
   ```bash
   cd backend
   npm run test:email
   ```

2. **Check OTP in database**
   - Verify OTP was saved correctly
   - Check expiration time

3. **Check frontend API calls**
   - Ensure correct endpoint is called
   - Check request payload format

### Server Issues

#### 1. Port already in use
**Symptoms:** Server won't start
```
Error: listen EADDRINUSE :::5000
```

**Solutions:**
1. **Kill existing process**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   ```

2. **Change port**
   ```env
   PORT=5001
   ```

#### 2. Build errors
**Symptoms:** TypeScript compilation fails
```
Error: Cannot find module
```

**Solutions:**
1. **Reinstall dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript configuration**
   ```bash
   npx tsc --noEmit
   ```

## 🔧 Debugging Tools

### 1. Email Configuration Test
```bash
cd backend
npm run test:email
```

### 2. Health Check
```bash
curl http://localhost:5000/health
```

### 3. Check Environment Variables
```bash
# Backend
cd backend
node -e "require('dotenv').config(); console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS)"

# Frontend
cd frontend
node -e "console.log(process.env.NEXT_PUBLIC_API_URL)"
```

### 4. Database Connection Test
```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err.message))
  .finally(() => process.exit());
"
```

## 📋 Environment Checklist

### Backend (.env)
- [ ] `EMAIL_USER` - Your Gmail address
- [ ] `EMAIL_PASS` - 16-character App Password
- [ ] `MONGODB_URI` - Database connection string
- [ ] `JWT_SECRET` - Strong secret key
- [ ] `PORT` - Server port (default: 5000)

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] Backend server running on correct port
- [ ] CORS properly configured

## 🚀 Quick Fixes

### Reset Everything
```bash
# Stop all servers
# Clear node_modules
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# Reinstall
npm run install:all

# Setup environment
npm run setup

# Test email
npm run test:email

# Start servers
npm run dev
```

### Common Commands
```bash
# Setup environment
npm run setup

# Test email configuration
npm run test:email

# Start development servers
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Build for production
npm run build
```

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**
   - Backend console output
   - Browser developer tools
   - Network tab for API calls

2. **Verify configuration**
   - Run `npm run test:email`
   - Check all environment variables
   - Ensure MongoDB is running

3. **Common mistakes**
   - Using regular Gmail password instead of App Password
   - Not enabling 2-Factor Authentication
   - Wrong MongoDB connection string
   - CORS issues between frontend/backend

4. **Create detailed issue report**
   - Include error messages
   - Include environment details (without sensitive data)
   - Include steps to reproduce

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Enable HTTPS in production
- Use environment-specific configurations
- Regularly rotate App Passwords

