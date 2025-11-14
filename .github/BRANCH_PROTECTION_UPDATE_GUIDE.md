# Manual Branch Protection Update Guide

## ⚠️ IMPORTANT: Manual Action Required

After merging this PR, you **MUST** update GitHub branch protection rules to remove phantom check requirements.

## Step-by-Step Instructions

### 1. Navigate to Repository Settings

Go to: https://github.com/stackconsult/stackBrowserAgent/settings/branches

Or:
1. Click on **Settings** tab in your repository
2. Click on **Branches** in the left sidebar

### 2. Edit Branch Protection Rule for `main` Branch

1. Find "Branch protection rules" section
2. Locate the rule for `main` branch
3. Click **Edit** button

### 3. Update Required Status Checks

Scroll down to the section: **"Require status checks to pass before merging"**

#### ❌ REMOVE These Checks (They Don't Exist)

If you see any of these, **uncheck or remove them**:
- [ ] Backend CI / test (3.9)
- [ ] Backend CI / test (3.10)
- [ ] Backend CI / test (3.11)
- [ ] Backend CI / docker (any)
- [ ] Extension CI / build
- [ ] Extension CI / test (any)

#### ✅ KEEP These Checks (They Actually Exist)

These should remain checked:
- [x] Test (18.x)
- [x] Test (20.x)
- [x] Security Audit

You may also have:
- [x] CodeQL
- [x] Trivy
- [x] Deploy Backend to GitHub Container Registry / build-and-push
- [x] Any other checks from the ci.yml workflow

### 4. Save Changes

1. Scroll to the bottom
2. Click **Save changes** button
3. Confirm the update

### 5. Repeat for `develop` Branch (if it has protection rules)

If you have branch protection on the `develop` branch:
1. Find the rule for `develop`
2. Click **Edit**
3. Remove the same phantom checks
4. Save changes

## Visual Reference

### Before (With Phantom Checks)
```
Required status checks:
☑ Test (18.x)                          ← Keep this
☑ Test (20.x)                          ← Keep this
☑ Security Audit                       ← Keep this
☑ Backend CI / test (3.9)              ← REMOVE THIS
☑ Backend CI / test (3.10)             ← REMOVE THIS
☑ Backend CI / test (3.11)             ← REMOVE THIS
☑ Extension CI / build                 ← REMOVE THIS
```

### After (Clean)
```
Required status checks:
☑ Test (18.x)                          ← Kept
☑ Test (20.x)                          ← Kept
☑ Security Audit                       ← Kept
```

## Why This Is Necessary

The phantom checks are references to workflows that **don't exist** in this repository. They will always show as "Expected" but never complete, blocking PRs indefinitely.

### What Were These Checks?

- **Backend CI / test (3.9, 3.10, 3.11)**: Python test checks that don't belong in this Node.js project
- **Extension CI / build**: A non-existent extension build workflow

### Where Did They Come From?

Likely sources:
1. Copy-pasted from another repository's branch protection settings
2. Leftover from deleted workflow files
3. Manually added status checks that were never implemented
4. Imported from a template that included them

## Verification

After updating branch protection rules:

### 1. Test on This PR
Before merging:
1. Look at the "Checks" section on this PR
2. Verify that ONLY these checks appear:
   - ✅ Test (18.x)
   - ✅ Test (20.x)
   - ✅ Security Audit
3. The phantom checks should be gone

### 2. Test on a New PR
After merging:
1. Create a small test PR (e.g., update README)
2. Verify no phantom checks appear
3. Verify existing checks pass
4. Merge the test PR

## Troubleshooting

### Q: I don't see the phantom checks in branch protection settings
**A:** They might be coming from:
- A different repository's checks (if you forked or templated)
- Organization-level required checks
- A different source control system

### Q: The phantom checks still appear after I removed them
**A:** 
1. Clear your browser cache
2. Wait 5-10 minutes for GitHub to propagate the changes
3. Verify you saved the branch protection rule changes
4. Check if organization-level rules are overriding repository rules

### Q: How do I find what checks are actually available?
**A:** Run this command in the repository:
```bash
./.github/scripts/resolve-phantom-checks.sh
```

This will show all actual workflow jobs that can be used as status checks.

### Q: Can I just disable required status checks entirely?
**A:** Not recommended. Status checks are important for:
- Ensuring code quality
- Preventing broken code from being merged
- Maintaining test coverage

Instead, configure them correctly with only the checks that actually exist.

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CI_STATUS.md](.github/workflows/CI_STATUS.md) - Documentation of actual workflows
- [PHANTOM_CHECK_FIX_SUMMARY.md](.github/workflows/PHANTOM_CHECK_FIX_SUMMARY.md) - Technical details

## Need Help?

If you're still seeing phantom checks after following these instructions:

1. Take a screenshot of:
   - The "Checks" section on a PR
   - Your branch protection settings
   - The output of `resolve-phantom-checks.sh`

2. Open an issue with:
   - The screenshots
   - Your repository URL
   - Any error messages

3. Tag: `@github/support` or your repository maintainer

## Checklist

After completing the manual steps:

- [ ] Opened branch protection settings
- [ ] Edited `main` branch protection rule
- [ ] Removed phantom Backend CI checks (3.9, 3.10, 3.11)
- [ ] Removed phantom Extension CI checks
- [ ] Kept Test (18.x), Test (20.x), Security Audit
- [ ] Saved changes
- [ ] (If applicable) Repeated for `develop` branch
- [ ] Verified phantom checks no longer appear on this PR
- [ ] Tested with a new test PR

## Success Indicator

You'll know the fix is complete when:
1. ✅ This PR shows only green checkmarks (no "Expected" phantom checks)
2. ✅ New PRs don't show phantom checks
3. ✅ PRs can be merged without waiting for non-existent checks
4. ✅ CI/CD runs complete successfully

---

**Remember:** This is a one-time manual fix. After completing these steps, the phantom checks will be gone permanently (unless branch protection rules are changed again).
