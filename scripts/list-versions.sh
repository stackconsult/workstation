#!/bin/bash
set -euo pipefail

# List Available Versions Script
# Usage: ./scripts/list-versions.sh [agent-number]

AGENT_NUM="${1:-all}"

echo "📋 Available Versions for Rollback"
echo "=================================="

if [ "${AGENT_NUM}" == "all" ]; then
  # List all agents
  for i in {1..20}; do
    printf "\n🤖 Agent %02d:\n" $i
    docker images "ghcr.io/creditxcredit/workstation-agent-$(printf '%02d' $i)" \
      --format "  {{.Tag}} ({{.CreatedSince}})" 2>/dev/null || echo "  No versions found"
  done
else
  # List specific agent
  printf "\n🤖 Agent %02d:\n" "${AGENT_NUM}"
  docker images "ghcr.io/creditxcredit/workstation-agent-$(printf '%02d' ${AGENT_NUM})" \
    --format "  {{.Tag}} ({{.CreatedSince}})"
fi

echo ""
echo "=================================="
echo "Usage: ./scripts/rollback-agent.sh modules/XX-name <version>"
echo "Example: ./scripts/rollback-agent.sh modules/01-selectors abc1234"
