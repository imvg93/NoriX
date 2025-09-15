FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Ensure npm uses the public registry to avoid connection resets
RUN npm config set registry https://registry.npmjs.org/

# Enable corepack just in case (harmless if unused)
RUN corepack enable || true

FROM base AS deps

# Leverage build cache for npm modules
# npm cache directory on alpine is under /root/.npm
RUN --mount=type=cache,target=/root/.npm echo "Using cached npm directory"

# Copy only manifests for deterministic install layer
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install all dependencies (including dev) for building
# Avoid `npm ci`; use `npm install` for tolerance to lockfile drift
RUN --mount=type=cache,target=/root/.npm npm install

FROM base AS build

COPY . .

# Reuse node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Build backend (TypeScript) and frontend (Next.js)
RUN npm run build:backend && npm run build:frontend

FROM node:20-alpine AS runner
WORKDIR /app

# Keep registry configuration in the final image as well
RUN npm config set registry https://registry.npmjs.org/

ENV NODE_ENV=production

# Install only production dependencies for runtime using cache
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

# Copy built artifacts and only necessary runtime files
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public

# Expose common ports (adjust as your backend/frontend serve ports)
EXPOSE 3000 8080

# Default command starts the backend compiled server; adjust if you proxy frontend via backend
CMD ["node", "backend/dist/index.js"]


