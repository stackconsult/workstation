# Agent 5: DevOps & Containerization Engineer

**Tier**: Foundation (Tier 1)  
**Status**: ✅ Active  
**Purpose**: Infrastructure architect - Makes everything portable and reproducible

---

## Overview

Agent 5 is the DevOps & Containerization Engineer that dockerizes the entire workstation system, implements MCP memory persistence for autonomous agents (Agents 7-12), and creates deployment scripts for production-ready infrastructure.

### Motto
> "It works on my machine... and yours, and production, because Docker"

---

## Core Identity

**Role**: Systems engineer who masters deployment

**Primary Mission**: Containerize the entire system with Docker and docker-compose orchestration

**Secondary Mission**: Implement MCP memory persistence for autonomous agents (Agents 7-12)

**Tertiary Mission**: Create deployment scripts and production-ready infrastructure

---

## Operating Principles

1. **Docker for consistency** - same environment everywhere
2. **Multi-stage builds** - optimized image sizes
3. **Named volumes** - data persistence across restarts
4. **Health checks** - container monitoring in every service
5. **Environment variables** - configuration flexibility
6. **Scripts automate everything** - one-command deployments

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Containerization | Docker | 24+ |
| Orchestration | docker-compose | Latest |
| Base Images | node:20-alpine, golang:1.21-alpine | Latest |
| Volumes | Named volumes | - |
| Networking | Custom bridge network | - |

---

## Project Structure

Agent 5 creates and manages:

```
workstation/
├── .docker/
│   ├── Dockerfile.workstation     # TypeScript API container
│   ├── Dockerfile.automation      # Go backend container
│   └── Dockerfile.mcp             # MCP server container
├── docker-compose.yml             # Orchestration configuration
├── docker-compose.mcp.yml         # MCP containers orchestration
├── .dockerignore                  # Docker build exclusions
├── scripts/
│   ├── start.sh                   # Start all containers
│   ├── stop.sh                    # Stop all containers
│   ├── logs.sh                    # View container logs
│   ├── rebuild.sh                 # Rebuild containers
│   └── backup.sh                  # Backup persistent data
└── .env.example                   # Environment template
```

---

## Key Features

### 1. Multi-Stage Docker Builds
- **Build stage**: Compile TypeScript/Go with all dev dependencies
- **Production stage**: Minimal runtime environment
- **Layer caching**: Optimized for fast rebuilds
- **Security**: Non-root user execution

### 2. Docker Compose Orchestration
- **Main stack**: API, database, Redis, automation
- **MCP stack**: 20+ MCP container services
- **Service dependencies**: Proper startup order
- **Health checks**: Container readiness verification
- **Auto-restart**: Resilient to failures

### 3. MCP Memory Persistence
- **Named volumes**: Persist agent memory across restarts
- **Backup scripts**: Automated data backup
- **Volume snapshots**: Point-in-time recovery
- **Migration tools**: Easy data portability

### 4. Network Configuration
- **Custom bridge network**: Service isolation
- **Internal DNS**: Service discovery by name
- **Port mapping**: External access control
- **Security groups**: Network segmentation

### 5. Environment Management
- **.env file support**: Configuration via environment variables
- **Secrets management**: Secure credential storage
- **Multi-environment**: Dev, staging, production configs
- **Variable validation**: Startup checks

### 6. Deployment Scripts
- **One-command start**: `./scripts/start.sh`
- **Graceful shutdown**: `./scripts/stop.sh`
- **Log aggregation**: `./scripts/logs.sh`
- **Health monitoring**: `./scripts/health-check.sh`

---

## Docker Services

### Main Stack (docker-compose.yml)

```yaml
services:
  workstation-api:
    # TypeScript Express API
    # Port: 3000
    # Health: /health endpoint
    
  automation-backend:
    # Go automation engine
    # Port: 8080
    # Health: /health endpoint
    
  postgres:
    # PostgreSQL database
    # Port: 5432
    # Volume: postgres_data
    
  redis:
    # Redis cache/queue
    # Port: 6379
    # Volume: redis_data
```

### MCP Stack (docker-compose.mcp.yml)

```yaml
services:
  agent1-mcp:
    # MCP server for Agent 1
    
  agent2-mcp:
    # MCP server for Agent 2
    
  # ... 18 more MCP services
```

---

## Quick Start

### Prerequisites

- Docker 24+ installed
- docker-compose installed
- 4GB+ RAM available
- 10GB+ disk space

### Build and Run

```bash
# Navigate to agent directory
cd agents/agent5

# Run setup script
./run-build-setup.sh

# OR manual steps:

# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Quick Commands

```bash
# Start everything
./scripts/start.sh

# Stop everything
./scripts/stop.sh

# View logs
./scripts/logs.sh

# Rebuild containers
./scripts/rebuild.sh

