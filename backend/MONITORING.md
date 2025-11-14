# Monitoring Guide

## Overview

stackBrowserAgent provides comprehensive monitoring through Prometheus metrics and structured logging.

## Prometheus Metrics

### Metrics Endpoint

Prometheus metrics are exposed at `/metrics`:

```bash
curl http://localhost:8000/metrics
```

### Available Metrics

**Task Metrics**:
- `tasks_created_total` - Total tasks created
- `tasks_completed_total` - Total tasks completed
- `tasks_failed_total` - Total tasks failed
- `active_tasks` - Currently active tasks

**Workflow Metrics**:
- `workflows_executed_total` - Total workflows executed
- `workflow_duration_seconds` - Workflow execution duration histogram

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'stackbrowseragent'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## Structured Logging

Logs are output in JSON format for easy parsing:

```json
{
  "timestamp": "2025-11-09T12:00:00.000Z",
  "level": "INFO",
  "message": "Task created",
  "module": "tasks",
  "function": "create_task",
  "task_id": "uuid-here"
}
```

### Log Levels

- **INFO**: Normal operations
- **WARNING**: Potential issues
- **ERROR**: Error conditions
- **CRITICAL**: System failures

## Health Monitoring

### Basic Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T12:00:00.000Z"
}
```

### Detailed Health Check

```bash
curl http://localhost:8000/api/monitoring/health/detailed
```

Response:
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "rag": "healthy",
    "orchestrator": "healthy",
    "browser": "healthy"
  },
  "uptime": "24h"
}
```

## System Statistics

```bash
curl http://localhost:8000/api/monitoring/stats
```

Response:
```json
{
  "tasks": {
    "total": 1234,
    "active": 5,
    "completed": 1200,
    "failed": 29
  },
  "workflows": {
    "total": 45,
    "active": 2
  },
  "agents": {
    "registered": 6,
    "active": 5
  }
}
```

## Grafana Dashboards

Example Grafana queries:

**Task Success Rate**:
```promql
rate(tasks_completed_total[5m]) / rate(tasks_created_total[5m])
```

**Active Tasks Over Time**:
```promql
active_tasks
```

**Workflow Duration 95th Percentile**:
```promql
histogram_quantile(0.95, workflow_duration_seconds)
```

## Alerting

Example Prometheus alert rules:

```yaml
groups:
  - name: stackbrowseragent
    rules:
      - alert: HighTaskFailureRate
        expr: rate(tasks_failed_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High task failure rate"
          
      - alert: SystemDown
        expr: up{job="stackbrowseragent"} == 0
        for: 1m
        annotations:
          summary: "stackBrowserAgent is down"
```

## Log Aggregation

### Using ELK Stack

Forward logs to Elasticsearch:

```bash
# Install Filebeat
# Configure filebeat.yml to read from application logs
# Send to Elasticsearch

# Query in Kibana
level:ERROR AND module:tasks
```

### Using Loki

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: stackbrowseragent
    static_configs:
      - targets:
          - localhost
        labels:
          job: stackbrowseragent
          __path__: /var/log/stackbrowseragent/*.log
```

## Performance Monitoring

Track key performance indicators:

1. **Task Execution Time**: Monitor `workflow_duration_seconds`
2. **API Response Time**: Add custom metrics for endpoint latency
3. **Database Query Time**: Monitor slow queries
4. **Memory Usage**: Track Python process memory
5. **CPU Usage**: Monitor system CPU utilization

## Environment Variables

```bash
PROMETHEUS_ENABLED=true
LOG_LEVEL=INFO
LOG_FORMAT=json
METRICS_PORT=8000
```
