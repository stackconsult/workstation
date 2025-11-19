# Dockerfile for Coding Agent (Agent 16)
# Multi-stage build for optimized production image

# ========================================
# Stage 1: Build Stage
# ========================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# ========================================
# Stage 2: Production Stage
# ========================================
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:3000/health || exit 1

# Environment variables (can be overridden)
ENV NODE_ENV=production
ENV MCP_PORT=3000

# Start application
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="creditXcredit/workstation"
LABEL version="1.0.0"
LABEL description="Coding Agent (Agent 16) - Data Processing & GitHub Integration"
LABEL agent.id="16"
LABEL agent.type="coding-agent"
LABEL mcp.protocol="1.0"
