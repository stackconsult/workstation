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
- ✅ **Tests**: 146 tests with 65.66% coverage
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

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8080, 8082 are available
2. **JWT secret not set**: Set `JWT_SECRET` environment variable
3. **CDP connection failed**: Verify Chrome/Chromium is running with remote debugging

### Debug Mode

Enable debug logging:

```bash
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

```bash
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
