# Dependabot Scope Configuration

## Purpose
This document explains why Dependabot is configured to monitor only the root `package.json` and not subdirectories.

## Current Configuration
- **Monitored**: `/package.json` (root production code only)
- **Ignored**: All 35 subdirectory package.json files

## Rationale

### Production Code (Monitored)
The root `/package.json` contains the main production dependencies for **stackbrowseragent**, the core browser automation platform. This is the only package.json that:
- Is deployed to production (Railway/Docker)
- Requires regular security updates
- Affects end-user functionality
- Has a defined release cycle

### Non-Production Code (Ignored)

#### 1. Agents (9 package.json files)
Location: `/agents/agent*/package.json`

These are individual agent implementations that:
- Are experimental/research projects
- Have independent lifecycles
- Are not deployed as part of the main application
- May use outdated dependencies intentionally for testing

Examples:
- agent8-auditor
- agent9-optimization-magician
- agent10-guard-rails
- agent11-data-analytics
- agent12-qa-intelligence
- agent17 (project builder)
- agent21-universal-builder

#### 2. MCP Containers (20 package.json files)
Location: `/mcp-containers/*/package.json`

These are Model Context Protocol server containers that:
- Are microservices with independent deployment cycles
- May be disabled or experimental
- Have their own update schedules
- Should not trigger main repo PRs

Examples:
- 00-base-mcp (template)
- 01-selector-mcp
- 02-go-backend-browser-automation-engineer-mcp
- ... (20 total)

#### 3. Modules (4 package.json files)
Location: `/modules/*/package.json`

These are module implementations that:
- Are backend/UI pairs for specific features
- May be in development or deprecated
- Have separate testing requirements

Examples:
- 01-selectors/ui and backend
- 02-go-backend-browser-automation-engineer/backend
- 03-database-orchestration-specialist/backend
- 04-integration-specialist-slack-webhooks/backend

#### 4. Tools (1 package.json file)
Location: `/tools/coding-agent/package.json`

This is a coding agent tool that:
- Is a development utility, not production code
- Has its own independent lifecycle

#### 5. Agent Server (1 package.json file)
Location: `/agent-server/nodejs/package.json`

This is an HTTP API wrapper that:
- Is experimental
- Has independent deployment requirements
- May use specific dependency versions

## Repository Statistics
- **Total package.json files**: 36
- **Production (monitored)**: 1
- **Non-production (ignored)**: 35

## Benefits of This Configuration

### 1. Reduced Noise
- No PRs for experimental or test code
- Focus on production security updates only
- Cleaner PR queue

### 2. Better Resource Utilization
- Reduced GitHub Actions minutes
- Less reviewer time wasted
- Faster PR review cycles

### 3. Clearer Separation of Concerns
- Production dependencies managed separately
- Experimental code can use specific versions
- Each component has appropriate update cadence

## How to Update Non-Production Dependencies

If you need to update dependencies in subdirectories:

### Manual Updates
```bash
# Navigate to the specific directory
cd agents/agent17
npm update

# Or update specific package
npm install package-name@latest
```

### Bulk Updates (if needed)
```bash
# Update all subdirectory dependencies (use with caution)
find . -name "package.json" -not -path "*/node_modules/*" -not -path "./package.json" -execdir npm update \;
```

## Verification

To verify the Dependabot configuration is working correctly:

1. **Check GitHub Settings**: Go to `https://github.com/creditXcredit/workstation/settings/security_analysis`
   - Dependabot should show as enabled
   - Only 1 package ecosystem should be monitored (npm at /)

2. **Monitor PRs**: After this change, Dependabot should only create PRs for:
   - Dependencies in the root `package.json`
   - GitHub Actions in `.github/workflows/`

3. **What to Watch For**:
   - ✓ PRs with title like: "chore(deps): bump axios from 1.6.0 to 1.6.1"
   - ✗ PRs mentioning subdirectories like: "chore(deps): bump axios in /agents/agent17"

If you see PRs for subdirectories, the configuration needs to be reviewed.

## Configuration File
See `.github/dependabot.yml` for the actual configuration.

## Questions?
If you need to add a new production component that should be monitored by Dependabot, update `.github/dependabot.yml` to include a new entry with the appropriate `directory` setting.

## Last Updated
2025-11-24 - Initial scope restriction configuration
