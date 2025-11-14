# Recovery Scripts

This directory contains scripts to recover the correct workstation code that was overwritten with stackBrowserAgent code.

## Scripts

### 1. `recover-from-container.sh`

**Purpose:** Extracts the correct workstation code from published container images and restores the repository.

**Usage:**
```bash
# For AMD64 systems (most common)
./scripts/recover-from-container.sh amd64

# For ARM64 systems (M1/M2 Macs, ARM servers)
./scripts/recover-from-container.sh arm64

# For multi-arch
./scripts/recover-from-container.sh multi
```

**What it does:**
1. Backs up current (incorrect) repository content
2. Pulls the correct container image from GitHub Container Registry
3. Extracts source code from the container
4. Replaces repository content with extracted code
5. Preserves `.git` and `.github` directories
6. Provides verification steps

**Requirements:**
- Docker installed and running
- Authenticated to GitHub Container Registry
- Sufficient disk space for backup

### 2. `test-container-access.sh`

**Purpose:** Verifies you can access the container images before attempting recovery.

**Usage:**
```bash
./scripts/test-container-access.sh
```

**What it checks:**
- ✅ Docker is installed
- ✅ Docker daemon is running
- ✅ Authentication to GitHub Container Registry
- ✅ Container manifest is accessible

**Run this first** to ensure everything is set up correctly!

## Container Images

The correct workstation code is available in these container images:

**Tag:** `copilot-fix-failing-ci-checks-4b31220`

### AMD64 (x86_64)
```bash
docker pull ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:63e562307e19dcd7b6e976f1470ad7e14465b096fac1caeca0a85150a3cd04e0
```

### ARM64 (aarch64)
```bash
docker pull ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:d6bfa9d27159e3aaa90a8eab83a20ba209d655b701c37155e69f98c0c8db81d1
```

### Multi-arch
```bash
docker pull ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:7f762f3e4d3d05209516edd5885edd4f392a410fa6c46f556dbf92bb35ec790b
```

## Authentication

To pull containers from GitHub Container Registry, you need to authenticate:

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens/new?scopes=read:packages
   - Add note: "Workstation Recovery"
   - Select scope: `read:packages`
   - Generate token

2. **Login to GitHub Container Registry:**
   ```bash
   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

3. **Verify authentication:**
   ```bash
   ./scripts/test-container-access.sh
   ```

## Quick Start

```bash
# Step 1: Test access
./scripts/test-container-access.sh

# Step 2: If test passes, run recovery
./scripts/recover-from-container.sh amd64

# Step 3: Verify recovered code
cat package.json | grep name
npm install
npm test

# Step 4: Commit the recovery
git add .
git commit -m "Restore original workstation code from container"
git push
```

## Troubleshooting

### "Docker not found"
Install Docker:
- **macOS:** https://docs.docker.com/desktop/install/mac-install/
- **Windows:** https://docs.docker.com/desktop/install/windows-install/
- **Linux:** https://docs.docker.com/engine/install/

### "Docker daemon not running"
- **macOS/Windows:** Start Docker Desktop application
- **Linux:** `sudo systemctl start docker`

### "Authentication required"
Follow the authentication steps above to login to ghcr.io

### "Cannot pull container"
- Check your internet connection
- Verify authentication: `docker login ghcr.io`
- Check token has `read:packages` permission
- Try the test script: `./scripts/test-container-access.sh`

### "Extraction failed"
- Ensure container was pulled: `docker images | grep workstation`
- Check disk space: `df -h`
- Try manual extraction (see REPOSITORY_RECOVERY.md)

## Manual Recovery

If the automated scripts don't work, you can manually extract:

```bash
# 1. Pull container
docker pull ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:63e562307e19dcd7b6e976f1470ad7e14465b096fac1caeca0a85150a3cd04e0

# 2. Create temporary container
CONTAINER_ID=$(docker create ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:63e562307e19dcd7b6e976f1470ad7e14465b096fac1caeca0a85150a3cd04e0)

# 3. Extract source code
docker cp $CONTAINER_ID:/app ./recovered-workstation

# 4. Clean up
docker rm $CONTAINER_ID

# 5. Review extracted code
cd recovered-workstation
ls -la
cat package.json

# 6. Copy to repository (backup first!)
cd ..
cp -r recovered-workstation/* .
```

## What Gets Recovered?

The container includes:
- ✅ Original workstation source code
- ✅ package.json with correct project name
- ✅ All TypeScript/JavaScript files
- ✅ Configuration files
- ✅ Dependencies (in node_modules if present)
- ✅ Built assets (in dist if present)

The recovery preserves:
- ✅ `.git` directory (git history)
- ✅ `.github` directory (workflows, agents)
- ✅ Recovery documentation

## Support

If you encounter issues:
1. Run the test script: `./scripts/test-container-access.sh`
2. Check the logs in the terminal output
3. Review REPOSITORY_RECOVERY.md for detailed information
4. Check QUICK_RECOVERY_GUIDE.md for step-by-step instructions

## Alternative Recovery

If container extraction doesn't work:
- **From local machine:** If you still have the original workspace locally, push it directly
- **From git history:** Check if there's a commit before the overwrite (unlikely based on investigation)
- **Rebuild from scratch:** If you remember the structure, rebuild the workspace

See QUICK_RECOVERY_GUIDE.md for more options.
