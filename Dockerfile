# Multi-stage build untuk production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files terlebih dahulu untuk caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy semua source code
COPY . .

# Build static files
RUN npm run build

# Production stage dengan Nginx
FROM nginx

# Install curl untuk health check
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files dari builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom error pages
COPY --from=builder /app/error_pages/ /usr/share/nginx/html/error_pages/

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
