#!/bin/bash
# MCP Container Peelback Script
# Automatically rolls back MCP containers to previous stable state

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-mcp-containers/docker-compose.mcp.yml}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/mcp-backups}"
LOG_FILE="${LOG_FILE:-/tmp/mcp-peelback.log}"
MAX_RETRIES=3
RETRY_DELAY=5

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Backup current state
backup_current_state() {
    log "Backing up current container state..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Export current container states
    docker-compose -f "$COMPOSE_FILE" ps -a > "$BACKUP_DIR/containers-$(date +%s).txt"
    
    # Backup environment variables
    if [ -f "mcp-containers/.env" ]; then
        cp "mcp-containers/.env" "$BACKUP_DIR/.env.backup-$(date +%s)"
    fi
    
    # Save Docker images
    log "Saving Docker images to backup..."
    docker images | grep mcp | awk '{print $1":"$2}' | while read image; do
        image_name=$(echo "$image" | tr ':/' '_')
        docker save "$image" -o "$BACKUP_DIR/${image_name}-$(date +%s).tar" 2>/dev/null || true
    done
    
    success "Backup completed: $BACKUP_DIR"
}

# Get container health status
check_container_health() {
    local container=$1
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
    echo "$health_status"
}

# Stop unhealthy containers
stop_unhealthy_containers() {
    log "Checking for unhealthy containers..."
    
    local unhealthy_found=false
    
    docker-compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | while read -r line; do
        local container_name=$(echo "$line" | jq -r '.Name' 2>/dev/null || echo "")
        
        if [ -n "$container_name" ]; then
            local health=$(check_container_health "$container_name")
            
            if [ "$health" = "unhealthy" ] || [ "$health" = "starting" ]; then
                warn "Unhealthy container found: $container_name (status: $health)"
                docker stop "$container_name" 2>/dev/null || true
                unhealthy_found=true
            fi
        fi
    done
    
    if [ "$unhealthy_found" = true ]; then
        warn "Stopped unhealthy containers"
    else
        log "All containers are healthy"
    fi
}

# Rollback to previous images
rollback_images() {
    log "Rolling back to previous Docker images..."
    
    # Stop all MCP containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Find and load latest backups
    local backup_files=$(find "$BACKUP_DIR" -name "*.tar" -type f 2>/dev/null | sort -r)
    
    if [ -z "$backup_files" ]; then
        warn "No backup images found in $BACKUP_DIR"
        return 1
    fi
    
    echo "$backup_files" | head -20 | while read -r backup_file; do
        log "Loading backup image: $(basename "$backup_file")"
        docker load -i "$backup_file" 2>/dev/null || true
    done
    
    success "Image rollback completed"
}

# Restart containers with retry
restart_containers() {
    log "Restarting MCP containers..."
    
    local attempt=1
    local success=false
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "Restart attempt $attempt/$MAX_RETRIES"
        
        if docker-compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE"; then
            success=true
            break
        else
            error "Restart attempt $attempt failed"
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "Waiting $RETRY_DELAY seconds before retry..."
                sleep $RETRY_DELAY
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    if [ "$success" = true ]; then
        success "Containers restarted successfully"
        return 0
    else
        error "Failed to restart containers after $MAX_RETRIES attempts"
        return 1
    fi
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    # Wait for containers to start
    sleep 10
    
    local failed_containers=()
    
    # Check health of all MCP containers
    docker-compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | while read -r line; do
        local container_name=$(echo "$line" | jq -r '.Name' 2>/dev/null || echo "")
        
        if [ -n "$container_name" ]; then
            local health=$(check_container_health "$container_name")
            
            if [ "$health" = "healthy" ]; then
                log "✓ $container_name is healthy"
            else
                warn "✗ $container_name is $health"
                failed_containers+=("$container_name")
            fi
        fi
    done
    
    if [ ${#failed_containers[@]} -eq 0 ]; then
        success "All containers are healthy after rollback"
        return 0
    else
        error "Some containers are not healthy: ${failed_containers[*]}"
        return 1
    fi
}

# Main execution
main() {
    log "========================================="
    log "MCP Container Peelback Script Starting"
    log "========================================="
    
    check_prerequisites
    backup_current_state
    stop_unhealthy_containers
    
    if rollback_images; then
        if restart_containers; then
            if verify_rollback; then
                success "========================================="
                success "Peelback completed successfully!"
                success "========================================="
                exit 0
            else
                error "Rollback verification failed"
            fi
        else
            error "Container restart failed"
        fi
    else
        warn "Skipping image rollback - attempting container restart only"
        
        if restart_containers; then
            verify_rollback
            exit $?
        fi
    fi
    
    error "========================================="
    error "Peelback process encountered errors"
    error "Check logs: $LOG_FILE"
    error "Backup location: $BACKUP_DIR"
    error "========================================="
    exit 1
}

# Run main function
main "$@"
