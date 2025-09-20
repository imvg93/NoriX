FROM node:20-alpine

# Set working directory
WORKDIR /app

# Ensure npm uses the public registry to avoid connection resets
RUN npm config set registry https://registry.npmjs.org/

# Copy package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build:backend && npm run build:frontend

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application using Railway start script
CMD ["node", "backend/railway-start.js"]


