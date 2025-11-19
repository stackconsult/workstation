# Workflow Credential Handling Guide

## Overview

This repository uses a three-state credential validation system to handle API keys and secrets gracefully. Workflows are designed to:

1. **Execute normally** when real credentials are configured
2. **Complete gracefully** when filler/placeholder credentials are present (not fail, not pass)
3. **Complete gracefully** when credentials are missing (with setup instructions)

## Three-State Logic

### State 1: VALID ✅
- **Condition**: Real, non-placeholder credentials are provided
- **Behavior**: Workflow executes normally with full functionality
- **Exit Codes**: Can fail (exit code 1) if actual errors occur during execution

### State 2: FILLER ⏭️
- **Condition**: Credentials contain placeholder patterns like:
  - `PLACEHOLDER`
  - `YOUR_*`
  - `FILLER`
  - `EXAMPLE`
  - `TODO`
  - `CHANGEME`
  - `xxx`, `yyy`, `zzz`
  - Service-specific patterns (e.g., `https://your-app`, `gitleaks`)
- **Behavior**: Workflow completes successfully without executing credential-dependent actions
- **Exit Codes**: Always exits with 0 (success)
- **Message**: Clear indication that filler credentials were detected and action was skipped

### State 3: MISSING ⚠️
- **Condition**: Credentials are not configured (empty, null, or not set)
- **Behavior**: Workflow completes successfully with instructions on how to configure
- **Exit Codes**: Always exits with 0 (success)
- **Message**: Setup instructions for the missing credential

## Credential Validation Action

Location: `.github/actions/validate-credentials/action.yml`

### Usage

```yaml
- name: Validate credentials
  id: validate-creds
  uses: ./.github/actions/validate-credentials
  with:
    credential-name: 'MY_API_KEY'
    credential-value: ${{ secrets.MY_API_KEY }}
    filler-patterns: '["PLACEHOLDER", "YOUR_", "FILLER", "EXAMPLE"]'
```

### Outputs

- `status`: One of "valid", "filler", or "missing"
- `should-run`: Boolean - "true" only if status is "valid"
- `skip-reason`: Human-readable explanation if skipped

### Implementation Pattern

```yaml
- name: Execute action or skip
  run: |
    set -e
    
    CRED_STATUS="${{ steps.validate-creds.outputs.status }}"
    SKIP_REASON="${{ steps.validate-creds.outputs.skip-reason }}"
    
    if [ "$CRED_STATUS" = "valid" ]; then
      # Execute with real credentials
      # Can fail if errors occur
      echo "Executing with valid credentials..."
      # ... actual work ...
    elif [ "$CRED_STATUS" = "filler" ]; then
      # Complete gracefully - filler detected
      echo "⏭️ Workflow completed with filler credentials" >> $GITHUB_STEP_SUMMARY
      echo "$SKIP_REASON" >> $GITHUB_STEP_SUMMARY
      echo "**Status:** ✅ Completed successfully (no action required)" >> $GITHUB_STEP_SUMMARY
    else
      # Complete gracefully - credential missing
      echo "⏭️ Workflow completed - credential not configured" >> $GITHUB_STEP_SUMMARY
      echo "$SKIP_REASON" >> $GITHUB_STEP_SUMMARY
      echo "**Status:** ✅ Completed successfully (configuration required)" >> $GITHUB_STEP_SUMMARY
    fi
```

## Workflows Using Credential Validation

### 1. admin-control-panel.yml
- **Credential**: `RAILWAY_URL`
- **Purpose**: Railway deployment URL for health checks and token generation
- **Filler Patterns**: `https://your-app`, `https://example`
- **Behavior**:
  - VALID: Performs health checks, generates tokens
  - FILLER: Shows documentation, skips live API calls
  - MISSING: Provides setup instructions

### 2. secret-scan.yml  
- **Credential**: `GITLEAKS_LICENSE`
- **Purpose**: Optional Gitleaks Pro license for enhanced secret scanning
- **Filler Patterns**: `gitleaks`, standard placeholders
- **Behavior**:
  - VALID: Runs Gitleaks Pro scan
  - FILLER: Uses free TruffleHog scan instead
  - MISSING: Uses free TruffleHog scan instead
- **Alternative**: TruffleHog (no license required) always runs

