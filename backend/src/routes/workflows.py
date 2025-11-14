"""
Workflow API routes.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel
from src.workflow import WorkflowEngine, WorkflowExecutor
from src.workflow.templates import WORKFLOW_TEMPLATES
from src.models.database import WorkflowModel
from src.database import AsyncSessionLocal
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

# Global workflow engine and executor
workflow_engine = WorkflowEngine()
workflow_executor = WorkflowExecutor(workflow_engine)

# Register built-in templates
for template_id, template in WORKFLOW_TEMPLATES.items():
    workflow_engine.register_workflow(template_id, template)


class WorkflowDefinition(BaseModel):
    """Workflow definition request model."""
    id: str
    name: str
    description: str
    definition: Dict[str, Any]
    user_id: Optional[int] = None


class WorkflowExecutionRequest(BaseModel):
    """Workflow execution request model."""
    workflow_id: str
    parameters: Dict[str, Any]
    user_id: Optional[int] = None


class WorkflowExecutionResponse(BaseModel):
    """Workflow execution response model."""
    execution_id: Optional[str]
    workflow_id: str
    status: str
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    step_results: Optional[Dict[str, Any]] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


@router.post("/", response_model=WorkflowDefinition)
async def create_workflow(workflow: WorkflowDefinition):
    """
    Create and register a new workflow.
    
    **Parameters:**
    - **id**: Unique workflow identifier
    - **name**: Human-readable workflow name
    - **description**: Workflow description
    - **definition**: Complete workflow definition with steps
    - **user_id**: Optional user ID for ownership
    
    **Returns:** Created workflow with ID
    """
    try:
        # Register workflow in engine
        workflow_engine.register_workflow(workflow.id, workflow.definition)
        
        # Save to database
        async with AsyncSessionLocal() as session:
            db_workflow = WorkflowModel(
                id=workflow.id,
                user_id=workflow.user_id,
                name=workflow.name,
                description=workflow.description,
                definition=workflow.definition,
                is_template=False
            )
            session.add(db_workflow)
            await session.commit()
        
        logger.info(f"Created workflow: {workflow.id}")
        return workflow
        
    except Exception as e:
        logger.error(f"Failed to create workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """
    Get a workflow definition by ID.
    
    **Parameters:**
    - **workflow_id**: Workflow identifier
    
    **Returns:** Workflow definition
    """
    try:
        # Check in-memory first
        definition = workflow_engine.workflows.get(workflow_id)
        
        if not definition:
            # Load from database
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(WorkflowModel).where(WorkflowModel.id == workflow_id)
                )
                workflow = result.scalar_one_or_none()
                
                if workflow:
                    definition = workflow.definition
                else:
                    raise HTTPException(status_code=404, detail="Workflow not found")
        
        return {
            'id': workflow_id,
            'definition': definition
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_workflows(user_id: Optional[int] = None, templates_only: bool = False):
    """
    List all available workflows.
    
    **Parameters:**
    - **user_id**: Filter by user ID (optional)
    - **templates_only**: Only return built-in templates
    
    **Returns:** List of workflows
    """
    try:
        workflows = []
        
        # Add in-memory workflows (templates)
        if templates_only or not user_id:
            for workflow_id, definition in workflow_engine.workflows.items():
                workflows.append({
                    'id': workflow_id,
                    'name': definition.get('name', workflow_id),
                    'description': definition.get('description', ''),
                    'is_template': True
                })
        
        # Add from database
        if not templates_only:
            async with AsyncSessionLocal() as session:
                query = select(WorkflowModel)
                if user_id:
                    query = query.where(WorkflowModel.user_id == user_id)
                
                result = await session.execute(query)
                db_workflows = result.scalars().all()
                
                for workflow in db_workflows:
                    workflows.append({
                        'id': workflow.id,
                        'name': workflow.name,
                        'description': workflow.description,
                        'is_template': workflow.is_template,
                        'user_id': workflow.user_id
                    })
        
        return {'workflows': workflows, 'count': len(workflows)}
        
    except Exception as e:
        logger.error(f"Failed to list workflows: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(request: WorkflowExecutionRequest):
    """
    Execute a workflow with the given parameters.
    
    **Parameters:**
    - **workflow_id**: ID of the workflow to execute
    - **parameters**: Input parameters/context for the workflow
    - **user_id**: Optional user ID for tracking
    
    **Returns:** Execution results with status and output
    
    **Example:**
    ```json
    {
        "workflow_id": "price-comparison",
        "parameters": {
            "site1Url": "https://amazon.com/product",
            "site2Url": "https://bestbuy.com/product",
            "priceSelector": ".price"
        }
    }
    ```
    """
    try:
        result = await workflow_executor.execute(
            workflow_id=request.workflow_id,
            parameters=request.parameters,
            user_id=request.user_id
        )
        
        return WorkflowExecutionResponse(**result)
        
    except Exception as e:
        logger.error(f"Failed to execute workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/executions/{execution_id}")
async def get_execution_status(execution_id: str):
    """
    Get the status of a workflow execution.
    
    **Parameters:**
    - **execution_id**: Execution identifier
    
    **Returns:** Current execution status and progress
    """
    try:
        status = await workflow_executor.get_execution_status(execution_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """
    Delete a workflow.
    
    **Parameters:**
    - **workflow_id**: Workflow identifier
    
    **Returns:** Success message
    """
    try:
        # Remove from database
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(WorkflowModel).where(WorkflowModel.id == workflow_id)
            )
            workflow = result.scalar_one_or_none()
            
            if workflow:
                await session.delete(workflow)
                await session.commit()
            else:
                raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Remove from engine (if not a template)
        if workflow_id in workflow_engine.workflows and workflow_id not in WORKFLOW_TEMPLATES:
            del workflow_engine.workflows[workflow_id]
        
        return {'message': f'Workflow {workflow_id} deleted successfully'}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/list")
async def list_templates():
    """
    List all built-in workflow templates.
    
    **Returns:** List of template workflows with descriptions
    """
    templates = []
    for template_id, template in WORKFLOW_TEMPLATES.items():
        templates.append({
            'id': template_id,
            'name': template.get('name', template_id),
            'description': template.get('description', ''),
            'steps_count': len(template.get('steps', [])),
            'initial_step': template.get('initialStep', '')
        })
    
    return {'templates': templates, 'count': len(templates)}
