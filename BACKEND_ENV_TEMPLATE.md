# Backend Environment Variables Template
# Copy this to backend/.env for local development

# Database
MONGODB_URI=mongodb://localhost:27017/studentjobs

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=5001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_ALLOW_SELF_SIGNED=false

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Railway Environment Variables (Set in Railway Dashboard)
# Required Variables:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# NODE_ENV=production
# PORT=10000
# FRONTEND_URL=https://me-work.vercel.app

# Optional Variables:
# EMAIL_USER=your_gmail@gmail.com
# EMAIL_PASS=your_gmail_app_password
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
