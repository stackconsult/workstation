"""Prometheus metrics."""
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry

metrics_registry = CollectorRegistry()

# Task metrics
tasks_created = Counter("tasks_created_total", "Total tasks created", registry=metrics_registry)
tasks_completed = Counter("tasks_completed_total", "Total tasks completed", registry=metrics_registry)
tasks_failed = Counter("tasks_failed_total", "Total tasks failed", registry=metrics_registry)

# Workflow metrics
workflows_executed = Counter("workflows_executed_total", "Total workflows executed", registry=metrics_registry)
workflow_duration = Histogram("workflow_duration_seconds", "Workflow execution duration", registry=metrics_registry)

# System metrics
active_tasks = Gauge("active_tasks", "Currently active tasks", registry=metrics_registry)

def track_task(status: str):
    """Track task status."""
    if status == "created":
        tasks_created.inc()
    elif status == "completed":
        tasks_completed.inc()
    elif status == "failed":
        tasks_failed.inc()

def track_workflow(duration: float):
    """Track workflow execution."""
    workflows_executed.inc()
    workflow_duration.observe(duration)
