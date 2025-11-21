/**
 * Excel Agent for workflow automation
 * Handles Excel file reading, writing, multi-sheet operations, and cell formatting
 * Phase 1: Data Agents
 */

import * as XLSX from 'xlsx';
import { logger } from '../../../utils/logger';

export interface ExcelReadOptions {
  sheetName?: string;
  sheetIndex?: number;
  range?: string;
  raw?: boolean;
  defval?: unknown;
}

export interface ExcelWriteOptions {
  sheetName?: string;
  compression?: boolean;
  bookType?: 'xlsx' | 'xlsm' | 'xlsb' | 'xls' | 'csv';
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface FormattedCell {
  cell: string; // e.g., 'A1', 'B2'
  format: CellFormat;
}

/**
 * Excel Agent Implementation
 * Provides comprehensive Excel data handling capabilities using xlsx library
 */
export class ExcelAgent {
  /**
   * Read Excel file with support for multi-sheet workbooks
   */
  async readExcel(params: {
    input: Buffer | string;
    options?: ExcelReadOptions;
  }): Promise<{
    success: boolean;
    data?: unknown[];
    sheets?: string[];
    sheetName?: string;
    error?: string;
  }> {
    try {
      // Read workbook from buffer or file path
      const workbook = typeof params.input === 'string'
        ? XLSX.readFile(params.input)
        : XLSX.read(params.input, { type: 'buffer' });

      const options = params.options || {};
      
      // Determine which sheet to read
      let sheetName: string;
      if (options.sheetName) {
        sheetName = options.sheetName;
      } else if (options.sheetIndex !== undefined) {
        sheetName = workbook.SheetNames[options.sheetIndex];
      } else {
        // Default to first sheet
        sheetName = workbook.SheetNames[0];
      }

      if (!sheetName || !workbook.Sheets[sheetName]) {
        throw new Error(`Sheet not found: ${sheetName || 'index ' + options.sheetIndex}`);
      }

      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON with options
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: options.raw ?? false,
        defval: options.defval,
        range: options.range
      });

      logger.info(`Excel file read successfully: ${data.length} rows from sheet '${sheetName}'`);

