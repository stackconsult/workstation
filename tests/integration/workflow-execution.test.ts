/**
 * Workflow Execution Integration Tests
 * 
 * Tests end-to-end workflow execution including template loading,
 * execution engine, and state management.
 * 
 * @module tests/integration/workflow-execution.test
 */

import request from 'supertest';
import app from '../../src/index';
import { generateDemoToken } from '../../src/auth/jwt';

describe('Workflow Execution Integration Tests', () => {
  let authToken: string;
  let workflowId: string;
  let executionId: string;

  beforeAll(() => {
    authToken = generateDemoToken();
  });

  describe('Template Loading', () => {
    it('should fetch all workflow templates', async () => {
      const response = await request(app)
        .get('/api/v2/workflows/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('category');
    });

    it('should fetch templates by category', async () => {
      const response = await request(app)
        .get('/api/v2/workflows/templates?category=data-extraction')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((template: any) => {
        expect(template.category).toBe('data-extraction');
      });
    });

    it('should fetch specific template by ID', async () => {
      const response = await request(app)
        .get('/api/v2/workflows/templates/web-scraping-basic')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('web-scraping-basic');
      expect(response.body.data).toHaveProperty('definition');
      expect(response.body.data).toHaveProperty('variables');
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/v2/workflows/templates/non-existent-template')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Template not found');
    });
  });

  describe('Workflow Creation from Template', () => {
    it('should create workflow from template', async () => {
      const response = await request(app)
        .post('/api/v2/workflows/templates/web-scraping-basic/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Web Scraping Workflow',
          variables: {
            targetUrl: 'https://example.com',
            dataSelector: '.content',
          },
          owner_id: 'test-user',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Web Scraping Workflow');

      workflowId = response.body.data.id;
    });

    it('should fail with invalid template ID', async () => {
      const response = await request(app)
        .post('/api/v2/workflows/templates/invalid-template/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workflow',
          owner_id: 'test-user',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow successfully', async () => {
      const response = await request(app)
        .post(`/api/v2/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          variables: {
            targetUrl: 'https://example.com',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('executionId');
      expect(response.body.data.status).toBe('running');
      expect(response.body.data.progress).toBe(0);

      executionId = response.body.data.executionId;
    });

    it('should get execution status', async () => {
      // Wait a bit for execution to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .get(`/api/v2/workflows/executions/${executionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executionId).toBe(executionId);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('progress');
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .post('/api/v2/workflows/non-existent-id/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow not found');
    });

    it('should return 404 for non-existent execution', async () => {
      const response = await request(app)
        .get('/api/v2/workflows/executions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution not found');
    });
  });

  describe('Workflow Management', () => {
    it('should list all workflows', async () => {
      const response = await request(app)
        .get('/api/v2/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should get specific workflow', async () => {
      const response = await request(app)
        .get(`/api/v2/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workflowId);
    });

    it('should update workflow', async () => {
      const response = await request(app)
        .put(`/api/v2/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workflow Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Workflow Name');
    });

    it('should delete workflow', async () => {
      const response = await request(app)
        .delete(`/api/v2/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Workflow deleted');
    });
  });

  describe('Error Handling', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/v2/workflows/templates')
        .expect(401);
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v2/workflows/templates/web-scraping-basic/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});
