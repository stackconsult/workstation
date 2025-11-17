# Build Error Prevention Guide

## Problem

Documentation was updated without ensuring the build still works, leading to:
- Missing dependencies (node_modules not installed)
- Build failures (TypeScript errors)
- Test failures
- Broken deployment pipeline

## Solution

This guide ensures all code changes are validated before commit.

---

## 🛡️ Automated Prevention System

### 1. Pre-Commit Validation Script

**Location:** `scripts/pre-commit-check.sh`

**What it checks:**
- ✅ Dependencies installed
- ✅ Linting passes
- ✅ Build succeeds
- ✅ Tests pass
- ✅ Documentation matches code
- ✅ No security vulnerabilities

**How to use:**

```bash
# Run before every commit
./scripts/pre-commit-check.sh

# Or add to package.json
npm run precommit
```

### 2. GitHub Actions Workflow

**Location:** `.github/workflows/validate.yml`

**Triggers:**
- Every push
- Every pull request
- Manual workflow dispatch

**Steps:**
1. Install dependencies
2. Run linter
3. Build TypeScript
4. Run tests
5. Security audit
6. Documentation validation

---

## 🔧 Manual Validation Checklist

Before making any commit, run these commands:

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Check linting
npm run lint

# 3. Build the project
npm run build

# 4. Run tests
npm test

# 5. Security check
npm audit

# 6. Validate documentation
./scripts/pre-commit-check.sh
```

**All must pass before committing!**

---

## 📋 Common Issues & Fixes

### Issue 1: "Cannot find module" errors

**Symptom:**
```
error TS2307: Cannot find module 'express' or its corresponding type declarations
```

**Fix:**
```bash
# Remove and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: "jest: not found"

**Symptom:**
```
sh: 1: jest: not found
```

**Fix:**
```bash
# Install dependencies
npm install

# Verify jest is installed
npx jest --version
```

### Issue 3: Build passes but tests fail

**Symptom:**
```
npm run build ✓
npm test ✗
```

**Fix:**
```bash
# Check test output for specific failures
npm test -- --verbose

# Fix the failing tests
# Then re-run build AND tests
npm run build && npm test
```

### Issue 4: Documentation mentions non-existent features

**Symptom:**
- README mentions features not in code
- Links to files that don't exist

**Fix:**
1. Run: `./scripts/pre-commit-check.sh`
2. Check output for documentation mismatches
3. Either:
   - Add the missing code/files, OR
   - Update documentation to match reality

### Issue 5: Build works locally but fails in CI

**Symptom:**
- Local: `npm run build` ✓
- GitHub Actions: Build fails ✗

**Causes:**
- Different Node.js version
- Missing environment variables
- Platform-specific issues

**Fix:**
```bash
# Test with same Node version as CI
nvm use 20
npm run build

# Check .github/workflows for Node version
grep "node-version" .github/workflows/*.yml

# Ensure .env.example has all required vars
```

---

## 🎯 Best Practices

### 1. **Always Run Full Validation**

```bash
# Single command to validate everything
npm run lint && npm run build && npm test
```

### 2. **Document-Then-Code (Wrong) ❌**

```
1. Update README with new feature
2. Commit documentation
3. Later: Add code
```

**Problem:** Broken state between commits

### 3. **Code-Then-Document (Right) ✅**

```
1. Write code
2. Write tests
3. Verify build passes
4. Update documentation
5. Commit everything together
```

### 4. **Use Pre-commit Hooks**

Add to `package.json`:
```json
{
  "scripts": {
    "precommit": "./scripts/pre-commit-check.sh",
    "prepare": "husky install"
  }
}
```

Then install husky:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run precommit"
```

### 5. **Test in Clean Environment**

```bash
# Simulate CI environment
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

## 🚀 Quick Commands

### Full validation (recommended)
```bash
npm install && npm run lint && npm run build && npm test
```

### With script
```bash
./scripts/pre-commit-check.sh
```

### Check specific area
```bash
npm run lint        # Code quality
npm run build       # TypeScript compilation
npm test            # Test suite
npm audit           # Security
```

---

## 📊 CI/CD Pipeline

### Current Pipeline

```
┌─────────────┐
│   Trigger   │ (push/PR)
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Checkout   │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Setup Node │ (v20)
└─────┬───────┘
      │
      ▼
┌─────────────┐
│npm install  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  npm lint   │ ─── ✗ Fail → Stop
└─────┬───────┘
      │ ✓
      ▼
┌─────────────┐
│ npm build   │ ─── ✗ Fail → Stop
└─────┬───────┘
      │ ✓
      ▼
┌─────────────┐
│  npm test   │ ─── ✗ Fail → Stop
└─────┬───────┘
      │ ✓
      ▼
┌─────────────┐
│ npm audit   │ ─── ⚠ Warn (continue)
└─────┬───────┘
      │ ✓
      ▼
┌─────────────┐
│   SUCCESS   │
└─────────────┘
```

### Required Checks

All PRs must pass:
1. ✅ Linting
2. ✅ Build
3. ✅ Tests
4. ✅ Security audit (warnings ok, errors fail)

---

## 🔍 Monitoring

### Check PR Status

```bash
# View GitHub Actions status
gh pr checks

# View detailed logs
gh run view --log
```

### Local Status

```bash
# Quick health check
npm run lint && echo "✓ Lint OK" || echo "✗ Lint FAIL"
npm run build && echo "✓ Build OK" || echo "✗ Build FAIL"
npm test && echo "✓ Tests OK" || echo "✗ Tests FAIL"
```

---

## 📝 Commit Message Template

When fixing build issues:

```
Fix: Resolve build errors and add validation

- Install missing dependencies
- Fix TypeScript compilation errors
- Ensure all tests pass
- Add pre-commit validation script
- Update documentation to match code

Fixes #<issue_number>
```

---

## 🆘 Emergency Fix Process

If build is broken in main/production:

1. **Identify the breaking commit**
   ```bash
   git log --oneline -10
   ```

2. **Revert if necessary**
   ```bash
   git revert <commit-hash>
   ```

3. **Fix in new branch**
   ```bash
   git checkout -b fix/build-errors
   # Fix issues
   npm install && npm run build && npm test
   git commit -m "Fix: Resolve build errors"
   ```

4. **Create PR with all checks**
   ```bash
   gh pr create --title "Fix: Build errors" --body "Fixes build issues"
   ```

---

## 📚 Additional Resources

- **Pre-commit script:** `scripts/pre-commit-check.sh`
- **CI workflow:** `.github/workflows/validate.yml`
- **Testing guide:** `tests/README.md`
- **Build guide:** `BUILD.md`

---

## ✅ Success Criteria

Before any commit:
- [ ] Dependencies installed (`npm install`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Security audit clean (`npm audit`)
- [ ] Documentation accurate
- [ ] Pre-commit script passes

**Zero tolerance for broken builds!**

---

**Last Updated:** November 17, 2025  
**Maintainer:** Development Team  
**Related:** BUILD.md, CONTRIBUTING.md, CI/CD workflows
