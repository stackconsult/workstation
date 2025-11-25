#!/bin/bash

# Repo Update Agent - Rollback Script
# Version: 1.0.0
# Description: Rollback documentation to a previous state

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROLLBACK_DIR="rollbacks"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"

# Functions
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✅ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
}

print_error() {
    echo -e "${RED}❌ ${NC}$1"
}

print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║           REPO UPDATE AGENT - ROLLBACK TOOL                ║"
    echo "║                     Version 1.0.0                          ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

list_available_rollbacks() {
    print_info "Available rollback dates:"
    echo ""
    
    cd "$REPO_ROOT/$ROLLBACK_DIR" 2>/dev/null || {
        print_warning "No rollback directory found"
        return 1
    }
    
    local dates=$(ls -d */ 2>/dev/null | sed 's#/##' | sort -r)
    
    if [ -z "$dates" ]; then
        print_warning "No rollback dates available"
        return 1
    fi
    
    for date in $dates; do
        local file_count=$(ls "$date"/*.bak 2>/dev/null | wc -l)
        echo "  📅 $date ($file_count files)"
    done
    echo ""
}

list_files_in_rollback() {
    local date=$1
    local rollback_path="$REPO_ROOT/$ROLLBACK_DIR/$date"
    
    if [ ! -d "$rollback_path" ]; then
        print_error "Rollback date $date not found"
        return 1
    fi
    
    print_info "Files in rollback $date:"
    echo ""
    
    cd "$rollback_path"
    for file in *.bak; do
        if [ -f "$file" ]; then
            local original_name="${file%.bak}"
            local size=$(du -h "$file" | cut -f1)
            echo "  📄 $original_name ($size)"
        fi
    done
    echo ""
}

rollback_file() {
    local date=$1
    local filename=$2
    local rollback_path="$REPO_ROOT/$ROLLBACK_DIR/$date"
    local backup_file="$rollback_path/${filename}.bak"
    local target_file="$REPO_ROOT/$filename"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Create a safety backup of current file
    if [ -f "$target_file" ]; then
        cp "$target_file" "${target_file}.safety-backup"
        print_info "Created safety backup: ${filename}.safety-backup"
    fi
    
    # Restore from backup
    cp "$backup_file" "$target_file"
    print_success "Restored $filename from $date"
}

rollback_all() {
    local date=$1
    local rollback_path="$REPO_ROOT/$ROLLBACK_DIR/$date"
    
    if [ ! -d "$rollback_path" ]; then
        print_error "Rollback date $date not found"
        return 1
    fi
    
    print_info "Rolling back all files from $date..."
    echo ""
    
    cd "$rollback_path"
    local count=0
    
    for backup_file in *.bak; do
        if [ -f "$backup_file" ]; then
            local original_name="${backup_file%.bak}"
            rollback_file "$date" "$original_name"
            ((count++))
        fi
    done
    
    echo ""
    print_success "Rolled back $count files from $date"
}

show_help() {
    cat << EOF
Usage: rollback.sh [OPTIONS] <date> [file]

Rollback documentation to a previous state using the Repo Update Agent backups.

Arguments:
  date          Rollback date in YYYY-MM-DD format
  file          (Optional) Specific file to rollback. If not provided, rolls back all files.

Options:
  -l, --list                List available rollback dates
  -f, --files <date>        List files in a specific rollback
  -h, --help                Show this help message

Examples:
  # List available rollbacks
  ./rollback.sh --list

  # List files in a specific rollback
  ./rollback.sh --files 2025-11-20

  # Rollback all files from a date
  ./rollback.sh 2025-11-20

  # Rollback a specific file
  ./rollback.sh 2025-11-20 README.md

Safety:
  - A safety backup (.safety-backup) is created before rollback
  - Original rollback files are preserved
  - Can be reverted by restoring .safety-backup files

Rollback Location:
  $ROLLBACK_DIR/

Retention:
  Rollbacks are automatically cleaned after 30 days

EOF
}

# Main script
main() {
    print_header
    
    # Change to repo root
    cd "$REPO_ROOT"
    
    # Parse arguments
    case "${1:-}" in
        -l|--list)
            list_available_rollbacks
            exit 0
            ;;
        -f|--files)
            if [ -z "$2" ]; then
                print_error "Please specify a date"
                echo ""
                show_help
                exit 1
            fi
            list_files_in_rollback "$2"
            exit 0
            ;;
        -h|--help|"")
            show_help
            exit 0
            ;;
        *)
            # Rollback operation
            local date=$1
            local filename=$2
            
            # Validate date format
            if ! [[ $date =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
                print_error "Invalid date format. Use YYYY-MM-DD"
                exit 1
            fi
            
            if [ -z "$filename" ]; then
                # Rollback all files
                print_warning "This will rollback ALL documentation from $date"
                read -p "Are you sure? (y/N) " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_info "Rollback cancelled"
                    exit 0
                fi
                rollback_all "$date"
            else
                # Rollback specific file
                print_info "Rolling back $filename from $date..."
                rollback_file "$date" "$filename"
            fi
            
            echo ""
            print_success "Rollback complete!"
            print_info "Safety backups created with .safety-backup extension"
            print_info "To undo this rollback, restore the .safety-backup files"
            ;;
    esac
}

# Run main
main "$@"
