# Dependabot Configuration

## Overview
This repository uses GitHub Dependabot to automatically monitor and update dependencies. The configuration has been optimized to focus on production builds only.

## Configuration Strategy

### What Dependabot Monitors
- **Root package.json ONLY** - Production dependencies in `/package.json`
- **GitHub Actions** - Workflow dependencies in `.github/workflows/`

### What Dependabot IGNORES
- **Development dependencies** - All packages in `devDependencies` (test tools, linters, etc.)
  - **Note**: The `development-dependencies` group is preserved in the configuration for automation compatibility, but the `allow` directive restricts actual monitoring to production dependencies only
- **Major version updates** - Breaking changes that require manual review
- **Subdirectories** - All package.json files in:
  - `agents/*` - Agent-specific dependencies
  - `mcp-containers/*` - MCP container dependencies
  - `modules/*` - Module-specific dependencies  
  - `tools/*` - Tool-specific dependencies
  - `examples/*` - Example code
  - `tests/*` - Test code
  - `agent-server/*` - Agent server code

## Why This Configuration?

### Production Focus
By monitoring only production dependencies, we ensure:
- PRs are relevant to actual deployment
- No noise from test/dev tool updates
- Reduced maintenance burden
- Focus on security updates for live code

### Subdirectory Exclusion
Subdirectories are excluded because:
- They contain agent/tool-specific code
- They use independent dependency versions
- They may use test/mock/example data
- Updates should be managed per-agent/tool

### Major Version Exclusion
Major versions are ignored because:
- They contain breaking changes
- They require manual testing
- They need code refactoring
- They should be reviewed carefully

## How It Works

### Weekly Schedule
- **Day**: Monday
- **Time**: GitHub's default time
- **Frequency**: Weekly (not daily/monthly)

### PR Limits
- **Max Open PRs**: 5
- **Prevents**: PR spam
- **Ensures**: Manageable review queue

### Grouping Strategy
- **Production Dependencies**: Minor and patch updates grouped together
- **Development Dependencies**: Group preserved for automation compatibility but won't create PRs
- **Benefits**: Configuration structure maintained while restricting to production-only updates
- **Reduces**: PR overhead

### Labels
- `dependencies` - All dependency updates
- `production` - Production-only updates
- `github-actions` - GitHub Actions updates

### Auto-Assignment
- **Reviewer**: @stackconsult
- **Ensures**: Proper review oversight

## Configuration File

Location: `.github/dependabot.yml`

```yaml
version: 2
updates:
  # PRODUCTION DEPENDENCIES ONLY
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "production"
    reviewers:
      - "stackconsult"
    groups:
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
    allow:
      - dependency-type: "production"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  # GITHUB ACTIONS
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    labels:
      - "dependencies"
      - "github-actions"
```

## Expected Behavior

### What You'll See
- **Weekly PRs** for production dependency updates (minor/patch only)
- **Weekly PRs** for GitHub Actions updates
- **Grouped PRs** when multiple dependencies can be updated together
- **Max 5 PRs** at any time

### What You WON'T See
- PRs for development dependencies (Jest, ESLint, TypeScript, etc.)
- PRs for major version updates
- PRs for subdirectory dependencies
- PRs for test/mock/example code

## Manual Updates

### Development Dependencies
To update dev dependencies manually:
```bash
# Update all dev dependencies
npm update --save-dev

# Update specific dev dependency
npm update @types/node --save-dev
```

### Major Versions
To update to major versions manually:
```bash
npm install <package>@latest
```

### Subdirectory Dependencies
To update agent/tool dependencies:
```bash
cd agents/agent8
npm update
```

## Troubleshooting

### Too Many PRs
If you see more than 5 PRs:
- Check if limit increased in config
- Verify `open-pull-requests-limit: 5` is set

### Wrong Dependencies Updated
If dev dependencies are being updated:
- Verify `allow: dependency-type: production` is set
- Check package.json has correct dependency sections

### Missing Updates
If critical updates are missing:
- Check `ignore` patterns aren't too broad
- Verify `schedule` is set correctly
- Check GitHub Actions logs for errors

## Security Updates

Dependabot will still create PRs for security vulnerabilities regardless of these settings. Security always takes priority.

## Further Reading

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependabot Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
