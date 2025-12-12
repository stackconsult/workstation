#!/usr/bin/env bash
# Display startup instructions for new users
# Requires: bash 4.0+ for array support
set -euo pipefail

# Enable nullglob to handle case when no ZIP files exist
shopt -s nullglob

# Display instructions
cat << EOF
🚀 See 🚀_START_HERE.md for complete setup instructions

Quick Start:
1. Build Chrome Extension: bash ./scripts/build-enterprise-chrome-extension.sh
2. Extract and load in Chrome: chrome://extensions/
3. Start Backend: npm start

⚡ SHORTCUT: Pre-built ZIPs already exist in dist/ directory!
EOF

# List available ZIPs with sizes if they exist
if [ -d "dist" ]; then
  ZIPS=(dist/workstation-ai-agent*.zip)
  if [ ${#ZIPS[@]} -gt 0 ]; then
    for zip in "${ZIPS[@]}"; do
      # Use du for reliable cross-platform file size
      SIZE=$(du -h "$zip" 2>/dev/null | cut -f1)
      echo "   - $zip ($SIZE)"
    done
  else
    echo "   (No pre-built ZIPs found - run build script first)"
  fi
fi

cat << 'EOF'

Just extract and load in Chrome!

📖 Full documentation: 🚀_START_HERE.md
EOF
