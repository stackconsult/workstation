"""
Database models for the application.
"""
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.database import Base


class TaskStatus(str, enum.Enum):
    """Task status enum."""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    """Task priority enum."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class AgentStatus(str, enum.Enum):
    """Agent status enum."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    BUSY = "busy"
    ERROR = "error"


# User Model
class User(Base):
    """User model for authentication and multi-user support."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    api_key = Column(String(255), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = relationship("TaskModel", back_populates="user", cascade="all, delete-orphan")
    workflows = relationship("WorkflowModel", back_populates="user", cascade="all, delete-orphan")
    agents = relationship("AgentModel", back_populates="user", cascade="all, delete-orphan")


# Task Model
class TaskModel(Base):
    """Task model for storing task information."""
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM, index=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    
    # Task data
    input_data = Column(JSON, default={})
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Agent assignment
    assigned_agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    
    # Retry tracking
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    agent = relationship("AgentModel", back_populates="tasks")
    task_logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")


# Agent Model
class AgentModel(Base):
    """Agent model for storing agent information."""
    __tablename__ = "agents"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent_type = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(AgentStatus), default=AgentStatus.ACTIVE, index=True)
    
    # Agent configuration
    capabilities = Column(JSON, default={})
    config = Column(JSON, default={})
    
    # Performance metrics
    tasks_completed = Column(Integer, default=0)
    tasks_failed = Column(Integer, default=0)
    average_execution_time = Column(Integer, nullable=True)  # in seconds
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="agents")
    tasks = relationship("TaskModel", back_populates="agent")


# Workflow Model
class WorkflowModel(Base):
    """Workflow model for storing workflow definitions."""
    __tablename__ = "workflows"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Workflow definition
    steps = Column(JSON, nullable=False)  # Array of workflow steps
    config = Column(JSON, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    is_template = Column(Boolean, default=False)
    
    # Execution stats
    execution_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")


# Workflow Execution Model
class WorkflowExecution(Base):
    """Model for tracking workflow executions."""
    __tablename__ = "workflow_executions"
    
    id = Column(String(36), primary_key=True, index=True)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    
    # Execution data
    input_data = Column(JSON, default={})
    output_data = Column(JSON, nullable=True)
    current_step = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationship
    workflow = relationship("WorkflowModel", back_populates="executions")


# Task Log Model
class TaskLog(Base):
    """Model for storing detailed task logs."""
    __tablename__ = "task_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False)
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    task = relationship("TaskModel", back_populates="task_logs")


# RAG Context Model
class RAGContext(Base):
    """Model for storing RAG context and embeddings."""
    __tablename__ = "rag_contexts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False)  # task, workflow, page, etc.
    
    # Metadata
    metadata = Column(JSON, default={})
    source_url = Column(String(2048), nullable=True)
    
    # Embedding info (vector stored in Pinecone/ChromaDB)
    embedding_id = Column(String(255), unique=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
