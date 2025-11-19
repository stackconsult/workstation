#!/bin/bash
# Stop Coding Agent Service

set -e

# Configuration
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

# Stop the service
stop_service() {
    if [ ! -f "$PID_FILE" ]; then
        log_warn "PID file not found. Service may not be running."
        exit 0
    fi
    
    PID=$(cat "$PID_FILE")
    
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log_warn "Service is not running (stale PID file)"
        rm -f "$PID_FILE"
        exit 0
    fi
    
    log_info "Stopping Workstation Coding Agent (PID: $PID)..."
    
    # Try graceful shutdown first
    kill "$PID"
    
    # Wait for process to stop (max 10 seconds)
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            log_info "Service stopped successfully"
            rm -f "$PID_FILE"
            exit 0
        fi
        sleep 1
    done
    
    # Force kill if still running
    log_warn "Service did not stop gracefully, forcing shutdown..."
    kill -9 "$PID"
    
    sleep 1
    
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log_info "Service stopped (forced)"
        rm -f "$PID_FILE"
    else
        log_error "Failed to stop service"
        exit 1
    fi
}

# Main execution
main() {
    log_info "Workstation Coding Agent - Stop Script"
    log_info "========================================"
    stop_service
}

# Run main function
main
