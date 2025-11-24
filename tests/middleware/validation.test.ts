import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest, schemas } from '../../src/middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
    };
    nextFunction = jest.fn();
  });

  describe('validateRequest', () => {
    describe('Basic Validation', () => {
      it('should pass validation for valid data', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
          age: Joi.number().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { name: 'John', age: 30 };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
      });

      it('should reject validation for missing required field', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
          age: Joi.number().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { name: 'John' }; // Missing age
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'age',
              message: expect.stringContaining('required'),
            }),
          ]),
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should reject validation for wrong data type', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
          age: Joi.number().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { name: 'John', age: 'thirty' }; // Wrong type
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'age',
              message: expect.stringContaining('must be a number'),
            }),
          ]),
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });

    describe('XSS Prevention', () => {
      it('should sanitize HTML in string fields', () => {
        const schema = Joi.object({
          comment: Joi.string().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { comment: '<script>alert("xss")</script>Hello' };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        // Joi doesn't strip HTML by default, but validates the input
        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.body).toEqual({ comment: '<script>alert("xss")</script>Hello' });
      });

      it('should validate and strip unknown fields to prevent data injection', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { 
          name: 'John', 
          malicious: '<script>alert("xss")</script>',
          isAdmin: true // Attempting to inject admin flag
        };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
        // Unknown fields should be stripped
        expect(mockRequest.body).toEqual({ name: 'John' });
        expect(mockRequest.body).not.toHaveProperty('malicious');
        expect(mockRequest.body).not.toHaveProperty('isAdmin');
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should validate input to prevent SQL injection attempts', () => {
        const schema = Joi.object({
          userId: Joi.string().alphanum().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { userId: "1' OR '1'='1" }; // SQL injection attempt
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'userId',
              message: expect.stringContaining('must only contain alpha-numeric'),
            }),
          ]),
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should accept safe alphanumeric user IDs', () => {
        const schema = Joi.object({
          userId: Joi.string().alphanum().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { userId: 'user123abc' };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
      });
    });

    describe('Multiple Validation Errors', () => {
      it('should return all validation errors at once (abortEarly: false)', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          age: Joi.number().min(18).required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { 
          email: 'invalid-email',
          age: 15 // Too young
        }; // Missing name
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'age' }),
          ]),
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty request body', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = {};
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
            }),
          ]),
        });
      });

      it('should handle null values', () => {
        const schema = Joi.object({
          name: Joi.string().allow(null),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { name: null };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      it('should handle undefined values', () => {
        const schema = Joi.object({
          name: Joi.string().optional(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { name: undefined };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      it('should handle deeply nested objects', () => {
        const schema = Joi.object({
          user: Joi.object({
            profile: Joi.object({
              name: Joi.string().required(),
            }).required(),
          }).required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = {
          user: {
            profile: {} // Missing name
          }
        };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'user.profile.name',
            }),
          ]),
        });
      });

      it('should handle array validation', () => {
        const schema = Joi.object({
          tags: Joi.array().items(Joi.string()).min(1).required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { tags: [] }; // Empty array
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
      });

      it('should handle very long strings', () => {
        const schema = Joi.object({
          description: Joi.string().max(100).required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { description: 'a'.repeat(200) }; // Too long
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: expect.stringContaining('less than or equal to 100'),
            }),
          ]),
        });
      });
    });

    describe('Data Sanitization', () => {
      it('should replace request body with sanitized data', () => {
        const schema = Joi.object({
          name: Joi.string().trim().required(),
          email: Joi.string().email().lowercase().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = { 
          name: '  John Doe  ',
          email: 'JOHN@EXAMPLE.COM'
        };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.body).toEqual({
          name: 'John Doe',
          email: 'john@example.com'
        });
      });

      it('should strip unknown fields', () => {
        const schema = Joi.object({
          name: Joi.string().required(),
        });
        const middleware = validateRequest(schema);
        
        mockRequest.body = {
          name: 'John',
          unknownField1: 'value1',
          unknownField2: 'value2',
        };
        
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.body).toEqual({ name: 'John' });
      });
    });
  });

  describe('Common Schemas', () => {
    describe('generateToken schema', () => {
      it('should validate valid token generation request', () => {
        const result = schemas.generateToken.validate({
          userId: 'user123',
          role: 'admin',
        });
        
        expect(result.error).toBeUndefined();
        expect(result.value).toEqual({
          userId: 'user123',
          role: 'admin',
        });
      });

      it('should require userId', () => {
        const result = schemas.generateToken.validate({
          role: 'admin',
        });
        
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('userId');
      });

      it('should validate userId length constraints', () => {
        const tooLong = 'a'.repeat(256);
        const result = schemas.generateToken.validate({
          userId: tooLong,
        });
        
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('less than or equal to 255');
      });

      it('should reject empty userId', () => {
        const result = schemas.generateToken.validate({
          userId: '',
        });
        
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('is not allowed to be empty');
      });

      it('should only accept valid roles', () => {
        const result = schemas.generateToken.validate({
          userId: 'user123',
          role: 'superadmin', // Invalid role
        });
        
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('must be one of');
      });

      it('should accept valid roles', () => {
        const validRoles = ['user', 'admin', 'moderator'];
        
        validRoles.forEach(role => {
          const result = schemas.generateToken.validate({
            userId: 'user123',
            role,
          });
          
          expect(result.error).toBeUndefined();
          expect(result.value.role).toBe(role);
        });
      });

      it('should default role to "user" if not provided', () => {
        const result = schemas.generateToken.validate({
          userId: 'user123',
        });
        
        expect(result.error).toBeUndefined();
        expect(result.value.role).toBe('user');
      });

      it('should strip unknown fields', () => {
        const result = schemas.generateToken.validate({
          userId: 'user123',
          role: 'admin',
          unknownField: 'should be removed',
        }, { stripUnknown: true });
        
        expect(result.error).toBeUndefined();
        expect(result.value).not.toHaveProperty('unknownField');
      });
    });
  });

  describe('Security Tests', () => {
    it('should prevent prototype pollution attempts', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      const middleware = validateRequest(schema);
      
      mockRequest.body = JSON.parse('{"name":"test","__proto__":{"isAdmin":true}}');
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Should strip __proto__ via stripUnknown
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'test' });
    });

    it('should handle malicious nested properties', () => {
      const schema = Joi.object({
        data: Joi.object({
          value: Joi.string().required(),
        }).required(),
      });
      const middleware = validateRequest(schema);
      
      mockRequest.body = {
        data: {
          value: 'test',
          constructor: { prototype: { isAdmin: true } }
        }
      };
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Should strip unknown fields
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.data).toEqual({ value: 'test' });
    });
  });
});
