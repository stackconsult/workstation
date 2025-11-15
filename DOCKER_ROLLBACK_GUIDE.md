# Docker Image Rollback Guide

## Overview

Starting from November 2024, every commit to the main branch automatically builds and pushes a Docker image to GitHub Container Registry (GHCR). This provides a complete historical record of all deployed versions, making rollbacks quick and reliable.

## Table of Contents

- [Understanding Docker Image Tags](#understanding-docker-image-tags)
- [Quick Rollback Guide](#quick-rollback-guide)
- [Finding the Right Image](#finding-the-right-image)
- [Platform-Specific Rollbacks](#platform-specific-rollbacks)
- [Automated Rollback](#automated-rollback)
- [Testing Before Rollback](#testing-before-rollback)
- [Troubleshooting](#troubleshooting)

---

## Understanding Docker Image Tags

Every main branch commit creates multiple tags for flexibility:

### 1. Git SHA Tags (Exact Version Tracking)

**Long SHA Format:**
```
ghcr.io/creditxcredit/workstation:1a2b3c4d5e6f7g8h9i0j
```
- Most precise tracking
- Immutable reference to exact commit
- Use for production rollbacks

**Short SHA with Branch:**
```
ghcr.io/creditxcredit/workstation:main-1a2b3c4
```
- Human-readable
- Includes branch context
- Easier to identify in lists

### 2. Branch Tags (Latest for Branch)

```
ghcr.io/creditxcredit/workstation:main
```
- Always points to latest commit on main
- Updates automatically with each push
- Good for development/staging

### 3. Latest Tag (Most Recent Main)

```
ghcr.io/creditxcredit/workstation:latest
```
- Points to most recent main branch build
- Industry standard for "current" version
- **Not recommended for production** (use specific SHAs)

### 4. Semantic Version Tags (On Releases)

```
ghcr.io/creditxcredit/workstation:1.0.0  # Full version
ghcr.io/creditxcredit/workstation:1.0    # Minor version
ghcr.io/creditxcredit/workstation:1      # Major version
```
- Created when git tags are pushed
- Follow semver conventions
- Recommended for stable production deployments

---

## Quick Rollback Guide

### Step 1: Identify the Target Version

Find the commit SHA you want to rollback to:

```bash
# View recent commits
git log --oneline -20

# Example output:
# abc1234 (HEAD) Fix that caused issues  <- Current (broken)
# def5678 Last working version          <- Rollback target
# ghi9012 Previous update
```

### Step 2: Stop Current Container

```bash
docker stop stackbrowseragent
docker rm stackbrowseragent
```

### Step 3: Pull and Run Previous Version

```bash
# Pull the specific version
docker pull ghcr.io/creditxcredit/workstation:main-def5678

# Run with production configuration
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e JWT_EXPIRATION="24h" \
  -e NODE_ENV="production" \
  --name stackbrowseragent \
  --restart unless-stopped \
  ghcr.io/creditxcredit/workstation:main-def5678
```

### Step 4: Verify Health

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected: {"status":"healthy","timestamp":"..."}

# Check logs
docker logs stackbrowseragent

# Test authentication
curl http://localhost:3000/auth/demo-token
```

---

## Finding the Right Image

### Method 1: Git History

Most reliable for recent changes:

```bash
# Show commits with dates
git log --oneline --date=short --pretty=format:"%h %ad %s" -20

# Find commit before the issue
# Use the short SHA (first 7 characters)
```

### Method 2: GitHub Packages UI

Visual browser-based approach:

1. Navigate to: https://github.com/creditXcredit/workstation/pkgs/container/workstation
2. Browse versions sorted by date
3. Each version shows:
   - **Git SHA** - Exact commit reference
   - **Published date** - When image was built
   - **Commit message** - What changed
   - **Tags** - All tags pointing to this image
   - **Size** - Image size
4. Copy the SHA or tag you want to rollback to

### Method 3: GitHub Actions History

See exactly what was deployed:

1. Go to: https://github.com/creditXcredit/workstation/actions
2. Click on "CI/CD" workflow
3. Filter by "main" branch
4. Find successful run before the issue
5. Check "Build and Push Docker Image" job
6. See the exact tags that were created
7. Copy the SHA from the summary

### Method 4: Image Labels

Inspect an image to see its metadata:

```bash
# Pull any recent image
docker pull ghcr.io/creditxcredit/workstation:latest

# Inspect labels
docker inspect ghcr.io/creditxcredit/workstation:latest \
  --format='{{json .Config.Labels}}' | jq

# Labels include:
# - org.opencontainers.image.revision: Git commit SHA
# - org.opencontainers.image.created: Build timestamp
# - org.opencontainers.image.version: Version tag
# - org.opencontainers.image.source: GitHub repo URL
```

---

## Platform-Specific Rollbacks

### Docker Compose

Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    # Change from 'latest' to specific SHA
    image: ghcr.io/creditxcredit/workstation:main-def5678
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=24h
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Apply the rollback:

```bash
docker-compose pull      # Pull the specified version
docker-compose up -d     # Restart with new version
docker-compose logs -f   # Watch logs
```

### Kubernetes

Update deployment to use specific image:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stackbrowseragent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stackbrowseragent
  template:
    metadata:
      labels:
        app: stackbrowseragent
    spec:
      containers:
      - name: app
        # Rollback: Update to specific SHA
        image: ghcr.io/creditxcredit/workstation:main-def5678
        ports:
        - containerPort: 3000
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

Apply the rollback:

```bash
# Method 1: Apply updated YAML
kubectl apply -f deployment.yaml

# Method 2: Direct image update (faster)
kubectl set image deployment/stackbrowseragent \
  app=ghcr.io/creditxcredit/workstation:main-def5678

# Method 3: Rollback to previous deployment (if using kubectl rollout)
kubectl rollout undo deployment/stackbrowseragent

# Watch the rollout progress
kubectl rollout status deployment/stackbrowseragent

# Verify pods are running
kubectl get pods -l app=stackbrowseragent

# Check logs
kubectl logs -f deployment/stackbrowseragent
```

### Railway

Railway can deploy directly from GHCR:

**Via Dashboard:**
1. Go to your project settings
2. Navigate to "Deploy" section
3. Change source from "GitHub" to "Docker Image"
4. Enter: `ghcr.io/creditxcredit/workstation:main-def5678`
5. Click "Deploy"

**Via CLI:**
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login
railway login

# Deploy specific image
railway up --image ghcr.io/creditxcredit/workstation:main-def5678
```

### AWS ECS/Fargate

Update task definition and service:

```bash
# 1. Register new task definition with rollback image
aws ecs register-task-definition \
  --family stackbrowseragent \
  --container-definitions '[{
    "name": "app",
    "image": "ghcr.io/creditxcredit/workstation:main-def5678",
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    }],
    "secrets": [{
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
    }],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 40
    }
  }]'

# 2. Update service to use new task definition revision
aws ecs update-service \
  --cluster my-cluster \
  --service stackbrowseragent \
  --task-definition stackbrowseragent:LATEST

# 3. Monitor deployment
aws ecs wait services-stable \
  --cluster my-cluster \
  --services stackbrowseragent

# 4. Verify deployment
aws ecs describe-services \
  --cluster my-cluster \
  --services stackbrowseragent
```

### DigitalOcean App Platform

Update via CLI or dashboard:

```bash
# Install doctl if not already installed
snap install doctl

# Authenticate
doctl auth init

# Update app spec with new image
doctl apps update YOUR_APP_ID --spec - <<EOF
name: stackbrowseragent
services:
- name: web
  image:
    registry_type: GHCR
    registry: ghcr.io
    repository: creditxcredit/workstation
    tag: main-def5678
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    type: SECRET
  health_check:
    http_path: /health
EOF
```

### Heroku (Container Registry)

```bash
# 1. Pull the rollback image
docker pull ghcr.io/creditxcredit/workstation:main-def5678

# 2. Tag for Heroku registry
docker tag ghcr.io/creditxcredit/workstation:main-def5678 \
  registry.heroku.com/your-app-name/web

# 3. Push to Heroku
docker push registry.heroku.com/your-app-name/web

# 4. Release
heroku container:release web -a your-app-name

# 5. Verify
heroku logs --tail -a your-app-name
```

### VPS with Docker

Simple single-server deployment:

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Pull rollback image
docker pull ghcr.io/creditxcredit/workstation:main-def5678

# 3. Stop current container
docker stop stackbrowseragent
docker rm stackbrowseragent

# 4. Start with rollback image
docker run -d \
  --name stackbrowseragent \
  -p 3000:3000 \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e NODE_ENV="production" \
  --restart unless-stopped \
  ghcr.io/creditxcredit/workstation:main-def5678

# 5. Verify
docker ps
docker logs stackbrowseragent
curl http://localhost:3000/health
```

---

## Automated Rollback

Create a reusable rollback script for quick recoveries.

### Create the Script

Save as `/usr/local/bin/rollback-stackbrowseragent.sh`:

```bash
#!/bin/bash
set -euo pipefail

# Rollback script for stackBrowserAgent Docker deployments
# Usage: ./rollback-stackbrowseragent.sh <commit-sha-or-tag>

# Configuration
REGISTRY="ghcr.io/creditxcredit/workstation"
CONTAINER_NAME="stackbrowseragent"
PORT="${PORT:-3000}"
JWT_SECRET="${JWT_SECRET:?JWT_SECRET environment variable is required}"
JWT_EXPIRATION="${JWT_EXPIRATION:-24h}"
NODE_ENV="${NODE_ENV:-production}"

# Validation
if [ -z "${1:-}" ]; then
  echo "❌ Usage: $0 <commit-sha-or-tag>"
  echo ""
  echo "Examples:"
  echo "  $0 main-def5678        # Rollback to specific commit"
  echo "  $0 1.0.0               # Rollback to semantic version"
  echo "  $0 latest              # Rollback to latest main (not recommended)"
  echo ""
  echo "Available tags: https://github.com/creditXcredit/workstation/pkgs/container/workstation"
  exit 1
fi

TARGET_TAG="$1"
IMAGE="${REGISTRY}:${TARGET_TAG}"

echo "🔄 Rollback initiated for stackBrowserAgent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Target image: ${IMAGE}"
echo ""

# Pull the image
echo "📥 Pulling image..."
if ! docker pull "${IMAGE}"; then
  echo "❌ Failed to pull image. Check if tag exists:"
  echo "   https://github.com/creditXcredit/workstation/pkgs/container/workstation"
  exit 1
fi
echo "✅ Image pulled successfully"
echo ""

# Display image metadata
echo "📋 Image metadata:"
docker inspect "${IMAGE}" --format='   Git SHA: {{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null || echo "   Git SHA: N/A"
docker inspect "${IMAGE}" --format='   Built: {{index .Config.Labels "org.opencontainers.image.created"}}' 2>/dev/null || echo "   Built: N/A"
docker inspect "${IMAGE}" --format='   Version: {{index .Config.Labels "org.opencontainers.image.version"}}' 2>/dev/null || echo "   Version: N/A"
echo ""

# Confirmation prompt
read -p "⚠️  Proceed with rollback? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 0
fi
echo ""

# Backup current container (optional)
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  BACKUP_NAME="${CONTAINER_NAME}-backup-$(date +%Y%m%d-%H%M%S)"
  echo "💾 Backing up current container as ${BACKUP_NAME}..."
  docker rename "${CONTAINER_NAME}" "${BACKUP_NAME}" 2>/dev/null || true
  docker stop "${BACKUP_NAME}" 2>/dev/null || true
  echo "✅ Backup created (can be removed with: docker rm ${BACKUP_NAME})"
  echo ""
fi

# Start new container
echo "🚀 Starting container with rollback image..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:3000" \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e JWT_EXPIRATION="${JWT_EXPIRATION}" \
  -e NODE_ENV="${NODE_ENV}" \
  --restart unless-stopped \
  "${IMAGE}"

# Wait for container to be ready
echo "⏳ Waiting for application to start..."
sleep 5

# Health check
echo "🏥 Running health check..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf "http://localhost:${PORT}/health" > /dev/null; then
    echo "✅ Health check passed!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Rollback completed successfully!"
    echo ""
    echo "📊 Container status:"
    docker ps --filter "name=${CONTAINER_NAME}"
    echo ""
    echo "📝 Recent logs:"
    docker logs --tail 20 "${CONTAINER_NAME}"
    echo ""
    echo "🔗 Application endpoints:"
    echo "   Health: http://localhost:${PORT}/health"
    echo "   Demo token: http://localhost:${PORT}/auth/demo-token"
    echo ""
    echo "💡 To view logs: docker logs -f ${CONTAINER_NAME}"
    echo "💡 To remove backup: docker rm ${BACKUP_NAME:-none}"
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "   Attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
  sleep 3
done

# Health check failed
echo "❌ Health check failed after $MAX_RETRIES attempts"
echo ""
echo "📝 Container logs:"
docker logs --tail 50 "${CONTAINER_NAME}"
echo ""
echo "⚠️  Container may not be healthy. Check logs and environment variables."
echo "💡 To restore backup: docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME} && docker rename ${BACKUP_NAME:-none} ${CONTAINER_NAME} && docker start ${CONTAINER_NAME}"
exit 1
```

### Make Script Executable

```bash
chmod +x /usr/local/bin/rollback-stackbrowseragent.sh
```

### Usage Examples

```bash
# Set required environment variables
export JWT_SECRET="your-production-secret"

# Rollback to specific commit
rollback-stackbrowseragent.sh main-def5678

# Rollback to semantic version
rollback-stackbrowseragent.sh 1.0.0

# Rollback to yesterday's main branch
# (find SHA from git log first)
rollback-stackbrowseragent.sh main-abc1234
```

---

## Testing Before Rollback

Always test the rollback image before applying to production:

### Step 1: Pull and Inspect

```bash
# Pull the target image
docker pull ghcr.io/creditxcredit/workstation:main-def5678

# Verify metadata
docker inspect ghcr.io/creditxcredit/workstation:main-def5678 \
  --format='{{json .Config.Labels}}' | jq

# Check image size
docker images ghcr.io/creditxcredit/workstation:main-def5678
```

### Step 2: Run on Test Port

```bash
# Start on different port for testing
docker run -d \
  --name stackbrowseragent-test \
  -p 3001:3000 \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e NODE_ENV="production" \
  ghcr.io/creditxcredit/workstation:main-def5678

# Wait a few seconds
sleep 5
```

### Step 3: Run Tests

```bash
# Health check
curl http://localhost:3001/health

# Get demo token
TOKEN=$(curl -s http://localhost:3001/auth/demo-token | jq -r '.token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/protected

# Run integration tests (modify test.sh to use :3001)
# ./test.sh http://localhost:3001

# Check logs for errors
docker logs stackbrowseragent-test | grep -i error
```

### Step 4: Load Test (Optional)

```bash
# Quick load test with Apache Bench
ab -n 1000 -c 10 http://localhost:3001/health

# Or with Artillery
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:3001/health
```

### Step 5: Apply to Production

```bash
# If all tests pass, swap to production port
docker stop stackbrowseragent
docker rm stackbrowseragent

docker stop stackbrowseragent-test
docker rm stackbrowseragent-test

# Start on production port
docker run -d \
  --name stackbrowseragent \
  -p 3000:3000 \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e NODE_ENV="production" \
  --restart unless-stopped \
  ghcr.io/creditxcredit/workstation:main-def5678

# Final verification
curl http://localhost:3000/health
```

---

## Troubleshooting

### Issue: Cannot Pull Image

**Symptom:**
```
Error response from daemon: unauthorized: authentication required
```

**Solution:**
```bash
# Create GitHub personal access token with read:packages scope
# Then authenticate:
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Verify authentication
docker pull ghcr.io/creditxcredit/workstation:latest
```

### Issue: Image Not Found for Specific SHA

**Symptom:**
```
Error response from daemon: manifest for ghcr.io/creditxcredit/workstation:main-abc1234 not found
```

**Causes & Solutions:**

1. **SHA is incorrect:**
   ```bash
   # Verify SHA exists in git history
   git log --oneline | grep abc1234
   ```

2. **Image was built before GHCR push was enabled:**
   ```bash
   # Check when GHCR push started (November 2024)
   # For older commits, use git-based rollback instead
   git checkout abc1234
   npm ci
   npm run build
   ```

3. **Image was deleted:**
   ```bash
   # Check GitHub Packages UI for available versions
   # https://github.com/creditXcredit/workstation/pkgs/container/workstation
   ```

### Issue: Container Starts but Health Check Fails

**Symptom:**
```
curl http://localhost:3000/health
curl: (7) Failed to connect to localhost port 3000: Connection refused
```

**Diagnosis:**
```bash
# Check container status
docker ps -a | grep stackbrowseragent

# Check logs
docker logs stackbrowseragent

# Common issues to look for:
# - "JWT_SECRET environment variable is required"
# - Port already in use
# - Module not found errors
# - Permission denied
```

**Solutions:**

**Missing JWT_SECRET:**
```bash
# Set environment variable
export JWT_SECRET="your-32-char-secret-here"

# Restart container
docker rm stackbrowseragent
docker run -d ... -e JWT_SECRET="${JWT_SECRET}" ...
```

**Port conflict:**
```bash
# Check what's using port 3000
lsof -i :3000
# or
netstat -tlnp | grep 3000

# Kill the process or use different port
docker run -d ... -p 3001:3000 ...
```

**Module errors:**
```bash
# Image might be corrupted
# Pull fresh copy
docker rmi ghcr.io/creditxcredit/workstation:main-def5678
docker pull ghcr.io/creditxcredit/workstation:main-def5678
```

### Issue: Rollback Successful but App Behavior Wrong

**Symptom:** Container runs, health check passes, but app doesn't work correctly

**Diagnosis:**
```bash
# Check environment variables
docker inspect stackbrowseragent | jq '.[0].Config.Env'

# Check if correct image is running
docker inspect stackbrowseragent \
  --format='{{index .Config.Labels "org.opencontainers.image.revision"}}'

# Test specific functionality
curl http://localhost:3000/auth/demo-token
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/protected
```

**Solutions:**

1. **Wrong image running:**
   ```bash
   # Double-check image SHA
   docker ps --format '{{.Image}}' | grep stackbrowseragent
   ```

2. **Environment mismatch:**
   ```bash
   # Verify all required env vars are set
   docker exec stackbrowseragent env | grep -E 'JWT|NODE_ENV|PORT'
   ```

3. **Need to clear data:**
   ```bash
   # If app has persistent storage, may need to reset
   docker volume ls
   docker volume rm <volume-name>
   ```

### Issue: Old Image Taking Too Much Space

**Symptom:** Docker disk usage growing

**Solution:**
```bash
# View disk usage
docker system df

# List all images
docker images | grep workstation

# Remove unused images
docker image prune -a

# Or remove specific old images
docker rmi ghcr.io/creditxcredit/workstation:main-old123
```

### Getting Help

If rollback fails:

1. **Check logs thoroughly:**
   ```bash
   docker logs --tail 100 stackbrowseragent
   ```

2. **Inspect container:**
   ```bash
   docker inspect stackbrowseragent
   ```

3. **Try interactive mode:**
   ```bash
   docker run --rm -it \
     -e JWT_SECRET="test" \
     ghcr.io/creditxcredit/workstation:main-def5678 \
     sh
   ```

4. **Verify image integrity:**
   ```bash
   docker run --rm ghcr.io/creditxcredit/workstation:main-def5678 \
     node --version
   ```

5. **Open GitHub Issue:**
   - Include: SHA, error logs, docker inspect output
   - Repository: https://github.com/creditXcredit/workstation/issues

---

## Image Retention Policy

To manage storage and costs:

### Recommended Retention

- **Last 30 days**: Keep all images
- **Last 90 days**: Keep weekly snapshots
- **Beyond 90 days**: Keep only semantic versions
- **Untagged images**: Delete after 7 days

### Manual Cleanup

Via GitHub UI:
1. Go to package page
2. Select version to delete
3. Click "Delete version"

### Automated Cleanup

Consider adding a GitHub Action to cleanup old images:

```yaml
# .github/workflows/cleanup-images.yml
name: Cleanup Old Images

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Delete old untagged images
        uses: actions/delete-package-versions@v4
        with:
          package-name: 'workstation'
          package-type: 'container'
          min-versions-to-keep: 50
          delete-only-untagged-versions: 'true'
```

---

## Best Practices

### 1. Always Use Specific SHAs in Production

❌ **Bad:**
```yaml
image: ghcr.io/creditxcredit/workstation:latest
```

✅ **Good:**
```yaml
image: ghcr.io/creditxcredit/workstation:main-def5678
```

### 2. Test Rollbacks in Staging First

```bash
# Deploy to staging
deploy-to-staging.sh main-def5678

# Run tests
run-staging-tests.sh

# If pass, deploy to production
deploy-to-production.sh main-def5678
```

### 3. Document Rollback Reasons

Create an incident log:

```markdown
## Rollback Log

### 2024-11-14 15:30 UTC
- **From:** main-abc1234 (v1.2.0)
- **To:** main-def5678 (v1.1.9)
- **Reason:** High error rate in JWT validation
- **Duration:** 5 minutes
- **Impact:** < 1% users affected
- **Root cause:** TBD (investigating)
```

### 4. Maintain Rollback Readiness

```bash
# Pre-pull recent images on production servers
docker pull ghcr.io/creditxcredit/workstation:main

# Keep rollback script updated and tested
/usr/local/bin/rollback-stackbrowseragent.sh --test
```

### 5. Monitor After Rollback

```bash
# Watch logs for 10 minutes
docker logs -f --tail 100 stackbrowseragent

# Monitor error rates
# Check health endpoint regularly
watch -n 10 curl -s http://localhost:3000/health
```

---

## Related Documentation

- [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md) - General rollback procedures
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Initial deployment instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SECURITY.md](./SECURITY.md) - Security considerations

---

**Version:** 1.0  
**Last Updated:** November 2024  
**Maintainer:** DevOps Team
