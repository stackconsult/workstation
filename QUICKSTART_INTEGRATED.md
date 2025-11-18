# Integrated Workstation Quickstart Guide

**Last Updated**: November 18, 2025  
**Related Documentation**:
- [Full Deployment Guide](DEPLOYMENT_INTEGRATED.md)
- [Rollback Procedures](ROLLBACK_PROCEDURES.md)
- [CI/CD Fixes & Error Prevention](CI_FIXES_DOCUMENTATION.md)

Get the integrated workstation platform up and running in minutes.

## Prerequisites

- Docker and Docker Compose installed
- 4GB+ RAM available
- Ports 3000, 8080, 8082 available

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Run the quick start script
./quick-start.sh
```

### 2. Manual Setup

If you prefer manual setup:

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Set required variables:
# - JWT_SECRET=your-secure-secret-here
# - NODE_ENV=production
```

### 3. Start Services

#### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.integrated.yml up -d

# Check status
docker-compose -f docker-compose.integrated.yml ps

# View logs
docker-compose -f docker-compose.integrated.yml logs -f
```

#### Using Quick Start Script

```bash
# The quick-start.sh script handles everything
./quick-start.sh

# Follow the prompts to:
# - Set JWT secret
# - Configure ports
# - Start services
```

## Verify Installation

### 1. Health Check

```bash
# Check JWT Auth service
curl http://localhost:3000/health

# Check Agent Server
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": "...",
  "service": "..."
}
```

### 2. Generate Demo Token

```bash
# Get a demo JWT token
curl http://localhost:3000/auth/demo-token
```

### 3. Test Authentication

```bash
# Get token
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r .token)

# Access protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

## Using the Platform

### Authentication

1. **Get a token**:
   ```bash
   curl -X POST http://localhost:3000/auth/token \
     -H "Content-Type: application/json" \
     -d '{"userId": "user@example.com", "role": "user"}'
   ```

2. **Use token in requests**:
   ```bash
   curl -H "Authorization: Bearer $YOUR_TOKEN" \
     http://localhost:3000/api/protected
   ```

### Agent Server

1. **WebSocket Connection**:
   ```javascript
   const ws = new WebSocket('ws://localhost:8082');
   ws.on('open', () => {
     ws.send(JSON.stringify({ type: 'ping' }));
   });
   ```

2. **HTTP API**:
   ```bash
   curl http://localhost:8080/api/agent/status
   ```

### MCP Integration

The platform includes Model Context Protocol (MCP) integration for:
- State management
- Recovery operations
- Peelback/rollback capabilities

See `mcp-config.yml` for configuration options.

## Common Tasks

### View Logs

```bash
# All services
docker-compose -f docker-compose.integrated.yml logs -f

# Specific service
docker-compose -f docker-compose.integrated.yml logs -f workstation
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.integrated.yml restart

# Restart specific service
docker-compose -f docker-compose.integrated.yml restart workstation
```

### Stop Services

```bash
# Stop all
docker-compose -f docker-compose.integrated.yml down

# Stop without removing volumes
docker-compose -f docker-compose.integrated.yml stop
```

### Update to Latest Version

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.integrated.yml down
docker-compose -f docker-compose.integrated.yml build --no-cache
docker-compose -f docker-compose.integrated.yml up -d
```

## Configuration

### Environment Variables

Edit `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your-super-secure-secret
JWT_EXPIRATION=24h

# Service Ports
PORT=3000
AGENT_SERVER_HTTP_PORT=8080
AGENT_SERVER_WS_PORT=8082

# Environment
NODE_ENV=production

# CDP Configuration
CDP_HOST=localhost
CDP_PORT=9222
```

### MCP Configuration

Edit `mcp-config.yml`:

```yaml
mcp:
  enabled: true
  version: "1.0"

recovery:
  enabled: true
  snapshots:
    interval: 3600
    retention: 7

peelback:
  enabled: true
  stages: 5

rollback:
  enabled: true
  autoRollback: false
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process or change port in .env
```

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.integrated.yml logs

# Remove and recreate
docker-compose -f docker-compose.integrated.yml down -v
docker-compose -f docker-compose.integrated.yml up -d
```

### Authentication Issues

```bash
# Verify JWT_SECRET is set
docker-compose -f docker-compose.integrated.yml exec workstation env | grep JWT

# Generate new token
curl http://localhost:3000/auth/demo-token
```

### Agent Server Connection Failed

```bash
# Check if service is running
docker-compose -f docker-compose.integrated.yml ps

# Verify ports are exposed
docker-compose -f docker-compose.integrated.yml port workstation 8080
docker-compose -f docker-compose.integrated.yml port workstation 8082
```

## Next Steps

1. **Read Full Documentation**: See [DEPLOYMENT_INTEGRATED.md](DEPLOYMENT_INTEGRATED.md)
2. **Configure MCP**: Edit `mcp-config.yml` for your needs
3. **Set Up Monitoring**: Configure log aggregation and metrics
4. **Enable TLS**: Configure SSL/TLS for production
5. **Review Security**: See security best practices in deployment guide

## Development Mode

For development:

```bash
# Install dependencies
npm ci

# Start in dev mode
npm run dev

# In another terminal, start agent server
cd agent-server/nodejs
npm install
npm start
```

## Getting Help

- **Documentation**: See `docs/` directory
- **API Reference**: See `docs/API.md`
- **Issues**: GitHub Issues for bugs and features
- **Deployment Guide**: [DEPLOYMENT_INTEGRATED.md](DEPLOYMENT_INTEGRATED.md)

## Quick Reference

| Service | Port | Health Check |
|---------|------|--------------|
| JWT Auth | 3000 | http://localhost:3000/health |
| Agent HTTP | 8080 | http://localhost:8080/health |
| Agent WS | 8082 | ws://localhost:8082 |

### Important Files

- `.env` - Environment configuration
- `mcp-config.yml` - MCP settings
- `docker-compose.integrated.yml` - Docker Compose config
- `Dockerfile.integrated` - Integrated Docker image

### Important Commands

```bash
# Start
docker-compose -f docker-compose.integrated.yml up -d

# Stop
docker-compose -f docker-compose.integrated.yml down

# Logs
docker-compose -f docker-compose.integrated.yml logs -f

# Restart
docker-compose -f docker-compose.integrated.yml restart
```

## Success Checklist

- [ ] Services running (check with `docker-compose ps`)
- [ ] Health checks passing (curl health endpoints)
- [ ] JWT tokens working (test authentication)
- [ ] Agent server accessible (test HTTP and WS)
- [ ] Logs clean (no errors in `docker-compose logs`)

You're all set! 🚀
