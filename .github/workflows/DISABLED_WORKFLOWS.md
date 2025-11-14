# Disabled Workflows

The following workflows have been temporarily disabled due to YAML syntax issues with complex heredoc patterns that are incompatible with GitHub Actions YAML parser:

## Disabled Files

1. **agent-doc-generator.yml.disabled** - AI Agent Builder Documentation Generator
   - Status: Disabled due to YAML heredoc syntax issues
   - Reason: Complex multi-line heredocs within YAML causing parse errors
   - Solution: Needs rewriting to use alternative file generation methods

2. **agent-scaffolder.yml.disabled** - AI Agent Builder Project Scaffolder
   - Status: Disabled due to YAML heredoc syntax issues
   - Reason: .gitignore generation with special characters causing YAML errors
   - Solution: Needs rewriting to use alternative file generation methods

3. **agent-ui-matcher.yml.disabled** - AI Agent Builder UI Framework Matcher
   - Status: Disabled due to YAML heredoc syntax issues
   - Reason: Multiple heredocs with JSON/JS content causing YAML parser conflicts
   - Solution: Needs rewriting to use alternative file generation methods

4. **auto-fix-dependencies.yml.disabled** - Auto-fix Dependencies (Nov 12, 2025)
   - Status: Disabled as it contradicts CI/CD best practices
   - Reason: Automatically replaces `npm ci` with `npm install`, which is incorrect
   - Solution: `npm ci` is the correct command for CI/CD as it provides consistent, reproducible builds
   - Why disabled: This workflow was likely created to work around a temporary issue but actually makes things worse by replacing the correct command (`npm ci`) with a less reliable one (`npm install`)

## Impact

These workflows are part of the comprehensive AI Agent Builder system described in the agent instructions. Disabling them does NOT affect:

- ✅ Core CI/CD workflows (ci.yml)
- ✅ Audit workflows (audit-scan.yml, audit-classify.yml, audit-fix.yml, audit-verify.yml)
- ✅ Agent discovery workflow (agent-discovery.yml)
- ✅ Agent orchestrator workflow (agent-orchestrator.yml - simplified)

## Re-enabling

To re-enable these workflows, they need to be rewritten to:

1. Use separate shell scripts instead of inline heredocs
2. Use `echo` statements with proper escaping
3. Use JSON/template files committed to the repository
4. Use Actions that handle file generation (e.g., create-or-update-file actions)

## Recommended Approach

Instead of complex inline heredocs in YAML, use:

```yaml
- name: Generate files
  run: |
    bash .github/scripts/generate-docs.sh
```

And move the complex file generation logic to `.github/scripts/` directory.

## Current Status

All critical workflows are functional. The disabled workflows were part of an advanced AI agent builder feature that is not essential for the core repository functionality.
