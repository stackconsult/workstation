# Integrated Workstation Deployment Guide

**Last Updated**: November 18, 2025  
**Related Documentation**: 
- [CI/CD Fixes Documentation](CI_FIXES_DOCUMENTATION.md)
- [Rollback Procedures](ROLLBACK_PROCEDURES.md)
- [Quickstart Guide](QUICKSTART_INTEGRATED.md)

## Architecture Overview

This guide covers the deployment of the integrated workstation platform combining JWT authentication, agent server, and MCP integration.

### System Components

- **JWT Authentication Service** (Port 3000)
- **Agent HTTP Server** (Port 8080)
- **Agent WebSocket Server** (Port 8082)
- **MCP Integration Layer**

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Workstation Platform                │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   JWT Auth   │  │ Agent Server │  │    MCP    │ │
│  │  (Port 3000) │  │  (8080/8082) │  │ Integration│ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Quality Assurance

Before any code reaches this deployment:
- ✅ **Linting**: Code style validation
- ✅ **Build**: TypeScript compilation
- ✅ **Tests**: 170 tests with 67.18% coverage
- ✅ **Coverage Thresholds**: Quality gates enforced
- ✅ **Security Scanning**: No vulnerabilities or secrets
- ✅ **Error Handling**: Comprehensive error recovery

See [CI/CD Fixes Documentation](CI_FIXES_DOCUMENTATION.md) for details on how we prevent production failures.

## Deployment Options

### Docker Deployment

#### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose -f docker-compose.integrated.yml up -d

# Check service health
docker-compose -f docker-compose.integrated.yml ps

# View logs
docker-compose -f docker-compose.integrated.yml logs -f
```

#### Manual Docker Build

```bash
# Build the integrated image
docker build -f Dockerfile.integrated -t workstation:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  -p 8080:8080 \
  -p 8082:8082 \
  -e JWT_SECRET=your-secret-here \
  -e NODE_ENV=production \
  --name workstation \
  workstation:latest
```

### Kubernetes Deployment

See `kubernetes/` directory for deployment manifests.

## Configuration

### Environment Variables

Required environment variables:

- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Environment (development/production)
- `AGENT_SERVER_WS_PORT` - WebSocket server port (default: 8082)
- `AGENT_SERVER_HTTP_PORT` - HTTP server port (default: 8080)
- `CDP_HOST` - Chrome DevTools Protocol host
- `CDP_PORT` - Chrome DevTools Protocol port (default: 9222)

### MCP Configuration

Edit `mcp-config.yml` to configure:

- Recovery settings
- Peelback options
- Rollback procedures
- CDP connection settings

## Health Checks

### Service Health Endpoints

- JWT Auth: `http://localhost:3000/health`
- Agent Server: `http://localhost:8080/health`

### Verification Script

```bash
# Run health checks on all services
./docker/health-check.sh
```

## Rollback & Recovery

### Quick Rollback

If you need to rollback to a previous version:

```bash
# Stop current deployment
docker-compose -f docker-compose.integrated.yml down

# Pull previous image version
docker pull workstation:previous-version

# Start with previous version
docker-compose -f docker-compose.integrated.yml up -d
```

### Recovery Procedures

1. **Service Failure Recovery**
   - Check service logs: `docker-compose logs <service>`
   - Restart failed service: `docker-compose restart <service>`
   - Full restart: `docker-compose down && docker-compose up -d`

2. **Data Recovery**
   - Volumes are preserved during restarts
   - Backup volumes: `docker run --rm -v workstation-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data`
   - Restore: `docker run --rm -v workstation-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /`

3. **Configuration Recovery**
   - Revert configuration changes
   - Apply from version control
   - Restart services to pick up changes

### Rollback Using MCP Peelback

The integrated platform supports MCP peelback for gradual rollbacks:

```bash
# Initiate peelback to previous snapshot
curl -X POST http://localhost:3000/api/rollback/peelback \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"snapshotId": "snapshot-id"}'
```

## Monitoring

### Log Collection

Logs are stored in:
- Container logs: `docker-compose logs`
- Volume logs: `/var/log/workstation/`

### Metrics

Health check endpoints provide:
- Service uptime
- Memory usage
- Connection status
- Request counts

## Build Documentation

### Overview

The workstation platform uses a multi-stage build process that produces optimized production images with minimal dependencies and attack surface.

### Build Process

#### Standard Build

Build the Docker image from the repository root:

```bash
# Build with default configuration
docker build -t workstation:latest .

# Build with specific tag
docker build -t workstation:1.0.0 .

# Build without cache
docker build --no-cache -t workstation:latest .
```

#### Multi-Stage Build

The Dockerfile uses multi-stage builds for optimization:

1. **Dependencies Stage**: Installs Node.js dependencies
2. **Build Stage**: Compiles TypeScript to JavaScript
3. **Production Stage**: Creates minimal runtime image

```dockerfile
# Example multi-stage structure
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Build Arguments

Customize builds with build arguments:

```bash
# Set Node version
docker build --build-arg NODE_VERSION=18 -t workstation:latest .

# Set build environment
docker build --build-arg BUILD_ENV=production -t workstation:latest .

# Skip tests during build
docker build --build-arg SKIP_TESTS=true -t workstation:latest .
```

### CI/CD Integration

#### GitHub Actions

Automated builds triggered on:
- Push to main branch
- Pull request creation
- Release tags

```yaml
# .github/workflows/build.yml excerpt
- name: Build Docker image
  run: docker build -t workstation:${{ github.sha }} .

- name: Run tests
  run: docker run workstation:${{ github.sha }} npm test

- name: Push to registry
  run: docker push workstation:${{ github.sha }}
