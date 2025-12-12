#!/bin/bash
# Display startup instructions for new users

# Get version from package.json
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "2.1.0")

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
  for zip in dist/workstation-ai-agent*.zip; do
    if [ -f "$zip" ]; then
      SIZE=$(ls -lh "$zip" 2>/dev/null | awk '{print $5}')
      echo "   - $zip ($SIZE)"
    fi
  done
fi

cat << 'EOF'

Just extract and load in Chrome!

📖 Full documentation: 🚀_START_HERE.md
EOF
