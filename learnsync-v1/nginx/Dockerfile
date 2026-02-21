# LearnSync AI v1.0 - Nginx Reverse Proxy Dockerfile
# Production-ready with SSL and security hardening

FROM nginx:1.25-alpine

# Install security updates and tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl ca-certificates openssl && \
    rm -rf /var/cache/apk/*

# Remove default configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate for development (replace in production)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=LearnSync AI/OU=IT/CN=localhost" 2>/dev/null || true

# Set proper permissions
RUN chown -R nginx:nginx /etc/nginx/ssl && \
    chmod 600 /etc/nginx/ssl/*

# Create log directory
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]