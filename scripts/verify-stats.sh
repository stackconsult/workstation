#!/bin/bash
# Repository Statistics Verification Script
#
# Usage:
#   npm run stats:verify
#   (recommended; works regardless of execute permissions)
#
#   OR, to run directly:
#     chmod +x scripts/verify-stats.sh
#     ./scripts/verify-stats.sh
#
# Platform Requirements:
#   This script requires a Unix-like environment (Linux, macOS, or WSL/Git Bash on Windows)
#   as it uses Unix commands like find, wc, and awk.

echo "=== Repository Statistics ==="
echo ""
echo "Total tracked files (excluding node_modules, .git, dist):"
find . -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" 2>/dev/null | wc -l

echo ""
echo "TypeScript files in src/:"
find src -type f -name "*.ts" 2>/dev/null | wc -l

echo ""
echo "JavaScript files:"
find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" 2>/dev/null | wc -l

echo ""
echo "Test files:"
find . -type f \( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" \) ! -path "*/node_modules/*" 2>/dev/null | wc -l

echo ""
echo "Documentation files (.md):"
find . -type f -name "*.md" ! -path "*/node_modules/*" 2>/dev/null | wc -l

echo ""
echo "Lines of TypeScript code in src/:"
find src -type f -name "*.ts" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}'
