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

# Build the backend application only (Railway only needs backend)
RUN npm run build:backend

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway will use PORT environment variable)
EXPOSE 5000

# Start the backend application directly
CMD ["node", "backend/dist/index.js"]


