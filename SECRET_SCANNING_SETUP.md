# Secret Scanning Setup Guide

This repository uses multiple layers of secret scanning to prevent credential leaks and security vulnerabilities.

## Overview

Following the **open-source first** principle, we implement secret scanning with free, open-source tools as the primary solution, with optional commercial tools available via BYOK (Bring Your Own Key).

## Layer 1: TruffleHog (Primary - Free & Open Source)

### What is TruffleHog?
TruffleHog is an open-source secret scanning tool that finds secrets in your git repository history and current files.

**Benefits:**
- ✅ Completely free and open source (AGPL-3.0 license)
- ✅ No license key required
- ✅ Supports 700+ credential types
- ✅ Actively maintained by Truffle Security
- ✅ Scans entire git history
- ✅ Verifies secrets are active

**Current Status:** ✅ **Implemented in `.github/workflows/secret-scan.yml`**

### How It Works
The workflow automatically runs:
- On every push to main/develop branches
- On every pull request
- Weekly via scheduled scan
- Manually via workflow dispatch

**No configuration required** - it works out of the box!

## Layer 2: GitHub Native Secret Scanning (Recommended - Free)

### What is GitHub Secret Scanning?
GitHub's built-in secret scanning automatically detects secrets in your repository and can prevent them from being pushed.

**Benefits:**
- ✅ Free for public repositories
- ✅ No workflow configuration needed
- ✅ Automatic scanning on every push
- ✅ Push protection (prevents secrets from being committed)
- ✅ Partner program for automatic token revocation
- ✅ Integrated into Security tab

### How to Enable

#### For Repository Owners
1. Go to your repository on GitHub
2. Click **Settings** → **Security** → **Code security and analysis**
3. Enable **Secret scanning**
4. Enable **Push protection** (highly recommended)

#### For Organization Owners
1. Go to your organization settings
2. Navigate to **Code security and analysis**
3. Enable secret scanning for all repositories
4. Enable push protection organization-wide

