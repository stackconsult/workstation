#!/bin/bash

# docker-build-version.sh - Build and tag Docker image for version
# Part of the 10-version rollback system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <version-tag> [dockerfile-path]"
    echo ""
    echo "Example: $0 v1.0.0"
    echo "Example: $0 v1.0.0 ./Dockerfile.custom"
    exit 1
fi

VERSION_TAG="$1"
DOCKERFILE="${2:-$REPO_ROOT/Dockerfile}"

# Docker image name
IMAGE_NAME="workstation"
FULL_IMAGE_NAME="$IMAGE_NAME:$VERSION_TAG"

echo -e "${BLUE}=== Docker Build System ===${NC}\n"
echo -e "${GREEN}Version Tag:${NC} $VERSION_TAG"
echo -e "${GREEN}Docker Image:${NC} $FULL_IMAGE_NAME"
echo -e "${GREEN}Dockerfile:${NC} $DOCKERFILE"
echo ""

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${YELLOW}Warning: Dockerfile not found at $DOCKERFILE${NC}"
    echo "Creating default Dockerfile..."
    
    cat > "$REPO_ROOT/Dockerfile" <<'EOF'
# Multi-stage build for workstation
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY agents ./agents
COPY mcp-containers ./mcp-containers
COPY chrome-extension ./chrome-extension
COPY src/workflow-templates ./src/workflow-templates

# Build TypeScript
RUN npm run build || true

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/agents ./agents
COPY --from=builder /app/mcp-containers ./mcp-containers
COPY --from=builder /app/chrome-extension ./chrome-extension
COPY --from=builder /app/src/workflow-templates ./src/workflow-templates

# Copy necessary config files
COPY .env.example ./.env.example
COPY server.json ./server.json

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
EOF
    
    DOCKERFILE="$REPO_ROOT/Dockerfile"
fi

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
cd "$REPO_ROOT"

docker build \
  -t "$FULL_IMAGE_NAME" \
  -t "$IMAGE_NAME:latest" \
  --build-arg VERSION="$VERSION_TAG" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --build-arg GIT_COMMIT="$(git rev-parse HEAD)" \
  -f "$DOCKERFILE" \
  .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== Build Successful ===${NC}\n"
    echo -e "${GREEN}Image built:${NC} $FULL_IMAGE_NAME"
    echo -e "${GREEN}Also tagged:${NC} $IMAGE_NAME:latest"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 3000:3000 --env-file .env $FULL_IMAGE_NAME"
    echo ""
    echo "To push to registry:"
    echo "  docker push $FULL_IMAGE_NAME"
else
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi
