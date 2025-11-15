#!/bin/bash
# .automation/check-cycle-health.sh
# Check status of current or last cycle

WEEK=$(date +%U)
YEAR=$(date +%Y)
ROOT_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"

echo "🔍 Autonomous Cycle Health Check"
echo "================================="
echo ""

# Check if cycle running
if ps aux | grep -q "[m]aster-orchestrator.sh"; then
    echo "🟢 Status: CYCLE IN PROGRESS"
    echo ""
    echo "Running processes:"
    ps aux | grep -E "[m]aster-orchestrator|agent[7-9]|agent1[0-2]" | grep -v grep
else
    echo "⚪ Status: IDLE (next cycle Saturday 2:00 AM MST)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Last Completed Cycle:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$ROOT_DIR/.cycle-complete-week-$WEEK.json" ]; then
    echo "This week (Week $WEEK):"
    if command -v jq &>/dev/null; then
        cat "$ROOT_DIR/.cycle-complete-week-$WEEK.json" | jq .
    else
        cat "$ROOT_DIR/.cycle-complete-week-$WEEK.json"
    fi
elif [ -f "$ROOT_DIR/.cycle-complete-week-$((WEEK-1)).json" ]; then
    echo "Last week (Week $((WEEK-1))):"
    if command -v jq &>/dev/null; then
        cat "$ROOT_DIR/.cycle-complete-week-$((WEEK-1)).json" | jq .
    else
        cat "$ROOT_DIR/.cycle-complete-week-$((WEEK-1)).json"
    fi
else
    echo "  No completed cycles found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Recent Cycle Logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$ROOT_DIR/.automation/logs" ]; then
    ls -lht "$ROOT_DIR/.automation/logs/cycle-"*.log 2>/dev/null | head -5 || echo "  No cycle logs found"
else
    echo "  No logs directory found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Agent Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for agent in {7..12}; do
    if [ -d "$ROOT_DIR/agents/agent${agent}" ]; then
        if [ -f "$ROOT_DIR/.agent${agent}-handoff.json" ] || [ -f "$ROOT_DIR/.agent${agent}-complete.json" ]; then
            echo "  ✅ Agent $agent: Ready (handoff artifact exists)"
        else
            echo "  ⚪ Agent $agent: Ready (no recent handoff)"
        fi
    else
        echo "  ❌ Agent $agent: Directory not found"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Intelligence Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$ROOT_DIR/.agent12-complete.json" ]; then
    echo "Latest QA Report:"
    if command -v jq &>/dev/null; then
        jq -r '"  Intelligence Score: \(.intelligence_score)/100 (\(.quality_grade))"' "$ROOT_DIR/.agent12-complete.json"
        jq -r '"  Week: \(.week), Year: \(.year)"' "$ROOT_DIR/.agent12-complete.json"
        jq -r '"  Status: \(.status)"' "$ROOT_DIR/.agent12-complete.json"
    else
        cat "$ROOT_DIR/.agent12-complete.json"
    fi
else
    echo "  No QA completion artifact found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Scheduled Cycle:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v date &>/dev/null; then
    if date -d 'next saturday 02:00' +'%Y-%m-%d %H:%M %Z' 2>/dev/null; then
        :
    else
        echo "Next Saturday at 2:00 AM MST"
    fi
else
    echo "Next Saturday at 2:00 AM MST"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Manual trigger: bash .automation/trigger-cycle-now.sh"
echo "  View logs:      tail -f .automation/logs/cycle-*.log"
echo "  View QA report: cat agents/agent12/reports/week-*/QA_INTELLIGENCE_REPORT.md"
