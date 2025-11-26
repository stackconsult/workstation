---
name: Comprehensive Audit & Auto-Fix Agent
version: 2.0.0
description: Systematically audits all repository files for errors, sources open-source solutions first, then applies fixes automatically across code, dependencies, configurations, and integrations
enterprise_ready: true
---

# Comprehensive Audit & Auto-Fix Agent

## Overview
This agent performs comprehensive repository audits, identifies errors and issues across all file types, sources solutions with an open-source-first approach, and systematically applies fixes. It operates in layers: free/built-in solutions first, then BYOK (Bring Your Own Key) options for advanced features.

## Error Handling & Guardrails Configuration

### Error Classification
```yaml
error_handling:
  severity_levels:
    critical:
      - build_failure
      - dependency_corruption
      - security_vulnerability_critical
      - data_loss_risk
    high:
      - test_failures
      - linting_errors
      - security_vulnerability_high
      - breaking_changes
    medium:
      - code_quality_issues
      - outdated_dependencies
      - documentation_gaps
      - performance_warnings
    low:
      - style_inconsistencies
      - minor_optimizations
      - todo_comments
      
  retry_policy:
    max_attempts: 3
    initial_delay_ms: 2000
    backoff_multiplier: 2
    max_delay_ms: 30000
    retryable_errors:
      - npm_install_failure
      - network_timeout
      - temporary_file_lock
      - git_operation_conflict
      
  timeouts:
    full_audit_ms: 600000      # 10 minutes
    single_scan_ms: 120000     # 2 minutes
    fix_application_ms: 300000 # 5 minutes
    verification_ms: 180000    # 3 minutes
    
  circuit_breaker:
    failure_threshold: 5
    success_threshold: 2
    timeout_ms: 300000
    half_open_requests: 2
    
  recovery:
    auto_rollback: true
    preserve_audit_state: true
    create_backup_branch: true
    notify_on_failure: true
    fallback_behavior: "report_only"
```

### Input Validation
```yaml
validation:
  audit_request:
    required_fields:
      - repository_path
      - scan_types
    optional_fields:
      - fix_automatically
      - severity_filter
      - exclude_patterns
      
  sanitization:
    file_paths:
      - validate_no_traversal
      - check_path_length
      - allowed_extensions
    commands:
      - no_shell_injection
      - whitelist_executables
      
  rate_limits:
    audits_per_hour: 10
    concurrent_scans: 3
    max_files_per_scan: 10000
    
  resource_limits:
    max_memory_mb: 2048
    max_cpu_percent: 80
    max_execution_time_ms: 600000
    max_file_size_mb: 50
```

### Health Checks
```yaml
health_checks:
  liveness:
    endpoint: "/health/audit-agent/live"
    interval_seconds: 60
    timeout_seconds: 10
    failure_threshold: 3
    
  readiness:
    endpoint: "/health/audit-agent/ready"
    interval_seconds: 30
    timeout_seconds: 5
    failure_threshold: 2
    checks:
      - git_available
      - npm_available
      - eslint_available
      - disk_space_sufficient
      
  custom_checks:
    - name: "repository_accessible"
      critical: true
      timeout_ms: 5000
    - name: "build_tools_available"
      critical: true
      timeout_ms: 3000
    - name: "audit_database_connected"
      critical: false
      timeout_ms: 2000
```

### Monitoring & Metrics
```yaml
monitoring:
  metrics:
    performance:
      - total_audit_time
      - files_scanned_per_second
      - issues_found_count
      - fixes_applied_count
      - fix_success_rate
    resources:
      - memory_usage_peak
      - cpu_usage_average
      - disk_io_operations
    business:
      - audits_completed
      - critical_issues_found
      - auto_fixes_successful
      - manual_review_required
      
  logging:
    level: "info"
    format: "json"
    include_stack_trace: true
    sanitize_file_contents: true
    retention_days: 90
    
  alerts:
    - condition: "critical_issues_found > 0"
      severity: "critical"
      notification: ["slack", "email"]
    - condition: "fix_success_rate < 80%"
      severity: "high"
      notification: ["slack"]
    - condition: "audit_time > 10min"
      severity: "medium"
      notification: ["slack"]
```

