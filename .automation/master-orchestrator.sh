#!/bin/bash
# .automation/master-orchestrator.sh
# Master orchestrator for autonomous weekly improvement cycle
# Runs every Saturday 2:00 AM MST via cron

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CYCLE_LOG="$SCRIPT_DIR/logs/cycle-$TIMESTAMP.log"
WEEK=$(date +%U)
YEAR=$(date +%Y)

mkdir -p "$SCRIPT_DIR/logs"

# ============================================
# LOGGING FUNCTIONS
# ============================================
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$CYCLE_LOG"
}

log_section() {
    echo "" | tee -a "$CYCLE_LOG"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$CYCLE_LOG"
    echo "$*" | tee -a "$CYCLE_LOG"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$CYCLE_LOG"
    echo "" | tee -a "$CYCLE_LOG"
}

notify_slack() {
    local message="$1"
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# ============================================
# PRE-CYCLE VALIDATION
# ============================================
pre_cycle_checks() {
    log_section "🔍 PRE-CYCLE VALIDATION"
    
    local failed_checks=0
    
    # Check 1: Node.js available
    log "Checking Node.js..."
    if ! command -v node &>/dev/null; then
        log "❌ Node.js not available"
        failed_checks=$((failed_checks + 1))
    else
        log "✅ Node.js available: $(node --version)"
    fi
    
    # Check 2: Project structure
    log "Checking project structure..."
    if [ ! -f "$ROOT_DIR/package.json" ]; then
        log "❌ package.json not found"
        failed_checks=$((failed_checks + 1))
    else
        log "✅ Project structure valid"
    fi
    
    # Check 3: Agent directories
    log "Checking agent directories..."
    local agents_ok=0
    for agent in {7..12}; do
        if [ -d "$ROOT_DIR/agents/agent${agent}" ]; then
            agents_ok=$((agents_ok + 1))
        fi
    done
    log "✅ Found $agents_ok/6 agent directories"
    
    # Check 4: Agent scripts
    log "Checking agent scripts..."
    local scripts_ok=0
    for agent in {7..12}; do
        if [ -f "$ROOT_DIR/agents/agent${agent}/run-weekly-"*".sh" ]; then
            scripts_ok=$((scripts_ok + 1))
        fi
    done
    log "✅ Found $scripts_ok/6 agent scripts"
    
    if [ $failed_checks -gt 0 ]; then
        log "❌ Pre-cycle checks failed: $failed_checks issue(s)"
        notify_slack "🚨 Agent Cycle Aborted: Pre-cycle checks failed"
        exit 1
    fi
    
    log "✅ All pre-cycle checks passed"
}

# ============================================
# AGENT EXECUTION
# ============================================
run_agent() {
    local agent_id=$1
    local agent_name=$2
    local estimated_duration=$3
    
    log_section "🤖 AGENT $agent_id: $agent_name"
    
    local start_time=$(date +%s)
    local agent_log="$SCRIPT_DIR/logs/agent${agent_id}-week${WEEK}.log"
    local timeout_seconds=$((estimated_duration * 60 * 2))  # 2x estimated duration
    
    log "Starting Agent $agent_id..."
    log "Estimated duration: $estimated_duration minutes"
    log "Timeout: $((timeout_seconds / 60)) minutes"
    
    # Find agent script
    local agent_script=""
    if [ -f "$ROOT_DIR/agents/agent${agent_id}/run-weekly-security.sh" ]; then
        agent_script="$ROOT_DIR/agents/agent${agent_id}/run-weekly-security.sh"
    elif [ -f "$ROOT_DIR/agents/agent${agent_id}/run-weekly-assessment.sh" ]; then
        agent_script="$ROOT_DIR/agents/agent${agent_id}/run-weekly-assessment.sh"
    elif [ -f "$ROOT_DIR/agents/agent${agent_id}/run-weekly-optimization.sh" ]; then
        agent_script="$ROOT_DIR/agents/agent${agent_id}/run-weekly-optimization.sh"
    elif [ -f "$ROOT_DIR/agents/agent${agent_id}/run-weekly-guard-rails.sh" ]; then
        agent_script="$ROOT_DIR/agents/agent${agent_id}/run-weekly-guard-rails.sh"
    elif [ -f "$ROOT_DIR/agents/agent${agent_id}/run-weekly-analytics.sh" ]; then
        agent_script="$ROOT_DIR/agents/agent${agent_id}/run-weekly-analytics.sh"
    elif [ -f "$ROOT_DIR/agents/agent${agent_id}/run-weekly-qa.sh" ]; then
        agent_script="$ROOT_DIR/agents/agent${agent_id}/run-weekly-qa.sh"
    fi
    
    if [ -z "$agent_script" ] || [ ! -f "$agent_script" ]; then
        log "❌ Agent script not found for agent $agent_id"
        return 1
    fi
    
    # Run with timeout
    if timeout "$timeout_seconds" bash "$agent_script" > "$agent_log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "✅ Agent $agent_id completed in $((duration / 60)) minutes"
        
        # Verify handoff artifact created (optional check)
        if [ -f "$ROOT_DIR/.agent${agent_id}-handoff.json" ] || [ -f "$ROOT_DIR/.agent${agent_id}-complete.json" ]; then
            log "✅ Handoff artifact created"
        else
            log "ℹ️  No handoff artifact (may not be required)"
        fi
        
        return 0
    else
        local exit_code=$?
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ $exit_code -eq 124 ]; then
            log "❌ Agent $agent_id TIMEOUT after $((duration / 60)) minutes"
        else
            log "❌ Agent $agent_id FAILED with exit code $exit_code"
        fi
        
        log "See log: $agent_log"
        return 1
    fi
}

