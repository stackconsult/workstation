// Mock @octokit/rest before any imports that might use it
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      pulls: {
        list: jest.fn().mockResolvedValue({ data: [] }),
        create: jest.fn().mockResolvedValue({ data: { number: 1 } }),
      },
    },
  })),
}));

import request from 'supertest';
import app from '../src/index';
import { generateDemoToken } from '../src/auth/jwt';

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('version');
    });

    it('should have valid memory metrics', async () => {
      const response = await request(app).get('/health');
      
      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('total');
      expect(response.body.memory).toHaveProperty('percentage');
      expect(typeof response.body.memory.used).toBe('number');
      expect(typeof response.body.memory.total).toBe('number');
    });
  });

  describe('GET /auth/demo-token', () => {
    it('should generate a demo token', async () => {
      const response = await request(app).get('/auth/demo-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.token).toBe('string');
    });
  });

  describe('POST /auth/token', () => {
    it('should generate token with valid payload', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({ userId: 'test-user', role: 'admin' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should fail without userId', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({ role: 'admin' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should use default role when not provided', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({ userId: 'test-user' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/auth/token')
        .send({ userId: 'test-user', role: 'invalid-role' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/protected', () => {
    it('should access protected route with valid token', async () => {
      const token = generateDemoToken();
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/protected');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'InvalidFormat');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/agent/status', () => {
    it('should return agent status with valid token', async () => {
      const token = generateDemoToken();
      const response = await request(app)
        .get('/api/agent/status')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get('/api/agent/status');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('path');
    });
  });
});
