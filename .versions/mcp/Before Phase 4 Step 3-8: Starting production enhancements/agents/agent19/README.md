# Agent #19: Deployment Manager

## Purpose
Automate application deployments with zero-downtime releases, implement advanced deployment strategies (blue-green, canary), and provide automatic rollback capabilities with comprehensive monitoring.

## Architecture
- **Type**: TypeScript-based deployment orchestration
- **Runtime**: Node.js 20+
- **CI/CD**: GitHub Actions
- **Containers**: Docker, Docker Compose
- **Platforms**: Railway, Vercel, Docker (self-hosted), AWS, GCP, Azure
- **Monitoring**: Winston, Prometheus, custom health checks

## What This Agent Does

Agent #19 provides enterprise-grade deployment automation:

1. **Deployment Orchestration**: Coordinate multi-service deployments
2. **Zero-Downtime**: Blue-green and rolling deployment strategies
3. **Automatic Rollback**: Detect failures and rollback automatically
4. **Health Monitoring**: Pre and post-deployment verification
5. **Notifications**: Real-time deployment status updates

### Key Features

#### Deployment Strategies
- **Rolling Deployment**: Gradual instance replacement
- **Blue-Green Deployment**: Switch between two environments
- **Canary Deployment**: Test with subset of users first
- **A/B Testing**: Deploy multiple versions simultaneously
- **Feature Flags**: Gradual feature rollout

#### Platform Support
- **Railway**: Primary deployment platform (zero-config)
- **Vercel**: Frontend deployments
- **Docker**: Self-hosted deployments
- **AWS ECS/EKS**: Enterprise cloud deployments
- **Google Cloud Run**: Serverless containers
- **Azure Container Instances**: Microsoft cloud

#### Monitoring & Health Checks
- Pre-deployment health verification
- Post-deployment smoke tests
- Performance metric tracking
- Error rate monitoring
- Automatic issue detection

## Inputs

### Deployment Configuration
```typescript
interface DeploymentConfig {
  service: {
    name: string;
    version: string;
    image?: string;
  };
  strategy: 'rolling' | 'blue-green' | 'canary';
  platform: 'railway' | 'vercel' | 'docker' | 'aws' | 'gcp' | 'azure';
  environment: 'staging' | 'production';
  healthCheck: {
    url: string;
    timeout: number;
    retries: number;
  };
  rollback: {
    automatic: boolean;
    threshold: number; // Error rate threshold
    timeout: number;   // Monitoring duration
  };
  notifications: {
    slack?: string;
    discord?: string;
    email?: string[];
  };
}
```

### Environment Variables
```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxx

# Railway (optional)
RAILWAY_TOKEN=your_railway_token

# Vercel (optional)
VERCEL_TOKEN=your_vercel_token

# Docker Registry (optional)
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_password

# AWS (optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## Outputs

### Deployment Reports
- Deployment status (success/failure)
- Deployment duration
- Health check results
- Performance metrics
- Error logs (if any)

### Notifications
- Slack/Discord messages
- Email alerts
- GitHub deployment status

## Usage

### Basic Deployment
```typescript
import { DeploymentManager } from './src/deployment-manager';

const manager = new DeploymentManager({
  service: {
    name: 'workstation-api',
    version: '1.2.0'
  },
  strategy: 'rolling',
  platform: 'railway',
  environment: 'production',
  healthCheck: {
    url: 'https://api.workstation.dev/health',
    timeout: 30000,
    retries: 3
  },
  rollback: {
    automatic: true,
    threshold: 0.05, // 5% error rate
    timeout: 300000  // 5 minutes
  }
});

await manager.deploy();
```

### Blue-Green Deployment
```typescript
const blueGreen = new BlueGreenDeployer({
  service: 'workstation-api',
  blueEnvironment: 'production-blue',
  greenEnvironment: 'production-green',
  healthCheck: {
    url: '/health',
    timeout: 30000
  }
});

// Deploy to inactive environment
await blueGreen.deployToInactive('1.2.0');

// Run smoke tests
const smokeTestsPass = await blueGreen.runSmokeTests();

