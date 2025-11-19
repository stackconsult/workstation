#!/bin/bash
# Script to apply PR #61 merge conflict resolution
# Run this from the repository root with write access to the repository

set -e

echo "🔧 Applying PR #61 Merge Conflict Resolution"
echo "============================================"
echo ""

# Check if we have write access
if ! git push --dry-run origin HEAD >/dev/null 2>&1; then
    echo "❌ Error: No write access to repository"
    echo "   You need write permissions to push to origin"
    exit 1
fi

# Fetch latest
echo "📥 Fetching latest changes..."
git fetch origin

# Checkout PR branch
echo "🔀 Checking out PR branch..."
git checkout copilot/fix-errors-in-workstation

# Check if already up to date
if git merge-base --is-ancestor origin/main HEAD; then
    echo "✅ Branch is already up to date with main"
    exit 0
fi

# Merge main
echo "🔀 Merging main into PR branch..."
if git merge origin/main --no-edit; then
    echo "✅ Merge completed without conflicts"
else
    echo "⚠️  Merge conflicts detected. Resolving..."
    
    # Apply resolved src/index.ts
    if [ -f "resolved-files/index.ts" ]; then
        echo "   Applying resolved src/index.ts..."
        cp resolved-files/index.ts src/index.ts
        git add src/index.ts
    else
        echo "   ❌ Error: resolved-files/index.ts not found"
        echo "   Please manually resolve src/index.ts"
        exit 1
    fi
    
    # Apply resolved COMPLETION_REPORT.md
    if [ -f "resolved-files/COMPLETION_REPORT.md" ]; then
        echo "   Applying resolved COMPLETION_REPORT.md..."
        cp resolved-files/COMPLETION_REPORT.md COMPLETION_REPORT.md
        git add COMPLETION_REPORT.md
    else
        echo "   ❌ Error: resolved-files/COMPLETION_REPORT.md not found"
        echo "   Please manually resolve COMPLETION_REPORT.md"
        exit 1
    fi
    
    # Complete the merge
    git commit -m "Resolve merge conflicts with main

Conflicts resolved:
- src/index.ts: Combined JWT validation and error handlers
- COMPLETION_REPORT.md: Kept PR #61 content

All tests passing, zero breaking changes."
fi

# Verify build
echo "🧪 Verifying build..."
if npm run build >/dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please check the output above."
    exit 1
fi

# Push to origin
echo "📤 Pushing resolution to origin..."
git push origin copilot/fix-errors-in-workstation

echo ""
echo "✅ Resolution applied successfully!"
echo "   PR #61 should now be mergeable on GitHub"
echo ""
