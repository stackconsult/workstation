# Production Deployment

## Overview

Deploy your Workstation platform to production using Railway's one-click deployment, Docker containerization, and automated CI/CD pipelines. This guide covers environment configuration, secrets management, zero-downtime deployments, and disaster recovery procedures.

## Quick Deploy to Railway

### Step 1: Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)
- Repository pushed to GitHub

### Step 2: One-Click Deploy

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to GitHub
railway link

# Deploy
railway up
\`\`\`

### Step 3: Configure Environment Variables

\`\`\`bash
# Generate JWT secret
railway variables set JWT_SECRET=\$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")

# Set other variables
railway variables set JWT_EXPIRATION=24h
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=info
railway variables set SLACK_WEBHOOK_URL=your-webhook-url

# View all variables
railway variables
\`\`\`

### Step 4: Get Deployment URL

\`\`\`bash
# Assign domain
railway domain

# Output: https://your-app.railway.app
\`\`\`

## Docker Deployment

### Existing Dockerfile

The repository includes a production-ready Dockerfile:

\`\`\`dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage  
FROM node:18-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
  CMD node -e \"require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\"

CMD [\"node\", \"dist/index.js\"]
\`\`\`

### Build and Run Locally

\`\`\`bash
# Build image
docker build -t workstation:latest .

# Run container
docker run -d \\
  -p 3000:3000 \\
  -e JWT_SECRET=your-secret \\
  -e JWT_EXPIRATION=24h \\
  -e NODE_ENV=production \\
  --name workstation \\
  workstation:latest

# Check logs
docker logs -f workstation

# Check health
curl http://localhost:3000/health
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3.8'
services:
  workstation:
    build: .
    ports:
      - \"3000:3000\"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_EXPIRATION=24h
      - SLACK_WEBHOOK_URL=\${SLACK_WEBHOOK_URL}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:3000/health\"]
      interval: 30s
      timeout: 10s
      retries: 3
\`\`\`

## CI/CD with GitHub Actions

### Existing Workflow

The repository includes \`.github/workflows/ci.yml\`:

\`\`\`yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway link \${{ secrets.RAILWAY_PROJECT_ID }}
          railway up
        env:
          RAILWAY_TOKEN: \${{ secrets.RAILWAY_TOKEN }}
\`\`\`

## Environment Configuration

### Production Environment Variables

\`\`\`bash
# .env.production
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ALERTS=#automation-alerts
SLACK_CHANNEL_ERRORS=#errors

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Timezone
TIMEZONE=America/Denver
\`\`\`

### Secrets Management

**Railway:**
\`\`\`bash
railway variables set JWT_SECRET=\$(openssl rand -hex 32)
railway variables set SLACK_WEBHOOK_URL=your-url --service workstation
\`\`\`

**Docker:**
\`\`\`bash
# Use Docker secrets
echo \"your-jwt-secret\" | docker secret create jwt_secret -
docker service create --secret jwt_secret workstation:latest
\`\`\`

**GitHub Actions:**
Add secrets in repository settings → Secrets → Actions:
- JWT_SECRET
- RAILWAY_TOKEN
- RAILWAY_PROJECT_ID
- SLACK_WEBHOOK_URL

## Zero-Downtime Deployment

### Railway Auto-Deploy

Railway automatically deploys with zero downtime:
1. New version builds
2. Health checks pass
3. Traffic switches to new version
4. Old version terminates

### Docker Blue-Green Deployment

\`\`\`bash
#!/bin/bash
# blue-green-deploy.sh

# Build new version (green)
docker build -t workstation:green .

# Start green container
docker run -d \\
  --name workstation-green \\
  -p 3001:3000 \\
  workstation:green

# Health check green
until curl -f http://localhost:3001/health; do
  sleep 1
done

# Switch traffic (update load balancer/nginx)
# nginx reload or update docker-compose

# Stop blue container
docker stop workstation-blue
docker rm workstation-blue

# Rename green to blue
docker rename workstation-green workstation-blue
\`\`\`

## Monitoring in Production

### Health Check Endpoints

\`\`\`typescript
// Already implemented in src/routes/health.ts
GET /health              // Basic health check
GET /health/detailed     // Detailed system health
GET /health/ready        // Kubernetes readiness
GET /health/live         // Kubernetes liveness
\`\`\`

### Application Metrics

\`\`\`typescript
// Already implemented in src/services/metrics.ts
GET /metrics             // JSON metrics
GET /metrics/prometheus  // Prometheus format
\`\`\`

### Log Aggregation

**Option 1: Railway Logs**
\`\`\`bash
railway logs --follow
\`\`\`

**Option 2: Logtail Integration**
\`\`\`bash
npm install @logtail/node @logtail/winston
railway variables set LOGTAIL_TOKEN=your-token
\`\`\`

**Option 3: CloudWatch/DataDog**
Configure in \`src/utils/logger.ts\`

## Scaling

### Horizontal Scaling (Railway)

\`\`\`bash
# Railway auto-scales based on load
# Configure in railway.json
{
  \"deploy\": {
    \"numReplicas\": 2,
    \"restartPolicyType\": \"ON_FAILURE\"
  }
}
\`\`\`

### Vertical Scaling

\`\`\`json
// railway.json
{
  \"build\": {
    \"builder\": \"NIXPACKS\"
  },
  \"deploy\": {
    \"resources\": {
      \"memory\": 2048,
      \"cpu\": 2
    }
  }
}
\`\`\`

### Load Balancing

For multiple instances, use Railway's built-in load balancing or configure nginx:

\`\`\`nginx
upstream workstation {
  server workstation-1:3000;
  server workstation-2:3000;
  server workstation-3:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://workstation;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
  }
}
\`\`\`

## Disaster Recovery

### Database Backups

\`\`\`typescript
// Automated daily backups (already implemented)
// src/automation/workflows/data-backup.ts
scheduler.registerTask('daily-database-backup', '0 3 * * *', async () => {
  await backupDatabase();
  await uploadToS3();
  await cleanupOldBackups(30);
});
\`\`\`

### Rollback Procedures

**Railway:**
\`\`\`bash
# View deployments
railway status

# Rollback to previous
railway rollback

# Rollback to specific deployment
railway rollback <deployment-id>
\`\`\`

**Docker:**
\`\`\`bash
# Tag deployments
docker tag workstation:latest workstation:v1.2.3
docker push workstation:v1.2.3

# Rollback
docker pull workstation:v1.2.2
docker service update --image workstation:v1.2.2 workstation
\`\`\`

### Incident Response

1. **Detection**: Alerts via Slack, monitoring dashboards
2. **Assessment**: Check logs, metrics, health endpoints
3. **Mitigation**: Rollback, scale up, restart services
4. **Resolution**: Fix root cause, deploy patch
5. **Post-Mortem**: Document incident, improve monitoring

## Security Hardening

### HTTPS/TLS
Railway provides automatic HTTPS. For custom domains:

\`\`\`bash
railway domain add yourdomain.com
# Railway auto-provisions SSL certificate
\`\`\`

### Security Headers
Already implemented via Helmet middleware in \`src/index.ts\`

### Rate Limiting
Already implemented via express-rate-limit in \`src/index.ts\`

### Environment Variables
Never commit secrets:
- Use \`.env\` for local development
- Use Railway/Docker secrets for production
- Rotate secrets regularly

### Dependency Updates

\`\`\`bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Automated updates with Dependabot
# .github/dependabot.yml already configured
\`\`\`

## Performance Optimization

### Caching Strategy

\`\`\`typescript
// Implement Redis caching
import Redis from 'redis';
const redis = Redis.createClient({ url: process.env.REDIS_URL });

// Cache expensive operations
async function getCachedData(key: string): Promise<any> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchExpensiveData();
  await redis.set(key, JSON.stringify(data), { EX: 3600 });
  return data;
}
\`\`\`

### CDN Integration

For static assets, use Railway's CDN or Cloudflare:

\`\`\`typescript
// Serve static files efficiently
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
\`\`\`

### Database Optimization

\`\`\`typescript
// Connection pooling
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: './database.db',
  driver: sqlite3.Database
});

// Prepared statements
const stmt = await db.prepare('SELECT * FROM users WHERE id = ?');
const user = await stmt.get(userId);
\`\`\`

## Testing Before Deployment

### Pre-Deployment Checklist

\`\`\`bash
# Run full test suite
npm run validate

# Check for TypeScript errors
npm run build

# Run integration tests
npm run test:integration

# Check test coverage
npm run test:coverage-check

# Security audit
npm audit

# Lint code
npm run lint
\`\`\`

### Staging Environment

\`\`\`bash
# Deploy to staging first
railway environment set staging
railway up

# Test staging
curl https://staging-workstation.railway.app/health

# Promote to production
railway environment set production
railway up
\`\`\`

## Cost Optimization

### Railway Pricing
- **Starter**: \$5/month (500 hours)
- **Developer**: \$20/month (unlimited)
- **Team**: Custom pricing

### Resource Monitoring

\`\`\`bash
# Monitor usage
railway metrics

# View costs
railway usage

# Optimize resources
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=warn  # Reduce log volume
\`\`\`

### Efficient Container Images

\`\`\`dockerfile
# Multi-stage builds reduce image size
FROM node:18-alpine AS builder
# ... build stage

FROM node:18-alpine
# ... production stage
# Final image: ~150MB vs 1GB+ for full node image
\`\`\`

## Compliance and Auditing

### Audit Logs

\`\`\`typescript
// Log all critical actions
logger.info('User action', {
  userId: user.id,
  action: 'deploy',
  resource: 'workstation',
  timestamp: new Date().toISOString(),
  ip: req.ip
});
\`\`\`

### GDPR Compliance

- Log retention: 90 days
- Data encryption: TLS in transit, at rest
- Data deletion: Implement user data deletion endpoints

### SOC 2 Readiness

- Access controls: JWT authentication
- Monitoring: Winston logs, metrics
- Incident response: Documented procedures
- Change management: Git history, CI/CD

## Troubleshooting

### Common Issues

**Issue: Deployment fails**
\`\`\`bash
# Check build logs
railway logs --deployment

# Verify environment variables
railway variables

# Test locally first
npm run build && npm start
\`\`\`

**Issue: High memory usage**
\`\`\`bash
# Check memory
railway metrics

# Increase memory limit
# railway.json: \"memory\": 2048

# Optimize code (avoid memory leaks)
\`\`\`

**Issue: Slow response times**
\`\`\`bash
# Enable profiling
NODE_ENV=production node --prof dist/index.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt

# Add caching
# Optimize database queries
# Use CDN for static assets
\`\`\`

## Summary

Production deployment checklist:
- ✅ Railway deployment configured
- ✅ Environment variables set
- ✅ Docker container builds successfully
- ✅ CI/CD pipeline passing
- ✅ Health checks responding
- ✅ Monitoring and alerting configured
- ✅ Backup procedures in place
- ✅ Rollback procedures documented
- ✅ Security hardening applied
- ✅ Performance optimized

**Next**: Continue to [test.sh](./test.sh) for automated validation.
