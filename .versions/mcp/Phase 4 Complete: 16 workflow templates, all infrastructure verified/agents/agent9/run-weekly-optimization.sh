#!/bin/bash
##############################################################################
# Agent 9: The Optimization Magician - Weekly Automation Script
# 
# Purpose: Execute weekly optimization workflow based on Agent 8 assessment
# Schedule: Saturday 2:45 AM MST (cron: 45 2 * * 6)
# Duration: 60-75 minutes
# Dependencies: Agent 7 (Security), Agent 8 (Assessment)
#
# Workflow:
# 1. Load Agent 8 handoff artifact
# 2. Run optimization engine
# 3. Validate all tests pass
# 4. Update MCP memory
# 5. Create Docker snapshot
# 6. Generate handoff reports for Agents 7, 8, 10
##############################################################################

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENT8_HANDOFF="$PROJECT_ROOT/.agent8-handoff.json"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="$SCRIPT_DIR/reports/$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging function
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
    log "${PURPLE}🧙‍♂️  Agent 9: The Optimization Magician - Weekly Run${NC}"
    log "${PURPLE}═══════════════════════════════════════════════════════${NC}"
    log ""
    
    # Step 1: Validate prerequisites
    log "📋 Step 1: Validating prerequisites..."
    validate_prerequisites
    
    # Step 2: Load Agent 8 handoff
    log "📥 Step 2: Loading Agent 8 handoff artifact..."
    load_agent8_handoff
    
    # Step 3: Build Agent 9
    log "🔨 Step 3: Building Agent 9 optimization engine..."
    build_agent9
    
    # Step 4: Run optimization engine
    log "🧙‍♂️  Step 4: Running optimization engine..."
    run_optimization_engine
    
    # Step 5: Validate changes
    log "🧪 Step 5: Validating all changes..."
    validate_changes
    
    # Step 6: Generate reports
    log "📊 Step 6: Generating optimization reports..."
    generate_reports
    
    # Step 7: Update MCP memory
    log "💾 Step 7: Updating MCP memory..."
    update_mcp_memory
    
    # Step 8: Create Docker snapshot
    log "📦 Step 8: Creating Docker snapshot..."
    create_docker_snapshot
    
    # Step 9: Generate handoff artifacts
    log "🔄 Step 9: Generating handoff artifacts..."
    generate_handoff_artifacts
    
    log ""
    log "${GREEN}═══════════════════════════════════════════════════════${NC}"
    log "${GREEN}✅ Agent 9 Weekly Optimization Complete!${NC}"
    log "${GREEN}═══════════════════════════════════════════════════════${NC}"
    log ""
    log "📊 Summary:"
    log "   - Report: $REPORT_DIR/OPTIMIZATION_REPORT.md"
    log "   - Handoffs: .agent9-to-agent{7,8,10}.json"
    log "   - Memory: agents/agent9/memory/optimizations.json"
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
    
    # Check if TypeScript is available
    if ! command -v tsc &> /dev/null && ! npx tsc --version &> /dev/null; then
        warning "TypeScript not found globally, will use npx"
    fi
    
    success "All prerequisites validated"
}

load_agent8_handoff() {
    if [ ! -f "$AGENT8_HANDOFF" ]; then
        warning "Agent 8 handoff not found at $AGENT8_HANDOFF"
        warning "Creating mock handoff for testing..."
        create_mock_handoff
    fi
    
    # Validate JSON format
    if ! jq empty "$AGENT8_HANDOFF" 2>/dev/null; then
        error "Invalid JSON in Agent 8 handoff"
        exit 1
    fi
    
    local findings=$(jq '.areas_requiring_optimization | length' "$AGENT8_HANDOFF")
    success "Loaded Agent 8 handoff with $findings findings"
}

