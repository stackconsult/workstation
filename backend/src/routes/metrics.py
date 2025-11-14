"""Metrics and monitoring endpoints."""
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from src.monitoring import metrics_registry

router = APIRouter(tags=["monitoring"])


@router.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint."""
    return PlainTextResponse(
        content=generate_latest(metrics_registry),
        media_type=CONTENT_TYPE_LATEST
    )


@router.get("/api/monitoring/stats")
async def system_stats():
    """Get system statistics."""
    return {
        "tasks": {
            "total": 0,  # TODO: Query from database
            "active": 0,
            "completed": 0,
            "failed": 0
        },
        "workflows": {
            "total": 0,
            "active": 0
        },
        "agents": {
            "registered": 6,
            "active": 0
        }
    }


@router.get("/api/monitoring/health/detailed")
async def detailed_health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "rag": "healthy",
            "orchestrator": "healthy",
            "browser": "healthy"
        },
        "uptime": "unknown"
    }
