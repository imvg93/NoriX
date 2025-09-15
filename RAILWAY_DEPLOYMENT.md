# Railway Deployment Configuration

## Environment Variables Required

Set these in your Railway project dashboard:

### Required Variables:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to `production`

### Optional Variables:
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password
- `EMAIL_HOST` - SMTP host (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (default: 587)
- `EMAIL_SECURE` - SSL setting (default: false)

### Frontend URL:
- `FRONTEND_URL` - Your frontend URL (e.g., https://me-work.vercel.app)

## Deployment Steps

1. Connect your GitHub repository to Railway
2. Set the root directory to the project root
3. Railway will detect the Dockerfile at repo root and build using Docker
4. Ensure the following build settings (if customizing):
   - Dockerfile: `Dockerfile`
   - Build context: repo root
5. Set the environment variables in Railway dashboard
6. Deploy!

## Docker Build

This repository includes a production-ready Dockerfile optimized for Railway:

- npm registry is explicitly set to `https://registry.npmjs.org/` to avoid intermittent ECONNRESET during dependency install.
- Uses `npm install --omit=dev` instead of `npm ci` to prevent strict lockfile failures.
- Caches npm downloads via `--mount=type=cache,target=/root/.npm` for faster builds.
- Multi-stage: installs deps, builds backend and frontend, and ships only the build output.

## Runtime

The container starts the backend with `node backend/dist/index.js`.

Expose and map port(s) as needed (Dockerfile exposes 3000 and 8080).

Required environment variables:
- `MONGODB_URI`
- `JWT_SECRET`

Optional environment variables:
- `EMAIL_USER`, `EMAIL_PASS`

## CORS Configuration

The backend now supports:
- All Railway domains (*.railway.app)
- All Railway preview deployments (*.up.railway.app)
- Vercel domains (*.vercel.app)
- Render domains (*.onrender.com)
- Local development (localhost:3000-3003)

## Health Check

Railway will use `/health` endpoint for health checks.
