# Workstation Monitoring Runbook

## Table of Contents
1. [Overview](#overview)
2. [Setup and Installation](#setup-and-installation)
3. [Dashboard Usage](#dashboard-usage)
4. [Alert Response Procedures](#alert-response-procedures)
5. [Troubleshooting](#troubleshooting)
6. [Metrics Reference](#metrics-reference)
7. [Maintenance](#maintenance)

## Overview

This runbook provides comprehensive guidance for monitoring the Workstation application using Prometheus and Grafana. The monitoring stack tracks application health, performance metrics, and sends alerts for critical issues.

### Architecture

```
┌─────────────────┐
│  Application    │
│  (Node.js)      │──┐
│  /metrics       │  │
└─────────────────┘  │
                     │ Scrape metrics
┌─────────────────┐  │ every 10s
│  Prometheus     │◄─┘
│  (Time Series   │
│   Database)     │
└────────┬────────┘
         │
         │ Evaluate alerts
         │ every 30s
         ▼
┌─────────────────┐
│  Alertmanager   │───► Email/Slack
│  (Optional)     │      Notifications
└─────────────────┘
         │
         │ Query metrics
         ▼
┌─────────────────┐
│   Grafana       │───► Dashboard
│  (Visualization)│      Visualizations
└─────────────────┘
```

### Components

- **Application Metrics Exporter**: `src/services/monitoring.ts` - Exposes metrics at `/metrics`
- **Prometheus**: Scrapes and stores metrics, evaluates alert rules
- **Grafana**: Visualizes metrics through dashboards
- **Alertmanager** (Optional): Routes alerts to notification channels

## Setup and Installation

### Prerequisites

- Docker and Docker Compose (recommended)
- OR: Prometheus v2.40+, Grafana v9.0+
- Application running on port 3000 (default)

### Quick Start with Docker Compose

1. **Start the monitoring stack:**

```bash
cd /home/runner/work/workstation/workstation
docker-compose -f docker-compose.observability.yml up -d
```

This starts:
- Prometheus on http://localhost:9090
- Grafana on http://localhost:3001
- Node Exporter on port 9100 (for system metrics)
- Redis Exporter on port 9121 (if Redis is configured)

2. **Verify Prometheus is scraping metrics:**

```bash
curl http://localhost:9090/api/v1/targets
```

You should see `workstation-app` target with state "UP".

3. **Access Grafana:**

- URL: http://localhost:3001
- Default credentials: admin/admin (change on first login)
- Navigate to Dashboards → Workstation Application Monitoring

### Manual Installation

#### Install Prometheus

1. **Download Prometheus:**

```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64
```

2. **Copy configuration:**

```bash
cp /path/to/workstation/observability/prometheus/prometheus.yml ./
cp /path/to/workstation/observability/prometheus/alerts.yml ./
```

3. **Start Prometheus:**

```bash
./prometheus --config.file=prometheus.yml
```

#### Install Grafana

1. **Download and install:**

```bash
# Ubuntu/Debian
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get install grafana
sudo systemctl start grafana-server
```

2. **Access Grafana** at http://localhost:3000

3. **Add Prometheus data source:**
   - Configuration → Data Sources → Add data source
   - Select Prometheus
   - URL: `http://localhost:9090`
   - Click "Save & Test"

4. **Import dashboard:**
   - Dashboards → Import → Upload JSON file
   - Select `observability/grafana/dashboards/application-monitoring.json`

## Dashboard Usage

### Main Dashboard Panels

#### 1. HTTP Request Rate
- **What it shows**: Requests per second, grouped by method and route
- **Normal**: Steady rate matching expected traffic
- **Warning**: Sudden spikes or drops may indicate issues

#### 2. HTTP Request Duration
- **What it shows**: 95th percentile latency in seconds
- **Normal**: < 500ms for most endpoints
- **Warning**: > 2s sustained indicates performance issues

#### 3. Error Rate
- **What it shows**: 5xx errors per second
- **Normal**: Near zero
- **Critical**: > 5% of total requests

#### 4. Active Connections
- **What it shows**: WebSocket and database connections
- **Normal**: Proportional to active users
- **Warning**: Sudden spikes may indicate connection leaks

#### 5. Workflow Execution Metrics
- **What it shows**: Success/failure rate of workflows
- **Normal**: > 95% success rate
- **Warning**: > 20% failure rate needs investigation

#### 6. Agent Task Duration
- **What it shows**: Time taken by agent tasks
- **Normal**: Most tasks < 60s
- **Warning**: p95 > 300s indicates slow agents

#### 7. Memory Usage
- **What it shows**: Heap usage in MB
- **Normal**: Stable usage with occasional GC spikes
- **Warning**: Continuous growth indicates memory leak

#### 8. CPU Usage
- **What it shows**: CPU load average
- **Normal**: < 70% utilization
- **Warning**: > 90% sustained may cause slowdowns

### Using Grafana Features

**Time Range Selection:**
- Click time picker (top right)
- Common ranges: Last 15m, Last 1h, Last 24h
- Use for incident investigation

**Dashboard Refresh:**
- Auto-refresh: Set to 10s for real-time monitoring
- Manual refresh: Click refresh icon

**Panel Exploration:**
- Click panel title → View
- See raw metric data
- Export to CSV

**Annotations:**
- Add markers for deployments/incidents
- Dashboard settings → Annotations

## Alert Response Procedures

### High Error Rate

**Alert**: `HighErrorRate`  
**Severity**: Critical  
**Threshold**: > 5% of requests returning 5xx errors for 5 minutes

**Immediate Actions:**
1. Check application logs for error stack traces:
   ```bash
   docker logs workstation-app --tail 100 | grep ERROR
   ```
2. Verify database connectivity:
   ```bash
   curl http://localhost:3000/health
   ```
3. Check recent deployments - rollback if necessary

**Investigation:**
- Review error distribution by endpoint in Grafana
- Check `/metrics` endpoint for `http_requests_total` breakdown
- Examine database query performance

**Resolution:**
- Fix code bugs and deploy hotfix
- Scale resources if capacity issue
- Update error handling if external dependency

**Prevention:**
- Add unit tests for failing code paths
- Implement circuit breakers for external calls
- Monitor error rates in staging before production

---

### High Latency

**Alert**: `HighLatency`  
**Severity**: Warning  
**Threshold**: p95 latency > 2s for 10 minutes

**Immediate Actions:**
1. Identify slow endpoints:
   ```bash
   curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'
   ```
2. Check database query performance:
   ```bash
   # SQLite query profiling
   echo ".timer on" | sqlite3 src/automation/db/workstation.db "EXPLAIN QUERY PLAN SELECT * FROM workflows;"
   ```
3. Monitor system resources (CPU, memory, disk I/O)

**Investigation:**
- Review agent task duration metrics
- Check for N+1 query patterns
- Analyze workflow complexity

**Resolution:**
- Add database indexes for slow queries
- Optimize agent algorithms
- Enable caching for repeated queries
- Scale horizontally if load issue

**Prevention:**
- Set SLOs for endpoint latency
- Load test before major releases
- Profile code regularly

---

### Low Disk Space

**Alert**: `LowDiskSpace`  
**Severity**: Warning  
**Threshold**: < 10% disk space available for 5 minutes

**Immediate Actions:**
1. Check disk usage:
   ```bash
   df -h
   du -sh /home/runner/work/workstation/workstation/* | sort -h
   ```
2. Identify large files:
   ```bash
   find . -type f -size +100M -exec ls -lh {} \;
   ```
3. Clean up if safe:
   ```bash
   # Remove old logs
   find logs/ -name "*.log" -mtime +30 -delete
   # Clean Docker images
   docker system prune -a --volumes
   ```

**Investigation:**
- Check log rotation configuration
- Review database growth rate
- Examine backup retention policy

**Resolution:**
- Increase disk space allocation
- Configure log rotation
- Archive old data
- Enable compression for backups

**Prevention:**
- Monitor disk growth trends
- Set up automated cleanup jobs
- Implement log rotation (Winston already configured)

---

### High Memory Usage

**Alert**: `HighMemoryUsage`  
**Severity**: Warning  
**Threshold**: > 90% memory usage for 5 minutes

**Immediate Actions:**
1. Check memory usage:
   ```bash
   curl http://localhost:3000/health | jq '.metrics.memory'
   ```
2. Review heap snapshot:
   ```bash
   curl http://localhost:3000/metrics | grep process_heap
   ```
3. Restart application if necessary (temporary fix):
   ```bash
   docker-compose restart workstation-app
   ```

**Investigation:**
- Look for memory leaks using heap profiling
- Check for unreleased database connections
- Review large object allocations
- Analyze WebSocket connection cleanup

**Resolution:**
- Fix memory leaks in code
- Implement connection pooling
- Add object lifecycle management
- Increase memory allocation if legitimate growth

**Prevention:**
- Run memory profiling in CI/CD
- Use `--inspect` flag for heap dumps
- Monitor memory trends over time
- Set up automated restarts as fallback

---

### Application Down

**Alert**: `ApplicationDown`  
**Severity**: Critical  
**Threshold**: Application unreachable for 2 minutes

**Immediate Actions:**
1. Check application status:
   ```bash
   docker ps | grep workstation-app
   curl http://localhost:3000/health
   ```
2. Review application logs:
   ```bash
   docker logs workstation-app --tail 200
   ```
3. Check if Prometheus can reach the application:
   ```bash
   curl http://localhost:3000/metrics
   ```

**Investigation:**
- Verify application is running (check Docker container status)
- Check network connectivity between Prometheus and application
- Review application startup logs for errors
- Examine resource availability (CPU, memory, disk)
- Check database connectivity if application fails to start

**Resolution:**
- Restart application container if crashed
- Fix configuration issues preventing startup
- Address resource constraints
- Restore from backup if corrupted
- Check and fix network issues

**Prevention:**
- Implement application health checks
- Set up automatic restarts for crashed containers
- Monitor resource usage proactively
- Set up automatic backups (already implemented)
- Monitor database file size
- Plan migration to PostgreSQL

---

### High Workflow Failure Rate

**Alert**: `HighWorkflowFailureRate`  
**Severity**: Warning  
**Threshold**: > 20% of workflows failing for 10 minutes

**Immediate Actions:**
1. Check recent workflow executions:
   ```bash
   curl http://localhost:3000/api/automation/workflows/executions?limit=20
   ```
2. Review workflow error logs:
   ```bash
   docker logs workstation-app | grep "workflow.*failed"
   ```
3. Identify failing workflow types

**Investigation:**
- Review agent task errors
- Check external API dependencies
- Verify credential validity
- Examine workflow configuration

**Resolution:**
- Fix agent bugs causing failures
- Update workflow templates
- Refresh expired credentials
- Disable problematic workflows temporarily

**Prevention:**
- Add workflow validation before execution
- Implement retry with exponential backoff
- Monitor external dependency health
- Set up workflow testing in CI/CD

---

### Long Running Agent Task

**Alert**: `LongRunningAgentTask`  
**Severity**: Warning  
**Threshold**: p95 agent task duration > 5 minutes for 15 minutes

**Immediate Actions:**
1. Identify slow agents:
   ```bash
   curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95, rate(agent_task_duration_seconds_bucket[10m])) by (agent_id)'
   ```
2. Check active agent tasks:
   ```bash
   curl http://localhost:3000/api/automation/agents/tasks?status=running
   ```
3. Review agent-specific logs

**Investigation:**
- Analyze agent algorithm complexity
- Check for blocking I/O operations
- Review API rate limiting
- Examine data volume processed

**Resolution:**
- Optimize agent algorithms
- Implement task timeouts
- Add parallel processing
- Break down large tasks

**Prevention:**
- Set agent task SLOs
- Implement progressive timeouts
- Monitor agent performance trends
- Load test agents with realistic data

---

### WebSocket Connection Spike

**Alert**: `WebSocketConnectionSpike`  
**Severity**: Info  
**Threshold**: 3x normal connections for 5 minutes

**Immediate Actions:**
1. Check current connections:
   ```bash
   curl http://localhost:3000/metrics | grep active_websocket_connections
   ```
2. Review connection origins (if available)
3. Monitor system resources

**Investigation:**
- Check for connection leak
- Review recent UI changes
- Analyze user behavior patterns
- Verify connection cleanup logic

**Resolution:**
- Implement connection limits
- Fix connection leak in code
- Add idle connection timeout
- Scale WebSocket servers if legitimate traffic

**Prevention:**
- Test connection lifecycle in integration tests
- Monitor connection duration
- Implement heartbeat/ping-pong
- Add connection pooling limits

---

### Redis Connection Warning

**Alert**: `RedisConnectionWarning`  
**Severity**: Info (non-critical due to fallback)  
**Threshold**: Redis unavailable for 5 minutes

**Immediate Actions:**
1. Check Redis status:
   ```bash
   docker ps | grep redis
   curl http://localhost:3000/health | jq '.checks.redis'
   ```
2. Verify fallback is working:
   ```bash
   # Application should still function with in-memory sessions
   curl http://localhost:3000/health
   ```

**Investigation:**
- Check Redis container logs
- Verify Redis configuration
- Review network connectivity
- Check resource availability

**Resolution:**
- Restart Redis container
- Fix Redis configuration
- Restore Redis data from backup
- Continue using in-memory fallback if temporary

**Prevention:**
- Set up Redis monitoring
- Implement Redis persistence
- Configure Redis backups
- Document fallback behavior

## Troubleshooting

### Common Issues

#### Metrics not appearing in Prometheus

**Symptoms:**
- `/metrics` endpoint returns data, but Prometheus shows no data
- Target shows as "DOWN" in Prometheus

**Solutions:**
1. Check Prometheus target configuration:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```
2. Verify network connectivity:
   ```bash
   # From Prometheus container
   curl http://host.docker.internal:3000/metrics
   ```
3. Check Prometheus logs:
   ```bash
   docker logs prometheus
   ```
4. Verify scrape interval not too long:
   ```yaml
   # In prometheus.yml
   scrape_interval: 10s  # Should be reasonable
   ```

#### Grafana dashboard shows "No data"

**Symptoms:**
- Prometheus has data, but Grafana panels are empty

**Solutions:**
1. Verify Prometheus data source:
   - Configuration → Data Sources → Prometheus
   - Click "Test" button
2. Check time range:
   - Ensure selected time range has data
   - Try "Last 5 minutes" to see recent metrics
3. Inspect panel query:
   - Edit panel → Query inspector
   - Verify PromQL syntax
4. Check metric names:
   ```bash
   curl http://localhost:9090/api/v1/label/__name__/values
   ```

#### Alerts not firing

**Symptoms:**
- Conditions met, but no alerts in Prometheus

**Solutions:**
1. Check alert rules loaded:
   ```bash
   curl http://localhost:9090/api/v1/rules
   ```
2. Verify `alerts.yml` syntax:
   ```bash
   promtool check rules observability/prometheus/alerts.yml
   ```
3. Check alert evaluation:
   - Navigate to Alerts in Prometheus UI
   - Review "Pending" vs "Firing" status
4. Verify `for:` duration hasn't elapsed yet

#### High cardinality metrics

**Symptoms:**
- Prometheus using excessive memory
- Queries timing out

**Solutions:**
1. Identify high cardinality metrics:
   ```bash
   curl http://localhost:9090/api/v1/label/__name__/values | grep -c ""
   ```
2. Limit label values:
   ```typescript
   // In monitoring.ts
   // Instead of dynamic user_id label
   httpRequestTotal.labels(req.method, route, status).inc();
   // Use aggregated labels
   ```
3. Configure Prometheus retention:
   ```yaml
   # In prometheus.yml
   storage:
     tsdb:
       retention.time: 15d  # Reduce if needed
   ```

## Metrics Reference

### HTTP Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status_code | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, route, status_code | Request latency in seconds |
| `http_request_duration_seconds_bucket` | Histogram | method, route, status_code, le | Latency buckets for percentiles |
| `http_request_duration_seconds_sum` | Histogram | method, route, status_code | Total latency sum |
| `http_request_duration_seconds_count` | Histogram | method, route, status_code | Request count |

**Bucket configuration:** [0.1, 0.5, 1, 2, 5, 10] seconds

**Example queries:**
```promql
# Request rate by status code
rate(http_requests_total[5m])

# Error rate percentage
(
  sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
) * 100

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Workflow Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `workflow_executions_total` | Counter | status | Total workflow executions (success/failure) |

**Example queries:**
```promql
# Workflow success rate
(
  sum(rate(workflow_executions_total{status="success"}[10m]))
  /
  sum(rate(workflow_executions_total[10m]))
) * 100

# Workflow failure rate
rate(workflow_executions_total{status="failure"}[10m])
```

### Agent Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `agent_task_duration_seconds` | Histogram | agent_id, task_type | Agent task execution time |
| `agent_task_duration_seconds_bucket` | Histogram | agent_id, task_type, le | Duration buckets |
| `agent_task_duration_seconds_sum` | Histogram | agent_id, task_type | Total duration sum |
| `agent_task_duration_seconds_count` | Histogram | agent_id, task_type | Task count |

**Bucket configuration:** [1, 5, 10, 30, 60, 120, 300] seconds

**Example queries:**
```promql
# p95 duration by agent
histogram_quantile(0.95, rate(agent_task_duration_seconds_bucket[10m])) by (agent_id)

# Average task duration
rate(agent_task_duration_seconds_sum[5m]) / rate(agent_task_duration_seconds_count[5m])

# Slow agents (>60s average)
(
  rate(agent_task_duration_seconds_sum[10m])
  /
  rate(agent_task_duration_seconds_count[10m])
) > 60
```

### Connection Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `active_websocket_connections` | Gauge | - | Current WebSocket connections |
| `database_connections_active` | Gauge | - | Current database connections |

**Example queries:**
```promql
# WebSocket connection trend
active_websocket_connections

# Database connection usage
database_connections_active
```

### System Metrics (from collectDefaultMetrics)

| Metric | Type | Description |
|--------|------|-------------|
| `workstation_process_cpu_user_seconds_total` | Counter | User CPU time |
| `workstation_process_cpu_system_seconds_total` | Counter | System CPU time |
| `workstation_process_resident_memory_bytes` | Gauge | Resident memory |
| `workstation_process_heap_bytes` | Gauge | Heap size |
| `workstation_nodejs_eventloop_lag_seconds` | Gauge | Event loop lag |
| `workstation_nodejs_active_handles_total` | Gauge | Active handles |
| `workstation_nodejs_active_requests_total` | Gauge | Active requests |
| `workstation_nodejs_heap_size_total_bytes` | Gauge | Total heap size |
| `workstation_nodejs_heap_size_used_bytes` | Gauge | Used heap size |
| `workstation_nodejs_external_memory_bytes` | Gauge | External memory |

**Example queries:**
```promql
# CPU usage percentage
rate(workstation_process_cpu_user_seconds_total[5m]) * 100

# Memory usage percentage
(
  workstation_nodejs_heap_size_used_bytes
  /
  workstation_nodejs_heap_size_total_bytes
) * 100

# Event loop lag (should be near 0)
workstation_nodejs_eventloop_lag_seconds
```

## Maintenance

### Regular Tasks

#### Daily
- [ ] Review alert summary in Grafana
- [ ] Check for unusual metric patterns
- [ ] Verify all scrape targets are UP

#### Weekly
- [ ] Review dashboard for trends
- [ ] Check Prometheus storage usage
- [ ] Validate backup procedures

#### Monthly
- [ ] Update Grafana dashboards
- [ ] Review and update alert thresholds
- [ ] Archive old Prometheus data
- [ ] Update this runbook

### Adding New Metrics

To add custom application metrics:

1. **Define metric in `src/services/monitoring.ts`:**
   ```typescript
   export const myCustomCounter = new Counter({
     name: 'my_custom_total',
     help: 'Description of my custom metric',
     labelNames: ['label1', 'label2']
   });
   ```

2. **Increment in application code:**
   ```typescript
   import { myCustomCounter } from './services/monitoring';
   myCustomCounter.labels('value1', 'value2').inc();
   ```

3. **Add to Grafana dashboard:**
   - Edit dashboard → Add Panel
   - Query: `rate(my_custom_total[5m])`
   - Configure visualization

4. **Create alert rule if needed:**
   ```yaml
   # In observability/prometheus/alerts.yml
   - alert: MyCustomAlert
     expr: rate(my_custom_total[5m]) > 10
     for: 5m
     annotations:
       summary: "Custom metric threshold exceeded"
   ```

5. **Update this runbook** with metric documentation

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Node.js prom-client](https://github.com/siimon/prom-client)
- Internal: `src/services/monitoring.ts` - Application metrics implementation
- Internal: `observability/grafana/dashboards/application-monitoring.json` - Dashboard definition

## Support

For issues or questions:
- Check Troubleshooting section above
- Review application logs: `docker logs workstation-app`
- Check Prometheus status: http://localhost:9090/status
- Check Grafana logs: `docker logs grafana`

---

**Last Updated**: 2024-12-01  
**Version**: 1.0  
**Maintainer**: DevOps Team
