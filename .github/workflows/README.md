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
