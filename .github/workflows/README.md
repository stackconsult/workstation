# GitHub Actions Workflows

**CI/CD Pipeline Documentation for Workstation**

This directory contains GitHub Actions workflows that automate building, testing, deployment, and management of the Workstation platform and MCP containers.

---

## Table of Contents

1. [Overview](#overview)
2. [Active Workflows](#active-workflows)
3. [MCP Container Builds](#mcp-container-builds)
4. [Image Tagging Strategy](#image-tagging-strategy)
5. [Rollback Procedures](#rollback-procedures)
6. [Secrets Management](#secrets-management)
7. [Workflow Triggers](#workflow-triggers)
8. [Best Practices](#best-practices)

---

## Overview

The CI/CD pipeline follows a multi-stage approach:

```
Code Push → Lint → Build → Test → Security Scan → Docker Build → Deploy
```

All stages must pass before code reaches production.

---

## Active Workflows

### Core Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Main CI | `ci.yml` | Push, PR | Lint, build, test code |
| Docker Build | `docker-build.yml` | Main branch push | Build and push Docker images |
| MCP Container Build | `mcp-container-build.yml` | Container changes | Build MCP containers |
| Agent Orchestrator | `agent-orchestrator.yml` | Schedule, manual | Orchestrate agent operations |
| Admin Control | `admin-control-panel.yml` | Manual | Administrative operations |

### Agent-Specific Workflows

| Workflow | Agent | Purpose |
|----------|-------|---------|
| `agent17-test.yml` | Agent-17 | Test agent functionality |
| `agent17-weekly.yml` | Agent-17 | Weekly agent tasks |
| `agent2-ci.yml` | Agent-2 | Navigation helper CI |
| `agent3-ci.yml` | Agent-3 | Database orchestration CI |
| `agent4-ci.yml` | Agent-4 | Integration specialist CI |

---

## MCP Container Builds

### Build Process

MCP containers are built automatically when changes are detected:

```yaml
# Example: .github/workflows/mcp-container-build.yml
name: Build MCP Containers

on:
  push:
    branches: [main]
    paths:
      - 'mcp-containers/**'
      - 'docker-compose.mcp.yml'
      - '.docker/mcp-base.Dockerfile'

jobs:
  build-containers:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        container:
          - 01-selector-mcp
          - 02-navigation-mcp
          # ... all 20 containers
          - 16-data-processing-mcp
          - 20-orchestrator-mcp
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./mcp-containers/${{ matrix.container }}
          push: true
          tags: |
            ghcr.io/creditxcredit/workstation/${{ matrix.container }}:latest
            ghcr.io/creditxcredit/workstation/${{ matrix.container }}:${{ github.sha }}
            ghcr.io/creditxcredit/workstation/${{ matrix.container }}:v${{ github.run_number }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Container Build Matrix

All 20 MCP containers are built in parallel using a matrix strategy:

```yaml
matrix:
  container:
    - 01-selector-mcp
    - 02-navigation-mcp
    - 03-database-orchestration-specialist-mcp
    - 04-integration-specialist-slack-webhooks-mcp
    - 05-workflow-mcp
    - 06-project-builder-mcp
    - 07-code-quality-mcp
    - 08-performance-mcp
    - 09-error-tracker-mcp
    - 10-security-mcp
    - 11-accessibility-mcp
    - 12-integration-mcp
    - 13-docs-auditor-mcp
    - 14-advanced-automation-mcp
    - 15-api-integration-mcp
    - 16-data-processing-mcp    # Manager Agent
    - 17-learning-platform-mcp
    - 18-community-hub-mcp
    - 19-deployment-mcp
    - 20-orchestrator-mcp
```

---

## Image Tagging Strategy

### Tag Conventions

Every MCP container image is tagged with three tags:

1. **`latest`** - Most recent build (mutable)
2. **`:commit-sha`** - Specific commit (immutable)
3. **`:vX`** - Build number (immutable, sequential)

**Example:**
```
ghcr.io/creditxcredit/workstation/mcp-16-data:latest
ghcr.io/creditxcredit/workstation/mcp-16-data:a1b2c3d4
ghcr.io/creditxcredit/workstation/mcp-16-data:v123
```

### Semantic Versioning

For releases, additional semantic version tags:

```
ghcr.io/creditxcredit/workstation/mcp-16-data:v1.0.0
ghcr.io/creditxcredit/workstation/mcp-16-data:v1.0
ghcr.io/creditxcredit/workstation/mcp-16-data:v1
```

### Stable Tag

A `stable` tag points to the last known good version:

```
ghcr.io/creditxcredit/workstation/mcp-16-data:stable
```

---

## Rollback Procedures

### Using GitHub Actions

**Trigger Rollback Workflow:**

```yaml
# .github/workflows/rollback.yml (to be created)
name: Rollback MCP Container

on:
  workflow_dispatch:
    inputs:
      container:
        description: 'Container to rollback'
        required: true
        type: choice
        options:
          - mcp-01-selector
          - mcp-16-data
          # ... all containers
      target_tag:
        description: 'Target tag to rollback to'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Trigger Peelback
        run: |
          ./.docker/peelback.sh ${{ inputs.container }} ${{ inputs.target_tag }} --verify-health
```

### Manual Rollback via CLI

**Option 1: Using Peelback Script**

```bash
# Roll back Agent-16 to v1.0.0
./.docker/peelback.sh mcp-16-data v1.0.0 --verify-health
```

**Option 2: Using Agent-16 API**

```bash
# Trigger rollback via API
curl -X POST http://localhost:3016/api/containers/peelback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "container": "mcp-16-data",
    "tag": "v1.0.0",
    "verify_health": true
  }'
```

**Option 3: Direct Docker Commands**

```bash
# Stop container
docker-compose -f docker-compose.mcp.yml stop mcp-16-data

# Pull specific version
docker pull ghcr.io/creditxcredit/workstation/mcp-16-data:v1.0.0

# Update docker-compose.yml to use specific tag
# Then restart
docker-compose -f docker-compose.mcp.yml up -d mcp-16-data
```

### Rollback Decision Matrix

| Scenario | Method | Speed | Safety |
|----------|--------|-------|--------|
| Single container issue | Peelback script | Fast | High |
| Multiple containers failing | Docker Compose | Medium | Medium |
| Production emergency | Agent-16 API | Fastest | High |
| Scheduled maintenance | GitHub Actions | Slow | Highest |

---

## Secrets Management

### Required Secrets

Configure in GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret | Purpose | How to Generate |
|--------|---------|-----------------|
| `GITHUB_TOKEN` | Built-in, auto-provided | N/A (provided by GitHub) |
| `CONTAINER_REGISTRY_TOKEN` | Push to container registry | Generate PAT with `write:packages` |
| `DEPLOY_SSH_KEY` | Deploy to servers | Generate SSH key pair |
| `JWT_SECRET_PROD` | Production JWT secret | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Using Secrets in Workflows

```yaml
- name: Login to Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Deploy with JWT Secret
  run: |
    docker run -e JWT_SECRET=${{ secrets.JWT_SECRET_PROD }} ...
```

### Security Best Practices

1. **Never log secrets** - Use `::add-mask::` if needed
2. **Rotate secrets regularly** - Every 90 days minimum
3. **Use least privilege** - Only grant necessary permissions
4. **Audit secret usage** - Review Actions logs regularly

---

## Workflow Triggers

### Automatic Triggers

```yaml
# On push to main
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'mcp-containers/**'

# On pull request
on:
  pull_request:
    branches: [main]

# On schedule (cron)
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

# On release creation
on:
  release:
    types: [created, published]
```

### Manual Triggers

```yaml
# Manual workflow dispatch
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
```

**Trigger manually:**
1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Fill in inputs
5. Click "Run workflow"

---

## Best Practices

### 1. Build Optimization

```yaml
# Use Docker layer caching
- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 2. Parallel Execution

```yaml
# Build all containers in parallel
strategy:
  matrix:
    container: [mcp-01, mcp-02, ..., mcp-20]
  max-parallel: 10  # Limit concurrent jobs
```

### 3. Health Checks

```yaml
# Verify deployment health
- name: Health check
  run: |
    sleep 30  # Wait for startup
    curl -f http://localhost:3016/health || exit 1
```

### 4. Rollback on Failure

```yaml
# Automatic rollback
- name: Deploy
  id: deploy
  run: docker-compose up -d
  
- name: Rollback on failure
  if: failure()
  run: ./.docker/peelback.sh mcp-16-data stable
```

### 5. Notifications

```yaml
# Slack notification on failure
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Monitoring Workflow Health

### Check Workflow Status

```bash
# Using GitHub CLI
gh workflow list
gh run list --workflow=mcp-container-build.yml
gh run view <run-id>
```

### View Logs

```bash
# View specific workflow run logs
gh run view <run-id> --log
```

### Common Issues

**Issue: Container build timeout**

**Solution:**
```yaml
# Increase timeout
jobs:
  build:
    timeout-minutes: 60  # Default is 360
```

**Issue: Out of disk space**

**Solution:**
```yaml
# Clean up before build
- name: Free disk space
  run: |
    docker system prune -af
    sudo rm -rf /usr/share/dotnet
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Rollback Guide](../ROLLBACK.md)
- [MCP Containers Guide](../mcp-containers/README.md)
- [Architecture Documentation](../ARCHITECTURE.md)

---

## Support

For CI/CD issues:
- 📖 [Documentation](../docs/DOCUMENTATION_INDEX.md)
- 🐛 [Issue Tracker](https://github.com/creditXcredit/workstation/issues)
- 💬 [Discussions](https://github.com/creditXcredit/workstation/discussions)

---

**Last Updated:** November 19, 2024  
**Version:** 1.0.0
