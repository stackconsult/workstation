"""
Workflow state management.
"""
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class StepStatus(str, Enum):
    """Step execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class WorkflowStatus(str, Enum):
    """Workflow execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepState(BaseModel):
    """State for a workflow step."""
    id: str
    status: StepStatus = StepStatus.PENDING
    input_data: Dict[str, Any] = {}
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0


class WorkflowState(BaseModel):
    """State for a workflow execution."""
    execution_id: str
    workflow_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    context: Dict[str, Any] = {}
    step_states: Dict[str, StepState] = {}
    current_step_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True
