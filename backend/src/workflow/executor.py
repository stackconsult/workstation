"""
Workflow executor for integration with task orchestrator.
"""
from typing import Dict, Any, Optional
from .engine import WorkflowEngine
from .state import WorkflowState
import logging

logger = logging.getLogger(__name__)


class WorkflowExecutor:
    """
    Workflow executor that integrates with the task orchestration system.
    Provides high-level API for workflow execution.
    """
    
    def __init__(self, engine: Optional[WorkflowEngine] = None):
        self.engine = engine or WorkflowEngine()
    
    async def execute(
        self,
        workflow_id: str,
        parameters: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow and return results.
        
        Args:
            workflow_id: ID of the workflow to execute
            parameters: Workflow input parameters
            user_id: Optional user ID for tracking
            
        Returns:
            Dictionary with execution results
        """
        try:
            state = await self.engine.execute_workflow(
                workflow_id=workflow_id,
                context=parameters,
                user_id=user_id
            )
            
            return {
                'execution_id': state.execution_id,
                'workflow_id': state.workflow_id,
                'status': state.status.value,
                'result': state.result,
                'error': state.error_message,
                'step_results': {
                    step_id: {
                        'status': step_state.status.value,
                        'output': step_state.output_data,
                        'error': step_state.error_message
                    }
                    for step_id, step_state in state.step_states.items()
                },
                'started_at': state.started_at.isoformat() if state.started_at else None,
                'completed_at': state.completed_at.isoformat() if state.completed_at else None
            }
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            return {
                'execution_id': None,
                'workflow_id': workflow_id,
                'status': 'failed',
                'error': str(e),
                'result': None
            }
    
    async def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a workflow execution."""
        state = self.engine.get_execution_state(execution_id)
        
        if not state:
            return None
        
        return {
            'execution_id': state.execution_id,
            'workflow_id': state.workflow_id,
            'status': state.status.value,
            'current_step': state.current_step_id,
            'progress': {
                'total_steps': len(state.step_states),
                'completed_steps': sum(
                    1 for s in state.step_states.values() 
                    if s.status.value == 'completed'
                ),
                'failed_steps': sum(
                    1 for s in state.step_states.values() 
                    if s.status.value == 'failed'
                )
            }
        }
    
    def register_workflow(self, workflow_id: str, definition: Dict[str, Any]) -> None:
        """Register a workflow definition."""
        self.engine.register_workflow(workflow_id, definition)
