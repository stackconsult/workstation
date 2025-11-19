#!/bin/bash

#############################################################################
# Docker Container Peelback Script
# 
# This script performs "peelback" operations - rolling back a container
# to a previous image version with safety checks and verification.
#
# Usage: ./peelback.sh <container-name> <image-tag> [--verify-health]
#
# Example: ./peelback.sh mcp-16-data v1.0.0 --verify-health
#############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.mcp.yml"
LOG_DIR="${LOG_DIR:-/var/log/peelback}"
LOG_FILE="$LOG_DIR/peelback_$(date +%Y%m%d).log"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io/creditxcredit/workstation}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$@"
    echo -e "${BLUE}ℹ ${NC}$*"
}

log_success() {
    log "SUCCESS" "$@"
    echo -e "${GREEN}✓${NC} $*"
}

log_warning() {
    log "WARNING" "$@"
    echo -e "${YELLOW}⚠${NC} $*"
}

log_error() {
    log "ERROR" "$@"
    echo -e "${RED}✗${NC} $*" >&2
}

# Usage information
usage() {
    cat << EOF
Docker Container Peelback Script

USAGE:
    $0 <container-name> <image-tag> [OPTIONS]

ARGUMENTS:
    container-name    Name of the container to rollback (e.g., mcp-16-data)
    image-tag         Image tag to rollback to (e.g., v1.0.0)

OPTIONS:
    --verify-health   Verify container health after rollback
    --no-backup       Skip backup of current state
    --force           Force rollback without confirmation
    -h, --help        Show this help message

EXAMPLES:
    # Basic peelback
    $0 mcp-16-data v1.0.0

    # Peelback with health verification
    $0 mcp-16-data v1.0.0 --verify-health

    # Force peelback without confirmation
    $0 mcp-01-selector v0.9.5 --force

SAFETY FEATURES:
    - Validates container and image tag existence
    - Creates backup of current state
    - Verifies health checks (optional)
    - Automatic rollback on failure
    - Comprehensive logging

LOG FILE:
    $LOG_FILE

EOF
    exit 1
}

# Parse arguments
if [ $# -lt 2 ]; then
    log_error "Insufficient arguments provided"
    usage
fi

CONTAINER_NAME="$1"
IMAGE_TAG="$2"
VERIFY_HEALTH=false
NO_BACKUP=false
FORCE=false

shift 2
while [ $# -gt 0 ]; do
    case "$1" in
        --verify-health)
            VERIFY_HEALTH=true
            ;;
        --no-backup)
            NO_BACKUP=true
            ;;
        --force)
            FORCE=true
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
    shift
done

# Setup
setup() {
    log_info "=== Docker Container Peelback ==="
    log_info "Container: $CONTAINER_NAME"
    log_info "Target Tag: $IMAGE_TAG"
    log_info "Timestamp: $(date)"
    
    # Create log directory if it doesn't exist
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR" || {
            log_warning "Cannot create log directory, logging to /tmp"
            LOG_FILE="/tmp/peelback_$(date +%Y%m%d_%H%M%S).log"
        }
    fi
}

# Validate container exists
validate_container() {
    log_info "Validating container: $CONTAINER_NAME"
    
    if ! docker-compose -f "$COMPOSE_FILE" ps "$CONTAINER_NAME" &>/dev/null; then
        log_error "Container '$CONTAINER_NAME' not found in docker-compose.yml"
        log_error "Available containers:"
        docker-compose -f "$COMPOSE_FILE" ps --services
        exit 1
    fi
    
    log_success "Container validated"
}

# Get current container state
get_current_state() {
    log_info "Getting current container state"
    
    CURRENT_IMAGE=$(docker inspect "$CONTAINER_NAME" --format='{{.Config.Image}}' 2>/dev/null || echo "unknown")
    CURRENT_STATUS=$(docker inspect "$CONTAINER_NAME" --format='{{.State.Status}}' 2>/dev/null || echo "not_running")
    
    log_info "Current image: $CURRENT_IMAGE"
    log_info "Current status: $CURRENT_STATUS"
}

# Backup current state
backup_current_state() {
    if [ "$NO_BACKUP" = true ]; then
        log_warning "Skipping backup (--no-backup specified)"
        return 0
    fi
    
    log_info "Creating backup of current state"
    
    local backup_name="${CONTAINER_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    
    # Commit current container as backup image
    if docker commit "$CONTAINER_NAME" "$backup_name" &>/dev/null; then
        log_success "Backup created: $backup_name"
        echo "$backup_name" > "/tmp/peelback_backup_${CONTAINER_NAME}.txt"
    else
        log_warning "Could not create backup, continuing anyway"
    fi
}

