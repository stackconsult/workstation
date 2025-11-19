# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Workstation project.

## Active Workflows

### CI/CD Pipelines

#### `ci.yml` - Main CI Pipeline
**Trigger**: Push to any branch, Pull Requests  
**Purpose**: Comprehensive CI validation  
**Steps**:
- Lint code with ESLint
- Build TypeScript
- Run test suite (146+ tests)
- Check test coverage (65%+ overall, 95%+ for critical paths)
- Security scanning (TruffleHog, npm audit)
- Docker build verification

**Exit Criteria**:
- All lints pass
- Build succeeds
- All tests pass
- Coverage thresholds met
- No security vulnerabilities

---

### Agent Management

#### `agent-orchestrator.yml` - Agent Orchestration
**Trigger**: Manual workflow_dispatch  
**Purpose**: Coordinate multi-agent tasks  
**Capabilities**:
- Agent discovery and registration
- Task routing and delegation
- Health monitoring
- Failure recovery

#### `agent-discovery.yml` - Agent Discovery
**Trigger**: Scheduled (daily), Manual  
**Purpose**: Discover and register available agents  
**Features**:
- Auto-detect MCP containers
- Update agent registry
- Validate agent health
- Report agent status

#### `admin-control-panel.yml` - Admin Control Panel
**Trigger**: Manual workflow_dispatch  
**Purpose**: Administrative operations  
**Capabilities**:
- Start/stop agents
- View logs and metrics
- Update configurations
- Emergency procedures

---

### Agent Testing

#### `agent17-test.yml` - Agent 17 Testing
**Trigger**: Push to agent17 paths, Pull Requests  
**Purpose**: Test Agent 17 (Project Builder)  
**Validation**:
- Agent-specific unit tests
- Integration tests
- Performance benchmarks

#### `agent17-weekly.yml` - Agent 17 Weekly Tests
**Trigger**: Scheduled (weekly)  
**Purpose**: Comprehensive Agent 17 testing  
**Coverage**:
- Extended integration tests
- Load testing
- Regression tests

#### `agent2-ci.yml`, `agent3-ci.yml`, `agent4-ci.yml`
**Trigger**: Push to respective agent paths  
**Purpose**: Targeted CI for specific agents  
**Scope**: Agent-specific validation

---

### Security & Auditing

#### `audit-scan.yml` - Security Audit Scan
**Trigger**: Scheduled (daily), Manual  
**Purpose**: Comprehensive security scanning  
**Scans**:
- Dependency vulnerabilities (npm audit)
- Secret detection (TruffleHog)
- Code quality issues
- License compliance

#### `audit-classify.yml` - Audit Classification
**Trigger**: After audit-scan.yml  
**Purpose**: Classify and prioritize security findings  
**Actions**:
- Severity assessment
- False positive filtering
- Issue creation for critical findings

#### `audit-fix.yml` - Automated Audit Fixes
**Trigger**: After audit-classify.yml  
**Purpose**: Automatically fix low-risk vulnerabilities  
**Fixes**:
- Dependency updates
- Code formatting
- Configuration corrections

#### `audit-verify.yml` - Audit Verification
**Trigger**: After audit-fix.yml  
**Purpose**: Verify fixes resolved issues  
**Validation**:
- Re-run security scans
- Confirm vulnerability remediation
- Update audit reports

#### `secret-scan.yml` - Secret Scanning
**Trigger**: Push to any branch  
**Purpose**: Prevent secret leakage  
**Tools**:
- TruffleHog secret detection
- GitLeaks scanning
- Custom pattern matching

---

### Docker Management

#### `build-and-tag-images.yml` - Docker Image Build
**Trigger**: Push to main, Manual  
**Purpose**: Build and tag production Docker images  
**Artifacts**:
- Main application image
- MCP container images
- Agent-specific images

#### `docker-retention.yml` - Docker Image Retention
**Trigger**: Scheduled (weekly)  
**Purpose**: Clean up old Docker images  
**Policy**:
- Keep last 10 tagged versions
- Remove untagged images older than 30 days
- Preserve production images

#### `docker-rollback.yml` - Docker Rollback
**Trigger**: Manual workflow_dispatch  
**Purpose**: Rollback to previous Docker images  
**Process**:
- Identify stable previous version
- Tag as latest
- Restart affected containers

---

### Deployment

#### `deploy-with-rollback.yml` - Deploy with Rollback
**Trigger**: Manual workflow_dispatch  
**Purpose**: Deploy with automatic rollback on failure  
**Process**:
1. Pre-deployment health check
2. Deploy new version
3. Post-deployment validation
4. Automatic rollback if validation fails

#### `rollback-validation.yml` - Rollback Validation
**Trigger**: After rollback operations  
**Purpose**: Verify rollback success  
**Checks**:
- Service health
- API functionality
- Database integrity
- Performance metrics

---

### Agent Building

