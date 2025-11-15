# Docker Image Tagging Strategy

## Overview

This document describes the comprehensive Docker image tagging and versioning strategy implemented for stackBrowserAgent. Every main branch commit automatically builds and pushes a multi-tagged Docker image to GitHub Container Registry (GHCR), providing a complete historical record for rollbacks and deployments.

## Registry Information

**Registry:** GitHub Container Registry (GHCR)  
**Base URL:** `ghcr.io`  
**Repository:** `ghcr.io/creditxcredit/workstation`  
**Visibility:** Public (free for public repositories)  
**Documentation:** https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry

## Tag Types

### 1. Git SHA Tags

#### Long SHA Format
```
ghcr.io/creditxcredit/workstation:1a2b3c4d5e6f7g8h9i0j
```

**Purpose:** Immutable reference to exact commit  
**Format:** Full 40-character Git commit SHA  
**Example:** `ghcr.io/creditxcredit/workstation:53b3276f8a9e1d2c3b4a5f6e7d8c9b0a1f2e3d4c`  
**Use Case:** Production deployments requiring exact version tracking  
**Lifetime:** Permanent (unless manually deleted)

**Benefits:**
- ✅ Cryptographically unique
- ✅ Impossible to overwrite
- ✅ Direct link to git commit
- ✅ Audit trail for security compliance

**When to use:**
- Production deployments
- Security-critical deployments
- Compliance requirements
- Incident response (exact rollback)

#### Short SHA with Branch Prefix
```
ghcr.io/creditxcredit/workstation:main-abc1234
```

**Purpose:** Human-readable commit reference  
**Format:** `{branch}-{short-sha}` where short-sha is first 7 characters  
**Example:** `ghcr.io/creditxcredit/workstation:main-53b3276`  
**Use Case:** Easier identification in lists and documentation  
**Lifetime:** Permanent (unless manually deleted)

**Benefits:**
- ✅ Human-readable
- ✅ Branch context included
- ✅ Easier to remember and communicate
- ✅ Good for documentation and runbooks

**When to use:**
- Documentation examples
- Rollback procedures
- Team communication
- Support tickets

### 2. Branch Tags

```
ghcr.io/creditxcredit/workstation:main
```

**Purpose:** Latest commit on specific branch  
**Format:** Branch name  
**Example:** `ghcr.io/creditxcredit/workstation:main`  
**Use Case:** Continuous deployment to staging environments  
**Lifetime:** Mutable (updated with each push to branch)

**Benefits:**
- ✅ Always current for branch
- ✅ Simple reference
- ✅ Good for auto-deployments

**Cautions:**
- ⚠️ Mutable (changes over time)
- ⚠️ Not recommended for production
- ⚠️ Can cause unexpected updates

**When to use:**
- Staging environments
- Development environments
- CI/CD pipelines (with caution)
- Testing latest changes

### 3. Latest Tag

```
ghcr.io/creditxcredit/workstation:latest
```

**Purpose:** Most recent main branch build  
**Format:** Fixed string "latest"  
**Condition:** Only applied to main branch (default branch)  
**Use Case:** Quick testing, documentation examples  
**Lifetime:** Mutable (updated with each main branch push)

**Benefits:**
- ✅ Industry standard convention
- ✅ Simple for quick tests
- ✅ Default in most docker commands

**Cautions:**
- ⚠️ Highly mutable
- ⚠️ No version information
- ⚠️ Can break reproducibility
- ⚠️ **Never use in production**

**When to use:**
- Local development
- Quick testing
- Documentation examples
- `docker run` experiments

**When NOT to use:**
- Production deployments
- Staging environments
- Any automated deployment
- Anywhere stability is required

### 4. Semantic Version Tags

```
ghcr.io/creditxcredit/workstation:1.0.0
ghcr.io/creditxcredit/workstation:1.0
ghcr.io/creditxcredit/workstation:1
```

**Purpose:** Stable release versions following semver  
**Format:** `{major}.{minor}.{patch}` with partial versions  
**Trigger:** Created when git tags matching `v*` pattern are pushed  
**Use Case:** Production deployments, stable releases  
**Lifetime:** Immutable after release