# Backup data
./scripts/backup.sh
```

---

## Container Configuration

### TypeScript API Container

**Dockerfile**: `.docker/Dockerfile.workstation`

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

**Features**:
- Multi-stage build (reduced size)
- Alpine base (minimal footprint)
- Non-root user (security)
- Health check endpoint
- Graceful shutdown handling

### Go Automation Container

**Dockerfile**: `.docker/Dockerfile.automation`

```dockerfile
# Multi-stage build for Go
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o automation

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/automation ./
USER nobody
CMD ["./automation"]
```

**Features**:
- Static binary (no dependencies)
- Minimal alpine image
- CGO disabled (portability)
- Security hardened

---

## Volume Management

### Named Volumes

```yaml
volumes:
  postgres_data:      # Database persistence
  redis_data:         # Cache persistence
  mcp_memory:         # MCP agent memory
  agent_logs:         # Application logs
  uploads:            # User uploads
```

### Backup Strategy

```bash
# Backup all volumes
./scripts/backup.sh

# Backup specific volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

---

## Network Configuration

### Custom Bridge Network

```yaml
networks:
  workstation-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### Service Discovery

Services can communicate using service names:
- `http://workstation-api:3000`
- `http://postgres:5432`
- `http://redis:6379`

### Port Mapping

```yaml
# External → Internal
3000:3000   # API (public)
8080:8080   # Automation (internal)
5432:5432   # Postgres (internal)
6379:6379   # Redis (internal)
```

---

## Environment Variables

### Required Variables (.env)

```env
# Application
NODE_ENV=production
PORT=3000
API_URL=http://localhost:3000

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=workstation
POSTGRES_USER=workstation
POSTGRES_PASSWORD=changeme

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeme

# JWT
JWT_SECRET=your-secure-secret-here
JWT_EXPIRATION=24h

# MCP
MCP_MEMORY_PATH=/app/memory
MCP_LOG_LEVEL=info
```

---

## MCP Memory Persistence

### Volume Configuration

```yaml
volumes:
  mcp_memory:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/mcp-memory
```

### Memory Structure

```
mcp-memory/
├── agent7/
│   ├── context.json
│   └── history.json
├── agent8/
│   ├── context.json
│   └── history.json
├── agent9/
│   └── ...
└── agent12/
    └── ...
```

### Backup Schedule

- **Hourly**: Incremental backups
- **Daily**: Full snapshots
- **Weekly**: Compressed archives
- **Monthly**: Long-term storage

---

## Health Checks

### Container Health

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Monitoring Script

```bash
#!/bin/bash
# scripts/health-check.sh

for service in $(docker-compose ps --services); do
  health=$(docker inspect --format='{{.State.Health.Status}}' $service)
  echo "$service: $health"
done
```

---

## Production Deployment

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Docker Hub Deployment

```bash
# Build images
docker-compose build

# Tag images
docker tag workstation-api:latest username/workstation-api:1.0

# Push to Docker Hub
docker push username/workstation-api:1.0

# Pull on server
docker pull username/workstation-api:1.0
docker-compose up -d
```

### Manual Server Deployment

```bash
# On server:
git clone repo
cd workstation
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Common Issues

**Container won't start**
```bash
# Check logs
docker-compose logs <service>

# Inspect container
docker inspect <container>

# Rebuild
docker-compose build --no-cache <service>
```

**Volume permission issues**
```bash
# Fix ownership
docker-compose exec <service> chown -R node:node /app

# OR rebuild with correct user
USER node
```

**Network connectivity issues**
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

**Out of disk space**
```bash
# Clean up
docker system prune -a

# Remove unused volumes
docker volume prune
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check disk usage: `docker system df`
- Review logs: `docker-compose logs --tail=100`
- Backup volumes: `./scripts/backup.sh`

**Monthly**:
- Update images: `docker-compose pull`
- Clean unused resources: `docker system prune`
- Verify backups: Test restore process

**Quarterly**:
- Update base images
- Security audit: `docker scan <image>`
- Performance review

---

## Integration with Other Agents

### Dependent Agents

- **Agent 1**: Provides API container
- **Agent 2-4**: Use containerized environment
- **Agents 7-12**: Require MCP memory persistence
- **All agents**: Benefit from consistent environment

### Integration Points

1. **Container Registry**: Share built images
2. **Volume Mounts**: Access shared data
3. **Environment Variables**: Share configuration
4. **Network**: Service-to-service communication

---

## Performance Optimization

### Image Size Reduction
- Use Alpine base images
- Multi-stage builds
- Remove unnecessary files
- Minimize layers

### Build Speed
- Cache dependencies
- Order layers efficiently
- Use `.dockerignore`
- Parallel builds

### Runtime Performance
- Resource limits (CPU, memory)
- Health check optimization
- Log rotation
- Volume optimization

---

## Security Best Practices

1. **Non-root user**: Run as unprivileged user
2. **Read-only filesystem**: Where possible
3. **Secret management**: Use Docker secrets or env vars
4. **Image scanning**: Regular vulnerability scans
5. **Network isolation**: Minimize exposed ports
6. **Update regularly**: Keep base images current

---

## License

Part of the workstation project - See repository LICENSE file

---

## Support

- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues
- **Docker Hub**: Official images
- **Slack**: #devops channel

---

## Related Documentation

- [Docker Documentation](https://docs.docker.com/)
- [docker-compose Reference](https://docs.docker.com/compose/)
- [Deployment Guide](../../docs/guides/INSTALLATION_GUIDE.md)
- [Architecture Overview](../../ARCHITECTURE.md)

---

**Last Updated**: November 24, 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
