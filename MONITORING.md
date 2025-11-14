# Monitoring and Observability Guide

## Overview

This guide covers monitoring, logging, metrics, and observability best practices for stackBrowserAgent in production.

## Health Monitoring

### Built-in Health Check

The application includes a `/health` endpoint that provides:

```json
{
  "status": "ok",
  "timestamp": "2025-11-13T10:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 50331648,
    "total": 134217728,
    "percentage": 37.5
  }
}
```

### Uptime Monitoring

**UptimeRobot (Free)**

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/health`
   - Interval: 5 minutes
   - Expected status: 200

**Alternatives:**
- Pingdom
- StatusCake
- Better Uptime
- Healthchecks.io

### Health Check Script

Create a cron job for local health monitoring:

```bash
#!/bin/bash
# health-check.sh

URL="https://your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Health check passed"
    exit 0
else
    echo "❌ Health check failed with status $RESPONSE"
    # Send alert (email, Slack, etc.)
    exit 1
fi
```

Add to crontab:
```bash
*/5 * * * * /path/to/health-check.sh >> /var/log/health-check.log 2>&1
```

## Application Logging

### Current Logging

The application uses Winston for structured logging:

```typescript
logger.info('Request completed', {
  method: req.method,
  path: req.path,
  status: res.statusCode,
  duration: `${duration}ms`,
  ip: req.ip,
});
```

### Log Levels

- `error`: Critical errors requiring immediate attention
- `warn`: Warning conditions
- `info`: Informational messages (requests, startup)
- `debug`: Detailed debug information (not logged by default)

### Log Aggregation

**Option 1: Papertrail (Free tier available)**

```bash
# Install remote_syslog2
wget https://github.com/papertrail/remote_syslog2/releases/download/v0.21/remote_syslog_linux_amd64.tar.gz
tar xzf remote_syslog*.tar.gz
cd remote_syslog

# Configure
cat > log_files.yml <<EOF
files:
  - /var/log/pm2/*.log
destination:
  host: logs.papertrailapp.com
  port: YOUR_PORT
  protocol: tls
EOF

# Run
./remote_syslog -c log_files.yml
```

**Option 2: LogDNA/Mezmo**

```bash
npm install --save @logdna/logger

# Add to your code
import { createLogger } from '@logdna/logger';

const logdna = createLogger(process.env.LOGDNA_KEY, {
  app: 'stackbrowseragent',
  env: process.env.NODE_ENV,
});
```

**Option 3: CloudWatch (AWS)**

```bash
npm install --save winston-cloudwatch

# Configure Winston transport
import WinstonCloudWatch from 'winston-cloudwatch';

logger.add(new WinstonCloudWatch({
  logGroupName: '/stackbrowseragent/production',
  logStreamName: () => new Date().toISOString().split('T')[0],
  awsRegion: 'us-east-1',
}));
```

**Option 4: Logtail (formerly Timber)**

```bash
npm install --save @logtail/node @logtail/winston

# Add Logtail transport
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
logger.add(new LogtailTransport(logtail));
```

### Log Rotation (for VPS deployments)

```bash
# /etc/logrotate.d/stackbrowseragent
/var/log/stackbrowseragent/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Performance Monitoring (APM)

### Sentry (Recommended)

**Setup:**

```bash
npm install --save @sentry/node @sentry/tracing
```

Add to `src/index.ts`:

```typescript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

// Initialize Sentry before anything else
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
});

// Request handler must be first
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Error handler must be last
app.use(Sentry.Handlers.errorHandler());
```

### New Relic

```bash
npm install --save newrelic
```

Create `newrelic.js`:

```javascript
exports.config = {
  app_name: ['stackBrowserAgent'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  }
};
```

Import at top of `src/index.ts`:

```typescript
import 'newrelic';
```

### DataDog

```bash
npm install --save dd-trace
```

Create `dd-trace.js`:

```javascript
const tracer = require('dd-trace').init({
  service: 'stackbrowseragent',
  env: process.env.NODE_ENV,
  version: '1.0.0',
});

module.exports = tracer;
```

## Metrics Collection

### Custom Metrics Endpoint

Add to `src/index.ts`:

```typescript
app.get('/metrics', (req: Request, res: Response) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    eventLoop: {
      delay: /* measure event loop lag */
    },
    requests: {
      total: /* counter */,
      failed: /* counter */,
    },
    authentication: {
      successful: /* counter */,
      failed: /* counter */,
    },
  };
  
  res.json(metrics);
});
```

### Prometheus Integration

```bash
npm install --save prom-client
```

```typescript
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Error Tracking

### Error Rate Monitoring

Track error rates in your logs:

```typescript
let errorCount = 0;
let requestCount = 0;

app.use((req, res, next) => {
  requestCount++;
  const oldSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 500) {
      errorCount++;
    }
    return oldSend.apply(res, arguments);
  };
  next();
});

// Expose metrics
app.get('/metrics/errors', (req, res) => {
  res.json({
    errorCount,
    requestCount,
    errorRate: (errorCount / requestCount * 100).toFixed(2) + '%',
  });
});
```

