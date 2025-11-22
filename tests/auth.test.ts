/// <reference types="jest" />

import { generateToken, verifyToken, generateDemoToken } from '../src/auth/jwt';
import request from 'supertest';
import app from '../src/index';

describe('JWT Authentication', () => {
  describe('authenticateToken middleware', () => {
    it('should allow access to protected route with valid token', async () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Access granted to protected resource');
      expect(response.body.user).toHaveProperty('userId', 'test-user');
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/protected');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'No token provided' });
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Invalid or expired token' });
    });
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with custom payload', () => {
      const payload = { userId: 'admin-user', role: 'admin' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('admin-user');
      expect(decoded?.role).toBe('admin');
    });

    it('should sanitize userId with special characters', () => {
      const payload = { userId: '<script>alert("xss")</script>test', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('scriptalert("xss")/scripttest');
      expect(decoded?.userId).not.toContain('<');
      expect(decoded?.userId).not.toContain('>');
    });

    it('should handle userId with whitespace', () => {
      const payload = { userId: '  test-user  ', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('test-user');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('test-user');
      expect(decoded?.role).toBe('user');
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not.a.token');
      expect(decoded).toBeNull();
    });

    it('should include standard JWT claims', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
    });
  });

  describe('generateDemoToken', () => {
    it('should generate demo token with default values', () => {
      const token = generateDemoToken();
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('demo-user');
      expect(decoded?.role).toBe('user');
    });

    it('should generate demo token with custom userId', () => {
      const token = generateDemoToken('custom-user');
      const decoded = verifyToken(token);
      
      expect(decoded?.userId).toBe('custom-user');
    });

    it('should generate demo token with custom role', () => {
      const token = generateDemoToken('admin-user', 'admin');
      const decoded = verifyToken(token);
      
      expect(decoded?.userId).toBe('admin-user');
      expect(decoded?.role).toBe('admin');
    });
  });
});
