/**
 * JSON Agent for workflow automation
 * Handles JSON parsing, validation, querying, and transformation
 * Phase 1: Data Agents
 */

import { logger } from "../../../utils/logger";

export interface JsonParseOptions {
  strict?: boolean;
  reviver?: (key: string, value: unknown) => unknown;
}

export interface JsonQueryOptions {
  path: string; // JSONPath-like syntax (simplified)
}

export interface JsonValidateOptions {
  schema: any; // Joi schema object
}

export interface JsonTransformOptions {
  map?: Record<string, string | ((value: any) => any)>;
  filter?: (obj: any) => boolean;
  sort?: { key: string; order: "asc" | "desc" };
}

/**
 * JSON Agent Implementation
 * Provides comprehensive JSON data handling capabilities
 */
export class JsonAgent {
  /**
   * Parse JSON string with validation
   */
  async parseJson(params: {
    input: string;
    options?: JsonParseOptions;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const options: JsonParseOptions = {
        strict: true,
        ...params.options,
      };

      const data = JSON.parse(params.input, options.reviver);

      logger.info("JSON parsed successfully");

      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("JSON parse error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Query JSON data using simplified JSONPath syntax
   * Supports: $.key, $.array[0], $.nested.key, $.array[*].key
   */
  async queryJson(params: { data: any; query: string }): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      const result = this.executeQuery(params.data, params.query);

      logger.info(`JSON query executed: ${params.query}`);

      return {
        success: true,
        result,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("JSON query error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Validate JSON against schema
   */
  async validateJson(params: {
    data: any;
    schema: any; // Joi schema or plain object schema
  }): Promise<{
    success: boolean;
    valid?: boolean;
    errors?: string[];
    error?: string;
  }> {
    try {
      // If schema is a Joi schema or has validate method, use it
      if (params.schema && typeof params.schema.validate === "function") {
        const { error } = params.schema.validate(params.data, {
          abortEarly: false,
        });

        if (error) {
          return {
            success: true,
            valid: false,
            errors: error.details.map((d: any) => d.message),
          };
        }

        logger.info("JSON validation passed (schema validator)");
        return {
          success: true,
          valid: true,
        };
      }

      // Simple type checking for plain object schemas
      const errors = this.validateAgainstSchema(params.data, params.schema);

      logger.info(
        `JSON validation: ${errors.length > 0 ? "failed" : "passed"}`,
      );

      return {
        success: true,
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("JSON validation error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Transform JSON data
   */
  async transformJson(params: {
    data: any;
    transforms: JsonTransformOptions;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      let result = params.data;

      // Apply mapping
      if (params.transforms.map) {
        result = this.applyMapping(result, params.transforms.map);
      }

      // Apply filtering (if data is array)
      if (params.transforms.filter && Array.isArray(result)) {
        result = result.filter(params.transforms.filter);
      }

      // Apply sorting (if data is array)
      if (params.transforms.sort && Array.isArray(result)) {
        result = this.applySorting(result, params.transforms.sort);
      }

      logger.info("JSON transformed successfully");

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("JSON transform error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Stringify JSON with formatting
   */
  async stringifyJson(params: {
    data: any;
    pretty?: boolean;
    indent?: number;
  }): Promise<{
    success: boolean;
    json?: string;
    error?: string;
  }> {
    try {
      const indent = params.pretty ? params.indent || 2 : undefined;
      const json = JSON.stringify(params.data, null, indent);

      return {
        success: true,
        json,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("JSON stringify error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Merge multiple JSON objects
   */
  async mergeJson(params: { objects: any[]; deep?: boolean }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      if (!Array.isArray(params.objects) || params.objects.length === 0) {
        throw new Error("Objects must be a non-empty array");
      }

      const merged = params.deep
        ? this.deepMerge(...params.objects)
        : Object.assign({}, ...params.objects);

      logger.info(`JSON merged: ${params.objects.length} objects`);

      return {
        success: true,
        data: merged,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("JSON merge error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Execute simplified JSONPath query
   */
  private executeQuery(data: any, query: string): any {
    // Remove leading $. if present
    const path = query.replace(/^\$\.?/, "");

    if (!path) {
      return data;
    }

    const parts = path.split(".");
    let current = data;

    for (const part of parts) {
      // Handle array notation: array[0] or array[*]
      const arrayMatch = part.match(/^(\w+)\[(\*|\d+)\]$/);

      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key];

        if (!Array.isArray(current)) {
          throw new Error(`${key} is not an array`);
        }

        if (index === "*") {
          // Return all items
          return current;
        } else {
          current = current[parseInt(index, 10)];
        }
      } else {
        current = current[part];
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Validate data against a simple schema
   */
  private validateAgainstSchema(data: any, schema: any, path = ""): string[] {
    const errors: string[] = [];

    if (typeof schema !== "object" || schema === null) {
      return errors;
    }

    for (const key in schema) {
      const schemaValue = schema[key];
      const dataValue = data[key];
      const currentPath = path ? `${path}.${key}` : key;

      // Check if required field is missing
      if (dataValue === undefined && schemaValue.required) {
        errors.push(`${currentPath} is required`);
        continue;
      }

      // Check type
      if (dataValue !== undefined && schemaValue.type) {
        const expectedType = schemaValue.type;
        const actualType = Array.isArray(dataValue)
          ? "array"
          : typeof dataValue;

        if (expectedType !== actualType) {
          errors.push(
            `${currentPath} should be ${expectedType}, got ${actualType}`,
          );
        }
      }

      // Recursively validate nested objects
      if (
        typeof schemaValue === "object" &&
        !schemaValue.type &&
        dataValue !== undefined
      ) {
        errors.push(
          ...this.validateAgainstSchema(dataValue, schemaValue, currentPath),
        );
      }
    }

    return errors;
  }

  /**
   * Apply mapping transformations
   */
  private applyMapping(
    data: any,
    mapping: Record<string, string | ((value: any) => any)>,
  ): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.applyMapping(item, mapping));
    }

    if (typeof data !== "object" || data === null) {
      return data;
    }

    const result: any = {};

    for (const [key, transform] of Object.entries(mapping)) {
      if (typeof transform === "function") {
        result[key] = transform(data);
      } else if (typeof transform === "string") {
        // Map one key to another
        result[transform] = data[key];
      }
    }

    // Copy unmapped keys
    for (const key in data) {
      if (!(key in mapping)) {
        result[key] = data[key];
      }
    }

    return result;
  }

  /**
   * Apply sorting to array
   */
  private applySorting(
    data: any[],
    sort: { key: string; order: "asc" | "desc" },
  ): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (aVal < bVal) return sort.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.order === "asc" ? 1 : -1;
      return 0;
    });
  }

  /**
   * Deep merge objects
   */
  private deepMerge(...objects: any[]): any {
    return objects.reduce((acc, obj) => {
      Object.keys(obj).forEach((key) => {
        const accValue = acc[key];
        const objValue = obj[key];

        if (Array.isArray(accValue) && Array.isArray(objValue)) {
          acc[key] = [...accValue, ...objValue];
        } else if (this.isObject(accValue) && this.isObject(objValue)) {
          acc[key] = this.deepMerge(accValue, objValue);
        } else {
          acc[key] = objValue;
        }
      });
      return acc;
    }, {});
  }

  /**
   * Check if value is a plain object
   */
  private isObject(val: any): boolean {
    return val !== null && typeof val === "object" && !Array.isArray(val);
  }
}

// Export singleton instance
export const jsonAgent = new JsonAgent();