**Tag Variants:**
- **Full version** (`1.0.0`): Exact release
- **Minor version** (`1.0`): Latest patch in minor version
- **Major version** (`1`): Latest minor in major version

**Benefits:**
- ✅ Clear versioning semantics
- ✅ Supports version ranges
- ✅ Industry standard
- ✅ Changelog correlation

**When to use:**
- Production deployments
- Customer-facing releases
- Public API versions
- Long-term support

**Creating semantic version tags:**
```bash
# Tag the commit
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# CI automatically creates:
# - ghcr.io/creditxcredit/workstation:1.0.0
# - ghcr.io/creditxcredit/workstation:1.0
# - ghcr.io/creditxcredit/workstation:1
```

## Tagging Matrix

| Trigger Event | Tags Created | Example |
|--------------|--------------|---------|
| Push to main (no tag) | Long SHA, Short SHA, Branch, Latest | `abc123...`, `main-abc1234`, `main`, `latest` |
| Push git tag v1.0.0 | All above + Semver | + `1.0.0`, `1.0`, `1` |
| Push git tag v1.1.0 | All above + Semver | + `1.1.0`, `1.1`, `1` (updates) |
| Push git tag v1.1.1 | All above + Semver | + `1.1.1`, `1.1` (updates), `1` (updates) |
| Push git tag v2.0.0 | All above + Semver | + `2.0.0`, `2.0`, `2` |

## Image Labels (Metadata)

Every image includes OpenContainer Initiative (OCI) standard labels:

### Standard Labels

```dockerfile
org.opencontainers.image.title          = "stackBrowserAgent"
org.opencontainers.image.description    = "Lightweight, secure JWT-based authentication service"
org.opencontainers.image.vendor         = "creditXcredit"
org.opencontainers.image.source         = "https://github.com/creditXcredit/workstation"
org.opencontainers.image.documentation  = "https://github.com/creditXcredit/workstation/blob/main/README.md"
org.opencontainers.image.licenses       = "MIT"
```

### Dynamic Labels (Build-time)

```dockerfile
org.opencontainers.image.created   = "2024-11-14T20:30:00Z"      # Build timestamp
org.opencontainers.image.revision  = "53b3276f8a9e1d2c..."       # Git commit SHA
org.opencontainers.image.version   = "main" or "1.0.0"           # Version/branch
```

### Inspecting Labels

```bash
# View all labels
docker inspect ghcr.io/creditxcredit/workstation:main \
  --format='{{json .Config.Labels}}' | jq

# View specific label
docker inspect ghcr.io/creditxcredit/workstation:main \
  --format='{{index .Config.Labels "org.opencontainers.image.revision"}}'

# View creation time
docker inspect ghcr.io/creditxcredit/workstation:main \
  --format='{{index .Config.Labels "org.opencontainers.image.created"}}'
```

## Multi-Platform Support

Images are built for multiple architectures:

```
linux/amd64   # x86_64 - Most common (cloud, desktop)
linux/arm64   # ARM 64-bit (Apple Silicon, AWS Graviton, Raspberry Pi 4)
```

### Platform-Specific Pulls

Docker automatically selects the correct platform:

```bash
# Automatically selects correct architecture
docker pull ghcr.io/creditxcredit/workstation:latest

# Force specific platform
docker pull --platform linux/amd64 ghcr.io/creditxcredit/workstation:latest
docker pull --platform linux/arm64 ghcr.io/creditxcredit/workstation:latest
```

## Build Process

### Trigger Conditions