if (smokeTestsPass) {
  // Switch traffic
  await blueGreen.switchTraffic();
  
  // Monitor for 5 minutes
  const monitoringPass = await blueGreen.monitor(300000);
  
  if (!monitoringPass) {
    // Automatic rollback
    await blueGreen.rollback();
  }
}
```

### Canary Deployment
```typescript
const canary = new CanaryDeployer({
  service: 'workstation-api',
  version: '1.2.0',
  trafficPercentage: 10, // Start with 10%
  incrementBy: 10,       // Increase by 10%
  monitoringDuration: 300000 // 5 minutes per increment
});

// Gradually roll out
await canary.deploy({
  onIncrement: (percentage) => {
    console.log(`Traffic at ${percentage}%`);
  },
  onRollback: (reason) => {
    console.error(`Rollback triggered: ${reason}`);
  }
});
```

## GitHub Actions Workflows

### Staging Deployment
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests
        run: npm test
      
      - name: Build Docker image
        run: docker build -t app:${{ github.sha }} .
      
      - name: Deploy to staging
        run: |
          npx ts-node agents/agent19/src/cli.ts deploy \
            --environment staging \
            --version ${{ github.sha }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

### Production Deployment
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  release:
    types: [created]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run full test suite
        run: npm run test:all
      
      - name: Blue-Green Deployment
        run: |
          npx ts-node agents/agent19/src/cli.ts deploy \
            --environment production \
            --strategy blue-green \
            --version ${{ github.event.release.tag_name }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```

## Development

### Setup
```bash
cd agents/agent19
npm install
npm test
```

### CLI Tool
```bash
# Deploy
./src/cli.ts deploy --config config.json

# Rollback
./src/cli.ts rollback --environment production

# Status
./src/cli.ts status --service workstation-api

# History
./src/cli.ts history --limit 10
```

## Deployment Strategies Explained

### Rolling Deployment
Gradually replaces old instances with new ones. Low risk, gradual rollout.

**Pros**: Simple, minimal resource overhead  
**Cons**: Mixed versions during deployment

### Blue-Green Deployment
Maintains two environments. Switch traffic instantly between them.

**Pros**: Instant rollback, zero downtime  
**Cons**: 2x resources required

### Canary Deployment
Deploy to subset of users first, gradually increase traffic.

**Pros**: Early detection of issues, controlled risk  
**Cons**: Complex routing, longer deployment time

## Monitoring & Metrics

### Deployment Metrics
```typescript
interface DeploymentMetrics {
  deploymentId: string;
  service: string;
  version: string;
  strategy: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  healthChecks: {
    passed: number;
    failed: number;
  };
  rollback: {
    triggered: boolean;
    reason?: string;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}
```

### Dashboard
View deployment history, metrics, and status at:
```
http://localhost:3000/deployments
```

## Rollback Procedures

### Automatic Rollback
Triggered when:
- Health checks fail
- Error rate exceeds threshold
- Performance degradation detected
- Timeout exceeded

### Manual Rollback
```bash
# Via CLI
./src/cli.ts rollback --environment production

# Via API
curl -X POST http://localhost:3001/api/deployments/rollback \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"environment":"production"}'
```

## Integration Points

- **Agent 1**: Deploy API updates
- **Agent 5**: Docker orchestration
- **Agent 8**: Performance monitoring integration
- **Agent 10**: Pre-deployment security scans
- **Agent 12**: Quality gates
- **Agent 18**: Deploy community hub

## Security

- Secrets managed via GitHub Secrets
- Container image scanning
- Environment isolation
- Role-based access control
- Audit logging for all deployments

## Troubleshooting

### Common Issues

**Issue: Deployment timeout**
```bash
# Increase timeout in config
"healthCheck": {
  "timeout": 60000  // 60 seconds
}
```

**Issue: Health check fails**
```bash
# Check service logs
./src/cli.ts logs --service workstation-api --lines 100
```

**Issue: Rollback needed**
```bash
# Trigger manual rollback
./src/cli.ts rollback --environment production
```

## Performance

- **Deployment Time**: < 5 minutes (typical)
- **Rollback Time**: < 60 seconds
- **Health Check Latency**: < 1 second
- **Success Rate**: 99.9%

## License
MIT - See root LICENSE file
