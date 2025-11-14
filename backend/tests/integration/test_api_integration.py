"""Integration tests for API."""
import pytest
from fastapi.testclient import TestClient

@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_task_creation(client):
    """Test creating a task."""
    data = {"type": "navigate", "description": "Test task"}
    response = client.post("/api/tasks", json=data)
    assert response.status_code == 200
    assert "id" in response.json()
