#!/bin/bash
##############################################################################
# Agent 12: Quality Assurance & Intelligence - Weekly Script
# 
# Purpose: Final QA analysis and intelligence tracking for autonomous cycle
# Schedule: Saturday 6:45 AM MST (cron: 0 6 * * 6)
# Duration: 45 minutes
# Dependencies: Agents 7, 8, 9, 10, 11 (runs last in sequence)
#
# Workflow:
# 1. Load handoff artifacts from all agents (7-11)
# 2. Run QA analysis engine
# 3. Generate intelligence report
# 4. Update MCP memory
# 5. Create cycle completion artifact
# 6. Create Docker snapshot
##############################################################################

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WEEK=$(date +%U)
YEAR=$(date +%Y)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

section() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================
# PRE-FLIGHT CHECKS
# ============================================
preflight_checks() {
    section "🔍 PRE-FLIGHT CHECKS"
    
    local checks_passed=true
    
    # Check 1: Verify we're in project root
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "Not in project root directory"
        checks_passed=false
    else
        success "Project root verified"
    fi
    
    # Check 2: Check for handoff artifacts
    log "Checking for agent handoff artifacts..."
    local artifacts_found=0
    for agent_id in {7..11}; do
        if [ -f "$PROJECT_ROOT/.agent${agent_id}-handoff.json" ]; then
            info "  ✅ Agent ${agent_id} handoff found"
            artifacts_found=$((artifacts_found + 1))
        else
            warning "  ⚠️  Agent ${agent_id} handoff not found"
        fi
    done
    
    if [ $artifacts_found -eq 0 ]; then
        warning "No handoff artifacts found - this may be expected for first run"
    else
        success "$artifacts_found agent handoff artifact(s) found"
    fi
    
    # Check 3: Node.js available
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        checks_passed=false
    else
        success "Node.js available: $(node --version)"
    fi
    
    if [ "$checks_passed" = false ]; then
        error "Pre-flight checks failed"
        exit 1
    fi
    
    success "All pre-flight checks passed"
}

# ============================================
# BUILD QA ENGINE
# ============================================
build_qa_engine() {
    section "🔨 BUILDING QA ENGINE"
    
    cd "$SCRIPT_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
        success "Dependencies installed"
    else
        info "Dependencies already installed"
    fi
    
    # Build TypeScript
    log "Compiling TypeScript..."
    npm run build
    success "QA engine compiled successfully"
    
    cd "$PROJECT_ROOT"
}

# ============================================
# RUN QA ANALYSIS
# ============================================
run_qa_analysis() {
    section "🧠 RUNNING QA ANALYSIS"
    
    cd "$SCRIPT_DIR"
    
    log "Executing QA engine..."
    npm run qa
    
    cd "$PROJECT_ROOT"
    
    success "QA analysis completed"
}

# ============================================
# CREATE DOCKER SNAPSHOT
# ============================================
create_docker_snapshot() {
    section "🐋 CREATING DOCKER SNAPSHOT"
    
    if ! command -v docker &> /dev/null; then
        warning "Docker not available - skipping snapshot"
        return 0
    fi
    
    log "Creating Docker snapshot for Week ${WEEK}..."
    
    # Check if running in Docker
    if docker ps &> /dev/null; then
        # Create a marker file for this week's completion
        local snapshot_dir="$PROJECT_ROOT/.docker/snapshots"
        mkdir -p "$snapshot_dir"
        
        cat > "$snapshot_dir/week-${WEEK}-${YEAR}.json" <<EOF
{
  "week": $WEEK,
  "year": $YEAR,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agent": 12,
  "status": "complete"
}
EOF
        
        success "Docker snapshot marker created"
    else
        warning "Not running in Docker environment - snapshot skipped"
    fi
}

# ============================================
# VERIFY CYCLE COMPLETION
# ============================================
verify_completion() {
    section "✅ VERIFYING CYCLE COMPLETION"
    
    local verification_passed=true
    
    # Check 1: QA report generated
    local report_dir="$SCRIPT_DIR/reports/week-${WEEK}-${YEAR}"
    if [ -f "$report_dir/QA_INTELLIGENCE_REPORT.md" ]; then
        success "QA intelligence report generated"
    else
        error "QA intelligence report not found"
        verification_passed=false
    fi
    
    # Check 2: Completion artifact created
    if [ -f "$PROJECT_ROOT/.agent12-complete.json" ]; then
        success "Cycle completion artifact created"
    else
        error "Cycle completion artifact not found"
        verification_passed=false
    fi
    
    # Check 3: Memory updated
    if [ -f "$SCRIPT_DIR/memory/qa-history.json" ]; then
        success "MCP memory updated"
    else
        warning "MCP memory file not found (may be first run)"
    fi
    
    if [ "$verification_passed" = false ]; then
        error "Cycle completion verification failed"
        exit 1
    fi
    
    success "All verification checks passed"
}

# ============================================
# DISPLAY SUMMARY
# ============================================
display_summary() {
    section "📊 EXECUTION SUMMARY"
    
    # Read intelligence score from completion artifact
    if [ -f "$PROJECT_ROOT/.agent12-complete.json" ]; then
        local intelligence_score=$(jq -r '.intelligence_score' "$PROJECT_ROOT/.agent12-complete.json" 2>/dev/null || echo "N/A")
        local quality_grade=$(jq -r '.quality_grade' "$PROJECT_ROOT/.agent12-complete.json" 2>/dev/null || echo "N/A")
        
        log "Intelligence Score: ${intelligence_score}/100 (${quality_grade})"
    fi
    
    log "Week: ${WEEK}, Year: ${YEAR}"
    log "Timestamp: ${TIMESTAMP}"
    log "Report Location: agents/agent12/reports/week-${WEEK}-${YEAR}/"
    
    echo ""
    success "🎉 Agent 12 execution completed successfully!"
    echo ""
    info "📄 View full report: cat agents/agent12/reports/week-${WEEK}-${YEAR}/QA_INTELLIGENCE_REPORT.md"
    info "📊 View intelligence data: cat agents/agent12/intelligence/week-${WEEK}-${YEAR}-intelligence.json"
    info "💾 View memory: cat agents/agent12/memory/qa-history.json"
}

# ============================================
# MAIN EXECUTION
# ============================================
main() {
    log "Starting Agent 12: Quality Assurance & Intelligence"
    log "Week $WEEK, $YEAR - Timestamp: $TIMESTAMP"
    echo ""
    
    # Execute workflow
    preflight_checks
    build_qa_engine
    run_qa_analysis
    create_docker_snapshot
    verify_completion
    display_summary
    
    # Return to project root
    cd "$PROJECT_ROOT"
}

# Execute main function
main
