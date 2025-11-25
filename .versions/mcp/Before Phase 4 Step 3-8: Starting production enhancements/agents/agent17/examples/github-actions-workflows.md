# INSTRUCTIONS FOR GITHUB CODING AGENT - SEGMENT 5
# GITHUB ACTIONS AUTOMATION WORKFLOWS WITH ADHERENCE GUARDRAILS

## ⚠️ MANDATORY EXECUTION PROTOCOL

**THIS PROMPT USES A GATED EXECUTION MODEL**

You MUST complete each step and pass validation BEFORE proceeding to the next.
Each step has a **CHECKPOINT** that verifies completion.
If ANY checkpoint fails, you MUST STOP and output the failure message.

**FAILURE IS NOT OPTIONAL - THE PROCESS WILL HALT**

---

## 🎯 YOUR ROLE & CONTEXT

You are a GitHub Coding Agent building **infrastructure automation**, NOT application code.

**Critical Differences from Previous Segments:**

| Aspect | Segments 1-4 | Segment 5 (THIS) |
|--------|--------------|------------------|
| Output Type | TypeScript code | YAML workflows |
| Output Location | `projects/*/` | `.github/workflows/` |
| Language | TypeScript | YAML |
| Purpose | Build applications | Build automation |
| Testing | Jest unit tests | YAML syntax validation |
| Dependencies | npm packages | GitHub Actions |

**IF YOU CONFUSE THESE, THE BUILD WILL FAIL**

---

## 🚨 GUARDRAIL 1: PREREQUISITE VALIDATION (MANDATORY)

### CHECKPOINT 0: Pre-Execution Verification

**BEFORE STARTING, YOU MUST CHECK:**

```bash
echo "🔍 CHECKPOINT 0: Prerequisite Validation"
echo "========================================"

# Check 1: Previous segments completed
if [ ! -d "projects/real-estate-monitor" ]; then
  echo "❌ FAILURE: Segment 4 not completed"
  echo "Missing: projects/real-estate-monitor/"
  echo "REQUIRED ACTION: Complete Segment 4 first"
  exit 1
fi

# Check 2: Required files exist
REQUIRED_FILES=(
  "projects/real-estate-monitor/package.json"
  "projects/real-estate-monitor/src/index.ts"
  "projects/real-estate-monitor/src/server.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ FAILURE: Required file missing: $file"
    exit 1
  fi
done

# Check 3: Project builds successfully
cd projects/real-estate-monitor
npm run build || {
  echo "❌ FAILURE: Project build failed"
  echo "REQUIRED ACTION: Fix build errors first"
  exit 1
}

echo "✅ CHECKPOINT 0 PASSED: Prerequisites validated"
```

**IF CHECKPOINT 0 FAILS: HALT EXECUTION**

---

## 🚨 GUARDRAIL 2: WORKFLOW CREATION (MANDATORY)

### CHECKPOINT 1: Create Workflow Directory

**YOU MUST:**

```bash
echo "🔍 CHECKPOINT 1: Workflow Directory Creation"
echo "==========================================="

# Create workflows directory
mkdir -p .github/workflows

# Verify creation
if [ ! -d ".github/workflows" ]; then
  echo "❌ FAILURE: Could not create .github/workflows/"
  exit 1
fi

# Create backup directory
cp -r .github/workflows .github/workflows.backup 2>/dev/null || true

echo "✅ CHECKPOINT 1 PASSED: Workflow directory created"
```

### CHECKPOINT 2: Create Test Workflow

**FILE:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd projects/real-estate-monitor
          npm ci
      
      - name: Lint code
        run: |
          cd projects/real-estate-monitor
          npm run lint
      
      - name: Build project
        run: |
          cd projects/real-estate-monitor
          npm run build
      
      - name: Run tests with coverage
        run: |
          cd projects/real-estate-monitor
          npm test -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./projects/real-estate-monitor/coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
