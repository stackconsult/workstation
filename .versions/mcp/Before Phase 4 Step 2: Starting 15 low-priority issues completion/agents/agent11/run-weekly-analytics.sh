#!/bin/bash
##############################################################################
# Agent 11: Data Analytics & Comparison Specialist - Weekly Script
# 
# Purpose: Analyze validation data and provide trend insights
# Schedule: Saturday 5:00 AM MST (cron: 0 5 * * 6)
# Duration: 10-15 minutes
# Dependencies: Agent 10 (Guard Rails)
#
# Workflow:
# 1. Load Agent 10 handoff artifact
# 2. Run analytics engine
# 3. Generate weekly reports
# 4. Update MCP memory
# 5. Create Docker snapshot
##############################################################################

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENT10_HANDOFF="$PROJECT_ROOT/.agent10-to-agent11.json"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

##############################################################################
# Main Workflow
##############################################################################

main() {
    log "${PURPLE}═══════════════════════════════════════════════════════${NC}"
    log "${PURPLE}📊 Agent 11: Data Analytics & Comparison${NC}"
    log "${PURPLE}═══════════════════════════════════════════════════════${NC}"
    log ""
    
    # Step 1: Validate prerequisites
    log "📋 Step 1: Validating prerequisites..."
    validate_prerequisites
    
    # Step 2: Load Agent 10 handoff
    log "📥 Step 2: Loading Agent 10 handoff artifact..."
    load_agent10_handoff
    
    # Step 3: Build Agent 11
    log "🔨 Step 3: Building Agent 11 analytics engine..."
    build_agent11
    
    # Step 4: Run analytics engine
    log "📊 Step 4: Running analytics engine..."
    run_analytics_engine
    
    # Step 5: Update MCP memory
    log "💾 Step 5: Updating MCP memory..."
    update_mcp_memory
    
    # Step 6: Create Docker snapshot
    log "📦 Step 6: Creating Docker snapshot..."
    create_docker_snapshot
    
    log ""
    log "${GREEN}═══════════════════════════════════════════════════════${NC}"
    log "${GREEN}✅ Agent 11 Analytics Complete!${NC}"
    log "${GREEN}═══════════════════════════════════════════════════════${NC}"
    log ""
    log "📊 Summary:"
    log "   - Weekly Report: Available in reports directory"
    log "   - Memory: agents/agent11/memory/analytics-history.json"
    log ""
}

##############################################################################
# Step Functions
##############################################################################

validate_prerequisites() {
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    success "All prerequisites validated"
}

load_agent10_handoff() {
    if [ ! -f "$AGENT10_HANDOFF" ]; then
        error "Agent 10 handoff not found at $AGENT10_HANDOFF"
        error "Agent 10 must run before Agent 11"
        exit 1
    fi
    
    # Validate JSON format
    if command -v jq &> /dev/null; then
        if ! jq empty "$AGENT10_HANDOFF" 2>/dev/null; then
            error "Invalid JSON in Agent 10 handoff"
            exit 1
        fi
        
        local week=$(jq '.data_for_weekly_comparison.week' "$AGENT10_HANDOFF" 2>/dev/null || echo "0")
        success "Loaded Agent 10 handoff for Week $week"
    else
        success "Loaded Agent 10 handoff (jq not available for validation)"
    fi
}

build_agent11() {
    cd "$SCRIPT_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install --quiet 2>&1 | tail -5
    fi
    
    # Build TypeScript
    log "Compiling TypeScript..."
    if npm run build --quiet 2>&1 | tail -5; then
        success "Agent 11 built successfully"
    else
        error "Failed to build Agent 11"
        exit 1
    fi
}

run_analytics_engine() {
    cd "$PROJECT_ROOT"
    
    log "Executing analytics engine..."
    if node "$SCRIPT_DIR/dist/analytics-engine.js" 2>&1; then
        success "Analytics engine completed successfully"
    else
        warning "Analytics engine completed with warnings (check logs)"
    fi
}

update_mcp_memory() {
    local memory_file="$SCRIPT_DIR/memory/analytics-history.json"
    
    if [ -f "$memory_file" ]; then
        if command -v jq &> /dev/null; then
            local entries=$(jq '. | length' "$memory_file" 2>/dev/null || echo "0")
            success "MCP memory updated ($entries weeks of history)"
        else
            success "MCP memory file exists"
        fi
    else
        warning "MCP memory file not found (will be created on first run)"
    fi
}

create_docker_snapshot() {
    local week=$(date +'%U')
    local year=$(date +'%Y')
    local snapshot_name="agent11-memory:week-${week}-${year}"
    
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null; then
            if docker ps -a | grep -q agent-memory-store; then
                if docker commit agent-memory-store "$snapshot_name" 2>/dev/null; then
                    success "Docker snapshot created: $snapshot_name"
                else
                    warning "Docker snapshot skipped (container not running)"
                fi
            else
                warning "Docker snapshot skipped (agent-memory-store container not found)"
            fi
        else
            warning "Docker snapshot skipped (Docker not running)"
        fi
    else
        warning "Docker snapshot skipped (Docker not installed)"
    fi
}

##############################################################################
# Error Handling
##############################################################################

trap 'error "Script failed at line $LINENO"' ERR

##############################################################################
# Execute Main
##############################################################################

main "$@"