      return {
        success: true,
        data,
        sheets: workbook.SheetNames,
        sheetName
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Excel read error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Write data to Excel format
   */
  async writeExcel(params: {
    data: unknown[] | Record<string, unknown[]>;
    options?: ExcelWriteOptions;
  }): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
  }> {
    try {
      const options: ExcelWriteOptions = {
        sheetName: 'Sheet1',
        compression: false,
        bookType: 'xlsx',
        ...params.options
      };

      const workbook = XLSX.utils.book_new();

      // Handle single sheet (array) or multi-sheet (object with sheet names as keys)
      if (Array.isArray(params.data)) {
        if (params.data.length === 0) {
          throw new Error('Data array cannot be empty');
        }

        const worksheet = XLSX.utils.json_to_sheet(params.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName);
      } else {
        // Multi-sheet workbook
        const sheets = Object.keys(params.data);
        if (sheets.length === 0) {
          throw new Error('Data object must contain at least one sheet');
        }

        for (const sheetName of sheets) {
          const sheetData = params.data[sheetName];
          if (!Array.isArray(sheetData) || sheetData.length === 0) {
            logger.warn(`Skipping empty sheet: ${sheetName}`);
            continue;
          }

          const worksheet = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      }

      // Write to buffer
      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: options.bookType,
        compression: options.compression
      });

      logger.info('Excel file generated successfully');

      return {
        success: true,
        buffer: Buffer.from(buffer)
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Excel write error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get specific sheet data by name or index
   */
  async getSheet(params: {
    input: Buffer | string;
    sheetName?: string;
    sheetIndex?: number;
  }): Promise<{
    success: boolean;
    data?: unknown[];
    sheetName?: string;
    error?: string;
  }> {
    try {
      const workbook = typeof params.input === 'string'
        ? XLSX.readFile(params.input)
        : XLSX.read(params.input, { type: 'buffer' });

      let sheetName: string;
      if (params.sheetName) {
        sheetName = params.sheetName;
      } else if (params.sheetIndex !== undefined) {
        sheetName = workbook.SheetNames[params.sheetIndex];
      } else {
        throw new Error('Either sheetName or sheetIndex must be provided');
      }

      if (!sheetName || !workbook.Sheets[sheetName]) {
        throw new Error(`Sheet not found: ${sheetName || 'index ' + params.sheetIndex}`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      logger.info(`Sheet '${sheetName}' extracted: ${data.length} rows`);

      return {
        success: true,
        data,
        sheetName
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Get sheet error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * List all sheets in a workbook
   */
  async listSheets(params: {
    input: Buffer | string;
  }): Promise<{
    success: boolean;
    sheets?: string[];
    count?: number;
    error?: string;
  }> {
    try {
      const workbook = typeof params.input === 'string'
        ? XLSX.readFile(params.input)
        : XLSX.read(params.input, { type: 'buffer' });

      const sheets = workbook.SheetNames;

      logger.info(`Workbook contains ${sheets.length} sheets`);

      return {
        success: true,
        sheets,
        count: sheets.length
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('List sheets error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Apply formatting to cells
   * Note: xlsx library has limited formatting support in free version.
   * This provides basic structure; full formatting requires xlsx-style or similar.
   */
  async formatCells(params: {
    input: Buffer | string;
    sheetName?: string;
    formats: FormattedCell[];
  }): Promise<{
    success: boolean;
    buffer?: Buffer;
    message?: string;
    error?: string;
  }> {
    try {
      const workbook = typeof params.input === 'string'
        ? XLSX.readFile(params.input)
        : XLSX.read(params.input, { type: 'buffer' });

      const sheetName = params.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Sheet not found: ${sheetName}`);
      }

      // Apply formats to cells
      for (const { cell, format } of params.formats) {
        if (!worksheet[cell]) {
          logger.warn(`Cell ${cell} not found in sheet ${sheetName}`);
          continue;
        }

        // Initialize cell style if not exists
        if (!worksheet[cell].s) {
          worksheet[cell].s = {};
        }

        // Apply formatting (basic support)
        // Note: Full formatting support requires additional libraries
        const cellStyle: Record<string, unknown> = {};

        if (format.bold !== undefined) {
          cellStyle.bold = format.bold;
        }
        if (format.italic !== undefined) {
          cellStyle.italic = format.italic;
        }
        if (format.underline !== undefined) {
          cellStyle.underline = format.underline;
        }
        if (format.color) {
          cellStyle.color = format.color;
        }
        if (format.bgColor) {
          cellStyle.bgColor = format.bgColor;
        }
        if (format.fontSize) {
          cellStyle.fontSize = format.fontSize;
        }
        if (format.alignment) {
          cellStyle.alignment = format.alignment;
        }

        // Merge styles (in actual implementation with xlsx-style)
        Object.assign(worksheet[cell].s, cellStyle);
      }

      // Write to buffer
      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx'
      });

      logger.info(`Formatted ${params.formats.length} cells in sheet '${sheetName}'`);

      return {
        success: true,
        buffer: Buffer.from(buffer),
        message: 'Note: Basic formatting applied. For advanced formatting, consider using xlsx-style or similar libraries.'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Format cells error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get Excel file information and statistics
   */
  async getInfo(params: {
    input: Buffer | string;
  }): Promise<{
    success: boolean;
    info?: {
      sheetCount: number;
      sheets: Array<{
        name: string;
        rowCount: number;
        columnCount: number;
      }>;
    };
    error?: string;
  }> {
    try {
      const workbook = typeof params.input === 'string'
        ? XLSX.readFile(params.input)
        : XLSX.read(params.input, { type: 'buffer' });

      const sheets = workbook.SheetNames.map(name => {
        const worksheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(worksheet);
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        return {
          name,
          rowCount: data.length,
          columnCount: range.e.c - range.s.c + 1
        };
      });

      logger.info(`Excel info retrieved: ${sheets.length} sheets`);

      return {
        success: true,
        info: {
          sheetCount: sheets.length,
          sheets
        }
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Get Excel info error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}

// Export singleton instance
export const excelAgent = new ExcelAgent();