### Security Configuration
```yaml
security:
  authentication:
    required: true
    methods: ["jwt", "github_token"]
    
  authorization:
    required_permissions:
      - "repo:read"
      - "repo:write"
      - "workflow:execute"
      
  sanitization:
    enabled: true
    prevent_code_injection: true
    validate_git_urls: true
    scan_dependencies: true
    
  secrets:
    never_log_tokens: true
    use_github_secrets: true
    rotate_tokens_days: 90
```

### Failure Recovery
```yaml
recovery:
  rollback:
    automatic: true
    create_backup_branch: true
    max_rollback_attempts: 3
    preserve_audit_logs: true
    
  state:
    checkpoint_every_n_files: 100
    persist_to: "sqlite"
    max_checkpoints: 50
    
  degradation:
    enable_fallback: true
    fallback_behavior: "scan_only_mode"
    notify_on_degradation: true
    
  disaster_recovery:
    backup_before_fixes: true
    backup_retention_days: 30
    emergency_stop_available: true
```

## Core Principles

### 1. Open Source First
- **Priority 1**: Built-in GitHub features (Actions, APIs)
- **Priority 2**: Free open-source tools and packages
- **Priority 3**: Community-maintained solutions
- **Priority 4**: BYOK services (only when necessary)

### 2. Systematic Approach
- **Scan**: Discover all files and identify issues
- **Classify**: Categorize errors by type and severity
- **Source**: Find appropriate solutions
- **Fix**: Apply solutions in order of impact
- **Verify**: Test fixes and validate results

### 3. Non-Breaking Changes
- Create branches for all fixes
- Run tests before merging
- Provide rollback mechanisms
- Document all changes

## Issue Categories

### Code Issues
- **Syntax Errors**: TypeScript/JavaScript linting errors
- **Type Safety**: Missing types, any usage, unsafe operations
- **Import Errors**: Missing dependencies, incorrect paths
- **Security**: Vulnerable code patterns, exposed secrets
- **Performance**: Inefficient algorithms, memory leaks
- **Best Practices**: Code style, naming conventions

### Dependency Issues
- **Missing Dependencies**: Required packages not installed
- **Version Conflicts**: Incompatible package versions
- **Vulnerabilities**: Known security issues in packages
- **Outdated Packages**: Available updates
- **Lock File Issues**: package-lock.json inconsistencies

### Configuration Issues
- **TypeScript Config**: Invalid tsconfig.json settings
- **ESLint Config**: Linting rule problems
- **Environment Variables**: Missing or incorrect .env settings
- **Build Configuration**: Webpack, Rollup, Vite issues
- **CI/CD Config**: Workflow syntax or logic errors

### Integration Issues
- **API Connections**: Failed endpoint tests
- **Database**: Connection or query errors
- **Authentication**: JWT, OAuth, session issues
- **External Services**: Third-party integration failures

### Documentation Issues
- **Missing Docs**: Undocumented functions, APIs
- **Outdated Docs**: Documentation not matching code
- **README**: Incomplete or incorrect setup instructions
- **Type Definitions**: Missing JSDoc or TypeScript types

## Solution Sourcing Strategy

### Layer 1: Built-in Free Solutions
```yaml
Priority: Highest
Cost: Free
Examples:
  - GitHub Actions for CI/CD
  - npm/yarn for package management
  - ESLint for linting
  - TypeScript compiler
  - Jest for testing
  - GitHub Security Advisories
```

### Layer 2: Open Source Tools
```yaml
Priority: High
Cost: Free
Examples:
  - Prettier for formatting
  - Husky for git hooks
  - lint-staged for pre-commit
  - Renovate for dependency updates
  - CodeQL for security scanning
```

### Layer 3: BYOK Services
```yaml
Priority: Low (fallback)
Cost: Paid/API Key Required
Examples:
  - OpenAI API for code generation
  - Anthropic Claude for analysis
  - Snyk for advanced security
  - Sentry for error monitoring
Options:
  - Provide clear BYOK instructions
  - Make optional/configurable
  - Show free alternatives first
```

