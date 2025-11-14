"""
Basic tests for agent system
"""
import pytest
from src.agents.base import Agent, Task, TaskStatus, TaskPriority


class TestAgent:
    """Test agent functionality"""

    @pytest.mark.asyncio
    async def test_task_creation(self):
        """Test creating a task"""
        task = Task(
            type="test",
            description="Test task",
            priority=TaskPriority.MEDIUM
        )

        assert task.type == "test"
        assert task.description == "Test task"
        assert task.status == TaskStatus.IDLE
        assert task.priority == TaskPriority.MEDIUM

    @pytest.mark.asyncio
    async def test_task_status_update(self):
        """Test updating task status"""
        task = Task(
            type="test",
            description="Test task"
        )

        task.status = TaskStatus.RUNNING
        assert task.status == TaskStatus.RUNNING

        task.status = TaskStatus.COMPLETED
        assert task.status == TaskStatus.COMPLETED