### Documentation
- [GitHub Secret Scanning Docs](https://docs.github.com/en/code-security/secret-scanning)
- [About Push Protection](https://docs.github.com/en/code-security/secret-scanning/push-protection-for-repositories-and-organizations)

## Layer 3: Gitleaks (Optional - BYOK)

### What is Gitleaks?
Gitleaks is a commercial secret scanning tool that now requires a license for organization repositories.

**License Requirement:** As of 2024, Gitleaks requires a commercial license for use in organization repositories.

### When to Use Gitleaks
Consider Gitleaks if:
- Your organization has specific compliance requirements
- You already have a Gitleaks license
- You need enterprise support
- Your security policy mandates specific tools

### How to Enable Gitleaks (Optional)

#### Step 1: Obtain License
1. Visit [https://gitleaks.io](https://gitleaks.io)
2. Purchase or obtain a license key
3. Save your license key securely

#### Step 2: Add License to GitHub Secrets
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `GITLEAKS_LICENSE`
4. Value: Paste your license key
5. Click **Add secret**

#### Step 3: Enable Gitleaks Workflow
1. Go to repository **Settings** → **Variables** → **Actions**
2. Click **New repository variable**
3. Name: `ENABLE_GITLEAKS`
4. Value: `true`
5. Click **Add variable**

#### Step 4: Verify
The next workflow run will include Gitleaks scanning.

### Gitleaks Workflow Configuration
The Gitleaks job in `.github/workflows/secret-scan.yml` is already configured but disabled by default. It will only run when:
- The `ENABLE_GITLEAKS` variable is set to `true`
- The `GITLEAKS_LICENSE` secret is configured

## Comparison Matrix

| Feature | TruffleHog | GitHub Native | Gitleaks |
|---------|------------|---------------|----------|
| **Cost** | Free | Free (public repos) | Commercial License |
| **Setup** | Automatic | Manual enable | Requires license key |
| **History Scan** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Push Protection** | ❌ No | ✅ Yes | ❌ No |
| **Secret Types** | 700+ | 200+ | 500+ |
| **Verification** | ✅ Yes | ✅ Yes (partners) | ✅ Yes |
| **SARIF Output** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Status** | ✅ Active | 📋 Recommended | 🔐 Optional (BYOK) |

## Current Configuration

### Active Scanners
1. ✅ **TruffleHog** - Runs automatically, no license needed
2. 📋 **GitHub Native** - Recommended to enable (free)
3. 🔐 **Gitleaks** - Optional, requires license

### Workflow File
- **Location:** `.github/workflows/secret-scan.yml`
- **Triggers:** Push, PR, Schedule, Manual
- **Permissions:** Contents read, Security events write

## Troubleshooting

### TruffleHog Issues

**Problem:** TruffleHog reports false positives
**Solution:** 
```yaml
# Add to workflow extra_args
--exclude-paths=.trufflehog-exclude
```
Then create `.trufflehog-exclude` with patterns to exclude.

**Problem:** Scan takes too long
**Solution:** Use `--since-commit` to limit history depth.

### GitHub Secret Scanning Issues

**Problem:** Cannot enable secret scanning
**Solution:** Only organization owners can enable this feature. Contact your organization admin.

**Problem:** Push protection blocking valid code
**Solution:** You can bypass push protection for specific commits, but review carefully.

### Gitleaks Issues

**Problem:** "missing gitleaks license" error
**Solution:** 
1. Ensure `GITLEAKS_LICENSE` secret is configured correctly
2. Verify license is valid at [gitleaks.io](https://gitleaks.io)
3. Check if `ENABLE_GITLEAKS` variable is set to `true`

**Problem:** License has expired
**Solution:** 
1. Renew license at [gitleaks.io](https://gitleaks.io)
2. Update `GITLEAKS_LICENSE` secret with new key
3. Or disable Gitleaks by removing `ENABLE_GITLEAKS` variable

## Best Practices

### For All Teams
1. ✅ Enable GitHub's native secret scanning (free, no workflow needed)
2. ✅ Enable push protection to prevent secrets from being committed
3. ✅ Review secret scanning alerts regularly in the Security tab
4. ✅ Use `.env` files for local secrets (never commit `.env`)
5. ✅ Add `.env` to `.gitignore` (already done)

### For Security-Conscious Teams
1. ✅ Use environment variables for all secrets
2. ✅ Rotate secrets regularly (quarterly minimum)
3. ✅ Use secret management services (AWS Secrets Manager, HashiCorp Vault)
4. ✅ Enable branch protection rules
5. ✅ Require code reviews before merging

### For Compliance Teams
1. ✅ Document your secret management policy
2. ✅ Maintain audit logs of secret access
3. ✅ Consider commercial tools like Gitleaks if required
4. ✅ Implement secrets rotation schedules
5. ✅ Regular security training for developers

## Monitoring & Alerts

### Where to View Results

**TruffleHog Results:**
- Workflow run logs: Actions tab → Secret Scanning workflow
- Failed checks will block PR if findings detected

**GitHub Secret Scanning Results:**
- Security tab → Secret scanning alerts
- Email notifications to repository admins
- Can configure custom notification webhooks

**Gitleaks Results (if enabled):**
- Workflow run logs: Actions tab → Secret Scanning workflow  
- SARIF report in Security tab → Code scanning alerts

### Setting Up Notifications

1. Go to repository **Settings** → **Notifications**
2. Configure email notifications for:
   - Secret scanning alerts
   - Code scanning alerts
   - Workflow failures
3. Consider setting up Slack/Teams webhooks for urgent alerts

## Migration from Gitleaks

If you were previously using Gitleaks and need to migrate:

### Option 1: Switch to TruffleHog (Recommended)
✅ Already done! The workflow is active and requires no changes.

### Option 2: Keep Gitleaks with License
1. Obtain license from [gitleaks.io](https://gitleaks.io)
2. Add `GITLEAKS_LICENSE` secret
3. Set `ENABLE_GITLEAKS` variable to `true`

### Option 3: Use GitHub Native Only
1. Enable GitHub secret scanning in repository settings
2. Disable secret-scan.yml workflow if desired
3. Monitor results in Security tab

## Support & Resources

### Documentation Links
- [TruffleHog GitHub](https://github.com/trufflesecurity/trufflehog)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)

### Getting Help
- **TruffleHog:** GitHub Issues, Community Slack
- **GitHub Scanning:** GitHub Support, GitHub Community
- **Gitleaks:** Commercial support at gitleaks.io

## Summary

This repository uses a **layered approach** to secret scanning:

1. **TruffleHog** (Primary): Free, open-source, automatic
2. **GitHub Native** (Recommended): Free, easy to enable
3. **Gitleaks** (Optional): Commercial, requires license

**You don't need to do anything** - TruffleHog is already protecting your repository. For maximum security, we recommend also enabling GitHub's native secret scanning in repository settings.

For questions or issues, please open a GitHub issue or contact the security team.
