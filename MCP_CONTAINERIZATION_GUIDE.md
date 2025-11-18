# MCP Containerization & Data Isolation Guide
## Ensuring Proper Data Containerization in MCP Architecture

### Table of Contents
1. [Overview](#overview)
2. [Container Architecture](#container-architecture)
3. [Data Isolation Strategy](#data-isolation-strategy)
4. [Volume Management](#volume-management)
5. [Network Segmentation](#network-segmentation)
6. [Security Boundaries](#security-boundaries)
7. [Verification Procedures](#verification-procedures)
8. [Common Issues & Fixes](#common-issues--fixes)
9. [Best Practices](#best-practices)

---

## Overview

This guide ensures all MCP (Model Context Protocol) agents are properly containerized with appropriate data isolation, preventing data leakage between containers and maintaining security boundaries.

### Goals
- **Data Isolation**: Each MCP container has isolated data storage
- **Network Segmentation**: Containers communicate only through defined channels
- **Security Boundaries**: Proper permission and access controls
- **Resource Limits**: CPU and memory constraints prevent resource exhaustion
- **Monitoring**: Health checks and logging for all containers

---

## Container Architecture

### MCP Container Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Base MCP Container (00-base-mcp)                  │     │
│  │  - Shared libraries                                │     │
│  │  - Common utilities                                │     │
│  │  - Base configuration                              │     │
│  └────────────────────────────────────────────────────┘     │
│               │         │         │                          │
│               ▼         ▼         ▼                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ MCP-01  │ │ MCP-02  │ │ MCP-03  │ │ MCP-N   │          │
│  │ Selector│ │ Backend │ │Database │ │ ...     │          │
│  │         │ │ Engineer│ │ Spec.   │ │         │          │
│  │ Data:   │ │ Data:   │ │ Data:   │ │ Data:   │          │
│  │ Isolated│ │ Isolated│ │ Isolated│ │ Isolated│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│       │         │         │         │                       │
│       └─────────┴─────────┴─────────┘                       │
│                   │                                          │
│         ┌─────────▼─────────┐                               │
│         │ MCP Orchestrator  │                               │
│         │ (20-orchestrator) │                               │
│         └───────────────────┘                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Container Specifications

Each MCP container follows this specification:

```yaml
version: '3.8'

services:
  mcp-example:
    build:
      context: ./mcp-containers/example-mcp
      dockerfile: Dockerfile
    
    container_name: mcp-example
    restart: unless-stopped
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    
    # Environment variables
    environment:
      - NODE_ENV=production
      - MCP_ID=example
      - MCP_PORT=8083
      - LOG_LEVEL=info
    
    # Data isolation via volumes
    volumes:
      - mcp-example-data:/app/data:rw
      - mcp-example-logs:/app/logs:rw
      - mcp-example-config:/app/config:ro
    
    # Network isolation
    networks:
      - mcp-internal
    
    # Health checks
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8083/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    # Security
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100M
    
    # Labels
    labels:
      - "mcp.id=example"
      - "mcp.type=agent"
      - "mcp.version=1.0.0"

volumes:
  mcp-example-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/mcp-example
  
  mcp-example-logs:
    driver: local
  
  mcp-example-config:
    driver: local

networks:
  mcp-internal:
    driver: bridge
    internal: false  # Set to true for complete isolation
```

---

## Data Isolation Strategy

### 1. Volume-Based Isolation

Each MCP container has dedicated volumes:

```bash
# List all MCP volumes
docker volume ls | grep mcp

# Expected structure:
# mcp-01-selector-data
# mcp-01-selector-logs
# mcp-02-backend-data
# mcp-02-backend-logs
# ...
```

### 2. Filesystem Permissions

```bash
# Inside container
/app
├── data/        # Read-write: Container-specific data
├── logs/        # Read-write: Container logs
├── config/      # Read-only: Configuration files
├── shared/      # Read-only: Shared libraries (if needed)
└── tmp/         # Temporary: In-memory tmpfs
```

### 3. Data Access Matrix

| Container | Can Access | Cannot Access |
|-----------|-----------|---------------|
| MCP-01 | mcp-01-data/, mcp-01-logs/ | mcp-02-data/, mcp-03-data/ |
| MCP-02 | mcp-02-data/, mcp-02-logs/ | mcp-01-data/, mcp-03-data/ |
| MCP-Orchestrator | All MCP metadata | Individual MCP data (unless authorized) |

---

## Volume Management

### 1. Create Isolated Volumes

```bash
#!/bin/bash
# Create isolated volumes for all MCP containers

set -euo pipefail

MCP_CONTAINERS=(
    "01-selector"
    "02-go-backend-browser-automation-engineer"
    "03-database-orchestration-specialist"
    "04-integration-specialist-slack-webhooks"
    "05-workflow"
    "06-project-builder"
    "07-code-quality"
    "08-performance"
    "09-error-tracker"
    "10-security"
    "11-accessibility"
    "12-integration"
    "13-docs-auditor"
    "14-advanced-automation"
    "15-api-integration"
    "16-data-processing"
    "17-learning-platform"
    "18-community-hub"
    "19-deployment"
    "20-orchestrator"
)

for mcp in "${MCP_CONTAINERS[@]}"; do
    echo "Creating volumes for mcp-${mcp}..."
    
    # Data volume
    docker volume create \
        --driver local \
        --opt type=none \
        --opt o=bind \
        --opt device=$(pwd)/data/mcp-${mcp} \
        mcp-${mcp}-data
    
    # Logs volume
    docker volume create mcp-${mcp}-logs
    
    # Config volume (read-only)
    docker volume create mcp-${mcp}-config
    
    echo "✅ Volumes created for mcp-${mcp}"
done

echo "✅ All MCP volumes created"
```

### 2. Verify Volume Isolation

```bash
#!/bin/bash
# Verify data isolation between MCP containers

set -euo pipefail

echo "🔍 Verifying MCP container data isolation..."

# Test 1: Check volume mounts
echo ""
echo "Test 1: Verifying volume mounts..."
for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    echo "Container: ${container}"
    docker inspect ${container} --format '{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Mode}}){{println}}{{end}}' | head -3
    echo ""
done

# Test 2: Check filesystem permissions
echo "Test 2: Checking filesystem permissions..."
for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    echo "Container: ${container}"
    docker exec ${container} ls -la /app | head -5 || echo "⚠️  Cannot access ${container}"
    echo ""
done

# Test 3: Verify write access isolation
echo "Test 3: Verifying write access isolation..."
for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    echo "Testing ${container}..."
    
    # Try to write to own data directory (should succeed)
    docker exec ${container} touch /app/data/test-write.txt 2>/dev/null && \
        echo "✅ ${container} can write to own data directory" || \
        echo "❌ ${container} cannot write to own data directory"
    
    # Clean up
    docker exec ${container} rm -f /app/data/test-write.txt 2>/dev/null || true
done

echo ""
echo "✅ Data isolation verification complete"
```

### 3. Volume Backup Strategy

```bash
#!/bin/bash
# Backup all MCP container data

set -euo pipefail

BACKUP_DIR="/var/backups/mcp/$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

echo "📦 Backing up MCP container data to: ${BACKUP_DIR}"

# Backup each MCP container's data
for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    echo "Backing up ${container}..."
    
    # Create container-specific backup directory
    mkdir -p "${BACKUP_DIR}/${container}"
    
    # Export data volume
    docker run --rm \
        --volumes-from ${container} \
        -v ${BACKUP_DIR}/${container}:/backup \
        alpine \
        tar czf /backup/data.tar.gz -C /app/data .
    
    # Export logs (last 1000 lines)
    docker logs ${container} --tail 1000 > "${BACKUP_DIR}/${container}/logs.txt" 2>&1
    
    echo "✅ ${container} backed up"
done

echo "✅ MCP backup complete: ${BACKUP_DIR}"
```

---

## Network Segmentation

### 1. Network Topology

```yaml
# docker-compose with network segmentation

networks:
  # Public network (accessible from outside)
  public:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  
  # Internal MCP network (isolated)
  mcp-internal:
    driver: bridge
    internal: true  # No external access
    ipam:
      config:
        - subnet: 172.21.0.0/16
  
  # Database network (highly restricted)
  database:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.22.0.0/16

services:
  # API Gateway (public + mcp-internal)
  workstation:
    networks:
      - public
      - mcp-internal
    ports:
      - "3000:3000"
  
  # MCP Containers (mcp-internal only)
  mcp-01-selector:
    networks:
      - mcp-internal
    # No external ports
  
  # Database (database network only)
  database:
    networks:
      - database
    # No external access
```

### 2. Network Verification

```bash
#!/bin/bash
# Verify network segmentation

echo "🔍 Verifying MCP network segmentation..."

# Test 1: Check network assignments
echo ""
echo "Test 1: Network assignments"
for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    networks=$(docker inspect ${container} --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')
    echo "${container}: ${networks}"
done

# Test 2: Verify external connectivity
echo ""
echo "Test 2: External connectivity (should fail for internal networks)"
for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    echo "Testing ${container}..."
    docker exec ${container} ping -c 1 -W 2 8.8.8.8 2>/dev/null && \
        echo "⚠️  ${container} has external access (check if intended)" || \
        echo "✅ ${container} is isolated from external networks"
done

# Test 3: Inter-container communication
echo ""
echo "Test 3: Inter-container communication within mcp-internal"
echo "Testing mcp-01 → mcp-02 communication..."
docker exec mcp-01-selector ping -c 1 -W 2 mcp-02-go-backend-browser-automation-engineer 2>/dev/null && \
    echo "✅ Internal MCP communication works" || \
    echo "❌ Internal MCP communication failed"

echo ""
echo "✅ Network segmentation verification complete"
```

---

## Security Boundaries

### 1. Container Security Configuration

```yaml
# Security-hardened MCP container

services:
  mcp-secure:
    # Run as non-root user
    user: "1001:1001"
    
    # Security options
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined  # Or use custom seccomp profile
      - apparmor:docker-default
    
    # Read-only root filesystem
    read_only: true
    
    # Temporary filesystem for writable dirs
    tmpfs:
      - /tmp:noexec,nosuid,size=100M
      - /run:noexec,nosuid,size=50M
    
    # Capability dropping
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if needed
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
          pids: 100  # Prevent fork bombs
```

### 2. Security Verification Script

```bash
#!/bin/bash
# Verify MCP container security configuration

set -euo pipefail

echo "🔒 Verifying MCP container security..."

for container in $(docker ps --format '{{.Names}}' | grep mcp); do
    echo ""
    echo "=== ${container} ==="
    
    # Check if running as root
    user=$(docker exec ${container} id -u 2>/dev/null || echo "N/A")
    if [ "${user}" == "0" ]; then
        echo "⚠️  Running as root (UID: ${user})"
    else
        echo "✅ Running as non-root (UID: ${user})"
    fi
    
    # Check read-only filesystem
    if docker inspect ${container} --format '{{.HostConfig.ReadonlyRootfs}}' | grep -q true; then
        echo "✅ Read-only root filesystem enabled"
    else
        echo "⚠️  Read-only root filesystem NOT enabled"
    fi
    
    # Check security options
    secopts=$(docker inspect ${container} --format '{{.HostConfig.SecurityOpt}}')
    if echo "${secopts}" | grep -q "no-new-privileges"; then
        echo "✅ no-new-privileges enabled"
    else
        echo "⚠️  no-new-privileges NOT enabled"
    fi
    
    # Check resource limits
    mem_limit=$(docker inspect ${container} --format '{{.HostConfig.Memory}}')
    if [ "${mem_limit}" != "0" ]; then
        echo "✅ Memory limit set: $((mem_limit / 1024 / 1024))MB"
    else
        echo "⚠️  No memory limit set"
    fi
done

echo ""
echo "✅ Security verification complete"
```

---

## Verification Procedures

### 1. Complete MCP Containerization Check

```bash
#!/bin/bash
# Comprehensive MCP containerization verification

set -euo pipefail

echo "🔍 MCP Containerization Verification Suite"
echo "=========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Test 1: Container Existence
echo ""
echo "Test 1: Verifying MCP containers exist..."
expected_mcps=20
running_mcps=$(docker ps --filter "name=mcp" --format '{{.Names}}' | wc -l)

if [ ${running_mcps} -eq ${expected_mcps} ]; then
    echo -e "${GREEN}✅ PASS${NC}: All ${expected_mcps} MCP containers running"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC}: Expected ${expected_mcps} MCP containers, found ${running_mcps}"
    ((FAIL++))
fi

# Test 2: Data Isolation
echo ""
echo "Test 2: Verifying data isolation..."
isolation_ok=true

for container in $(docker ps --format '{{.Names}}' | grep mcp | head -5); do
    # Check if container has dedicated data volume
    data_mounts=$(docker inspect ${container} --format '{{range .Mounts}}{{if eq .Destination "/app/data"}}{{.Name}}{{end}}{{end}}')
    
    if [ -n "${data_mounts}" ]; then
        echo -e "${GREEN}✅${NC} ${container}: Has dedicated data volume"
    else
        echo -e "${RED}❌${NC} ${container}: Missing dedicated data volume"
        isolation_ok=false
    fi
done

if [ "${isolation_ok}" = true ]; then
    ((PASS++))
else
    ((FAIL++))
fi

# Test 3: Network Segmentation
echo ""
echo "Test 3: Verifying network segmentation..."
network_ok=true

for container in $(docker ps --format '{{.Names}}' | grep mcp | head -5); do
    networks=$(docker inspect ${container} --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')
    
    if echo "${networks}" | grep -q "mcp-internal"; then
        echo -e "${GREEN}✅${NC} ${container}: On mcp-internal network"
    else
        echo -e "${YELLOW}⚠️${NC}  ${container}: Not on mcp-internal network"
        network_ok=false
        ((WARN++))
    fi
done

if [ "${network_ok}" = true ]; then
    ((PASS++))
fi

# Test 4: Health Checks
echo ""
echo "Test 4: Verifying health checks..."
health_ok=true

for container in $(docker ps --format '{{.Names}}' | grep mcp | head -5); do
    health=$(docker inspect ${container} --format '{{.State.Health.Status}}' 2>/dev/null || echo "none")
    
    if [ "${health}" == "healthy" ]; then
        echo -e "${GREEN}✅${NC} ${container}: Healthy"
    elif [ "${health}" == "none" ]; then
        echo -e "${YELLOW}⚠️${NC}  ${container}: No health check configured"
        ((WARN++))
    else
        echo -e "${RED}❌${NC} ${container}: Health status: ${health}"
        health_ok=false
    fi
done

if [ "${health_ok}" = true ]; then
    ((PASS++))
fi

# Test 5: Resource Limits
echo ""
echo "Test 5: Verifying resource limits..."
limits_ok=true

for container in $(docker ps --format '{{.Names}}' | grep mcp | head -5); do
    mem_limit=$(docker inspect ${container} --format '{{.HostConfig.Memory}}')
    cpu_limit=$(docker inspect ${container} --format '{{.HostConfig.NanoCpus}}')
    
    if [ "${mem_limit}" != "0" ] && [ "${cpu_limit}" != "0" ]; then
        echo -e "${GREEN}✅${NC} ${container}: Has resource limits"
    else
        echo -e "${YELLOW}⚠️${NC}  ${container}: Missing resource limits"
        ((WARN++))
    fi
done

# Test 6: Security Configuration
echo ""
echo "Test 6: Verifying security configuration..."
security_ok=true

for container in $(docker ps --format '{{.Names}}' | grep mcp | head -5); do
    user=$(docker exec ${container} id -u 2>/dev/null || echo "0")
    readonly=$(docker inspect ${container} --format '{{.HostConfig.ReadonlyRootfs}}')
    
    if [ "${user}" != "0" ] || [ "${readonly}" == "true" ]; then
        echo -e "${GREEN}✅${NC} ${container}: Security-hardened"
    else
        echo -e "${YELLOW}⚠️${NC}  ${container}: Consider security hardening"
        ((WARN++))
    fi
done

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}PASS: ${PASS}${NC}"
echo -e "${RED}FAIL: ${FAIL}${NC}"
echo -e "${YELLOW}WARN: ${WARN}${NC}"

if [ ${FAIL} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ MCP containerization verification PASSED${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ MCP containerization verification FAILED${NC}"
    exit 1
fi
```

### 2. Automated Daily Verification

```yaml
# .github/workflows/mcp-verification.yml

name: MCP Containerization Verification

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  verify-mcp:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Set up Docker
        uses: docker/setup-buildx-action@v3
      
      - name: Start MCP containers
        run: docker-compose up -d
      
      - name: Wait for containers to be healthy
        run: |
          sleep 30
          docker ps
      
      - name: Run MCP verification
        run: |
          chmod +x scripts/verify-mcp-containerization.sh
          ./scripts/verify-mcp-containerization.sh
      
      - name: Generate report
        if: always()
        run: |
          echo "# MCP Verification Report" > report.md
          echo "Date: $(date)" >> report.md
          echo "" >> report.md
          docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> report.md
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: mcp-verification-report
          path: report.md
```

---

## Common Issues & Fixes

### Issue 1: Volume Permission Errors

**Symptom:**
```
Error: EACCES: permission denied, open '/app/data/file.json'
```

**Fix:**
```bash
# Check volume ownership
docker exec mcp-container ls -la /app/data

# Fix ownership
docker exec -u root mcp-container chown -R 1001:1001 /app/data

# Or rebuild with correct USER in Dockerfile
# Dockerfile:
USER 1001
WORKDIR /app
```

### Issue 2: Network Connectivity Issues

**Symptom:**
```
Error: connect ECONNREFUSED mcp-other-container:8080
```

**Fix:**
```bash
# Verify both containers are on same network
docker network inspect mcp-internal

# Add container to network if missing
docker network connect mcp-internal mcp-container

# Update docker-compose.yml
services:
  mcp-container:
    networks:
      - mcp-internal
```

### Issue 3: Data Leakage Between Containers

**Symptom:**
```
Container A can access Container B's data
```

**Fix:**
```bash
# Remove shared volumes
docker volume rm shared-data

# Create dedicated volumes
docker volume create mcp-a-data
docker volume create mcp-b-data

# Update mounts in docker-compose.yml
services:
  mcp-a:
    volumes:
      - mcp-a-data:/app/data
  mcp-b:
    volumes:
      - mcp-b-data:/app/data
```

---

## Best Practices

### 1. Volume Naming Convention

```
{service}-{container-id}-{purpose}

Examples:
- mcp-01-selector-data
- mcp-02-backend-logs
- mcp-orchestrator-config
```

### 2. Resource Allocation Guidelines

| Container Type | CPU Limit | Memory Limit | Recommended |
|----------------|-----------|--------------|-------------|
| Lightweight MCP | 0.25 | 256MB | Selector, Config |
| Standard MCP | 0.5 | 512MB | Most agents |
| Heavy MCP | 1.0 | 1GB | Database, Orchestrator |
| Critical MCP | 2.0 | 2GB | Main services |

### 3. Health Check Standards

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:${PORT}/health"]
  interval: 30s      # How often to check
  timeout: 10s       # Max time for check
  retries: 3         # Failures before unhealthy
  start_period: 40s  # Grace period on startup
```

### 4. Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "mcp.id,mcp.type"
```

---

## Monitoring & Alerting

### Prometheus Metrics

```yaml
# prometheus/mcp-monitoring.yml

scrape_configs:
  - job_name: 'mcp-containers'
    static_configs:
      - targets:
        - 'mcp-01-selector:8081'
        - 'mcp-02-backend:8082'
        # ... all MCP containers
    
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
      - source_labels: [__meta_docker_container_label_mcp_id]
        target_label: mcp_id
```

### Alert Rules

```yaml
groups:
  - name: mcp-isolation
    rules:
      - alert: MCPDataIsolationViolation
        expr: mcp_data_access_violations_total > 0
        labels:
          severity: critical
        annotations:
          summary: "MCP data isolation violated"
      
      - alert: MCPNetworkIsolationBreach
        expr: mcp_external_connections_total{network="mcp-internal"} > 0
        labels:
          severity: critical
        annotations:
          summary: "MCP network isolation breached"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-18 | Initial MCP containerization guide |

---

**Last Updated**: 2025-11-18
**Maintained By**: Platform Team
**Review Cycle**: Monthly