```
1. **Port conflicts**: Ensure ports 3000, 8080, 8082 are available
2. **JWT secret not set**: Set `JWT_SECRET` environment variable
3. **CDP connection failed**: Verify Chrome/Chromium is running with remote debugging

#### Build Verification

Verify build integrity:

```bash
# Check image layers
docker history workstation:latest

# Inspect image metadata
docker inspect workstation:latest

# Verify size optimization
docker images workstation:latest

# Run security scan
docker scan workstation:latest
```

### Build Optimization

#### Layer Caching

Optimize build times with layer caching:

```dockerfile
# Copy dependency files first (changes less frequently)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes more frequently)
COPY . .
RUN npm run build
```

#### Size Reduction

Minimize image size:

```bash
# Use alpine base images
FROM node:18-alpine

# Remove dev dependencies
RUN npm prune --production

# Remove unnecessary files
RUN rm -rf /tmp/* /var/cache/apk/*
```

### Build Troubleshooting

#### Common Build Errors

**Error**: `npm ERR! code ELIFECYCLE`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Rebuild with fresh dependencies
docker build --no-cache -t workstation:latest .
```

**Error**: `COPY failed: no source files were specified`

**Solution**:
- Check `.dockerignore` file
- Verify source files exist
- Ensure correct COPY path

**Error**: `The command '/bin/sh -c npm run build' returned a non-zero code`

**Solution**:
```bash
# Run build locally to see detailed errors
npm run build

# Check TypeScript configuration
npx tsc --noEmit

# Verify all dependencies installed
npm install
```

### Production Builds

#### Security Scanning

Scan images before deployment:

```bash
# Trivy scan
trivy image workstation:latest

# Snyk scan
snyk container test workstation:latest

# Docker Scout
docker scout cves workstation:latest
```

#### Image Tagging

Use semantic versioning:

```bash
# Tag with version
docker tag workstation:latest workstation:1.0.0

# Tag with commit SHA
docker tag workstation:latest workstation:${GIT_SHA}

# Tag for registry
docker tag workstation:latest registry.example.com/workstation:1.0.0
```

#### Registry Push

Push to container registry:

```bash
# Docker Hub
docker push username/workstation:latest

# GitHub Container Registry
docker push ghcr.io/username/workstation:latest

# Private registry
docker push registry.example.com/workstation:latest
```

### Local Development Builds

#### Development Image

Build for local development with hot reload:

```bash
# Build development image
docker build --target builder -t workstation:dev .

# Run with volume mount
docker run -v $(pwd):/app workstation:dev
```

#### Build Scripts

Use npm scripts for common tasks:

```bash
# Full build
npm run build

# Watch mode
npm run build:watch

# Production build
npm run build:production
```

### Build Verification Checklist

Before deploying:

- [ ] All tests passing
- [ ] Security scan clean
- [ ] Image size optimized
- [ ] Environment variables documented
- [ ] Health checks configured
- [ ] Logs structured and readable
- [ ] Metrics exposed
- [ ] Documentation updated

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000
# Kill process or use different port
docker run -p 4000:3000 ...
```

#### 2. JWT Auth Fails

**Error**: `jwt malformed` or `invalid signature`

**Solution**:
- Verify `JWT_SECRET` is set and matches
- Regenerate token: `curl http://localhost:3000/auth/demo-token`

#### 3. Agent Server Not Connecting

**Error**: WebSocket connection refused
docker-compose -f docker-compose.integrated.yml up -d
docker-compose -f docker-compose.integrated.yml logs -f
```

## Security Considerations

- Always use strong JWT secrets in production
- Enable TLS/SSL for production deployments
- Regularly update base images for security patches
- Restrict network access to required ports only
- Use secrets management for sensitive configuration

## Maintenance

### Updates

**Solution**:
```bash
# Check agent server is running
docker exec workstation ps aux | grep node

# Check logs
docker logs workstation | grep "Agent Server"

# Verify port is exposed
docker port workstation 8082
```

#### 4. MCP/CDP Connection Failed

**Error**: `Unable to connect to CDP at localhost:9222`

**Solution**:
- Ensure Chrome is running with `--remote-debugging-port=9222`
- Check firewall allows port 9222
- If using Docker, verify `CDP_HOST=host.docker.internal`

#### 5. Container Exits Immediately

**Solution**:
```bash
# Check logs for error
docker logs workstation

# Common causes:
# - Missing JWT_SECRET in production
# - Permission issues
# - Port conflicts
```

### Debug Mode

Enable debug logging:

```bash
docker run -d \
  -e LOG_LEVEL=debug \
  -e NODE_ENV=development \
  workstation:latest
```

### Support

- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Discussions**: https://github.com/creditXcredit/workstation/discussions
- **Documentation**: https://github.com/creditXcredit/workstation/blob/main/README.md
# Pull latest changes
git pull

# Rebuild images
docker-compose -f docker-compose.integrated.yml build --no-cache

# Deploy updated services
docker-compose -f docker-compose.integrated.yml up -d
```

### Backup Schedule

Recommended backup schedule:
- Daily: Configuration and data volumes
- Weekly: Full system snapshot
- Monthly: Disaster recovery test

## Support

- [API Documentation](./API.md)
- [Architecture Details](./ARCHITECTURE.md)
- [Security Best Practices](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Rollback Procedures](./ROLLBACK_PROCEDURES.md)
- [MCP Containerization Guide](./MCP_CONTAINERIZATION_GUIDE.md)
For issues and questions:
- Check logs first
- Review troubleshooting section
- Consult MCP configuration guide
- Check GitHub issues

## Related Documentation

- [Quickstart Guide](QUICKSTART_INTEGRATED.md)
- [MCP Configuration](mcp-config.yml)
- [API Documentation](docs/API.md)
- [Rollback Guide](ROLLBACK_GUIDE.md)
