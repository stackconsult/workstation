/// <reference types="jest" />
import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from '../src/middleware/errorHandler';
import { logger } from '../src/utils/logger';

// Mock the logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockRequest = {
      path: '/test-path',
      method: 'GET',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };

    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should log error details and return 500 status', () => {
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled error:',
        expect.objectContaining({
          error: 'Test error',
          path: '/test-path',
          method: 'GET',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          path: '/test-path',
          timestamp: expect.any(String),
        })
      );
    });

    it('should include error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Detailed error message',
          code: 'INTERNAL_ERROR',
          path: '/test-path',
          timestamp: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error with stack');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const logCall = (logger.error as jest.Mock).mock.calls[0][1];
      expect(logCall.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should call next() if headers already sent', () => {
      mockResponse.headersSent = true;
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should not expose stack traces in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Production error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const logCall = (logger.error as jest.Mock).mock.calls[0][1];
      expect(logCall.stack).toBeUndefined();

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          path: '/test-path',
          timestamp: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'Plain error object' } as Error;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 status with path', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not found',
          code: 'NOT_FOUND',
          path: '/test-path',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle missing path', () => {
      mockRequest = {
        ...mockRequest,
        path: undefined as any,
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not found',
          code: 'NOT_FOUND',
          path: undefined,
          timestamp: expect.any(String),
        })
      );
    });

    it('should work with different paths', () => {
      mockRequest = {
        ...mockRequest,
        path: '/api/non-existent',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not found',
          code: 'NOT_FOUND',
          path: '/api/non-existent',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('AppError', () => {
    it('should create AppError with custom status code', () => {
      const error = new AppError(400, 'Bad request', 'BAD_REQUEST');
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.isOperational).toBe(true);
    });

    it('should handle AppError in errorHandler with custom status', () => {
      const error = new AppError(403, 'Forbidden access', 'FORBIDDEN');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden access',
          code: 'FORBIDDEN',
          path: '/test-path',
          timestamp: expect.any(String),
        })
      );
    });

    it('should mark non-operational errors correctly', () => {
      const error = new AppError(500, 'Database failure', 'DB_ERROR', false);
      
      expect(error.isOperational).toBe(false);
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Non-operational errors should still be logged
      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled error:',
        expect.objectContaining({
          isOperational: false,
        })
      );
    });
  });
});
