#!/bin/bash

# ============================================================================
# One-Click Deployment Script for Workstation Visual Workflow Builder
# ============================================================================
# This script automates:
# - Environment setup and dependency installation
# - TypeScript compilation
# - Chrome extension loading
# - Server startup
# - Browser auto-launch with workflow builder
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Header
clear
echo -e "${CYAN}"
echo "============================================================================"
echo "   🚀 Workstation One-Click Deployment"
echo "   Visual Workflow Builder + Chrome Extension"
echo "============================================================================"
echo -e "${NC}"

# Check prerequisites
log "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version must be 18 or higher (current: $(node -v))"
    exit 1
fi
success "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
    exit 1
fi
success "npm $(npm -v) detected"

# Check Chrome/Chromium
CHROME_PATH=""
if command -v google-chrome &> /dev/null; then
    CHROME_PATH="google-chrome"
elif command -v chromium &> /dev/null; then
    CHROME_PATH="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROME_PATH="chromium-browser"
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -f "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" ]; then
    # WSL
    CHROME_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
else
    warning "Chrome/Chromium not found in PATH"
    warning "Chrome extension will need to be loaded manually"
    CHROME_PATH=""
fi

if [ -n "$CHROME_PATH" ]; then
    success "Chrome detected: $CHROME_PATH"
fi

echo ""

# Step 1: Environment Setup
log "Step 1/7: Setting up environment..."

if [ ! -f .env ]; then
    info "Creating .env file from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        
        # Generate secure JWT secret
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        
        # Update .env with generated secret (using | delimiter for robustness)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|your-secure-32-character-minimum-secret-key|$JWT_SECRET|" .env
        else
            # Linux
            sed -i "s|your-secure-32-character-minimum-secret-key|$JWT_SECRET|" .env
        fi
        
        success "Created .env with generated JWT_SECRET"
    else
        error ".env.example not found"
        exit 1
    fi
else
    success ".env file exists"
fi

# Load environment variables from .env safely
export $(grep -v '^#' .env | xargs)
success "Environment configured"

echo ""

# Step 2: Install Dependencies
log "Step 2/7: Installing dependencies..."

if [ ! -d "node_modules" ]; then
    info "Running npm install (this may take a few minutes)..."
    npm install --silent
    success "Dependencies installed"
else
    info "Dependencies already installed, running npm ci to verify..."
    npm ci --silent
    success "Dependencies verified"
fi

echo ""

# Step 3: Build TypeScript
log "Step 3/7: Building TypeScript..."

info "Compiling TypeScript to JavaScript..."
npm run build
success "Build completed successfully"

echo ""

# Step 4: Build Chrome Extension
log "Step 4/7: Preparing Chrome extension..."

info "Building Chrome extension..."
npm run build:chrome
success "Chrome extension built to build/chrome-extension/"

# Create extension manifest if needed
EXTENSION_DIR="$SCRIPT_DIR/build/chrome-extension"
if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
    error "Extension manifest not found after build"
    exit 1
fi

success "Chrome extension ready"

echo ""

# Step 5: Start Backend Server
log "Step 5/7: Starting backend server..."

# Kill any existing server on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    warning "Port 3000 is in use, attempting graceful shutdown..."
    PIDS=$(lsof -ti:3000)
    if [ -n "$PIDS" ]; then
        info "Sending SIGTERM to processes on port 3000: $PIDS"
        echo "$PIDS" | xargs kill 2>/dev/null || true
        sleep 3
        # Check if any processes are still running
        REMAINING_PIDS=$(lsof -ti:3000 2>/dev/null)
        if [ -n "$REMAINING_PIDS" ]; then
            warning "Processes still running on port 3000, sending SIGKILL: $REMAINING_PIDS"
            echo "$REMAINING_PIDS" | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
    fi
fi

# Start server in background
info "Starting server on http://localhost:3000..."
npm start > /tmp/workstation-server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/workstation-server.pid

# Wait for server to be ready
info "Waiting for server to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        success "Server is running (PID: $SERVER_PID)"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
    echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    error "Server failed to start within 30 seconds"
    error "Check logs: tail -f /tmp/workstation-server.log"
    exit 1
fi

echo ""

# Step 6: Load Chrome Extension
log "Step 6/7: Setting up Chrome extension..."

if [ -n "$CHROME_PATH" ]; then
    info "Launching Chrome with extension..."
    
    # Create user data directory for extension
    USER_DATA_DIR="/tmp/workstation-chrome-profile"
    rm -rf "$USER_DATA_DIR"
    mkdir -p "$USER_DATA_DIR"
    
    # Launch Chrome with extension loaded
    "$CHROME_PATH" \
        --user-data-dir="$USER_DATA_DIR" \
        --load-extension="$EXTENSION_DIR" \
        --no-first-run \
        --no-default-browser-check \
        "http://localhost:3000/workflow-builder.html" \
        > /dev/null 2>&1 &
    
    CHROME_PID=$!
    echo $CHROME_PID > /tmp/workstation-chrome.pid
    
    success "Chrome launched with extension (PID: $CHROME_PID)"
