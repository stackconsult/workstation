# Multi-stage Dockerfile for Agent Base Image
# Supports rollback/peelback with version tagging

FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Set Playwright to use installed Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Builder stage
FROM base AS builder

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build 2>/dev/null || echo "No build script"

# Production stage
FROM base AS production

# Copy built files and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Add labels for version tracking and rollback
ARG VERSION=dev
ARG BUILD_DATE
ARG COMPONENT=unknown

LABEL org.opencontainers.image.source="https://github.com/creditXcredit/workstation"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL rollback.component="${COMPONENT}"
LABEL rollback.enabled="true"
LABEL rollback.strategy="docker-tag"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

EXPOSE 3000

# Run with proper signal handling
CMD ["node", "dist/index.js"]
