"""
Task Queue - Manages task queuing, prioritization, and distribution.
"""
import asyncio
from typing import Dict, List, Optional
from collections import deque
from ..agents.base import Task, TaskPriority, AgentStatus
from datetime import datetime


class TaskQueue:
    """
    Priority-based task queue with support for:
    - Priority-based ordering
    - Task lifecycle tracking
    - Concurrent task limits
    - Task cancellation
    """
    
    def __init__(self, max_concurrent_tasks: int = 20):
        self._queues: Dict[TaskPriority, deque] = {
            TaskPriority.URGENT: deque(),
            TaskPriority.HIGH: deque(),
            TaskPriority.MEDIUM: deque(),
            TaskPriority.LOW: deque(),
        }
        self._active_tasks: Dict[str, Task] = {}
        self._completed_tasks: Dict[str, Task] = {}
        self._max_concurrent = max_concurrent_tasks
        self._lock = asyncio.Lock()
        
    async def enqueue(self, task: Task) -> None:
        """
        Add a task to the queue.
        
        Args:
            task: Task to enqueue
        """
        async with self._lock:
            self._queues[task.priority].append(task)
            task.status = AgentStatus.WAITING
    
    async def dequeue(self) -> Optional[Task]:
        """
        Get the next highest-priority task from the queue.
        
        Returns:
            Next task or None if queue is empty or at capacity
        """
        async with self._lock:
            # Check if we're at capacity
            if len(self._active_tasks) >= self._max_concurrent:
                return None
            
            # Try to get task from highest priority queue first
            for priority in [TaskPriority.URGENT, TaskPriority.HIGH, 
                            TaskPriority.MEDIUM, TaskPriority.LOW]:
                if self._queues[priority]:
                    task = self._queues[priority].popleft()
                    self._active_tasks[task.id] = task
                    return task
            
            return None
    
    async def complete_task(self, task_id: str) -> None:
        """
        Mark a task as completed and move it to completed tasks.
        
        Args:
            task_id: ID of completed task
        """
        async with self._lock:
            task = self._active_tasks.pop(task_id, None)
            if task:
                self._completed_tasks[task_id] = task
    
    async def fail_task(self, task_id: str, error: str) -> None:
        """
        Mark a task as failed.
        
        Args:
            task_id: ID of failed task
            error: Error message
        """
        async with self._lock:
            task = self._active_tasks.get(task_id)
            if task:
                task.status = AgentStatus.FAILED
                task.error = error
                task.completed_at = datetime.utcnow()
                self._completed_tasks[task_id] = task
                del self._active_tasks[task_id]
    
    async def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a task (remove from queue or mark active task as cancelled).
        
        Args:
            task_id: ID of task to cancel
            
        Returns:
            True if task was cancelled, False if not found
        """
        async with self._lock:
            # Check active tasks first
            task = self._active_tasks.pop(task_id, None)
            if task:
                task.status = AgentStatus.CANCELLED
                task.completed_at = datetime.utcnow()
                self._completed_tasks[task_id] = task
                return True
            
            # Check queues
            for priority, queue in self._queues.items():
                for i, task in enumerate(queue):
                    if task.id == task_id:
                        task.status = AgentStatus.CANCELLED
                        queue.remove(task)
                        self._completed_tasks[task_id] = task
                        return True
            
            return False
    
    async def get_task(self, task_id: str) -> Optional[Task]:
        """
        Get task by ID from any queue or active/completed tasks.
        
        Args:
            task_id: Task ID
            
        Returns:
            Task or None if not found
        """
        # Check active tasks
        task = self._active_tasks.get(task_id)
        if task:
            return task
        
        # Check completed tasks
        task = self._completed_tasks.get(task_id)
        if task:
            return task
        
        # Check queues
        for queue in self._queues.values():
            for task in queue:
                if task.id == task_id:
                    return task
        
        return None
    
    async def get_queue_stats(self) -> Dict:
        """
        Get statistics about the task queue.
        
        Returns:
            Dictionary with queue statistics
        """
        async with self._lock:
            stats = {
                "active_tasks": len(self._active_tasks),
                "completed_tasks": len(self._completed_tasks),
                "queued_tasks": {
                    "urgent": len(self._queues[TaskPriority.URGENT]),
                    "high": len(self._queues[TaskPriority.HIGH]),
                    "medium": len(self._queues[TaskPriority.MEDIUM]),
                    "low": len(self._queues[TaskPriority.LOW]),
                },
                "total_queued": sum(len(q) for q in self._queues.values()),
                "capacity_used": len(self._active_tasks),
                "capacity_max": self._max_concurrent
            }
            return stats
    
    async def get_active_tasks(self) -> List[Task]:
        """Get all currently active tasks."""
        return list(self._active_tasks.values())
    
    async def get_completed_tasks(self, limit: int = 100) -> List[Task]:
        """
        Get recently completed tasks.
        
        Args:
            limit: Maximum number of tasks to return
            
        Returns:
            List of completed tasks
        """
        tasks = list(self._completed_tasks.values())
        # Sort by completion time, most recent first
        tasks.sort(key=lambda t: t.completed_at or datetime.min, reverse=True)
        return tasks[:limit]


# Global task queue instance
task_queue = TaskQueue()