else
    warning "Chrome not detected. Manual extension loading required:"
    echo ""
    echo "  1. Open Chrome and navigate to: chrome://extensions/"
    echo "  2. Enable 'Developer mode' (toggle in top-right)"
    echo "  3. Click 'Load unpacked'"
    echo "  4. Select folder: $EXTENSION_DIR"
    echo "  5. Navigate to: http://localhost:3000/workflow-builder.html"
    echo ""
fi

echo ""

# Step 7: Create stop script
log "Step 7/7: Creating cleanup script..."

cat > /tmp/stop-workstation.sh << 'EOF'
#!/bin/bash

echo "Stopping Workstation..."

# Stop server
if [ -f /tmp/workstation-server.pid ]; then
    SERVER_PID=$(cat /tmp/workstation-server.pid)
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        kill $SERVER_PID 2>/dev/null || true
        echo "✓ Server stopped"
    fi
    rm /tmp/workstation-server.pid
fi

# Stop Chrome
if [ -f /tmp/workstation-chrome.pid ]; then
    CHROME_PID=$(cat /tmp/workstation-chrome.pid)
    if ps -p $CHROME_PID > /dev/null 2>&1; then
        kill $CHROME_PID 2>/dev/null || true
        echo "✓ Chrome stopped"
    fi
    rm /tmp/workstation-chrome.pid
fi

# Clean up temp directory
rm -rf /tmp/workstation-chrome-profile 2>/dev/null || true

echo "✓ Workstation stopped successfully"
EOF

chmod +x /tmp/stop-workstation.sh
success "Cleanup script created: /tmp/stop-workstation.sh"

echo ""

# Success message
echo -e "${GREEN}"
echo "============================================================================"
echo "   ✓ Deployment Complete!"
echo "============================================================================"
echo -e "${NC}"

echo -e "${CYAN}📋 What was deployed:${NC}"
echo "  ✓ Backend server running on http://localhost:3000"
echo "  ✓ Visual workflow builder at http://localhost:3000/workflow-builder.html"
if [ -n "$CHROME_PATH" ]; then
    echo "  ✓ Chrome extension loaded and ready"
    echo "  ✓ Browser opened with workflow builder"
fi
echo ""

echo -e "${CYAN}🎯 Next steps:${NC}"
echo "  1. The workflow builder should be open in Chrome"
echo "  2. Click the extension icon to access workflow tools"
echo "  3. Create your first workflow by dragging nodes"
echo "  4. Execute workflows and monitor in real-time"
echo ""

echo -e "${CYAN}📚 Resources:${NC}"
echo "  • User Guide:        $SCRIPT_DIR/HOW_TO_USE.md"
echo "  • Documentation:     $SCRIPT_DIR/WORKFLOW_BUILDER_INTEGRATION.md"
echo "  • API Reference:     $SCRIPT_DIR/API.md"
echo ""

echo -e "${CYAN}🔧 Management:${NC}"
echo "  • Server logs:       tail -f /tmp/workstation-server.log"
echo "  • Stop everything:   /tmp/stop-workstation.sh"
echo "  • Restart:           ./one-click-deploy.sh"
echo ""

echo -e "${CYAN}🌐 URLs:${NC}"
echo "  • Workflow Builder:  ${BLUE}http://localhost:3000/workflow-builder.html${NC}"
echo "  • Dashboard:         ${BLUE}http://localhost:3000/dashboard.html${NC}"
echo "  • API:               ${BLUE}http://localhost:3000/api${NC}"
echo "  • Health Check:      ${BLUE}http://localhost:3000/health${NC}"
echo ""

# Get demo token
echo -e "${CYAN}🔑 Demo JWT Token:${NC}"
DEMO_TOKEN=$(curl -s http://localhost:3000/auth/demo-token | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log(data.token);
" 2>/dev/null || echo "Failed to generate")

if [ "$DEMO_TOKEN" != "Failed to generate" ]; then
    echo "  $DEMO_TOKEN"
    echo "  (This token is valid for testing)"
else
    echo "  Run: curl http://localhost:3000/auth/demo-token"
fi

echo ""
echo -e "${GREEN}Happy automating! 🚀${NC}"
echo ""

# Keep script alive to show logs if Chrome wasn't launched
if [ -z "$CHROME_PATH" ]; then
    echo -e "${YELLOW}Press Ctrl+C to stop the server when done.${NC}"
    echo ""
    tail -f /tmp/workstation-server.log
fi