retry_agent() {
    local agent_id=$1
    local agent_name=$2
    local estimated_duration=$3
    local max_retries=2
    
    for attempt in $(seq 1 $max_retries); do
        log "Retry attempt $attempt/$max_retries for Agent $agent_id..."
        
        if run_agent "$agent_id" "$agent_name" "$estimated_duration"; then
            return 0
        fi
        
        if [ $attempt -lt $max_retries ]; then
            log "Waiting 10 minutes before retry..."
            sleep 600
        fi
    done
    
    return 1
}

# ============================================
# MAIN EXECUTION CYCLE
# ============================================
main() {
    log_section "🚀 AUTONOMOUS IMPROVEMENT CYCLE - WEEK $WEEK, $YEAR"
    
    notify_slack "🤖 Autonomous Improvement Cycle Starting - Week $WEEK"
    
    # Pre-cycle validation
    pre_cycle_checks
    
    # Track agent execution
    declare -A agent_status
    local failed_agents=()
    
    # ============================================
    # AGENT 7: Security & Penetration Testing
    # ============================================
    if run_agent 7 "Security & Penetration Testing" 90; then
        agent_status[7]="✅ success"
    else
        if retry_agent 7 "Security & Penetration Testing" 90; then
            agent_status[7]="✅ success (retry)"
        else
            agent_status[7]="❌ failed"
            failed_agents+=(7)
            notify_slack "🚨 CRITICAL: Agent 7 (Security) failed after retries"
        fi
    fi
    
    # ============================================
    # AGENT 8: Error Assessment & Documentation
    # ============================================
    if run_agent 8 "Error Assessment & Documentation" 45; then
        agent_status[8]="✅ success"
    else
        if retry_agent 8 "Error Assessment & Documentation" 45; then
            agent_status[8]="✅ success (retry)"
        else
            agent_status[8]="❌ failed"
            failed_agents+=(8)
            notify_slack "🚨 CRITICAL: Agent 8 (Assessment) failed after retries"
        fi
    fi
    
    # ============================================
    # AGENT 9: Optimization Magician
    # ============================================
    if run_agent 9 "Optimization Magician" 75; then
        agent_status[9]="✅ success"
    else
        if retry_agent 9 "Optimization Magician" 75; then
            agent_status[9]="✅ success (retry)"
        else
            agent_status[9]="❌ failed"
            failed_agents+=(9)
            notify_slack "🚨 CRITICAL: Agent 9 (Optimization) failed after retries"
        fi
    fi
    
    # ============================================
    # AGENT 10: Guard Rails & Error Prevention
    # ============================================
    if run_agent 10 "Guard Rails & Error Prevention" 45; then
        agent_status[10]="✅ success"
    else
        if retry_agent 10 "Guard Rails & Error Prevention" 45; then
            agent_status[10]="✅ success (retry)"
        else
            agent_status[10]="❌ failed"
            failed_agents+=(10)
            notify_slack "⚠️  Agent 10 (Guard Rails) failed after retries"
        fi
    fi
    
    # ============================================
    # AGENT 11: Data Analytics & Comparison
    # ============================================
    if run_agent 11 "Data Analytics & Comparison" 30; then
        agent_status[11]="✅ success"
    else
        if retry_agent 11 "Data Analytics & Comparison" 30; then
            agent_status[11]="✅ success (retry)"
        else
            agent_status[11]="❌ failed"
            failed_agents+=(11)
            notify_slack "⚠️  Agent 11 (Analytics) failed after retries"
        fi
    fi
    
    # ============================================
    # AGENT 12: Quality Assurance & Intelligence
    # ============================================
    if run_agent 12 "Quality Assurance & Intelligence" 45; then
        agent_status[12]="✅ success"
    else
        if retry_agent 12 "Quality Assurance & Intelligence" 45; then
            agent_status[12]="✅ success (retry)"
        else
            agent_status[12]="❌ failed"
            failed_agents+=(12)
            notify_slack "⚠️  Agent 12 (QA) failed after retries"
        fi
    fi
    
    # ============================================
    # POST-CYCLE SUMMARY
    # ============================================
    log_section "📊 CYCLE SUMMARY - WEEK $WEEK"
    
    log "Agent Execution Status:"
    for agent in {7..12}; do
        log "  Agent $agent: ${agent_status[$agent]}"
    done
    
    log ""
    
    if [ ${#failed_agents[@]} -eq 0 ]; then
        log "✅ ALL AGENTS COMPLETED SUCCESSFULLY"
        notify_slack "✅ Autonomous Improvement Cycle Complete - Week $WEEK\n\
All agents executed successfully.\n\
Next cycle: $(date -d 'next saturday 02:00' +'%Y-%m-%d %H:%M %Z' 2>/dev/null || echo 'Next Saturday 02:00')"
        
        # Create cycle completion marker
        cat > "$ROOT_DIR/.cycle-complete-week-$WEEK.json" <<EOF
{
  "week": $WEEK,
  "year": $YEAR,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "success",
  "agents": {
    "7": "${agent_status[7]}",
    "8": "${agent_status[8]}",
    "9": "${agent_status[9]}",
    "10": "${agent_status[10]}",
    "11": "${agent_status[11]}",
    "12": "${agent_status[12]}"
  },
  "next_cycle": "$(date -d 'next saturday 02:00' +'%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo 'Next Saturday 02:00')"
}
EOF
        
        exit 0
    else
        log "❌ CYCLE INCOMPLETE - ${#failed_agents[@]} agent(s) failed"
        log "Failed agents: ${failed_agents[*]}"
        
        notify_slack "🚨 Autonomous Improvement Cycle FAILED - Week $WEEK\n\
Failed agents: ${failed_agents[*]}\n\
Manual intervention required."
        
        exit 1
    fi
}

# Execute main cycle
main
