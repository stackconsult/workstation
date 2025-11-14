"""
Main Orchestrator - Coordinates agents, tasks, and workflow execution.
"""
import asyncio
from typing import Dict, Optional, Any
from ..agents.base import Task, AgentType, AgentStatus, BaseAgent
from ..agents.registry import agent_registry
from .queue import task_queue
from config.settings import settings
import logging

logger = logging.getLogger(__name__)


class Orchestrator:
    """
    Main orchestration engine that:
    - Routes tasks to appropriate agents
    - Manages task lifecycle
    - Handles retries and failures
    - Monitors agent health
    - Provides concurrent task execution
    """
    
    def __init__(self):
        self._running = False
        self._worker_tasks = []
        self._retry_delays = [1, 5, 15, 30, 60]  # Exponential backoff
        
    async def start(self):
        """Start the orchestrator and worker tasks."""
        if self._running:
            logger.warning("Orchestrator already running")
            return
        
        self._running = True
        logger.info("Starting orchestrator")
        
        # Start worker tasks
        num_workers = settings.max_concurrent_agents
        for i in range(num_workers):
            task = asyncio.create_task(self._worker(i))
            self._worker_tasks.append(task)
        
        logger.info(f"Started {num_workers} worker tasks")
    
    async def stop(self):
        """Stop the orchestrator and all workers."""
        if not self._running:
            return
        
        self._running = False
        logger.info("Stopping orchestrator")
        
        # Cancel all worker tasks
        for task in self._worker_tasks:
            task.cancel()
        
        # Wait for all workers to finish
        await asyncio.gather(*self._worker_tasks, return_exceptions=True)
        self._worker_tasks = []
        
        logger.info("Orchestrator stopped")
    
    async def submit_task(self, task: Task) -> str:
        """
        Submit a new task for execution.
        
        Args:
            task: Task to execute
            
        Returns:
            Task ID
        """
        await task_queue.enqueue(task)
        logger.info(f"Task {task.id} submitted: {task.description}")
        return task.id
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current status of a task.
        
        Args:
            task_id: Task ID
            
        Returns:
            Task status dictionary or None if not found
        """
        task = await task_queue.get_task(task_id)
        if not task:
            return None
        
        return {
            "id": task.id,
            "type": task.type,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "assigned_agent_id": task.assigned_agent_id,
            "output_data": task.output_data,
            "error": task.error,
            "retry_count": task.retry_count,
            "created_at": task.created_at.isoformat(),
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        }
    
    async def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a task.
        
        Args:
            task_id: Task ID
            
        Returns:
            True if cancelled, False if not found
        """
        result = await task_queue.cancel_task(task_id)
        if result:
            logger.info(f"Task {task_id} cancelled")
        return result
    
    async def _worker(self, worker_id: int):
        """
        Worker coroutine that processes tasks from the queue.
        
        Args:
            worker_id: Worker identifier
        """
        logger.info(f"Worker {worker_id} started")
        
        while self._running:
            try:
                # Get next task from queue
                task = await task_queue.dequeue()
                
                if not task:
                    # No tasks available or at capacity, wait a bit
                    await asyncio.sleep(0.1)
                    continue
                
                logger.info(f"Worker {worker_id} processing task {task.id}")
                
                # Execute task
                await self._execute_task(task)
                
            except asyncio.CancelledError:
                logger.info(f"Worker {worker_id} cancelled")
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}", exc_info=True)
                await asyncio.sleep(1)
        
        logger.info(f"Worker {worker_id} stopped")
    
    async def _execute_task(self, task: Task):
        """
        Execute a single task.
        
        Args:
            task: Task to execute
        """
        try:
            # Determine agent type needed
            agent_type = self._determine_agent_type(task)
            
            # Get available agent
            agent = await agent_registry.get_available_agent(agent_type)
            
            if not agent:
                # No agent available, put task back in queue
                logger.warning(f"No agent available for task {task.id}, requeueing")
                await task_queue.enqueue(task)
                return
            
            # Execute task with agent
            logger.info(f"Executing task {task.id} with agent {agent.agent_id}")
            
            try:
                result = await asyncio.wait_for(
                    agent.execute(task),
                    timeout=settings.agent_timeout_seconds
                )
                
                # Task completed successfully
                await task_queue.complete_task(task.id)
                logger.info(f"Task {task.id} completed successfully")
                
            except asyncio.TimeoutError:
                logger.error(f"Task {task.id} timed out")
                await self._handle_task_failure(task, "Task execution timeout")
                
            except Exception as e:
                logger.error(f"Task {task.id} failed: {e}", exc_info=True)
                await self._handle_task_failure(task, str(e))
        
        except Exception as e:
            logger.error(f"Error executing task {task.id}: {e}", exc_info=True)
            await task_queue.fail_task(task.id, str(e))
    
    async def _handle_task_failure(self, task: Task, error: str):
        """
        Handle task failure with retry logic.
        
        Args:
            task: Failed task
            error: Error message
        """
        task.retry_count += 1
        
        if task.retry_count <= settings.task_retry_limit:
            # Retry task
            delay = self._retry_delays[min(task.retry_count - 1, len(self._retry_delays) - 1)]
            logger.info(f"Retrying task {task.id} in {delay}s (attempt {task.retry_count})")
            
            await asyncio.sleep(delay)
            task.status = AgentStatus.WAITING
            await task_queue.enqueue(task)
        else:
            # Max retries exceeded
            logger.error(f"Task {task.id} failed after {task.retry_count} attempts")
            await task_queue.fail_task(task.id, error)
    
    def _determine_agent_type(self, task: Task) -> AgentType:
        """
        Determine which agent type should handle the task.
        
        Args:
            task: Task to analyze
            
        Returns:
            Agent type that should handle the task
        """
        task_type_map = {
            "navigate": AgentType.NAVIGATOR,
            "plan": AgentType.PLANNER,
            "validate": AgentType.VALIDATOR,
            "execute": AgentType.EXECUTOR,
            "extract": AgentType.EXTRACTOR,
            "analyze": AgentType.ANALYZER,
        }
        
        return task_type_map.get(task.type, AgentType.EXECUTOR)
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get orchestrator statistics.
        
        Returns:
            Dictionary with statistics
        """
        agent_stats = await agent_registry.get_agent_stats()
        queue_stats = await task_queue.get_queue_stats()
        
        return {
            "running": self._running,
            "workers": len(self._worker_tasks),
            "agents": agent_stats,
            "queue": queue_stats,
        }


# Global orchestrator instance
orchestrator = Orchestrator()
