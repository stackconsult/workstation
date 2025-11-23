/**
 * CSV Agent for workflow automation
 * Handles CSV parsing, writing, filtering, and transformation
 * Phase 1: Data Agents
 */

import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { logger } from "../../../utils/logger";

export interface CsvParseOptions {
  delimiter?: string;
  headers?: boolean;
  skipEmptyLines?: boolean;
  columns?: string[] | boolean;
}

export interface CsvWriteOptions {
  delimiter?: string;
  headers?: boolean;
  columns?: string[];
}

export interface CsvFilterOptions {
  column: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith";
  value: string | number;
}

export interface CsvTransformOptions {
  columns?: Record<string, string>; // Map old column names to new
  mapValues?: Record<string, (value: unknown) => unknown>; // Transform functions per column
  addColumns?: Record<string, (row: unknown) => unknown>; // Add computed columns
}

/**
 * CSV Agent Implementation
 * Provides comprehensive CSV data handling capabilities
 */
export class CsvAgent {
  /**
   * Parse CSV string or buffer into structured data
   */
  async parseCsv(params: {
    input: string | Buffer;
    options?: CsvParseOptions;
  }): Promise<{
    success: boolean;
    data?: any[];
    columns?: string[];
    rowCount?: number;
    error?: string;
  }> {
    try {
      const options: CsvParseOptions = {
        delimiter: ",",
        headers: true,
        skipEmptyLines: true,
        ...params.options,
      };

      const records = parse(params.input, {
        delimiter: options.delimiter,
        columns: options.columns ?? options.headers,
        skip_empty_lines: options.skipEmptyLines,
        trim: true,
        cast: true, // Auto-convert numbers and booleans
      });

      const columns =
        options.headers && records.length > 0
          ? Object.keys(records[0])
          : undefined;

      logger.info(`CSV parsed successfully: ${records.length} rows`);

      return {
        success: true,
        data: records,
        columns,
        rowCount: records.length,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("CSV parse error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Write data to CSV format
   */
  async writeCsv(params: { data: any[]; options?: CsvWriteOptions }): Promise<{
    success: boolean;
    csv?: string;
    error?: string;
  }> {
    try {
      if (!Array.isArray(params.data) || params.data.length === 0) {
        throw new Error("Data must be a non-empty array");
      }

      const options: CsvWriteOptions = {
        delimiter: ",",
        headers: true,
        ...params.options,
      };

      const csv = stringify(params.data, {
        delimiter: options.delimiter,
        header: options.headers,
        columns: options.columns,
      });

      logger.info(`CSV generated: ${params.data.length} rows`);

      return {
        success: true,
        csv,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("CSV write error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Filter CSV data by conditions
   */
  async filterCsv(params: {
    data: any[];
    filters: CsvFilterOptions[];
  }): Promise<{
    success: boolean;
    data?: any[];
    filteredCount?: number;
    error?: string;
  }> {
    try {
      if (!Array.isArray(params.data)) {
        throw new Error("Data must be an array");
      }

      // Apply all filters in a single pass for better performance
      const filtered = params.data.filter((row) =>
        params.filters.every((filter) => {
          const value = row[filter.column];

          switch (filter.operator) {
            case "eq":
              return value == filter.value;
            case "ne":
              return value != filter.value;
            case "gt":
              return Number(value) > Number(filter.value);
            case "lt":
              return Number(value) < Number(filter.value);
            case "gte":
              return Number(value) >= Number(filter.value);
            case "lte":
              return Number(value) <= Number(filter.value);
            case "contains":
              return String(value).includes(String(filter.value));
            case "startsWith":
              return String(value).startsWith(String(filter.value));
            case "endsWith":
              return String(value).endsWith(String(filter.value));
            default:
              return true;
          }
        }),
      );

      logger.info(
        `CSV filtered: ${params.data.length} → ${filtered.length} rows`,
      );

      return {
        success: true,
        data: filtered,
        filteredCount: filtered.length,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("CSV filter error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Transform CSV data (rename columns, map values, add computed columns)
   */
  async transformCsv(params: {
    data: any[];
    transforms: CsvTransformOptions;
  }): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      if (!Array.isArray(params.data)) {
        throw new Error("Data must be an array");
      }

      const transformed = params.data.map((row) => {
        const newRow: any = {};

        // Rename columns
        if (params.transforms.columns) {
          for (const [oldName, newName] of Object.entries(
            params.transforms.columns,
          )) {
            if (oldName in row) {
              newRow[newName] = row[oldName];
            }
          }
          // Copy columns not in rename map
          for (const key of Object.keys(row)) {
            if (!(key in params.transforms.columns)) {
              newRow[key] = row[key];
            }
          }
        } else {
          Object.assign(newRow, row);
        }

        // Transform values
        if (params.transforms.mapValues) {
          for (const [column, transformer] of Object.entries(
            params.transforms.mapValues,
          )) {
            if (column in newRow && typeof transformer === "function") {
              newRow[column] = transformer(newRow[column]);
            }
          }
        }

        // Add computed columns
        if (params.transforms.addColumns) {
          for (const [column, computer] of Object.entries(
            params.transforms.addColumns,
          )) {
            if (typeof computer === "function") {
              newRow[column] = computer(newRow);
            }
          }
        }

        return newRow;
      });

      logger.info(`CSV transformed: ${params.data.length} rows`);

      return {
        success: true,
        data: transformed,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("CSV transform error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Get CSV statistics
   */
  async getStats(params: { data: any[]; columns?: string[] }): Promise<{
    success: boolean;
    stats?: Record<string, any>;
    error?: string;
  }> {
    try {
      if (!Array.isArray(params.data) || params.data.length === 0) {
        throw new Error("Data must be a non-empty array");
      }

      const columns = params.columns || Object.keys(params.data[0]);
      const stats: Record<string, any> = {};

      for (const column of columns) {
        const values = params.data
          .map((row) => row[column])
          .filter((v) => v !== null && v !== undefined);

        // Determine if numeric
        const numericValues = values.map(Number).filter((n) => !isNaN(n));
        const isNumeric = numericValues.length === values.length;

        if (isNumeric && numericValues.length > 0) {
          stats[column] = {
            type: "numeric",
            count: numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            avg:
              numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            sum: numericValues.reduce((a, b) => a + b, 0),
          };
        } else {
          // String statistics
          const unique = new Set(values);
          stats[column] = {
            type: "string",
            count: values.length,
            unique: unique.size,
            mostCommon: this.getMostCommon(values),
          };
        }
      }

      return {
        success: true,
        stats,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("CSV stats error:", { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Helper: Get most common value
   */
  private getMostCommon(values: any[]): any {
    const counts: Record<string, number> = {};
    let maxCount = 0;
    let mostCommon: any = null;

    for (const value of values) {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        mostCommon = value;
      }
    }

    return mostCommon;
  }
}

// Export singleton instance
export const csvAgent = new CsvAgent();