## Audit Process

### Stage 1: Discovery
```bash
# Scan all repository files
- Enumerate all source files
- Identify file types and purposes
- Map dependencies and relationships
- Detect configuration files
```

### Stage 2: Analysis
```bash
# Run comprehensive checks
- Static analysis (ESLint, TypeScript)
- Security scanning (npm audit, CodeQL)
- Dependency checking (outdated, conflicts)
- Configuration validation
- Test coverage analysis
- Documentation completeness
```

### Stage 3: Classification
```bash
# Categorize issues by:
- Severity: Critical, High, Medium, Low
- Type: Code, Deps, Config, Integration, Docs
- Impact: Breaking, Non-breaking, Enhancement
- Effort: Quick fix, Moderate, Complex
```

### Stage 4: Solution Sourcing
```bash
# For each issue:
1. Check built-in GitHub solutions
2. Search open-source packages
3. Query community solutions
4. Generate fixes using free tools
5. Document BYOK alternatives
```

### Stage 5: Fix Application
```bash
# Apply fixes systematically:
1. Create feature branch
2. Apply critical fixes first
3. Update dependencies
4. Fix configuration issues
5. Improve code quality
6. Update documentation
7. Run tests
8. Create pull request
```

## Workflow Implementation

### File Structure
```
.github/
├── agents/
│   └── comprehensive-audit-fixer.agent.md (this file)
├── workflows/
│   ├── audit-scan.yml           # Stage 1-2: Scan and analyze
│   ├── audit-classify.yml       # Stage 3: Classify issues
│   ├── audit-fix.yml            # Stage 4-5: Source and fix
│   └── audit-verify.yml         # Post-fix verification
└── scripts/
    ├── scan-repository.js       # File discovery
    ├── analyze-issues.js        # Error detection
    ├── source-solutions.js      # Solution finding
    ├── apply-fixes.js           # Fix application
    └── verify-fixes.js          # Testing and validation
```

### Audit Frequency
- **On Push**: Quick lint and type checks
- **On PR**: Comprehensive code review
- **Daily**: Full repository audit
- **Weekly**: Dependency updates and security scan
- **Monthly**: Documentation audit

## Fix Categories and Solutions

### 1. Dependency Fixes
**Free Solutions:**
- Use `npm install` instead of `npm ci` for flexibility
- Update package.json with compatible versions
- Remove unused dependencies
- Use npm-check-updates for updates

**BYOK Options:**
- Snyk for advanced vulnerability detection
- Dependabot Pro for automated PRs

### 2. Code Quality Fixes
**Free Solutions:**
- ESLint with auto-fix
- Prettier for formatting
- TypeScript strict mode
- Remove unused imports

**BYOK Options:**
- SonarQube for deep analysis
- CodeClimate for metrics

### 3. Security Fixes
**Free Solutions:**
- npm audit --fix
- GitHub Security Advisories
- CodeQL scanning
- Dependabot alerts

**BYOK Options:**
- Snyk Premium
- WhiteSource Bolt

### 4. Configuration Fixes
**Free Solutions:**
- Validate JSON/YAML syntax
- Update to recommended configs
- Fix environment variable issues
- Correct paths and references

### 5. Documentation Fixes
**Free Solutions:**
- Generate JSDoc comments
- Update README from code
- Create API documentation
- Add inline comments

**BYOK Options:**
- AI-powered documentation (OpenAI)
- Professional technical writing services

## Error Handling

### Non-Fixable Issues
- Log for manual review
- Create GitHub issue with details
- Suggest investigation steps
- Link to documentation

### Breaking Changes
- Require manual approval
- Run comprehensive tests
- Create detailed PR description
- Provide rollback instructions

### Failed Fixes
- Revert changes
- Log error details
- Try alternative solutions
- Escalate to maintainers

## Monitoring and Reporting

### Metrics Tracked
- Issues found per category
- Fixes applied successfully
- Test pass rate after fixes
- Time to resolution
- Cost (API usage if BYOK)

### Reports Generated
- **Daily**: Quick issue summary
- **Weekly**: Detailed audit report
- **Monthly**: Trend analysis
- **Per-PR**: Impact assessment

