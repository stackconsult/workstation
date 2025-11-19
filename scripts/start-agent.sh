#!/bin/bash
# Coding Agent Auto-Start Script
# This script starts the coding agent service on port 7042

set -e

# Configuration
PORT="${PORT:-7042}"
NODE_ENV="${NODE_ENV:-development}"
LOG_DIR="${LOG_DIR:-/var/log/workstation}"
PID_FILE="${PID_FILE:-/var/run/workstation-agent.pid}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            log_warn "Service is already running (PID: $PID)"
            return 0
        else
            log_warn "Stale PID file found, removing..."
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Create log directory if it doesn't exist
setup_logging() {
    if [ ! -d "$LOG_DIR" ]; then
        log_info "Creating log directory: $LOG_DIR"
        mkdir -p "$LOG_DIR" || {
            log_warn "Cannot create system log directory, using local logs/"
            LOG_DIR="./logs"
            mkdir -p "$LOG_DIR"
        }
    fi
}

# Load environment variables
load_env() {
    if [ -f ".env" ]; then
        log_info "Loading environment variables from .env"
        export $(cat .env | grep -v '^#' | xargs)
    else
        log_warn "No .env file found, using defaults"
    fi
}

# Check if required dependencies are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        log_error "node_modules not found. Run 'npm install' first."
        exit 1
    fi
    
    if [ ! -d "dist" ]; then
        log_warn "dist directory not found. Building..."
        npm run build || {
            log_error "Build failed. Cannot start service."
            exit 1
        }
    fi
}

# Start the service
start_service() {
    log_info "Starting Workstation Coding Agent..."
    log_info "Port: $PORT"
    log_info "Environment: $NODE_ENV"
    log_info "Log file: $LOG_DIR/workstation-agent.log"
    
    # Export port
    export PORT=$PORT
    export NODE_ENV=$NODE_ENV
    
    # Start the service in background
    nohup node dist/index.js > "$LOG_DIR/workstation-agent.log" 2>&1 &
    
    # Save PID
    echo $! > "$PID_FILE"
    
    # Wait a moment and check if it started successfully
    sleep 2
    
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        log_info "Service started successfully!"
        log_info "PID: $(cat $PID_FILE)"
        log_info "Access at: http://localhost:$PORT"
        log_info "Health check: http://localhost:$PORT/health"
        log_info "Demo token: http://localhost:$PORT/auth/demo-token"
        log_info ""
        log_info "To view logs: tail -f $LOG_DIR/workstation-agent.log"
        log_info "To stop service: kill $(cat $PID_FILE) or use stop-agent.sh"
    else
        log_error "Service failed to start. Check logs: $LOG_DIR/workstation-agent.log"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# Main execution
main() {
    log_info "Workstation Coding Agent - Auto-Start Script"
    log_info "============================================="
    
    # Check if already running
    if check_running; then
        exit 0
    fi
    
    # Setup
    setup_logging
    load_env
    check_dependencies
    
    # Start service
    start_service
}

# Run main function
main
