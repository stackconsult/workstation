#!/bin/bash
set -euo pipefail

# Emergency Rollback All - System-wide rollback to previous versions
# Usage: ./emergency-rollback-all.sh [previous|commit-sha]

TARGET_VERSION="${1:-previous}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/emergency-rollback-$(date +%Y%m%d-%H%M%S).log"

echo "🚨 EMERGENCY ROLLBACK ALL AGENTS" | tee -a "$LOG_FILE"
echo "=================================" | tee -a "$LOG_FILE"
echo "Target version: $TARGET_VERSION" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# List of all 20 agents
AGENTS=(
  "modules/01-selectors"
  "modules/02-navigation"
  "modules/03-extraction"
  "modules/04-error-handling"
  "modules/05-workflow"
  "modules/06-project-builder"
  "modules/07-code-quality"
  "modules/08-performance"
  "modules/09-error-tracker"
  "modules/10-security"
  "modules/11-accessibility"
  "modules/12-integration"
  "modules/13-docs-auditor"
  "modules/14-advanced-automation"
  "modules/15-api-integration"
  "modules/16-data-processing"
  "modules/17-learning-platform"
  "modules/18-community-hub"
  "modules/19-deployment"
  "modules/20-orchestrator"
)

SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_AGENTS=()

echo "Rolling back ${#AGENTS[@]} agents..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

for agent in "${AGENTS[@]}"; do
  echo "🔄 Rolling back $agent..." | tee -a "$LOG_FILE"
  
  if "$SCRIPT_DIR/rollback-agent.sh" "$agent" "$TARGET_VERSION" >> "$LOG_FILE" 2>&1; then
    echo "  ✅ Success" | tee -a "$LOG_FILE"
    ((SUCCESS_COUNT++))
  else
    echo "  ❌ Failed" | tee -a "$LOG_FILE"
    ((FAIL_COUNT++))
    FAILED_AGENTS+=("$agent")
  fi
  
  echo "" | tee -a "$LOG_FILE"
done

echo "=================================" | tee -a "$LOG_FILE"
echo "EMERGENCY ROLLBACK SUMMARY" | tee -a "$LOG_FILE"
echo "=================================" | tee -a "$LOG_FILE"
echo "Total agents: ${#AGENTS[@]}" | tee -a "$LOG_FILE"
echo "Successful: $SUCCESS_COUNT" | tee -a "$LOG_FILE"
echo "Failed: $FAIL_COUNT" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ $FAIL_COUNT -gt 0 ]; then
  echo "⚠️  Failed agents:" | tee -a "$LOG_FILE"
  for agent in "${FAILED_AGENTS[@]}"; do
    echo "  - $agent" | tee -a "$LOG_FILE"
  done
  echo "" | tee -a "$LOG_FILE"
  echo "❌ Emergency rollback completed with $FAIL_COUNT failures" | tee -a "$LOG_FILE"
  echo "📄 Full log: $LOG_FILE" | tee -a "$LOG_FILE"
  exit 1
else
  echo "✅ All agents rolled back successfully!" | tee -a "$LOG_FILE"
  echo "📄 Full log: $LOG_FILE" | tee -a "$LOG_FILE"
  
  # Verify health of all agents
  echo "" | tee -a "$LOG_FILE"
  echo "🔍 Verifying system health..." | tee -a "$LOG_FILE"
  
  HEALTH_PASS=0
  HEALTH_FAIL=0
  
  for i in {1..20}; do
    PORT=$((3000 + i))
    if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
      ((HEALTH_PASS++))
    else
      ((HEALTH_FAIL++))
    fi
  done
  
  echo "Health check: $HEALTH_PASS/${{#AGENTS[@]}} passing" | tee -a "$LOG_FILE"
  
  if [ $HEALTH_FAIL -gt 0 ]; then
    echo "⚠️  $HEALTH_FAIL agents failed health check" | tee -a "$LOG_FILE"
    echo "Run health-check.sh for details" | tee -a "$LOG_FILE"
  fi
  
  exit 0
fi
