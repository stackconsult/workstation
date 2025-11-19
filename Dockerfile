# Build stage
FROM node:18-alpine AS builder

# Add build metadata labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install git for Git operations
RUN apk add --no-cache git

# Add OCI standard labels for image metadata
LABEL org.opencontainers.image.title="stackBrowserAgent"
LABEL org.opencontainers.image.description="Lightweight, secure JWT-based authentication service built with Express.js and TypeScript"
LABEL org.opencontainers.image.vendor="creditXcredit"
LABEL org.opencontainers.image.source="https://github.com/creditXcredit/workstation"
LABEL org.opencontainers.image.documentation="https://github.com/creditXcredit/workstation/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Add dynamic labels (populated by build args from CI)
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.version="${VERSION}"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
