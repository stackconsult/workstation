# Publishing Guide

This guide explains how to publish stackBrowserAgent to npm and deploy it to production.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm CLI**: Install Node.js and npm (included)
3. **Git Repository**: Ensure code is committed and pushed
4. **Build Passing**: All tests and lints must pass

## Publishing to npm

### First Time Setup

1. **Login to npm**:
```bash
npm login
```

Enter your npm username, password, and email.

2. **Verify Login**:
```bash
npm whoami
```

### Publishing Steps

1. **Update Version** (follow [Semantic Versioning](https://semver.org/)):

```bash
# Patch release (1.0.0 -> 1.0.1) - bug fixes
npm version patch

# Minor release (1.0.0 -> 1.1.0) - new features, backward compatible
npm version minor

# Major release (1.0.0 -> 2.0.0) - breaking changes
npm version major
```

2. **Update Changelog**:

Edit `CHANGELOG.md` to document changes in the new version.

3. **Run Quality Checks**:

```bash
# Lint code
npm run lint

# Build TypeScript
npm run build

# Verify build output
ls -la dist/

# Test locally
npm start
```

4. **Publish to npm**:

```bash
# Dry run (test without publishing)
npm publish --dry-run

# Actual publish
npm publish
```

5. **Verify Publication**:

Visit https://www.npmjs.com/package/stackbrowseragent

6. **Tag Git Release**:

```bash
git push origin main --tags
```

7. **Create GitHub Release**:

Go to GitHub → Releases → Draft a new release
- Select the version tag
- Add release notes from CHANGELOG.md
- Publish release

### Testing Published Package

```bash
# Create test directory
mkdir test-installation
cd test-installation

# Install from npm
npm install stackbrowseragent

# Verify installation
node -e "console.log(require('stackbrowseragent'))"
```

## Publishing Workflow

### Version 1.0.x (Patch Releases)

Use for bug fixes and minor improvements:

```bash
# 1. Fix the bug
git add .
git commit -m "fix: resolve JWT token expiration issue"

# 2. Update version
npm version patch

# 3. Update CHANGELOG.md
# Add entry under [1.0.x] section

# 4. Commit changes
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.0.x"

# 5. Build and test
npm run lint && npm run build

# 6. Publish
npm publish

# 7. Push to Git
git push origin main --tags
```

### Version 1.x.0 (Minor Releases)

Use for new features (backward compatible):

```bash
# 1. Develop feature
git add .
git commit -m "feat: add OAuth authentication support"

# 2. Update version
npm version minor

# 3. Update CHANGELOG.md
# Add entry under [1.x.0] section

# 4. Commit changes
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.x.0"

# 5. Build and test
npm run lint && npm run build

# 6. Publish
npm publish

# 7. Push to Git
git push origin main --tags

# 8. Create GitHub Release
```

### Version x.0.0 (Major Releases)

Use for breaking changes:

```bash
# 1. Develop breaking changes
git add .
git commit -m "feat!: redesign authentication API (BREAKING CHANGE)"

# 2. Update version
npm version major

# 3. Update CHANGELOG.md
# Add comprehensive migration guide

# 4. Update README.md
# Document breaking changes

# 5. Commit changes
git add .
git commit -m "docs: update documentation for v2.0.0"

# 6. Build and test
npm run lint && npm run build

# 7. Publish
npm publish

# 8. Push to Git
git push origin main --tags

# 9. Create GitHub Release with migration guide
```

## Deployment to Railway

### Automatic Deployment

Railway automatically deploys when you push to the main branch (if connected to GitHub).

### Manual Deployment

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Login**:
```bash
railway login
```

3. **Link Project**:
```bash
railway link
```

4. **Deploy**:
```bash
railway up
```

5. **View Logs**:
```bash
railway logs
```

### Environment Variables on Railway

Set via Railway Dashboard:
- `JWT_SECRET`: Your secure secret (auto-generated if not set)
- `JWT_EXPIRATION`: Token lifetime (default: 24h)
- `NODE_ENV`: Set to "production"

## Docker Hub Publishing

### Build and Push to Docker Hub

1. **Login to Docker Hub**:
```bash
docker login
```

2. **Build Image**:
```bash
docker build -t stackconsult/stackbrowseragent:1.0.0 .
docker build -t stackconsult/stackbrowseragent:latest .
```

3. **Test Image Locally**:
```bash
docker run -p 3000:3000 -e JWT_SECRET=test-secret stackconsult/stackbrowseragent:latest
```

4. **Push to Docker Hub**:
```bash
docker push stackconsult/stackbrowseragent:1.0.0
docker push stackconsult/stackbrowseragent:latest
```

5. **Verify**:
Visit https://hub.docker.com/r/stackconsult/stackbrowseragent

## Rollback Procedures

### npm Rollback

If a published version has critical issues:

```bash
# Deprecate the broken version
npm deprecate stackbrowseragent@1.0.1 "Critical bug - use 1.0.0 instead"

# Publish a patched version
npm version patch
npm publish
```

### Railway Rollback

Via Railway Dashboard:
1. Go to Deployments
2. Select previous working deployment
3. Click "Redeploy"

### Docker Rollback

```bash
# Deploy previous version
docker pull stackconsult/stackbrowseragent:1.0.0
docker run -p 3000:3000 -e JWT_SECRET=your-secret stackconsult/stackbrowseragent:1.0.0
```

## Pre-Release Checklist

Before publishing, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Version updated (`npm version`)
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] Breaking changes documented
- [ ] Git commits are clean and descriptive
- [ ] `.env.example` is up to date
- [ ] Dependencies are up to date (`npm audit`)
- [ ] Security vulnerabilities fixed (`npm audit fix`)
- [ ] Docker build works (`docker build .`)
- [ ] Railway deployment tested

## Post-Release Tasks

After publishing:

- [ ] Verify npm package: https://www.npmjs.com/package/stackbrowseragent
- [ ] Create GitHub Release with notes
- [ ] Update documentation website (if applicable)
- [ ] Announce on social media/blog
- [ ] Monitor error tracking for new issues
- [ ] Check Railway deployment
- [ ] Update Docker Hub description
- [ ] Notify users of breaking changes (if any)

## Troubleshooting

### npm publish fails with authentication error

**Solution**:
```bash
npm logout
npm login
npm publish
```

### Version already exists

**Solution**:
```bash
# You cannot republish the same version
# Bump version and try again
npm version patch
npm publish
```

### Build fails before publish

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
npm publish
```

### Railway deployment fails

**Solution**:
1. Check Railway logs: `railway logs`
2. Verify environment variables
3. Check build command in `railway.json`
4. Ensure `package.json` has correct start command

### Docker image too large

**Solution**:
1. Use `.dockerignore` to exclude unnecessary files
2. Use multi-stage builds
3. Use alpine base images
4. Remove dev dependencies in final stage

## Security Considerations

### Before Publishing

1. **Never include secrets** in published code
2. **Check `.gitignore`** and `.npmignore`
3. **Review dependencies** for vulnerabilities
4. **Scan with security tools**:
```bash
npm audit
npm audit fix
```

### npm Package Security

1. **Enable 2FA** on npm account
2. **Use npm Organizations** for team packages
3. **Set package access** (public/private)
4. **Monitor downloads** and usage

## Continuous Integration (Future)

Automate publishing with GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [Railway Documentation](https://docs.railway.app/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

For questions or issues with publishing, open an issue on GitHub.
