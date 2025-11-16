#!/bin/bash
#
# Repository Recovery Script
# Extracts correct workstation code from published container package
#
# Usage: ./scripts/recover-from-container.sh [architecture]
#   architecture: amd64 (default), arm64, or multi
#

set -e

# Detect architecture or use argument
ARCH="${1:-amd64}"

# Configuration - Multiple container image options
case "$ARCH" in
    amd64|linux/amd64)
        CONTAINER_IMAGE="ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:63e562307e19dcd7b6e976f1470ad7e14465b096fac1caeca0a85150a3cd04e0"
        ARCH_NAME="linux/amd64"
        ;;
    arm64|linux/arm64)
        CONTAINER_IMAGE="ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:d6bfa9d27159e3aaa90a8eab83a20ba209d655b701c37155e69f98c0c8db81d1"
        ARCH_NAME="linux/arm64"
        ;;
    multi|unknown)
        CONTAINER_IMAGE="ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:7f762f3e4d3d05209516edd5885edd4f392a410fa6c46f556dbf92bb35ec790b"
        ARCH_NAME="multi-arch"
        ;;
    *)
        echo "❌ Error: Unknown architecture: $ARCH"
        echo "Usage: $0 [amd64|arm64|multi]"
        exit 1
        ;;
esac

BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
RECOVERY_DIR="recovered-workstation"

echo "🔄 Workstation Repository Recovery Script"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Backup current (incorrect) repository content"
echo "  2. Pull correct workstation code from container package"
echo "  3. Extract source code from container"
echo "  4. Replace current content with correct code"
echo "  5. Preserve .git and .github directories"
echo ""
echo "Architecture: ${ARCH_NAME}"
echo "Container: ${CONTAINER_IMAGE}"
echo ""
echo "Available container images:"
echo "  - linux/amd64: sha256:63e562307e19dcd7b6e976f1470ad7e14465b096fac1caeca0a85150a3cd04e0"
echo "  - linux/arm64: sha256:d6bfa9d27159e3aaa90a8eab83a20ba209d655b701c37155e69f98c0c8db81d1"
echo "  - multi-arch:  sha256:7f762f3e4d3d05209516edd5885edd4f392a410fa6c46f556dbf92bb35ec790b"
echo ""

# Verify Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if user is logged into GitHub Container Registry
echo "Checking GitHub Container Registry authentication..."
if ! docker pull "${CONTAINER_IMAGE}" 2>/dev/null; then
    echo ""
    echo "⚠️  Authentication required for GitHub Container Registry"
    echo ""
    echo "Please authenticate with:"
    echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
    echo ""
    echo "Or create a personal access token with 'read:packages' scope:"
    echo "  https://github.com/settings/tokens/new?scopes=read:packages"
    echo ""
    exit 1
fi

echo "✅ Successfully pulled container image"
echo ""

# Create backup of current content
echo "📦 Creating backup of current content..."
mkdir -p "${BACKUP_DIR}"

# Backup everything except .git
cp -r . "${BACKUP_DIR}/" 2>/dev/null || true

echo "✅ Backup created: ${BACKUP_DIR}"
echo ""

# Extract source code from container
echo "📂 Extracting source code from container..."
mkdir -p "${RECOVERY_DIR}"

# Create container without starting it
CONTAINER_ID=$(docker create "${CONTAINER_IMAGE}")

# Extract the /app directory (where the source code is in the container)
docker cp "${CONTAINER_ID}:/app" "${RECOVERY_DIR}/"

# Clean up container
docker rm "${CONTAINER_ID}" > /dev/null

echo "✅ Source code extracted to: ${RECOVERY_DIR}/app"
echo ""

# Verify extraction
if [ ! -d "${RECOVERY_DIR}/app" ]; then
    echo "❌ Error: Failed to extract source code from container"
    exit 1
fi

echo "📋 Extracted content:"
ls -la "${RECOVERY_DIR}/app"
echo ""

# Check if package.json exists
if [ -f "${RECOVERY_DIR}/app/package.json" ]; then
    echo "📄 Found package.json:"
    grep -E '"name"|"description"|"version"' "${RECOVERY_DIR}/app/package.json" | head -5
    echo ""
fi

# Ask for confirmation before replacing
echo "⚠️  Ready to replace current repository content"
echo ""
echo "This will:"
echo "  - Delete all files in repository root (except .git and .github)"
echo "  - Copy extracted source code to repository root"
echo "  - Preserve .github/agents and .github/workflows"
echo ""
read -r -p "Continue with recovery? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "❌ Recovery cancelled"
    echo "Extracted code available in: ${RECOVERY_DIR}/app"
    exit 0
fi

echo ""
echo "🔄 Replacing repository content..."

# Save .git and .github directories
echo "Preserving .git and .github..."
mv .git .git-temp
mv .github .github-temp

# Remove all files except backup, recovery, and temp dirs
find . -mindepth 1 -maxdepth 1 \
    ! -name '.git-temp' \
    ! -name '.github-temp' \
    ! -name "${BACKUP_DIR}" \
    ! -name "${RECOVERY_DIR}" \
    ! -name 'scripts' \
    -exec rm -rf {} +

# Copy extracted source code
cp -r "${RECOVERY_DIR}/app/"* .
cp -r "${RECOVERY_DIR}/app/."* . 2>/dev/null || true

# Restore .git and .github
mv .git-temp .git
mv .github-temp .github

# Restore recovery documentation
if [ -f "${BACKUP_DIR}/REPOSITORY_RECOVERY.md" ]; then
    cp "${BACKUP_DIR}/REPOSITORY_RECOVERY.md" .
fi

echo "✅ Repository content replaced"
echo ""

# Show what changed
echo "📊 Repository Status:"
echo ""
echo "Current files:"
ls -la
echo ""

if [ -f "package.json" ]; then
    echo "📦 package.json:"
    grep -E '"name"|"description"|"version"' package.json
    echo ""
fi

echo "✅ Recovery Complete!"
echo ""
echo "Next steps:"
echo "  1. Review the recovered code: git status"
echo "  2. Install dependencies: npm install"
echo "  3. Run tests: npm test"
echo "  4. Commit changes: git add . && git commit -m 'Recover correct workstation code from container'"
echo ""
echo "Backup of previous content: ${BACKUP_DIR}"
echo "Extracted source available: ${RECOVERY_DIR}"
echo ""
