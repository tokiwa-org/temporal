# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY server/ ./server/

# Build TypeScript
RUN npm run build

# Production stage (use slim for glibc - required by Temporal worker)
FROM node:20-slim

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/api/server.js"]