```yaml
# Only builds on pushes to main branch
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

**Builds occur when:**
- ✅ Commits pushed directly to main
- ✅ Pull requests merged to main
- ✅ Git tags pushed to main

**Builds do NOT occur for:**
- ❌ Pull requests (before merge)
- ❌ Pushes to other branches
- ❌ Draft pull requests
- ❌ Closed pull requests

### Build Steps

1. **Checkout code** - Clone repository
2. **Setup Docker Buildx** - Enable multi-platform builds
3. **Login to GHCR** - Authenticate with GitHub token
4. **Extract metadata** - Generate tags and labels
5. **Build & Push** - Multi-platform build and push
6. **Generate summary** - Create job summary with pull commands

### GitHub Actions Configuration

Located in `.github/workflows/ci.yml`:

```yaml
build-docker:
  name: Build and Push Docker Image
  runs-on: ubuntu-latest
  needs: [test]  # Only runs if tests pass
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  permissions:
    contents: read      # Read repository
    packages: write     # Push to GHCR
  
  steps:
    - uses: actions/checkout@v5
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata for Docker
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ghcr.io/${{ github.repository }}
        tags: |
          type=sha,prefix={{branch}}-,format=short
          type=sha,format=long
          type=ref,event=branch
          type=raw,value=latest,enable={{is_default_branch}}
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=semver,pattern={{major}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v6
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64,linux/arm64
        build-args: |
          BUILD_DATE=${{ github.event.head_commit.timestamp }}
          VCS_REF=${{ github.sha }}
          VERSION=${{ github.ref_name }}
```

## Usage Examples

### Pull Specific Version

```bash
# Pull by long SHA (most precise)
docker pull ghcr.io/creditxcredit/workstation:53b3276f8a9e1d2c3b4a5f6e7d8c9b0a1f2e3d4c

# Pull by short SHA (more readable)
docker pull ghcr.io/creditxcredit/workstation:main-53b3276

# Pull latest main
docker pull ghcr.io/creditxcredit/workstation:main

# Pull semantic version
docker pull ghcr.io/creditxcredit/workstation:1.0.0
```

### Run Container

```bash
# Run specific version
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  ghcr.io/creditxcredit/workstation:main-53b3276

# Run latest (not recommended for production)
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="your-secret" \
  ghcr.io/creditxcredit/workstation:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    # Production: Use specific SHA
    image: ghcr.io/creditxcredit/workstation:main-53b3276
    
    # Or semantic version
    # image: ghcr.io/creditxcredit/workstation:1.0.0
    
    # Staging: Use branch tag
    # image: ghcr.io/creditxcredit/workstation:main
    
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stackbrowseragent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stackbrowseragent
  template:
    metadata:
      labels:
        app: stackbrowseragent
    spec:
      containers:
      - name: app
        # Production: Use specific SHA
        image: ghcr.io/creditxcredit/workstation:main-53b3276
        
        # Or semantic version
        # image: ghcr.io/creditxcredit/workstation:1.0.0
        
        ports:
        - containerPort: 3000
```

## Finding Available Tags

### Method 1: GitHub Packages UI

Visit: https://github.com/creditXcredit/workstation/pkgs/container/workstation

View:
- All published versions
- Tag names
- Publish dates
- Image sizes
- Associated commits

### Method 2: GitHub API

```bash
# List all versions
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/users/creditxcredit/packages/container/workstation/versions \
  | jq '.[] | {name: .name, tags: .metadata.container.tags}'

# List specific version
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/users/creditxcredit/packages/container/workstation/versions/VERSION_ID
```

### Method 3: Docker Commands

```bash
# Note: Docker doesn't provide native registry browsing
# Use GitHub UI or API instead

# But you can inspect pulled images
docker images | grep workstation

# Get image digest
docker inspect ghcr.io/creditxcredit/workstation:main \
  --format='{{index .RepoDigests 0}}'
```

### Method 4: Git Repository

```bash
# Find commits that triggered builds
git log --oneline origin/main

# Each commit on main has a corresponding Docker image
# Use the short SHA (first 7 chars) with main- prefix
```

## Best Practices

### For Production Deployments

✅ **DO:**
- Use long SHA tags: `ghcr.io/creditxcredit/workstation:abc123...`
- Use short SHA tags: `ghcr.io/creditxcredit/workstation:main-abc1234`
- Use semantic versions: `ghcr.io/creditxcredit/workstation:1.0.0`
- Document deployed version in deployment records
- Test in staging before production

❌ **DON'T:**
- Use `latest` tag
- Use branch tags (`main`) unless for staging
- Rely on mutable tags
- Deploy without testing

### For Staging/Development

✅ **DO:**
- Use branch tags: `ghcr.io/creditxcredit/workstation:main`
- Use `latest` for quick local tests
- Auto-deploy on main branch updates
- Keep staging separate from production

### For Rollbacks

✅ **DO:**
- Document rollback target (SHA, version, date)
- Test rollback image before applying
- Keep rollback scripts updated
- Monitor after rollback
- Document reason for rollback

See [DOCKER_ROLLBACK_GUIDE.md](./DOCKER_ROLLBACK_GUIDE.md) for detailed rollback procedures.

### For Image Management

✅ **DO:**
- Keep semantic version tags permanently
- Keep recent main branch images (30-90 days)
- Delete untagged images regularly
- Monitor registry storage usage
- Use cleanup automation

## Versioning Strategy

### For Regular Commits

All commits to main:
```
Commit: 53b3276f...
Tags: 
  - ghcr.io/creditxcredit/workstation:53b3276f8a9e1d2c...
  - ghcr.io/creditxcredit/workstation:main-53b3276
  - ghcr.io/creditxcredit/workstation:main
  - ghcr.io/creditxcredit/workstation:latest
```

### For Release Commits

Release v1.0.0:
```
Commit: def5678a...
Git Tag: v1.0.0
Docker Tags:
  - ghcr.io/creditxcredit/workstation:def5678a9b0c1d2e...
  - ghcr.io/creditxcredit/workstation:main-def5678
  - ghcr.io/creditxcredit/workstation:main
  - ghcr.io/creditxcredit/workstation:latest
  - ghcr.io/creditxcredit/workstation:1.0.0
  - ghcr.io/creditxcredit/workstation:1.0
  - ghcr.io/creditxcredit/workstation:1
```

### Semantic Versioning Rules

Follow semver (https://semver.org/):

- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features (backward compatible)
- **Patch (1.0.0 → 1.0.1)**: Bug fixes (backward compatible)

Example timeline:
```
1.0.0 - Initial release
1.0.1 - Bug fix
1.0.2 - Bug fix
1.1.0 - New feature
1.1.1 - Bug fix
2.0.0 - Breaking change
```

## Security Considerations

### Image Scanning

Images are automatically scanned by:
- GitHub Container Registry (built-in)
- CodeQL (in CI pipeline)
- Dependabot (dependency vulnerabilities)

### Access Control

- **Public repository**: Images are publicly accessible
- **Authentication**: Required for pushing (GitHub Actions token)
- **Permissions**: Controlled via GitHub repository settings

### Supply Chain Security

- **Build reproducibility**: SHA tags ensure exact version
- **Provenance**: Labels link to source code commit
- **Audit trail**: GitHub Actions logs all builds
- **Signatures**: Consider implementing Sigstore/Cosign for image signing

### Vulnerability Response

If vulnerability found in specific image:

1. Identify affected tags
2. Build patched version
3. Update semantic version (patch bump)
4. Document in CHANGELOG
5. Notify users if public-facing
6. Consider deleting vulnerable tags

## Troubleshooting

### Tag Not Found

**Problem:** `docker pull ghcr.io/creditxcredit/workstation:main-abc1234` fails

**Solutions:**
1. Check SHA is correct: `git log --oneline | grep abc1234`
2. Verify image exists: Visit GitHub Packages UI
3. Check build succeeded: Review GitHub Actions logs
4. Ensure commit was on main branch

### Wrong Image Pulled

**Problem:** Pulled `latest` but got unexpected version

**Solution:**
- `latest` is mutable and changes
- Always use specific SHA or semver tags
- Verify with: `docker inspect IMAGE --format='{{index .Config.Labels "org.opencontainers.image.revision"}}'`

### Authentication Errors

**Problem:** `unauthorized: authentication required`

**Solution:**
```bash
# Create GitHub personal access token with read:packages
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Related Documentation

- [DOCKER_ROLLBACK_GUIDE.md](./DOCKER_ROLLBACK_GUIDE.md) - Rollback procedures
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [CI_QUICK_REFERENCE.md](./CI_QUICK_REFERENCE.md) - CI/CD overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

## References

- [OCI Image Spec](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
- [Docker Metadata Action](https://github.com/docker/metadata-action)
- [Semantic Versioning](https://semver.org/)
- [GitHub Container Registry Docs](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

**Version:** 1.0  
**Last Updated:** November 2024  
**Maintainer:** DevOps Team
