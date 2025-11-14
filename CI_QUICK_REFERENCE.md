# CI/CD Quick Reference

## ✅ Current Status

All CI/CD checks are **passing** for this Node.js/TypeScript project:
- Lint: ✓ ESLint passes
- Build: ✓ TypeScript compiles successfully
- Tests: ✓ 23/23 tests pass (88.57% coverage)

## 🚀 Running CI Checks Locally

```bash
# Install dependencies (first time only)
npm install

# Run all checks
npm run lint && npm run build && npm test

# Or run individually
npm run lint          # ESLint
npm run build         # TypeScript compilation
npm test              # Jest tests with coverage
npm run test:watch    # Watch mode for development
```

## 📋 Actual GitHub Actions Workflows

### Main CI/CD Pipeline (`ci.yml`)
**Triggers:** Push/PR to `main` or `develop` branches

**Jobs:**
- `test` - Runs on Node.js 18.x and 20.x (matrix)
  - Installs dependencies
  - Runs linter
  - Builds project
  - Runs tests
  - Uploads coverage (Node 20.x only)
- `security` - Security audit with npm audit
- `build-docker` - Docker image build (main branch only)

### Other Workflows
- `audit-scan.yml` - Comprehensive code audit (weekly/manual)
- `audit-classify.yml` - Issue classification
- `audit-fix.yml` - Automated fixes
- `audit-verify.yml` - Test and PR creation
- `agent-orchestrator.yml` - AI agent builder orchestrator
- `agent-discovery.yml` - Framework discovery
- `auto-fix-dependencies.yml` - Dependency updates

## ⚠️ About "Backend CI" and "Extension CI" Phantom Checks

If you see these failing checks on PRs:
- Backend CI / test (3.9, 3.10, 3.11)
- Extension CI / build

**These are phantom checks** - they don't exist in this repository's workflows!

### Why They Appear
These are likely stale required status checks in GitHub's branch protection rules.

### How to Fix
Repository administrators should:
1. Go to Settings → Branches → Branch protection rules
2. Remove the phantom checks from required status checks
3. Add only the actual checks:
   - Test (18.x)
   - Test (20.x)
   - Security Audit

**See [PHANTOM_CHECKS_RESOLUTION.md](.github/workflows/PHANTOM_CHECKS_RESOLUTION.md) for detailed instructions.**

## 🛠️ Workflow Validation

Run the validation script to check for issues:

```bash
./.github/scripts/validate-workflows.sh
```

This will:
- Validate all workflow YAML files
- Check for language mismatches
- List all actual jobs
- Identify phantom checks
- Run local CI checks
- Provide remediation steps

## 📝 Required Status Checks for Branch Protection

**Recommended configuration:**
- ✅ Test (18.x) - Node.js 18.x compatibility
- ✅ Test (20.x) - Node.js 20.x compatibility
- ✅ Security Audit - npm audit checks

**Do NOT add:**
- ❌ Backend CI / test (any version) - doesn't exist
- ❌ Extension CI / build - doesn't exist

## 🐛 Troubleshooting

### CI fails with "command not found"
Ensure dependencies are installed:
```bash
npm install
```

### TypeScript compilation errors
Check your TypeScript version matches tsconfig.json requirements:
```bash
npx tsc --version  # Should be 5.x
```

### Tests fail locally but pass in CI
Ensure environment variables are set:
```bash
export JWT_SECRET=test-secret-for-ci
export NODE_ENV=test
npm test
```

### Docker build fails
Ensure Docker is installed and running:
```bash
docker --version
docker build -t stackbrowseragent:test .
```

## 📚 Documentation

- [Main README](README.md) - Project overview and setup
- [API Documentation](API.md) - API endpoints and authentication
- [Architecture](ARCHITECTURE.md) - System design and structure
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [CI Status](./github/workflows/CI_STATUS.md) - Detailed workflow documentation
- [Phantom Checks Guide](.github/workflows/PHANTOM_CHECKS_RESOLUTION.md) - Fix phantom CI checks

## 💡 Tips

1. **Always run checks before pushing:**
   ```bash
   npm run lint && npm run build && npm test
   ```

2. **Use watch mode during development:**
   ```bash
   npm run test:watch
   ```

3. **Check workflow syntax before committing:**
   ```bash
   ./.github/scripts/validate-workflows.sh
   ```

4. **Update documentation when changing workflows**

## 🔒 Security

- npm audit runs on every CI build
- CodeQL scanning enabled (if configured)
- Trivy container scanning for Docker images
- Rate limiting on all API endpoints
- JWT-based authentication

## 📞 Support

- **Issues:** Open a GitHub issue
- **Discussions:** Use GitHub Discussions
- **Security:** See SECURITY.md for reporting vulnerabilities

---

**Last Updated:** 2025-11-12  
**Project:** stackBrowserAgent  
**Type:** Node.js/TypeScript Express API