### Critical Error Alerts

**Email Alerts:**

```bash
npm install --save nodemailer
```

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_PASSWORD,
  },
});

function sendAlert(error: Error) {
  transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to: 'admin@example.com',
    subject: '🚨 Critical Error in stackBrowserAgent',
    text: `Error: ${error.message}\n\nStack: ${error.stack}`,
  });
}
```

**Slack Alerts:**

```bash
npm install --save @slack/webhook
```

```typescript
import { IncomingWebhook } from '@slack/webhook';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

async function sendSlackAlert(error: Error) {
  await webhook.send({
    text: `🚨 Critical Error`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:* ${error.message}\n*Environment:* ${process.env.NODE_ENV}`,
        },
      },
    ],
  });
}
```

## Security Monitoring

### Failed Authentication Tracking

```typescript
let failedAuthAttempts = new Map<string, number>();

app.use((req, res, next) => {
  if (req.path.startsWith('/auth') && res.statusCode === 401) {
    const ip = req.ip;
    failedAuthAttempts.set(ip, (failedAuthAttempts.get(ip) || 0) + 1);
    
    if (failedAuthAttempts.get(ip)! > 10) {
      logger.warn('Suspicious activity detected', { ip, attempts: failedAuthAttempts.get(ip) });
      // Send alert
    }
  }
  next();
});
```

### Rate Limit Monitoring

```typescript
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent'),
      });
    }
  });
  next();
});
```

## Dashboard Options

### Grafana + Prometheus

1. **Setup Prometheus** to scrape metrics
2. **Setup Grafana** for visualization
3. **Import dashboards** for Node.js applications

### Cloud Provider Dashboards

**Railway:**
- Built-in metrics (CPU, Memory, Network)
- Application logs
- Deployment history

**AWS CloudWatch:**
- Custom dashboards
- Alarms for metrics
- Log insights

**Heroku:**
- Heroku metrics (add-on)
- Application logs
- Resource usage

## Alerting Rules

### CPU Usage

```yaml
# Alert if CPU > 80% for 5 minutes
- alert: HighCPUUsage
  expr: cpu_usage > 80
  for: 5m
  annotations:
    summary: High CPU usage detected
```

### Memory Usage

```yaml
# Alert if memory > 90%
- alert: HighMemoryUsage
  expr: memory_usage_percentage > 90
  for: 5m
  annotations:
    summary: High memory usage detected
```

### Error Rate

```yaml
# Alert if error rate > 5%
- alert: HighErrorRate
  expr: (error_count / request_count) > 0.05
  for: 10m
  annotations:
    summary: High error rate detected
```

### Response Time

```yaml
# Alert if p95 response time > 1s
- alert: SlowResponseTime
  expr: response_time_p95 > 1000
  for: 10m
  annotations:
    summary: Slow response times detected
```

## Monitoring Checklist

### Essential Monitoring

- [ ] Uptime monitoring (external)
- [ ] Error tracking (Sentry or similar)
- [ ] Log aggregation (Papertrail, CloudWatch)
- [ ] Health check alerts
- [ ] Failed authentication tracking

### Advanced Monitoring

- [ ] APM (New Relic, DataDog)
- [ ] Custom metrics (Prometheus)
- [ ] Performance tracking
- [ ] Database monitoring (if applicable)
- [ ] Rate limit monitoring
- [ ] Security event logging

### Alerting

- [ ] Critical error alerts (email/Slack)
- [ ] Uptime alerts
- [ ] Performance degradation alerts
- [ ] Security alerts
- [ ] Resource usage alerts

## Cost Considerations

### Free Tier Options

- Sentry: 5,000 events/month
- Papertrail: 50 MB/month
- UptimeRobot: 50 monitors
- LogDNA: 50 MB/day
- New Relic: 100 GB/month

### Paid Tiers

Start with free tiers and upgrade as needed:
- Sentry: $26/month for 50K events
- Papertrail: $7/month for 1 GB
- DataDog: $15/host/month
- New Relic: $99/month for full platform

## Best Practices

1. **Start Small**: Begin with uptime monitoring and error tracking
2. **Add Gradually**: Add more monitoring as you scale
3. **Set Meaningful Alerts**: Avoid alert fatigue
4. **Regular Reviews**: Review metrics weekly
5. **Document Everything**: Keep runbooks for common issues
6. **Test Alerts**: Ensure alerts actually trigger
7. **Retention Policies**: Define log and metric retention
8. **Privacy**: Never log sensitive data (passwords, tokens, PII)

## Resources

- [The Art of Monitoring](https://artofmonitoring.com/)
- [Site Reliability Engineering](https://sre.google/)
- [Monitoring Distributed Systems](https://landing.google.com/sre/sre-book/chapters/monitoring-distributed-systems/)
- [Node.js Monitoring Best Practices](https://nodejs.org/en/docs/guides/diagnostics/)

---

**Start monitoring today to catch issues before your users do!**
