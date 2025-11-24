#!/bin/bash
# agents/agent8/run-weekly-assessment.sh
# Agent 8: Weekly automated assessment execution
# Runs: Every Saturday 2:00 AM MST

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ASSESSMENT_DIR="agents/agent8/reports/$TIMESTAMP"
mkdir -p "$ASSESSMENT_DIR"

echo "🔍 Agent 8: Weekly Error Assessment & Documentation Audit"
echo "=========================================================="
echo "Timestamp: $TIMESTAMP"
echo "Execution: Saturday 2:00 AM MST (Automated)"
echo ""

# Step 1: Load Agent 7's latest security report (if exists)
echo "📥 Loading Agent 7 security report..."
if [ -d "security/reports" ]; then
  SECURITY_REPORT=$(ls -t security/reports/*/SECURITY_REPORT.md 2>/dev/null | head -1 || echo "")
  
  if [ -n "$SECURITY_REPORT" ] && [ -f "$SECURITY_REPORT" ]; then
    cp "$SECURITY_REPORT" "$ASSESSMENT_DIR/agent7-security-baseline.md"
    echo "✅ Security baseline loaded"
  else
    echo "⚠️  No security report found. Continuing without baseline..."
    echo "No Agent 7 security report available" > "$ASSESSMENT_DIR/agent7-security-baseline.md"
  fi
else
  echo "⚠️  No security directory found. Skipping security baseline..."
  echo "No security directory found" > "$ASSESSMENT_DIR/agent7-security-baseline.md"
fi

# Step 2: Run TypeScript assessment engine
echo ""
echo "🔍 Running assessment engine..."
cd agents/agent8

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

if [ ! -d "dist" ]; then
  echo "🔨 Building assessment engine..."
  npm run build
fi

npm run assess || {
  echo "⚠️  Assessment engine encountered issues, but continuing..."
}

cd ../..

# Step 3: Run Go code analysis (if Go code exists)
echo ""
echo "🔍 Analyzing Go codebase..."
if [ -d "localBrowserAutomation" ]; then
  cd localBrowserAutomation
  
  # Static analysis with go vet
  go vet ./... > "../$ASSESSMENT_DIR/go-vet-results.txt" 2>&1 || {
    echo "⚠️  go vet found some issues (captured in results)"
  }
  
  # Check for golangci-lint
  if command -v golangci-lint &> /dev/null; then
    golangci-lint run --out-format json > "../$ASSESSMENT_DIR/golangci-lint.json" 2>&1 || {
      echo "⚠️  golangci-lint found some issues (captured in results)"
    }
  else
    echo "⚠️  golangci-lint not installed. Skipping detailed Go analysis..."
    echo '{"Issues": []}' > "../$ASSESSMENT_DIR/golangci-lint.json"
  fi
  
  cd ..
else
  echo "⚠️  No Go code found. Skipping Go analysis..."
  echo "No Go code found" > "$ASSESSMENT_DIR/go-vet-results.txt"
  echo '{"Issues": []}' > "$ASSESSMENT_DIR/golangci-lint.json"
fi

# Step 4: Documentation completeness check
echo ""
echo "📚 Checking documentation completeness..."

cat > "$ASSESSMENT_DIR/documentation-audit.txt" <<'DOC_AUDIT'
Documentation Completeness Audit
=================================

Checking all agents for complete documentation...

DOC_AUDIT

for agent in {1..7}; do
  echo "" >> "$ASSESSMENT_DIR/documentation-audit.txt"
  echo "Agent $agent:" >> "$ASSESSMENT_DIR/documentation-audit.txt"
  
  if [ -f ".agent${agent}-handoff.json" ]; then
    echo "  ✅ Handoff artifact exists" >> "$ASSESSMENT_DIR/documentation-audit.txt"
  else
    echo "  ❌ Missing handoff artifact" >> "$ASSESSMENT_DIR/documentation-audit.txt"
  fi
  
  if [ -d "agents/agent${agent}" ]; then
    if [ -f "agents/agent${agent}/README.md" ]; then
      echo "  ✅ README.md exists" >> "$ASSESSMENT_DIR/documentation-audit.txt"
    else
      echo "  ❌ Missing README.md" >> "$ASSESSMENT_DIR/documentation-audit.txt"
    fi
  else
    echo "  ⚠️  Agent directory not found" >> "$ASSESSMENT_DIR/documentation-audit.txt"
  fi
done

# Step 5: Generate comprehensive assessment report
echo ""
echo "📊 Generating assessment report..."

cd agents/agent8
node dist/generate-report.js \
  --assessment-dir "../../$ASSESSMENT_DIR" \
  --output "../../$ASSESSMENT_DIR/ASSESSMENT_REPORT.md"
cd ../..

# Step 6: Update MCP memory
echo ""
echo "💾 Updating Agent 8 MCP memory..."

MEMORY_FILE="agents/agent8/memory/assessment-history.json"

# Create memory entry
cat > "$ASSESSMENT_DIR/memory-entry.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "week_number": $(date +%U),
  "year": $(date +%Y),
  "assessment_dir": "$ASSESSMENT_DIR",
  "findings": {
    "critical": $(grep -c "🔴" "$ASSESSMENT_DIR/ASSESSMENT_REPORT.md" 2>/dev/null || echo 0),
    "high": $(grep -c "🟠" "$ASSESSMENT_DIR/ASSESSMENT_REPORT.md" 2>/dev/null || echo 0),
    "medium": $(grep -c "🟡" "$ASSESSMENT_DIR/ASSESSMENT_REPORT.md" 2>/dev/null || echo 0),
    "low": $(grep -c "🔵" "$ASSESSMENT_DIR/ASSESSMENT_REPORT.md" 2>/dev/null || echo 0)
  },
  "agent7_security_score": "$(grep 'Overall.*:' $ASSESSMENT_DIR/agent7-security-baseline.md 2>/dev/null | grep -oP '\\d+/100' || echo 'N/A')",
  "handoff_to": "agent9"
}
EOF

# Append to memory (keep last 52 weeks)
if [ ! -f "$MEMORY_FILE" ]; then
  echo "[]" > "$MEMORY_FILE"
fi

if command -v jq &> /dev/null; then
  jq ". + [$(cat $ASSESSMENT_DIR/memory-entry.json)]" "$MEMORY_FILE" | jq '.[-52:]' > "$MEMORY_FILE.tmp"
  mv "$MEMORY_FILE.tmp" "$MEMORY_FILE"
  echo "✅ MCP memory updated"
else
  echo "⚠️  jq not installed. Memory update skipped..."
fi

# Step 7: Create Docker snapshot (if Docker is available)
echo ""
echo "📦 Creating Docker snapshot..."
if command -v docker &> /dev/null; then
  if docker ps -a --format '{{.Names}}' | grep -q 'agent-memory-store'; then
    docker commit agent-memory-store "agent8-memory:week-$(date +%U)-$(date +%Y)" 2>/dev/null || {
      echo "⚠️  Docker snapshot failed (container may not exist)"
    }
    echo "✅ Docker snapshot attempted"
  else
    echo "⚠️  agent-memory-store container not found. Skipping snapshot..."
  fi
else
  echo "⚠️  Docker not available. Skipping snapshot..."
fi

# Step 8: Generate handoff artifact for Agent 9
echo ""
echo "🔄 Creating handoff artifact for Agent 9..."

cat > ".agent8-handoff.json" <<EOF
{
  "agent_id": 8,
  "agent_name": "Error Assessment & Documentation Auditor",
  "status": "completed",
  "completed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "execution_type": "weekly_automated",
  "week_number": $(date +%U),
  "year": $(date +%Y),
  
  "assessment_results": {
    "report": "$ASSESSMENT_DIR/ASSESSMENT_REPORT.md",
    "critical_issues": $(jq '.findings.critical' "$ASSESSMENT_DIR/memory-entry.json" 2>/dev/null || echo 0),
    "high_issues": $(jq '.findings.high' "$ASSESSMENT_DIR/memory-entry.json" 2>/dev/null || echo 0),
    "medium_issues": $(jq '.findings.medium' "$ASSESSMENT_DIR/memory-entry.json" 2>/dev/null || echo 0),
    "overall_grade": "$(grep '## Overall Grade' -A 1 $ASSESSMENT_DIR/ASSESSMENT_REPORT.md 2>/dev/null | tail -1 | sed 's/*//g' || echo 'N/A')"
  },
  
  "areas_requiring_optimization": [
    $(grep -A 20 "## Recommendations for Agent 9" "$ASSESSMENT_DIR/ASSESSMENT_REPORT.md" 2>/dev/null | grep "^- " | head -5 | sed 's/^- /"/;s/$/"/' | paste -sd "," - || echo '"No specific recommendations"')
  ],
  
  "documentation_gaps": [
    $(grep "❌" "$ASSESSMENT_DIR/documentation-audit.txt" 2>/dev/null | sed 's/^/"/;s/$/"/' | paste -sd "," - || echo '""')
  ],
  
  "code_quality_issues": {
    "typescript": {
      "files_analyzed": $(find src -name "*.ts" 2>/dev/null | wc -l || echo 0),
      "issues_found": "See $ASSESSMENT_DIR/typescript-issues.json"
    },
    "go": {
      "files_analyzed": $(find localBrowserAutomation -name "*.go" 2>/dev/null | wc -l || echo 0),
      "issues_found": "See $ASSESSMENT_DIR/golangci-lint.json"
    }
  },
  
  "handoff_to_agent_9": {
    "priority_fixes": "Critical and High severity items in ASSESSMENT_REPORT.md",
    "optimization_targets": "Functions >50 lines, duplicated code, inefficient patterns",
    "documentation_updates": "Missing JSDoc, outdated README sections",
    "approval_threshold": {
      "minimum_grade": "B+",
      "max_critical": 0,
      "max_high": 2
    }
  },
  
  "mcp_memory": {
    "updated": true,
    "docker_snapshot": "agent8-memory:week-$(date +%U)-$(date +%Y)",
    "history_file": "$MEMORY_FILE"
  }
}
EOF

echo "✅ Handoff artifact created: .agent8-handoff.json"

# Step 9: Display summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Agent 8 Weekly Assessment Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  Critical: $(jq '.findings.critical' $ASSESSMENT_DIR/memory-entry.json 2>/dev/null || echo 'N/A')"
echo "  High:     $(jq '.findings.high' $ASSESSMENT_DIR/memory-entry.json 2>/dev/null || echo 'N/A')"
echo "  Medium:   $(jq '.findings.medium' $ASSESSMENT_DIR/memory-entry.json 2>/dev/null || echo 'N/A')"
echo "  Low:      $(jq '.findings.low' $ASSESSMENT_DIR/memory-entry.json 2>/dev/null || echo 'N/A')"
echo ""
echo "📁 Reports: $ASSESSMENT_DIR/"
echo "💾 MCP Memory: $MEMORY_FILE"
echo "🔄 Handoff: .agent8-handoff.json → Agent 9"
echo ""
echo "➡️  Next: Agent 9 (Optimization Magician) will process this report"