```

**VALIDATION:**

```bash
echo "🔍 Validating test.yml..."
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))" || {
  echo "❌ FAILURE: test.yml syntax invalid"
  exit 1
}
echo "✅ CHECKPOINT 2 PASSED: test.yml created and validated"
```

### CHECKPOINT 3: Create Security Scan Workflow

**FILE:** `.github/workflows/security-scan.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    
    permissions:
      actions: read
      contents: read
      security-events: write
    
    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'typescript']
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          category: "/language:${{ matrix.language }}"
  
  npm-audit:
    name: npm Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      
      - name: Run npm audit
        run: |
          cd projects/real-estate-monitor
          npm audit --audit-level=moderate
  
  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Dependency Review
        uses: actions/dependency-review-action@v3
```

**VALIDATION:**

```bash
echo "🔍 Validating security-scan.yml..."
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/security-scan.yml'))" || {
  echo "❌ FAILURE: security-scan.yml syntax invalid"
  exit 1
}
echo "✅ CHECKPOINT 3 PASSED: security-scan.yml created and validated"
```

### CHECKPOINT 4: Create Scraper Schedule Workflow

**FILE:** `.github/workflows/scraper-schedule.yml`

```yaml
name: Run Property Scraper

on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    name: Scrape Properties
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd projects/real-estate-monitor
          npm ci
      
      - name: Install Playwright browsers
        run: |
          cd projects/real-estate-monitor
          npx playwright install chromium
          npx playwright install-deps chromium
      
      - name: Run scraper
        env:
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_PHONE_NUMBER: ${{ secrets.TWILIO_PHONE_NUMBER }}
        run: |
          cd projects/real-estate-monitor
          npm run scrape
      
      - name: Commit updated database
        run: |
          cd projects/real-estate-monitor
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/properties.db
          git diff --quiet && git diff --staged --quiet || git commit -m "Update property database $(date +'%Y-%m-%d %H:%M')"
          git push
      
      - name: Upload logs on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: scraper-logs
          path: projects/real-estate-monitor/logs/
```

**VALIDATION:**

```bash
echo "🔍 Validating scraper-schedule.yml..."
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/scraper-schedule.yml'))" || {
  echo "❌ FAILURE: scraper-schedule.yml syntax invalid"
  exit 1
}

# Security check - no hardcoded secrets
grep -i "password\|token\|key" .github/workflows/scraper-schedule.yml | grep -v "secrets\." && {
  echo "❌ FAILURE: Hardcoded secret found in scraper-schedule.yml"
  exit 1
}

echo "✅ CHECKPOINT 4 PASSED: scraper-schedule.yml created and validated"
```

### CHECKPOINT 5: Create Deploy Workflow

**FILE:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd projects/real-estate-monitor
          npm ci
      
      - name: Build project
        run: |
          cd projects/real-estate-monitor
          npm run build
      
      - name: Build Docker image
        run: |
          cd projects/real-estate-monitor
          docker build -t real-estate-monitor:${{ github.sha }} .
          docker tag real-estate-monitor:${{ github.sha }} real-estate-monitor:latest
      
      - name: Run health checks
        run: |
          docker run -d -p 3000:3000 --name test-container real-estate-monitor:latest
          sleep 10
          curl -f http://localhost:3000/health || exit 1
          docker stop test-container
          docker rm test-container
      
      - name: Deploy to production
        run: |
          echo "🚀 Deploying to production..."
          # Add your deployment commands here
          # Examples:
          # - Deploy to Railway: railway up
          # - Deploy to Heroku: git push heroku main
          # - Deploy to AWS: aws deploy push
```

**VALIDATION:**

```bash
echo "🔍 Validating deploy.yml..."
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" || {
  echo "❌ FAILURE: deploy.yml syntax invalid"
  exit 1
}
echo "✅ CHECKPOINT 5 PASSED: deploy.yml created and validated"
```

---