#### `generalized-agent-builder.yml` - Agent Builder
**Trigger**: Manual workflow_dispatch with parameters  
**Purpose**: Scaffold new agents  
**Inputs**:
- Agent name
- Agent type
- Capabilities
- Port assignment

**Generated Artifacts**:
- Agent source code scaffold
- Dockerfile
- MCP configuration
- Documentation templates

---

## Disabled Workflows

The following workflows are disabled but preserved for reference:

### `agent-scaffolder.yml.disabled`
**Reason**: Superseded by generalized-agent-builder.yml  
**Purpose**: Legacy agent scaffolding

### `agent-doc-generator.yml.disabled`
**Reason**: Documentation now generated inline  
**Purpose**: Automated documentation generation

### `agent-ui-matcher.yml.disabled`
**Reason**: UI matching moved to dedicated service  
**Purpose**: Match agents to UI components

See [DISABLED_WORKFLOWS.md](DISABLED_WORKFLOWS.md) and [DISABLED_WORKFLOWS_RESOLUTION.md](DISABLED_WORKFLOWS_RESOLUTION.md) for more details.

---

## Workflow Configuration

### Secrets Required

| Secret | Description | Used By |
|--------|-------------|---------|
| `GITHUB_TOKEN` | GitHub API access | All workflows |
| `DOCKER_USERNAME` | Docker Hub username | Docker workflows |
| `DOCKER_PASSWORD` | Docker Hub password | Docker workflows |
| `RAILWAY_TOKEN` | Railway deployment token | Deploy workflows |
| `SLACK_WEBHOOK_URL` | Slack notifications | All workflows (optional) |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | production |
| `CI` | CI flag | true |
| `COVERAGE_THRESHOLD` | Test coverage threshold | 65% |

---

## Running Workflows Locally

### Using Act

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act -j test

# Run with secrets
act -j test -s GITHUB_TOKEN=your-token
```

### Manual Testing

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run build
npm run build

# Run security scan
npm audit
npx trufflehog filesystem .
```

---

## Monitoring Workflows

### GitHub Actions Dashboard
View workflow runs at: `https://github.com/creditXcredit/workstation/actions`

### Key Metrics
- **Success Rate**: Target 95%+
- **Average Duration**: Target < 10 minutes for CI
- **Queue Time**: Target < 2 minutes

### Alerts
- Failed CI runs → GitHub notifications
- Security findings → Issues created
- Deployment failures → Slack notifications (if configured)

---

## Troubleshooting

### Common Issues

#### Workflow Fails on Lint
**Solution**: Run `npm run lint:fix` locally and commit

#### Tests Fail in CI but Pass Locally
**Solution**: Check Node version, clear npm cache, verify environment variables

#### Coverage Threshold Not Met
**Solution**: Add tests or adjust thresholds in `jest.config.js`

#### Docker Build Fails
**Solution**: Check Dockerfile syntax, verify base images exist

#### Secret Not Found
**Solution**: Add secret in repository settings → Secrets and variables → Actions

### Debug Tips

```bash
# Enable verbose logging
- name: Test
  run: npm test
  env:
    DEBUG: '*'
    VERBOSE: true

# Check workflow syntax
gh workflow view ci.yml

# Re-run failed jobs
gh run rerun 12345 --failed
```

---

## CI/CD Best Practices

### Workflow Design
- ✅ Keep workflows DRY (use reusable workflows)
- ✅ Use caching for dependencies
- ✅ Fail fast (run critical steps first)
- ✅ Provide clear error messages
- ✅ Use matrix builds for multi-environment testing

### Security
- ✅ Never commit secrets
- ✅ Use least-privilege tokens
- ✅ Scan for vulnerabilities early
- ✅ Use signed commits
- ✅ Restrict workflow permissions

### Performance
- ✅ Cache dependencies (npm, Docker layers)
- ✅ Run jobs in parallel when possible
- ✅ Use self-hosted runners for heavy workloads
- ✅ Clean up old artifacts
- ✅ Optimize Docker builds (multi-stage)

---

## Contributing

When adding new workflows:

1. **Document**: Add description to this README
2. **Test**: Test locally with `act` before committing
3. **Secure**: Never include secrets in workflow files
4. **Monitor**: Set up alerts for workflow failures
5. **Maintain**: Keep workflows DRY and up-to-date

---

## Related Documentation

- [CI_FIXES_DOCUMENTATION.md](CI_FIXES_DOCUMENTATION.md) - CI/CD fixes and improvements
- [DEPLOYMENT_INTEGRATED.md](../DEPLOYMENT_INTEGRATED.md) - Deployment guide
- [ROLLBACK_PROCEDURES.md](../ROLLBACK_PROCEDURES.md) - Rollback procedures
- [DISABLED_WORKFLOWS.md](DISABLED_WORKFLOWS.md) - Disabled workflow details

---

**Last Updated**: November 19, 2025  
**Workflow Count**: 29 active, 3 disabled  
**CI Success Rate**: 96%+
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