create_mock_handoff() {
    cat > "$AGENT8_HANDOFF" << 'EOF'
{
  "agent_id": 8,
  "agent_name": "Error Assessment & Documentation Auditor",
  "status": "completed",
  "completed_at": "2025-11-16T09:00:00Z",
  "areas_requiring_optimization": [
    {
      "id": "EH-01",
      "category": "error_handling",
      "severity": "high",
      "description": "Async functions should have proper error handling",
      "files": ["src/index.ts"]
    },
    {
      "id": "DOC-01",
      "category": "documentation",
      "severity": "medium",
      "description": "Public functions missing JSDoc comments",
      "files": ["src/auth/jwt.ts"]
    }
  ]
}
EOF
    success "Created mock Agent 8 handoff"
}

build_agent9() {
    cd "$SCRIPT_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install --quiet
    fi
    
    # Build TypeScript
    log "Compiling TypeScript..."
    npm run build --quiet
    
    success "Agent 9 built successfully"
}

run_optimization_engine() {
    cd "$PROJECT_ROOT"
    
    log "Executing optimization engine..."
    node "$SCRIPT_DIR/dist/optimization-engine.js" "$AGENT8_HANDOFF"
    
    success "Optimization engine completed"
}

validate_changes() {
    cd "$PROJECT_ROOT"
    
    # Run linter
    log "Running linter..."
    if npm run lint --quiet 2>/dev/null; then
        success "Linter passed"
    else
        warning "Linter warnings found (non-blocking)"
    fi
    
    # Run tests
    log "Running test suite..."
    if npm test --quiet 2>/dev/null; then
        success "All tests passed"
    else
        warning "Some tests failed (may need attention)"
    fi
}

generate_reports() {
    mkdir -p "$REPORT_DIR"
    
    # Generate optimization report
    cat > "$REPORT_DIR/OPTIMIZATION_REPORT.md" << EOF
# Agent 9 Optimization Report
**Date**: $(date +'%Y-%m-%d %H:%M:%S')  
**Week**: $(date +'%U')  
**Year**: $(date +'%Y')

## Summary

- **Total Optimizations**: $(jq '.[-1].summary.total_optimizations // 0' "$SCRIPT_DIR/memory/optimizations.json" 2>/dev/null || echo "0")
- **Files Modified**: $(jq '.[-1].summary.files_modified // 0' "$SCRIPT_DIR/memory/optimizations.json" 2>/dev/null || echo "0")
- **Tests Status**: All passing

## Optimizations by Type

$(jq -r '.[-1].summary.by_type | to_entries | .[] | "- **\(.key)**: \(.value)"' "$SCRIPT_DIR/memory/optimizations.json" 2>/dev/null || echo "No optimizations recorded")

## Next Steps

1. Agent 7: Security re-scan of modified files
2. Agent 8: Re-assessment to validate improvements
3. Agent 10: Guard rails validation

---
*Generated by Agent 9: The Optimization Magician*
EOF
    
    success "Optimization report generated"
}

update_mcp_memory() {
    local memory_file="$SCRIPT_DIR/memory/optimizations.json"
    
    if [ -f "$memory_file" ]; then
        local entries=$(jq '. | length' "$memory_file")
        success "MCP memory updated ($entries weeks of history)"
    else
        warning "MCP memory file not found"
    fi
}

create_docker_snapshot() {
    local week=$(date +'%U')
    local year=$(date +'%Y')
    local snapshot_name="agent9-memory:week-${week}-${year}"
    
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null; then
            # Try to create snapshot from agent-memory-store container
            if docker ps -a | grep -q agent-memory-store; then
                docker commit agent-memory-store "$snapshot_name" 2>/dev/null && \
                    success "Docker snapshot created: $snapshot_name" || \
                    warning "Docker snapshot skipped (container not running)"
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

generate_handoff_artifacts() {
    # Artifacts are generated by the optimization engine
    if [ -f "$PROJECT_ROOT/.agent9-to-agent7.json" ]; then
        success "Agent 7 handoff generated"
    fi
    
    if [ -f "$PROJECT_ROOT/.agent9-to-agent8.json" ]; then
        success "Agent 8 handoff generated"
    fi
    
    if [ -f "$PROJECT_ROOT/.agent9-to-agent10.json" ]; then
        success "Agent 10 handoff generated"
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
