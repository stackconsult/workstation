import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
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
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      });
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

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Detailed error message',
      });

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

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      });

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
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not found',
        path: '/test-path',
      });
    });

    it('should handle missing path', () => {
      mockRequest = {
        ...mockRequest,
        path: undefined as any,
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not found',
        path: undefined,
      });
    });

    it('should work with different paths', () => {
      mockRequest = {
        ...mockRequest,
        path: '/api/non-existent',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not found',
        path: '/api/non-existent',
      });
    });
  });
});