### 3. ci.yml
- **Credential**: `GITLEAKS_LICENSE`
- **Purpose**: Optional Gitleaks secret detection during CI
- **Filler Patterns**: `gitleaks`, standard placeholders
- **Behavior**:
  - VALID: Runs Gitleaks scan
  - FILLER: Relies on TruffleHog scan (runs regardless)
  - MISSING: Relies on TruffleHog scan (runs regardless)
- **Alternative**: TruffleHog scan always runs as primary secret scanner

## Benefits

### 1. No False Failures
- Workflows don't fail just because optional credentials aren't configured
- Filler credentials don't cause workflow cancellations
- Development environments can use placeholder values safely

### 2. Clear Communication
- Explicit status reporting in workflow summaries
- Users understand why actions were skipped
- Setup instructions provided when credentials are missing

### 3. Graceful Degradation
- Workflows use free alternatives when premium features aren't available
- Core functionality maintained even without optional credentials
- Repositories can operate fully with zero external dependencies

### 4. Fail-Fast on Real Errors
- When real credentials are provided, actual errors still cause failures
- No silent failures that could hide problems
- Clear distinction between "skipped by design" and "failed unexpectedly"

## Adding Credential Validation to New Workflows

### Step 1: Identify Credentials
List all secrets/credentials your workflow uses:
- External API keys
- Service URLs
- License keys
- Authentication tokens (excluding `GITHUB_TOKEN`)

### Step 2: Determine Filler Patterns
Identify patterns that indicate placeholder values:
- Common patterns: `PLACEHOLDER`, `YOUR_`, `EXAMPLE`, `TODO`
- Service-specific: `https://your-app`, `user@example.com`
- Generic: `xxx`, `yyy`, `zzz`, `123456`

### Step 3: Add Validation Step
```yaml
- name: Checkout code
  uses: actions/checkout@v4

- name: Validate credentials
  id: validate
  uses: ./.github/actions/validate-credentials
  with:
    credential-name: 'CREDENTIAL_NAME'
    credential-value: ${{ secrets.CREDENTIAL_NAME }}
    filler-patterns: '["pattern1", "pattern2"]'
```

### Step 4: Implement Three-State Logic
```yaml
- name: Your action
  run: |
    if [ "${{ steps.validate.outputs.status }}" = "valid" ]; then
      # Normal execution
    elif [ "${{ steps.validate.outputs.status }}" = "filler" ]; then
      # Graceful skip with filler message
    else
      # Graceful skip with setup instructions
    fi
```

### Step 5: Document Behavior
Update this guide with:
- Workflow name
- Credential being validated
- Filler patterns used
- Behavior in each state
- Any free alternatives

## Testing

### Test Scenario 1: Valid Credentials
1. Configure real, valid credentials in repository secrets
2. Run workflow
3. Verify normal execution
4. Verify failures still occur for actual errors

### Test Scenario 2: Filler Credentials
1. Set secrets to placeholder values (e.g., `PLACEHOLDER_KEY`, `https://your-app.example.com`)
2. Run workflow
3. Verify workflow completes successfully (exit code 0)
4. Verify action is skipped with clear message
5. Verify no failures or cancellations

### Test Scenario 3: Missing Credentials
1. Remove/don't configure secrets
2. Run workflow
3. Verify workflow completes successfully (exit code 0)
4. Verify setup instructions are displayed
5. Verify no failures or cancellations

## Troubleshooting

### Workflow Still Failing with Filler Credentials
- Check if filler pattern is included in validation step
- Verify three-state logic is implemented correctly
- Ensure `set -e` doesn't cause premature exit in skip cases

### Workflow Not Running with Valid Credentials
- Verify credentials don't accidentally match filler patterns
- Check credential is properly passed to validation action
- Review validation action output logs

### False Positives (Valid Credentials Detected as Filler)
- Adjust filler patterns to be more specific
- Use full string matches instead of partial matches
- Review validation logic in action.yml

## Best Practices

1. **Always provide free alternatives**: When possible, offer free tools as fallbacks
2. **Clear messaging**: Make it obvious why an action was skipped
3. **Consistent patterns**: Use the same validation approach across all workflows
4. **Document everything**: Keep this guide up-to-date as workflows change
5. **Test all states**: Verify behavior with valid, filler, and missing credentials
6. **Fail appropriately**: Only fail on actual errors, not missing optional features

## Example Workflows

See these workflows for reference implementations:
- `.github/workflows/admin-control-panel.yml` - Comprehensive example with multiple actions
- `.github/workflows/secret-scan.yml` - Optional premium feature with free alternative
- `.github/workflows/ci.yml` - Build pipeline with optional enhancements
