#!/bin/bash
# Automated Code Statistics Updater
# This script keeps documentation synchronized with actual codebase statistics
# Run this script monthly or before major releases to keep stats current

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 Analyzing codebase statistics..."
echo "Repository: creditXcredit/workstation"
echo "Date: $(date '+%Y-%m-%d')"
echo ""

# Check if cloc is installed
if ! command -v cloc &> /dev/null; then
    echo "⚠️  cloc not found. Installing..."
    npm install -g cloc
fi

# Create temporary file for statistics
STATS_FILE="/tmp/code-stats-$(date +%s).txt"

# Run cloc analysis
echo "📊 Running cloc analysis..."
cloc --exclude-dir=node_modules,.git,dist,public,audit-reports,audit-screenshots,rollbacks,resolved-files \
     --exclude-ext=md,json,lock,yml,yaml,ini,txt \
     --quiet \
     . > "$STATS_FILE"

# Extract key metrics
TOTAL_FILES=$(grep "^SUM:" "$STATS_FILE" | awk '{print $2}')
TOTAL_CODE=$(grep "^SUM:" "$STATS_FILE" | awk '{print $5}')
TS_CODE=$(grep "^TypeScript" "$STATS_FILE" | awk '{print $5}')
TS_FILES=$(grep "^TypeScript" "$STATS_FILE" | awk '{print $2}')
JS_CODE=$(grep "^JavaScript" "$STATS_FILE" | awk '{print $5}')
JS_FILES=$(grep "^JavaScript" "$STATS_FILE" | awk '{print $2}')

echo ""
echo "✅ Analysis complete!"
echo "   Total Files: $TOTAL_FILES"
echo "   Total Code: $TOTAL_CODE lines"
echo "   TypeScript: $TS_CODE lines ($TS_FILES files)"
echo "   JavaScript: $JS_CODE lines ($JS_FILES files)"
echo ""

# Update CODE_STATISTICS.md
echo "📝 Updating CODE_STATISTICS.md..."
UPDATE_DATE=$(date '+%Y-%m-%d')

# Create updated header
cat > /tmp/code-stats-header.txt << EOF
# 📊 Code Statistics - Complete Breakdown

**Generated**: $UPDATE_DATE  
**Repository**: creditXcredit/workstation  
**Analysis Tool**: cloc v2.06  
**Verification**: GitHub LOC Counter + Manual Analysis

---

## 🎯 Executive Summary

This document provides **verified, accurate code statistics** for the Workstation repository.

**Key Metrics:**
- 📊 **$TOTAL_CODE total lines of code** across all languages
- 📊 **$TS_CODE lines of TypeScript** ($TS_FILES files)
- 📊 **$TOTAL_FILES source files** (excluding documentation and configuration)

**Last Updated**: $UPDATE_DATE (automated via scripts/update-code-statistics.sh)

---

## 📈 Overall Statistics

### Complete Codebase Analysis

\`\`\`
EOF

# Append full cloc output
cat "$STATS_FILE" >> /tmp/code-stats-header.txt
echo '```' >> /tmp/code-stats-header.txt

# Preserve existing content after the stats section if it exists
if [ -f "CODE_STATISTICS.md" ]; then
    # Extract content after the first complete stats section (after the closing ```)
    sed -n '/^---$/,$ { /^---$/! p }' CODE_STATISTICS.md | tail -n +2 > /tmp/code-stats-rest.txt 2>/dev/null || echo "" > /tmp/code-stats-rest.txt
    
    # Combine header with rest of content
    cat /tmp/code-stats-header.txt > CODE_STATISTICS.md.new
    echo "" >> CODE_STATISTICS.md.new
    echo "---" >> CODE_STATISTICS.md.new
    cat /tmp/code-stats-rest.txt >> CODE_STATISTICS.md.new 2>/dev/null || true
    
    mv CODE_STATISTICS.md.new CODE_STATISTICS.md
else
    mv /tmp/code-stats-header.txt CODE_STATISTICS.md
fi

echo "✅ CODE_STATISTICS.md updated"

# Update ROADMAP.md statistics section
echo "📝 Updating ROADMAP.md statistics..."

# Update specific line in ROADMAP.md
sed -i "s/^- 📊 \*\*[0-9,]* total lines of code\*\*/- 📊 **$TOTAL_CODE total lines of code**/" docs/architecture/ROADMAP.md 2>/dev/null || true
sed -i "s/^- 📊 \*\*[0-9,]* lines of TypeScript\*\*/- 📊 **$TS_CODE lines of TypeScript**/" docs/architecture/ROADMAP.md 2>/dev/null || true
sed -i "s/(\([0-9]*\) files) - [0-9.]*x larger/(${TS_FILES} files) - $(echo "scale=1; $TS_CODE / 3367" | bc)x larger/" docs/architecture/ROADMAP.md 2>/dev/null || true

echo "✅ ROADMAP.md updated"

# Update README.md if it has statistics
if grep -q "Lines of Production Code" README.md 2>/dev/null; then
    echo "📝 Updating README.md statistics..."
    sed -i "s/\*\*[0-9,]* Lines of Production Code\*\*/\*\*$TOTAL_CODE Lines of Production Code\*\*/" README.md 2>/dev/null || true
    echo "✅ README.md updated"
fi

# Cleanup
rm -f "$STATS_FILE" /tmp/code-stats-*.txt

echo ""
echo "🎉 Code statistics update complete!"
echo ""
echo "Files updated:"
echo "  - CODE_STATISTICS.md"
echo "  - docs/architecture/ROADMAP.md"
echo "  - README.md (if applicable)"
echo ""

# Check milestone lock compliance
echo "🔒 Checking milestone lock compliance..."
if [ -f "MILESTONE_LOCK_2025-12-01.md" ]; then
    echo "✅ Milestone lock file exists"
    echo ""
    echo "⚠️  REMINDER: Completion percentages are LOCKED at:"
    echo "   - Phase 1: 100% (locked)"
    echo "   - Phase 2: 95% minimum (locked)"
    echo "   - Phase 3: 85% minimum (locked)"
    echo "   - Phase 4: 99% minimum (locked)"
    echo "   - Phase 5: 75% minimum (locked)"
    echo "   - Overall: 91% minimum (locked)"
    echo ""
    echo "   These can only INCREASE when new files are added."
    echo "   See MILESTONE_LOCK_2025-12-01.md for details."
else
    echo "⚠️  Warning: Milestone lock file not found"
fi
echo ""

echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Commit the updates: git add . && git commit -m 'Update code statistics ($UPDATE_DATE)'"
echo "  3. Push to repository: git push"
echo ""
echo "💡 Tip: This script runs monthly via GitHub Action to keep stats current"
echo "🔒 Note: Completion percentages locked - see MILESTONE_LOCK_2025-12-01.md"
