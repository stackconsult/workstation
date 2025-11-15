#!/bin/bash
# .automation/trigger-cycle-now.sh
# Manually trigger a cycle (for testing/emergency)

ROOT_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/master-orchestrator.sh"

echo "⚠️  WARNING: Manual Cycle Trigger"
echo "================================="
echo ""
echo "This will trigger an immediate autonomous improvement cycle."
echo "This should normally only run on Saturdays at 2:00 AM MST."
echo ""
echo "Use cases for manual trigger:"
echo "  - Testing the autonomous system"
echo "  - Emergency cycle after system changes"
echo "  - Recovering from a failed automatic cycle"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo ""
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🚀 Triggering immediate cycle..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$ROOT_DIR"
bash "$SCRIPT_PATH"

EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Cycle completed successfully"
else
    echo "❌ Cycle failed with exit code $EXIT_CODE"
    echo ""
    echo "Check logs:"
    echo "  .automation/logs/cycle-*.log"
    echo "  .automation/logs/agent*-week*.log"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $EXIT_CODE
