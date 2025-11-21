import { generateToken, verifyToken, generateDemoToken, authenticateToken } from '../src/auth/jwt';
import { Request, Response, NextFunction } from 'express';

describe('JWT Authentication', () => {


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

  describe('authenticateToken', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      
      mockRequest = {
        headers: {}
      };
      
      mockResponse = {
        status: statusMock,
        json: jsonMock
      };
      
      mockNext = jest.fn();
    });

    it('should reject request without authorization header', () => {
      authenticateToken(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };
      
      authenticateToken(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      
      authenticateToken(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );
      
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept request with valid token', () => {
      const token = generateToken({ userId: 'test-user', role: 'user' });
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      authenticateToken(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.userId).toBe('test-user');
    });

    it('should attach user payload to request object', () => {
      const payload = { userId: 'admin', role: 'admin', custom: 'value' };
      const token = generateToken(payload);
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      authenticateToken(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );
      
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.userId).toBe('admin');
      expect((mockRequest as any).user.role).toBe('admin');
      expect((mockRequest as any).user.custom).toBe('value');
    });
  });
});
