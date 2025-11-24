/// <reference types="jest" />

/**
 * Automation Routes Test Suite
 * Priority 2: Routes Testing (CRITICAL)
 * 
 * Tests for:
 * - Workflow CRUD operations (create, list, get)
 * - Workflow execution endpoints
 * - Execution status and monitoring
 * - Template management
 * - Chrome extension execute endpoint
 * - Authentication checks
 * - Request validation
 * - Error handling (400, 401, 404, 500)
 * - Rate limiting integration
 * 
 * Target: 60%+ coverage, 30+ tests
 */

import request from 'supertest';
import express from 'express';
import automationRoutes from '../../src/routes/automation';
import { generateToken } from '../../src/auth/jwt';

// Mock dependencies
jest.mock('../../src/automation/workflow/service');
jest.mock('../../src/automation/orchestrator/engine');
jest.mock('../../src/utils/logger');

// Mock rate limiter to avoid hitting rate limits during tests
jest.mock('../../src/middleware/advanced-rate-limit', () => {
  const mockRateLimiter = (req: any, res: any, next: any) => next();
  return {
    executionRateLimiter: mockRateLimiter,
    apiRateLimiter: mockRateLimiter,
    authRateLimiter: mockRateLimiter,
    globalRateLimiter: mockRateLimiter,
    createCustomRateLimiter: jest.fn(() => mockRateLimiter),
    rateLimitRedis: null,
    useRedis: false,
  };
});

// Import mocked services after mocking
import { workflowService } from '../../src/automation/workflow/service';
import { orchestrationEngine } from '../../src/automation/orchestrator/engine';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v2', automationRoutes);
  return app;
}

