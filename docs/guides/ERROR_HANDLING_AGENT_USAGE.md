# 🤖 Error Handling Educator Agent - Usage Guide

## Overview

The Error Handling Educator Agent is a specialized AI assistant that analyzes CI/CD failures, explains error patterns, and teaches best practices for enterprise-grade error handling. This guide shows you how to use it effectively.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Common Use Cases](#common-use-cases)
3. [Invocation Examples](#invocation-examples)
4. [Reading Agent Output](#reading-agent-output)
5. [Applying Recommendations](#applying-recommendations)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Verify Agent Installation

```bash
# Check if agent exists
ls -la .github/agents/error-handling-educator.agent.md

# Check documentation
ls -la docs/ERROR_HANDLING_SCHEMA.md
ls -la docs/guides/ERROR_HANDLING_EDUCATION.md
```

### Step 2: Basic Invocation

In GitHub Copilot chat:
```
@copilot Use the Error Handling Educator agent to analyze recent CI failures
```

Or for specific workflow:
```
@copilot Use the Error Handling Educator agent to analyze the last 5 runs of ci.yml
```

### Step 3: Review Output

The agent will create:
- **Analysis Report**: `docs/reports/error-analysis-[date].md`
- **Visual Schemas**: Before/after flow diagrams
- **Fix Recommendations**: Prioritized by severity
- **Educational Content**: Explanations and examples

---

## 💡 Common Use Cases

### Use Case 1: "Why is my CI failing?"

**Scenario**: Your CI pipeline suddenly started failing and you don't know why.

**Invocation**:
```
@copilot Use the Error Handling Educator agent to:
1. Analyze the last 10 CI workflow runs
2. Identify what changed between passing and failing runs
3. Explain why each error occurred
4. Provide step-by-step fix instructions
```

**Expected Output**:
- Timeline of when failures started
- Git commits that may have introduced issues
- Root cause analysis for each error
- Exact commands to fix
- Prevention strategies

---

### Use Case 2: "I have warnings in my audit scan"

**Scenario**: Security audit found vulnerabilities but you don't understand the severity.

**Invocation**:
```
@copilot Use the Error Handling Educator agent to:
1. Review audit scan results
2. Explain each vulnerability in plain English
3. Show me what code is vulnerable
4. Prioritize by actual risk (not just CVE score)
5. Recommend fixes with examples
```

**Expected Output**:
- Classification by severity (critical, high, medium, low)
- Explanation of what each vulnerability means
- Vulnerable code snippets highlighted
- Fix examples with before/after code
- Links to CVE databases and documentation

---

### Use Case 3: "My tests are flaky"

**Scenario**: Some tests pass sometimes and fail other times.

**Invocation**:
```
@copilot Use the Error Handling Educator agent to:
1. Analyze test failure patterns over last 30 days
2. Identify which tests are flaky
3. Explain common causes of flakiness
4. Show me how to make tests more reliable
5. Create a guide for writing stable tests
```

**Expected Output**:
- List of flaky tests with failure rates
- Root causes (race conditions, resource leaks, timing issues)
- Patterns to avoid (global state, hard-coded waits, etc.)
- Refactored test examples
- Testing best practices guide

---

### Use Case 4: "Create a troubleshooting guide"

**Scenario**: Your team repeatedly encounters the same errors and needs documentation.

**Invocation**:
```
@copilot Use the Error Handling Educator agent to:
1. Analyze all errors from the last 90 days
2. Identify the top 10 most common errors
3. Create a troubleshooting guide with:
   - Error message patterns
   - Step-by-step diagnosis
   - Fix procedures
   - Prevention tips
4. Include visual decision trees
```

**Expected Output**:
- Comprehensive troubleshooting guide
- "If you see X, do Y" decision trees
- Frequency statistics for each error
- Quick reference table
- Links to detailed documentation

---

### Use Case 5: "Explain our error handling patterns"

**Scenario**: New team member needs to understand how error handling works in your codebase.

**Invocation**:
```
@copilot Use the Error Handling Educator agent to:
1. Analyze our error handling patterns in src/
2. Document the patterns we use (and should use)
3. Show examples of good and bad error handling in our code
4. Create an onboarding guide for error handling
5. Include our specific tools and conventions
```

**Expected Output**:
- Code patterns used in your repository
- Before/after refactoring examples from your code
- Project-specific error types and handling
- Onboarding checklist
- Links to relevant files in your codebase

---

## 📝 Invocation Examples

### Basic Invocation

```
@copilot Analyze CI errors using the Error Handling Educator agent
```

### Specific Workflow

```
@copilot Use the Error Handling Educator agent to analyze the audit-scan.yml workflow
```

### Time Range

```
@copilot Use the Error Handling Educator agent to analyze errors from the last 7 days
```

### Severity Filter

```
@copilot Use the Error Handling Educator agent to show only critical and high severity errors
```

### With Educational Focus

```
@copilot Use the Error Handling Educator agent to explain dependency errors to a junior developer
```

### Create Documentation

```
@copilot Use the Error Handling Educator agent to create a troubleshooting guide for our CI pipeline
```

### Compare Branches

```
@copilot Use the Error Handling Educator agent to compare error rates between main and develop branches
```

---

## 📖 Reading Agent Output

### Error Analysis Report Structure

```markdown
# Error Analysis Report

## Executive Summary
Quick overview of findings

## Error Taxonomy
Breakdown by type:
- Dependency Errors: 5
- Configuration Errors: 2
- Workflow Errors: 1
- Runtime Errors: 3
- Security Errors: 0

## Critical Issues (Fix Immediately)
### Issue #1: [Title]
- **Severity**: Critical
- **Frequency**: 10/10 runs
- **Impact**: Blocks deployment
- **Root Cause**: [Explanation]
- **Fix**: [Code example]
- **Validation**: [Steps]

## High Priority (Fix This Week)
[Similar structure]

## Medium Priority (Fix This Sprint)
[Similar structure]

## Low Priority (Backlog)
[Similar structure]

## Prevention Strategies
[How to avoid these errors in future]

## Knowledge Base Updates
[New patterns added to documentation]
```

### Visual Schema Interpretation

```
Current State (Broken):
┌─────────────────────────────────────┐
│  Step 1: npm ci                     │
│  └─> Step 2: npx audit-ci           │
│      └─> Error: Command not found ❌│
└─────────────────────────────────────┘

Root Cause:
audit-ci not in devDependencies
npx fails to download package

Fixed State:
┌─────────────────────────────────────┐
│  Step 1: npm ci                     │
│  └─> Step 2: npm run audit-ci       │
│      └─> Success ✅                 │
└─────────────────────────────────────┘

Changes:
1. Add to package.json:
   "devDependencies": { "audit-ci": "^7.1.0" }
2. Add npm script:
   "scripts": { "audit-ci": "audit-ci --moderate" }
3. Update workflow to use npm script
```

**How to Read**:
1. **Current State**: What's happening now (usually broken)
2. **Root Cause**: Why it's broken
3. **Fixed State**: How it should work
4. **Changes**: Exact modifications needed

---

## 🔧 Applying Recommendations

### Step-by-Step Process

#### 1. Read the Analysis Report
```bash
# Agent creates report at:
cat docs/reports/error-analysis-$(date +%Y-%m-%d).md
```

#### 2. Prioritize Fixes
Start with:
1. **Critical** (security vulnerabilities, build blockers)
2. **High** (test failures, deployment issues)
3. **Medium** (code quality, performance)
4. **Low** (warnings, minor issues)

#### 3. Apply a Fix

**Example**: Fix missing dependency

```bash
# 1. Read the recommendation
cat docs/reports/error-analysis-2025-11-17.md | grep -A 20 "Missing dependency: audit-ci"

# 2. Add dependency
npm install --save-dev audit-ci

# 3. Add npm script (edit package.json)
{
  "scripts": {
    "audit-ci": "audit-ci --moderate"
  }
}

# 4. Update workflow (edit .github/workflows/ci.yml)
- name: Security Audit
  run: npm run audit-ci

# 5. Validate locally
npm run lint
npm run build
npm test
npm run audit-ci
```

#### 4. Commit and Push
```bash
git add package.json package-lock.json .github/workflows/ci.yml
git commit -m "fix: add audit-ci dependency for reliable security scanning"
git push
```

#### 5. Verify in CI
```bash
# Watch the workflow run
gh run watch

# Or check on GitHub Actions tab
```

#### 6. Document Learning
If the fix revealed new insights:
```bash
# Update the error handling guide
vim docs/guides/ERROR_HANDLING_EDUCATION.md

# Add a case study
vim docs/ERROR_HANDLING_SCHEMA.md

# Commit documentation
git add docs/
git commit -m "docs: add case study for missing dependency issue"
```

---

## 🎓 Advanced Usage

### Custom Analysis Scope

```
@copilot Use the Error Handling Educator agent with these parameters:
- Analyze: Last 30 workflow runs
- Workflows: ci.yml, audit-scan.yml, secret-scan.yml
- Severities: critical, high
- Output: Detailed report with code examples
- Create: GitHub issue with findings
```

### Integration with PR Review

```
@copilot Use the Error Handling Educator agent to:
1. Review errors in CI failures for this PR
2. Explain which changes caused the failures
3. Show me exactly what to fix
4. Add inline comments on the problematic code
```

### Comparative Analysis

```
@copilot Use the Error Handling Educator agent to:
1. Compare error rates between main and develop
2. Show which changes introduced new error patterns
3. Predict potential issues before merging
```

### Knowledge Base Building

```
@copilot Use the Error Handling Educator agent to:
1. Analyze all errors from project history
2. Build a comprehensive error pattern database
3. Create decision trees for common issues
4. Generate searchable troubleshooting index
```

### Team Training

```
@copilot Use the Error Handling Educator agent to:
1. Analyze our codebase for error handling patterns
2. Create training materials for new developers
3. Generate code review checklist for error handling
4. Build quiz questions to test understanding
```

---

## 🔍 Troubleshooting

### Agent Not Found

**Problem**: "Cannot find agent error-handling-educator"

**Solution**:
```bash
# Check if agent file exists
ls .github/agents/error-handling-educator.agent.md

# If missing, copy from source
cp /path/to/original/.github/agents/error-handling-educator.agent.md .github/agents/

# Commit and push
git add .github/agents/error-handling-educator.agent.md
git commit -m "Add Error Handling Educator agent"
git push
```

### Documentation Not Found

**Problem**: Agent references docs that don't exist

**Solution**:
```bash
# Create docs directory if missing
mkdir -p docs/guides docs/reports

# Copy documentation files
cp ERROR_HANDLING_SCHEMA.md docs/
cp ERROR_HANDLING_EDUCATION.md docs/guides/

# Commit
git add docs/
git commit -m "Add error handling documentation"
git push
```

### Agent Produces Generic Output

**Problem**: Agent doesn't use repository-specific context

**Solution**:
```
@copilot Use the Error Handling Educator agent to analyze OUR repository's specific:
- CI/CD workflows in .github/workflows/
- Error patterns in our recent workflow runs
- Code in src/ directory
- Dependencies in package.json

Create repository-specific recommendations, not generic advice.
```

### Too Much Information

**Problem**: Agent output is overwhelming

**Solution**:
```
@copilot Use the Error Handling Educator agent to:
1. Show ONLY critical errors
2. Provide ONE fix at a time
3. Give me a simple checklist format
4. Skip detailed explanations, just show me what to change
```

### Need More Detail

**Problem**: Agent output is too brief

**Solution**:
```
@copilot Use the Error Handling Educator agent in DETAILED mode:
1. Explain the root cause thoroughly
2. Show multiple solution approaches
3. Include all relevant code examples
4. Add links to documentation and similar issues
5. Explain WHY each fix works, not just HOW
```

---

## 📊 Measuring Success

### Agent Effectiveness Metrics

Track these over time:

1. **Mean Time to Resolution (MTTR)**
   - Before: 2 hours average to fix CI errors
   - After: 30 minutes average (agent identifies root cause quickly)

2. **Error Recurrence Rate**
   - Before: Same error repeats 40% of the time
   - After: Same error repeats <5% (prevention strategies work)

3. **Team Confidence**
   - Before: Escalate most errors to senior devs
   - After: Junior devs can debug independently

4. **Documentation Quality**
   - Before: Scattered tribal knowledge
   - After: Comprehensive, searchable guides

5. **CI/CD Reliability**
   - Before: 70% success rate on CI runs
   - After: 95% success rate

---

## 🤝 Sharing with Team

### Creating Team Runbook

After using the agent, share learnings:

```markdown
# Team Error Handling Runbook

## Quick Reference

| Error | Root Cause | Fix | Prevention |
|-------|-----------|-----|-----------|
| Command not found: audit-ci | Missing dependency | Add to devDependencies | Use npm ci |
| SQLITE_MISUSE | Connection leak | Add afterEach cleanup | Always close connections |
| [Add more as you learn] | | | |

## When to Use the Agent

1. CI/CD suddenly failing
2. Unclear error messages
3. Recurring issues
4. Need to document patterns
5. Onboarding new team member

## Agent Invocation

```
@copilot Use the Error Handling Educator agent to [specific task]
```

## Follow-Up Actions

1. Read agent report
2. Apply critical fixes first
3. Test locally
4. Push and verify
5. Update this runbook with learnings
```

---

## 🎯 Best Practices

### 1. Use Agent Early
Don't wait until errors pile up. Run regular analyses:
- Weekly: Quick scan of recent runs
- Monthly: Comprehensive pattern analysis
- After major changes: Impact assessment

### 2. Document Everything
Every time agent identifies a new pattern:
- Add to ERROR_HANDLING_SCHEMA.md
- Update ERROR_HANDLING_EDUCATION.md
- Create case study if complex

### 3. Share Knowledge
- Post agent reports in team chat
- Discuss patterns in code review
- Include in onboarding materials
- Link from troubleshooting docs

### 4. Iterate
- Track which fixes work
- Measure error rates over time
- Refine documentation based on feedback
- Update agent configuration as needed

### 5. Prevent, Don't Just Fix
Use agent to:
- Identify systemic issues
- Improve development practices
- Update coding standards
- Add preventive tooling

---

## 📚 Additional Resources

### In This Repository
- [ERROR_HANDLING_SCHEMA.md](../ERROR_HANDLING_SCHEMA.md) - Visual flow diagrams
- [ERROR_HANDLING_EDUCATION.md](./ERROR_HANDLING_EDUCATION.md) - Comprehensive guide
- [CI_STATUS.md](../../.github/workflows/CI_STATUS.md) - Current workflow status

### External Resources
- [GitHub Actions Debugging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)
- [Node.js Error Handling](https://nodejs.org/en/docs/guides/error-handling)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 🚀 Next Steps

1. **Try It Now**: Use agent to analyze your most recent CI failure
2. **Read Output**: Study the generated report and schemas
3. **Apply One Fix**: Start with highest priority recommendation
4. **Validate**: Verify fix works in CI
5. **Document**: Add learnings to knowledge base
6. **Share**: Tell your team about the agent

---

*Questions? Issues? Suggestions? Open an issue or PR to improve this guide.*
