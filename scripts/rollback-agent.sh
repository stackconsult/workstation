#!/bin/bash
set -euo pipefail

# Rollback Agent Script
# Usage: ./scripts/rollback-agent.sh <component> <version>
# Example: ./scripts/rollback-agent.sh modules/01-selectors previous

COMPONENT="$1"
VERSION="${2:-previous}"

echo "🔄 Rolling back ${COMPONENT} to ${VERSION}..."

# Get component name from path
COMPONENT_NAME=$(basename "${COMPONENT}")
AGENT_NUM=$(echo "${COMPONENT_NAME}" | grep -oP '\d+' | head -1)

# Determine target version
if [ "${VERSION}" == "previous" ]; then
  # Get previous version from GHCR
  CURRENT_TAG=$(docker inspect "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}:latest" --format='{{index .Config.Labels "org.opencontainers.image.version"}}' 2>/dev/null || echo "")
  
  if [ -z "${CURRENT_TAG}" ]; then
    echo "❌ Cannot determine current version"
    exit 1
  fi
  
  # Get list of all tags and find previous
  TARGET_TAG=$(docker images "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}" --format "{{.Tag}}" | grep -v "latest" | sort -r | sed -n '2p')
  
  if [ -z "${TARGET_TAG}" ]; then
    echo "❌ No previous version found"
    exit 1
  fi
else
  TARGET_TAG="${VERSION}"
fi

echo "📦 Target version: ${TARGET_TAG}"

# Pull target version
echo "⬇️  Pulling image..."
docker pull "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}:${TARGET_TAG}"

# Stop current container
echo "🛑 Stopping current container..."
docker stop "agent-${AGENT_NUM}" 2>/dev/null || true
docker rm "agent-${AGENT_NUM}" 2>/dev/null || true

# Start with target version
echo "🚀 Starting rolled-back version..."
docker run -d \
  --name "agent-${AGENT_NUM}" \
  --restart unless-stopped \
  -p "$((3000 + AGENT_NUM)):3000" \
  "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}:${TARGET_TAG}"

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

if docker exec "agent-${AGENT_NUM}" curl -f http://localhost:3000/health >/dev/null 2>&1; then
  echo "✅ Rollback successful!"
  
  # Tag as latest
  docker tag \
    "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}:${TARGET_TAG}" \
    "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}:latest"
  
  # Create rollback record
  mkdir -p logs/rollbacks
  echo "[$(date -Iseconds)] Rolled back agent-${AGENT_NUM} from ${CURRENT_TAG} to ${TARGET_TAG}" >> logs/rollbacks/history.log
  
  exit 0
else
  echo "❌ Rollback failed - health check not passing"
  echo "🔄 Attempting to restore previous version..."
  
  docker stop "agent-${AGENT_NUM}" 2>/dev/null || true
  docker rm "agent-${AGENT_NUM}" 2>/dev/null || true
  
  docker run -d \
    --name "agent-${AGENT_NUM}" \
    --restart unless-stopped \
    -p "$((3000 + AGENT_NUM)):3000" \
    "ghcr.io/creditxcredit/workstation-agent-${AGENT_NUM}:${CURRENT_TAG}"
  
  echo "⚠️  Restored to previous version. Rollback aborted."
  exit 1
fi