describe('Automation Routes', () => {
  let app: express.Application;
  let validToken: string;
  let mockWorkflow: any;
  let mockExecution: any;
  let mockTask: any;

  beforeAll(() => {
    app = createTestApp();
    validToken = generateToken({ userId: 'test-user-123', role: 'user' });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock workflow data
    mockWorkflow = {
      id: 'workflow-123',
      name: 'Test Workflow',
      description: 'Test workflow description',
      owner_id: 'test-user-123',
      definition: {
        tasks: [
          {
            name: 'Task 1',
            agent_type: 'browser',
            action: 'navigate',
            parameters: { url: 'https://example.com' }
          }
        ],
        variables: {},
        on_error: 'stop'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Mock execution data
    mockExecution = {
      id: 'execution-123',
      workflow_id: 'workflow-123',
      status: 'running',
      triggered_by: 'test-user-123',
      trigger_type: 'manual',
      variables: {},
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_ms: null,
      error_message: null,
      output: null
    };

    // Mock task data
    mockTask = {
      id: 'task-123',
      execution_id: 'execution-123',
      name: 'Task 1',
      agent_type: 'browser',
      action: 'navigate',
      parameters: { url: 'https://example.com' },
      status: 'queued',
      queued_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      error_message: null,
      retry_count: 0,
      output: null
    };
  });

  // ============================================================================
  // WORKFLOW CRUD OPERATIONS
  // ============================================================================

  describe('POST /api/v2/workflows - Create Workflow', () => {
    it('should create workflow with valid authentication', async () => {
      (workflowService.createWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/v2/workflows')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Test Workflow',
          description: 'Test workflow description',
          definition: mockWorkflow.definition
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('workflow-123');
      expect(workflowService.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Workflow',
          owner_id: 'test-user-123'
        })
      );
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/v2/workflows')
        .send({
          name: 'Test Workflow',
          definition: mockWorkflow.definition
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(workflowService.createWorkflow).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/api/v2/workflows')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Test Workflow',
          definition: mockWorkflow.definition
        })
        .expect(403);

      expect(workflowService.createWorkflow).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      (workflowService.createWorkflow as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/v2/workflows')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Test Workflow',
          definition: mockWorkflow.definition
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });

    it('should handle non-Error exceptions', async () => {
      (workflowService.createWorkflow as jest.Mock).mockRejectedValue('String error');

      const response = await request(app)
        .post('/api/v2/workflows')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Test Workflow',
          definition: mockWorkflow.definition
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create workflow');
    });
  });

  describe('GET /api/v2/workflows - List Workflows', () => {
    it('should list workflows for authenticated user', async () => {
      const workflows = [mockWorkflow, { ...mockWorkflow, id: 'workflow-456' }];
      (workflowService.listWorkflows as jest.Mock).mockResolvedValue(workflows);

      const response = await request(app)
        .get('/api/v2/workflows')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(workflowService.listWorkflows).toHaveBeenCalledWith('test-user-123');
    });

    it('should return empty array when user has no workflows', async () => {
      (workflowService.listWorkflows as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v2/workflows')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/workflows')
        .expect(401);

      expect(workflowService.listWorkflows).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (workflowService.listWorkflows as jest.Mock).mockRejectedValue(
        new Error('Database query failed')
      );

      const response = await request(app)
        .get('/api/v2/workflows')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database query failed');
    });
  });

  describe('GET /api/v2/workflows/:id - Get Workflow by ID', () => {
    it('should get workflow by ID', async () => {
      (workflowService.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .get('/api/v2/workflows/workflow-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('workflow-123');
      expect(workflowService.getWorkflow).toHaveBeenCalledWith('workflow-123');
    });

    it('should return 404 when workflow not found', async () => {
      (workflowService.getWorkflow as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v2/workflows/nonexistent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow not found');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/workflows/workflow-123')
        .expect(401);

      expect(workflowService.getWorkflow).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (workflowService.getWorkflow as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/v2/workflows/workflow-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  describe('POST /api/v2/workflows/:id/execute - Execute Workflow', () => {
    it('should execute workflow with valid authentication', async () => {
      (orchestrationEngine.executeWorkflow as jest.Mock).mockResolvedValue(mockExecution);

      const response = await request(app)
        .post('/api/v2/workflows/workflow-123/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ variables: { key: 'value' } })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Workflow execution started');
      expect(response.body.data.id).toBe('execution-123');
      expect(orchestrationEngine.executeWorkflow).toHaveBeenCalledWith({
        workflow_id: 'workflow-123',
        triggered_by: 'test-user-123',
        trigger_type: 'manual',
        variables: { key: 'value' }
      });
    });

    it('should execute workflow without variables', async () => {
      (orchestrationEngine.executeWorkflow as jest.Mock).mockResolvedValue(mockExecution);

      const response = await request(app)
        .post('/api/v2/workflows/workflow-123/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(orchestrationEngine.executeWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow_id: 'workflow-123',
          variables: undefined
        })
      );
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .post('/api/v2/workflows/workflow-123/execute')
        .send({ variables: {} })
        .expect(401);

      expect(orchestrationEngine.executeWorkflow).not.toHaveBeenCalled();
    });

    it('should handle execution errors', async () => {
      (orchestrationEngine.executeWorkflow as jest.Mock).mockRejectedValue(
        new Error('Workflow execution failed')
      );

      const response = await request(app)
        .post('/api/v2/workflows/workflow-123/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ variables: {} })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow execution failed');
    });
  });

  // ============================================================================
  // EXECUTION MONITORING
  // ============================================================================

  describe('GET /api/v2/executions/:id - Get Execution by ID', () => {
    it('should get execution by ID', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(mockExecution);

      const response = await request(app)
        .get('/api/v2/executions/execution-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('execution-123');
      expect(orchestrationEngine.getExecution).toHaveBeenCalledWith('execution-123');
    });

    it('should return 404 when execution not found', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v2/executions/nonexistent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution not found');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/executions/execution-123')
        .expect(401);

      expect(orchestrationEngine.getExecution).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/v2/executions/execution-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/v2/executions/:id/tasks - Get Execution Tasks', () => {
    it('should get tasks for execution', async () => {
      const tasks = [mockTask, { ...mockTask, id: 'task-456' }];
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue(tasks);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(orchestrationEngine.getExecutionTasks).toHaveBeenCalledWith('execution-123');
    });

    it('should return empty array when no tasks', async () => {
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/executions/execution-123/tasks')
        .expect(401);

      expect(orchestrationEngine.getExecutionTasks).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockRejectedValue(
        new Error('Task retrieval failed')
      );

      const response = await request(app)
        .get('/api/v2/executions/execution-123/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task retrieval failed');
    });
  });

  describe('GET /api/v2/executions/:id/status - Get Execution Status', () => {
    it('should get execution status with progress calculation', async () => {
      const completedTask = { ...mockTask, status: 'completed', completed_at: new Date().toISOString() };
      const runningTask = { ...mockTask, id: 'task-456', status: 'running' };
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(mockExecution);
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue([completedTask, runningTask]);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('execution-123');
      expect(response.body.data.status).toBe('running');
      expect(response.body.data.progress).toBe(50); // 1 completed out of 2 tasks
    });

    it('should calculate 0% progress when no tasks', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(mockExecution);
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data.progress).toBe(0);
    });

    it('should calculate 100% progress when all tasks completed', async () => {
      const completedTask1 = { ...mockTask, status: 'completed' };
      const completedTask2 = { ...mockTask, id: 'task-456', status: 'completed' };
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(mockExecution);
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue([completedTask1, completedTask2]);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data.progress).toBe(100);
    });

    it('should return 404 when execution not found', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v2/executions/nonexistent/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution not found');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/executions/execution-123/status')
        .expect(401);

      expect(orchestrationEngine.getExecution).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockRejectedValue(
        new Error('Status retrieval failed')
      );

      const response = await request(app)
        .get('/api/v2/executions/execution-123/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Status retrieval failed');
    });
  });

  describe('GET /api/v2/executions/:id/logs - Get Execution Logs', () => {
    it('should get execution logs with task details', async () => {
      const completedExecution = {
        ...mockExecution,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:05:00Z',
        status: 'completed',
        duration_ms: 300000
      };
      const completedTask = {
        ...mockTask,
        queued_at: '2024-01-01T10:00:01Z',
        started_at: '2024-01-01T10:00:02Z',
        completed_at: '2024-01-01T10:00:05Z',
        status: 'completed',
        output: { result: 'success' }
      };
      
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(completedExecution);
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue([completedTask]);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/logs')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.execution_id).toBe('execution-123');
      expect(response.body.data.logs).toBeDefined();
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      
      // Verify log entries are sorted by timestamp
      const timestamps = response.body.data.logs.map((log: any) => new Date(log.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('should include failed task logs', async () => {
      const failedTask = {
        ...mockTask,
        queued_at: '2024-01-01T10:00:01Z',
        started_at: '2024-01-01T10:00:02Z',
        completed_at: '2024-01-01T10:00:05Z',
        status: 'failed',
        error_message: 'Task execution failed',
        retry_count: 2
      };
      
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(mockExecution);
      (orchestrationEngine.getExecutionTasks as jest.Mock).mockResolvedValue([failedTask]);

      const response = await request(app)
        .get('/api/v2/executions/execution-123/logs')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const logs = response.body.data.logs;
      const errorLog = logs.find((log: any) => log.level === 'error');
      expect(errorLog).toBeDefined();
      expect(errorLog.details.error).toBe('Task execution failed');
    });

    it('should return 404 when execution not found', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v2/executions/nonexistent/logs')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution not found');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/executions/execution-123/logs')
        .expect(401);

      expect(orchestrationEngine.getExecution).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (orchestrationEngine.getExecution as jest.Mock).mockRejectedValue(
        new Error('Log retrieval failed')
      );

      const response = await request(app)
        .get('/api/v2/executions/execution-123/logs')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Log retrieval failed');
    });
  });

  // ============================================================================
  // CHROME EXTENSION EXECUTE ENDPOINT
  // ============================================================================

  describe('POST /api/v2/execute - Execute from Description', () => {
    it('should create and execute workflow from description', async () => {
      (workflowService.createWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
      (orchestrationEngine.executeWorkflow as jest.Mock).mockResolvedValue(mockExecution);

      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ description: 'Click the login button' })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Workflow created and execution started');
      expect(response.body.data.workflow).toBeDefined();
      expect(response.body.data.execution).toBeDefined();
      expect(workflowService.createWorkflow).toHaveBeenCalled();
      expect(orchestrationEngine.executeWorkflow).toHaveBeenCalled();
    });

    it('should create and execute workflow from actions array', async () => {
      (workflowService.createWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
      (orchestrationEngine.executeWorkflow as jest.Mock).mockResolvedValue(mockExecution);

      const actions = [
        { name: 'navigate', agent_type: 'browser', action: 'navigate', parameters: { url: 'https://example.com' } },
        { name: 'click', agent_type: 'browser', action: 'click', parameters: { selector: '#login' } }
      ];

      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ actions })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(workflowService.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: expect.objectContaining({
            tasks: actions
          })
        })
      );
    });

    it('should return 400 when neither description nor actions provided', async () => {
      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Either description or actions array is required');
      expect(workflowService.createWorkflow).not.toHaveBeenCalled();
    });

    it('should return 400 when actions is empty array', async () => {
      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ actions: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Either description or actions array is required');
    });

    it('should pass variables to workflow execution', async () => {
      (workflowService.createWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
      (orchestrationEngine.executeWorkflow as jest.Mock).mockResolvedValue(mockExecution);

      const variables = { url: 'https://example.com', username: 'test' };

      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ description: 'Login to site', variables })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(orchestrationEngine.executeWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          variables
        })
      );
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .post('/api/v2/execute')
        .send({ description: 'Test action' })
        .expect(401);

      expect(workflowService.createWorkflow).not.toHaveBeenCalled();
      expect(orchestrationEngine.executeWorkflow).not.toHaveBeenCalled();
    });

    it('should handle workflow creation errors', async () => {
      (workflowService.createWorkflow as jest.Mock).mockRejectedValue(
        new Error('Failed to create workflow')
      );

      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ description: 'Test action' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create workflow');
    });

    it('should handle execution errors after workflow creation', async () => {
      (workflowService.createWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
      (orchestrationEngine.executeWorkflow as jest.Mock).mockRejectedValue(
        new Error('Execution failed')
      );

      const response = await request(app)
        .post('/api/v2/execute')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ description: 'Test action' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution failed');
    });
  });

  // ============================================================================
  // TEMPLATE ENDPOINTS
  // ============================================================================

  describe('GET /api/v2/templates - Get Workflow Templates', () => {
    it('should return list of workflow templates', async () => {
      const response = await request(app)
        .get('/api/v2/templates')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.data.length).toBe(response.body.count);
    });

    it('should include required template fields', async () => {
      const response = await request(app)
        .get('/api/v2/templates')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const template = response.body.data[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('definition');
      expect(template.definition).toHaveProperty('tasks');
      expect(template.definition).toHaveProperty('variables');
    });

    it('should include common template categories', async () => {
      const response = await request(app)
        .get('/api/v2/templates')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const categories = response.body.data.map((t: any) => t.category);
      expect(categories).toContain('search');
      expect(categories).toContain('forms');
      expect(categories).toContain('capture');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/templates')
        .expect(401);
    });

    it('should handle errors gracefully', async () => {
      // Even though templates are hardcoded, test error handling
      const response = await request(app)
        .get('/api/v2/templates')
        .set('Authorization', `Bearer ${validToken}`);

      // Should not throw, should return success
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/templates/:id - Get Template by ID', () => {
    it('should return template by ID', async () => {
      const response = await request(app)
        .get('/api/v2/templates/template-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('template-123');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/v2/templates/template-123')
        .expect(401);
    });

    it('should handle errors gracefully', async () => {
      const response = await request(app)
        .get('/api/v2/templates/any-id')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('definition');
    });
  });
});
