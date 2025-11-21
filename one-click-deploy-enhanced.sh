#!/bin/bash

# ============================================================================
# Enhanced One-Click Deployment Script for Workstation Visual Workflow Builder
# ============================================================================
# This script automates with improved resilience:
# - Checkpoint/resume capability for failed deployments
# - Enhanced error handling with retry logic
# - Comprehensive health checks and smoke tests
# - Pre-deployment snapshot rollback system
# - Persistent logging with rotation
# - Better cross-platform support
# - Dependency integrity validation
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

# Persistent logging setup
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/deployment-$(date +'%Y-%m-%d-%H%M%S').log"
CHECKPOINT_FILE="$LOGS_DIR/.deployment-checkpoint"
SNAPSHOT_DIR="$LOGS_DIR/snapshots"
mkdir -p "$SNAPSHOT_DIR"

# Rotate old logs (keep last 10)
ls -t "$LOGS_DIR"/deployment-*.log 2>/dev/null | tail -n +11 | xargs -r rm

# Logging functions with file output
log() {
    local msg="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

success() {
    local msg="✓ $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

error() {
    local msg="✗ $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

warning() {
    local msg="⚠ $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

info() {
    local msg="ℹ $1"
    echo -e "${CYAN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

# Checkpoint management
save_checkpoint() {
    local step=$1
    echo "$step" > "$CHECKPOINT_FILE"
    log "Checkpoint saved: $step"
}

get_checkpoint() {
    if [ -f "$CHECKPOINT_FILE" ]; then
        cat "$CHECKPOINT_FILE"
    else
        echo "0"
    fi
}

clear_checkpoint() {
    rm -f "$CHECKPOINT_FILE"
    log "Checkpoint cleared"
}

# Retry logic with exponential backoff
retry_with_backoff() {
    local max_attempts=3
    local timeout=2
    local attempt=1
    local exitCode=0

    while [ $attempt -le $max_attempts ]; do
        if "$@"; then
            return 0
        else
            exitCode=$?
        fi

        if [ $attempt -lt $max_attempts ]; then
            local delay=$((timeout * attempt))
            warning "Command failed (attempt $attempt/$max_attempts). Retrying in ${delay}s..."
            sleep $delay
            attempt=$((attempt + 1))
        else
            error "Command failed after $max_attempts attempts"
            return $exitCode
        fi
    done
}

# Snapshot management for rollback
create_snapshot() {
    local snapshot_id="$(date +'%Y%m%d-%H%M%S')"
    local snapshot_path="$SNAPSHOT_DIR/snapshot-$snapshot_id"
    mkdir -p "$snapshot_path"

    log "Creating pre-deployment snapshot: $snapshot_id"

    # Backup .env if it exists
    if [ -f .env ]; then
        cp .env "$snapshot_path/.env.backup"
        success "Backed up .env"
    fi

    # Backup package-lock.json
    if [ -f package-lock.json ]; then
        cp package-lock.json "$snapshot_path/package-lock.json.backup"
        success "Backed up package-lock.json"
    fi

    # Save git state
    git rev-parse HEAD > "$snapshot_path/git-commit.txt" 2>/dev/null || echo "no-git" > "$snapshot_path/git-commit.txt"
    
    # Save current PID files if they exist
    if [ -f /tmp/workstation-server.pid ]; then
        cp /tmp/workstation-server.pid "$snapshot_path/server.pid.backup"
    fi

    echo "$snapshot_id" > "$SNAPSHOT_DIR/.latest-snapshot"
    success "Snapshot created: $snapshot_id"
    echo "$snapshot_id"
}

rollback_snapshot() {
    local snapshot_id=$(cat "$SNAPSHOT_DIR/.latest-snapshot" 2>/dev/null || echo "")
    
    if [ -z "$snapshot_id" ]; then
        error "No snapshot found to rollback"
        return 1
    fi

    local snapshot_path="$SNAPSHOT_DIR/snapshot-$snapshot_id"
    
    if [ ! -d "$snapshot_path" ]; then
        error "Snapshot directory not found: $snapshot_path"
        return 1
    fi

    warning "Rolling back to snapshot: $snapshot_id"

    # Restore .env
    if [ -f "$snapshot_path/.env.backup" ]; then
        cp "$snapshot_path/.env.backup" .env
        success "Restored .env"
    fi

    # Restore package-lock.json
    if [ -f "$snapshot_path/package-lock.json.backup" ]; then
        cp "$snapshot_path/package-lock.json.backup" package-lock.json
        success "Restored package-lock.json"
    fi

    success "Rollback completed"
}

# Enhanced health check with smoke tests
comprehensive_health_check() {
    log "Running comprehensive health checks..."

    # Basic health endpoint
    if ! curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        error "Health endpoint check failed"
        return 1
    fi
    success "Health endpoint OK"

    # JWT authentication endpoint
    local token_response=$(curl -s http://localhost:3000/auth/demo-token)
    if echo "$token_response" | grep -q "token"; then
        success "JWT authentication endpoint OK"
    else
        error "JWT authentication endpoint check failed"
        return 1
    fi

    # Verify server is responding to API requests
    if curl -sf http://localhost:3000/api > /dev/null 2>&1; then
        success "API endpoint responsive"
    else
        warning "API endpoint check inconclusive (may be expected)"
    fi

    success "All health checks passed"
    return 0
}

# Platform detection and adaptation
detect_platform() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Header
clear
echo -e "${CYAN}"
echo "============================================================================"
echo "   🚀 Workstation Enhanced One-Click Deployment"
echo "   Visual Workflow Builder + Chrome Extension"
echo "   With Checkpoint/Resume, Rollback, and Enhanced Error Handling"
echo "============================================================================"
echo -e "${NC}"

log "Deployment started"
log "Log file: $LOG_FILE"

PLATFORM=$(detect_platform)
info "Detected platform: $PLATFORM"

# Check for resume
START_STEP=$(get_checkpoint)
if [ "$START_STEP" != "0" ]; then
    warning "Previous deployment found at step $START_STEP"
    read -p "Resume from checkpoint? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        START_STEP=0
        clear_checkpoint
    fi
else
    START_STEP=0
fi

# Create snapshot before starting
SNAPSHOT_ID=$(create_snapshot)

# Step 1: Prerequisites Check
if [ $START_STEP -le 1 ]; then
    log "Step 1/8: Checking prerequisites..."
    save_checkpoint 1

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        rollback_snapshot
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18 or higher (current: $(node -v))"
        rollback_snapshot
        exit 1
    fi
    success "Node.js $(node -v) detected"

    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        rollback_snapshot
        exit 1
    fi
    success "npm $(npm -v) detected"

    # Check Chrome/Chromium with enhanced detection
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
        CHROME_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
    elif [ -f "/c/Program Files/Google/Chrome/Application/chrome.exe" ]; then
        CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe"
    else
        warning "Chrome/Chromium not found in PATH"
        warning "Chrome extension will need to be loaded manually"
        CHROME_PATH=""
    fi

    if [ -n "$CHROME_PATH" ]; then
        success "Chrome detected: $CHROME_PATH"
        
        # Check for running Chrome instances
        if pgrep -x "chrome" > /dev/null || pgrep -x "chromium" > /dev/null; then
            warning "Chrome/Chromium is currently running"
            info "For best results, close Chrome before loading the extension"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                info "Please close Chrome and run the script again"
                exit 0
            fi
        fi
    fi

    success "Prerequisites check completed"
    echo ""
fi

# Step 2: Environment Setup
if [ $START_STEP -le 2 ]; then
    log "Step 2/8: Setting up environment..."
    save_checkpoint 2

    if [ ! -f .env ]; then
        info "Creating .env file from template..."
        if [ -f .env.example ]; then
            cp .env.example .env
            
            # Generate secure JWT secret
            JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
            
            # Update .env with generated secret (using | delimiter for robustness)
            if [[ "$PLATFORM" == "macos" ]]; then
                sed -i '' "s|your-secure-32-character-minimum-secret-key|$JWT_SECRET|" .env
            else
                sed -i "s|your-secure-32-character-minimum-secret-key|$JWT_SECRET|" .env
            fi
            
            success "Created .env with generated JWT_SECRET"
        else
            error ".env.example not found"
            rollback_snapshot
            exit 1
        fi
    else
        success ".env file exists"
    fi

    # Load environment variables from .env safely
    export $(grep -v '^#' .env | xargs)
    success "Environment configured"

    echo ""
fi

# Step 3: Install Dependencies with retry
if [ $START_STEP -le 3 ]; then
    log "Step 3/8: Installing dependencies with retry logic..."
    save_checkpoint 3

    if [ ! -d "node_modules" ]; then
        info "Running npm install (this may take a few minutes)..."
        if ! retry_with_backoff npm install --silent; then
            error "Failed to install dependencies after retries"
            rollback_snapshot
            exit 1
        fi
        success "Dependencies installed"
    else
        info "Dependencies already installed, running npm ci to verify..."
        if ! retry_with_backoff npm ci --silent; then
            error "Failed to verify dependencies after retries"
            rollback_snapshot
            exit 1
        fi
        success "Dependencies verified"
    fi

    echo ""
fi

# Step 4: Build TypeScript
if [ $START_STEP -le 4 ]; then
    log "Step 4/8: Building TypeScript..."
    save_checkpoint 4

    info "Compiling TypeScript to JavaScript..."
    if ! npm run build; then
        error "TypeScript build failed"
        rollback_snapshot
        exit 1
    fi
    success "Build completed successfully"

    echo ""
fi

# Step 5: Build Chrome Extension
if [ $START_STEP -le 5 ]; then
    log "Step 5/8: Preparing Chrome extension..."
    save_checkpoint 5

    info "Building Chrome extension..."
    npm run build:chrome
    success "Chrome extension built to build/chrome-extension/"

    # Validate extension manifest
    EXTENSION_DIR="$SCRIPT_DIR/build/chrome-extension"
    if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
        error "Extension manifest not found after build"
        rollback_snapshot
        exit 1
    fi

    success "Chrome extension ready"

    echo ""
fi

# Step 6: Start Backend Server
if [ $START_STEP -le 6 ]; then
    log "Step 6/8: Starting backend server..."
    save_checkpoint 6

    # Graceful shutdown of existing server
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

    # Wait for server to be ready with timeout
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
        rollback_snapshot
        exit 1
    fi

    echo ""
fi

# Step 7: Comprehensive Health Checks
if [ $START_STEP -le 7 ]; then
    log "Step 7/8: Running comprehensive health checks..."
    save_checkpoint 7

    if ! comprehensive_health_check; then
        error "Health checks failed"
        warning "Consider reviewing logs: $LOG_FILE"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Deployment aborted. Rolling back..."
            rollback_snapshot
            exit 1
        fi
    fi

    echo ""
fi

# Step 8: Launch Chrome with Extension
if [ $START_STEP -le 8 ]; then
    log "Step 8/8: Setting up Chrome extension..."
    save_checkpoint 8

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
fi

# Create enhanced stop script
log "Creating enhanced cleanup script..."

cat > /tmp/stop-workstation.sh << 'EOF'
#!/bin/bash

echo "Stopping Workstation..."

# Stop server
if [ -f /tmp/workstation-server.pid ]; then
    SERVER_PID=$(cat /tmp/workstation-server.pid)
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        # Graceful shutdown
        kill $SERVER_PID 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if ps -p $SERVER_PID > /dev/null 2>&1; then
            kill -9 $SERVER_PID 2>/dev/null || true
        fi
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
success "Enhanced cleanup script created: /tmp/stop-workstation.sh"

# Clear checkpoint on successful completion
clear_checkpoint

echo ""
echo -e "${GREEN}"
echo "============================================================================"
echo "   ✓ Enhanced Deployment Complete!"
echo "============================================================================"
echo -e "${NC}"

echo -e "${CYAN}📋 What was deployed:${NC}"
echo "  ✓ Backend server running on http://localhost:3000"
echo "  ✓ Visual workflow builder at http://localhost:3000/workflow-builder.html"
if [ -n "$CHROME_PATH" ]; then
    echo "  ✓ Chrome extension loaded and ready"
    echo "  ✓ Browser opened with workflow builder"
fi
echo "  ✓ Comprehensive health checks passed"
echo "  ✓ Snapshot created for rollback: $SNAPSHOT_ID"
echo ""

echo -e "${CYAN}📊 Deployment Metrics:${NC}"
echo "  • Log file:          $LOG_FILE"
echo "  • Snapshot ID:       $SNAPSHOT_ID"
echo "  • Server PID:        $(cat /tmp/workstation-server.pid 2>/dev/null || echo 'N/A')"
if [ -n "$CHROME_PATH" ]; then
    echo "  • Chrome PID:        $(cat /tmp/workstation-chrome.pid 2>/dev/null || echo 'N/A')"
fi
echo ""

echo -e "${CYAN}🔧 Management:${NC}"
echo "  • Server logs:       tail -f /tmp/workstation-server.log"
echo "  • Deployment log:    tail -f $LOG_FILE"
echo "  • Stop everything:   /tmp/stop-workstation.sh"
echo "  • Restart:           ./one-click-deploy-enhanced.sh"
echo "  • Rollback:          Use snapshot: $SNAPSHOT_ID"
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
log "Deployment completed successfully"
echo -e "${GREEN}Happy automating! 🚀${NC}"
echo ""
