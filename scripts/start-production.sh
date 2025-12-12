#!/usr/bin/env bash

# ============================================================
# Workstation AI Agent - Production Start Script
# ============================================================
# This script performs comprehensive health checks and starts
# the application in production mode with full verification
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=========================================="
echo "🚀 Workstation AI Agent - Production Start"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "success")
            echo -e "${GREEN}✅ ${message}${NC}"
            ;;
        "error")
            echo -e "${RED}❌ ${message}${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  ${message}${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  ${message}${NC}"
            ;;
    esac
}

# ============================================================
# PHASE 1: PRE-FLIGHT CHECKS
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Pre-Flight Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js version
print_status "info" "Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION =~ ^v(1[8-9]|[2-9][0-9]) ]]; then
    print_status "success" "Node.js version: $NODE_VERSION"
else
    print_status "error" "Node.js version must be 18 or higher. Current: $NODE_VERSION"
    exit 1
fi

# Check npm version
print_status "info" "Checking npm version..."
NPM_VERSION=$(npm -v)
print_status "success" "npm version: $NPM_VERSION"

# Check if .env file exists
print_status "info" "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_status "error" ".env file not found"
    print_status "info" "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "warning" "Created .env file - PLEASE CONFIGURE SECRETS before starting"
        exit 1
    else
        print_status "error" "No .env.example found either"
        exit 1
    fi
else
    print_status "success" ".env file exists"
fi

# Verify JWT_SECRET is set and secure
print_status "info" "Verifying JWT_SECRET security..."
# Safely extract JWT_SECRET from .env without sourcing
JWT_SECRET=$(grep -E '^\s*JWT_SECRET\s*=' .env | grep -v '^\s*#' | tail -n 1 | sed -E 's/^\s*JWT_SECRET\s*=\s*//;s/\r$//')
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "changeme" ] || [ "$JWT_SECRET" = "your-secret-key-change-this-in-production-min-32-chars" ]; then
    print_status "error" "JWT_SECRET is not configured or is insecure in your .env file"
    print_status "info" "To fix: Open your .env file and replace the JWT_SECRET value with a secure random string."
    print_status "info" "Generate a secure secret with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    print_status "warning" "After updating .env, re-run this script."
    exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
    print_status "error" "JWT_SECRET must be at least 32 characters (current: ${#JWT_SECRET})"
    exit 1
fi

print_status "success" "JWT_SECRET is configured securely (${#JWT_SECRET} characters)"

# Verify SESSION_SECRET
print_status "info" "Verifying SESSION_SECRET..."
# Safely extract SESSION_SECRET from .env without sourcing
SESSION_SECRET=$(grep -E '^\s*SESSION_SECRET\s*=' .env | grep -v '^\s*#' | tail -n 1 | sed -E 's/^\s*SESSION_SECRET\s*=\s*//;s/\r$//')
if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "$JWT_SECRET" ]; then
    print_status "error" "SESSION_SECRET must be set and different from JWT_SECRET"
    exit 1
fi
print_status "success" "SESSION_SECRET is configured properly"

# Check disk space
print_status "info" "Checking disk space..."
AVAILABLE_SPACE=$(df -h . | tail -1 | awk '{print $4}')
print_status "success" "Available disk space: $AVAILABLE_SPACE"

echo ""

# ============================================================
# PHASE 2: DEPENDENCY CHECK
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Dependency Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_status "info" "Checking if node_modules exists..."
if [ ! -d "node_modules" ]; then
    print_status "warning" "node_modules not found, running npm install..."
    npm install
    print_status "success" "Dependencies installed"
else
    print_status "success" "node_modules exists"
fi

print_status "info" "Verifying critical dependencies..."
REQUIRED_DEPS=("express" "typescript" "jsonwebtoken" "dotenv")
MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if [ ! -d "node_modules/$dep" ]; then
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    print_status "error" "Missing dependencies: ${MISSING_DEPS[*]}"
    print_status "info" "Running npm install..."
    npm install
else
    print_status "success" "All critical dependencies installed"
fi

echo ""

# ============================================================
# PHASE 3: BUILD APPLICATION
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: Build Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_status "info" "Running TypeScript build..."
if npm run build > /tmp/build.log 2>&1; then
    print_status "success" "TypeScript compilation successful"
else
    print_status "error" "TypeScript compilation failed"
    cat /tmp/build.log
    exit 1
fi

print_status "info" "Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    print_status "error" "Build output not found (dist/index.js)"
    exit 1
fi
print_status "success" "Build output verified"

# Get file count in dist
DIST_FILES=$(find dist -type f | wc -l)
print_status "success" "Build artifacts: $DIST_FILES files in dist/"

echo ""

# ============================================================
# PHASE 4: CREATE DATA DIRECTORIES
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: Initialize Data Directories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_status "info" "Creating data directories..."
mkdir -p data
mkdir -p logs
mkdir -p backups
print_status "success" "Data directories created"

echo ""

# ============================================================
# PHASE 5: HEALTH CHECK
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Start Server & Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PORT=${PORT:-7042}

