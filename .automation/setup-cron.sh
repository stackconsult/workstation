#!/bin/bash
# .automation/setup-cron.sh
# Install cron job for weekly autonomous cycle

CRON_SCHEDULE="0 2 * * 6"  # Every Saturday at 2:00 AM
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/master-orchestrator.sh"
ROOT_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"

echo "🤖 Installing autonomous cycle cron job..."
echo ""

# Check if cron is available
if ! command -v crontab &>/dev/null; then
    echo "❌ crontab command not found"
    echo "   Cron may not be installed or available in this environment"
    echo ""
    echo "   Alternative: Run manually or use system scheduler"
    echo "   Manual: bash $SCRIPT_PATH"
    exit 1
fi

# Create cron job entry
CRON_ENTRY="$CRON_SCHEDULE cd $ROOT_DIR && bash $SCRIPT_PATH >> $ROOT_DIR/.automation/logs/cron.log 2>&1"

# Check if entry already exists
if crontab -l 2>/dev/null | grep -q "master-orchestrator.sh"; then
    echo "ℹ️  Cron job already exists. Removing old entry..."
    (crontab -l 2>/dev/null | grep -v "master-orchestrator.sh") | crontab -
fi

# Install new cron job
echo "📝 Adding cron job..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✅ Cron job installed successfully!"
echo ""
echo "Details:"
echo "  Schedule: Every Saturday at 2:00 AM MST"
echo "  Script:   $SCRIPT_PATH"
echo "  Log:      $ROOT_DIR/.automation/logs/cron.log"
echo ""
echo "Current crontab entries for master-orchestrator:"
crontab -l 2>/dev/null | grep master-orchestrator.sh || echo "  (none found - installation may have failed)"
echo ""
echo "Next scheduled run:"
# Try to calculate next Saturday at 2:00 AM
if command -v date &>/dev/null; then
    if date -d 'next saturday 02:00' +'%Y-%m-%d %H:%M %Z' 2>/dev/null; then
        :
    else
        echo "  Next Saturday at 2:00 AM"
    fi
else
    echo "  Next Saturday at 2:00 AM"
fi
echo ""
echo "To verify installation:"
echo "  crontab -l | grep master-orchestrator"
echo ""
echo "To remove the cron job:"
echo "  crontab -l | grep -v master-orchestrator.sh | crontab -"
