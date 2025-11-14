# Phantom CI Checks Resolution Guide

## Problem Statement

Pull requests and pushes show failing checks for:
- **Backend CI / test (3.9)** - Python 3.9
- **Backend CI / test (3.10)** - Python 3.10
- **Backend CI / test (3.11)** - Python 3.11
- **Extension CI / build**

## Root Cause

These checks are **phantom checks** - they do not exist in any GitHub Actions workflow file in this repository. They are most likely:

1. **Stale branch protection requirements** from a previous configuration
2. **Incorrectly configured required status checks** in GitHub settings
3. **Checks from a different repository** if there was confusion

## Verification

We verified that these checks don't exist by:

### 1. Searching All Workflow Files
```bash
grep -r "Backend CI\|Extension CI\|python-version: '3\.[0-9]'" .github/workflows/*.yml
# Result: No matches in any active .yml files
```

### 2. Listing All Actual Workflow Jobs
The repository contains these **actual** workflows:

#### Main CI/CD Pipeline (`ci.yml`)
- ✅ `test` (matrix: Node.js 18.x, 20.x)
- ✅ `security` (npm audit)
- ✅ `build-docker` (Docker image build)

#### Audit Workflows
- ✅ `audit-scan.yml` - Discovery & analysis
- ✅ `audit-classify.yml` - Issue classification
- ✅ `audit-fix.yml` - Solution sourcing & fixes
- ✅ `audit-verify.yml` - Test & PR creation

#### Agent Builder Workflows
- ✅ `agent-orchestrator.yml` - Master orchestrator
- ✅ `agent-discovery.yml` - Framework discovery
- ✅ `auto-fix-dependencies.yml` - Dependency auto-fix

### 3. Project Type Confirmation
This is a **Node.js/TypeScript** project:
- ✅ Uses npm/package.json
- ✅ TypeScript compilation (tsc)
- ✅ Jest testing framework
- ✅ Express.js backend
- ✅ No Python code or requirements.txt

**NOT** a Python project with separate backend/extension components.

## Solution

### For Repository Maintainers

#### Step 1: Update Branch Protection Rules

1. Go to your repository settings:
   ```
   https://github.com/stackconsult/stackBrowserAgent/settings/branches
   ```

2. For each protected branch (typically `main` and `develop`):
   - Click **"Edit"** on the branch protection rule
   - Scroll to **"Require status checks to pass before merging"**
   - In the search box under "Status checks that are required", find and **remove**:
     * `Backend CI / test (3.9)`
     * `Backend CI / test (3.10)`
     * `Backend CI / test (3.11)`
     * `Extension CI / build`

3. **Add** the actual status checks that should be required:
   * `Test (18.x)` (from CI/CD workflow)
   * `Test (20.x)` (from CI/CD workflow)
   * `Security Audit` (from CI/CD workflow)

4. Click **"Save changes"**

#### Step 2: Verify the Fix

After updating branch protection:

1. Create a new PR or push to an existing one
2. Check the "Checks" tab - you should only see actual workflow runs
3. Verify no phantom checks appear

### For Contributors

If you see these phantom checks failing:

1. **Don't worry** - they're not real workflow failures
2. Ask a repository maintainer to update branch protection rules (see above)
3. Verify your actual changes pass the real CI checks:
   ```bash
   npm run lint && npm run build && npm test
   ```

## Validation

Use the provided validation script to check for issues:

```bash
./.github/scripts/validate-workflows.sh
```

This script will:
- ✅ Validate YAML syntax of all workflows
- ✅ Check for language mismatches (Python in Node.js project)
- ✅ List all actual workflow jobs
- ✅ Identify phantom checks
- ✅ Run local CI checks (lint, build, test)
- ✅ Provide specific remediation instructions

## Current Status

### All Local Checks Pass ✅

```bash
$ npm run lint && npm run build && npm test

# Lint: ✓ Passed
# Build: ✓ Passed  
# Tests: ✓ 23/23 passed (88.57% coverage)
```

### Workflow Files Validated ✅

All 8 active workflow files have valid YAML syntax and appropriate configurations for a Node.js project.

### No Workflow-Side Issues ✅

The workflows themselves are correctly configured. The issue is purely in GitHub's branch protection settings.

## Preventing Future Issues

### 1. Use the Validation Script

Run before pushing workflow changes:
```bash
./.github/scripts/validate-workflows.sh
```

### 2. Document Required Checks

Keep a list of actual required checks in your branch protection documentation.

### 3. Regular Audits

Periodically review branch protection rules to ensure they match actual workflows.

### 4. Workflow Naming Convention

Use clear, consistent naming for workflows and jobs:
- Workflow name: `name: CI/CD`
- Job name: `test:` (creates status check "Test")
- Matrix strategy: automatically adds matrix values to check name

## Technical Details

### Why Phantom Checks Appear

GitHub branch protection rules allow specifying required status checks by name. These checks can be:
1. From GitHub Actions workflows (most common)
2. From external CI systems (Travis, Jenkins, etc.)
3. From GitHub Apps
4. Manual status checks via API

If a required check is configured but never reports, it will:
- Show as "Expected" but never complete
- Block merging if required
- Appear in the PR checks list as pending or failed

### How Status Checks Are Named

In GitHub Actions:
- Basic job: `job_name` → Status check: "job_name"
- Matrix job: `job_name` (matrix: `node: [18, 20]`) → Status checks: "job_name (18)", "job_name (20)"
- Workflow name doesn't affect status check name

Example from `ci.yml`:
```yaml
name: CI/CD  # Workflow name (for UI only)
jobs:
  test:      # Job name (becomes status check)
    strategy:
      matrix:
        node-version: [18.x, 20.x]  # Creates "test (18.x)" and "test (20.x)"
```

## Related Files

- [CI/CD Workflow](./ci.yml) - Main CI pipeline
- [CI Status Documentation](./CI_STATUS.md) - Comprehensive workflow documentation
- [Validation Script](../.github/scripts/validate-workflows.sh) - Automated validation tool
- [Disabled Workflows](./DISABLED_WORKFLOWS.md) - Workflows that are intentionally disabled

## Summary

✅ **The workflows are working correctly**  
✅ **All local tests pass**  
✅ **The issue is in branch protection settings, not the code**  
❌ **Remove phantom checks from branch protection to fix**

## Questions?

If you still see phantom checks after updating branch protection:

1. Clear browser cache and reload the PR
2. Check if there are multiple branch protection rules (e.g., from CODEOWNERS)
3. Verify you have admin access to the repository
4. Check GitHub organization-level settings if applicable
5. Contact GitHub Support if the issue persists

## Changelog

- **2025-11-12**: Created comprehensive phantom checks resolution guide
- **2025-11-12**: Removed remaining Python reference from agent-orchestrator.yml
- **2025-11-12**: Created validation script for workflow checking
- **2025-11-12**: Verified all CI checks pass locally
