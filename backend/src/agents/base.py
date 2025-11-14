"""
Base agent class for the orchestration system.
All specialized agents inherit from this base class.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


class AgentStatus(str, Enum):
    """Agent execution status."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentType(str, Enum):
    """Types of agents in the system."""
    NAVIGATOR = "navigator"
    PLANNER = "planner"
    VALIDATOR = "validator"
    EXECUTOR = "executor"
    EXTRACTOR = "extractor"
    ANALYZER = "analyzer"
    CUSTOM = "custom"


class TaskPriority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(BaseModel):
    """Task model for agent execution."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Optional[Dict[str, Any]] = None
    status: AgentStatus = AgentStatus.IDLE
    assigned_agent_id: Optional[str] = None
    error: Optional[str] = None
    retry_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentCapabilities(BaseModel):
    """Agent capabilities definition."""
    can_navigate: bool = False
    can_extract: bool = False
    can_analyze: bool = False
    can_execute: bool = False
    can_validate: bool = False
    supports_llm: bool = False
    max_concurrency: int = 1


class BaseAgent(ABC):
    """
    Base class for all agents in the orchestration system.
    
    Provides common functionality for:
    - Task lifecycle management
    - Status tracking
    - Error handling
    - Retry logic
    """
    
    def __init__(
        self,
        agent_id: Optional[str] = None,
        agent_type: AgentType = AgentType.CUSTOM,
        name: Optional[str] = None,
        description: Optional[str] = None,
        capabilities: Optional[AgentCapabilities] = None
    ):
        self.agent_id = agent_id or str(uuid.uuid4())
        self.agent_type = agent_type
        self.name = name or f"{agent_type.value}_agent"
        self.description = description or f"{agent_type.value} agent"
        self.capabilities = capabilities or AgentCapabilities()
        self.status = AgentStatus.IDLE
        self.current_task: Optional[Task] = None
        self.created_at = datetime.utcnow()
        self.last_active = datetime.utcnow()
        
    @abstractmethod
    async def execute(self, task: Task) -> Dict[str, Any]:
        """
        Execute a task. Must be implemented by subclasses.
        
        Args:
            task: Task to execute
            
        Returns:
            Dictionary containing task results
            
        Raises:
            Exception: If task execution fails
        """
        pass
    
    async def prepare(self, task: Task) -> None:
        """
        Prepare for task execution. Can be overridden by subclasses.
        
        Args:
            task: Task to prepare for
        """
        self.current_task = task
        self.status = AgentStatus.INITIALIZING
        task.status = AgentStatus.INITIALIZING
        task.assigned_agent_id = self.agent_id
        self.last_active = datetime.utcnow()
    
    async def cleanup(self) -> None:
        """
        Cleanup after task execution. Can be overridden by subclasses.
        """
        self.current_task = None
        self.status = AgentStatus.IDLE
        self.last_active = datetime.utcnow()
    
    async def handle_error(self, task: Task, error: Exception) -> None:
        """
        Handle task execution errors.
        
        Args:
            task: Task that failed
            error: Exception that occurred
        """
        task.status = AgentStatus.FAILED
        task.error = str(error)
        task.completed_at = datetime.utcnow()
        self.status = AgentStatus.FAILED
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to dictionary representation."""
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type.value,
            "name": self.name,
            "description": self.description,
            "status": self.status.value,
            "capabilities": self.capabilities.model_dump(),
            "current_task_id": self.current_task.id if self.current_task else None,
            "created_at": self.created_at.isoformat(),
            "last_active": self.last_active.isoformat()
        }


class NavigatorAgent(BaseAgent):
    """Agent specialized in web navigation and element location."""
    
    def __init__(self, agent_id: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentType.NAVIGATOR,
            name="Navigator Agent",
            description="Navigates web pages and locates elements",
            capabilities=AgentCapabilities(
                can_navigate=True,
                supports_llm=True
            )
        )
    
    async def execute(self, task: Task) -> Dict[str, Any]:
        """Execute navigation task."""
        await self.prepare(task)
        task.status = AgentStatus.RUNNING
        task.started_at = datetime.utcnow()
        self.status = AgentStatus.RUNNING
        
        try:
            # Simulated navigation logic
            result = {
                "action": "navigate",
                "url": task.input_data.get("url"),
                "elements_found": task.input_data.get("selector", []),
                "status": "success"
            }
            
            task.output_data = result
            task.status = AgentStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            
            return result
            
        except Exception as e:
            await self.handle_error(task, e)
            raise
        finally:
            await self.cleanup()


class PlannerAgent(BaseAgent):
    """Agent specialized in task planning and decomposition."""
    
    def __init__(self, agent_id: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentType.PLANNER,
            name="Planner Agent",
            description="Plans and decomposes complex tasks",
            capabilities=AgentCapabilities(
                supports_llm=True,
                max_concurrency=5
            )
        )
    
    async def execute(self, task: Task) -> Dict[str, Any]:
        """Execute planning task."""
        await self.prepare(task)
        task.status = AgentStatus.RUNNING
        task.started_at = datetime.utcnow()
        self.status = AgentStatus.RUNNING
        
        try:
            # Simulated planning logic
            result = {
                "action": "plan",
                "steps": [
                    "Step 1: Analyze input",
                    "Step 2: Create plan",
                    "Step 3: Execute plan"
                ],
                "status": "success"
            }
            
            task.output_data = result
            task.status = AgentStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            
            return result
            
        except Exception as e:
            await self.handle_error(task, e)
            raise
        finally:
            await self.cleanup()


class ExecutorAgent(BaseAgent):
    """Agent specialized in executing browser actions."""
    
    def __init__(self, agent_id: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentType.EXECUTOR,
            name="Executor Agent",
            description="Executes browser actions and automation",
            capabilities=AgentCapabilities(
                can_execute=True,
                max_concurrency=10
            )
        )
    
    async def execute(self, task: Task) -> Dict[str, Any]:
        """Execute action task."""
        await self.prepare(task)
        task.status = AgentStatus.RUNNING
        task.started_at = datetime.utcnow()
        self.status = AgentStatus.RUNNING
        
        try:
            # Simulated execution logic
            result = {
                "action": "execute",
                "command": task.input_data.get("command"),
                "status": "success"
            }
            
            task.output_data = result
            task.status = AgentStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            
            return result
            
        except Exception as e:
            await self.handle_error(task, e)
            raise
        finally:
            await self.cleanup()
