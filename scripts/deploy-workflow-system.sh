#!/bin/bash
#
# One-Click Workflow Deployment Script
# Phase 4 Step 4 - Enhanced with version management and health checks
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${1:-production}"
VERSION_TAG="${2:-latest}"
SKIP_TESTS="${3:-false}"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Workflow System One-Click Deployment    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Environment:${NC} $DEPLOYMENT_ENV"
echo -e "${GREEN}Version:${NC} $VERSION_TAG"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}[1/8] Running pre-deployment checks...${NC}"

# Check if version snapshot exists
if [ "$VERSION_TAG" != "latest" ]; then
  if [ ! -d ".versions/mcp/$VERSION_TAG" ]; then
    echo -e "${RED}Error: Version snapshot '$VERSION_TAG' not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Version snapshot found${NC}"
fi

# Check dependencies
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js installed${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

# Step 2: Create backup of current state
echo -e "${YELLOW}[2/8] Creating backup snapshot...${NC}"
BACKUP_TAG="pre-deploy-$(date +%Y%m%d-%H%M%S)"
./scripts/versioning/version-create.sh "$BACKUP_TAG" "Automatic backup before deployment to $DEPLOYMENT_ENV" > /dev/null 2>&1
echo -e "${GREEN}✓ Backup created: $BACKUP_TAG${NC}"

# Step 3: Install dependencies
echo -e "${YELLOW}[3/8] Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 4: Run linting (if not skipped)
if [ "$SKIP_TESTS" != "true" ]; then
  echo -e "${YELLOW}[4/8] Running linting...${NC}"
  npm run lint || {
    echo -e "${RED}✗ Linting failed${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    ./scripts/versioning/version-rollback.sh "$BACKUP_TAG"
    exit 1
  }
  echo -e "${GREEN}✓ Linting passed${NC}"
else
  echo -e "${YELLOW}[4/8] Skipping linting (tests disabled)${NC}"
fi

# Step 5: Build application
echo -e "${YELLOW}[5/8] Building application...${NC}"
npm run build || {
  echo -e "${RED}✗ Build failed${NC}"
  echo -e "${YELLOW}Rolling back...${NC}"
  ./scripts/versioning/version-rollback.sh "$BACKUP_TAG"
  exit 1
}
echo -e "${GREEN}✓ Build completed${NC}"

# Step 6: Run tests (if not skipped)
if [ "$SKIP_TESTS" != "true" ]; then
  echo -e "${YELLOW}[6/8] Running tests...${NC}"
  npm test -- --passWithNoTests || {
    echo -e "${RED}✗ Tests failed${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    ./scripts/versioning/version-rollback.sh "$BACKUP_TAG"
    exit 1
  }
  echo -e "${GREEN}✓ Tests passed${NC}"
else
  echo -e "${YELLOW}[6/8] Skipping tests (tests disabled)${NC}"
fi

# Step 7: Deploy based on environment
echo -e "${YELLOW}[7/8] Deploying to $DEPLOYMENT_ENV...${NC}"

case "$DEPLOYMENT_ENV" in
  "production")
    # Build Docker image
    echo "Building Docker image..."
    docker build -t workstation:$VERSION_TAG . || {
      echo -e "${RED}✗ Docker build failed${NC}"
      ./scripts/versioning/version-rollback.sh "$BACKUP_TAG"
      exit 1
    }
    
    # Tag as latest
    docker tag workstation:$VERSION_TAG workstation:latest
    
    # Restart services
    echo "Restarting services..."
    docker-compose down
    docker-compose up -d
    ;;
    
  "staging")
    # Deploy to staging environment
    echo "Deploying to staging..."
    docker build -t workstation:staging-$VERSION_TAG .
    docker-compose -f docker-compose.staging.yml up -d
    ;;
    
  "development")
    # Start development server
    echo "Starting development server..."
    npm run dev &
    ;;
    
  *)
    echo -e "${RED}Unknown environment: $DEPLOYMENT_ENV${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}✓ Deployment completed${NC}"

# Step 8: Health checks
echo -e "${YELLOW}[8/8] Running health checks...${NC}"

# Wait for service to start
sleep 5

# Check if service is responding
HEALTH_URL="http://localhost:3000/health"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for service to be healthy... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "${RED}✗ Health check failed${NC}"
  echo -e "${YELLOW}Rolling back...${NC}"
  ./scripts/versioning/version-rollback.sh "$BACKUP_TAG"
  exit 1
fi

# Workflow-specific health checks
echo "Checking workflow system..."

# Check if workflow templates are loaded
TEMPLATES_COUNT=$(curl -s http://localhost:3000/api/workflows/templates 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
if [ "$TEMPLATES_COUNT" -ge "30" ]; then
  echo -e "${GREEN}✓ Workflow templates loaded ($TEMPLATES_COUNT templates)${NC}"
else
  echo -e "${YELLOW}⚠ Warning: Expected 30+ templates, found $TEMPLATES_COUNT${NC}"
fi

# Check if workflow service is operational
if curl -f "http://localhost:3000/api/workflows" -H "Authorization: Bearer test-token" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Workflow service operational${NC}"
else
  echo -e "${YELLOW}⚠ Warning: Workflow service may not be fully operational${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Deployment Completed Successfully!   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Environment: $DEPLOYMENT_ENV"
echo -e "  Version: $VERSION_TAG"
echo -e "  Backup: $BACKUP_TAG"
echo -e "  Templates: $TEMPLATES_COUNT"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  Application: http://localhost:3000"
echo -e "  Health Check: http://localhost:3000/health"
echo -e "  Workflow Builder: http://localhost:3000/workflow-builder"
echo ""
echo -e "${BLUE}Rollback Command:${NC}"
echo -e "  ./scripts/versioning/version-rollback.sh $BACKUP_TAG"
echo ""
echo -e "${GREEN}Deployment complete! 🎉${NC}"
