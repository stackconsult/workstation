"""
Advanced workflow engine with DAG execution, conditional branching, and parallel execution.
"""
import asyncio
import uuid
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
from .state import WorkflowState, StepState, WorkflowStatus, StepStatus
from src.models.database import WorkflowModel, WorkflowExecution
from src.database import AsyncSessionLocal
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """
    Advanced workflow engine supporting:
    - DAG (Directed Acyclic Graph) execution
    - Conditional branching
    - Parallel step execution
    - Loop iteration
    - Variable resolution
    - Error handling with fallback steps
    """
    
    def __init__(self):
        self.workflows: Dict[str, Dict[str, Any]] = {}
        self.executions: Dict[str, WorkflowState] = {}
    
    async def load_workflow_from_db(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Load workflow definition from database."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(WorkflowModel).where(WorkflowModel.id == workflow_id)
            )
            workflow = result.scalar_one_or_none()
            
            if workflow:
                return workflow.definition
            return None
    
    def register_workflow(self, workflow_id: str, definition: Dict[str, Any]) -> None:
        """Register a workflow definition."""
        self.workflows[workflow_id] = definition
        logger.info(f"Registered workflow: {workflow_id}")
    
    async def execute_workflow(
        self, 
        workflow_id: str, 
        context: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> WorkflowState:
        """
        Execute a workflow with the given context.
        
        Args:
            workflow_id: ID of the workflow to execute
            context: Initial context/variables for the workflow
            user_id: Optional user ID for tracking
            
        Returns:
            WorkflowState with execution results
        """
        # Load workflow definition
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            workflow = await self.load_workflow_from_db(workflow_id)
        
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        # Create execution state
        execution_id = str(uuid.uuid4())
        state = WorkflowState(
            execution_id=execution_id,
            workflow_id=workflow_id,
            context=context,
            status=WorkflowStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        
        self.executions[execution_id] = state
        
        # Save execution to database
        await self._save_execution_to_db(state, user_id)
        
        try:
            # Build dependency graph
            dag = self._build_dag(workflow)
            
            # Execute workflow steps
            initial_step = workflow.get('initialStep', workflow['steps'][0]['id'])
            await self._execute_dag(state, workflow, dag, initial_step)
            
            state.status = WorkflowStatus.COMPLETED
            state.completed_at = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            state.status = WorkflowStatus.FAILED
            state.error_message = str(e)
            state.completed_at = datetime.utcnow()
        
        # Update database
        await self._update_execution_in_db(state)
        
        return state
    
    def _build_dag(self, workflow: Dict[str, Any]) -> Dict[str, Set[str]]:
        """Build a dependency graph from workflow definition."""
        dag: Dict[str, Set[str]] = {}
        
        for step in workflow['steps']:
            step_id = step['id']
            dag[step_id] = set()
            
            # Add dependencies from nextSteps
            if 'nextSteps' in step and step['nextSteps']:
                for next_step in step['nextSteps']:
                    if next_step not in dag:
                        dag[next_step] = set()
                    dag[next_step].add(step_id)
        
        return dag
    
    async def _execute_dag(
        self,
        state: WorkflowState,
        workflow: Dict[str, Any],
        dag: Dict[str, Set[str]],
        current_step_id: str
    ) -> None:
        """Execute workflow steps following the DAG."""
        visited = set()
        steps_dict = {s['id']: s for s in workflow['steps']}
        
        async def execute_step_and_descendants(step_id: str) -> None:
            if step_id in visited:
                return
            
            visited.add(step_id)
            step = steps_dict.get(step_id)
            
            if not step:
                return
            
            # Wait for dependencies
            dependencies = dag.get(step_id, set())
            if dependencies:
                await asyncio.gather(*[
                    self._wait_for_step_completion(state, dep_id)
                    for dep_id in dependencies
                ])
            
            # Execute current step
            await self._execute_step(state, step)
            
            # Determine next steps based on conditions
            next_steps = await self._get_next_steps(state, step)
            
            # Execute next steps (can be parallel)
            if next_steps:
                if len(next_steps) > 1:
                    # Parallel execution
                    await asyncio.gather(*[
                        execute_step_and_descendants(next_id)
                        for next_id in next_steps
                    ])
                else:
                    # Sequential execution
                    await execute_step_and_descendants(next_steps[0])
        
        await execute_step_and_descendants(current_step_id)
    
    async def _wait_for_step_completion(self, state: WorkflowState, step_id: str) -> None:
        """Wait for a step to complete."""
        max_wait = 300  # 5 minutes
        interval = 0.5
        elapsed = 0
        
        while elapsed < max_wait:
            step_state = state.step_states.get(step_id)
            if step_state and step_state.status in [StepStatus.COMPLETED, StepStatus.FAILED, StepStatus.SKIPPED]:
                return
            
            await asyncio.sleep(interval)
            elapsed += interval
        
        raise TimeoutError(f"Step {step_id} did not complete within {max_wait}s")
    
    async def _execute_step(self, state: WorkflowState, step: Dict[str, Any]) -> None:
        """Execute a single workflow step."""
        step_id = step['id']
        step_type = step['type']
        
        # Initialize step state
        step_state = StepState(
            id=step_id,
            status=StepStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        state.step_states[step_id] = step_state
        state.current_step_id = step_id
        
        try:
            # Resolve variables in step configuration
            config = self._resolve_variables(step.get('config', {}), state.context)
            step_state.input_data = config
            
            # Execute based on step type
            if step_type == 'navigate':
                result = await self._execute_navigate(config, state)
            elif step_type == 'extract':
                result = await self._execute_extract(config, state)
            elif step_type == 'action':
                result = await self._execute_action(config, state)
            elif step_type == 'analyze':
                result = await self._execute_analyze(config, state)
            elif step_type == 'condition':
                result = await self._execute_condition(config, state)
            elif step_type == 'loop':
                result = await self._execute_loop(config, state, step)
            elif step_type == 'custom':
                result = await self._execute_custom(config, state)
            else:
                raise ValueError(f"Unknown step type: {step_type}")
            
            # Update step state
            step_state.output_data = result
            step_state.status = StepStatus.COMPLETED
            step_state.completed_at = datetime.utcnow()
            
            # Update context with step results
            state.context[f"step_{step_id}"] = result
            
        except Exception as e:
            logger.error(f"Step {step_id} failed: {e}")
            step_state.status = StepStatus.FAILED
            step_state.error_message = str(e)
            step_state.completed_at = datetime.utcnow()
            
            # Check for retry
            max_retries = step.get('maxRetries', 0)
            if step_state.retry_count < max_retries:
                step_state.retry_count += 1
                step_state.status = StepStatus.PENDING
                await asyncio.sleep(2 ** step_state.retry_count)  # Exponential backoff
                await self._execute_step(state, step)
            else:
                raise
    
    def _resolve_variables(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve variables in configuration using context."""
        resolved = {}
        
        for key, value in config.items():
            if isinstance(value, str) and value.startswith('$'):
                var_name = value[1:]
                resolved[key] = context.get(var_name, value)
            elif isinstance(value, dict):
                resolved[key] = self._resolve_variables(value, context)
            elif isinstance(value, list):
                resolved[key] = [
                    self._resolve_variables(item, context) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                resolved[key] = value
        
        return resolved
    
    async def _get_next_steps(self, state: WorkflowState, step: Dict[str, Any]) -> List[str]:
        """Determine next steps based on step results and conditions."""
        step_state = state.step_states.get(step['id'])
        
        if not step_state or step_state.status == StepStatus.FAILED:
            # Check for error handler
            if 'onError' in step:
                return [step['onError']]
            return []
        
        # Check for conditional next steps
        if 'nextSteps' in step and step['nextSteps']:
            return step['nextSteps']
        
        if 'onSuccess' in step:
            return [step['onSuccess']]
        
        return []
    
    # Step execution methods
    async def _execute_navigate(self, config: Dict[str, Any], state: WorkflowState) -> Dict[str, Any]:
        """Execute navigation step."""
        url = config.get('url', '')
        return {'url': url, 'success': True}
    
    async def _execute_extract(self, config: Dict[str, Any], state: WorkflowState) -> Dict[str, Any]:
        """Execute data extraction step."""
        selector = config.get('selector', '')
        extract_type = config.get('extractType', 'text')
        return {'selector': selector, 'extractType': extract_type, 'data': []}
    
    async def _execute_action(self, config: Dict[str, Any], state: WorkflowState) -> Dict[str, Any]:
        """Execute action step (click, type, etc.)."""
        action_type = config.get('actionType', '')
        return {'actionType': action_type, 'success': True}
    
    async def _execute_analyze(self, config: Dict[str, Any], state: WorkflowState) -> Dict[str, Any]:
        """Execute analysis step."""
        analysis_type = config.get('analysisType', '')
        data = config.get('data', {})
        return {'analysisType': analysis_type, 'result': data}
    
    async def _execute_condition(self, config: Dict[str, Any], state: WorkflowState) -> Dict[str, Any]:
        """Execute conditional step."""
        condition = config.get('condition', '')
        # Evaluate condition (simplified)
        result = eval(condition, {}, state.context) if condition else True
        return {'condition': condition, 'result': result}
    
    async def _execute_loop(
        self, 
        config: Dict[str, Any], 
        state: WorkflowState, 
        step: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute loop step."""
        items = config.get('items', [])
        results = []
        
        for i, item in enumerate(items):
            loop_context = {**state.context, 'item': item, 'index': i}
            # In a real implementation, execute loop body steps
            results.append(item)
        
        return {'results': results}
    
    async def _execute_custom(self, config: Dict[str, Any], state: WorkflowState) -> Dict[str, Any]:
        """Execute custom step."""
        handler = config.get('handler', '')
        return {'handler': handler, 'success': True}
    
    async def _save_execution_to_db(self, state: WorkflowState, user_id: Optional[int]) -> None:
        """Save workflow execution to database."""
        async with AsyncSessionLocal() as session:
            execution = WorkflowExecution(
                id=state.execution_id,
                workflow_id=state.workflow_id,
                user_id=user_id,
                status=state.status.value,
                context=state.context,
                result=state.result,
                error_message=state.error_message,
                started_at=state.started_at,
                completed_at=state.completed_at
            )
            session.add(execution)
            await session.commit()
    
    async def _update_execution_in_db(self, state: WorkflowState) -> None:
        """Update workflow execution in database."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(WorkflowExecution).where(WorkflowExecution.id == state.execution_id)
            )
            execution = result.scalar_one_or_none()
            
            if execution:
                execution.status = state.status.value
                execution.result = {
                    'step_results': {
                        step_id: {
                            'status': step_state.status.value,
                            'output': step_state.output_data,
                            'error': step_state.error_message
                        }
                        for step_id, step_state in state.step_states.items()
                    }
                }
                execution.error_message = state.error_message
                execution.completed_at = state.completed_at
                await session.commit()
    
    def get_execution_state(self, execution_id: str) -> Optional[WorkflowState]:
        """Get the current state of a workflow execution."""
        return self.executions.get(execution_id)
