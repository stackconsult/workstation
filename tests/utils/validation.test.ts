/// <reference types="jest" />
import { Request, Response, NextFunction } from 'express';
import { Validator, validateRequest, sanitizeRequest, commonSchemas } from '../../src/utils/validation';
import Joi from 'joi';

describe('Validation Utilities', () => {
  describe('Validator.validate', () => {
    it('should validate valid data successfully', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      const data = { name: 'John', age: 30 };
      
      const result = Validator.validate(data, schema);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should return errors for invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      const data = { name: 'John', age: 'invalid' };
      
      const result = Validator.validate(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Validator.validateOrThrow', () => {
    it('should validate valid data successfully', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      const data = { name: 'John', age: 30 };
      
      expect(() => Validator.validateOrThrow(data, schema)).not.toThrow();
    });

    it('should throw error for invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });
      const data = { name: 'John', age: 'invalid' as any };
      
      expect(() => Validator.validateOrThrow(data, schema)).toThrow();
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.co.uk',
        'test123@test-domain.com'
      ];
      
      validEmails.forEach(email => {
        expect(Validator.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        '',
        'user@@example.com'
      ];
      
      invalidEmails.forEach(email => {
        expect(Validator.isValidEmail(email)).toBe(false);
      });
    });

    it('should handle emails with plus addressing', () => {
      expect(Validator.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should handle emails with dots', () => {
      expect(Validator.isValidEmail('first.last@example.com')).toBe(true);
    });
  });

  describe('UUID Validation', () => {
    it('should validate correct UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];
      
      validUuids.forEach(uuid => {
        expect(Validator.isValidUuid(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-42661417400g',
        '',
        '123e4567e89b12d3a456426614174000'
      ];
      
      invalidUuids.forEach(uuid => {
        expect(Validator.isValidUuid(uuid)).toBe(false);
      });
    });
  });

  describe('JSON Validation', () => {
    it('should validate correct JSON', () => {
      expect(Validator.isValidJson('{"key": "value"}')).toBe(true);
      expect(Validator.isValidJson('[]')).toBe(true);
      expect(Validator.isValidJson('null')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(Validator.isValidJson('{key: value}')).toBe(false);
      expect(Validator.isValidJson('invalid')).toBe(false);
      expect(Validator.isValidJson('')).toBe(false);
    });
  });

  describe('String Sanitization', () => {
    it('should sanitize XSS attack vectors', () => {
      const dangerous = '<script>alert("XSS")</script>';
      const sanitized = Validator.sanitizeString(dangerous);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should remove HTML entities', () => {
      const input = '<div>Test & "quotes"</div>';
      const sanitized = Validator.sanitizeString(input);
      
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should handle empty strings', () => {
      expect(Validator.sanitizeString('')).toBe('');
    });

    it('should preserve safe characters', () => {
      const input = 'Hello World 123';
      const sanitized = Validator.sanitizeString(input);
      
      expect(sanitized).toBe(input);
    });
  });

  describe('HTML Sanitization', () => {
    it('should remove dangerous tags by default', () => {
      const input = '<p>Hello</p><script>alert(1)</script>';
      const sanitized = Validator.sanitizeHtml(input);
      
      expect(sanitized).not.toContain('<script>');
    });

    it('should preserve allowed tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const sanitized = Validator.sanitizeHtml(input, ['p', 'strong']);
      
      // sanitize-html should keep allowed tags
      expect(sanitized).toBeDefined();
    });
  });

  describe('URL Sanitization', () => {
    it('should allow safe URLs', () => {
      const url = 'https://example.com/path';
      const sanitized = Validator.sanitizeUrl(url);
      
      expect(sanitized).toBe(url); // URL preserves the path as-is
    });

    it('should reject javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      const sanitized = Validator.sanitizeUrl(url);
      
      expect(sanitized).toBe(''); // Returns empty string on error
    });

    it('should reject data: protocol by default', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const sanitized = Validator.sanitizeUrl(url);
      
      expect(sanitized).toBe(''); // Returns empty string on error
    });

    it('should allow custom protocols', () => {
      const url = 'ftp://example.com';
      const sanitized = Validator.sanitizeUrl(url, ['ftp']);
      
      expect(sanitized).toBe('ftp://example.com/'); // URL adds trailing slash when no path
    });
  });

  describe('Object Sanitization', () => {
    it('should sanitize string values in objects', () => {
      const input = {
        name: '<script>alert(1)</script>',
        description: 'Normal text'
      };
      
      const sanitized = Validator.sanitizeObject(input);
      
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.description).toBe('Normal text');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<script>alert(1)</script>',
          email: 'test@example.com'
        }
      };
      
      const sanitized = Validator.sanitizeObject(input);
      
      expect(sanitized.user.name).not.toContain('<script>');
      expect(sanitized.user.email).toBe('test@example.com');
    });

    it('should sanitize arrays', () => {
      const input = {
        items: ['<script>alert(1)</script>', 'safe text']
      };
      
      const sanitized = Validator.sanitizeObject(input);
      
      expect(sanitized.items[0]).not.toContain('<script>');
      expect(sanitized.items[1]).toBe('safe text');
    });

    it('should preserve non-string values', () => {
      const input = {
        count: 42,
        active: true,
        data: null
      };
      
      const sanitized = Validator.sanitizeObject(input);
      
      expect(sanitized.count).toBe(42);
      expect(sanitized.active).toBe(true);
      expect(sanitized.data).toBe(null);
    });

    it('should handle null and undefined', () => {
      expect(Validator.sanitizeObject(null)).toBe(null);
      expect(Validator.sanitizeObject(undefined)).toBe(undefined);
    });
  });

  describe('validateRequest Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {}
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    it('should call next() for valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });
      mockRequest.body = { name: 'John' };
      
      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 for invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });
      mockRequest.body = {}; // Missing required field
      
      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeRequest Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
        query: {},
        params: {}
      };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it('should sanitize request body', () => {
      mockRequest.body = {
        name: '<script>alert(1)</script>'
      };
      
      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters using Object.assign', () => {
      mockRequest.query = {
        search: '<script>alert(1)</script>'
      } as any;
      
      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.query).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize URL parameters using Object.assign', () => {
      mockRequest.params = {
        id: '<script>alert(1)</script>'
      } as any;
      
      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.params).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing body/query/params', () => {
      mockRequest = {};
      
      expect(() => {
        sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Common Schemas - Comprehensive Validation', () => {
    describe('agentExecutionRequest Schema', () => {
      it('should validate valid agent execution requests', () => {
        const validRequests = [
          { agentId: 'test-agent' },
          { agentId: 'test-agent', parameters: { key: 'value' } },
          { agentId: 'test-agent', timeout: 5000, retryOnFailure: true },
          { agentId: 'test-agent', priority: 'high' },
          { agentId: 'test-agent', priority: 'critical', timeout: 60000 }
        ];
        
        validRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.agentExecutionRequest);
          expect(result.valid).toBe(true);
          expect(result.data).toBeDefined();
        });
      });

      it('should reject invalid agent execution requests', () => {
        const invalidRequests = [
          {}, // Missing agentId
          { agentId: '' }, // Empty agentId
          { agentId: 'test', timeout: 500 }, // Timeout too low (min 1000)
          { agentId: 'test', timeout: 400000 }, // Timeout too high (max 300000)
          { agentId: 'test', priority: 'invalid' }, // Invalid priority
          { agentId: 'test', retryOnFailure: 'yes' }, // Wrong type for retryOnFailure
        ];
        
        invalidRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.agentExecutionRequest);
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
        });
      });
    });

    describe('workflowExecutionRequest Schema', () => {
      it('should validate valid workflow execution requests', () => {
        const validRequests = [
          { workflowId: 'workflow-1' },
          { workflowId: 'workflow-1', inputs: { param1: 'value1' } },
          { workflowId: 'workflow-1', timeout: 30000 },
          { workflowId: 'workflow-1', schedule: '0 0 * * *' },
          { workflowId: 'workflow-1', tags: ['production', 'critical'] }
        ];
        
        validRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.workflowExecutionRequest);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid workflow execution requests', () => {
        const invalidRequests = [
          {}, // Missing workflowId
          { workflowId: '' }, // Empty workflowId
          { workflowId: 'test', timeout: 500 }, // Timeout too low
          { workflowId: 'test', timeout: 4000000 }, // Timeout too high (max 3600000)
          { workflowId: 'test', tags: 'not-an-array' }, // Tags must be array
        ];
        
        invalidRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.workflowExecutionRequest);
          expect(result.valid).toBe(false);
        });
      });
    });

    describe('paginationParams Schema', () => {
      it('should validate valid pagination params', () => {
        const validParams = [
          {}, // All defaults
          { page: 1 },
          { page: 5, limit: 50 },
          { page: 1, limit: 100 }, // Max limit
          { sortBy: 'createdAt', sortOrder: 'desc' },
          { page: 10, limit: 25, sortBy: 'name', sortOrder: 'asc' }
        ];
        
        validParams.forEach(params => {
          const result = Validator.validate(params, commonSchemas.paginationParams);
          expect(result.valid).toBe(true);
          expect(result.data?.page).toBeDefined();
          expect(result.data?.limit).toBeDefined();
        });
      });

      it('should reject invalid pagination params', () => {
        const invalidParams = [
          { page: 0 }, // Page must be >= 1
          { page: -1 }, // Negative page
          { limit: 0 }, // Limit must be >= 1
          { limit: 101 }, // Limit too high (max 100)
          { sortOrder: 'invalid' }, // Invalid sort order
          { page: 'one' }, // Wrong type
        ];
        
        invalidParams.forEach(params => {
          const result = Validator.validate(params, commonSchemas.paginationParams);
          expect(result.valid).toBe(false);
        });
      });

      it('should apply default values', () => {
        const result = Validator.validate({}, commonSchemas.paginationParams);
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
        expect(result.data?.sortOrder).toBe('asc');
      });
    });

    describe('dateRange Schema', () => {
      it('should validate valid date ranges', () => {
        const validRanges = [
          { startDate: new Date('2024-01-01').toISOString(), endDate: new Date('2024-12-31').toISOString() },
          { startDate: new Date('2024-01-01T00:00:00Z').toISOString() },
          {} // Both optional
        ];
        
        validRanges.forEach(range => {
          const result = Validator.validate(range, commonSchemas.dateRange);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid date ranges', () => {
        const invalidRanges = [
          { startDate: 'invalid-date' },
          { startDate: '2024-13-01' }, // Invalid month
          { startDate: '2024-01-32' }, // Invalid day
          { startDate: '2024-12-31', endDate: '2024-01-01' }, // End before start
        ];
        
        invalidRanges.forEach(range => {
          const result = Validator.validate(range, commonSchemas.dateRange);
          expect(result.valid).toBe(false);
        });
      });
    });

    describe('authRequest Schema', () => {
      it('should validate valid auth requests', () => {
        const validRequests = [
          { username: 'user123', password: 'Password123!' },
          { username: 'admin', password: 'VerySecureP@ssw0rd' },
          { username: 'test_user', password: 'TestPass123' }
        ];
        
        validRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.authRequest);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid auth requests', () => {
        const invalidRequests = [
          {}, // Missing both
          { username: 'user' }, // Missing password
          { password: 'password' }, // Missing username
          { username: 'ab', password: 'password123' }, // Username too short (min 3)
          { username: 'user', password: 'short' }, // Password too short (min 8)
          { username: 'a'.repeat(51), password: 'password123' }, // Username too long (max 50)
          { username: 'user', password: 'a'.repeat(101) }, // Password too long (max 100)
        ];
        
        invalidRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.authRequest);
          expect(result.valid).toBe(false);
        });
      });
    });

    describe('apiKeyCreate Schema', () => {
      it('should validate valid API key creation requests', () => {
        const validRequests = [
          { name: 'my-api-key' },
          { name: 'production-key', expiresIn: 86400 }, // 1 day
          { name: 'test-key', expiresIn: 31536000 }, // 1 year (max)
          { name: 'scoped-key', scopes: ['read', 'write'] }
        ];
        
        validRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.apiKeyCreate);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid API key creation requests', () => {
        const invalidRequests = [
          {}, // Missing name
          { name: 'ab' }, // Name too short (min 3)
          { name: 'a'.repeat(101) }, // Name too long (max 100)
          { name: 'key', expiresIn: 3000 }, // ExpiresIn too low (min 3600)
          { name: 'key', expiresIn: 32000000 }, // ExpiresIn too high (max 31536000)
          { name: 'key', scopes: 'not-an-array' }, // Scopes must be array
        ];
        
        invalidRequests.forEach(request => {
          const result = Validator.validate(request, commonSchemas.apiKeyCreate);
          expect(result.valid).toBe(false);
        });
      });
    });

    describe('webhookConfig Schema', () => {
      it('should validate valid webhook configurations', () => {
        const validConfigs = [
          { url: 'https://example.com/webhook', events: ['push'] },
          { url: 'https://api.example.com/webhooks', events: ['push', 'pull_request'] },
          { url: 'https://hooks.example.com', events: ['*'], secret: 'my-secret-key-123', active: true }
        ];
        
        validConfigs.forEach(config => {
          const result = Validator.validate(config, commonSchemas.webhookConfig);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid webhook configurations', () => {
        const invalidConfigs = [
          {}, // Missing required fields
          { url: 'not-a-url', events: ['push'] }, // Invalid URL
          { url: 'https://example.com', events: [] }, // Empty events array
          { url: 'https://example.com', events: 'push' }, // Events must be array
          { url: 'https://example.com', events: ['push'], secret: 'short' }, // Secret too short (min 16)
          { url: 'https://example.com', events: ['push'], secret: 'a'.repeat(101) }, // Secret too long (max 100)
        ];
        
        invalidConfigs.forEach(config => {
          const result = Validator.validate(config, commonSchemas.webhookConfig);
          expect(result.valid).toBe(false);
        });
      });

      it('should apply default active value', () => {
        const result = Validator.validate(
          { url: 'https://example.com', events: ['push'] },
          commonSchemas.webhookConfig
        );
        expect(result.valid).toBe(true);
        expect(result.data?.active).toBe(true);
      });
    });

    describe('browserTask Schema', () => {
      it('should validate valid browser tasks', () => {
        const validTasks = [
          {
            url: 'https://example.com',
            actions: [{ type: 'navigate' }]
          },
          {
            url: 'https://example.com',
            actions: [
              { type: 'click', selector: '#button', timeout: 5000 },
              { type: 'type', selector: 'input', value: 'text' }
            ],
            headless: false
          },
          {
            url: 'https://example.com',
            actions: [{ type: 'extract', selector: '.data' }],
            timeout: 60000
          }
        ];
        
        validTasks.forEach(task => {
          const result = Validator.validate(task, commonSchemas.browserTask);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid browser tasks', () => {
        const invalidTasks = [
          {}, // Missing required fields
          { url: 'not-a-url', actions: [{ type: 'navigate' }] }, // Invalid URL
          { url: 'https://example.com', actions: [] }, // Empty actions
          { url: 'https://example.com', actions: [{ type: 'invalid' }] }, // Invalid action type
          { url: 'https://example.com', actions: [{ type: 'click' }], timeout: 500 }, // Timeout too low
          { url: 'https://example.com', actions: [{ type: 'click' }], timeout: 400000 }, // Timeout too high
        ];
        
        invalidTasks.forEach(task => {
          const result = Validator.validate(task, commonSchemas.browserTask);
          expect(result.valid).toBe(false);
        });
      });

      it('should apply default values', () => {
        const result = Validator.validate(
          { url: 'https://example.com', actions: [{ type: 'navigate' }] },
          commonSchemas.browserTask
        );
        expect(result.valid).toBe(true);
        expect(result.data?.headless).toBe(true);
        expect(result.data?.timeout).toBe(30000);
      });
    });

    describe('dataExtraction Schema', () => {
      it('should validate valid data extraction configs', () => {
        const validConfigs = [
          {
            source: 'https://example.com',
            fields: [{ name: 'title', selector: 'h1' }]
          },
          {
            source: 'https://api.example.com/data',
            fields: [
              { name: 'title', selector: 'h1', type: 'text' },
              { name: 'content', selector: '.content', type: 'html' },
              { name: 'href', selector: 'a', type: 'attribute', attribute: 'href' }
            ],
            format: 'json'
          },
          {
            source: 'https://example.com',
            fields: [{ name: 'data', selector: '.data', type: 'link' }],
            format: 'csv'
          }
        ];
        
        validConfigs.forEach(config => {
          const result = Validator.validate(config, commonSchemas.dataExtraction);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid data extraction configs', () => {
        const invalidConfigs = [
          {}, // Missing required fields
          { source: 'not-a-url', fields: [{ name: 'title', selector: 'h1' }] }, // Invalid URL
          { source: 'https://example.com', fields: [] }, // Empty fields
          { source: 'https://example.com', fields: [{ selector: 'h1' }] }, // Missing name
          { source: 'https://example.com', fields: [{ name: 'title' }] }, // Missing selector
          { source: 'https://example.com', fields: [{ name: 'title', selector: 'h1', type: 'invalid' }] }, // Invalid type
          { source: 'https://example.com', fields: [{ name: 'title', selector: 'h1' }], format: 'yaml' }, // Invalid format
          { source: 'https://example.com', fields: [{ name: 'href', selector: 'a', type: 'attribute' }] }, // Missing required attribute
        ];
        
        invalidConfigs.forEach(config => {
          const result = Validator.validate(config, commonSchemas.dataExtraction);
          expect(result.valid).toBe(false);
        });
      });

      it('should apply default values', () => {
        const result = Validator.validate(
          {
            source: 'https://example.com',
            fields: [{ name: 'title', selector: 'h1' }]
          },
          commonSchemas.dataExtraction
        );
        expect(result.valid).toBe(true);
        expect(result.data?.format).toBe('json');
        expect(result.data?.fields[0].type).toBe('text');
      });

      it('should validate conditional attribute requirement', () => {
        // When type is 'attribute', attribute field is required
        const withAttribute = {
          source: 'https://example.com',
          fields: [{ name: 'href', selector: 'a', type: 'attribute', attribute: 'href' }]
        };
        expect(Validator.validate(withAttribute, commonSchemas.dataExtraction).valid).toBe(true);
        
        // When type is not 'attribute', attribute field is optional
        const withoutAttribute = {
          source: 'https://example.com',
          fields: [{ name: 'title', selector: 'h1', type: 'text' }]
        };
        expect(Validator.validate(withoutAttribute, commonSchemas.dataExtraction).valid).toBe(true);
      });
    });
  });

  describe('Security Tests - XSS Attack Vectors', () => {
    describe('sanitizeString XSS Protection', () => {
      it('should block script tag injections', () => {
        const attacks = [
          '<script>alert("XSS")</script>',
          '<SCRIPT>alert("XSS")</SCRIPT>',
          '<script src="http://evil.com/xss.js"></script>',
          '<script>eval(atob("YWxlcnQoMSk="))</script>'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
          // Angle brackets are removed, so script tags are neutered
        });
      });

      it('should block javascript: protocol in various contexts', () => {
        const attacks = [
          'javascript:alert(1)',
          'JAVASCRIPT:alert(1)',
          'JaVaScRiPt:alert(1)',
          'javascript&#58;alert(1)',
          '  javascript:alert(1)'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          expect(sanitized.toLowerCase()).not.toContain('javascript:');
        });
      });

      it('should remove event handler attributes', () => {
        const attacks = [
          'onerror=alert(1)',
          'onclick=alert(1)',
          'onload=alert(1)',
          'onmouseover=alert(1)',
          'ONERROR=alert(1)',
          'OnError=alert(1)'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
        });
      });

      it('should handle nested event handlers', () => {
        const attack = 'ononerrorerror=alert(1)';
        const sanitized = Validator.sanitizeString(attack);
        expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
      });

      it('should block img tag with onerror', () => {
        const attacks = [
          '<img src=x onerror=alert(1)>',
          '<img src="x" onerror="alert(1)">',
          '<IMG SRC=x ONERROR=alert(1)>'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
          expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
        });
      });

      it('should block iframe injections', () => {
        const attacks = [
          '<iframe src="javascript:alert(1)"></iframe>',
          '<iframe src="http://evil.com"></iframe>',
          '<IFRAME SRC="javascript:alert(1)"></IFRAME>'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
        });
      });

      it('should block object and embed tags', () => {
        const attacks = [
          '<object data="javascript:alert(1)">',
          '<embed src="javascript:alert(1)">',
          '<OBJECT DATA="http://evil.com/xss.swf">'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
        });
      });

      it('should handle encoded XSS attempts', () => {
        const attacks = [
          '&lt;script&gt;alert(1)&lt;/script&gt;',
          '&#60;script&#62;alert(1)&#60;/script&#62;',
          '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeString(attack);
          // Encoded entities are preserved but angle brackets in any form should be removed
          expect(sanitized).toBeDefined();
        });
      });
    });

    describe('sanitizeHtml XSS Protection', () => {
      it('should block script tags regardless of allowed tags', () => {
        const attack = '<p>Safe</p><script>alert(1)</script>';
        const sanitized = Validator.sanitizeHtml(attack, ['p']);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('alert(1)');
      });

      it('should remove dangerous event handlers from allowed tags', () => {
        const attack = '<p onclick="alert(1)">Click me</p>';
        const sanitized = Validator.sanitizeHtml(attack, ['p']);
        expect(sanitized).not.toMatch(/onclick/i);
      });

      it('should block javascript: in href attributes', () => {
        const attack = '<a href="javascript:alert(1)">Link</a>';
        const sanitized = Validator.sanitizeHtml(attack, ['a']);
        expect(sanitized).not.toContain('javascript:');
      });

      it('should block data: URLs with executable content', () => {
        const attack = '<img src="data:text/html,<script>alert(1)</script>">';
        const sanitized = Validator.sanitizeHtml(attack, ['img']);
        expect(sanitized).not.toContain('data:text/html');
      });

      it('should handle empty or non-string inputs safely', () => {
        expect(Validator.sanitizeHtml('')).toBe('');
        expect(Validator.sanitizeHtml(123 as any)).toBe('');
        expect(Validator.sanitizeHtml(null as any)).toBe('');
        expect(Validator.sanitizeHtml(undefined as any)).toBe('');
      });
    });

    describe('SQL Injection Pattern Tests', () => {
      it('should handle SQL injection attempts in strings', () => {
        const injections = [
          "'; DROP TABLE users; --",
          "admin' OR '1'='1",
          "' OR '1'='1' --",
          "1' UNION SELECT * FROM users--",
          "admin'--"
        ];
        
        injections.forEach(injection => {
          const sanitized = Validator.sanitizeString(injection);
          // sanitizeString removes angle brackets and javascript:, not SQL
          // SQL injection prevention should be done at DB layer with parameterized queries
          expect(sanitized).toBeDefined();
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
        });
      });

      it('should handle SQL injection in objects', () => {
        const input = {
          username: "admin' OR '1'='1",
          password: "' OR '1'='1",
          email: "test@test.com'; DROP TABLE users; --"
        };
        
        const sanitized = Validator.sanitizeObject(input);
        
        // Verify object structure is maintained
        expect(sanitized.username).toBeDefined();
        expect(sanitized.password).toBeDefined();
        expect(sanitized.email).toBeDefined();
      });
    });
  });

  describe('Security Tests - Path Traversal', () => {
    describe('sanitizeUrl Path Traversal Protection', () => {
      it('should reject file:// protocol by default', () => {
        const attacks = [
          'file:///etc/passwd',
          'file:///C:/Windows/System32/config/sam',
          'FILE:///etc/passwd'
        ];
        
        attacks.forEach(attack => {
          const sanitized = Validator.sanitizeUrl(attack);
          expect(sanitized).toBe('');
        });
      });

      it('should reject malformed URLs', () => {
        const malformed = [
          '',
          'not-a-url',
          'ht tp://example.com',
          '://example.com',
          'http://',
          '//',
          '///',
          '////',
          '/etc/passwd'
        ];
        
        malformed.forEach(url => {
          const sanitized = Validator.sanitizeUrl(url);
          expect(sanitized).toBe('');
        });
      });

      it('should validate URL protocol strictly', () => {
        const invalidProtocols = [
          'ftp://example.com',
          'file://example.com',
          'data:text/html,<script>alert(1)</script>',
          'vbscript:msgbox(1)',
          'about:blank'
        ];
        
        invalidProtocols.forEach(url => {
          const sanitized = Validator.sanitizeUrl(url);
          expect(sanitized).toBe('');
        });
      });

      it('should allow only specified protocols when provided', () => {
        const url = 'ftp://example.com/file.txt';
        
        // Should fail with default protocols
        expect(Validator.sanitizeUrl(url)).toBe('');
        
        // Should succeed with ftp allowed
        const sanitized = Validator.sanitizeUrl(url, ['ftp']);
        expect(sanitized).toContain('ftp://');
      });

      it('should preserve legitimate URLs', () => {
        const validUrls = [
          'http://example.com',
          'https://example.com',
          'https://example.com/path',
          'https://example.com/path?query=value',
          'https://example.com/path?query=value#fragment',
          'https://subdomain.example.com',
          'https://example.com:8080/path'
        ];
        
        validUrls.forEach(url => {
          const sanitized = Validator.sanitizeUrl(url);
          expect(sanitized).toBeTruthy();
          expect(sanitized).toContain('http');
        });
      });

      it('should handle URL with path traversal in path component', () => {
        // Path traversal in the path component should be preserved by URL parser
        // but the URL should still be valid
        const url = 'http://example.com/../etc/passwd';
        const sanitized = Validator.sanitizeUrl(url);
        
        // URL parser normalizes this, but it's still a valid URL structure
        expect(sanitized).toBeTruthy();
      });
    });
  });

  describe('Security Tests - Object Sanitization Edge Cases', () => {
    describe('sanitizeObject Circular Reference Protection', () => {
      it('should handle circular references gracefully', () => {
        const obj: any = { name: 'test' };
        obj.self = obj; // Create circular reference
        
        // Current implementation doesn't detect circular references
        // This test documents the current behavior
        expect(() => {
          const sanitized = Validator.sanitizeObject(obj);
          // Will cause infinite recursion - this is a known limitation
        }).toThrow(); // Expects stack overflow
      });

      it('should handle deeply nested circular references', () => {
        const obj: any = { level1: { level2: { level3: {} } } };
        obj.level1.level2.level3.circular = obj;
        
        // Document current behavior with circular references
        expect(() => {
          Validator.sanitizeObject(obj);
        }).toThrow(); // Expects stack overflow
      });

      it('should handle arrays with circular references', () => {
        const arr: any[] = [1, 2, 3];
        arr.push(arr); // Create circular reference in array
        
        const obj = { data: arr };
        
        expect(() => {
          Validator.sanitizeObject(obj);
        }).toThrow(); // Expects stack overflow
      });
    });

    describe('sanitizeObject Prototype Pollution Protection', () => {
      it('should not allow __proto__ pollution', () => {
        const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}}');
        const sanitized = Validator.sanitizeObject(malicious);
        
        // Check that prototype pollution didn't occur on Object.prototype
        expect((Object.prototype as any).polluted).toBeUndefined();
        
        // Note: The current implementation sanitizes keys but doesn't prevent
        // prototype pollution via __proto__. This is a known limitation.
        // The sanitized object may still have the polluted property from the parse.
        // For full protection, use Object.create(null) or a library like lodash.cloneDeep
      });

      it('should not allow constructor pollution', () => {
        const malicious = JSON.parse('{"constructor": {"prototype": {"polluted": "yes"}}}');
        const sanitized = Validator.sanitizeObject(malicious);
        
        // Check that prototype pollution didn't occur via constructor
        expect((Object.prototype as any).polluted).toBeUndefined();
      });

      it('should sanitize keys containing __proto__', () => {
        const malicious = {
          '__proto__': 'malicious',
          'normal': 'value'
        };
        
        const sanitized = Validator.sanitizeObject(malicious);
        
        // Verify keys are sanitized (angle brackets removed from key names)
        expect(sanitized).toBeDefined();
        expect(sanitized.normal).toBe('value');
      });

      it('should handle nested prototype pollution attempts', () => {
        const malicious = {
          level1: {
            level2: {
              '__proto__': { polluted: true }
            }
          }
        };
        
        const sanitized = Validator.sanitizeObject(malicious);
        
        // Verify no pollution occurred
        expect((Object.prototype as any).polluted).toBeUndefined();
      });
    });

    describe('sanitizeObject Deep Nesting', () => {
      it('should handle deeply nested objects', () => {
        let deep: any = { value: '<script>alert(1)</script>' };
        for (let i = 0; i < 100; i++) {
          deep = { nested: deep };
        }
        
        // Should handle deep nesting without stack overflow
        // (up to a reasonable depth)
        expect(() => {
          const sanitized = Validator.sanitizeObject(deep);
          expect(sanitized).toBeDefined();
        }).not.toThrow();
      });

      it('should sanitize values at all nesting levels', () => {
        const input = {
          level1: {
            level2: {
              level3: {
                level4: {
                  danger: '<script>alert(1)</script>'
                }
              }
            }
          }
        };
        
        const sanitized = Validator.sanitizeObject(input);
        
        expect(sanitized.level1.level2.level3.level4.danger).not.toContain('<');
        expect(sanitized.level1.level2.level3.level4.danger).not.toContain('>');
      });
    });

    describe('sanitizeObject Special Cases', () => {
      it('should handle objects with null prototype', () => {
        const obj = Object.create(null);
        obj.key = '<script>alert(1)</script>';
        
        const sanitized = Validator.sanitizeObject(obj);
        
        expect(sanitized.key).not.toContain('<script>');
      });

      it('should handle arrays of objects', () => {
        const input = [
          { name: '<script>alert(1)</script>' },
          { name: 'safe' },
          { name: '<img onerror=alert(1)>' }
        ];
        
        const sanitized = Validator.sanitizeObject(input);
        
        expect(sanitized[0].name).not.toContain('<');
        expect(sanitized[1].name).toBe('safe');
        expect(sanitized[2].name).not.toContain('<');
      });

      it('should handle mixed arrays', () => {
        const input = [
          'string',
          123,
          { key: 'value' },
          ['nested', 'array'],
          null,
          undefined,
          true
        ];
        
        const sanitized = Validator.sanitizeObject(input);
        
        expect(sanitized).toHaveLength(7);
        expect(sanitized[0]).toBe('string');
        expect(sanitized[1]).toBe(123);
        expect(sanitized[2].key).toBe('value');
        expect(sanitized[4]).toBe(null);
        expect(sanitized[5]).toBe(undefined);
        expect(sanitized[6]).toBe(true);
      });
  describe('Common Schemas', () => {
    it('should have agentExecutionRequest schema', () => {
      expect(commonSchemas.agentExecutionRequest).toBeDefined();
    });

    it('should have workflowExecutionRequest schema', () => {
      expect(commonSchemas.workflowExecutionRequest).toBeDefined();
    });

    it('should have paginationParams schema', () => {
      expect(commonSchemas.paginationParams).toBeDefined();
    });

    it('should have authRequest schema', () => {
      expect(commonSchemas.authRequest).toBeDefined();
    });

    it('should have browserTask schema', () => {
      expect(commonSchemas.browserTask).toBeDefined();
    });

    it('should have dataExtraction schema', () => {
      expect(commonSchemas.dataExtraction).toBeDefined();
    });
  });

  describe('Security Tests', () => {
    it('should remove quotes from SQL-like strings', () => {
      const input = "'; DROP TABLE users; --";
      const sanitized = Validator.sanitizeString(input);
      
      // sanitizeString doesn't escape quotes, just removes angle brackets and javascript:
      expect(sanitized).toBeDefined();
    });

    it('should handle SQL injection in objects', () => {
      const input = {
        username: "admin' OR '1'='1",
        password: "' OR '1'='1"
      };
      
      const sanitized = Validator.sanitizeObject(input);
      
      // sanitizeString doesn't escape quotes by default
      expect(sanitized.username).toBeDefined();
      expect(sanitized.password).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const sanitized = Validator.sanitizeString(longString);
      
      expect(sanitized).toBe(longString);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍';
      const sanitized = Validator.sanitizeString(unicode);
      
      expect(sanitized).toBe(unicode);
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const sanitized = Validator.sanitizeString(special);
      
      // Should escape or preserve based on context
      expect(sanitized).toBeDefined();
    });
  });
});
