"""
Task management API endpoints.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from ..agents import Task, TaskPriority
from ..orchestration import orchestrator, task_queue

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    """Task creation request."""
    type: str = Field(..., description="Task type (navigate, plan, execute, etc.)")
    description: str = Field(..., description="Task description")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Task input data")


class TaskResponse(BaseModel):
    """Task response model."""
    id: str
    type: str
    description: str
    status: str
    priority: str
    assigned_agent_id: Optional[str] = None
    output_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


@router.post("", response_model=Dict[str, str])
async def create_task(task_data: TaskCreate):
    """
    Create and submit a new task.
    
    Returns the task ID.
    """
    try:
        task = Task(
            type=task_data.type,
            description=task_data.description,
            priority=task_data.priority,
            input_data=task_data.input_data
        )
        
        task_id = await orchestrator.submit_task(task)
        
        return {
            "task_id": task_id,
            "status": "submitted"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """
    Get task details by ID.
    """
    task_status = await orchestrator.get_task_status(task_id)
    
    if not task_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task_status


@router.delete("/{task_id}")
async def cancel_task(task_id: str):
    """
    Cancel a task.
    """
    result = await orchestrator.cancel_task(task_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task_id,
        "status": "cancelled"
    }


@router.get("", response_model=Dict[str, Any])
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=500, description="Maximum tasks to return")
):
    """
    List tasks with optional filtering.
    """
    try:
        if status == "active":
            tasks = await task_queue.get_active_tasks()
        elif status == "completed":
            tasks = await task_queue.get_completed_tasks(limit=limit)
        else:
            # Get both active and recent completed
            active = await task_queue.get_active_tasks()
            completed = await task_queue.get_completed_tasks(limit=max(0, limit - len(active)))
            tasks = active + completed
        
        # Convert tasks to response format
        task_list = []
        for task in tasks[:limit]:
            task_list.append({
                "id": task.id,
                "type": task.type,
                "description": task.description,
                "status": task.status.value,
                "priority": task.priority.value,
                "created_at": task.created_at.isoformat(),
            })
        
        return {
            "tasks": task_list,
            "count": len(task_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing tasks: {str(e)}")
