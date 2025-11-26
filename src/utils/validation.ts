/**
 * Input Validation Utilities
 * 
 * Provides validation and sanitization for agent inputs and API requests
 * 
 * @module utils/validation
 * @version 1.0.0
 */

import Joi from 'joi';
import { ErrorHandler } from './error-handler';
import { Request, Response, NextFunction } from 'express';
import sanitizeHtmlLib from 'sanitize-html';

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validator class for input validation
 */
export class Validator {
  /**
   * Validate data against Joi schema
   */
  static validate<T>(
    data: unknown,
    schema: Joi.Schema
  ): ValidationResult<T> {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return {
        valid: false,
        errors: error.details.map(d => d.message)
      };
    }

    return {
      valid: true,
      data: value as T
    };
  }

  /**
   * Validate and throw on error
   */
  static validateOrThrow<T>(
    data: unknown,
    schema: Joi.Schema,
    context?: string
  ): T {
    const result = this.validate<T>(data, schema);
    
    if (!result.valid) {
      throw ErrorHandler.validationError(
        `Validation failed${context ? ` for ${context}` : ''}: ${result.errors?.join(', ')}`,
        context
      );
    }

    return result.data!;
  }

  /**
   * Sanitize string input (XSS prevention)
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove angle brackets, javascript: protocol, and repeatedly remove event handlers
    let sanitized = input.replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, ''); // Remove javascript: protocol

    // Remove all event handler attributes with repeated replacement
    let previous;
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/on\w+=/gi, '');
    } while (sanitized !== previous);

    return sanitized.trim();
  }

  /**
   * Sanitize HTML (preserve safe tags)
   */
  static sanitizeHtml(input: string, allowedTags: string[] = []): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Use sanitize-html library for robust sanitization
    // Build config
    const config: sanitizeHtmlLib.IOptions = {
      allowedTags: allowedTags.length > 0 ? allowedTags : [],
      allowedAttributes: {}, // No attributes allowed by default
      // Don't allow script, iframe, or dangerous protocols
      allowVulnerableTags: false,
      allowedSchemes: ['http', 'https', 'mailto'],
    };
    const sanitized = sanitizeHtmlLib(input, config);
    return sanitized.trim();
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(url: string, allowedProtocols: string[] = ['http', 'https']): string {
    try {
      const parsed = new URL(url);
      
      if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
        throw new Error('Invalid protocol');
      }

      return parsed.toString();
    } catch {
      return '';
    }
  }

  /**
   * Validate email address using Joi for RFC 5322 compliance
   */
  static isValidEmail(email: string): boolean {
    const { error } = Joi.string().email().validate(email);
    return !error;
  }

  /**
   * Validate UUID
   */
  static isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate JSON string
   */
  static isValidJson(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize object (deep clean)
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * Agent execution request schema
   */
  agentExecutionRequest: Joi.object({
    agentId: Joi.string().required(),
    parameters: Joi.object().optional(),
    timeout: Joi.number().integer().min(1000).max(300000).optional(), // 1s to 5min
    retryOnFailure: Joi.boolean().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
  }),

  /**
   * Workflow execution request schema
   */
  workflowExecutionRequest: Joi.object({
    workflowId: Joi.string().required(),
    inputs: Joi.object().optional(),
    timeout: Joi.number().integer().min(1000).max(3600000).optional(), // 1s to 1hr
    schedule: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  /**
   * Pagination parameters schema
   */
  paginationParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  /**
   * Date range schema
   */
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }),

  /**
   * Authentication request schema
   */
  authRequest: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(8).max(100).required()
  }),

  /**
   * API key creation schema
   */
  apiKeyCreate: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    expiresIn: Joi.number().integer().min(3600).max(31536000).optional(), // 1hr to 1yr
    scopes: Joi.array().items(Joi.string()).optional()
  }),

  /**
   * Webhook configuration schema
   */
  webhookConfig: Joi.object({
    url: Joi.string().uri().required(),
    events: Joi.array().items(Joi.string()).min(1).required(),
    secret: Joi.string().min(16).max(100).optional(),
    active: Joi.boolean().default(true)
  }),

  /**
   * Browser automation task schema
   */
  browserTask: Joi.object({
    url: Joi.string().uri().required(),
    actions: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('navigate', 'click', 'type', 'wait', 'extract').required(),
        selector: Joi.string().optional(),
        value: Joi.any().optional(),
        timeout: Joi.number().integer().min(100).max(60000).optional()
      })
    ).min(1).required(),
    headless: Joi.boolean().default(true),
    timeout: Joi.number().integer().min(1000).max(300000).default(30000)
  }),

  /**
   * Data extraction configuration schema
   */
  dataExtraction: Joi.object({
    source: Joi.string().uri().required(),
    fields: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        selector: Joi.string().required(),
        type: Joi.string().valid('text', 'html', 'attribute', 'link').default('text'),
        attribute: Joi.string().when('type', {
          is: 'attribute',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
      })
    ).min(1).required(),
    format: Joi.string().valid('json', 'csv', 'xml').default('json')
  })
};

/**
 * Request validation middleware factory
 */
export function validateRequest(schema: Joi.Schema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = Validator.validate(req[property], schema);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: result.errors
        }
      });
    }

    // Replace with validated data
    req[property] = result.data;
    next();
  };
}

/**
 * Sanitize request middleware
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    req.body = Validator.sanitizeObject(req.body);
  }
  
  if (req.query) {
    Object.assign(req.query, Validator.sanitizeObject(req.query));
  }
  
  if (req.params) {
    Object.assign(req.params, Validator.sanitizeObject(req.params));
  }
  
  next();
}
