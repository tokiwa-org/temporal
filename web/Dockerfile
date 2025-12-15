# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY web/ ./web/
COPY tsconfig.json ./

# Build Vite app
RUN npm run build:web

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist/web /usr/share/nginx/html

# Copy nginx config
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