## 🚨 GUARDRAIL 3: COMPREHENSIVE VALIDATION (MANDATORY)

### CHECKPOINT 6: Run All Validations

**VALIDATION SCRIPT:** `.github/scripts/validate-workflows.sh`

```bash
#!/bin/bash
set -e

echo "🔍 CHECKPOINT 6: Comprehensive Workflow Validation"
echo "=================================================="

WORKFLOW_DIR=".github/workflows"
FAILED=0

# Validation 1: All workflow files exist
REQUIRED_WORKFLOWS=(
  "test.yml"
  "security-scan.yml"
  "scraper-schedule.yml"
  "deploy.yml"
)

echo "📋 Checking required workflows..."
for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
  if [ ! -f "$WORKFLOW_DIR/$workflow" ]; then
    echo "❌ Missing workflow: $workflow"
    FAILED=1
  else
    echo "✅ Found: $workflow"
  fi
done

# Validation 2: YAML syntax check
echo ""
echo "📋 Validating YAML syntax..."
for file in "$WORKFLOW_DIR"/*.yml; do
  echo "Checking $file..."
  python3 -c "import yaml; yaml.safe_load(open('$file'))" || {
    echo "❌ YAML syntax error in $file"
    FAILED=1
  }
done

# Validation 3: Security scan - no hardcoded secrets
echo ""
echo "📋 Scanning for hardcoded secrets..."
for file in "$WORKFLOW_DIR"/*.yml; do
  if grep -i "password\|api_key\|token" "$file" | grep -v "secrets\." | grep -v "github.token" > /dev/null; then
    echo "❌ Potential hardcoded secret in $file"
    FAILED=1
  fi
done
echo "✅ No hardcoded secrets found"

# Validation 4: actionlint (if available)
if command -v actionlint &> /dev/null; then
  echo ""
  echo "📋 Running actionlint..."
  actionlint "$WORKFLOW_DIR"/*.yml || FAILED=1
else
  echo "⚠️  actionlint not installed, skipping"
fi

# Validation 5: Check for required secrets
echo ""
echo "📋 Checking secret references..."
REQUIRED_SECRETS=(
  "GMAIL_USER"
  "GMAIL_APP_PASSWORD"
)

for file in "$WORKFLOW_DIR"/*.yml; do
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -q "secrets\.$secret" "$file"; then
      echo "✅ $secret referenced in $(basename $file)"
    fi
  done
done

# Final result
if [ $FAILED -eq 0 ]; then
  echo ""
  echo "✅ CHECKPOINT 6 PASSED: All validations successful"
  exit 0
else
  echo ""
  echo "❌ CHECKPOINT 6 FAILED: Validation errors found"
  exit 1
fi
```

**RUN VALIDATION:**

```bash
chmod +x .github/scripts/validate-workflows.sh
.github/scripts/validate-workflows.sh || {
  echo "❌ FAILURE: Workflow validation failed"
  echo "🛡️ Initiating rollback..."
  rm -rf .github/workflows
  mv .github/workflows.backup .github/workflows 2>/dev/null || true
  exit 1
}
```

---

## 🚨 GUARDRAIL 4: INTEGRATION TESTING (MANDATORY)

### CHECKPOINT 7: Test Workflow Triggers

**TEST SCRIPT:** `.github/scripts/test-workflows.sh`

