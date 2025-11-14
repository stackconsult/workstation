#!/bin/bash
#
# Test Container Access
# Verifies that you can access the workstation container images
#
# Usage: ./scripts/test-container-access.sh
#

set -e

echo "🔍 Testing Container Access"
echo "============================"
echo ""

# Check Docker
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker is installed"
    docker --version
else
    echo "   ❌ Docker is not installed"
    echo "   Install from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo ""

# Check Docker daemon
echo "2. Checking Docker daemon..."
if docker info &> /dev/null; then
    echo "   ✅ Docker daemon is running"
else
    echo "   ❌ Docker daemon is not running"
    echo "   Start Docker Desktop or Docker service"
    exit 1
fi
echo ""

# Test authentication
echo "3. Testing GitHub Container Registry authentication..."
echo "   Attempting to inspect container manifest..."
echo ""

# Try to pull the manifest (won't download layers, just metadata)
CONTAINER_AMD64="ghcr.io/creditxcredit/workstation/backend:copilot-fix-failing-ci-checks-4b31220@sha256:63e562307e19dcd7b6e976f1470ad7e14465b096fac1caeca0a85150a3cd04e0"

if docker manifest inspect "$CONTAINER_AMD64" &> /dev/null; then
    echo "   ✅ Authentication successful!"
    echo "   You can pull the container images"
    echo ""
    echo "   Container details:"
    docker manifest inspect "$CONTAINER_AMD64" | grep -E '"architecture"|"os"|"size"' | head -10
    echo ""
    echo "   ✅ Ready to recover! Run: ./scripts/recover-from-container.sh"
else
    echo "   ⚠️  Authentication required"
    echo ""
    echo "   To authenticate, run:"
    echo "   echo \$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
    echo ""
    echo "   Or create a Personal Access Token with 'read:packages' scope:"
    echo "   https://github.com/settings/tokens/new?scopes=read:packages"
    echo ""
    echo "   Then login:"
    echo "   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
    
    # Try alternative: check if already logged in
    if grep -q "ghcr.io" ~/.docker/config.json 2>/dev/null; then
        echo ""
        echo "   Note: Found ghcr.io in Docker config, but authentication may be expired"
    fi
    
    exit 1
fi
echo ""

echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Run recovery: ./scripts/recover-from-container.sh amd64"
echo "2. Or for ARM: ./scripts/recover-from-container.sh arm64"
echo ""
