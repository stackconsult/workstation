---
name: Dependency Installer Agent
description: Automatically fixes npm dependency installation issues in CI/CD workflows by using npm install instead of npm ci when package-lock.json issues occur
---

# Dependency Installer Agent

## Purpose
This agent monitors and automatically corrects dependency installation failures in GitHub Actions workflows. It ensures that CI/CD pipelines can successfully install dependencies even when `package-lock.json` compatibility issues arise.

## Problem Statement
The CI/CD workflow fails with error: "The `npm ci` command can only install with an existing package-lock.json or npm-shrinkwrap.json with lockfileVersion >= 1"

This occurs because:
- `npm ci` requires a valid and compatible `package-lock.json` file
- Lock file format incompatibilities can occur across different npm versions
- Missing or corrupted lock files prevent CI/CD from running

## Solution
Use `npm install` instead of `npm ci` in CI/CD workflows to provide more flexibility with dependency resolution.

## Implementation

### Workflow Configuration
Update `.github/workflows/ci.yml` to use `npm install`:

```yaml
- name: Install dependencies
  run: npm install
```

Instead of:

```yaml
- name: Install dependencies
  run: npm ci
```

## Files to Monitor
- `.github/workflows/ci.yml`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/extension-ci.yml`
- `package.json`
- `package-lock.json`

## Automatic Correction Rules

1. **When CI/CD fails with npm ci error:**
   - Replace `npm ci` with `npm install` in all workflow files
   - Commit with message: "fix: Use npm install for better compatibility in CI/CD"

2. **When package.json is updated:**
   - Verify package-lock.json exists and is committed
   - If missing, run `npm install` locally and commit the lock file

3. **When lock file conflicts occur:**
   - Regenerate package-lock.json using `npm install`
   - Ensure lock file format is compatible with project's node version

## License Compliance
This solution uses:
- **MIT License** (free, permissive, no authentication required)
- **GitHub Actions** (built-in, free for public repositories)
- **npm** (free, open-source package manager)

No paid licenses or authentication required for implementation.

## Monitoring
The agent should trigger on:
- Pull request failures related to dependency installation
- Push events to main/develop branches that fail CI/CD
- Manual workflow dispatch for dependency fixes

## Success Criteria
- CI/CD workflows complete successfully
- Dependencies install without errors
- No manual intervention required for common lock file issues

## Rollback Plan
If issues persist after using `npm install`:
1. Regenerate package-lock.json locally with correct npm version
2. Commit fresh lock file
3. Revert to `npm ci` for stricter dependency resolution

## Related Documentation
- [npm ci vs npm install](https://docs.npmjs.com/cli/v9/commands/npm-ci)
- [GitHub Actions Node.js setup](https://docs.github.com/en/actions/guides/building-and-testing-nodejs)
- [Package lock file troubleshooting](https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json)