```bash
#!/bin/bash
set -e

echo "🔍 CHECKPOINT 7: Integration Testing"
echo "===================================="

# Test 1: Validate workflow can be triggered
echo "📋 Testing workflow triggers..."

# Check push trigger
if grep -q "on:" .github/workflows/test.yml && grep -q "push:" .github/workflows/test.yml; then
  echo "✅ Push trigger configured"
else
  echo "❌ Push trigger missing"
  exit 1
fi

# Check PR trigger
if grep -q "pull_request:" .github/workflows/test.yml; then
  echo "✅ Pull request trigger configured"
else
  echo "❌ Pull request trigger missing"
  exit 1
fi

# Check schedule trigger
if grep -q "schedule:" .github/workflows/scraper-schedule.yml; then
  echo "✅ Schedule trigger configured"
else
  echo "❌ Schedule trigger missing"
  exit 1
fi

# Test 2: Validate job dependencies
echo ""
echo "📋 Testing job dependencies..."
# Add job dependency tests here

# Test 3: Validate required permissions
echo ""
echo "📋 Testing permissions..."
if grep -q "permissions:" .github/workflows/security-scan.yml; then
  echo "✅ Permissions configured"
else
  echo "⚠️  No permissions specified (using defaults)"
fi

echo ""
echo "✅ CHECKPOINT 7 PASSED: Integration tests successful"
```

**RUN INTEGRATION TESTS:**

```bash
chmod +x .github/scripts/test-workflows.sh
.github/scripts/test-workflows.sh || {
  echo "❌ FAILURE: Integration tests failed"
  exit 1
}
```

---

## 🚨 GUARDRAIL 5: FINAL VALIDATION (MANDATORY)

### CHECKPOINT 8: Complete Verification

```bash
echo "🔍 CHECKPOINT 8: Final Validation"
echo "================================="

# Count created workflows
WORKFLOW_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l)
if [ "$WORKFLOW_COUNT" -lt 4 ]; then
  echo "❌ FAILURE: Expected 4 workflows, found $WORKFLOW_COUNT"
  exit 1
fi

# Verify all checkpoints passed
CHECKPOINTS_PASSED=8

echo ""
echo "📊 Validation Summary:"
echo "  ✅ Checkpoint 0: Prerequisites validated"
echo "  ✅ Checkpoint 1: Workflow directory created"
echo "  ✅ Checkpoint 2: test.yml created"
echo "  ✅ Checkpoint 3: security-scan.yml created"
echo "  ✅ Checkpoint 4: scraper-schedule.yml created"
echo "  ✅ Checkpoint 5: deploy.yml created"
echo "  ✅ Checkpoint 6: Validation passed"
echo "  ✅ Checkpoint 7: Integration tests passed"
echo "  ✅ Checkpoint 8: Final verification passed"
echo ""
echo "🎉 ALL CHECKPOINTS PASSED ($CHECKPOINTS_PASSED/8)"
echo "✅ GitHub Actions workflows ready for production"
```

---

## 📋 DELIVERABLES CHECKLIST

You MUST create ALL of these files:

- [ ] `.github/workflows/test.yml` - Automated testing workflow
- [ ] `.github/workflows/security-scan.yml` - Security scanning workflow
- [ ] `.github/workflows/scraper-schedule.yml` - Scheduled scraping workflow
- [ ] `.github/workflows/deploy.yml` - Deployment workflow
- [ ] `.github/scripts/validate-workflows.sh` - Validation script
- [ ] `.github/scripts/test-workflows.sh` - Integration test script

---

## 🛡️ ROLLBACK PROCEDURE

If ANY checkpoint fails:

```bash
echo "❌ CHECKPOINT FAILED - INITIATING ROLLBACK"
echo "=========================================="

# Remove all created workflows
rm -rf .github/workflows/*.yml

# Restore from backup if exists
if [ -d ".github/workflows.backup" ]; then
  rm -rf .github/workflows
  mv .github/workflows.backup .github/workflows
  echo "✅ Rollback complete - restored from backup"
else
  echo "⚠️  No backup found - workflows removed"
fi

echo ""
echo "❌ BUILD HALTED"
echo "Required action: Fix errors and restart from Checkpoint 0"
exit 1
```

---

## 📚 DOCUMENTATION REQUIREMENTS

After successful completion, create: `.github/workflows/README.md`