# Check if port is already in use
print_status "info" "Checking if port $PORT is available..."
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "warning" "Port $PORT is already in use"
    print_status "info" "Checking if it's our server..."
    
    # Try to hit health endpoint
    if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
        print_status "success" "Server is already running on port $PORT"
        echo ""
        echo "🌐 Server URLs:"
        echo "   Main: http://localhost:$PORT"
        echo "   Health: http://localhost:$PORT/health"
        echo "   Dashboard: http://localhost:$PORT/dashboard"
        echo "   Demo Token: http://localhost:$PORT/auth/demo-token"
        exit 0
    else
        print_status "error" "Port $PORT is in use by another process"
        print_status "info" "To kill the process: lsof -ti:$PORT | xargs kill -9"
        exit 1
    fi
fi

print_status "success" "Port $PORT is available"

# Trap to cleanup server on script exit
cleanup_server() {
    if [ -f ".server.pid" ]; then
        SERVER_PID=$(cat .server.pid)
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            print_status "info" "Cleaning up server process (PID: $SERVER_PID)..."
            kill "$SERVER_PID" 2>/dev/null || true
            rm -f .server.pid
        fi
    fi
}
trap cleanup_server EXIT INT TERM

# Start server in background
print_status "info" "Starting server on port $PORT..."
nohup npm start > logs/server.log 2>&1 &
SERVER_PID=$!

print_status "success" "Server started with PID: $SERVER_PID"
echo "$SERVER_PID" > .server.pid

# Wait for server to start
print_status "info" "Waiting for server to initialize..."
sleep 3

# Health check
MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 1
done

echo ""

if [ "$HEALTH_OK" = true ]; then
    print_status "success" "Health check passed"
    
    # Get detailed health info
    HEALTH_RESPONSE=$(curl -s "http://localhost:$PORT/health")
    echo ""
    echo "🏥 Health Status:"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    print_status "error" "Health check failed after $MAX_RETRIES attempts"
    print_status "info" "Server logs:"
    tail -20 logs/server.log
    
    if [ -f ".server.pid" ]; then
        kill $(cat .server.pid) 2>/dev/null || true
        rm .server.pid
    fi
    exit 1
fi

echo ""

# ============================================================
# PHASE 6: FUNCTIONAL TESTS
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 6: Functional Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test demo token endpoint
print_status "info" "Testing demo token endpoint..."
DEMO_TOKEN_RESPONSE=$(curl -s "http://localhost:$PORT/auth/demo-token")
if echo "$DEMO_TOKEN_RESPONSE" | grep -q "token"; then
    print_status "success" "Demo token endpoint working"
    DEMO_TOKEN=$(echo "$DEMO_TOKEN_RESPONSE" | jq -r '.token' 2>/dev/null)
    echo "   Token: ${DEMO_TOKEN:0:20}..."
else
    print_status "warning" "Demo token endpoint returned unexpected response"
fi

# Test protected endpoint with token
if [ -n "$DEMO_TOKEN" ]; then
    print_status "info" "Testing protected endpoint with JWT..."
    PROTECTED_RESPONSE=$(curl -s -H "Authorization: Bearer $DEMO_TOKEN" "http://localhost:$PORT/api/protected")
    if echo "$PROTECTED_RESPONSE" | grep -q "Access granted"; then
        print_status "success" "Protected endpoint authentication working"
    else
        print_status "warning" "Protected endpoint returned unexpected response"
    fi
fi

echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================
echo "=========================================="
echo "✅ Server Started Successfully!"
echo "=========================================="
echo ""
echo "📊 System Information:"
echo "   PID: $SERVER_PID"
echo "   Port: $PORT"
echo "   Node: $NODE_VERSION"
echo "   Environment: ${NODE_ENV:-development}"
echo ""
echo "🌐 Access URLs:"
echo "   Main: http://localhost:$PORT"
echo "   Dashboard: http://localhost:$PORT/dashboard"
echo "   Health: http://localhost:$PORT/health"
echo "   Metrics: http://localhost:$PORT/metrics"
echo "   Demo Token: http://localhost:$PORT/auth/demo-token"
echo ""
echo "🔌 WebSocket URLs:"
echo "   Workflows: ws://localhost:$PORT/ws/executions"
echo "   MCP: ws://localhost:$PORT/mcp"
echo ""
echo "📚 API Documentation:"
echo "   API Docs: http://localhost:$PORT/docs"
echo "   Legacy UI: http://localhost:$PORT/legacy"
echo ""
echo "📁 Files & Logs:"
echo "   Server Log: logs/server.log"
echo "   PID File: .server.pid"
echo "   Data Dir: ./data"
echo ""
echo "🛑 To stop the server:"
echo "   kill \$(cat .server.pid) && rm .server.pid"
echo "   OR"
echo "   pkill -f 'node dist/index.js'"
echo ""
echo "🔍 To view logs:"
echo "   tail -f logs/server.log"
echo ""
echo "=========================================="
