# LearnSync AI v1.0 - Frontend Dockerfile
# Production-ready React + Vite build
# Multi-stage build for optimization

# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with clean install
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_AI_SERVICE_URL
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AI_SERVICE_URL=${VITE_AI_SERVICE_URL}
ENV VITE_APP_VERSION=${VITE_APP_VERSION:-1.0.0}
ENV NODE_ENV=production

# Build the application
RUN npm run build

# ============================================
# STAGE 2: Production (Nginx)
# ============================================
FROM nginx:1.25-alpine-slim

# Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl ca-certificates && \
    rm -rf /var/cache/apk/*

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/
COPY nginx-security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create health check endpoint
RUN echo '<!DOCTYPE html><html><head><title>Health</title></head><body>OK</body></html>' > /usr/share/nginx/html/health

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Security: Run as non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]