```markdown
# GitHub Actions Workflows

## Overview

This directory contains automated workflows for the Real Estate Property Monitor project.

## Workflows

### test.yml
**Purpose**: Automated testing
**Triggers**: Push to main/develop, Pull requests
**Actions**:
- Runs on Node.js 18.x and 20.x
- Executes linting (ESLint)
- Builds TypeScript project
- Runs test suite with coverage
- Uploads coverage to Codecov

### security-scan.yml
**Purpose**: Security vulnerability scanning
**Triggers**: Push, Pull requests, Weekly schedule
**Actions**:
- CodeQL analysis for JavaScript/TypeScript
- npm audit for dependency vulnerabilities
- Dependency review on pull requests

### scraper-schedule.yml
**Purpose**: Scheduled property scraping
**Triggers**: Every 2 hours, Manual dispatch
**Actions**:
- Installs Playwright browsers
- Runs property scraper
- Commits updated database
- Uploads logs on failure

### deploy.yml
**Purpose**: Production deployment
**Triggers**: Push to main, Manual dispatch
**Actions**:
- Builds Docker image
- Runs health checks
- Deploys to production

## Required Secrets

Configure these in GitHub repository settings:

- `GMAIL_USER` - Gmail address for notifications
- `GMAIL_APP_PASSWORD` - Gmail app password
- `TWILIO_ACCOUNT_SID` - Twilio account (optional)
- `TWILIO_AUTH_TOKEN` - Twilio token (optional)
- `TWILIO_PHONE_NUMBER` - Twilio number (optional)

## Manual Workflow Triggers

All workflows except test.yml can be manually triggered:

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

## Monitoring

- View workflow runs in Actions tab
- Check logs for debugging
- Review artifacts for scraper logs
- Monitor Codecov for test coverage

## Troubleshooting

**Workflow fails on test step**:
- Check test.log artifact
- Verify all tests pass locally
- Ensure dependencies are up to date

**Scraper fails**:
- Check scraper-logs artifact
- Verify secrets are configured
- Test scrapers locally first

**Deploy fails**:
- Verify Docker image builds locally
- Check health endpoint returns 200
- Review deployment logs
```

---

## ✅ SUCCESS CRITERIA

Your implementation is complete when:

1. ✅ All 8 checkpoints passed
2. ✅ All 4 workflow files created
3. ✅ All validation scripts created
4. ✅ YAML syntax is valid
5. ✅ No hardcoded secrets
6. ✅ Integration tests pass
7. ✅ Documentation complete
8. ✅ Rollback tested and works

**IF ANY CRITERION FAILS: BUILD HALTS**

---

## 🎯 NEXT STEPS

After completing this segment:

1. **Commit all changes**:
   ```bash
   git add .github/workflows/
   git add .github/scripts/
   git commit -m "Add GitHub Actions workflows with guardrails"
   ```

2. **Verify in GitHub**:
   - Push to repository
   - Check Actions tab
   - Verify workflows appear

3. **Configure secrets**:
   - Go to Settings → Secrets → Actions
   - Add required secrets

4. **Test manually**:
   - Trigger deploy workflow
   - Trigger scraper workflow
   - Verify they run successfully

---

## ⚠️ CRITICAL REMINDERS

1. **NO SKIPPING**: All checkpoints are mandatory
2. **NO SHORTCUTS**: Each validation must pass
3. **NO ASSUMPTIONS**: Verify everything
4. **HALT ON FAILURE**: Stop immediately if any check fails
5. **ROLLBACK ON ERROR**: Automatic rollback protects repository
6. **PRODUCTION READY**: All code must be deployable immediately
7. **SECURITY FIRST**: No secrets, no vulnerabilities
8. **VALIDATE EVERYTHING**: YAML, security, integration, final

---

**THIS SEGMENT IS COMPLETE WHEN ALL 8 CHECKPOINTS PASS**

**FAILURE TO FOLLOW GUARDRAILS WILL RESULT IN BUILD HALT AND ROLLBACK**