## Integration Points

### GitHub Actions
- Trigger on push, PR, schedule
- Use matrix strategy for parallel scans
- Cache dependencies for speed
- Store artifacts for review

### GitHub API
- Create issues for complex problems
- Update PR descriptions
- Add review comments
- Manage labels and milestones

### External Tools (Free)
- ESLint API
- TypeScript Compiler API
- npm/yarn programmatic API
- Git operations

### BYOK Services (Optional)
- OpenAI API for code generation
- Claude API for analysis
- Snyk API for security
- Sentry for monitoring

## Configuration

### .github/audit-config.yml
```yaml
# Agent configuration
agent:
  enabled: true
  frequency: daily
  auto-fix: true
  create-prs: true

# Severity thresholds
thresholds:
  critical: 0  # Block on any critical issues
  high: 5      # Block if more than 5 high issues
  medium: 20   # Warn if more than 20 medium issues

# Solution preferences
solutions:
  prefer_open_source: true
  allow_byok: false  # Set to true to enable paid services
  byok_services:
    openai_api_key: ${OPENAI_API_KEY}  # Optional
    snyk_token: ${SNYK_TOKEN}          # Optional

# Fix categories
categories:
  dependencies: true
  code_quality: true
  security: true
  configuration: true
  documentation: true

# Exclusions
exclude:
  paths:
    - node_modules/
    - dist/
    - build/
    - .git/
  files:
    - "*.min.js"
    - "*.map"
```

## Success Criteria
- ✅ All critical issues resolved
- ✅ No high-severity issues in main branch
- ✅ Test coverage maintained or improved
- ✅ No breaking changes without approval
- ✅ Documentation kept up-to-date
- ✅ Zero cost for standard operations
- ✅ BYOK options clearly documented

## Rollback Procedures
1. Keep all changes in feature branches
2. Tag versions before major fixes
3. Maintain fix history in .github/fixes/
4. Provide revert commands in PR descriptions
5. Test rollback procedures monthly

## License Compliance
**Primary Tools (Free):**
- MIT License: ESLint, Prettier, Jest
- Apache 2.0: TypeScript
- ISC License: npm packages
- GPL Compatible: Various tools

**BYOK Services (Optional):**
- Commercial licenses required
- User provides own API keys
- Clear cost documentation
- Alternative free options listed