# Verify image tag exists
verify_image_tag() {
    log_info "Verifying image tag: $IMAGE_TAG"
    
    local full_image="${REGISTRY}/${CONTAINER_NAME}:${IMAGE_TAG}"
    
    # Try to pull the image
    if docker pull "$full_image" &>/dev/null; then
        log_success "Image tag verified and pulled: $full_image"
        return 0
    else
        log_error "Image tag '$IMAGE_TAG' not found in registry"
        log_error "Tried: $full_image"
        exit 1
    fi
}

# Confirm rollback
confirm_rollback() {
    if [ "$FORCE" = true ]; then
        log_warning "Force mode enabled, skipping confirmation"
        return 0
    fi
    
    echo
    echo -e "${YELLOW}⚠ WARNING: This will rollback container '$CONTAINER_NAME' to tag '$IMAGE_TAG'${NC}"
    echo -e "Current image: ${BLUE}$CURRENT_IMAGE${NC}"
    echo -e "Target image:  ${BLUE}${REGISTRY}/${CONTAINER_NAME}:${IMAGE_TAG}${NC}"
    echo
    read -p "Continue with rollback? (yes/no): " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
    
    log_info "Rollback confirmed by user"
}

# Stop container
stop_container() {
    log_info "Stopping container: $CONTAINER_NAME"
    
    if docker-compose -f "$COMPOSE_FILE" stop "$CONTAINER_NAME"; then
        log_success "Container stopped"
    else
        log_error "Failed to stop container"
        exit 1
    fi
}

# Update image and restart
restart_with_new_image() {
    log_info "Restarting container with image tag: $IMAGE_TAG"
    
    # Export environment variable to override image tag
    export IMAGE_TAG
    
    if docker-compose -f "$COMPOSE_FILE" up -d "$CONTAINER_NAME"; then
        log_success "Container restarted with new image"
    else
        log_error "Failed to restart container"
        rollback_on_failure
        exit 1
    fi
}

# Verify health check
verify_health_check() {
    if [ "$VERIFY_HEALTH" = false ]; then
        log_info "Health check verification skipped"
        return 0
    fi
    
    log_info "Verifying container health (may take up to 60 seconds)"
    
    local max_attempts=12
    local attempt=1
    local wait_time=5
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        local health_status=$(docker inspect "$CONTAINER_NAME" --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
        
        if [ "$health_status" = "healthy" ]; then
            log_success "Container is healthy"
            return 0
        elif [ "$health_status" = "unhealthy" ]; then
            log_error "Container is unhealthy"
            rollback_on_failure
            exit 1
        fi
        
        sleep $wait_time
        attempt=$((attempt + 1))
    done
    
    log_error "Health check timeout (container did not become healthy)"
    rollback_on_failure
    exit 1
}

# Rollback on failure
rollback_on_failure() {
    log_warning "Attempting to rollback to previous state"
    
    local backup_file="/tmp/peelback_backup_${CONTAINER_NAME}.txt"
    
    if [ -f "$backup_file" ]; then
        local backup_image=$(cat "$backup_file")
        log_info "Restoring from backup: $backup_image"
        
        docker-compose -f "$COMPOSE_FILE" stop "$CONTAINER_NAME"
        docker tag "$backup_image" "${REGISTRY}/${CONTAINER_NAME}:latest"
        docker-compose -f "$COMPOSE_FILE" up -d "$CONTAINER_NAME"
        
        log_success "Rollback to previous state completed"
    else
        log_error "No backup found, manual intervention required"
    fi
}

# Log peelback event
log_peelback_event() {
    log_info "Recording peelback event"
    
    local event_log="$LOG_DIR/peelback_events.log"
    local event_entry="$(date '+%Y-%m-%d %H:%M:%S') | $CONTAINER_NAME | $CURRENT_IMAGE -> ${IMAGE_TAG} | SUCCESS"
    
    echo "$event_entry" >> "$event_log"
    log_success "Peelback event recorded"
}

# Cleanup
cleanup() {
    log_info "Performing cleanup"
    
    # Remove backup marker file
    local backup_file="/tmp/peelback_backup_${CONTAINER_NAME}.txt"
    if [ -f "$backup_file" ]; then
        rm -f "$backup_file"
    fi
    
    log_info "Cleanup completed"
}

# Main execution
main() {
    setup
    validate_container
    get_current_state
    verify_image_tag
    confirm_rollback
    backup_current_state
    stop_container
    restart_with_new_image
    verify_health_check
    log_peelback_event
    cleanup
    
    echo
    log_success "=== Peelback completed successfully ==="
    log_info "Container: $CONTAINER_NAME"
    log_info "Image tag: $IMAGE_TAG"
    log_info "Log file: $LOG_FILE"
    echo
}

# Run main function
main

exit 0
