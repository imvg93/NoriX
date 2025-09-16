# Frontend-only Dockerfile for Railway (Next.js)

FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfile and workspace manifests for deterministic installs
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json

# Install all deps (including dev) to build the frontend
RUN npm ci

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app /app
COPY . .

# Build only the frontend workspace
RUN npm run build --workspace=frontend

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy repo and then prune dev dependencies to keep image small
COPY --from=builder /app /app
RUN npm ci --omit=dev

# Expose default Next.js port (Railway will pass PORT)
EXPOSE 3000

# Optional container healthcheck hitting "/" without extra packages
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;http.get({host:'127.0.0.1',port,path:'/'},res=>{process.exit(res.statusCode===200?0:1)}).on('error',()=>process.exit(1));"

# Start the frontend (binds to Railway $PORT)
CMD ["npm", "run", "start", "--workspace=frontend"]