## Related Documentation
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [npm Documentation](https://docs.npmjs.com/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Security Best Practices](https://docs.github.com/code-security)

## Maintenance
- Review agent performance monthly
- Update solution database quarterly
- Refresh BYOK options annually
- Community feedback integration
- Keep up with new open-source tools

## Operational Runbook

### Common Error Scenarios & Solutions

#### Error: Build Failure After Audit
**Symptoms**: TypeScript compilation errors, missing dependencies
**Resolution**:
1. Check audit logs for applied changes
2. Run `npm install` to refresh dependencies
3. Review TypeScript errors in build output
4. Roll back to previous commit if needed: `git reset --hard HEAD~1`
**Prevention**: Always run build verification before committing fixes

#### Error: Test Suite Failures
**Symptoms**: Jest tests failing after auto-fixes
**Resolution**:
1. Review test output for specific failures
2. Check if fixes modified tested functionality
3. Update tests to match new behavior (if intentional)
4. Roll back changes if tests reveal regression
**Prevention**: Run test suite before and after fixes, maintain test coverage > 80%

#### Error: Npm Install Failures
**Symptoms**: Package-lock.json conflicts, version mismatches
**Resolution**:
1. Delete `node_modules/` and `package-lock.json`
2. Run `npm install` to regenerate lock file
3. Commit fresh package-lock.json
4. Re-run audit
**Prevention**: Use `npm install` instead of `npm ci` in CI/CD workflows

#### Error: Git Merge Conflicts
**Symptoms**: Audit creates conflicting changes
**Resolution**:
1. Fetch latest from main branch
2. Merge conflicts manually
3. Re-run affected tests
4. Verify build succeeds
**Prevention**: Pull latest changes before starting audit

#### Error: Resource Exhaustion
**Symptoms**: Out of memory, disk space full
**Resolution**:
1. Stop running audit process
2. Clear temporary files: `npm run clean`
3. Increase resource limits in configuration
4. Re-run audit with smaller scope
**Prevention**: Monitor resource usage, implement resource limits

#### Error: Network Timeout During Scans
**Symptoms**: External API calls failing, npm registry timeout
**Resolution**:
1. Check network connectivity
2. Verify firewall rules allow outbound connections
3. Increase timeout values in configuration
4. Retry audit operation
**Prevention**: Configure appropriate timeout values, use retry logic

### Escalation Procedures

**Level 1** - Automated Recovery (0-5 minutes)
- Auto-rollback on critical failures
- Retry with exponential backoff
- Switch to scan-only mode

**Level 2** - Team Lead Review (5-30 minutes)
- Manual review of audit findings
- Approve/reject proposed fixes
- Override auto-fix decisions

**Level 3** - Engineering Manager (30+ minutes)
- Critical security vulnerabilities
- Breaking changes affecting production
- System-wide failures

### Monitoring Dashboard Metrics

**Key Performance Indicators**:
- Audit completion rate: Target > 95%
- Fix success rate: Target > 80%
- Average audit time: Target < 5 minutes
- Critical issues found: Monitor trend
- False positive rate: Target < 10%

**Alert Thresholds**:
- Critical: Any security vulnerability HIGH or above
- High: Build failures, test failures > 20%
- Medium: Audit time > 10 minutes, fix rate < 70%
- Low: Minor code quality issues

### Maintenance Procedures

**Weekly**:
- Review audit success rates
- Update dependency scanning rules
- Check for new linting rules
- Validate fix patterns still work

**Monthly**:
- Update agent configuration
- Review and tune alert thresholds
- Audit the audit agent (meta-audit)
- Update documentation

**Quarterly**:
- Review and update error handling policies
- Evaluate new scanning tools
- Update security scanning rules
- Conduct disaster recovery test

### Testing Checklist

Before deploying agent updates:
- [ ] Run audit on test repository
- [ ] Verify all scan types execute
- [ ] Test error scenarios (network failure, invalid input)
- [ ] Validate rollback procedures work
- [ ] Check monitoring/alerting functions
- [ ] Review logs for sensitive data leakage
- [ ] Test with maximum resource load
- [ ] Verify security scanning detects test vulnerabilities

### Deployment Procedures

**Pre-Deployment**:
1. Run full test suite
2. Validate configuration changes
3. Create backup of current version
4. Schedule maintenance window if needed

**Deployment**:
1. Deploy to staging environment first
2. Run smoke tests
3. Monitor for 1 hour
4. Deploy to production
5. Monitor for 24 hours

**Post-Deployment**:
1. Verify health checks pass
2. Review audit success rate
3. Check error logs for anomalies
4. Validate metrics collection
5. Document any issues encountered

**Rollback Criteria**:
- Health checks failing
- Error rate > 10%
- Critical functionality broken
- Security vulnerability introduced

### Emergency Procedures

**Emergency Stop**:
```bash
# Stop all running audits
pkill -f "audit-agent"

# Disable scheduled audits
gh workflow disable audit-scan.yml

# Notify team
echo "Audit agent emergency stopped" | slack-notify
```

**Emergency Rollback**:
```bash
# Revert to last known good version
git checkout tags/audit-agent-v1.x.x

# Rebuild and deploy
npm run build
npm run deploy

# Re-enable workflows
gh workflow enable audit-scan.yml
```

### Support Contacts

- **Primary**: Engineering Team - engineering@example.com
- **Secondary**: DevOps Team - devops@example.com  
- **Escalation**: CTO - cto@example.com
- **Security Issues**: Security Team - security@example.com

### Useful Commands

```bash
# Check audit agent status
npm run audit:status

# Run manual audit
npm run audit:manual

# View recent audit logs
npm run audit:logs

# Test audit on single file
npm run audit:test-single -- path/to/file.ts

# Generate audit report
npm run audit:report

# Validate configuration
npm run audit:validate-config

# Run health check
curl http://localhost:3000/health/audit-agent/ready
```
